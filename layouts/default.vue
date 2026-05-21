<template>
  <div class="min-h-[100svh] bg-[var(--bg-secondary)]">
    <slot />

    <!-- Top utility header -->
    <header class="fixed right-[max(0.75rem,env(safe-area-inset-right))] top-[5.35rem] sm:top-[max(5rem,env(safe-area-inset-top))] z-[10000] max-w-[calc(100vw-1.5rem)] sm:right-[max(1rem,env(safe-area-inset-right))]">
      <div :class="headerShellClass">
        <NuxtLink
          v-for="item in headerItems"
          :key="item.path"
          :to="item.path"
          :class="getHeaderItemClass(item.path)"
        >
          <Icon :name="item.icon" class="h-4 w-4" />
          <span class="hidden sm:inline">{{ t(item.labelKey) }}</span>
        </NuxtLink>
        <a
          href="https://www.earthguardians.org/crews"
          target="_blank"
          rel="noopener noreferrer"
          :class="headerUtilityClass"
        >
          <Icon name="lucide:users" class="h-4 w-4" />
          <span class="hidden sm:inline">{{ t('nav.crews') }}</span>
        </a>
      </div>
    </header>

    <!-- Map-focused Dock Navigation -->
    <nav class="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[9999] max-w-[calc(100vw-1.5rem)] -translate-x-1/2">
      <div :class="dockShellClass">
        <div class="flex items-end gap-1" ref="dockRef">
          <template v-for="(item, index) in navItems" :key="item.path || item.external">
            <!-- External link (Join Earth Guardians) -->
            <a
              v-if="item.external"
              :href="item.path"
              target="_blank"
              rel="noopener noreferrer"
              class="group relative flex flex-col items-center"
              :ref="el => { if (el && el.nodeType === 1) dockItemRefs.set(index, el); else dockItemRefs.delete(index) }"
              @mouseenter="onDockHover(index)"
              @mouseleave="onDockLeave()"
            >
              <!-- Tooltip -->
              <div
                :class="[tooltipClass, { 'opacity-100': hoveredIndex === index }]"
              >
                {{ t(item.labelKey) }}
                <div :class="tooltipArrowClass" />
              </div>

              <!-- Icon -->
              <div
                :class="utilityIconClass"
                :style="getItemStyle(index)"
              >
                <Icon :name="item.icon" class="transition-all duration-150" :class="getItemIconClass(index)" />
              </div>
            </a>

            <!-- Internal link -->
            <NuxtLink
              v-else
              :to="item.path"
              class="group relative flex flex-col items-center"
              :ref="el => { if (el && el.nodeType === 1) dockItemRefs.set(index, el); else dockItemRefs.delete(index) }"
              @mouseenter="onDockHover(index)"
              @mouseleave="onDockLeave()"
            >
              <!-- Tooltip -->
              <div
                :class="[tooltipClass, { 'opacity-100': hoveredIndex === index }]"
              >
                {{ t(item.labelKey) }}
                <div :class="tooltipArrowClass" />
              </div>

              <!-- Icon -->
              <div
                class="flex items-center justify-center rounded-xl transition-all duration-150 ease-out"
                :class="isActive(item.path)
                  ? getActiveStyle(item.variant)
                  : inactiveIconClass
                "
                :style="getItemStyle(index)"
              >
                <Icon :name="item.icon" class="transition-all duration-150" :class="getItemIconClass(index)" />
              </div>

              <!-- Active indicator -->
              <div
                v-if="isActive(item.path)"
                class="mt-1 h-1 w-1 rounded-full"
                :class="getActiveIndicatorClass(item.variant)"
              />
            </NuxtLink>
          </template>

          <!-- Separator -->
          <div :class="separatorClass" />

          <!-- Language Switcher -->
          <div class="relative" ref="langDropdownRef">
            <button
              @click="showLangMenu = !showLangMenu"
              class="group relative flex flex-col items-center"
              :ref="el => { if (el && el.nodeType === 1) dockItemRefs.set(navItems.length, el); else dockItemRefs.delete(navItems.length) }"
              @mouseenter="onDockHover(navItems.length)"
              @mouseleave="onDockLeave()"
            >
              <!-- Tooltip -->
              <div
                :class="[tooltipClass, { 'opacity-100': hoveredIndex === navItems.length }]"
              >
                {{ t('nav.language') }}
                <div :class="tooltipArrowClass" />
              </div>

              <div
                :class="utilityIconClass"
                :style="getItemStyle(navItems.length)"
              >
                <Icon name="lucide:languages" class="transition-all duration-150" :class="getItemIconClass(navItems.length)" />
              </div>
            </button>

            <!-- Language dropdown -->
            <Transition name="dropdown">
              <div
                v-if="showLangMenu"
                :class="dropdownClass"
              >
                <button
                  v-for="loc in availableLocales"
                  :key="loc"
                  @click="setLocale(loc); showLangMenu = false"
                  :class="getDropdownItemClass(loc)"
                >
                  <span>{{ localeNames[loc] }}</span>
                  <Icon v-if="locale === loc" name="lucide:check" class="h-3.5 w-3.5" />
                </button>
              </div>
            </Transition>
          </div>

          <!-- Dark mode toggle -->
          <button
            @click="toggleDarkMode"
            class="group relative flex flex-col items-center"
            :ref="el => { if (el && el.nodeType === 1) dockItemRefs.set(navItems.length + 1, el); else dockItemRefs.delete(navItems.length + 1) }"
            @mouseenter="onDockHover(navItems.length + 1)"
            @mouseleave="onDockLeave()"
          >
            <!-- Tooltip -->
            <div
              :class="[tooltipClass, { 'opacity-100': hoveredIndex === navItems.length + 1 }]"
            >
              {{ isDark ? t('nav.switchToLight') : t('nav.switchToDark') }}
              <div :class="tooltipArrowClass" />
            </div>

            <div
              :class="utilityIconClass"
              :style="getItemStyle(navItems.length + 1)"
            >
              <Icon :name="isDark ? 'lucide:sun' : 'lucide:moon'" class="transition-all duration-150" :class="getItemIconClass(navItems.length + 1)" />
            </div>
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const route = useRoute()

