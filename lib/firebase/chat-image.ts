import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './config'
import { v4 as uuidv4 } from 'uuid'

export interface ChatImageUploadResult {
  url: string
  width: number
  height: number
}

/**
 * クライアントサイドで画像を圧縮してから Storage にアップロード
 * - 最大長辺 1920px に縮小
 * - 品質 0.85 の JPEG
 */
export async function uploadChatImage(
  threadId: string,
  file: File
): Promise<ChatImageUploadResult> {
  const compressed = await compressImage(file)
  const fileName = `${uuidv4()}.jpg`
  const storageRef = ref(storage, `chats/${threadId}/${fileName}`)
  await uploadBytes(storageRef, compressed.blob, { contentType: 'image/jpeg' })
  const url = await getDownloadURL(storageRef)
  return { url, width: compressed.width, height: compressed.height }
}

async function compressImage(file: File): Promise<{
  blob: Blob
  width: number
  height: number
}> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 1920
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width)
          width = MAX
        } else {
          width = Math.round((width * MAX) / height)
          height = MAX
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'))
            return
          }
          resolve({ blob, width, height })
        },
        'image/jpeg',
        0.85
      )
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = URL.createObjectURL(file)
  })
}
