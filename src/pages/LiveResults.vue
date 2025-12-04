<template>
  <div class="live-results" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- Connection Status -->
    <div class="connection-status" :class="{ connected: isConnected }">
      <div class="status-indicator">
        <span class="status-dot"></span>
        <span class="status-text">
          {{ isConnected ? '🔗 LIVE CONNECTED' : '🔌 CONNECTING...' }}
        </span>
        <span class="status-details">
          <span v-if="updatesPerSecond > 0" class="updates-count">
            {{ updatesPerSecond }}/detik
          </span>
          <span v-if="latency > 0" class="latency">Ping: {{ latency }}ms</span>
        </span>
      </div>
    </div>

    <!-- Loader -->
    <div v-if="loading" class="loader-overlay">
      <div class="loader-container">
        <div class="loader-spinner"></div>
        <p class="loader-text">Memuat sistem voting multi-putaran...</p>
        <div class="loader-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="results-wrapper">
      <!-- Header -->
      <div class="header-section">
        <div class="header-main">
          <div class="session-info">
            <h1 class="title-main">🗳️ SISTEM VOTING MULTI-PUTARAN</h1>
            <h2 class="title-sub">{{ activeSession?.nama_sesi || 'Sesi Pemilihan' }}</h2>
            <div class="session-meta">
              <span class="meta-item">
                <span class="meta-icon">📅</span>
                {{ currentDate }}
              </span>
              <span class="meta-item">
                <span class="meta-icon">📍</span>
                SMAN 2 Bandar Lampung
              </span>
            </div>
          </div>

          <div class="header-right">
            <!-- Round Indicator -->
            <div class="round-container" :class="roundStatusClass">
              <div class="round-badge">
                <span class="round-icon">🔄</span>
                <span class="round-text">PUTARAN {{ votingRound }}</span>
              </div>
              <div class="round-stats">
                <div class="stat-item winners">
                  <span class="stat-icon">✅</span>
                  <span class="stat-value">{{ winners.length }}</span>
                  <span class="stat-label">/4</span>
                </div>
                <div class="stat-item runoffs" v-if="runoffs.length > 0">
                  <span class="stat-icon">🔄</span>
                  <span class="stat-value">{{ runoffs.length }}</span>
                  <span class="stat-label">run-off</span>
                </div>
              </div>
            </div>

            <!-- Live Indicator -->
            <div class="live-indicator">
              <span class="live-dot"></span>
              <span class="live-text">LIVE STREAMING</span>
              <span class="update-badge">
                <span class="update-icon">⚡</span>
                {{ lastUpdateTime }}
              </span>
            </div>
          </div>
        </div>

        <!-- Real-time Stats -->
        <div class="realtime-stats">
          <div class="stat-card" v-for="stat in realtimeStats" :key="stat.id">
            <div class="stat-icon">{{ stat.icon }}</div>
            <div class="stat-content">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-trend" v-if="stat.trend" :class="stat.trendClass">
                {{ stat.trend }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Winners Banner -->
      <div v-if="winners.length > 0" class="winners-banner">
        <div class="banner-header">
          <span class="banner-icon">🏆</span>
          <h3>PEMENANG PUTARAN {{ votingRound }}</h3>
          <span class="banner-icon">🏆</span>
        </div>
        <div class="winners-grid">
          <div v-for="winner in winners" :key="winner.jabatan" class="winner-card">
            <div class="winner-jabatan">{{ formatJabatan(winner.jabatan) }}</div>
            <div class="winner-name">{{ winner.kandidat.nama_lengkap }}</div>
            <div class="winner-votes">
              {{ winner.kandidat.total_suara }} suara ({{ winner.percentage }}%)
            </div>
            <div class="winner-badge">
              <span v-if="winner.percentage > 50">✅ MENANG</span>
              <span v-else>📊 LEADING</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Position Tabs -->
      <div class="jabatan-tabs">
        <button
          v-for="jabatan in ['kurikulum', 'kesiswaan', 'sarpras', 'humas']"
          :key="jabatan"
          class="tab-button"
          :class="{
            active: activeJabatan === jabatan,
            winner: winners.some((w) => w.jabatan === jabatan),
            runoff: runoffs.some((r) => r.jabatan === jabatan),
          }"
          @click="activeJabatan = jabatan"
        >
          <span class="tab-icon">
            <span v-if="winners.some((w) => w.jabatan === jabatan)">🏆</span>
            <span v-else-if="runoffs.some((r) => r.jabatan === jabatan)">🔄</span>
            <span v-else>📊</span>
          </span>
          <span class="tab-label">{{ formatJabatan(jabatan) }}</span>
          <span class="tab-badge"> {{ getPositionStats(jabatan).candidateCount }} kandidat </span>
        </button>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Left Column: Position Leaderboard -->
        <div class="column-left">
          <div class="card position-leaderboard-card">
            <div class="card-header">
              <h3>{{ formatJabatan(activeJabatan) }}</h3>
              <div class="card-actions">
                <button
                  class="btn-action"
                  @click="toggleFullscreen"
                  :title="isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'"
                >
                  <span class="action-icon">{{ isFullscreen ? '📱' : '🖥️' }}</span>
                </button>
                <button
                  class="btn-action"
                  @click="toggleSound"
                  :title="soundEnabled ? 'Mute Sound' : 'Unmute Sound'"
                >
                  <span class="action-icon">{{ soundEnabled ? '🔊' : '🔇' }}</span>
                </button>
              </div>
            </div>

            <!-- Position Stats -->
            <div class="position-stats-summary">
              <div class="position-stat">
                <div class="stat-value">{{ getPositionStats(activeJabatan).totalVotes }}</div>
                <div class="stat-label">Total Suara</div>
              </div>
              <div class="position-stat">
                <div class="stat-value">{{ activePositionStats.participation }}%</div>
                <div class="stat-label">Partisipasi</div>
              </div>
              <div class="position-stat" v-if="activePositionStats.leading">
                <div class="stat-value">{{ activePositionStats.leading.total_suara }}</div>
                <div class="stat-label">Pemimpin</div>
              </div>
              <div class="position-stat" v-if="activePositionStats.margin > 0">
                <div class="stat-value">+{{ activePositionStats.margin }}</div>
                <div class="stat-label">Selisih</div>
              </div>
            </div>

            <!-- Live Vote Counter -->
            <div
              class="live-vote-counter"
              v-if="latestVote && latestVote.jabatan === activeJabatan"
            >
              <div class="vote-alert">
                <span class="alert-icon">🎉</span>
                <div class="alert-content">
                  <strong>VOTE BARU!</strong>
                  <p>{{ latestVote.pemilih_nama }} memilih {{ latestVote.kandidat_nama }}</p>
                </div>
                <span class="alert-time">{{ formatTimeAgo(latestVote.timestamp) }}</span>
              </div>
            </div>

            <!-- Position Candidates -->
            <div class="position-candidates">
              <div
                v-for="(candidate, index) in candidatesByJabatan[activeJabatan]"
                :key="candidate.id"
                class="position-candidate-row"
                :class="{
                  'first-place': index === 0,
                  'second-place': index === 1,
                  winner: winners.some(
                    (w) => w.jabatan === activeJabatan && w.kandidat.id === candidate.id,
                  ),
                  'vote-animation': recentVotes.includes(candidate.id),
                }"
              >
                <div class="row-rank">#{{ index + 1 }}</div>
                <div class="row-avatar">{{ getInitials(candidate.nama_lengkap) }}</div>
                <div class="row-info">
                  <div class="row-name">{{ candidate.nama_lengkap }}</div>
                  <div class="row-meta">
                    <span class="meta-votes">{{ candidate.total_suara }} suara</span>
                    <span class="meta-separator">•</span>
                    <span class="meta-percentage">{{ candidate.percentage }}%</span>
                  </div>
                </div>
                <div class="row-status">
                  <span
                    v-if="
                      winners.some(
                        (w) => w.jabatan === activeJabatan && w.kandidat.id === candidate.id,
                      )
                    "
                    class="status-winner"
                  >
                    🏆
                  </span>
                  <span
                    v-else-if="
                      runoffs.some(
                        (r) =>
                          r.jabatan === activeJabatan &&
                          r.kandidats.some((k) => k.id === candidate.id),
                      )
                    "
                    class="status-runoff"
                  >
                    🔄
                  </span>
                  <span v-else class="status-active">
                    {{ index === 0 ? '👑' : '📈' }}
                  </span>
                </div>
                <div class="row-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: candidate.percentage + '%' }"></div>
                  </div>
                </div>
                <div class="row-change" v-if="candidate.voteChange > 0">
                  +{{ candidate.voteChange }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Stats & Activity -->
        <div class="column-right">
          <!-- Round Progress -->
          <div class="card round-progress-card">
            <div class="card-header">
              <h3>📊 PROGRES PUTARAN</h3>
              <div class="progress-badge" :class="roundProgressStatus">
                {{ roundProgressLabel }}
              </div>
            </div>
            <div class="round-progress-content">
              <!-- Progress Bars for Each Position -->
              <div
                v-for="jabatan in ['kurikulum', 'kesiswaan', 'sarpras', 'humas']"
                :key="jabatan"
                class="position-progress-item"
                @click="activeJabatan = jabatan"
              >
                <div class="position-header">
                  <span class="position-icon">
                    <span v-if="winners.some((w) => w.jabatan === jabatan)">✅</span>
                    <span v-else-if="runoffs.some((r) => r.jabatan === jabatan)">🔄</span>
                    <span v-else>📊</span>
                  </span>
                  <span class="position-name">{{ formatJabatan(jabatan) }}</span>
                </div>
                <div class="position-progress">
                  <div class="progress-bar small">
                    <div
                      class="progress-fill"
                      :style="{ width: getPositionProgress(jabatan) + '%' }"
                    ></div>
                  </div>
                  <div class="progress-text">{{ getPositionStats(jabatan).totalVotes }} suara</div>
                </div>
                <div class="position-result">
                  <span v-if="winners.some((w) => w.jabatan === jabatan)" class="result-winner">
                    {{
                      winners
                        .find((w) => w.jabatan === jabatan)
                        ?.kandidat.nama_lengkap.split(' ')[0]
                    }}
                  </span>
                  <span
                    v-else-if="runoffs.some((r) => r.jabatan === jabatan)"
                    class="result-runoff"
                  >
                    RUN-OFF
                  </span>
                  <span v-else class="result-active"> PROSES </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Live Activity Feed -->
          <div class="card activity-card">
            <div class="card-header">
              <h3>🔄 AKTIVITAS LIVE</h3>
              <span class="activity-badge">{{ activityLog.length }}</span>
            </div>
            <div class="activity-feed">
              <div v-if="activityLog.length === 0" class="empty-activity">
                <p>Menunggu aktivitas voting...</p>
              </div>
              <div v-else class="activity-list">
                <div
                  v-for="activity in activityLog.slice(0, 8)"
                  :key="activity.id"
                  class="activity-item"
                  :class="activity.type"
                >
                  <div class="activity-icon">
                    <span v-if="activity.type === 'vote'">🗳️</span>
                    <span v-if="activity.type === 'rank_change'">🔄</span>
                    <span v-if="activity.type === 'milestone'">🎯</span>
                    <span v-if="activity.type === 'winner'">🏆</span>
                    <span v-if="activity.type === 'info'">ℹ️</span>
                  </div>
                  <div class="activity-content">
                    <p class="activity-message">{{ activity.message }}</p>
                    <div class="activity-meta">
                      <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
                      <span class="activity-live" v-if="activity.live">LIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Round Summary -->
          <div class="card round-summary-card">
            <div class="card-header">
              <h3>📋 RINGKASAN PUTARAN</h3>
            </div>
            <div class="round-summary">
              <div class="summary-item">
                <div class="summary-label">Putaran Saat Ini</div>
                <div class="summary-value">{{ votingRound }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Pemenang</div>
                <div class="summary-value">{{ winners.length }} dari 4</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Run-off</div>
                <div class="summary-value">{{ runoffs.length }} posisi</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Vote</div>
                <div class="summary-value">{{ totalVotesAllPositions }}</div>
              </div>
            </div>
            <div class="round-actions" v-if="isAdmin">
              <button
                class="btn-round-action"
                @click="startNextRound"
                v-if="votingRound === 1 && runoffs.length > 0"
              >
                Mulai Putaran 2
              </button>
              <button class="btn-round-action" @click="endVoting" v-if="winners.length === 4">
                Selesaikan Voting
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer with Status -->
      <div class="footer-section">
        <div class="footer-left">
          <div class="voting-status">
            <div class="status-icon">🎯</div>
            <div class="status-info">
              <div class="status-title">Status Voting Multi-Putaran</div>
              <div class="status-details">
                <span class="detail-item">
                  <span class="detail-label">Putaran:</span>
                  <span class="detail-value">{{ votingRound }}</span>
                </span>
                <span class="detail-item">
                  <span class="detail-label">Pemenang:</span>
                  <span class="detail-value">{{ winners.length }}/4 posisi</span>
                </span>
                <span class="detail-item">
                  <span class="detail-label">Total Vote:</span>
                  <span class="detail-value">{{ totalVotesAllPositions }}</span>
                </span>
                <span class="detail-item">
                  <span class="detail-label">Update:</span>
                  <span class="detail-value">{{ lastUpdateTime }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="footer-right">
          <div class="system-info">
            <span class="info-item">SMANDA VOTE v2.1</span>
            <span class="info-separator">•</span>
            <span class="info-item">Multi-Round System</span>
            <span class="info-separator">•</span>
            <span class="info-item">{{ currentTime }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sound Notification -->
    <audio ref="notificationSound" preload="auto"></audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'

// ===== STATE MANAGEMENT =====
const loading = ref(true)
const isConnected = ref(false)
const isFullscreen = ref(false)
const soundEnabled = ref(true)
const latency = ref(0)
const connectionStartTime = ref(null)
const realtimeSubscription = ref(null)

// Multi-round voting states
const votingRound = ref(1)
const activeJabatan = ref('kurikulum')
const isAdmin = ref(false) // Set based on user role

// Data States
const activeSession = ref(null)
const candidates = ref([])

// Stats
const stats = ref({
  totalGuru: 0,
  votedCount: 0,
  pendingCount: 0,
  participationRate: 0,
})

// Real-time tracking
const latestVote = ref(null)
const recentVotes = ref([])
const voteChange = ref(0)
const activityLog = ref([])
const connectionErrors = ref(0)

// Audio
const notificationSound = ref(null)

// ===== COMPUTED PROPERTIES =====

// Group candidates by position
const candidatesByJabatan = computed(() => {
  const grouped = {
    kurikulum: [],
    kesiswaan: [],
    sarpras: [],
    humas: [],
  }

  candidates.value.forEach((candidate) => {
    if (grouped[candidate.jabatan]) {
      // Calculate percentage for this position
      const positionCandidates = grouped[candidate.jabatan]
      const totalVotesPosition = [...positionCandidates, candidate].reduce(
        (sum, k) => sum + (k.total_suara || 0),
        0,
      )

      const percentage =
        totalVotesPosition > 0 ? Math.round((candidate.total_suara / totalVotesPosition) * 100) : 0

      grouped[candidate.jabatan].push({
        ...candidate,
        percentage,
      })
    }
  })

  // Sort by votes (descending) within each position
  Object.keys(grouped).forEach((jabatan) => {
    grouped[jabatan].sort((a, b) => b.total_suara - a.total_suara)
  })

  return grouped
})

// Cari pemenang (>50% threshold)
const winners = computed(() => {
  const result = []

  Object.keys(candidatesByJabatan.value).forEach((jabatan) => {
    const kandidats = candidatesByJabatan.value[jabatan]
    if (kandidats.length === 0) return

    const totalVotes = kandidats.reduce((sum, k) => sum + (k.total_suara || 0), 0)
    if (totalVotes === 0) return

    kandidats.forEach((k) => {
      const percentage = (k.total_suara / totalVotes) * 100
      // PASTIKAN LEBIH DARI 50%, BUKAN SAMA DENGAN
      if (percentage > 50) {
        result.push({
          jabatan,
          kandidat: k,
          percentage: Math.round(percentage),
        })
      }
    })
  })

  return result
})
// Check positions needing run-off
const runoffs = computed(() => {
  const result = []

  Object.keys(candidatesByJabatan.value).forEach((jabatan) => {
    const kandidats = candidatesByJabatan.value[jabatan]
    if (kandidats.length === 0) return

    // Skip if already has winner
    const hasWinner = winners.value.some((w) => w.jabatan === jabatan)
    if (hasWinner) return

    // Need at least 2 candidates for run-off
    if (kandidats.length >= 2) {
      const top2 = kandidats.slice(0, 2)
      const totalVotesTop2 = top2.reduce((sum, k) => sum + k.total_suara, 0)

      result.push({
        jabatan,
        kandidats: top2,
        totalVotes: totalVotesTop2,
      })
    }
  })

  return result
})

// Position stats
const getPositionStats = (jabatan) => {
  const kandidats = candidatesByJabatan.value[jabatan] || []
  const totalVotes = kandidats.reduce((sum, k) => sum + (k.total_suara || 0), 0)

  return {
    totalVotes,
    candidateCount: kandidats.length,
    hasWinner: winners.value.some((w) => w.jabatan === jabatan),
    needsRunoff: runoffs.value.some((r) => r.jabatan === jabatan),
  }
}

// Active position stats
const activePositionStats = computed(() => {
  const kandidats = candidatesByJabatan.value[activeJabatan.value] || []
  const totalVotes = kandidats.reduce((sum, k) => sum + k.total_suara, 0)

  return {
    totalVotes,
    participation:
      stats.value.totalGuru > 0 ? Math.round((totalVotes / stats.value.totalGuru) * 100) : 0,
    leading: kandidats[0] || null,
    margin:
      kandidats.length >= 2
        ? (kandidats[0]?.total_suara || 0) - (kandidats[1]?.total_suara || 0)
        : 0,
  }
})

// Total votes across all positions
const totalVotesAllPositions = computed(() => {
  return Object.keys(candidatesByJabatan.value).reduce((sum, jabatan) => {
    return sum + getPositionStats(jabatan).totalVotes
  }, 0)
})

// Round status
const roundStatusClass = computed(() => {
  if (winners.value.length === 4) return 'completed'
  if (votingRound.value === 2) return 'runoff'
  if (winners.value.length > 0) return 'progress'
  return 'active'
})

const roundProgressStatus = computed(() => {
  const completed = winners.value.length
  if (completed === 4) return 'completed'
  if (completed >= 3) return 'good'
  if (completed >= 1) return 'average'
  return 'low'
})

const roundProgressLabel = computed(() => {
  const map = {
    completed: 'SELESAI',
    good: 'BAIK',
    average: 'SEDANG',
    low: 'MULAI',
  }
  return map[roundProgressStatus.value]
})

// Real-time stats
const updatesPerSecond = computed(() => {
  const oneSecondAgo = Date.now() - 1000
  return activityLog.value.filter((a) => new Date(a.timestamp).getTime() > oneSecondAgo).length
})

const currentTime = computed(() => {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

const lastUpdateTime = computed(() => {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const realtimeStats = computed(() => [
  {
    id: 1,
    icon: '🔄',
    label: 'Putaran',
    value: `#${votingRound.value}`,
    trend: winners.value.length > 0 ? `${winners.value.length}/4` : null,
    trendClass: 'positive',
  },
  {
    id: 2,
    icon: '🏆',
    label: 'Pemenang',
    value: `${winners.value.length}`,
    trend: runoffs.value.length > 0 ? `${runoffs.value.length} run-off` : null,
    trendClass: runoffs.value.length > 0 ? 'alert' : 'positive',
  },
  {
    id: 3,
    icon: '📊',
    label: 'Partisipasi',
    value: `${stats.value.participationRate}%`,
    trend: null,
    trendClass: stats.value.participationRate >= 70 ? 'positive' : 'neutral',
  },
  {
    id: 4,
    icon: '⚡',
    label: 'Live Update',
    value: `${updatesPerSecond.value}/dtk`,
    trend: null,
    trendClass: 'positive',
  },
])

// ===== HELPER FUNCTIONS =====
const getPositionProgress = (jabatan) => {
  const kandidats = candidatesByJabatan.value[jabatan] || []
  const totalVotes = kandidats.reduce((sum, k) => sum + k.total_suara, 0)
  const maxPossible = stats.value.totalGuru * 4 // Max votes per position
  return maxPossible > 0 ? Math.min(100, Math.round((totalVotes / maxPossible) * 100)) : 0
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatJabatan = (jabatan) => {
  const map = {
    humas: 'Waka Humas',
    sarpras: 'Waka Sarpras',
    kesiswaan: 'Waka Kesiswaan',
    kurikulum: 'Waka Kurikulum',
  }
  return map[jabatan] || jabatan
}

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const formatTimeAgo = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) return `${seconds} detik lalu`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`
  return `${Math.floor(seconds / 3600)} jam lalu`
}

const addActivity = (message, type = 'info', live = false) => {
  activityLog.value.unshift({
    id: Date.now(),
    message,
    type,
    timestamp: new Date(),
    live,
  })

  if (activityLog.value.length > 50) {
    activityLog.value = activityLog.value.slice(0, 50)
  }
}

const playNotificationSound = () => {
  if (soundEnabled.value && notificationSound.value) {
    notificationSound.value.currentTime = 0
    notificationSound.value.play().catch((e) => {
      console.log('Audio play failed:', e)
    })
  }
}

// ===== WEBSOCKET / REALTIME FUNCTIONS =====
const setupRealtimeConnection = async () => {
  console.log('🚀 Setting up Multi-Round Voting System...')

  try {
    await loadInitialData()
    startWebSocketConnection()
    startConnectionMonitor()

    loading.value = false
    isConnected.value = true
    connectionStartTime.value = Date.now()

    addActivity('🟢 Sistem voting multi-putaran siap', 'info', true)
    addActivity(`📊 4 posisi tersedia untuk dipilih`, 'info')
  } catch (error) {
    console.error('❌ Failed to setup voting system:', error)
    addActivity('🔴 Koneksi gagal, mencoba lagi...', 'info')
    setTimeout(setupRealtimeConnection, 3000)
  }
}

const startWebSocketConnection = () => {
  if (realtimeSubscription.value) {
    supabase.removeChannel(realtimeSubscription.value)
  }

  realtimeSubscription.value = supabase
    .channel('multi_round_voting')
    .on('broadcast', { event: 'ping' }, (payload) => {
      handlePing(payload)
    })
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'suara',
        filter: `sesi_id=eq.${activeSession.value?.id}`,
      },
      async (payload) => {
        const startTime = Date.now()
        await handleNewVote(payload.new)
        latency.value = Date.now() - startTime

        if (soundEnabled.value) {
          playNotificationSound()
        }
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'kandidat',
        filter: `sesi_id=eq.${activeSession.value?.id}`,
      },
      (payload) => {
        handleCandidateUpdate(payload.new)
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sesi_pemilihan',
        filter: `id=eq.${activeSession.value?.id}`,
      },
      (payload) => {
        activeSession.value = payload.new
        addActivity('📋 Sesi pemilihan diperbarui', 'info')
      },
    )
    .subscribe((status) => {
      handleSubscriptionStatus(status)
    })
}

const handleNewVote = async (newVote) => {
  console.log('🎉 VOTE BARU:', newVote)

  try {
    const { data: voter } = await supabase
      .from('pengguna')
      .select('nama_lengkap')
      .eq('id', newVote.pemilih_id)
      .single()

    const { data: candidate } = await supabase
      .from('kandidat')
      .select(
        `
        *,
        pengguna:pengguna_id(nama_lengkap)
      `,
      )
      .eq('id', newVote.kandidat_id)
      .single()

    latestVote.value = {
      pemilih_nama: voter?.nama_lengkap || 'Anonymous',
      kandidat_nama: candidate?.pengguna?.nama_lengkap || 'Unknown',
      jabatan: newVote.jabatan,
      timestamp: new Date(),
    }

    // Update stats
    const oldVoteCount = stats.value.votedCount
    stats.value.votedCount++
    stats.value.pendingCount = stats.value.totalGuru - stats.value.votedCount
    stats.value.participationRate = Math.round(
      (stats.value.votedCount / stats.value.totalGuru) * 100,
    )

    voteChange.value = stats.value.votedCount - oldVoteCount

    // Update candidate
    const candidateIndex = candidates.value.findIndex((c) => c.id === newVote.kandidat_id)
    if (candidateIndex !== -1) {
      const oldVotes = candidates.value[candidateIndex].total_suara
      candidates.value[candidateIndex].total_suara++
      candidates.value[candidateIndex].voteChange =
        candidates.value[candidateIndex].total_suara - oldVotes

      // Trigger animation
      recentVotes.value.push(newVote.kandidat_id)
      setTimeout(() => {
        recentVotes.value = recentVotes.value.filter((id) => id !== newVote.kandidat_id)
      }, 2000)

      // Check if this creates a winner
      setTimeout(() => {
        checkForNewWinner(newVote.jabatan)
      }, 100)
    }

    // Add to activity log
    addActivity(
      `🗳️ ${voter?.nama_lengkap || 'Seseorang'} memilih ${candidate?.pengguna?.nama_lengkap || 'seorang kandidat'} untuk ${formatJabatan(newVote.jabatan)}`,
      'vote',
      true,
    )
  } catch (error) {
    console.error('Error processing vote:', error)
  }
}

const checkForNewWinner = (jabatan) => {
  const kandidats = candidatesByJabatan.value[jabatan] || []
  if (kandidats.length === 0) return

  const totalVotes = kandidats.reduce((sum, k) => sum + k.total_suara, 0)
  if (totalVotes === 0) return

  kandidats.forEach((k) => {
    const percentage = (k.total_suara / totalVotes) * 100
    if (percentage > 50) {
      // Check if this is a new winner
      const existingWinner = winners.value.find((w) => w.jabatan === jabatan)
      if (!existingWinner) {
        addActivity(
          `🏆 ${k.nama_lengkap} MENANG sebagai ${formatJabatan(jabatan)} dengan ${Math.round(percentage)}% suara!`,
          'winner',
          true,
        )
      }
    }
  })
}

const handleCandidateUpdate = (updatedCandidate) => {
  const index = candidates.value.findIndex((c) => c.id === updatedCandidate.id)
  if (index !== -1) {
    const oldVotes = candidates.value[index].total_suara
    candidates.value[index] = {
      ...candidates.value[index],
      ...updatedCandidate,
      voteChange: updatedCandidate.total_suara - oldVotes,
    }

    // Trigger animation
    recentVotes.value.push(updatedCandidate.id)
    setTimeout(() => {
      recentVotes.value = recentVotes.value.filter((id) => id !== updatedCandidate.id)
    }, 2000)

    addActivity(`📈 ${candidates.value[index].nama_lengkap} mendapatkan vote baru`, 'rank_change')
  }
}

const handleSubscriptionStatus = (status) => {
  console.log('WebSocket Status:', status)

  switch (status) {
    case 'SUBSCRIBED':
      isConnected.value = true
      connectionErrors.value = 0
      addActivity('✅ Sistem realtime terhubung', 'info')
      break

    case 'CHANNEL_ERROR':
      isConnected.value = false
      connectionErrors.value++
      addActivity('⚠️ Koneksi terputus', 'info')

      if (connectionErrors.value < 5) {
        setTimeout(startWebSocketConnection, 2000)
      }
      break

    case 'TIMED_OUT':
      isConnected.value = false
      addActivity('⏱️ Timeout, menyambung ulang...', 'info')
      setTimeout(startWebSocketConnection, 1000)
      break
  }
}

const handlePing = (payload) => {
  latency.value = Date.now() - payload.sent_at
}

const startConnectionMonitor = () => {
  setInterval(() => {
    if (!isConnected.value && connectionErrors.value < 10) {
      console.log('Mencoba menyambung ulang...')
      startWebSocketConnection()
    }
  }, 5000)
}

const loadInitialData = async () => {
  try {
    // Load active session
    const { data: sessions } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .order('dibuat_pada', { ascending: false })
      .limit(1)

    activeSession.value = sessions?.[0]

    if (activeSession.value) {
      // Load candidates
      const { data: kandidatData } = await supabase
        .from('kandidat')
        .select(
          `
          *,
          pengguna:pengguna_id(nama_lengkap)
        `,
        )
        .eq('sesi_id', activeSession.value.id)
        .order('total_suara', { ascending: false })

      candidates.value = (kandidatData || []).map((k) => ({
        ...k,
        nama_lengkap: k.pengguna?.nama_lengkap || 'Unknown',
        voteChange: 0,
      }))

      // Load total voters (guru)
      const { count: totalGuru } = await supabase
        .from('pengguna')
        .select('*', { count: 'exact', head: true })
        .eq('peran', 'guru')
        .eq('is_active', true)

      stats.value.totalGuru = totalGuru || 0

      // Load total votes
      const { count: totalVotes } = await supabase
        .from('suara')
        .select('*', { count: 'exact', head: true })
        .eq('sesi_id', activeSession.value.id)
        .eq('is_draft', false)

      stats.value.votedCount = totalVotes || 0
      stats.value.pendingCount = stats.value.totalGuru - stats.value.votedCount
      stats.value.participationRate = Math.round(
        (stats.value.votedCount / stats.value.totalGuru) * 100,
      )
    }

    addActivity('🚀 Sistem voting multi-putaran dimuat', 'info')
    addActivity('📊 Memuat data kandidat dan pemilih...', 'info')
  } catch (error) {
    console.error('Error loading data:', error)
    loadMockData()
  }
}

const loadMockData = () => {
  // Minimal fallback data
  candidates.value = []
  stats.value = {
    totalGuru: 0,
    votedCount: 0,
    pendingCount: 0,
    participationRate: 0,
  }

  addActivity('⚠️ Menggunakan data simulasi', 'info')
  addActivity('🔗 Sambungkan ke database untuk data real', 'info')
}

// ===== UI CONTROLS =====
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value

  if (isFullscreen.value) {
    document.documentElement.requestFullscreen?.()
    addActivity('🖥️ Mode layar penuh diaktifkan', 'info')
  } else {
    document.exitFullscreen?.()
    addActivity('📱 Mode layar penuh dinonaktifkan', 'info')
  }
}

const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
  addActivity(
    soundEnabled.value ? '🔊 Notifikasi suara diaktifkan' : '🔇 Notifikasi suara dinonaktifkan',
    'info',
  )
}

const startNextRound = () => {
  if (votingRound.value === 1 && runoffs.value.length > 0) {
    votingRound.value = 2
    addActivity(`🔄 PUTARAN 2 DIMULAI! ${runoffs.value.length} posisi run-off`, 'milestone', true)
    addActivity('🎯 Voting fokus pada posisi yang belum memiliki pemenang', 'info')
  }
}

const endVoting = () => {
  if (winners.value.length === 4) {
    addActivity('🏁 VOTING SELESAI! Semua posisi telah terisi', 'milestone', true)
    addActivity('🎉 Selamat kepada semua pemenang!', 'info')
  }
}

// ===== LIFECYCLE =====
onMounted(async () => {
  await setupRealtimeConnection()

  // Auto fullscreen for smartboard (large screens)
  if (window.innerWidth > 1920) {
    isFullscreen.value = true
    document.documentElement.requestFullscreen?.()
  }
})

onUnmounted(() => {
  if (realtimeSubscription.value) {
    supabase.removeChannel(realtimeSubscription.value)
  }
  if (document.fullscreenElement) {
    document.exitFullscreen()
  }
})
</script>

<style scoped>
/* ===== BASE STYLES ===== */
.live-results {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  padding: 1rem;
  position: relative;
  overflow-x: hidden;
}

.results-wrapper {
  max-width: 1600px;
  margin: 0 auto;
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

/* ===== CONNECTION STATUS ===== */
.connection-status {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(220, 38, 38, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(220, 38, 38, 0.2);
  padding: 0.5rem 1rem;
  margin: -1rem -1rem 1rem -1rem;
  transition: all 0.3s ease;
}

.connection-status.connected {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  display: inline-block;
  margin-right: 0.5rem;
  animation: pulse 2s infinite;
}

.connection-status.connected .status-dot {
  background: #22c55e;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-details {
  display: flex;
  gap: 1rem;
  color: #94a3b8;
}

.updates-count {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

/* ===== ROUND CONTAINER ===== */
.round-container {
  background: rgba(15, 23, 42, 0.8);
  border-radius: 16px;
  padding: 1rem;
  border: 2px solid #3b82f6;
  text-align: center;
  min-width: 200px;
  transition: all 0.3s ease;
}

.round-container.completed {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  animation: pulseGlow 2s infinite;
}

.round-container.runoff {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  animation: pulseGlow 1.5s infinite;
}

.round-container.progress {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
}

.round-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
  color: #f1f5f9;
}

.round-text {
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.round-stats {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.stat-item.winners {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.stat-item.runoffs {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

@keyframes pulseGlow {
  0%,
  100% {
    box-shadow: 0 0 10px currentColor;
  }
  50% {
    box-shadow: 0 0 20px currentColor;
  }
}

/* ===== WINNERS BANNER ===== */
.winners-banner {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(21, 128, 61, 0.1));
  border: 2px solid rgba(34, 197, 94, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  animation: slideInDown 0.5s ease;
}

@keyframes slideInDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.banner-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.banner-header h3 {
  color: #22c55e;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.banner-icon {
  font-size: 1.5rem;
}

.winners-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.winner-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  border: 1px solid rgba(34, 197, 94, 0.2);
  transition: all 0.3s ease;
}

.winner-card:hover {
  transform: translateY(-2px);
  border-color: #22c55e;
  box-shadow: 0 8px 16px rgba(34, 197, 94, 0.2);
}

.winner-jabatan {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-bottom: 0.25rem;
}

.winner-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.winner-votes {
  font-size: 0.85rem;
  color: #22c55e;
  margin-bottom: 0.5rem;
}

.winner-badge {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  display: inline-block;
}

/* ===== JABATAN TABS ===== */
.jabatan-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab-button {
  background: rgba(30, 41, 59, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.tab-button:hover {
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
}

.tab-button.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.2);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.tab-button.winner {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.tab-button.runoff {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  animation: pulse 2s infinite;
}

.tab-icon {
  font-size: 1.5rem;
}

.tab-label {
  font-weight: 700;
  font-size: 0.9rem;
  color: #f1f5f9;
}

.tab-badge {
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  color: #94a3b8;
}

/* ===== POSITION LEADERBOARD ===== */
.position-leaderboard-card {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #f1f5f9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-action:hover {
  background: rgba(59, 130, 246, 0.3);
  border-color: #3b82f6;
  transform: scale(1.1);
}

.position-stats-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.position-stat {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.position-stat .stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #3b82f6;
  margin-bottom: 0.25rem;
}

.position-stat .stat-label {
  font-size: 0.8rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ===== LIVE VOTE COUNTER ===== */
.live-vote-counter {
  margin-bottom: 1.5rem;
}

.vote-alert {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: slideInRight 0.5s ease;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.alert-icon {
  font-size: 2rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  color: #60a5fa;
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.25rem;
}

.alert-content p {
  color: #cbd5e1;
  font-size: 0.85rem;
  margin: 0;
}

.alert-time {
  font-size: 0.75rem;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
}

/* ===== POSITION CANDIDATES ===== */
.position-candidates {
  max-height: 500px;
  overflow-y: auto;
}

.position-candidate-row {
  display: grid;
  grid-template-columns: auto auto 1fr auto auto auto;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  position: relative;
}

.position-candidate-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.position-candidate-row.vote-animation {
  background: rgba(59, 130, 246, 0.1);
  animation: votePulse 2s ease;
}

@keyframes votePulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

.position-candidate-row.first-place {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), transparent);
  border-left: 4px solid #fbbf24;
}

.position-candidate-row.second-place {
  background: linear-gradient(135deg, rgba(209, 213, 219, 0.1), transparent);
  border-left: 4px solid #d1d5db;
}

.position-candidate-row.winner {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), transparent);
  border-left: 4px solid #22c55e;
}

.row-rank {
  font-weight: 800;
  font-size: 1.1rem;
  color: #94a3b8;
  min-width: 40px;
}

.row-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.row-info {
  overflow: hidden;
}

.row-name {
  font-weight: 600;
  color: #f1f5f9;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
}

.row-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.row-status {
  font-size: 1.25rem;
  min-width: 40px;
  text-align: center;
}

.status-winner {
  color: #22c55e;
}

.status-runoff {
  color: #f59e0b;
}

.status-active {
  color: #3b82f6;
}

.row-progress {
  width: 100px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar.small {
  height: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.row-change {
  background: #22c55e;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  min-width: 40px;
  text-align: center;
  animation: popIn 0.5s ease;
}

@keyframes popIn {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* ===== ROUND PROGRESS CARD ===== */
.round-progress-card {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.progress-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.progress-badge.completed {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.progress-badge.good {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.progress-badge.average {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.progress-badge.low {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.position-progress-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.position-progress-item:hover {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.1);
  transform: translateX(2px);
}

.position-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
}

.position-icon {
  font-size: 1.1rem;
}

.position-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f1f5f9;
}

.position-progress {
  flex: 1;
}

.progress-text {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

.position-result {
  min-width: 70px;
  text-align: right;
}

.result-winner {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
}

.result-runoff {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
}

.result-active {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
}

/* ===== ACTIVITY FEED ===== */
.activity-card {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.activity-badge {
  background: #3b82f6;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
}

.activity-feed {
  height: 300px;
  overflow-y: auto;
}

.empty-activity {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  font-style: italic;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.activity-item.vote {
  border-left-color: #3b82f6;
}

.activity-item.rank_change {
  border-left-color: #8b5cf6;
}

.activity-item.milestone {
  border-left-color: #f59e0b;
}

.activity-item.winner {
  border-left-color: #22c55e;
}

.activity-item.info {
  border-left-color: #94a3b8;
}

.activity-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(2px);
}

.activity-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.activity-content {
  flex: 1;
}

.activity-message {
  font-size: 0.85rem;
  color: #e2e8f0;
  margin-bottom: 0.25rem;
  line-height: 1.4;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
}

.activity-time {
  color: #94a3b8;
  font-family: 'Courier New', monospace;
}

.activity-live {
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  animation: pulse 2s infinite;
}

/* ===== ROUND SUMMARY ===== */
.round-summary-card {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 16px;
  padding: 1.5rem;
}

.round-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}

.summary-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #f1f5f9;
}

.round-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-round-action {
  flex: 1;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-round-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

.btn-round-action:active {
  transform: translateY(0);
}

/* ===== FOOTER ===== */
.footer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.voting-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 12px;
  min-width: 300px;
}

.status-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.5rem;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.detail-label {
  color: #94a3b8;
  min-width: 80px;
}

.detail-value {
  font-weight: 600;
  font-family: 'Courier New', monospace;
  color: #f1f5f9;
}

.system-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #94a3b8;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.info-separator {
  color: #475569;
  opacity: 0.5;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .jabatan-tabs {
    grid-template-columns: repeat(2, 1fr);
  }

  .header-main {
    flex-direction: column;
  }

  .header-right {
    width: 100%;
    flex-direction: column;
    gap: 1rem;
  }

  .round-container {
    width: 100%;
  }

  .winners-grid {
    grid-template-columns: 1fr;
  }

  .position-stats-summary {
    grid-template-columns: 1fr;
  }

  .position-candidate-row {
    grid-template-columns: auto auto 1fr auto;
  }

  .row-progress,
  .row-change {
    display: none;
  }

  .footer-section {
    flex-direction: column;
    text-align: center;
  }

  .voting-status {
    min-width: 100%;
  }
}

@media (min-width: 1200px) {
  .dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }
}

/* ===== LOADER ===== */
.loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loader-container {
  text-align: center;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.loader-spinner {
  width: 80px;
  height: 80px;
  border: 4px solid rgba(59, 130, 246, 0.3);
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  margin: 0 auto 2rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loader-text {
  font-size: 1.25rem;
  color: #cbd5e1;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.loader-dots {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.loader-dots .dot {
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border-radius: 50%;
  animation: bounce 1.4s infinite;
}

.loader-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loader-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* ===== FULLSCREEN MODE ===== */
.fullscreen-mode {
  padding: 2rem;
}

.fullscreen-mode .title-main {
  font-size: 3rem;
}

.fullscreen-mode .title-sub {
  font-size: 1.5rem;
}

.fullscreen-mode .winner-name {
  font-size: 1.5rem;
}

.fullscreen-mode .tab-label {
  font-size: 1.1rem;
}

.fullscreen-mode .position-stat .stat-value {
  font-size: 2rem;
}
</style>
