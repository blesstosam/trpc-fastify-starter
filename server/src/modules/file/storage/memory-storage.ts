import type { BucketInfo, StorageObjectMeta, StorageProvider, StorageToken } from './storage-provider'
import { Buffer } from 'node:buffer'
import { Readable } from 'node:stream'

interface MemoryObject {
  body: Buffer
  type: string
}

export class MemoryStorage implements StorageProvider {
  private readonly objects = new Map<string, MemoryObject>()

  private async readToBuffer(stream: Readable) {
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }

  async ensureBucket() {}

  async listBuckets(): Promise<BucketInfo[]> {
    return [{ name: 'memory' }]
  }

  async putObject(key: string, body: Buffer | Readable): Promise<void> {
    const buffer = Buffer.isBuffer(body)
      ? body
      : await this.readToBuffer(body)

    this.objects.set(key, {
      body: buffer,
      type: 'application/octet-stream',
    })
  }

  async deleteObject(key: string): Promise<void> {
    this.objects.delete(key)
  }

  async getFileStream(key: string): Promise<Readable> {
    const object = this.objects.get(key)
    if (!object) {
      throw new Error(`Object not found: ${key}`)
    }
    return Readable.from(object.body)
  }

  async getSignedUrl(key: string): Promise<string> {
    return `/file/fetch/${encodeURIComponent(key)}`
  }

  async getObjectMeta(key: string): Promise<StorageObjectMeta> {
    const object = this.objects.get(key)
    if (!object) {
      throw new Error(`Object not found: ${key}`)
    }
    return {
      size: BigInt(object.body.byteLength),
      type: object.type,
    }
  }

  async getStsToken(): Promise<StorageToken | null> {
    return null
  }
}
