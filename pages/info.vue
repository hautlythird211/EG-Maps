<template>
  <div class="min-h-screen bg-[var(--bg-secondary)] py-12 px-4 relative">
    <!-- Background effects -->
    <div class="fixed inset-0 bg-gradient-to-b from-cyan-950/20 via-purple-950/10 to-emerald-950/20 pointer-events-none" />
    <div class="fixed inset-0 pointer-events-none" style="box-shadow: inset 0 0 200px 50px rgba(0,0,0,0.6)" />

    <div class="max-w-4xl mx-auto relative z-10">
      <!-- Header -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 mb-4 shadow-lg shadow-cyan-500/30 animate-float">
          <Icon name="lucide:info" class="h-10 w-10 text-white" />
        </div>
        <h1 class="text-4xl sm:text-5xl font-bold mb-2">
          <span class="bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            {{ t('home.title') }}
          </span>
        </h1>
        <p class="text-lg text-[var(--text-secondary)]">
          {{ t('home.subtitle') }}
        </p>
      </div>

      <!-- Info Cards -->
      <div class="grid gap-6 mb-12">
        <!-- About Project Grants -->
        <div class="panel-cyber rounded-xl p-6 hover:border-cyan-500/30 transition-colors">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20">
              <Icon name="lucide:hand-heart" class="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-[var(--text-primary)] mb-2">{{ t('info.projectGrants') }}</h2>
              <p class="text-[var(--text-secondary)] mb-4">
                {{ t('info.projectGrantsDesc', { count: projectCount }) }}
              </p>
              <div class="flex flex-wrap gap-3">
                <span class="px-3 py-1 rounded-full text-xs bg-cyan-950/30 text-cyan-400 border border-cyan-900/50">
                  {{ projectCount }} {{ t('info.projects') }}
                </span>
                <span class="px-3 py-1 rounded-full text-xs bg-purple-950/30 text-purple-400 border border-purple-900/50">
                  {{ totalDirectBeneficiaries }} {{ t('info.directBeneficiaries') }}
                </span>
                <span class="px-3 py-1 rounded-full text-xs bg-pink-950/30 text-pink-400 border border-pink-900/50">
                  {{ totalIndirectBeneficiaries }} {{ t('info.indirectBeneficiaries') }}
                </span>
              </div>
              <div class="mt-4 flex gap-2">
                <NuxtLink to="/project-grants" class="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:opacity-90 transition-opacity">
                  {{ t('info.view2dMap') }}
                </NuxtLink>
                <NuxtLink to="/project-grants/3d" class="px-4 py-2 rounded-lg text-sm font-medium bg-black/50 text-cyan-400 border border-cyan-900/50 hover:bg-cyan-950/30 transition-colors">
                  {{ t('info.view3dGlobe') }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- About Endangered Species -->
        <div class="panel-cyber rounded-xl p-6 hover:border-green-500/30 transition-colors">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
              <Icon name="lucide:bird" class="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-[var(--text-primary)] mb-2">{{ t('info.endangeredSpecies') }}</h2>
              <p class="text-[var(--text-secondary)] mb-4">
                {{ t('info.endangeredSpeciesDesc', { speciesCount: speciesCount, groupCount: taxonomicGroupCount }) }}
              </p>
              <div class="flex flex-wrap gap-3">
                <span class="px-3 py-1 rounded-full text-xs bg-green-950/30 text-green-400 border border-green-900/50">
                  {{ speciesCount }} {{ t('info.speciesLabel') }}
                </span>
                <span class="px-3 py-1 rounded-full text-xs bg-emerald-950/30 text-emerald-400 border border-emerald-900/50">
                  {{ taxonomicGroupCount }} {{ t('info.taxonomicGroups') }}
                </span>
                <span class="px-3 py-1 rounded-full text-xs bg-teal-950/30 text-teal-400 border border-teal-900/50">
                  {{ t('info.globalCoverage') }}
                </span>
              </div>
              <div class="mt-4 flex gap-2">
                <NuxtLink to="/endangered-species" class="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:opacity-90 transition-opacity">
                  {{ t('info.view2dMap') }}
                </NuxtLink>
                <NuxtLink to="/endangered-species/3d" class="px-4 py-2 rounded-lg text-sm font-medium bg-black/50 text-green-400 border border-green-900/50 hover:bg-green-950/30 transition-colors">
                  {{ t('info.view3dGlobe') }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback Form -->
      <div class="panel-cyber rounded-xl p-6 mb-8">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Icon name="lucide:message-square" class="h-5 w-5 text-white" />
          </div>
          <h2 class="text-xl font-bold text-[var(--text-primary)]">{{ t('info.feedback') }}</h2>
        </div>

        <form @submit.prevent="submitFeedback" class="space-y-4">
          <div>
            <label for="feedback-name" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              {{ t('info.feedbackName') }}
            </label>
            <input
              id="feedback-name"
              v-model="feedback.name"
              type="text"
              :placeholder="t('info.feedbackNamePlaceholder')"
              class="w-full px-4 py-2 rounded-lg bg-black/50 border border-[var(--border-color)] text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            />
          </div>

          <div>
            <label for="feedback-type" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              {{ t('info.feedbackType') }}
            </label>
            <select
              id="feedback-type"
              v-model="feedback.type"
              class="w-full px-4 py-2 rounded-lg bg-black/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            >
              <option value="bug">{{ t('info.bugReport') }}</option>
              <option value="feature">{{ t('info.featureRequest') }}</option>
              <option value="improvement">{{ t('info.improvementSuggestion') }}</option>
              <option value="general">{{ t('info.generalFeedback') }}</option>
            </select>
          </div>

          <div>
            <label for="feedback-message" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              {{ t('info.yourFeedback') }}
            </label>
            <textarea
              id="feedback-message"
              v-model="feedback.message"
              rows="5"
              maxlength="2000"
              :placeholder="t('info.feedbackPlaceholder')"
              class="w-full px-4 py-2 rounded-lg bg-black/50 border border-[var(--border-color)] text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-colors resize-none"
              required
            />
            <p class="mt-1 text-xs text-[var(--text-secondary)] text-right">
              {{ feedback.message.length }}/2000
            </p>
          </div>

          <button
            type="submit"
            class="w-full px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(6,182,212,0.3)] focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {{ t('info.submitFeedback') }}
          </button>
        </form>

        <!-- Success message -->
        <div v-if="feedbackSubmitted" class="mt-4 p-4 rounded-lg bg-green-950/30 border border-green-900/50 text-green-400">
          <div class="flex items-center gap-2">
            <Icon name="lucide:check-circle" class="h-5 w-5" />
            <span>{{ t('info.feedbackSubmitted') }}</span>
          </div>
        </div>
      </div>

      <!-- Join CTA -->
      <div class="panel-cyber rounded-xl p-6 text-center">
        <h3 class="text-xl font-bold text-[var(--text-primary)] mb-2">{{ t('info.makeDifference') }}</h3>
        <p class="text-[var(--text-secondary)] mb-4">
          {{ t('info.makeDifferenceDesc') }}
        </p>
        <a
          href="https://www.earthguardians.org/crews"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-orange-500 to-red-600 text-white hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(249,115,22,0.3)]"
        >
          <Icon name="lucide:users" class="h-5 w-5" />
          {{ t('info.joinUs') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import speciesData from '~/public/data/species.json'
import { allProjectsData } from '@/lib/project-data'

// i18n
const { t } = useI18n()

useHead({
  title: 'Info & Feedback | Earth Guardians',
  meta: [
    { name: 'description', content: 'Learn about Earth Guardians data visualization platforms and submit feedback' },
    { property: 'og:title', content: 'Info & Feedback | Earth Guardians' },
    { property: 'og:description', content: 'Learn about Earth Guardians data visualization platforms and submit feedback' },
  ],
})

const speciesList = speciesData as Array<{ taxonomicGroup: string }>
const speciesCount = computed(() => speciesList.length)
const taxonomicGroupCount = computed(() => new Set(speciesList.map(s => s.taxonomicGroup)).size)

const projectCount = computed(() => allProjectsData.length)
const totalDirectBeneficiaries = computed(() => allProjectsData.reduce((sum, p) => sum + p.direct_beneficiaries, 0).toLocaleString())
const totalIndirectBeneficiaries = computed(() => allProjectsData.reduce((sum, p) => sum + p.indirect_beneficiaries, 0).toLocaleString())

const feedback = ref({
  name: '',
  type: 'general',
  message: '',
})

const feedbackSubmitted = ref(false)

function submitFeedback() {
  feedback.value.name = feedback.value.name.trim()
  feedback.value.message = feedback.value.message.trim()

  if (!feedback.value.message) return

  console.log('Feedback submitted:', feedback.value)
  feedbackSubmitted.value = true
  setTimeout(() => {
    feedbackSubmitted.value = false
    feedback.value = { name: '', type: 'general', message: '' }
  }, 5000)
}
</script>
