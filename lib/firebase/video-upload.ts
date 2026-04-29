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
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type })

    task.on(
      'state_changed',
      (snap) => {
        if (onProgress) {
          onProgress({
            bytesTransferred: snap.bytesTransferred,
            totalBytes: snap.totalBytes,
            percent: Math.round((snap.bytesTransferred / snap.totalBytes) * 100),
          })
        }
      },
      (err) => {
        // Firebase Storage エラーコードを人間が読める形に変換
        const code = (err as any).code as string | undefined
        let message = err.message
        if (code === 'storage/unauthorized')   message = 'アップロード権限がありません。Firebase Storageのルールを確認してください。'
        else if (code === 'storage/unauthenticated') message = '認証が必要です。再ログインしてください。'
        else if (code === 'storage/quota-exceeded')  message = 'ストレージ容量が上限に達しています。'
        else if (code === 'storage/canceled')         message = 'アップロードがキャンセルされました。'
        else if (code === 'storage/unknown')          message = `不明なエラーが発生しました (${code})`
        else if (code)                                message = `Storage エラー: ${code}`
        reject(new Error(message))
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        // 動画長さは別途クライアントで取得
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
