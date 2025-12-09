<template>
  <div class="live-results-hp">
    <!-- Header Simple -->
    <div class="hp-header">
      <div class="header-top">
        <span class="time">{{ currentTime }}</span>
        <button
          @click="refreshData"
          class="refresh-btn"
          :class="{ refreshing: isLoading }"
          :disabled="isLoading"
        >
          {{ isLoading ? '⏳' : '🔄' }}
        </button>
      </div>
      <div class="session-info">
        <span class="status-badge">{{ sessionStatus }}</span>
        <span class="last-update">Update: {{ lastUpdate }}</span>
      </div>
    </div>

    <!-- Kandidat Per Posisi -->
    <div class="position-section" v-for="position in positions" :key="position.id">
      <h3 class="position-title">
        {{ position.name }}
        <span class="total-votes">{{ getTotalVotes(position.id) }} suara</span>
      </h3>

      <div class="candidates-list">
        <div v-if="isLoading" class="loading">Memuat kandidat...</div>

        <div v-else-if="getCandidates(position.id).length === 0" class="empty">
          Belum ada kandidat
        </div>

        <div
          v-else
          v-for="(candidate, index) in getCandidates(position.id)"
          :key="candidate.id"
          class="candidate-card"
          :class="{
            'rank-1': index === 0,
            'rank-2': index === 1,
            'rank-3': index === 2,
            winner: isWinner(candidate.id, position.id),
          }"
        >
          <div class="candidate-rank">#{{ index + 1 }}</div>

          <div class="candidate-main">
            <div class="candidate-name">{{ candidate.name }}</div>
            <div class="candidate-votes">{{ candidate.votes }} suara</div>
          </div>

          <div class="candidate-percentage">{{ getPercentage(candidate.votes, position.id) }}%</div>
        </div>
      </div>
    </div>

    <!-- Statistik -->
    <div class="stats-section">
      <h3>📊 Statistik</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">Total Peserta</div>
          <div class="stat-value">{{ totalVoters }}</div>
        </div>

        <div class="stat-item">
          <div class="stat-label">Sudah Voting</div>
          <div class="stat-value">{{ uniqueVoters }}</div>
        </div>

        <div class="stat-item">
          <div class="stat-label">Partisipasi</div>
          <div class="stat-value">{{ participationRate }}%</div>
        </div>

        <div class="stat-item">
          <div class="stat-label">Total Vote</div>
          <div class="stat-value">{{ totalVotes }}</div>
        </div>
      </div>
    </div>

    <!-- Refresh Float Button -->
    <button
      @click="refreshData"
      class="float-refresh"
      :class="{ refreshing: isLoading }"
      :title="isLoading ? 'Menyegarkan...' : 'Refresh data'"
      :disabled="isLoading"
    >
      {{ isLoading ? '⏳' : '🔄' }}
    </button>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      ⚠️ {{ error }}
      <button @click="refreshData" class="retry-btn">Coba Lagi</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'

// ===== STATE =====
const candidates = ref([])
const totalVoters = ref(0)
const uniqueVoters = ref(0)
const totalVotes = ref(0)
const sessionStatus = ref('MEMUAT...')
const lastUpdate = ref('--:--')
const currentTime = ref('--:--')
const isLoading = ref(false)
const error = ref('')

// ===== POSITIONS =====
const positions = ref([
  { id: 'kesiswaan', name: '👨‍🎓 WAKA KESISWAAN' },
  { id: 'sarpras', name: '🏫 WAKA SARPRAS' },
])

// ===== COMPUTED =====
const participationRate = computed(() => {
  if (totalVoters.value === 0) return 0
  return Math.round((uniqueVoters.value / totalVoters.value) * 100)
})

// ===== METHODS =====
const getCandidates = (positionId) => {
  return candidates.value.filter((c) => c.jabatan === positionId).sort((a, b) => b.votes - a.votes)
}

const getTotalVotes = (positionId) => {
  return getCandidates(positionId).reduce((sum, c) => sum + c.votes, 0)
}

const getPercentage = (votes, positionId) => {
  const total = getTotalVotes(positionId)
  if (total === 0) return 0
  return Math.round((votes / total) * 100)
}

const isWinner = (candidateId, positionId) => {
  const positionCandidates = getCandidates(positionId)
  if (positionCandidates.length === 0) return false

  const maxVotes = Math.max(...positionCandidates.map((c) => c.votes))
  const candidate = positionCandidates.find((c) => c.id === candidateId)
  return candidate?.votes === maxVotes && maxVotes > 0
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  })
}

