import { ref, computed } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallState = 'idle' | 'available' | 'installed' | 'unsupported'

const installPrompt = ref<BeforeInstallPromptEvent | null>(null)
const installState = ref<InstallState>('idle')
const dismissedUntil = ref<number>(0)

const STORAGE_KEY = 'eg-maps-pwa-dismissed'

function loadDismissed() {
  if (import.meta.client) {
    try {
      const val = localStorage.getItem(STORAGE_KEY)
      if (val) dismissedUntil.value = parseInt(val, 10)
    } catch { }
  }
}

function saveDismissed(days: number) {
  const until = Date.now() + days * 24 * 60 * 60 * 1000
  dismissedUntil.value = until
  if (import.meta.client) {
    try {
      localStorage.setItem(STORAGE_KEY, String(until))
    } catch { }
  }
}

export function usePwaInstall() {
  const isSupported = computed(() => installState.value !== 'unsupported')
  const canInstall = computed(() => installState.value === 'available' && !!installPrompt.value)
  const isInstalled = computed(() => installState.value === 'installed')
  const wasDismissed = computed(() => Date.now() < dismissedUntil.value)

  const showPopup = computed(() => {
    if (installState.value === 'idle') return false
    if (installState.value === 'unsupported') return true
    if (installState.value === 'installed') return false
    if (wasDismissed.value) return false
    return true
  })

  function handleBeforeInstallPrompt(e: Event) {
    e.preventDefault()
    installPrompt.value = e as BeforeInstallPromptEvent
    installState.value = 'available'
  }

  function handleAppInstalled() {
    installState.value = 'installed'
    installPrompt.value = null
  }

  async function install() {
    if (!installPrompt.value) return false
    try {
      installPrompt.value.prompt()
      const { outcome } = await installPrompt.value.userChoice
      if (outcome === 'accepted') {
        installState.value = 'installed'
        return true
      }
    } catch { }
    installPrompt.value = null
    installState.value = 'idle'
    return false
  }

  function dismiss(days = 7) {
    saveDismissed(days)
  }

  function detectInstalled() {
    if (import.meta.client) {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
        installState.value = 'installed'
        return true
      }
    }
    return false
  }

  function markUnsupported() {
    if (installState.value === 'idle') {
      installState.value = 'unsupported'
    }
  }

  loadDismissed()

  if (import.meta.client) {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    if (!detectInstalled()) {
      setTimeout(() => {
        if (installState.value === 'idle') {
          markUnsupported()
        }
      }, 5000)
    }
  }

  return {
    installState,
    isSupported,
    canInstall,
    isInstalled,
    showPopup,
    install,
    dismiss,
    detectInstalled,
  }
}
