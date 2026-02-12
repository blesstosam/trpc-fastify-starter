<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { trpc } from '../utils/trpc'

type TagListResponse = Awaited<ReturnType<typeof trpc.tags.list.query>>
type TagItem = TagListResponse['items'][number]

const loading = ref(false)
const submitting = ref(false)
const deletingId = ref<string | null>(null)
const errorMessage = ref('')

const keyword = ref('')
const page = ref(1)
const pageSize = 10
const total = ref(0)
const tags = ref<TagItem[]>([])

const editingId = ref<string | null>(null)
const form = ref({
  name: '',
  description: '',
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const isEditing = computed(() => editingId.value !== null)
const submitText = computed(() => (isEditing.value ? '更新标签' : '新建标签'))

function normalizeDescription(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

async function loadTags() {
  loading.value = true
  errorMessage.value = ''

  try {
    const input = {
      page: page.value,
      pageSize,
      ...(keyword.value.trim() ? { keyword: keyword.value.trim() } : {}),
    }

    const result = await trpc.tags.list.query(input)
    tags.value = result.items
    total.value = result.total
    if (page.value > 1 && tags.value.length === 0) {
      page.value = page.value - 1
      await loadTags()
    }
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载标签失败'
  }
  finally {
    loading.value = false
  }
}

function resetForm() {
  editingId.value = null
  form.value = { name: '', description: '' }
}

function startEdit(tag: TagItem) {
  editingId.value = tag.id
  form.value = {
    name: tag.name,
    description: tag.description ?? '',
  }
}

async function submitForm() {
  const name = form.value.name.trim()
  if (!name) {
    errorMessage.value = '标签名称不能为空'
    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    if (editingId.value !== null) {
      await trpc.tags.update.mutate({
        id: editingId.value,
        name,
        description: normalizeDescription(form.value.description),
      })
    }
    else {
      await trpc.tags.create.mutate({
        name,
        description: normalizeDescription(form.value.description),
      })
    }

    resetForm()
    await loadTags()
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '保存标签失败'
  }
  finally {
    submitting.value = false
  }
}

async function removeTag(tag: TagItem) {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm(`确认删除标签「${tag.name}」吗？`)
  if (!confirmed) {
    return
  }

  deletingId.value = tag.id
  errorMessage.value = ''

  try {
    await trpc.tags.remove.mutate({ id: tag.id })
    await loadTags()
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '删除标签失败'
  }
  finally {
    deletingId.value = null
  }
}

async function search() {
  page.value = 1
  await loadTags()
}

async function goToPage(nextPage: number) {
  if (nextPage < 1 || nextPage > totalPages.value || nextPage === page.value) {
    return
  }

  page.value = nextPage
  await loadTags()
}

onMounted(async () => {
  await loadTags()
})
</script>

<template>
  <main class="min-h-screen bg-slate-100 py-8">
    <section class="mx-auto w-full max-w-5xl space-y-6 px-4">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-semibold text-slate-900">
          标签管理
        </h1>
        <div class="text-sm text-slate-500">
          共 {{ total }} 个标签
        </div>
      </header>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-lg font-medium text-slate-900">
          {{ submitText }}
        </h2>

        <form class="grid gap-4 md:grid-cols-[2fr,3fr,auto]" @submit.prevent="submitForm">
          <label class="space-y-1">
            <span class="text-sm text-slate-600">名称</span>
            <input
              v-model="form.name"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-sky-500"
              maxlength="100"
              placeholder="请输入标签名称"
            >
          </label>

          <label class="space-y-1">
            <span class="text-sm text-slate-600">描述</span>
            <input
              v-model="form.description"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-sky-500"
              maxlength="255"
              placeholder="可选，最多 255 字符"
            >
          </label>

          <div class="flex items-end gap-2">
            <button
              type="submit"
              class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              :disabled="submitting"
            >
              {{ submitting ? '处理中...' : submitText }}
            </button>
            <button
              v-if="isEditing"
              type="button"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              @click="resetForm"
            >
              取消
            </button>
          </div>
        </form>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <input
            v-model="keyword"
            type="text"
            class="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-sky-500"
            placeholder="按名称或描述搜索"
            @keyup.enter="search"
          >
          <button
            type="button"
            class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900"
            @click="search"
          >
            搜索
          </button>
        </div>

        <p v-if="errorMessage" class="mb-3 text-sm text-rose-600">
          {{ errorMessage }}
        </p>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-3 py-2">
                  ID
                </th>
                <th class="px-3 py-2">
                  名称
                </th>
                <th class="px-3 py-2">
                  描述
                </th>
                <th class="px-3 py-2">
                  更新时间
                </th>
                <th class="px-3 py-2 text-right">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td class="px-3 py-6 text-center text-slate-400" colspan="5">
                  加载中...
                </td>
              </tr>
              <tr v-else-if="tags.length === 0">
                <td class="px-3 py-6 text-center text-slate-400" colspan="5">
                  暂无标签
                </td>
              </tr>
              <tr v-for="tag in tags" :key="tag.id" class="border-t border-slate-100">
                <td class="px-3 py-2 text-slate-700">
                  {{ tag.id }}
                </td>
                <td class="px-3 py-2 text-slate-900">
                  {{ tag.name }}
                </td>
                <td class="px-3 py-2 text-slate-600">
                  {{ tag.description || '-' }}
                </td>
                <td class="px-3 py-2 text-slate-600">
                  {{ new Date(tag.updatedAt).toLocaleString() }}
                </td>
                <td class="px-3 py-2 text-right">
                  <div class="inline-flex items-center gap-2">
                    <button
                      type="button"
                      class="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50"
                      @click="startEdit(tag)"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      class="rounded-md border border-rose-300 px-3 py-1.5 text-xs text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="deletingId === tag.id"
                      @click="removeTag(tag)"
                    >
                      {{ deletingId === tag.id ? '删除中...' : '删除' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            class="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="page <= 1 || loading"
            @click="goToPage(page - 1)"
          >
            上一页
          </button>
          <span class="text-slate-600">第 {{ page }} / {{ totalPages }} 页</span>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="page >= totalPages || loading"
            @click="goToPage(page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
