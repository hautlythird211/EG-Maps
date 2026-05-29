<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none"
        @click.self="close"
      >
        <div
          class="relative w-full max-w-sm rounded-2xl border-2 p-5 shadow-xl backdrop-blur-xl pointer-events-auto animate-fade-in"
          :class="isDark
            ? 'bg-black/90 border-white/20 text-white shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
            : 'bg-white/95 border-black text-black shadow-[0_12px_32px_rgba(0,0,0,0.18)]'"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                :class="isDark ? 'border-white/20 bg-white/5' : 'border-black bg-black/5'"
              >
                <Icon v-if="state === 'completed'" name="lucide:check-circle" class="h-4 w-4 text-emerald-500" />
                <Icon v-else-if="state === 'downloading'" name="lucide:loader-circle" class="h-4 w-4 animate-spin" />
                <Icon v-else name="lucide:cloud-off" class="h-4 w-4" />
              </div>
              <div>
                <h3 class="text-sm font-black leading-tight">{{ t('offline.title') }}</h3>
                <p class="text-[10px] font-semibold leading-tight tracking-wide uppercase" :class="isDark ? 'text-white/50' : 'text-black/50'">
                  {{ statusText }}
                </p>
              </div>
            </div>
            <button
              @click="close"
              class="rounded-lg border p-1.5 transition-colors"
              :class="isDark
                ? 'border-white/20 text-white/60 hover:bg-white/10'
                : 'border-black/30 text-black/60 hover:bg-black/10'"
              :aria-label="t('general.close')"
            >
              <Icon name="lucide:x" class="h-3.5 w-3.5" />
            </button>
          </div>

          <!-- Overall progress -->
          <div class="flex flex-col items-center mb-4 pb-4" :class="isDark ? 'border-b border-white/20' : 'border-b border-black/20'">
            <div class="relative flex items-center justify-center">
              <svg class="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="27" fill="none" :stroke="isDark ? '#222' : '#e5e5e5'" stroke-width="4" />
                <circle
                  cx="32" cy="32" r="27" fill="none"
                  :stroke="overallProgress >= 100 ? '#22c55e' : (state === 'error' ? '#ef4444' : (isDark ? '#fff' : '#000'))"
                  stroke-width="4"
                  stroke-linecap="square"
                  :stroke-dasharray="169.6"
                  :stroke-dashoffset="169.6 - (169.6 * overallProgress / 100)"
                  class="transition-all duration-500 ease-out"
                />
              </svg>
              <span class="absolute text-lg font-black">{{ overallProgress }}%</span>
            </div>
            <span
              v-if="state === 'downloading' && elapsed > 0"
              class="mt-1.5 text-[10px] font-bold tracking-wide uppercase"
              :class="isDark ? 'text-white/50' : 'text-black/50'"
            >
              {{ formatElapsed(elapsed) }}
            </span>
          </div>

          <!-- Item list -->
          <div class="space-y-2 mb-4">
            <div
              v-for="item in items"
              :key="item.id"
              class="rounded-xl border p-2.5"
              :class="isDark
                ? 'border-white/10 bg-white/[0.03]'
                : 'border-black/10 bg-black/[0.03]'"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] font-black tracking-tight">{{ item.label }}</span>
                <span
                  class="text-[9px] font-bold tracking-wide uppercase"
                  :class="item.done ? 'text-emerald-500' : (isDark ? 'text-white/50' : 'text-black/50')"
                >
                  {{ item.done ? t('offline.cached') : `${Math.min(item.progress, item.total)} / ${item.total}` }}
                </span>
              </div>
              <div
                class="h-1 rounded-sm overflow-hidden border"
                :class="isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'"
              >
                <div
                  class="h-full transition-all duration-300 ease-out rounded-sm"
                  :class="item.done ? 'bg-emerald-500' : (item.error ? 'bg-red-500' : (isDark ? 'bg-white' : 'bg-black'))"
                  :style="{ width: `${item.total > 0 ? Math.min(item.progress / item.total * 100, 100) : 0}%` }"
                />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              v-if="canStart"
              @click="startDownload"
              class="flex-1 rounded-xl border-2 px-4 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-2"
              :class="isDark
                ? 'bg-white text-black hover:bg-white/90 border-white'
                : 'bg-black text-white hover:bg-black/90 border-black'"
            >
              <Icon name="lucide:download" class="h-3.5 w-3.5" />
              {{ t('offline.download') }}
            </button>
            <button
              v-if="isDownloading"
              @click="cancel"
              class="flex-1 rounded-xl border-2 px-4 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-2"
              :class="isDark
                ? 'border-red-500/40 text-red-400 hover:bg-red-500/20'
                : 'border-red-500/40 text-red-600 hover:bg-red-500/10'"
            >
              <Icon name="lucide:square" class="h-3.5 w-3.5" />
              {{ t('offline.cancel') }}
            </button>
            <button
              v-if="state === 'completed'"
              class="flex-1 rounded-xl border-2 px-4 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-default"
              :class="isDark
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'"
            >
              <Icon name="lucide:check-circle" class="h-3.5 w-3.5" />
              {{ t('offline.ready') }}
            </button>
            <button
              @click="close"
              class="rounded-xl border-2 px-4 py-2.5 text-xs font-bold transition-all"
              :class="isDark
                ? 'border-white/20 text-white/60 hover:bg-white/10'
                : 'border-black/20 text-black/60 hover:bg-black/10'"
            >
              {{ t('general.close') }}
            </button>
          </div>

          <!-- Storage info + Reset -->
          <div v-if="state === 'completed'" class="mt-3 flex items-center justify-center gap-3">
            <span class="text-[9px] font-bold uppercase tracking-wider" :class="isDark ? 'text-white/30' : 'text-black/30'">
              {{ cacheSize }}
            </span>
            <button
              @click="resetDownload"
              class="text-[9px] font-bold uppercase tracking-wider transition-opacity"
              :class="isDark ? 'text-white/40 hover:text-white/80' : 'text-black/40 hover:text-black/80'"
            >
              {{ t('offline.redownload') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOfflineDownload } from '~/composables/useOfflineDownload'

const { t } = useI18n()
const { isDark } = useDarkMode()

const {
  state,
  overallProgress,
  items,
  elapsed,
  cacheSize,
  isCompleted,
  isDownloading,
  canStart,
  init,
  startDownload,
  cancel,
  reset,
} = useOfflineDownload()

const visible = ref(false)

const statusText = computed(() => {
  switch (state.value) {
    case 'idle': return t('offline.statusIdle')
    case 'checking': return t('offline.statusChecking')
    case 'downloading': return t('offline.statusDownloading')
    case 'completed': return t('offline.statusCompleted')
    case 'error': return t('offline.statusError')
    default: return ''
  }
})

function open() {
  visible.value = true
  init()
}

function close() {
  visible.value = false
}

function resetDownload() {
  reset()
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

defineExpose({ open, close })
</script>

<style scoped>
.modal-enter-active {
  transition: opacity 0.2s ease-out;
}
.modal-leave-active {
  transition: opacity 0.15s ease-in;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
