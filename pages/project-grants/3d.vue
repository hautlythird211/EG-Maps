<template>
  <ClientOnly>
    <GlobeView :default-dataset="'project-grants'" />
    <template #fallback>
      <div class="flex h-screen w-full items-center justify-center bg-black text-white">
        <div class="h-16 w-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 animate-pulse mr-4"></div>
        Loading Project Grants Globe...
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">

useHead({
  title: 'Project Grants Globe (3D) | Earth Guardians',
  meta: [
    { name: 'description', content: 'Interactive 3D globe showing Earth Guardians project grants worldwide' },
  ],
})
</script>
