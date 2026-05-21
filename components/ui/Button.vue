<template>
  <button
    ref="buttonRef"
    :class="buttonClasses"
    :disabled="disabled"
    :type="type"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'cyber' | 'cyber-primary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  disabled: false,
  type: 'button',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonRef = ref<HTMLButtonElement | null>(null)

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

  const variants: Record<string, string> = {
    default: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90',
    destructive: 'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90',
    outline: 'border border-[var(--border)] bg-transparent hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
    secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-80',
    ghost: 'hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
    link: 'text-[var(--primary)] underline-offset-4 hover:underline',
    // EG-Maps custom variants
    cyber: 'bg-black/70 border border-cyan-900/50 text-cyan-400 hover:bg-cyan-950/30 hover:text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
    'cyber-primary': 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:opacity-90 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
  }

  const sizes: Record<string, string> = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  }

  return cn(base, variants[props.variant], sizes[props.size], props.class)
})

function handleClick(event: MouseEvent) {
  emit('click', event)
}
</script>
