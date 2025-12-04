<template>
  <div class="tabs-container">
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="$emit('update:modelValue', tab.id)"
        class="tab-btn"
      >
        {{ tab.label }}
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>
    <div class="tab-indicator" :style="indicatorStyle"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue' // ✅ HAPUS ref dan watch

const props = defineProps({
  modelValue: {
    type: String,
    default: 'session',
  },
  candidateStats: {
    type: Object,
    default: () => ({ pending: 0 }),
  },
  tokenStats: {
    type: Object,
    default: () => ({ availableTokens: 0 }),
  },
})

const emit = defineEmits(['update:modelValue'])

const activeTab = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const tabs = computed(() => [
  { id: 'session', label: 'Kelola Sesi', badge: null },
  {
    id: 'tokens',
    label: 'Token',
    badge: props.tokenStats.availableTokens > 0 ? props.tokenStats.availableTokens : null,
  },
  {
    id: 'candidates',
    label: 'Verifikasi Calon',
    badge: props.candidateStats.pending > 0 ? props.candidateStats.pending : null,
  },
  { id: 'monitor', label: 'Monitoring', badge: null },
])

const indicatorStyle = computed(() => {
  const tabCount = tabs.value.length
  const activeIndex = tabs.value.findIndex((tab) => tab.id === activeTab.value)
  const widthPercent = 100 / tabCount
  const leftPercent = activeIndex * widthPercent

  return {
    width: `${widthPercent}%`,
    left: `${leftPercent}%`,
  }
})
</script>

<style scoped>
.tabs-container {
  position: relative;
  background: white;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tabs {
  display: flex;
  padding: 0.5rem;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  position: relative;
  z-index: 1;
  border-radius: 8px;
}

.tab-btn:hover {
  color: #1e3a8a;
  background: rgba(30, 58, 138, 0.05);
}

.tab-btn.active {
  color: #1e3a8a;
  font-weight: 700;
}

.tab-badge {
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  font-weight: 600;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 3px;
  background: #1e3a8a;
  transition:
    left 0.3s ease,
    width 0.3s ease;
  z-index: 0;
}

@media (max-width: 768px) {
  .tabs {
    flex-wrap: wrap;
  }

  .tab-btn {
    min-width: calc(50% - 0.5rem);
    font-size: 0.9rem;
    padding: 0.75rem 0.5rem;
  }

  .tab-indicator {
    display: none;
  }
}

@media (max-width: 480px) {
  .tab-btn {
    min-width: 100%;
  }
}
</style>
