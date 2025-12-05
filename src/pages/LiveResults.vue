<template>
  <div class="live-results">
    <!-- Status Bar -->
    <div class="status-bar">
      <div class="status-left">
        <span class="live-indicator" :class="{ connected: isConnected }"></span>
        <span class="status-text">{{ isConnected ? '🔴 LIVE' : '🟡 CONNECTING...' }}</span>
        <span class="update-rate" v-if="updatesPerSecond > 0">
          ⚡ {{ updatesPerSecond }}/detik
        </span>
      </div>
      <div class="status-center">
        <span class="round-badge">🔄 PUTARAN {{ votingRound }}</span>
        <span class="vote-count">🗳️ {{ totalVotesAllPositions }} suara</span>
        <span class="winners-count">🏆 {{ winners.length }}/2 pemenang</span>
      </div>
      <div class="status-right">
        <span class="time">⏰ {{ currentTime }}</span>
        <span class="participation">📊 {{ stats.participationRate }}% partisipasi</span>
        <button class="sound-btn" @click="toggleSound">
          {{ soundEnabled ? '🔊' : '🔇' }}
        </button>
      </div>
    </div>

    <!-- Live Vote Alert -->
    <div v-if="showLiveAlert" class="live-alert" :class="alertType">
      <div class="alert-content">
        <span class="alert-icon">🎉</span>
        <div class="alert-text">
          <strong>VOTE BARU!</strong>
          <p>{{ liveAlertData.pemilih }} memilih {{ liveAlertData.kandidat }}</p>
          <small>untuk {{ formatJabatan(liveAlertData.jabatan) }}</small>
        </div>
        <span class="alert-time">{{ liveAlertData.time }}</span>
      </div>
    </div>

    <!-- Main Dashboard -->
    <div class="dashboard">
      <!-- Winners Section -->
      <div class="winners-section" v-if="winners.length > 0">
        <h2 class="section-title">
          <span class="icon">🏆</span>
          PEMENANG ({{ winners.length }}/2)
        </h2>
        <div class="winners-grid">
          <div v-for="winner in winners" :key="winner.jabatan" class="winner-card">
            <div class="winner-position">{{ formatJabatan(winner.jabatan) }}</div>
            <div class="winner-name">{{ winner.kandidat.nama_lengkap }}</div>
            <div class="winner-stats">
              <span class="votes">{{ winner.kandidat.total_suara }} suara</span>
              <span class="percentage" :class="{ supermajority: winner.percentage > 50 }">
                {{ winner.percentage }}%
              </span>
            </div>
            <div class="winner-badge" v-if="winner.percentage > 50">✅ MENANG</div>
          </div>
        </div>
      </div>

      <!-- Run-off Alert -->
      <div v-if="runoffs.length > 0 && votingRound === 1" class="runoff-alert">
        <div class="alert-content">
          <span class="icon">🔄</span>
          <div class="alert-text">
            <strong>{{ runoffs.length }} POSISI PERLU RUN-OFF</strong>
            <p>Belum ada yang mencapai >50% suara</p>
          </div>
          <button v-if="isAdmin" @click="startNextRound" class="runoff-btn">Mulai Putaran 2</button>
        </div>
      </div>

      <!-- Position Tabs -->
      <div class="position-tabs">
        <button
          v-for="jabatan in ['kesiswaan', 'sarpras']"
          :key="jabatan"
          class="tab"
          :class="{
            active: activeJabatan === jabatan,
            winner: winners.some((w) => w.jabatan === jabatan),
            'has-vote-animation': recentVotes.some((v) => v.jabatan === jabatan),
          }"
          @click="activeJabatan = jabatan"
        >
          <span class="tab-icon">
            {{ winners.some((w) => w.jabatan === jabatan) ? '✅' : '📊' }}
          </span>
          {{ formatJabatan(jabatan) }}
          <span class="tab-count">{{ getPositionStats(jabatan).totalVotes }}</span>
          <span v-if="recentVotes.some((v) => v.jabatan === jabatan)" class="pulse-dot"></span>
        </button>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <!-- Left: Candidate Rankings -->
        <div class="rankings">
          <div class="rankings-header">
            <h3 class="chart-title">
              {{ formatJabatan(activeJabatan) }}
              <span class="position-status">
                {{
                  getPositionStats(activeJabatan).hasWinner
                    ? '✅'
                    : getPositionStats(activeJabatan).needsRunoff
                      ? '🔄'
                      : '📊'
                }}
              </span>
            </h3>
            <div class="position-stats">
              <span class="stat">{{ getPositionStats(activeJabatan).totalVotes }} suara</span>
              <span class="stat"
                >{{ getPositionStats(activeJabatan).candidateCount }} kandidat</span
              >
            </div>
          </div>

          <div class="candidates-list">
            <div
              v-for="(candidate, index) in getCurrentRoundCandidates(activeJabatan)"
              :key="candidate.id"
              class="candidate-row"
              :class="{
                'vote-animation': recentVotes.some((v) => v.candidateId === candidate.id),
                winner: winners.some(
                  (w) => w.jabatan === activeJabatan && w.kandidat.id === candidate.id,
                ),
                runoff: votingRound === 2 && index < 2,
                eliminated: votingRound === 2 && index >= 2,
              }"
            >
              <div class="rank">
                <span v-if="votingRound === 2 && index < 2" class="round-badge">R2</span>
                <span v-else>#{{ index + 1 }}</span>
              </div>
              <div class="avatar">{{ getInitials(candidate.nama_lengkap) }}</div>
              <div class="info">
                <div class="name">{{ candidate.nama_lengkap }}</div>
                <div class="votes">
                  {{ candidate.total_suara }} suara
                  <span v-if="candidate.voteChange > 0" class="vote-change">
                    +{{ candidate.voteChange }}
                  </span>
                </div>
              </div>
              <div class="progress-container">
                <div
                  class="progress-bar"
                  :style="{ width: Math.min(candidate.percentage, 100) + '%' }"
                  :class="{ supermajority: candidate.percentage > 50 }"
                ></div>
                <div class="percentage">{{ candidate.percentage }}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Stats & Activity -->
        <div class="stats-sidebar">
          <!-- Real-time Stats -->
          <div class="stats-card">
            <h3 class="card-title">📈 STATISTIK REAL-TIME</h3>
            <div class="stats-grid">
              <div class="stat">
                <div class="stat-value">{{ stats.totalGuru }}</div>
                <div class="stat-label">Total Pemilih</div>
              </div>
              <div class="stat">
                <div class="stat-value">{{ stats.votedCount }}</div>
                <div class="stat-label">Sudah Voting</div>
              </div>
              <div class="stat">
                <div class="stat-value">{{ stats.pendingCount }}</div>
                <div class="stat-label">Belum Voting</div>
              </div>
              <div class="stat">
                <div class="stat-value">{{ stats.participationRate }}%</div>
                <div class="stat-label">Partisipasi</div>
              </div>
            </div>
          </div>

          <!-- Live Activity -->
          <div class="activity-card">
            <h3 class="card-title">🔄 AKTIVITAS LIVE</h3>
            <div class="activity-list">
              <div
                v-for="activity in recentActivity"
                :key="activity.id"
                class="activity-item"
                :class="activity.type"
              >
                <span class="activity-icon">
                  {{
                    activity.type === 'vote'
                      ? '🗳️'
                      : activity.type === 'winner'
                        ? '🏆'
                        : activity.type === 'round'
                          ? '🔄'
                          : '📊'
                  }}
                </span>
                <span class="activity-text">{{ activity.message }}</span>
                <span class="activity-time">{{ activity.time }}</span>
              </div>
            </div>
          </div>

          <!-- Round Info -->
          <div class="round-card">
            <h3 class="card-title">🔄 PUTARAN {{ votingRound }}</h3>
            <div class="round-status">
              <div class="status-item" v-for="jabatan in ['kesiswaan', 'sarpras']" :key="jabatan">
                <span class="position-name">{{ formatJabatan(jabatan) }}</span>
                <span
                  class="status-indicator"
                  :class="{
                    winner: winners.some((w) => w.jabatan === jabatan),
                    runoff: runoffs.some((r) => r.jabatan === jabatan),
                  }"
                >
                  {{
                    winners.some((w) => w.jabatan === jabatan)
                      ? '✅'
                      : runoffs.some((r) => r.jabatan === jabatan)
                        ? '🔄'
                        : '⏳'
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden Audio for Beep Sound -->
    <audio ref="beepSound" preload="auto">
      <source
        src="https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3"
        type="audio/mpeg"
      />
    </audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'

// State
const isConnected = ref(false)
const votingRound = ref(1)
const activeJabatan = ref('kesiswaan')
const isAdmin = ref(true)
const soundEnabled = ref(true)
const showLiveAlert = ref(false)
const alertType = ref('vote')

// Data
const candidates = ref([])
const activityLog = ref([])
const recentVotes = ref([])
const liveAlertData = ref({})

// Stats
const stats = ref({
  totalGuru: 0,
  votedCount: 0,
  pendingCount: 0,
  participationRate: 0,
})

// Realtime subscription
let realtimeChannel = null

// Audio
const beepSound = ref(null)

// Computed
const updatesPerSecond = computed(() => {
  const oneSecondAgo = Date.now() - 1000
  return activityLog.value.filter((a) => a.timestamp > oneSecondAgo).length
})

const currentTime = computed(() => {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

const candidatesByJabatan = computed(() => {
  const grouped = { kesiswaan: [], sarpras: [] }

  candidates.value.forEach((candidate) => {
    if (grouped[candidate.jabatan]) {
      const positionCandidates = grouped[candidate.jabatan]
      const totalVotes = [...positionCandidates, candidate].reduce(
        (sum, k) => sum + (k.total_suara || 0),
        0,
      )

      candidate.percentage =
        totalVotes > 0 ? Math.round((candidate.total_suara / totalVotes) * 100) : 0
      grouped[candidate.jabatan].push(candidate)
    }
  })

  // Sort by votes
  Object.keys(grouped).forEach((jabatan) => {
    grouped[jabatan].sort((a, b) => b.total_suara - a.total_suara)
  })

  return grouped
})

const winners = computed(() => {
  const result = []

  Object.keys(candidatesByJabatan.value).forEach((jabatan) => {
    const kandidats = candidatesByJabatan.value[jabatan]
    if (kandidats.length === 0) return

    const totalVotes = kandidats.reduce((sum, k) => sum + (k.total_suara || 0), 0)
    if (totalVotes === 0) return

    kandidats.forEach((k) => {
      const percentage = (k.total_suara / totalVotes) * 100
      if (percentage > 50) {
        result.push({
          jabatan,
          kandidat: k,
          percentage: Math.round(percentage),
          round: votingRound.value,
        })
      }
    })
  })

  return result
})

const runoffs = computed(() => {
  const result = []

  Object.keys(candidatesByJabatan.value).forEach((jabatan) => {
    const kandidats = candidatesByJabatan.value[jabatan]
    if (kandidats.length === 0) return

    const hasWinner = winners.value.some((w) => w.jabatan === jabatan)
    if (hasWinner) return

    if (kandidats.length >= 2) {
      const top2 = kandidats.slice(0, 2)
      result.push({ jabatan, kandidats: top2 })
    }
  })

  return result
})

const totalVotesAllPositions = computed(() => {
  return ['kesiswaan', 'sarpras'].reduce((sum, jabatan) => {
    return sum + getPositionStats(jabatan).totalVotes
  }, 0)
})

const recentActivity = computed(() => {
  return activityLog.value.slice(0, 5)
})

// Helper Functions
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

const getCurrentRoundCandidates = (jabatan) => {
  const kandidats = candidatesByJabatan.value[jabatan] || []

  // Jika round 2, hanya ambil 2 teratas
  if (votingRound.value === 2 && kandidats.length > 2) {
    return kandidats.slice(0, 2)
  }

  return kandidats
}

const formatJabatan = (jabatan) => {
  const map = {
    sarpras: 'Waka Sarpras',
    kesiswaan: 'Waka Kesiswaan',
  }
  return map[jabatan] || jabatan
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

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const addActivity = (message, type = 'info') => {
  activityLog.value.unshift({
    id: Date.now(),
    message,
    type,
    timestamp: Date.now(),
    time: formatTime(new Date()),
  })

  if (activityLog.value.length > 50) {
    activityLog.value = activityLog.value.slice(0, 50)
  }
}

const playBeepSound = () => {
  if (soundEnabled.value && beepSound.value) {
    beepSound.value.currentTime = 0
    beepSound.value.play().catch((e) => console.log('Audio play failed:', e))
  }
}

const showVoteAlert = (pemilih, kandidat, jabatan) => {
  liveAlertData.value = {
    pemilih,
    kandidat,
    jabatan,
    time: formatTime(new Date()),
  }
  showLiveAlert.value = true
  alertType.value = 'vote'

  // Auto hide after 3 seconds
  setTimeout(() => {
    showLiveAlert.value = false
  }, 3000)
}

const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
  addActivity(soundEnabled.value ? '🔊 Suara diaktifkan' : '🔇 Suara dimatikan', 'info')
}

// REAL-TIME FUNCTIONS
const setupRealtimeConnection = async () => {
  try {
    // Load active session
    const { data: sessions, error: sessionError } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .order('dibuat_pada', { ascending: false })
      .limit(1)

    if (sessionError) throw sessionError

    const activeSession = sessions?.[0]

    if (!activeSession) {
      console.error('No active session found')
      return
    }

    // Load initial candidates data
    await loadCandidates(activeSession.id)

    // Setup realtime subscription for VOTES
    realtimeChannel = supabase
      .channel('live_votes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'suara',
          filter: `sesi_id=eq.${activeSession.id}`,
        },
        async (payload) => {
          console.log('🎯 NEW VOTE DETECTED:', payload.new)
          await handleNewVote(payload.new)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kandidat',
          filter: `sesi_id=eq.${activeSession.id}`,
        },
        (payload) => {
          console.log('📈 CANDIDATE UPDATE:', payload.new)
          handleCandidateUpdate(payload.new)
        },
      )
      .subscribe((status) => {
        console.log('🔌 Subscription status:', status)
        isConnected.value = status === 'SUBSCRIBED'

        if (status === 'SUBSCRIBED') {
          addActivity('✅ Sistem realtime terhubung', 'info')
        }
      })
  } catch (error) {
    console.error('Setup error:', error)
    setTimeout(setupRealtimeConnection, 3000)
  }
}

const loadCandidates = async (sessionId) => {
  try {
    const { data: kandidatData, error } = await supabase
      .from('kandidat')
      .select(
        `
        *,
        pengguna:pengguna_id(nama_lengkap)
      `,
      )
      .eq('sesi_id', sessionId)
      .in('jabatan', ['kesiswaan', 'sarpras'])
      .order('total_suara', { ascending: false })

    if (error) throw error

    candidates.value = (kandidatData || []).map((k) => ({
      ...k,
      nama_lengkap: k.pengguna?.nama_lengkap || 'Unknown',
      voteChange: 0,
      percentage: 0,
    }))

    // Load stats
    await loadStats(sessionId)

    addActivity(`📊 ${candidates.value.length} kandidat dimuat`, 'info')
  } catch (error) {
    console.error('Load candidates error:', error)
  }
}

const loadStats = async (sessionId) => {
  try {
    // Total eligible voters (guru)
    const { count: totalGuru, error: guruError } = await supabase
      .from('pengguna')
      .select('*', { count: 'exact', head: true })
      .eq('peran', 'guru')
      .eq('is_active', true)

    if (guruError) throw guruError

    stats.value.totalGuru = totalGuru || 0

    // Total votes in this session
    const { count: totalVotes, error: votesError } = await supabase
      .from('suara')
      .select('*', { count: 'exact', head: true })
      .eq('sesi_id', sessionId)
      .eq('is_draft', false)

    if (votesError) throw votesError

    stats.value.votedCount = totalVotes || 0
    stats.value.pendingCount = stats.value.totalGuru - stats.value.votedCount
    stats.value.participationRate = Math.round(
      (stats.value.votedCount / stats.value.totalGuru) * 100,
    )
  } catch (error) {
    console.error('Load stats error:', error)
  }
}

const handleNewVote = async (newVote) => {
  try {
    // Get voter name
    const { data: voter, error: voterError } = await supabase
      .from('pengguna')
      .select('nama_lengkap')
      .eq('id', newVote.pemilih_id)
      .single()

    if (voterError) throw voterError

    // Get candidate name
    const { data: candidate, error: candidateError } = await supabase
      .from('kandidat')
      .select(
        `
        *,
        pengguna:pengguna_id(nama_lengkap)
      `,
      )
      .eq('id', newVote.kandidat_id)
      .single()

    if (candidateError) throw candidateError

    // Play beep sound
    playBeepSound()

    // Show live alert
    showVoteAlert(
      voter?.nama_lengkap || 'Seseorang',
      candidate?.pengguna?.nama_lengkap || 'seorang kandidat',
      newVote.jabatan,
    )

    // Add to recent votes for animation
    recentVotes.value.push({
      candidateId: newVote.kandidat_id,
      jabatan: newVote.jabatan,
      timestamp: Date.now(),
    })

    // Remove after 2 seconds
    setTimeout(() => {
      recentVotes.value = recentVotes.value.filter((v) => v.candidateId !== newVote.kandidat_id)
    }, 2000)

    // Update stats
    stats.value.votedCount++
    stats.value.pendingCount = stats.value.totalGuru - stats.value.votedCount
    stats.value.participationRate = Math.round(
      (stats.value.votedCount / stats.value.totalGuru) * 100,
    )

    // Add activity
    addActivity(
      `${voter?.nama_lengkap || 'Seseorang'} memilih ${candidate?.pengguna?.nama_lengkap || 'seorang kandidat'}`,
      'vote',
    )

    // Trigger animation on tab
    setTimeout(() => {
      // This will trigger the has-vote-animation class
    }, 100)
  } catch (error) {
    console.error('Handle new vote error:', error)
  }
}

const handleCandidateUpdate = (updatedCandidate) => {
  const index = candidates.value.findIndex((c) => c.id === updatedCandidate.id)
  if (index !== -1) {
    const oldVotes = candidates.value[index].total_suara || 0
    const newVotes = updatedCandidate.total_suara || 0

    // Calculate vote change
    const voteChange = newVotes - oldVotes

    if (voteChange > 0) {
      // Update candidate with vote change
      candidates.value[index] = {
        ...candidates.value[index],
        ...updatedCandidate,
        voteChange: voteChange,
      }

      // Reset voteChange after 3 seconds
      setTimeout(() => {
        if (candidates.value[index]) {
          candidates.value[index].voteChange = 0
        }
      }, 3000)
    }
  }
}

const startNextRound = () => {
  if (votingRound.value === 1 && runoffs.value.length > 0) {
    votingRound.value = 2
    addActivity(`🔄 PUTARAN 2 DIMULAI! ${runoffs.value.length} posisi run-off`, 'round')

    // Play different sound for round change
    if (soundEnabled.value) {
      beepSound.value.src = 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'
      beepSound.value.play()
    }
  }
}

// Lifecycle
onMounted(() => {
  setupRealtimeConnection()
})

onUnmounted(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
  }
})
</script>

<style scoped>
/* Base */
.live-results {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
  font-family: 'Segoe UI', system-ui, sans-serif;
  padding: 20px;
}

/* Status Bar */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-left,
.status-center,
.status-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.live-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 1.5s infinite;
}

