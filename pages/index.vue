<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
    <!-- Hero Section -->
    <header class="relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Earth Guardians
            <span class="text-emerald-600">Maps</span>
          </h1>
          <p class="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Interactive data visualization platform showcasing global conservation projects
            and endangered species around the world.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink
              to="/info"
              class="px-8 py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-colors"
            >
              Suggest a Dataset
            </NuxtLink>
          </div>
        </div>
      </div>
      
      <!-- Animated Globe Preview -->
      <div class="absolute inset-0 pointer-events-none opacity-20">
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400 rounded-full filter blur-3xl animate-pulse"></div>
        <div class="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
      </div>
    </header>

    <!-- Features Section -->
    <section class="py-16 bg-white dark:bg-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center mb-12">Platform Features</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl">
            <div class="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">2D & 3D Maps</h3>
            <p class="text-slate-600 dark:text-slate-400">Interactive maps and globes with satellite imagery and custom layers.</p>
          </div>
          
          <div class="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
            <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">High Performance</h3>
            <p class="text-slate-600 dark:text-slate-400">GPU-accelerated rendering handles 10,000+ markers at 60fps.</p>
          </div>
          
          <div class="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl">
            <div class="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">SSG Compatible</h3>
            <p class="text-slate-600 dark:text-slate-400">Static site generation ready for GitHub Pages deployment.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Links -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-8">
          <NuxtLink
            to="/project-grants/3d"
            class="group p-8 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl text-white hover:shadow-2xl transition-shadow"
          >
            <h3 class="text-2xl font-bold mb-2">3D Globe View</h3>
            <p class="opacity-90">Explore projects on an interactive 3D globe</p>
          </NuxtLink>
          
          <NuxtLink
            to="/endangered-species/3d"
            class="group p-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl text-white hover:shadow-2xl transition-shadow"
          >
            <h3 class="text-2xl font-bold mb-2">Species Globe</h3>
            <p class="opacity-90">View endangered species on a 3D globe</p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-8 bg-slate-100 dark:bg-slate-900">
      <div class="max-w-7xl mx-auto px-4 text-center text-slate-600 dark:text-slate-400">
        <p>Earth Guardians Maps - Interactive Data Visualization Platform</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Earth Guardians Maps - Interactive Data Visualization'
})
</script>
