import { ref } from 'vue'
import enTranslations from '../locales/en.json'

export type Locale = 'en' | 'es' | 'pt' | 'fr' | 'ja' | 'zh' | 'ar' | 'hi'

export interface Translation {
  [key: string]: string | Translation
}

const localeState = ref<Locale>('en')

const localeIds: Locale[] = ['en', 'es', 'pt', 'fr', 'ja', 'zh', 'ar', 'hi']

const translationCache = new Map<Locale, Translation>()
const failedLocales = new Set<Locale>()
translationCache.set('en', enTranslations as Translation)

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en'

  const stored = localStorage.getItem('eg-maps-locale')
  if (stored && localeIds.includes(stored as Locale)) return stored as Locale

  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('es')) return 'es'
  if (browserLang.startsWith('pt')) return 'pt'
  if (browserLang.startsWith('fr')) return 'fr'
  if (browserLang.startsWith('ja')) return 'ja'
  if (browserLang.startsWith('zh')) return 'zh'
  if (browserLang.startsWith('ar')) return 'ar'
  if (browserLang.startsWith('hi')) return 'hi'

  return 'en'
}

async function loadLocale(locale: Locale, baseURL?: string): Promise<Translation> {
  if (translationCache.has(locale)) {
    return translationCache.get(locale)!
  }
  if (failedLocales.has(locale)) {
    throw new Error(`Failed to load locale: ${locale}`)
  }
  const prefix = baseURL && baseURL !== '/' ? baseURL.replace(/\/+$/, '') : ''
  const response = await fetch(`${prefix}/locales/${locale}.json`)
  if (!response.ok) {
    failedLocales.add(locale)
    throw new Error(`Failed to load locale: ${locale}`)
  }
  const data = await response.json()
  translationCache.set(locale, data)
  return data
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
  const baseURL = useRuntimeConfig().app.baseURL

  // Initialize from localStorage on client-side mount
  if (import.meta.client && localeState.value === 'en') {
    const detected = detectLocale()
    if (detected !== 'en') {
      loadLocale(detected, baseURL).then(() => {
        localeState.value = detected
      })
    }
  }

  function t(key: string, ...args: unknown[]): string {
    const value = lookup(localeState.value, key) ?? lookup('en', key) ?? key
    return interpolate(value, args)
  }

  function setLocale(newLocale: Locale) {
    if (!localeIds.includes(newLocale)) return
    loadLocale(newLocale, baseURL).then(() => {
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
      ja: '日本語',
      zh: '中文',
      ar: 'العربية',
      hi: 'हिन्दी',
    } satisfies Record<Locale, string>,
    setLocale,
  }
}