// i18n
const { t, locale, availableLocales, localeNames, setLocale } = useI18n()

interface NavItem {
  path: string
  labelKey: string
  icon: string
  variant?: 'cyan' | 'green' | 'purple' | 'orange'
  external?: boolean
}

const navItems: NavItem[] = [
  { path: '/project-grants', labelKey: 'nav.projectGrants', icon: 'lucide:hand-heart', variant: 'purple' },
  { path: '/endangered-species', labelKey: 'nav.endangeredSpecies', icon: 'lucide:bird', variant: 'green' },
]

const headerItems: NavItem[] = [
  { path: '/', labelKey: 'nav.home', icon: 'lucide:home', variant: 'cyan' },
  { path: '/info', labelKey: 'nav.info', icon: 'lucide:info', variant: 'cyan' },
]

const { isDark, toggle: toggleDarkMode } = useDarkMode()

const isHighContrastRoute = computed(() => route.path === '/' || route.path === '/info')
const dockShellClass = computed(() => [
  'max-w-full px-2 py-2 rounded-2xl border shadow-xl backdrop-blur-xl transition-colors duration-200',
  isHighContrastRoute.value
    ? 'bg-white/95 border-black text-black shadow-[0_12px_32px_rgba(0,0,0,0.18)]'
    : 'panel-floating',
])
const headerShellClass = computed(() => [
  'flex max-w-full items-center gap-1 overflow-hidden rounded-xl border px-1.5 py-1.5 shadow-xl backdrop-blur-xl',
  isHighContrastRoute.value
    ? 'bg-white/95 border-black text-black shadow-[0_12px_32px_rgba(0,0,0,0.18)]'
    : 'bg-black/80 border-cyan-900/40 text-cyan-100 shadow-[0_0_18px_rgba(6,182,212,0.16)]',
])
const headerUtilityClass = computed(() => [
  'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors',
  isHighContrastRoute.value
    ? 'text-black hover:bg-black hover:text-white'
    : 'text-cyan-200 hover:bg-cyan-500/15 hover:text-white',
])
const tooltipClass = computed(() => [
  'absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 text-xs font-medium rounded-lg opacity-0 transition-all duration-150 pointer-events-none shadow-lg whitespace-nowrap',
  isHighContrastRoute.value
    ? 'text-white bg-black border border-black'
    : 'text-white bg-gray-900/95 backdrop-blur border border-white/10',
])
const tooltipArrowClass = computed(() => [
  'absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent',
  isHighContrastRoute.value ? 'border-t-black' : 'border-t-gray-900/95',
])
const inactiveIconClass = computed(() =>
  isHighContrastRoute.value
    ? 'bg-white text-black border border-black hover:bg-black hover:text-white'
    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] hover:text-[var(--text-primary)]'
)
const utilityIconClass = computed(() => [
  'flex items-center justify-center rounded-xl transition-all duration-150 ease-out',
  inactiveIconClass.value,
])
const separatorClass = computed(() => [
  'mx-1 h-8 w-px self-center',
  isHighContrastRoute.value ? 'bg-black' : 'bg-[var(--border-color)]',
])
const dropdownClass = computed(() => [
  'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 overflow-hidden rounded-lg shadow-xl min-w-[120px]',
  isHighContrastRoute.value
    ? 'bg-white border-2 border-black'
    : 'bg-gray-900/95 backdrop-blur border border-white/10',
])

