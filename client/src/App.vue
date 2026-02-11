<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import IconHome from '~icons/lucide/house'
import IconLogIn from '~icons/lucide/log-in'
import IconLogOut from '~icons/lucide/log-out'
import IconTags from '~icons/lucide/tags'
import IconUser from '~icons/lucide/user'
import { clearAuthToken, isLoggedIn } from './utils/auth'
import { trpc } from './utils/trpc'

const router = useRouter()
const route = useRoute()
const username = ref('')
const hasToken = ref(isLoggedIn())

function syncAuthState() {
  hasToken.value = isLoggedIn()
}

async function loadCurrentUser() {
  syncAuthState()
  if (!isLoggedIn()) {
    username.value = ''
    return
  }

  try {
    const me = await trpc.auth.me.query()
    username.value = me.username
  }
  catch {
    clearAuthToken()
    syncAuthState()
    username.value = ''
  }
}

async function logout() {
  clearAuthToken()
  syncAuthState()
  username.value = ''
  await router.push('/login')
}

watch(
  () => route.fullPath,
  () => loadCurrentUser(),
  { immediate: true },
)
</script>

<template>
  <header class="border-b border-slate-200 bg-white">
    <nav class="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 text-sm text-slate-600">
      <RouterLink class="flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-sky-600" to="/">
        <IconHome class="size-4" />
        首页
      </RouterLink>
      <RouterLink class="flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-sky-600" to="/login">
        <IconLogIn class="size-4" />
        登录
      </RouterLink>
      <RouterLink class="flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-sky-600" to="/tags">
        <IconTags class="size-4" />
        标签管理
      </RouterLink>
      <span class="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
        <IconUser class="size-3.5" />
        {{ username ? `当前用户: ${username}` : '未登录' }}
      </span>
      <a-button
        v-if="hasToken"
        class="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:border-slate-400"
        @click="logout"
      >
        <IconLogOut class="size-3.5" />
        退出
      </a-button>
    </nav>
  </header>

  <RouterView />
</template>
