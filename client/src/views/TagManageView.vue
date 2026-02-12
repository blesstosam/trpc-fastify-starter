<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { trpc } from '../utils/trpc'

type TagListResponse = Awaited<ReturnType<typeof trpc.tags.list.query>>
type TagItem = TagListResponse['items'][number]

type NoticeType = 'success' | 'error'

const tags = ref<TagItem[]>([])
const keyword = ref('')
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const showEditor = ref(false)
const showDeleteConfirm = ref(false)
const editingTagId = ref<string | null>(null)
const deletingTagId = ref<string | null>(null)

const notice = reactive({
  type: 'success' as NoticeType,
  message: '',
})

const form = reactive({
  name: '',
  description: '',
})

const fieldErrors = reactive({
  name: '',
  description: '',
})

const total = computed(() => tags.value.length)
const isEditing = computed(() => Boolean(editingTagId.value))
const editorTitle = computed(() => (isEditing.value ? '编辑 Tag' : '新建 Tag'))

let searchTimer: ReturnType<typeof setTimeout> | null = null

function setNotice(type: NoticeType, message: string) {
  notice.type = type
  notice.message = message
}

function clearNotice() {
  notice.message = ''
}

function clearFieldErrors() {
  fieldErrors.name = ''
  fieldErrors.description = ''
}

function resetForm() {
  form.name = ''
  form.description = ''
  clearFieldErrors()
}

function openCreateModal() {
  editingTagId.value = null
  resetForm()
  showEditor.value = true
}

function openEditModal(tag: TagItem) {
  editingTagId.value = tag.id
  form.name = tag.name
  form.description = tag.description ?? ''
  clearFieldErrors()
  showEditor.value = true
}

function closeEditor() {
  if (saving.value) {
    return
  }
  showEditor.value = false
}

function openDeleteModal(tag: TagItem) {
  deletingTagId.value = tag.id
  showDeleteConfirm.value = true
}

function closeDeleteModal() {
  if (deleting.value) {
    return
  }
  showDeleteConfirm.value = false
  deletingTagId.value = null
}

function validateForm() {
  clearFieldErrors()

  const name = form.name.trim()
  const description = form.description.trim()

  if (!name) {
    fieldErrors.name = 'Tag 名称不能为空'
  }
  else if (name.length > 30) {
    fieldErrors.name = 'Tag 名称不能超过 30 个字符'
  }

  if (description.length > 120) {
    fieldErrors.description = '描述不能超过 120 个字符'
  }

  return !fieldErrors.name && !fieldErrors.description
}

function normalizeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

function formatDate(value: Date | string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

async function loadTags() {
  loading.value = true

  try {
    const result = await trpc.tags.list.query(
      keyword.value.trim()
        ? { keyword: keyword.value.trim() }
        : undefined,
    )
    tags.value = result.items
  }
  catch (error) {
    setNotice('error', normalizeErrorMessage(error, '加载 Tag 列表失败，请重试'))
  }
  finally {
    loading.value = false
  }
}

async function submitTag() {
  if (!validateForm()) {
    return
  }

  saving.value = true
  clearNotice()

  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
    }

    if (editingTagId.value) {
      await trpc.tags.update.mutate({
        id: editingTagId.value,
        ...payload,
      })
      setNotice('success', 'Tag 更新成功')
    }
    else {
      await trpc.tags.create.mutate(payload)
      setNotice('success', 'Tag 创建成功')
    }

    showEditor.value = false
    resetForm()
    await loadTags()
  }
  catch (error) {
    const message = normalizeErrorMessage(error, '保存失败，请重试')
    if (message.includes('Tag 名称已存在')) {
      fieldErrors.name = 'Tag 名称已存在'
    }
    setNotice('error', message)
  }
  finally {
    saving.value = false
  }
}

async function deleteTag() {
  if (!deletingTagId.value) {
    return
  }

  deleting.value = true
  clearNotice()

  try {
    await trpc.tags.remove.mutate({ id: deletingTagId.value })
    setNotice('success', 'Tag 删除成功')
    showDeleteConfirm.value = false
    deletingTagId.value = null
    await loadTags()
  }
  catch (error) {
    setNotice('error', normalizeErrorMessage(error, '删除失败，请重试'))
  }
  finally {
    deleting.value = false
  }
}

watch(keyword, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    loadTags()
  }, 250)
})

onMounted(async () => {
  await loadTags()
})
</script>

