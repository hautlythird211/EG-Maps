<template>
  <div
    :class="`absolute ${isMobile ? 'top-20 left-4 right-4' : 'top-20 left-4'} z-[600] panel-cyber rounded-lg p-3 species-filter-panel transition-all duration-300`"
    :style="{ maxWidth: isMobile ? 'none' : '340px', zIndex: 'var(--z-map-ui-controls)' }"
  >
    <!-- Header -->
    <div class="flex justify-between items-center mb-3">
      <div class="flex items-center gap-2">
        <iconify-icon icon="lucide:filter" class="h-4 w-4 text-cyan-400" />
        <h2 class="text-xs font-heading font-bold text-[var(--text-primary)] tracking-wider uppercase">
          {{ t('filter.filterSpecies') }}
        </h2>
        <span v-if="hasActiveFilters" class="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          {{ activeFilterCount }}
        </span>
      </div>
      <UiButton
        v-if="hasActiveFilters"
        variant="ghost"
        size="sm"
        class="h-6 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded text-xs gap-1"
        @click="resetFilters"
      >
        <iconify-icon icon="lucide:x" class="h-3 w-3" />
        <span>{{ t('filter.reset') }}</span>
      </UiButton>
    </div>

    <!-- Search Input with enhanced UX -->
    <div class="mb-3">
      <div class="relative">
        <iconify-icon icon="lucide:search" class="absolute left-2.5 top-2 h-4 w-4 text-gray-500 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('filter.searchPlaceholder')"
          class="filter-search w-full pl-8 pr-8 py-1.5 bg-black/50 border border-cyan-900/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          :aria-label="t('filter.searchPlaceholder')"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-2.5 top-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-600/50 transition-colors"
        >
          <iconify-icon icon="lucide:x" class="h-3 w-3" />
        </button>
      </div>
    </div>

    <!-- Quick Filter Chips (Top 4 taxonomic groups) -->
    <div class="mb-3 flex flex-wrap gap-1.5" v-if="taxonomicGroups.length > 0">
      <button
        v-for="(group, index) in taxonomicGroups.slice(0, 4)"
        :key="group"
        @click="toggleQuickFilter('taxonomicGroup', group)"
        :class="`px-2 py-1 rounded text-[10px] font-medium transition-all duration-200 ${
          filters.taxonomicGroup === group
            ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
            : 'bg-black/30 text-gray-400 border border-gray-700/50 hover:border-cyan-700/50 hover:text-cyan-400'
        }`"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        {{ group }}
      </button>
      <button
        v-if="taxonomicGroups.length > 4"
        @click="showAllGroups = !showAllGroups"
        class="px-2 py-1 rounded text-[10px] font-medium bg-black/30 text-gray-500 border border-gray-700/50 hover:text-gray-300 transition-colors"
      >
        {{ t('filter.moreGroups', { count: taxonomicGroups.length - 4 }) }}
      </button>
    </div>

    <!-- Expandable all groups -->
    <div v-if="showAllGroups && taxonomicGroups.length > 4" class="mb-3 flex flex-wrap gap-1.5 animate-fade-in">
      <button
        v-for="group in taxonomicGroups.slice(4)"
        :key="group"
        @click="toggleQuickFilter('taxonomicGroup', group)"
        :class="`px-2 py-1 rounded text-[10px] font-medium transition-all duration-200 ${
          filters.taxonomicGroup === group
            ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
            : 'bg-black/30 text-gray-400 border border-gray-700/50 hover:border-cyan-700/50 hover:text-cyan-400'
        }`"
      >
        {{ group }}
      </button>
    </div>

    <!-- Taxonomic Group Filter -->
    <div class="filter-group mb-2.5">
      <label class="filter-label block text-[10px] font-heading font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
        {{ t('filter.taxonomicGroup') }}
      </label>
      <select
        v-model="filters.taxonomicGroup"
        class="filter-select w-full px-2.5 py-1.5 bg-black/50 border border-cyan-900/50 rounded text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all cursor-pointer"
        :aria-label="t('filter.taxonomicGroup')"
      >
        <option value="">{{ t('filter.allGroups') }}</option>
        <option v-for="group in taxonomicGroups" :key="group" :value="group">{{ group }}</option>
      </select>
    </div>

    <!-- Region Filter -->
    <div class="filter-group mb-2.5">
      <label class="filter-label block text-[10px] font-heading font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
        {{ t('filter.region') }}
      </label>
      <select
        v-model="filters.region"
        class="filter-select w-full px-2.5 py-1.5 bg-black/50 border border-cyan-900/50 rounded text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all cursor-pointer"
        :aria-label="t('filter.region')"
      >
        <option value="">{{ t('filter.allRegions') }}</option>
        <option v-for="region in regions" :key="region" :value="region">{{ region }}</option>
      </select>
    </div>

    <!-- Ecosystem Filter -->
    <div class="filter-group mb-2.5">
      <label class="filter-label block text-[10px] font-heading font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
        {{ t('filter.ecosystem') }}
      </label>
      <select
        v-model="filters.ecosystem"
        class="filter-select w-full px-2.5 py-1.5 bg-black/50 border border-cyan-900/50 rounded text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all cursor-pointer"
        :aria-label="t('filter.ecosystem')"
      >
        <option value="">{{ t('filter.allEcosystems') }}</option>
        <option v-for="ecosystem in ecosystems" :key="ecosystem" :value="ecosystem">{{ ecosystem }}</option>
      </select>
    </div>

    <!-- Threat Type Filter -->
    <div class="filter-group mb-3">
      <label class="filter-label block text-[10px] font-heading font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
        {{ t('filter.threatType') }}
      </label>
      <select
        v-model="filters.threatType"
        class="filter-select w-full px-2.5 py-1.5 bg-black/50 border border-cyan-900/50 rounded text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all cursor-pointer"
        :aria-label="t('filter.threatType')"
      >
        <option value="">{{ t('filter.allThreats') }}</option>
        <option v-for="threat in threatTypes" :key="threat" :value="threat">{{ threat }}</option>
      </select>
    </div>

    <!-- Filter Count with progress bar -->
    <div class="filter-count pt-2 border-t border-cyan-900/30">
      <div class="flex items-center justify-between mb-1.5">
        <p class="text-[10px] font-heading font-semibold text-[var(--text-secondary)] tracking-wider">
          {{ t('filter.showing', { count: filteredCount, total: totalCount }) }}
        </p>
        <span class="text-[10px] font-medium text-cyan-400">
          {{ Math.round((filteredCount / totalCount) * 100) }}%
        </span>
      </div>
      <!-- Progress bar -->
      <div class="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300 ease-out"
          :style="{ width: `${(filteredCount / totalCount) * 100}%` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useI18n } from '@/composables/useI18n'
import type { Species } from '@/lib/map-utils'

interface Props {
  species: Species[]
}

const props = withDefaults(defineProps<Props>(), {
  species: () => [],
})

const emit = defineEmits<{
  'filter-change': [filteredSpecies: Species[]]
}>()

const isMobile = useMediaQuery('(max-width: 768px)')

// i18n
const { t } = useI18n()

// Filter state
const filters = reactive({
  taxonomicGroup: '',
  region: '',
  ecosystem: '',
  threatType: '',
})

const searchQuery = ref('')
const showAllGroups = ref(false)

// Extract unique filter values from species data
const taxonomicGroups = computed(() =>
  [...new Set(props.species.map(s => s.taxonomicGroup))].sort()
)

const regions = computed(() =>
  [...new Set(props.species.map(s => s.region))].sort()
)

const ecosystems = computed(() =>
  [...new Set(props.species.map(s => s.ecosystem))].sort()
)

const threatTypes = computed(() => {
  const threats = new Set<string>()
  props.species.forEach(s => {
    if (s.threatTypes) {
      s.threatTypes.forEach(t => threats.add(t))
    }
  })
  return [...threats].sort()
})

// Count active filters
const activeFilterCount = computed(() => {
  let count = 0
  if (filters.taxonomicGroup) count++
  if (filters.region) count++
  if (filters.ecosystem) count++
  if (filters.threatType) count++
  if (searchQuery.value) count++
  return count
})

// Check if any filters are active
const hasActiveFilters = computed(() => activeFilterCount.value > 0)

// Toggle quick filter chip
function toggleQuickFilter(filterKey: keyof typeof filters, value: string) {
  if (filters[filterKey] === value) {
    filters[filterKey] = ''
  } else {
    filters[filterKey] = value
  }
}

// Apply filters to species
const filteredSpecies = computed(() => {
  let result = props.species

  if (filters.taxonomicGroup) {
    result = result.filter(s => s.taxonomicGroup === filters.taxonomicGroup)
  }
  if (filters.region) {
    result = result.filter(s => s.region === filters.region)
  }
  if (filters.ecosystem) {
    result = result.filter(s => s.ecosystem === filters.ecosystem)
  }
  if (filters.threatType) {
    result = result.filter(s => s.threatTypes?.includes(filters.threatType))
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(s =>
      s.commonName.toLowerCase().includes(query) ||
      s.scientificName.toLowerCase().includes(query) ||
      s.region.toLowerCase().includes(query) ||
      s.taxonomicGroup.toLowerCase().includes(query) ||
      s.ecosystem.toLowerCase().includes(query)
    )
  }

  return result
})

const filteredCount = computed(() => filteredSpecies.value.length)
const totalCount = computed(() => props.species.length)

// Emit filtered species when filters change
watch(filteredSpecies, (newFiltered) => {
  emit('filter-change', newFiltered)
}, { immediate: true })

// Reset all filters
function resetFilters() {
  filters.taxonomicGroup = ''
  filters.region = ''
  filters.ecosystem = ''
  filters.threatType = ''
  searchQuery.value = ''
  showAllGroups.value = false
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

<style scoped>
.filter-search::placeholder {
  color: #6b7280;
}

.filter-search:focus {
  border-color: #06b6d4;
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
}

.filter-select option {
  background: #111111;
  color: #e5e5e5;
}

.filter-select:focus {
  border-color: #06b6d4;
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
}

.species-filter-panel {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.species-filter-panel::-webkit-scrollbar {
  width: 3px;
}

.species-filter-panel::-webkit-scrollbar-thumb {
  background: rgba(6, 182, 212, 0.3);
  border-radius: 3px;
}
</style>
