<script setup lang="ts">
import type { UploadFile } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { computed, ref } from 'vue'
import { trpc } from '../trpc'

const uploadFileList = ref<UploadFile[]>([])
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const loading = ref(false)

const imageItems = ref<Array<{
  id: string
  key: string
  name: string
  type: string
  size: string
  url: string
  createdAt: Date
}>>([])

const signedUrlMap = ref<Record<string, string>>({})

const serverBaseUrl = 'http://localhost:2022'

const sortedImages = computed(() => {
  return [...imageItems.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

function resolveImageUrl(url: string) {
  return new URL(url, serverBaseUrl).toString()
}

function formatSize(size: string) {
  const bytes = Number(size)
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function normalizeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

function handleBeforeUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    message.error('只能上传图片文件')
    return false
  }

  selectedFile.value = file
  uploadFileList.value = [
    {
      uid: file.name,
      name: file.name,
      status: 'done',
      size: file.size,
      type: file.type,
    },
  ]

  return false
}

function onRemove() {
  selectedFile.value = null
  uploadFileList.value = []
  return true
}

async function fileToBase64(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

async function loadImages() {
  loading.value = true
  try {
    const result = await trpc.file.list.query({ page: 1, pageSize: 50 })
    imageItems.value = result.items.filter(item => item.type.startsWith('image/'))
  }
  catch (error) {
    message.error(normalizeErrorMessage(error, '加载图片列表失败'))
  }
  finally {
    loading.value = false
  }
}

async function uploadImage() {
  if (!selectedFile.value) {
    message.warning('请先选择一张图片')
    return
  }

  uploading.value = true
  try {
    const contentBase64 = await fileToBase64(selectedFile.value)
    await trpc.file.create.mutate({
      name: selectedFile.value.name,
      type: selectedFile.value.type || 'image/png',
      contentBase64,
    })

    message.success('上传成功')
    selectedFile.value = null
    uploadFileList.value = []
    await loadImages()
  }
  catch (error) {
    message.error(normalizeErrorMessage(error, '上传失败'))
  }
  finally {
    uploading.value = false
  }
}

async function getSignedUrl(item: { key: string, id: string }) {
  try {
    const result = await trpc.file.getSignedUrl.query({ key: item.key })
    signedUrlMap.value[item.id] = result.url
    message.success('已获取签名链接')
  }
  catch (error) {
    message.error(normalizeErrorMessage(error, '获取签名链接失败'))
  }
}

loadImages()
</script>

<template>
  <main class="upload-page">
    <div class="upload-wrap">
      <a-card :bordered="false">
        <div class="header-row">
          <div>
            <p class="subtitle">
              文件模块演示
            </p>
            <h1 class="title">
              图片上传 Demo
            </h1>
          </div>
          <a-button :loading="loading" @click="loadImages">
            刷新列表
          </a-button>
        </div>

        <a-upload
          accept="image/*"
          :before-upload="handleBeforeUpload"
          :remove="onRemove"
          :file-list="uploadFileList"
          :max-count="1"
          list-type="picture"
        >
          <a-button>选择图片</a-button>
        </a-upload>

        <a-space :size="12" class="action-row">
          <a-button type="primary" :loading="uploading" @click="uploadImage">
            上传到服务端
          </a-button>
          <span class="hint">接口: <code>file.create</code> / <code>file.list</code> / <code>file.getSignedUrl</code></span>
        </a-space>
      </a-card>

      <a-card :bordered="false" class="list-card" :loading="loading">
        <template #title>
          已上传图片（{{ sortedImages.length }}）
        </template>

        <a-empty v-if="sortedImages.length === 0" description="暂无图片，请先上传" />

        <div v-else class="image-grid">
          <article v-for="item in sortedImages" :key="item.id" class="image-item">
            <img :src="resolveImageUrl(item.url)" :alt="item.name" class="preview" loading="lazy">
            <div class="meta">
              <p class="name" :title="item.name">
                {{ item.name }}
              </p>
              <p class="desc">
                {{ formatSize(item.size) }} · {{ item.type }}
              </p>
              <a-space>
                <a-button size="small" @click="getSignedUrl(item)">
                  获取签名链接
                </a-button>
                <a-button size="small" type="link" :href="resolveImageUrl(item.url)" target="_blank">
                  查看原图
                </a-button>
              </a-space>
              <a-typography-paragraph v-if="signedUrlMap[item.id]" copyable class="signed-url">
                {{ signedUrlMap[item.id] }}
              </a-typography-paragraph>
            </div>
          </article>
        </div>
      </a-card>
    </div>
  </main>
</template>

<style scoped>
.upload-page {
  min-height: calc(100vh - 64px);
  background: linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%);
  padding: 24px;
}

.upload-wrap {
  margin: 0 auto;
  max-width: 1080px;
  display: grid;
  gap: 16px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.subtitle {
  margin: 0;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
}

.title {
  margin: 4px 0 0;
  font-size: 26px;
  line-height: 1.2;
}

.action-row {
  margin-top: 12px;
}

.hint {
  color: #64748b;
  font-size: 12px;
}

.list-card {
  overflow: hidden;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.image-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}

.preview {
  width: 100%;
  height: 180px;
  object-fit: cover;
  background: #f8fafc;
}

.meta {
  padding: 10px;
}

.name {
  margin: 0;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.desc {
  margin: 6px 0;
  color: #64748b;
  font-size: 12px;
}

.signed-url {
  margin: 8px 0 0;
  font-size: 12px;
}

@media (max-width: 768px) {
  .upload-page {
    padding: 12px;
  }

  .title {
    font-size: 22px;
  }

  .preview {
    height: 150px;
  }
}
</style>
