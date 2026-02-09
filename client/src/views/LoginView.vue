<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { setAuthToken } from '../utils/auth'
import { trpc } from '../utils/trpc'

const router = useRouter()
const route = useRoute()
const account = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submitLogin() {
  if (!account.value || !password.value) {
    error.value = '请输入账号和密码'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const result = await trpc.auth.login.mutate({
      account: account.value,
      password: password.value,
    })
    setAuthToken(result.token)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  }
  catch {
    error.value = '账号或密码错误'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-[70vh] flex items-center justify-center bg-slate-50 p-4">
    <section class="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm">
      <h1 class="text-xl font-semibold text-slate-900">
        登录
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        使用账号密码登录后即可访问受保护页面
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="submitLogin">
        <label class="block space-y-1.5">
          <span class="text-sm text-slate-700">账号</span>
          <input
            v-model.trim="account"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            type="text"
            placeholder="请输入账号"
          >
        </label>

        <label class="block space-y-1.5">
          <span class="text-sm text-slate-700">密码</span>
          <input
            v-model="password"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            type="password"
            placeholder="请输入密码"
          >
        </label>

        <p v-if="error" class="text-sm text-rose-600">
          {{ error }}
        </p>

        <button
          type="submit"
          class="inline-flex w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </section>
  </main>
</template>