.live-indicator.connected {
  background: #22c55e;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.round-badge,
.vote-count,
.winners-count {
  background: rgba(59, 130, 246, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
}

.time {
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.participation {
  color: #22c55e;
  font-weight: 600;
}

.sound-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.sound-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Live Alert */
.live-alert {
  position: fixed;
  top: 80px;
  right: 20px;
  background: rgba(59, 130, 246, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  min-width: 300px;
  z-index: 1000;
  animation:
    slideInRight 0.3s,
    fadeOut 0.3s 2.7s forwards;
  border-left: 4px solid #3b82f6;
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

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.live-alert.vote {
  background: rgba(59, 130, 246, 0.9);
  border-left-color: #3b82f6;
}

.live-alert.winner {
  background: rgba(34, 197, 94, 0.9);
  border-left-color: #22c55e;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-icon {
  font-size: 28px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-5px);
  }
}

.alert-text strong {
  color: white;
  display: block;
  margin-bottom: 4px;
}

.alert-text p {
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-size: 14px;
}

.alert-text small {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.alert-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'Courier New', monospace;
  margin-left: auto;
}

/* Dashboard */
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Winners Section */
.winners-section {
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #22c55e;
}

.winners-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.winner-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(34, 197, 94, 0.2);
  position: relative;
  overflow: hidden;
}

.winner-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #22c55e, #4ade80);
}

.winner-position {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.winner-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: white;
}

.winner-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.votes {
  color: #cbd5e1;
  font-size: 14px;
}

.percentage {
  font-weight: bold;
  font-size: 16px;
  color: #22c55e;
}

.percentage.supermajority {
  color: #fbbf24;
  animation: glow 2s infinite;
}

@keyframes glow {
  0%,
  100% {
    text-shadow: 0 0 5px currentColor;
  }
  50% {
    text-shadow: 0 0 15px currentColor;
  }
}

.winner-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 10px;
}