<template>
  <main class="page-bg min-h-screen p-4 md:p-8">
    <section class="mx-auto max-w-6xl rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[0_20px_60px_rgba(31,41,55,0.08)] md:p-8">
      <header class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="title-font text-xs tracking-[0.2em] text-[var(--accent-2)]">
            CONTENT OPS
          </p>
          <h1 class="title-font mt-1 text-3xl font-bold md:text-4xl">
            Tag 管理
          </h1>
          <p class="mt-1 text-sm text-[var(--ink-soft)]">
            在一个页面完成 Tag 的查询、新建、编辑与删除。
          </p>
        </div>
        <button
          type="button"
          class="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          @click="openCreateModal"
        >
          新建 Tag
        </button>
      </header>

      <div
        v-if="notice.message"
        class="mb-4 rounded-xl border px-4 py-3 text-sm"
        :class="notice.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-rose-200 bg-rose-50 text-rose-700'"
      >
        {{ notice.message }}
      </div>

      <section class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索 Tag 名称..."
          class="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm outline-none ring-[var(--accent)] transition focus:ring-2 md:max-w-sm"
        >
        <div class="rounded-xl border border-[var(--line)] bg-[#fff8ee] px-4 py-2 text-xs text-[var(--ink-soft)]">
          共 <span class="font-semibold text-[var(--ink)]">{{ total }}</span> 个 Tag
        </div>
      </section>

      <section class="overflow-hidden rounded-2xl border border-[var(--line)]">
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse bg-white text-sm">
            <thead class="bg-[#f8f4ea] text-left text-[var(--ink-soft)]">
              <tr>
                <th class="px-4 py-3 font-medium">
                  Tag 名称
                </th>
                <th class="px-4 py-3 font-medium">
                  描述
                </th>
                <th class="px-4 py-3 font-medium">
                  创建时间
                </th>
                <th class="px-4 py-3 font-medium">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" class="border-t border-[var(--line)]">
                <td colspan="4" class="px-4 py-10 text-center text-[var(--ink-soft)]">
                  加载中...
                </td>
              </tr>
              <tr v-else-if="tags.length === 0" class="border-t border-[var(--line)]">
                <td colspan="4" class="px-4 py-10 text-center text-[var(--ink-soft)]">
                  暂无 Tag，点击右上角“新建 Tag”开始创建
                </td>
              </tr>
              <tr v-for="tag in tags" :key="tag.id" class="border-t border-[var(--line)]">
                <td class="px-4 py-3 font-semibold">
                  {{ tag.name }}
                </td>
                <td class="px-4 py-3 text-[var(--ink-soft)]">
                  {{ tag.description || '-' }}
                </td>
                <td class="px-4 py-3 text-[var(--ink-soft)]">
                  {{ formatDate(tag.createdAt) }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-[var(--line)] px-3 py-1 text-xs hover:bg-[#f7f4ec]"
                      @click="openEditModal(tag)"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      class="rounded-lg border border-[#fecaca] px-3 py-1 text-xs text-[#b91c1c] hover:bg-[#fff1f1]"
                      @click="openDeleteModal(tag)"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <div v-if="showEditor" class="fixed inset-0 flex items-center justify-center bg-black/35 p-4">
      <div class="fade-in w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-xl">
        <h2 class="title-font text-xl font-bold">
          {{ editorTitle }}
        </h2>

        <div class="mt-4 space-y-3">
          <label class="block text-sm">
            <span class="mb-1 block text-[var(--ink-soft)]">Tag 名称</span>
            <input
              v-model="form.name"
              type="text"
              maxlength="30"
              class="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
            <p v-if="fieldErrors.name" class="mt-1 text-xs text-rose-600">
              {{ fieldErrors.name }}
            </p>
          </label>

          <label class="block text-sm">
            <span class="mb-1 block text-[var(--ink-soft)]">描述</span>
            <textarea
              v-model="form.description"
              maxlength="120"
              class="h-24 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <div class="mt-1 flex items-center justify-between">
              <p v-if="fieldErrors.description" class="text-xs text-rose-600">
                {{ fieldErrors.description }}
              </p>
              <p class="ml-auto text-xs text-[var(--ink-soft)]">
                {{ form.description.length }}/120
              </p>
            </div>
          </label>
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            :disabled="saving"
            @click="closeEditor"
          >
            取消
          </button>
          <button
            type="button"
            class="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="saving"
            @click="submitTag"
          >
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="fixed inset-0 flex items-center justify-center bg-black/35 p-4">
      <div class="fade-in w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-xl">
        <h3 class="title-font text-lg font-bold">
          确认删除
        </h3>
        <p class="mt-2 text-sm text-[var(--ink-soft)]">
          删除后不可恢复，确定删除该 Tag 吗？
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            :disabled="deleting"
            @click="closeDeleteModal"
          >
            取消
          </button>
          <button
            type="button"
            class="rounded-lg bg-[#b91c1c] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="deleting"
            @click="deleteTag"
          >
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap');

.page-bg {
  --bg: #f5f2ea;
  --panel: #fffdf7;
  --ink: #1f2937;
  --ink-soft: #4b5563;
  --accent: #0f766e;
  --accent-2: #f97316;
  --line: #e5dcc9;

  font-family: 'Noto Sans SC', sans-serif;
  color: var(--ink);
  background: radial-gradient(circle at 15% 10%, #fff5dd 0%, var(--bg) 45%),
    linear-gradient(120deg, #f8efe2 0%, #f2f4e7 100%);
}

.title-font {
  font-family: 'Space Grotesk', 'Noto Sans SC', sans-serif;
}

.fade-in {
  animation: fadeIn 0.35s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
