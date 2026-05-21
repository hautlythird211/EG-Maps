<template>
  <ClientOnly>
    <GlobeView :species="speciesList" :default-dataset="'endangered-species'" />
    <template #fallback>
      <div class="flex h-screen w-full items-center justify-center bg-black text-white">
        <LoadingSpinner
          icon="svg-spinners:wind-toy"
          :message="t('loading.endangeredSpeciesGlobe')"
          :inline="true"
        />
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import speciesData from '~/public/data/species.json'

const { t } = useI18n()

useHead({
  title: 'Endangered Species Globe (3D) | Earth Guardians',
  meta: [
    { name: 'description', content: 'Interactive 3D globe of critically endangered species around the world' },
  ],
})

const speciesList = speciesData
</script>