/* Run-off Alert */
.runoff-alert {
  background: rgba(245, 158, 11, 0.1);
  border: 2px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  padding: 16px;
  animation: pulseBorder 2s infinite;
}

@keyframes pulseBorder {
  0%,
  100% {
    border-color: rgba(245, 158, 11, 0.3);
  }
  50% {
    border-color: rgba(245, 158, 11, 0.6);
  }
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.runoff-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  margin-left: auto;
  transition: transform 0.2s;
}

.runoff-btn:hover {
  transform: translateY(-2px);
}

/* Position Tabs */
.position-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  position: relative;
}

.tab:hover {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.1);
}

.tab.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.2);
}

.tab.winner {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.tab.has-vote-animation {
  animation: tabPulse 1s;
}

@keyframes tabPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.pulse-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 50%;
  animation: dotPulse 1s infinite;
}

@keyframes dotPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.7;
  }
}

.tab-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 4px;
}

/* Charts Section */
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  min-height: 500px;
}

/* Rankings */
.rankings {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  overflow-y: auto;
}

.rankings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  color: white;
}

.position-stats {
  display: flex;
  gap: 12px;
}

.stat {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.candidates-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.candidate-row {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;
}

.candidate-row.vote-animation {
  animation: highlightVote 1s;
  border-left: 4px solid #3b82f6;
}

@keyframes highlightVote {
  0% {
    background: rgba(59, 130, 246, 0.3);
  }
  100% {
    background: rgba(255, 255, 255, 0.03);
  }
}

.candidate-row.winner {
  border-left: 4px solid #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.candidate-row.runoff {
  border-left: 4px solid #f59e0b;
}

.candidate-row.eliminated {
  opacity: 0.5;
  border-left: 4px solid #ef4444;
}

.rank {
  font-weight: bold;
  color: #94a3b8;
  min-width: 40px;
  text-align: center;
}

.avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
}

