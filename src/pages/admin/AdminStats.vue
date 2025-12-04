<template>
  <div class="stats-overview">
    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <div class="stat-content">
        <h3>Total Guru</h3>
        <p class="stat-number">{{ stats.totalGuru || 0 }}</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">✅</div>
      <div class="stat-content">
        <h3>Sudah Voting</h3>
        <p class="stat-number">{{ stats.votedCount || 0 }}</p>
        <p class="stat-percentage">{{ stats.participationRate || 0 }}%</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🎫</div>
      <div class="stat-content">
        <h3>Token Tersedia</h3>
        <p class="stat-number">{{ stats.availableTokens || 0 }}</p>
        <p class="stat-sub">dari {{ stats.totalTokens || 0 }}</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">⏰</div>
      <div class="stat-content">
        <h3>Status Sesi</h3>
        <p class="stat-status" :class="votingStatusClass">{{ votingStatusText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({
      totalGuru: 0,
      votedCount: 0,
      participationRate: 0,
      totalTokens: 0,
      availableTokens: 0,
    }),
  },
  activeSession: Object,
})

const votingStatusText = computed(() => {
  if (!props.activeSession) return 'Tidak ada sesi'
  const statusMap = {
    draft: 'DRAFT',
    pendaftaran: 'PENDAFTARAN',
    voting: 'VOTING',
    selesai: 'SELESAI',
  }
  return statusMap[props.activeSession.status] || props.activeSession.status
})

const votingStatusClass = computed(() => {
  if (!props.activeSession) return 'status-draft'
  return `status-${props.activeSession.status}`
})
</script>

<style scoped>
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.stat-content h3 {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 800;
  color: #1e3a8a;
  line-height: 1;
}

.stat-percentage {
  color: #10b981;
  font-weight: 600;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.stat-sub {
  color: #64748b;
  font-size: 0.8rem;
  margin-top: 0.125rem;
}

.stat-status {
  font-weight: 700;
  font-size: 1.1rem;
}

.status-draft {
  color: #64748b;
}

.status-pendaftaran {
  color: #d97706;
}

.status-voting {
  color: #059669;
}

.status-selesai {
  color: #dc2626;
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: 1fr 1fr;
  }

  .stat-card {
    padding: 1.25rem;
  }
}

@media (max-width: 480px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }
}
</style>
