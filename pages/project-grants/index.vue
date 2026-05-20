<template>
  <ClientOnly>
    <UnifiedMap :default-dataset="'project-grants'" />
    <template #fallback>
      <div class="flex flex-col h-screen w-full items-center justify-center bg-gradient-to-b from-black via-gray-950 to-black text-white">
        <!-- Animated background rings -->
        <div class="relative mb-8">
          <div class="h-24 w-24 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 animate-pulse"></div>
          <div class="absolute inset-0 h-24 w-24 rounded-full border-2 border-cyan-500/30 animate-ping"></div>
          <div class="absolute -inset-4 h-32 w-32 rounded-full border border-purple-500/20 animate-ping" style="animation-delay: 0.5s"></div>
        </div>
        <h2 class="text-xl font-semibold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Loading Project Grants Map
        </h2>
        <p class="text-sm text-gray-400">Initializing interactive visualization...</p>
        <!-- Progress dots -->
        <div class="flex gap-2 mt-6">
          <div class="h-2 w-2 rounded-full bg-cyan-500 animate-bounce"></div>
          <div class="h-2 w-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 0.2s"></div>
          <div class="h-2 w-2 rounded-full bg-pink-500 animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">

useHead({
  title: 'Project Grants Map (2D) | Earth Guardians',
  meta: [
    { name: 'description', content: 'Interactive 2D map showing Earth Guardians project grants worldwide' },
  ],
})
</script>
