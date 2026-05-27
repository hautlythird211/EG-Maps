<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-emerald-600 text-white p-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="text-2xl font-bold">Project Grants</span>
        </NuxtLink>
        <div class="flex gap-4">
          <NuxtLink to="/project-grants/3d" class="px-4 py-2 bg-emerald-700 rounded-lg hover:bg-emerald-800">
            3D View
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Map Container -->
    <div class="flex-1 relative">
      <UnifiedMapOptimized
        :data-source="'projects'"
        :max-entities="10000"
        @load-complete="onLoadComplete"
        @entity-click="onEntityClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Entity } from '~/lib/types'

const onLoadComplete = (count: number) => {
  console.log(`Loaded ${count} project entities`)
}

const onEntityClick = (entity: Entity) => {
  console.log('Project clicked:', entity)
}

useHead({
  title: 'Project Grants - Earth Guardians Maps'
})
</script>
