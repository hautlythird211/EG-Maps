<template>
  <component :is="iconComponent" :class="$props.class" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as LucideIcons from 'lucide-vue-next'

const props = defineProps<{
  name: string
  class?: string
}>()

const iconComponent = computed(() => {
  // Handle format like "lucide:hand-heart" or just "hand-heart"
  const iconName = props.name.replace('lucide:', '')
  
  // Convert kebab-case to PascalCase (e.g., "hand-heart" -> "HandHeart")
  const pascalCaseName = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  
  const icon = (LucideIcons as Record<string, any>)[pascalCaseName]
  
  if (!icon) {
    console.warn(`Icon "${props.name}" not found in lucide-vue-next`)
    return null
  }
  
  return icon
})
</script>
