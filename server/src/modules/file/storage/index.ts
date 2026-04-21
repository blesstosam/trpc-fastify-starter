import type { StorageProvider } from './storage-provider'
import { MemoryStorage } from './memory-storage'
import { MinioStorage } from './minio-storage'
import { OssStorage } from './oss-storage'

let storageProvider: StorageProvider | null = null

function detectDriver() {
  if (process.env.FILE_SERVER === 'minio') {
    return 'minio' as const
  }
  if (process.env.FILE_SERVER === 'oss') {
    return 'oss' as const
  }
  return 'oss' as const
}

export function getStorageProvider() {
  if (storageProvider) {
    return storageProvider
  }

  const driver = detectDriver()
  if (driver === 'minio') {
    storageProvider = new MinioStorage(process.env.MINIO_BUCKET ?? 'uploads')
  }
  else if (driver === 'oss') {
    storageProvider = new OssStorage(process.env.OSS_BUCKET ?? 'uploads')
  }
  else {
    storageProvider = new MemoryStorage()
  }

  return storageProvider
}