const refreshData = async () => {
  if (isLoading.value) return

  isLoading.value = true
  error.value = ''

  try {
    // 1. Load session aktif
    const { data: session } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .order('dibuat_pada', { ascending: false })
      .limit(1)
      .single()

    if (session) {
      sessionStatus.value = session.status.toUpperCase()
    }

    // 2. Load kandidat
    const { data: kandidatData } = await supabase
      .from('kandidat')
      .select('*, pengguna:pengguna_id(nama_lengkap)')
      .in('jabatan', ['kesiswaan', 'sarpras'])
      .order('total_suara', { ascending: false })

    if (kandidatData) {
      candidates.value = kandidatData.map((k) => ({
        id: k.id,
        name: k.pengguna?.nama_lengkap || 'Unknown',
        jabatan: k.jabatan,
        votes: k.total_suara || 0,
      }))

      // Hitung total votes
      totalVotes.value = candidates.value.reduce((sum, c) => sum + c.votes, 0)
    }

    // 3. Load total peserta
    const { count: pesertaCount } = await supabase
      .from('pengguna')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    totalVoters.value = pesertaCount || 0

    // 4. Load unique voters
    if (session) {
      const { data: votesData } = await supabase
        .from('suara')
        .select('pemilih_id')
        .eq('sesi_id', session.id)
        .eq('is_draft', false)

      if (votesData) {
        const unique = new Set(votesData.map((v) => v.pemilih_id))
        uniqueVoters.value = unique.size
      }
    }

    // Update timestamp
    lastUpdate.value = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    })

    console.log('✅ HP: Data loaded successfully')
  } catch (error) {
    console.error('❌ HP Error loading data:', error)
    error.value = 'Gagal memuat data. Periksa koneksi internet.'
  } finally {
    isLoading.value = false
  }
}

// ===== LIFECYCLE =====
onMounted(() => {
  // Update waktu setiap menit
  updateTime()
  const timeInterval = setInterval(updateTime, 60000)

  // Load data pertama kali
  refreshData()

  // Auto refresh setiap 20 detik untuk HP
  const refreshInterval = setInterval(refreshData, 20000)

  // Cleanup
  onUnmounted(() => {
    clearInterval(timeInterval)
    clearInterval(refreshInterval)
  })
})
</script>

<style scoped>
/* HANYA TAMBAH STYLE KHUSUS YANG BELUM ADA DI APP.VUE */

.live-results-hp {
  padding: 16px;
  min-height: 100vh;
  padding-bottom: 80px;
}

/* Header khusus HP */
.hp-header {
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.time {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-primary);
}

.session-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.last-update {
  color: var(--color-text-soft);
}

/* Position Section */
.position-section {
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.position-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--color-text);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-votes {
  font-size: 12px;
  color: var(--color-text-soft);
  background: var(--color-bg-mute);
  padding: 4px 8px;
  border-radius: 4px;
}

/* Candidates */
.candidates-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loading,
.empty {
  text-align: center;
  padding: 20px;
  color: var(--color-text-soft);
  font-style: italic;
}

.candidate-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-bg-mute);
  border-radius: 6px;
  border-left: 4px solid transparent;
}

.candidate-card.rank-1 {
  border-left-color: #fbbf24;
  background: rgba(251, 191, 36, 0.05);
}

.candidate-card.rank-2 {
  border-left-color: #94a3b8;
}

.candidate-card.rank-3 {
  border-left-color: #92400e;
}

.candidate-card.winner {
  border-left-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.candidate-rank {
  font-size: 20px;
  font-weight: bold;
  color: var(--color-text-soft);
  min-width: 30px;
}

.candidate-main {
  flex: 1;
}

.candidate-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 2px;
  color: var(--color-text);
}

.candidate-votes {
  font-size: 12px;
  color: var(--color-text-soft);
}

.candidate-percentage {
  font-weight: bold;
  color: var(--color-primary);
  min-width: 50px;
  text-align: right;
}

/* Stats Section */
.stats-section {
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.stats-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--color-text);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  background: var(--color-bg-mute);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-soft);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--color-text);
}

/* Float Button */
.float-refresh {
  position: fixed;
  bottom: 100px; /* Tinggi dari bottom navbar */
  right: 20px;
  width: 56px;
  height: 56px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  z-index: 2000;
}

.float-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.float-refresh.refreshing {
  animation: spin 1s linear infinite;
}

/* Error Message */
.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--color-danger);
  padding: 12px;
  border-radius: 8px;
  margin: 16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.retry-btn {
  background: var(--color-danger);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

/* Animations */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .live-results-hp {
    padding: 12px;
  }

  .position-section,
  .stats-section {
    padding: 12px;
  }

  .stats-grid {
    gap: 8px;
  }

  .stat-item {
    padding: 10px;
  }

  .stat-value {
    font-size: 18px;
  }

  .stat-label {
    font-size: 10px;
  }

  .float-refresh {
    bottom: 70px;
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}
</style>
