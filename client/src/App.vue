<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useRoute, useRouter } from 'vue-router'
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
      <RouterLink class="transition hover:text-sky-600" to="/">
        首页
      </RouterLink>
      <RouterLink class="transition hover:text-sky-600" to="/login">
        登录
      </RouterLink>
      <RouterLink class="transition hover:text-sky-600" to="/tags">
        标签管理
      </RouterLink>
      <span class="ml-auto text-xs text-slate-500">
        {{ username ? `当前用户: ${username}` : '未登录' }}
      </span>
      <button
        v-if="hasToken"
        type="button"
        class="rounded-md border border-slate-300 px-2 py-1 text-xs hover:border-slate-400"
        @click="logout"
      >
        退出
      </button>
    </nav>
  </header>

  <RouterView />
</template>
