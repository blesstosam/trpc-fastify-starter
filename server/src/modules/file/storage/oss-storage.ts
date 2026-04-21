import type { Readable } from 'node:stream'
import type { BucketInfo, StorageObjectMeta, StorageProvider, StorageToken } from './storage-provider'
import { Buffer } from 'node:buffer'
import OSS from 'ali-oss'

export class OssStorage implements StorageProvider {
  private readonly client: OSS

  constructor(private readonly bucket: string) {
    const accessKeyId = process.env.OSS_ACCESS_KEY
    const accessKeySecret = process.env.OSS_SECRET
    const region = process.env.OSS_REGION

    if (!accessKeyId || !accessKeySecret || !region) {
      throw new Error('Missing OSS config: OSS_ACCESS_KEY/OSS_SECRET/OSS_REGION')
    }

    this.client = new OSS({
      accessKeyId,
      accessKeySecret,
      region,
      bucket,
      timeout: 60000,
    })
  }

  private async bucketExists() {
    try {
      await this.client.getBucketInfo(this.bucket)
      return true
    }
    catch {
      return false
    }
  }

  async ensureBucket(): Promise<void> {
    const exists = await this.bucketExists()
    if (!exists) {
      await this.client.putBucket(this.bucket)
    }
  }

  async listBuckets(): Promise<BucketInfo[]> {
    const buckets = await this.client.listBuckets({})
    return buckets.map((item: { name: string }) => ({ name: item.name }))
  }

  async putObject(key: string, body: Buffer | Readable): Promise<void> {
    if (Buffer.isBuffer(body)) {
      await this.client.put(key, body)
      return
    }

    await this.client.putStream(key, body)
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.delete(key)
  }

  async getFileStream(key: string): Promise<Readable> {
    const result = await this.client.getStream(key)
    return result.stream
  }

  async getSignedUrl(key: string, expires?: number): Promise<string> {
    return this.client.signatureUrl(key, { expires: expires ?? 24 * 60 * 60 })
  }

  async getObjectMeta(key: string): Promise<StorageObjectMeta> {
    const result = await this.client.head(key)
    const headers = result.res.headers as Record<string, unknown>
    const length = headers['content-length']
    const type = headers['content-type']

    return {
      size: BigInt(typeof length === 'string' ? Number(length) : 0),
      type: typeof type === 'string' ? type : 'application/octet-stream',
    }
  }

  async getStsToken(): Promise<StorageToken | null> {
    return null
  }
}
