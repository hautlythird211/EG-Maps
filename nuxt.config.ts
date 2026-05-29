// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  
  // SSG (Static Site Generation) for GitHub Pages
  ssr: true,
  nitro: {
    preset: 'static',
    prerender: {
      routes: [
        '/',
        '/project-grants',
        '/project-grants/3d',
        '/endangered-species',
        '/endangered-species/3d',
        '/globe',
        '/info'
      ],
      crawlLinks: true
    }
  },
  
  // Runtime config for public variables
  runtimeConfig: {
    public: {
      maptilerApiKey: process.env.NUXT_PUBLIC_MAPTILER_API_KEY || '',
      baseUrl: process.env.NUXT_APP_BASE_URL || '/'
    }
  },
  
  // App configuration
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'Earth Guardians Maps',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Interactive data visualization platform for Earth Guardians projects and endangered species' },
        { name: 'theme-color', content: '#0a0a0a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Earth Guardians' },
        { name: 'application-name', content: 'Earth Guardians' },
        { name: 'mobile-web-app-capable', content: 'yes' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', href: '/eg-logo.png', sizes: '512x512' },
        { rel: 'apple-touch-icon', href: '/icon-192x140.png', sizes: '192x192' },
        { rel: 'mask-icon', href: '/eg-logo.png', color: '#0a0a0a' },
      ],
    }
  },
  
  // CSS
  css: [
    '~/assets/css/main.css'
  ],
  
  // PostCSS configuration
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  
  // Modules
  modules: [
    '@nuxt/eslint'
  ],
  
  // Vite configuration
  vite: {
    optimizeDeps: {
      include: ['maplibre-gl']
    }
  },
  
  // TypeScript
  typescript: {
    strict: true,
    typeCheck: true
  }
})
