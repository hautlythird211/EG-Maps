<template>
  <Teleport to="body">
    <Transition name="pwa-fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[99999] flex items-end sm:items-end sm:justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none"
      >
        <div
          class="relative w-full max-w-sm rounded-2xl border-2 p-5 shadow-2xl pointer-events-auto animate-slide-up"
          :class="isDark ? 'bg-black border-white/20 text-white' : 'bg-white border-black text-black'"
        >
          <button
            @click="onDismiss"
            class="absolute top-3 right-3 rounded-md p-1 transition-colors"
            :class="isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/10 text-black/60'"
            :aria-label="t('general.close')"
          >
            <Icon name="lucide:x" class="h-4 w-4" />
          </button>

          <div class="flex items-start gap-4">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              :class="isDark ? 'bg-white/10' : 'bg-black/5'"
            >
              <Icon v-if="canInstall" name="lucide:download" class="h-6 w-6" :class="isDark ? 'text-white' : 'text-black'" />
              <Icon v-else name="lucide:smartphone" class="h-6 w-6" :class="isDark ? 'text-white' : 'text-black'" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-extrabold leading-tight">
                {{ canInstall ? t('pwa.installTitle') : t('pwa.installTitle') }}
              </h3>
              <p class="mt-1.5 text-xs leading-relaxed" :class="isDark ? 'text-white/70' : 'text-black/60'">
                {{ canInstall ? t('pwa.installDesc') : t('pwa.installDescManual') }}
              </p>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-2">
            <button
              v-if="canInstall"
              @click="onInstall"
              class="flex-1 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all"
              :class="isDark
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-black text-white hover:bg-black/90'"
            >
              {{ t('pwa.install') }}
            </button>
            <button
              @click="onDismiss"
              class="rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors"
              :class="isDark
                ? 'text-white/60 hover:bg-white/10'
                : 'text-black/60 hover:bg-black/10'"
            >
              {{ t('pwa.notNow') }}
            </button>
          </div>

          <button
            @click="onDismissWeek"
            class="mt-2 w-full text-center text-[10px] font-medium opacity-50 hover:opacity-100 transition-opacity"
            :class="isDark ? 'text-white/60' : 'text-black/60'"
          >
            {{ t('pwa.dontShowWeek') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { usePwaInstall } from '~/composables/usePwaInstall'

const { t } = useI18n()
const { isDark } = useDarkMode()

const { canInstall, install, dismiss, showPopup: pwaShowPopup, isInstalled } = usePwaInstall()

const TIMER_DELAY = 120000
const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
let idleCheck: ReturnType<typeof setInterval> | null = null

function shouldShow() {
  if (isInstalled.value) return false
  if (!pwaShowPopup.value) return false
  try {
    const val = localStorage.getItem('eg-maps-pwa-dismissed')
    if (val && Date.now() < parseInt(val, 10)) return false
  } catch { }
  return true
}

function showAfterDelay() {
  timer = setTimeout(() => {
    if (shouldShow()) {
      visible.value = true
    }
  }, TIMER_DELAY)

  idleCheck = setInterval(() => {
    if (!shouldShow() && visible.value) {
      visible.value = false
    }
  }, 30000)
}

async function onInstall() {
  const success = await install()
  if (success) {
    visible.value = false
  }
}

function onDismiss() {
  visible.value = false
  dismiss(1)
}

function onDismissWeek() {
  visible.value = false
  dismiss(7)
}

onMounted(() => {
  if (import.meta.client) {
    showAfterDelay()
  }
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  if (idleCheck) clearInterval(idleCheck)
})
</script>

<style scoped>
.pwa-fade-enter-active {
  transition: opacity 0.4s ease-out;
}
.pwa-fade-leave-active {
  transition: opacity 0.2s ease-in;
}
.pwa-fade-enter-from,
.pwa-fade-leave-to {
  opacity: 0;
}
</style>
