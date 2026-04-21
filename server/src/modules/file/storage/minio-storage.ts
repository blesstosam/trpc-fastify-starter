import type { Readable } from 'node:stream'
import type { BucketInfo, StorageObjectMeta, StorageProvider, StorageToken } from './storage-provider'
import { Buffer } from 'node:buffer'
import * as Minio from 'minio'

export class MinioStorage implements StorageProvider {
  private readonly client: Minio.Client

  constructor(private readonly bucket: string) {
    const endpoint = process.env.MINIO_ENDPOINT
    const port = Number(process.env.MINIO_PORT ?? 9000)
    const accessKey = process.env.MINIO_ACCESS
    const secretKey = process.env.MINIO_SECRET

    if (!endpoint || !accessKey || !secretKey) {
      throw new Error('Missing MinIO config: MINIO_ENDPOINT/MINIO_ACCESS/MINIO_SECRET')
    }

    this.client = new Minio.Client({
      endPoint: endpoint,
      port,
      accessKey,
      secretKey,
      useSSL: process.env.MINIO_USE_SSL === 'true',
    })
  }

  async ensureBucket(): Promise<void> {
    const buckets = await this.listBuckets()
    const exists = buckets.some(item => item.name === this.bucket)
    if (!exists) {
      await this.client.makeBucket(this.bucket)
    }
  }

  async listBuckets(): Promise<BucketInfo[]> {
    const buckets = await this.client.listBuckets()
    return buckets.map(item => ({ name: item.name }))
  }

  async putObject(key: string, body: Buffer | Readable): Promise<void> {
    await this.client.putObject(this.bucket, key, body)
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key)
  }

  async getFileStream(key: string): Promise<Readable> {
    return this.client.getObject(this.bucket, key)
  }

  async getSignedUrl(key: string, expires?: number): Promise<string> {
    return this.client.presignedUrl('GET', this.bucket, key, expires)
  }

  async getObjectMeta(key: string): Promise<StorageObjectMeta> {
    const stat = await this.client.statObject(this.bucket, key)
    const metadataType = stat.metaData?.['content-type']

    return {
      size: BigInt(stat.size),
      type: typeof metadataType === 'string' ? metadataType : 'application/octet-stream',
    }
  }

  async getStsToken(): Promise<StorageToken | null> {
    return {
      accessKeyId: '',
      accessKeySecret: '',
      stsToken: '',
      region: '',
      bucket: this.bucket,
    }
  }
}