// Language dropdown state
const showLangMenu = ref(false)
const langDropdownRef = ref<HTMLElement | null>(null)

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (langDropdownRef.value && !langDropdownRef.value.contains(event.target as Node)) {
    showLangMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  if (path === '/info') return route.path === '/info'
  return route.path.startsWith(path)
}

function getActiveStyle(variant: string = 'cyan') {
  if (isHighContrastRoute.value) {
    return 'bg-black text-white shadow-none'
  }

  const styles: Record<string, string> = {
    cyan: 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30',
    green: 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30',
    purple: 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30',
    orange: 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30',
  }
  return styles[variant] || styles.cyan
}

function getActiveIndicatorClass(variant: string = 'cyan') {
  if (isHighContrastRoute.value) {
    return 'bg-black'
  }

  const classes: Record<string, string> = {
    cyan: 'bg-cyan-400',
    green: 'bg-green-400',
    purple: 'bg-purple-400',
    orange: 'bg-orange-400',
  }
  return classes[variant] || classes.cyan
}

function getDropdownItemClass(loc: string) {
  const base = 'w-full px-3 py-2 text-xs text-left transition-colors flex items-center justify-between'
  if (isHighContrastRoute.value) {
    return `${base} ${locale.value === loc ? 'text-white bg-black' : 'text-black hover:bg-black/10'}`
  }
  return `${base} hover:bg-gray-700/50 ${locale.value === loc ? 'text-cyan-400 bg-cyan-900/20' : 'text-gray-300'}`
}

function getHeaderItemClass(path: string) {
  const base = 'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors'
  if (isHighContrastRoute.value) {
    return `${base} ${isActive(path) ? 'bg-black text-white' : 'text-black hover:bg-black/10'}`
  }
  return `${base} ${isActive(path) ? 'bg-cyan-500/20 text-cyan-200' : 'text-cyan-100 hover:bg-cyan-500/15 hover:text-white'}`
}

// Dock magnification logic
const dockRef = ref<HTMLElement | null>(null)
const dockItemRefs = new Map<number, Element>()
const hoveredIndex = ref<number | null>(null)

const baseSize = 44
const maxSize = 58
const neighborSize = 50

// +2 for language switcher and dark mode
const totalDockItems = computed(() => navItems.length + 2)
const itemSizes = ref<number[]>(Array(totalDockItems.value).fill(baseSize))

function onDockHover(index: number) {
  hoveredIndex.value = index
  const newSizes = [...itemSizes.value]
  for (let i = 0; i < newSizes.length; i++) {
    const distance = Math.abs(i - index)
    if (distance === 0) {
      newSizes[i] = maxSize
    } else if (distance === 1) {
      newSizes[i] = neighborSize
    } else {
      newSizes[i] = baseSize
    }
  }
  itemSizes.value = newSizes
}

function onDockLeave() {
  hoveredIndex.value = null
  itemSizes.value = Array(totalDockItems.value).fill(baseSize)
}

function getItemStyle(index: number) {
  const size = itemSizes.value[index] || baseSize
  return {
    width: `${size}px`,
    height: `${size}px`,
  }
}

function getItemIconClass(index: number) {
  const size = itemSizes.value[index] || baseSize
  if (size >= maxSize) return 'h-7 w-7'
  if (size >= neighborSize) return 'h-6 w-6'
  return 'h-5 w-5'
}
</script>

<style scoped>
nav > div {
  transition: transform 0.2s ease;
}

nav:hover > div {
  transform: scale(1.02);
}
</style>
