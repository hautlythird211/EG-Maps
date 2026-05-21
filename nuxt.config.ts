// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  plugins: ['~/plugins/iconify-icon.client.ts'],

  // Pure SSG - no SSR, fully static for GitHub Pages
  ssr: false,
  routeRules: {
    '/**': { prerender: true },
  },

  // App configuration
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'Earth Guardians - Interactive Data Visualization',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' },
        { name: 'description', content: 'Interactive maps for endangered species and project grants data visualization' },
        { name: 'theme-color', content: '#0a0a0a' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Earth Guardians' },
      ],
      // Inline script to prevent flash of wrong theme - runs before page renders
      script: [
        {
          innerHTML: `(function() {
            try {
              var saved = localStorage.getItem('darkMode');
              if (saved === 'true' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            } catch (e) {}
          })();`,
          type: 'text/javascript',
          tagPosition: 'head',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/eg-logo.png' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      ],
    },
  },

  // Runtime config for API keys
  runtimeConfig: {
    public: {
      maptilerApiKey: process.env.NUXT_PUBLIC_MAPTILER_API_KEY || process.env.MAPTILER_API_KEY || '',
    },
  },

  // CSS - only MapLibre
  css: ['~/assets/css/main.css', 'maplibre-gl/dist/maplibre-gl.css'],

  // Build settings
  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Nitro (static output)
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: ['/', '/info', '/project-grants', '/project-grants/3d', '/endangered-species', '/endangered-species/3d'],
    },
    compressPublicAssets: true,
  },

  // WSL fix: disable vite-node IPC, enforce ws HMR
  experimental: {
    viteNode: false,
    viteEnvironmentApi: true,
    appManifest: false,
  },

  // Vite config for MapLibre + WSL HMR
  vite: {
    optimizeDeps: {
      include: ['maplibre-gl'],
    },
    server: {
      hmr: {
        protocol: 'ws',
        host: 'localhost',
      },
      watch: {
        ignored: ['**/node_modules/**', '**/.git/**', '**/*[*]*/**'],
      },
    },
  },

  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'iconify-icon',
    },
  },
});
