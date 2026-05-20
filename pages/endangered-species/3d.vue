<template>
  <ClientOnly>
    <GlobeView :species="speciesData" :default-dataset="'endangered-species'" />
    <template #fallback>
      <div class="flex h-screen w-full items-center justify-center bg-black text-white">
        <div class="h-16 w-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse mr-4"></div>
        Loading Endangered Species Globe...
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import speciesData from '~/public/data/species.json'

useHead({
  title: 'Endangered Species Globe (3D) | Earth Guardians',
  meta: [
    { name: 'description', content: 'Interactive 3D globe of critically endangered species around the world' },
  ],
})
</script>
