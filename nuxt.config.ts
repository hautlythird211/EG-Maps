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
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Interactive data visualization platform for Earth Guardians projects and endangered species' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
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
