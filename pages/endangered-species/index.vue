<template>
  <div class="h-screen flex flex-col">
    <header class="bg-blue-600 text-white p-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="text-2xl font-bold">Endangered Species</span>
        </NuxtLink>
        <div class="flex gap-4">
          <NuxtLink to="/endangered-species/3d" class="px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-800">
            3D View
          </NuxtLink>
        </div>
      </div>
    </header>

    <div class="flex-1 relative">
      <UnifiedMapOptimized
        :data-source="'species'"
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
  console.log(`Loaded ${count} species entities`)
}

const onEntityClick = (entity: Entity) => {
  console.log('Species clicked:', entity)
}

useHead({
  title: 'Endangered Species - Earth Guardians Maps'
})
</script>
