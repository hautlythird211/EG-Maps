<script setup lang="ts">
/**
 * LoadingMarkerBubble - Animated loading marker with bubble/pulse effects
 * Modern styling with CSS animations for 60fps performance
 */
import { computed } from 'vue'

interface Props {
  type?: 'project' | 'species' | 'loading' | 'custom'
  size?: 'sm' | 'md' | 'lg'
  color?: string
  showPulse?: boolean
  showRipple?: boolean
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'loading',
  size: 'md',
  showPulse: true,
  showRipple: true,
  animated: true
})

// Size configurations
const sizeConfig = {
  sm: { marker: 24, icon: 12, pulse: 32 },
  md: { marker: 36, icon: 16, pulse: 48 },
  lg: { marker: 48, icon: 24, pulse: 64 }
}

// Computed size
const currentSize = computed(() => sizeConfig[props.size])

// Type colors
const typeColors = {
  project: {
    primary: '#10b981',
    secondary: '#059669',
    glow: 'rgba(16, 185, 129, 0.4)'
  },
  species: {
    primary: '#f59e0b',
    secondary: '#d97706',
    glow: 'rgba(245, 158, 11, 0.4)'
  },
  loading: {
    primary: '#3b82f6',
    secondary: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.4)'
  },
  custom: {
    primary: props.color || '#6366f1',
    secondary: props.color || '#4f46e5',
    glow: props.color ? `${props.color}66` : 'rgba(99, 102, 241, 0.4)'
  }
}

// Computed colors
const colors = computed(() => typeColors[props.type])

// Icon paths based on type
const iconPath = computed(() => {
  switch (props.type) {
    case 'project':
      return 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
    case 'species':
      return 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 3a4 4 0 0 0-4 4 4 4 0 0 0 4 4 4 4 0 0 0 4-4 4 4 0 0 0-4-4z'
    case 'loading':
      return 'M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-5.07l-2.83 2.83M8.76 15.24l-2.83 2.83m12.14 0l-2.83-2.83M8.76 8.76L5.93 5.93'
    default:
      return 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
  }
})
</script>

<template>
  <div
    class="loading-marker-bubble"
    :class="{ animated }"
    :style="{
      '--marker-size': `${currentSize.marker}px`,
      '--icon-size': `${currentSize.icon}px`,
      '--pulse-size': `${currentSize.pulse}px`,
      '--primary-color': colors.primary,
      '--secondary-color': colors.secondary,
      '--glow-color': colors.glow
    }"
  >
    <!-- Ripple effect layer -->
    <div v-if="showRipple" class="ripple-container">
      <div class="ripple ripple-1"></div>
      <div class="ripple ripple-2"></div>
      <div class="ripple ripple-3"></div>
    </div>

    <!-- Pulse ring -->
    <div v-if="showPulse" class="pulse-ring"></div>

    <!-- Main marker bubble -->
    <div class="marker-bubble">
      <svg
        :width="currentSize.icon"
        :height="currentSize.icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="marker-icon"
      >
        <path :d="iconPath" />
      </svg>
    </div>

    <!-- Inner glow -->
    <div class="inner-glow"></div>

    <!-- Selection ring (for hover state) -->
    <div class="selection-ring"></div>
  </div>
</template>

<style scoped>
.loading-marker-bubble {
  position: relative;
  width: var(--marker-size);
  height: var(--marker-size);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Main marker bubble */
.marker-bubble {
  width: var(--marker-size);
  height: var(--marker-size);
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    var(--secondary-color) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 4px 12px var(--glow-color),
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 2px 4px rgba(255, 255, 255, 0.2);
  z-index: 10;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.marker-icon {
  transform: none;
}

/* Inner glow */
.inner-glow {
  position: absolute;
  top: 20%;
  left: 20%;
  width: 30%;
  height: 30%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.4) 0%,
    transparent 70%
  );
  border-radius: 50%;
  pointer-events: none;
}

/* Pulse ring animation */
.pulse-ring {
  position: absolute;
  width: var(--pulse-size);
  height: var(--pulse-size);
  border-radius: 50%;
  border: 2px solid var(--primary-color);
  opacity: 0;
  animation: pulse-ring 2s ease-out infinite;
}

.animated .pulse-ring {
  opacity: 1;
}

/* Ripple container */
.ripple-container {
  position: absolute;
  width: var(--pulse-size);
  height: var(--pulse-size);
  pointer-events: none;
}

.ripple {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid var(--primary-color);
  animation: ripple-expand 3s ease-out infinite;
}

.ripple-1 {
  animation-delay: 0s;
}

.ripple-2 {
  animation-delay: 1s;
}

.ripple-3 {
  animation-delay: 2s;
}

/* Selection ring for hover */
.selection-ring {
  position: absolute;
  width: calc(var(--marker-size) + 8px);
  height: calc(var(--marker-size) + 8px);
  border-radius: 50%;
  border: 2px solid var(--primary-color);
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s ease;
}

/* Hover effects */
.loading-marker-bubble:hover .marker-bubble {
  transform: scale(1.1);
  box-shadow: 
    0 6px 20px var(--glow-color),
    0 4px 8px rgba(0, 0, 0, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.3);
}

.loading-marker-bubble:hover .selection-ring {
  opacity: 1;
  transform: scale(1);
}

/* Animations */
@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

@keyframes ripple-expand {
  0% {
    transform: scale(0.5);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* Staggered ripple animations */
.animated .ripple-1 { animation-delay: 0s; }
.animated .ripple-2 { animation-delay: 0.33s; }
.animated .ripple-3 { animation-delay: 0.66s; }
</style>