.name {
  font-weight: 600;
  margin-bottom: 2px;
}

.votes {
  font-size: 12px;
  color: #94a3b8;
}

.vote-change {
  color: #22c55e;
  font-weight: bold;
  animation: fadeInUp 0.5s;
  margin-left: 4px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.progress-container {
  width: 150px;
}

.progress-bar {
  height: 8px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
  margin-bottom: 4px;
  transition: width 0.5s ease;
}

.progress-bar.supermajority {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.percentage {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

/* Stats Sidebar */
.stats-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-card,
.activity-card,
.round-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
}

.card-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat {
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #3b82f6;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
}

/* Activity */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  animation: slideInLeft 0.3s;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.activity-item.vote {
  border-left: 3px solid #3b82f6;
}

.activity-item.winner {
  border-left: 3px solid #22c55e;
}

.activity-item.round {
  border-left: 3px solid #f59e0b;
}

.activity-icon {
  font-size: 16px;
}

.activity-text {
  flex: 1;
  font-size: 13px;
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-time {
  font-size: 11px;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
}

/* Round Status */
.round-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

.position-name {
  font-weight: 600;
  font-size: 14px;
}

.status-indicator.winner {
  color: #22c55e;
  animation: spin 2s infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

.status-indicator.runoff {
  color: #f59e0b;
  animation: pulse 1s infinite;
}

/* Responsive */
@media (max-width: 1200px) {
  .charts-section {
    grid-template-columns: 1fr;
  }

  .winners-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .status-bar {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .position-tabs {
    grid-template-columns: 1fr;
  }

  .live-alert {
    left: 20px;
    right: 20px;
    min-width: auto;
  }
}
</style>
