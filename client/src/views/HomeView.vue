<script setup lang="ts">
import { ref } from 'vue';
import { trpc } from '../utils/trpc'

const health = ref('checking...')
const init = async () => {
  try {
    const result = await trpc.health.query()
    health.value = result.message
  }
  catch {
    health.value = 'error'
  }
}
init()
</script>

<template>
  <main class="min-h-[60vh] flex items-center justify-center bg-slate-50">
    <section class="max-w-xl w-full rounded-2xl bg-white shadow-sm border border-slate-200 px-8 py-6 space-y-4">
      <header class="space-y-1">
        <p class="text-xs font-semibold tracking-wide text-sky-600 uppercase">tRPC Demo</p>
        <h1 class="text-2xl font-semibold text-slate-900">
          Connection status
        </h1>
        <p class="text-sm text-slate-500">
          This is fetched from the backend via <span class="font-mono text-sky-700">trpc.health</span>.
        </p>
      </header>

      <div class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <span class="text-sm font-medium text-slate-700">
          rpc health:
        </span>
        <span
          class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
          :class="health === 'ok'
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            : health === 'checking...'
              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
              : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'"
        >
          {{ health }}
        </span>
      </div>

      <div class="flex items-center justify-between pt-1">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 active:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-colors"
          @click="init"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" />
          Re-check
        </button>

        <p class="text-xs text-slate-400">
          Tailwind 4 classes are active here.
        </p>
      </div>
    </section>
  </main>
</template>
