<script setup lang="ts">
/**
 * AnimatedGlobeLoader - 60fps animated loading globe with particle effects
 * Smooth transitions and dynamic visual feedback during data loading
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  size?: number
  progress?: number
  showProgress?: boolean
  animated?: boolean
  colorScheme?: 'earth' | 'ocean' | 'forest' | 'sunset'
}

const props = withDefaults(defineProps<Props>(), {
  size: 120,
  progress: 0,
  showProgress: true,
  animated: true,
  colorScheme: 'earth'
})

const emit = defineEmits<{
  complete: []
}>()

// Animation state
const animationFrame = ref(0)
const rotation = ref(0)
const particleProgress = ref(0)
const isComplete = ref(false)

// Color schemes
const colorSchemes = {
  earth: {
    primary: '#10b981',
    secondary: '#3b82f6',
    accent: '#f59e0b',
    glow: 'rgba(16, 185, 129, 0.4)',
    particles: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']
  },
  ocean: {
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    accent: '#8b5cf6',
    glow: 'rgba(14, 165, 233, 0.4)',
    particles: ['#0ea5e9', '#06b6d4', '#22d3ee', '#a855f7']
  },
  forest: {
    primary: '#22c55e',
    secondary: '#16a34a',
    accent: '#84cc16',
    glow: 'rgba(34, 197, 94, 0.4)',
    particles: ['#22c55e', '#16a34a', '#84cc16', '#eab308']
  },
  sunset: {
    primary: '#f97316',
    secondary: '#ef4444',
    accent: '#eab308',
    glow: 'rgba(249, 115, 22, 0.4)',
    particles: ['#f97316', '#ef4444', '#eab308', '#ec4899']
  }
}

// Computed colors
const colors = computed(() => colorSchemes[props.colorScheme])

// Animation particles
const particles = ref<Array<{
  angle: number
  radius: number
  size: number
  speed: number
  opacity: number
  color: string
}>>([])

let animationId: number | null = null

/**
 * Initialize particles
 */
const initParticles = () => {
  const particleCount = 20
  particles.value = Array.from({ length: particleCount }, (_, i) => ({
    angle: (360 / particleCount) * i,
    radius: 45 + Math.random() * 10,
    size: 2 + Math.random() * 3,
    speed: 0.5 + Math.random() * 1,
    opacity: 0.3 + Math.random() * 0.5,
    color: colors.value.particles[i % colors.value.particles.length]
  }))
}

/**
 * Animation loop - 60fps target
 */
const animate = () => {
  if (!props.animated) return

  animationFrame.value++
  
  // Rotation animation
  rotation.value = (rotation.value + 0.5) % 360
  
  // Particle animation
  particles.value.forEach(p => {
    p.angle = (p.angle + p.speed) % 360
  })

  // Progress-based glow
  particleProgress.value = props.progress / 100

  // Continue animation
  animationId = requestAnimationFrame(animate)
}

/**
 * SVG arc path generator
 */
const describeArc = (startAngle: number, endAngle: number, radius: number) => {
  const start = polarToCartesian(0, 0, radius, endAngle)
  const end = polarToCartesian(0, 0, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ')
}

/**
 * Polar to cartesian conversion
 */
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  }
}

// Progress arc calculations
const progressArc = computed(() => {
  const progressAngle = (props.progress / 100) * 360
  return describeArc(0, progressAngle, 42)
})

// Glow filter
const glowFilter = computed(() => {
  const intensity = 10 + (particleProgress.value * 10)
  return `blur(${intensity}px)`
})

// Check completion
const checkComplete = () => {
  if (props.progress >= 100 && !isComplete.value) {
    isComplete.value = true
    emit('complete')
  }
}

watch(() => props.progress, checkComplete)

onMounted(() => {
  initParticles()
  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<template>
  <div class="animated-globe-loader" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      class="globe-svg"
    >
      <!-- Defs for filters and gradients -->
      <defs>
        <!-- Glow filter -->
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Gradient for globe -->
        <radialGradient id="globeGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" :stop-color="colors.secondary" stop-opacity="0.9" />
          <stop offset="100%" :stop-color="colors.primary" stop-opacity="0.7" />
        </radialGradient>

        <!-- Progress gradient -->
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="colors.primary" />
          <stop offset="100%" :stop-color="colors.accent" />
        </linearGradient>
      </defs>

      <!-- Background glow -->
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="size * 0.35"
        :fill="colors.glow"
        :filter="`url(#glow)`"
        class="bg-glow"
      />

      <!-- Rotating particles -->
      <g :transform="`rotate(${rotation} ${size / 2} ${size / 2})`">
        <circle
          v-for="(particle, index) in particles"
          :key="index"
          :cx="size / 2 + Math.cos((particle.angle * Math.PI) / 180) * particle.radius"
          :cy="size / 2 + Math.sin((particle.angle * Math.PI) / 180) * particle.radius"
          :r="particle.size"
          :fill="particle.color"
          :opacity="particle.opacity"
          class="particle"
        />
      </g>

      <!-- Globe base -->
      <circle
        :cx="size / 2"
        :cy="size / 2"
        r="38"
        fill="url(#globeGradient)"
        class="globe-base"
      />

      <!-- Globe grid lines (lat/long) -->
      <g class="grid-lines" :opacity="0.3">
        <ellipse
          v-for="i in 4"
          :key="`lat-${i}`"
          :cx="size / 2"
          :cy="size / 2"
          rx="38"
          :ry="20 + i * 5"
          fill="none"
          stroke="#fff"
          :stroke-width="0.5"
        />
        <ellipse
          v-for="i in 3"
          :key="`long-${i}`"
          :cx="size / 2"
          :cy="size / 2"
          :rx="15 + i * 8"
          ry="38"
          fill="none"
          stroke="#fff"
          :stroke-width="0.5"
        />
      </g>

      <!-- Progress ring background -->
      <circle
        :cx="size / 2"
        :cy="size / 2"
        r="45"
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        stroke-width="3"
      />

      <!-- Progress ring -->
      <path
        v-if="showProgress"
        :d="progressArc"
        fill="none"
        stroke="url(#progressGradient)"
        stroke-width="4"
        stroke-linecap="round"
        class="progress-ring"
        :transform="`translate(${size / 2} ${size / 2}) rotate(-90)`"
      />

      <!-- Center dot -->
      <circle
        :cx="size / 2"
        :cy="size / 2"
        r="4"
        :fill="colors.accent"
        class="center-dot"
      />
    </svg>

    <!-- Progress text -->
    <div v-if="showProgress" class="progress-text">
      <span class="progress-value">{{ Math.round(progress) }}%</span>
    </div>
  </div>
</template>

<style scoped>
.animated-globe-loader {
  display: inline-block;
  position: relative;
}

.globe-svg {
  display: block;
}

.globe-base {
  animation: pulse 2s ease-in-out infinite;
}

.bg-glow {
  animation: glow-pulse 2s ease-in-out infinite;
}

.particle {
  animation: particle-twinkle 1.5s ease-in-out infinite;
}

.progress-ring {
  transition: stroke-dasharray 0.1s ease-out;
}

.center-dot {
  animation: dot-pulse 1.5s ease-in-out infinite;
}

.progress-text {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.02);
    opacity: 1;
  }
}

@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

@keyframes particle-twinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.5);
  }
}

@keyframes dot-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 currentColor;
  }
  50% {
    transform: scale(1.2);
    box-shadow: 0 0 8px 2px currentColor;
  }
}
</style>
