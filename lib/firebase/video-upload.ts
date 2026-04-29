import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from './config'
import { v4 as uuidv4 } from 'uuid'

export interface UploadProgress {
  bytesTransferred: number
  totalBytes: number
  percent: number
}

/**
 * 動画ファイルを Firebase Storage にアップロード
 * 進捗コールバック付き
 */
export function uploadVideo(
  athleteId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; path: string; durationSec: number | null }> {
  return new Promise((resolve, reject) => {
    const id = uuidv4()
    const safeName = file.name.replace(/[^\w.-]/g, '_')
    const path = `motionAnalyses/${athleteId}/${id}_${safeName}`
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type || 'video/mp4' })

    // 30秒経過してもバイトが転送されない場合はタイムアウト
    let lastBytes = 0
    const timeout = setTimeout(() => {
      task.cancel()
      reject(new Error(
        'アップロードがタイムアウトしました。\n' +
        '考えられる原因:\n' +
        '1. Firebase Storage のセキュリティルールがアップロードを拒否している\n' +
        '2. ネットワーク接続が不安定\n' +
        '\nFirebase Console > Storage > Rules を確認してください:\n' +
        'allow read, write: if request.auth != null;'
      ))
    }, 30000)

    task.on(
      'state_changed',
      (snap) => {
        clearTimeout(timeout) // 進捗があればタイムアウトリセットしない（一度クリア）
        lastBytes = snap.bytesTransferred
        if (onProgress) {
          onProgress({
            bytesTransferred: snap.bytesTransferred,
            totalBytes: snap.totalBytes,
            percent: snap.totalBytes > 0
              ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
              : 0,
          })
        }
      },
      (err) => {
        clearTimeout(timeout)
        const code = (err as any).code as string | undefined
        let message = err.message
        if (code === 'storage/unauthorized')
          message = '権限エラー: Firebase Storage のセキュリティルールでアップロードが拒否されています。\nFirebase Console > Storage > Rules を確認してください。'
        else if (code === 'storage/unauthenticated')
          message = '認証エラー: 再ログインしてから再試行してください。'
        else if (code === 'storage/quota-exceeded')
          message = 'ストレージ容量が上限に達しています。'
        else if (code === 'storage/canceled')
          message = 'アップロードがキャンセルされました。'
        else if (code === 'storage/retry-limit-exceeded')
          message = 'ネットワークエラー: 接続を確認して再試行してください。'
        else if (code)
          message = `Storage エラー (${code}): ${err.message}`
        reject(new Error(message))
      },
      async () => {
        clearTimeout(timeout)
        const url = await getDownloadURL(task.snapshot.ref)
        resolve({ url, path, durationSec: null })
      }
    )
  })
}

/**
 * 動画ファイルから長さ(秒)を取得
 */
export function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      resolve(Math.round(video.duration))
    }
    video.onerror = () => resolve(null)
    video.src = URL.createObjectURL(file)
  })
}
