<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form'
import type { ValidateErrorEntity } from 'ant-design-vue/es/form/interface'
import type { ColumnsType } from 'ant-design-vue/es/table'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { computed, onMounted, reactive, ref } from 'vue'
import { trpc } from '../trpc'

type TagListResponse = Awaited<ReturnType<typeof trpc.tags.list.query>>
type TagItem = TagListResponse['items'][number]

const tags = ref<TagItem[]>([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const submitting = computed(() => saving.value)

const searchKeyword = ref('')
const searchInput = ref('')

const showEditor = ref(false)
const showDeleteConfirm = ref(false)
const editingTagId = ref<string | null>(null)
const deletingTag = ref<TagItem | null>(null)

const form = reactive({
  name: '',
  description: '',
})

const formRef = ref()

const columns: ColumnsType<TagItem> = [
  {
    title: '标签名称',
    key: 'name',
    dataIndex: 'name',
  },
  {
    title: '描述',
    key: 'description',
    dataIndex: 'description',
  },
  {
    title: '创建时间',
    key: 'createdAt',
    dataIndex: 'createdAt',
  },
  {
    title: '操作',
    key: 'action',
    align: 'right',
  },
]

const nameRules: Rule[] = [
  {
    required: true,
    validator: async (_, value: string) => {
      if (!value?.trim()) {
        throw new Error('标签名称不能为空')
      }
    },
    trigger: ['blur', 'change'],
  },
  {
    max: 30,
    message: '标签名称不能超过 30 个字符',
    trigger: ['blur', 'change'],
  },
]

const descriptionRules: Rule[] = [
  {
    max: 120,
    message: '描述不能超过 120 个字符',
    trigger: ['blur', 'change'],
  },
]

const editorTitle = computed(() => (editingTagId.value ? '编辑标签' : '新建标签'))

function normalizeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

function getTagDescription(description: string | null) {
  return description || '-'
}

function formatDate(value: Date | string) {
  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

async function loadTags() {
  loading.value = true
  try {
    const keyword = searchKeyword.value.trim()
    const result = await trpc.tags.list.query(keyword ? { keyword } : undefined)
    tags.value = result.items
    total.value = result.total
  }
  catch (error) {
    message.error(normalizeErrorMessage(error, '加载标签列表失败，请重试'))
  }
  finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingTagId.value = null
  form.name = ''
  form.description = ''
  showEditor.value = true
}

function openEditModal(tag: TagItem) {
  editingTagId.value = tag.id
  form.name = tag.name
  form.description = tag.description ?? ''
  showEditor.value = true
}

function closeEditor() {
  if (saving.value) {
    return
  }
  showEditor.value = false
}

function openDeleteModal(tag: TagItem) {
  deletingTag.value = tag
  showDeleteConfirm.value = true
}

function closeDeleteModal() {
  if (deleting.value) {
    return
  }
  deletingTag.value = null
  showDeleteConfirm.value = false
}

async function submitTag() {
  try {
    await formRef.value?.validate()
  }
  catch (error) {
    const validateError = error as ValidateErrorEntity
    if (validateError.errorFields?.length) {
      return
    }
    message.error('表单校验失败，请重试')
    return
  }

  saving.value = true

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
      message.success('标签更新成功')
    }
    else {
      await trpc.tags.create.mutate(payload)
      message.success('标签创建成功')
    }

    showEditor.value = false
    await loadTags()
  }
  catch (error) {
    const errorMessage = normalizeErrorMessage(error, '保存失败，请重试')
    if (errorMessage.includes('标签名称已存在')) {
      formRef.value?.setFields([
        {
          name: 'name',
          errors: ['标签名称重复，请更换名称'],
        },
      ])
      return
    }
    message.error(errorMessage)
  }
  finally {
    saving.value = false
  }
}

async function deleteTag() {
  if (!deletingTag.value) {
    return
  }

  deleting.value = true
  try {
    await trpc.tags.remove.mutate({ id: deletingTag.value.id })
    message.success('标签删除成功')
    showDeleteConfirm.value = false
    deletingTag.value = null
    await loadTags()
  }
  catch (error) {
    message.error(normalizeErrorMessage(error, '删除失败，请重试'))
  }
  finally {
    deleting.value = false
  }
}

async function onSearch() {
  searchKeyword.value = searchInput.value.trim()
  await loadTags()
}

async function onReset() {
  searchInput.value = ''
  searchKeyword.value = ''
  await loadTags()
}

onMounted(async () => {
  await loadTags()
})
</script>

<template>
  <main class="tag-page">
    <div class="tag-wrap">
      <a-card :bordered="false" class="tag-header-card">
        <div class="tag-header">
          <div>
            <p class="tag-subtitle">
              内容系统
            </p>
            <h1 class="tag-title">
              标签管理
            </h1>
          </div>
          <a-button type="primary" size="large" @click="openCreateModal">
            新建标签
          </a-button>
        </div>
      </a-card>

      <a-card :bordered="false" class="tag-search-card">
        <a-space :size="12" wrap class="tag-search-row">
          <a-input
            v-model:value="searchInput"
            placeholder="搜索标签名称"
            allow-clear
            size="large"
            class="tag-search-input"
            @press-enter="onSearch"
          />
          <a-button size="large" @click="onSearch">
            搜索
          </a-button>
          <a-button size="large" @click="onReset">
            重置
          </a-button>
        </a-space>
      </a-card>

      <a-card :bordered="false" class="tag-table-card">
        <a-table
          :columns="columns"
          :data-source="tags"
          :loading="loading"
          :pagination="false"
          row-key="id"
          :locale="{ emptyText: '暂无标签，请点击右上角“新建标签”' }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'description'">
              {{ getTagDescription(record.description) }}
            </template>
            <template v-else-if="column.key === 'createdAt'">
              {{ formatDate(record.createdAt) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space :size="8">
                <a-button type="link" @click="openEditModal(record)">
                  编辑
                </a-button>
                <a-button danger type="link" @click="openDeleteModal(record)">
                  删除
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
        <div class="tag-total">
          共 {{ total }} 个标签
        </div>
      </a-card>
    </div>

    <a-modal
      :open="showEditor"
      :title="editorTitle"
      ok-text="保存"
      cancel-text="取消"
      :confirm-loading="submitting"
      :mask-closable="false"
      @ok="submitTag"
      @cancel="closeEditor"
    >
      <a-form ref="formRef" layout="vertical" :model="form">
        <a-form-item label="标签名称" name="name" :rules="nameRules">
          <a-input
            v-model:value="form.name"
            placeholder="请输入标签名称"
            :maxlength="30"
            show-count
          />
        </a-form-item>
        <a-form-item label="标签描述" name="description" :rules="descriptionRules">
          <a-textarea
            v-model:value="form.description"
            placeholder="请输入标签描述（可选）"
            :maxlength="120"
            :rows="3"
            show-count
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      :open="showDeleteConfirm"
      title="确认删除"
      ok-text="删除"
      cancel-text="取消"
      ok-type="danger"
      :confirm-loading="deleting"
      :mask-closable="false"
      @ok="deleteTag"
      @cancel="closeDeleteModal"
    >
      <p>删除后无法恢复，确认删除标签 <span class="tag-delete-name">「{{ deletingTag?.name }}」</span> 吗？</p>
    </a-modal>
  </main>
</template>

<style scoped>
.tag-page {
  min-height: calc(100vh - 56px);
  padding: 24px 16px;
  background: #f5f7fa;
}

.tag-wrap {
  max-width: 1200px;
  margin: 0 auto;
}

.tag-header-card,
.tag-search-card,
.tag-table-card {
  margin-bottom: 16px;
  border-radius: 16px;
}

.tag-header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.tag-subtitle {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

.tag-title {
  margin: 4px 0 0;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 600;
  color: #0f172a;
}

.tag-search-row {
  width: 100%;
}

.tag-search-input {
  flex: 1;
  min-width: 220px;
}

.tag-total {
  margin-top: 12px;
  text-align: right;
  font-size: 13px;
  color: #475569;
}

.tag-delete-name {
  font-weight: 500;
  color: #0f172a;
}

@media (max-width: 768px) {
  .tag-page {
    padding: 16px;
  }

  .tag-title {
    font-size: 26px;
  }
}
</style>
