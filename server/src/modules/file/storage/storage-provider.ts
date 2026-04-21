import type { Readable } from 'node:stream'
import { Buffer } from 'node:buffer'

export interface StorageToken {
  accessKeyId: string
  accessKeySecret: string
  stsToken: string
  region: string
  bucket: string
}

export interface StorageObjectMeta {
  size: bigint
  type: string
}

export interface BucketInfo {
  name: string
}

export interface StorageProvider {
  ensureBucket: () => Promise<void>
  listBuckets: () => Promise<BucketInfo[]>
  putObject: (key: string, body: Buffer | Readable) => Promise<void>
  deleteObject: (key: string) => Promise<void>
  getFileStream: (key: string) => Promise<Readable>
  getSignedUrl: (key: string, expires?: number) => Promise<string>
  getObjectMeta: (key: string) => Promise<StorageObjectMeta>
  getStsToken: () => Promise<StorageToken | null>
}
