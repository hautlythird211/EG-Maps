export default defineNuxtPlugin(() => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      }).then((reg) => {
        reg.onupdatefound = () => {
          const installingWorker = reg.installing
          if (!installingWorker) return

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              const event = new CustomEvent('sw-update', { detail: { registration: reg } })
              window.dispatchEvent(event)
            }
          }
        }
      }).catch(() => {
        // Service worker registration failed - app still works online
      })

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_VERSION') {
          console.debug('SW version:', event.data.version)
        }
      })
    })
  }
})
