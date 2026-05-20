<template>
  <div class="flex h-screen w-full items-center justify-center bg-black text-white">
    <div class="h-16 w-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 animate-pulse mr-4"></div>
    Redirecting to Project Grants 3D...
  </div>
</template>

<script setup lang="ts">
// This route is kept for backwards compatibility
// Users visiting /globe will be redirected to /project-grants/3d
useHead({ title: 'Redirecting... | Earth Guardians' })
navigateTo('/project-grants/3d', { redirectCode: 301 })
</script>
