import { ref, onMounted } from 'vue'

export type Locale = 'en' | 'es' | 'pt' | 'fr'

export interface Translation {
  [key: string]: string | Translation
}

const localeState = ref<Locale>('en')

const localeIds: Locale[] = ['en', 'es', 'pt', 'fr']

const translationCache = new Map<Locale, Translation>()

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en'

  const stored = localStorage.getItem('eg-maps-locale')
  if (stored && localeIds.includes(stored as Locale)) return stored as Locale

  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('es')) return 'es'
  if (browserLang.startsWith('pt')) return 'pt'
  if (browserLang.startsWith('fr')) return 'fr'

  return 'en'
}

async function loadLocale(locale: Locale): Promise<Translation> {
  if (translationCache.has(locale)) {
    return translationCache.get(locale)!
  }
  const response = await fetch(`/locales/${locale}.json`)
  if (!response.ok) {
    throw new Error(`Failed to load locale: ${locale}`)
  }
  const data = await response.json()
  translationCache.set(locale, data)
  return data
}

if (typeof window !== 'undefined') {
  loadLocale('en').catch(() => {})
}

function lookup(locale: Locale, key: string): string | undefined {
  const translations = translationCache.get(locale)
  if (!translations) return undefined
  let value: string | Translation | undefined = translations
  for (const part of key.split('.')) {
    if (!value || typeof value === 'string') return undefined
    value = value[part]
  }
  return typeof value === 'string' ? value : undefined
}

function interpolate(template: string, args: unknown[]): string {
  let result = template

  args.forEach((arg, index) => {
    result = result.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg))
  })

  if (args.length === 1 && args[0] && typeof args[0] === 'object') {
    Object.entries(args[0] as Record<string, unknown>).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
    })
  }

  return result
}

export function useI18n() {
  if (typeof window !== 'undefined' && localeState.value === 'en') {
    const detected = detectLocale()
    if (detected !== 'en') {
      try {
        onMounted(() => {
          loadLocale(detected).then(() => {
            localeState.value = detected
          })
        })
      } catch {
        loadLocale(detected).then(() => {
          localeState.value = detected
        })
      }
    }
  }

  function t(key: string, ...args: unknown[]): string {
    const value = lookup(localeState.value, key) ?? lookup('en', key) ?? key
    return interpolate(value, args)
  }

  function setLocale(newLocale: Locale) {
    if (!localeIds.includes(newLocale)) return
    loadLocale(newLocale).then(() => {
      localeState.value = newLocale
    })
    if (typeof window !== 'undefined') {
      localStorage.setItem('eg-maps-locale', newLocale)
    }
  }

  return {
    locale: localeState,
    t,
    availableLocales: localeIds,
    localeNames: {
      en: 'English',
      es: 'Español',
      pt: 'Português',
      fr: 'Français',
    } satisfies Record<Locale, string>,
    setLocale,
  }
}
