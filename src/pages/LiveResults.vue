<template>
  <div class="live-results" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- Top Status Bar -->
    <div class="top-bar">
      <div class="connection-status">
        <div class="status-indicator" :class="{ connected: isConnected }"></div>
        <span class="status-text">{{ isConnected ? '🔴 LIVE' : '🟡 MENYAMBUNG' }}</span>
        <span class="updates-counter" v-if="updatesCount > 0">⚡ {{ updatesCount }} update</span>
      </div>

      <div class="center-info">
        <div class="round-info">
          <span class="round-icon">🔄</span>
          <span class="round-text">PUTARAN {{ votingRound }}</span>
        </div>
        <div class="votes-info">
          <span class="votes-icon">🗳️</span>
          <span class="votes-text">{{ totalVotes }} SUARA</span>
        </div>
        <div class="winners-info">
          <span class="winners-icon">🏆</span>
          <span class="winners-text">{{ winners.length }}/2 PEMENANG</span>
        </div>
      </div>

      <div class="right-info">
        <div class="time-display">
          <span class="time-icon">⏰</span>
          <span class="time-text">{{ currentTime }}</span>
        </div>
        <div class="participation-display">
          <span class="participation-icon">📊</span>
          <span class="participation-text">{{ participationRate }}% PARTISIPASI</span>
        </div>
        <button class="sound-toggle" @click="toggleSound" :class="{ muted: !soundEnabled }">
          {{ soundEnabled ? '🔊 ON' : '🔇 OFF' }}
        </button>
        <button class="fullscreen-toggle" @click="toggleFullscreen">
          {{ isFullscreen ? '📱 EXIT' : '🖥️ FULL' }}
        </button>
      </div>
    </div>

    <!-- Live Vote Notification -->
    <transition name="slide-down">
      <div v-if="showVoteAlert" class="vote-notification" :class="notificationType">
        <div class="notification-content">
          <div class="notification-icon">🎉</div>
          <div class="notification-text">
            <div class="notification-title">{{ notificationTitle }}</div>
            <div class="notification-details">
              <span class="voter">{{ lastVoter }}</span> {{ notificationAction }}
              <span class="candidate">{{ lastCandidate }}</span>
            </div>
            <div class="notification-position">{{ notificationPosition }}</div>
          </div>
          <div class="notification-time">{{ lastVoteTime }}</div>
        </div>
      </div>
    </transition>

    <!-- Main Dashboard -->
    <div class="main-dashboard">
      <!-- Winners Section -->
      <div v-if="winners.length > 0" class="winners-section">
        <div class="winners-header">
          <h2 class="section-title">
            <span class="title-icon">🏆</span>
            PEMENANG PUTARAN {{ votingRound }}
            <span class="title-count">({{ winners.length }}/2)</span>
          </h2>
        </div>
        <div class="winners-grid">
          <div
            v-for="winner in winners"
            :key="winner.jabatan"
            class="winner-card"
            :class="{ supermajority: winner.percentage > 50 }"
          >
            <div class="winner-position">{{ formatJabatan(winner.jabatan) }}</div>
            <div class="winner-name">{{ winner.name }}</div>
            <div class="winner-stats">
              <div class="stat-votes">{{ winner.votes }} SUARA</div>
              <div class="stat-percentage">{{ winner.percentage }}%</div>
            </div>
            <div class="winner-badge" :class="{ supermajority: winner.percentage > 50 }">
              {{ winner.percentage > 50 ? '✅ MENANG LURUS' : '📊 LEADING' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Run-off Alert -->
      <transition name="fade">
        <div v-if="runoffs.length > 0 && votingRound === 1" class="runoff-section">
          <div class="runoff-alert">
            <div class="runoff-icon">🔄</div>
            <div class="runoff-content">
              <h3 class="runoff-title">{{ runoffs.length }} POSISI PERLU RUN-OFF</h3>
              <p class="runoff-description">Belum ada kandidat yang mencapai >50% suara</p>
              <div class="runoff-positions">
                <span v-for="position in runoffs" :key="position" class="position-tag">
                  {{ formatJabatan(position) }}
                </span>
              </div>
            </div>
            <button v-if="isAdmin" @click="startRunoff" class="runoff-button">
              MULAI PUTARAN 2
            </button>
          </div>
        </div>
      </transition>

      <!-- Voting Positions -->
      <div class="positions-container">
        <div class="position-tabs">
          <button
            v-for="position in positions"
            :key="position.id"
            class="position-tab"
            :class="{
              active: activePosition === position.id,
              'has-update': recentUpdates.includes(position.id),
              'has-winner': winners.some((w) => w.jabatan === position.id),
            }"
            @click="activePosition = position.id"
          >
            <span class="tab-icon">{{ getTabIcon(position.id) }}</span>
            <span class="tab-name">{{ position.name }}</span>
            <span class="tab-count">{{ getPositionVotes(position.id) }}</span>
            <span v-if="recentUpdates.includes(position.id)" class="update-dot"></span>
          </button>
        </div>

        <!-- Position Dashboard -->
        <div class="position-dashboard">
          <div class="dashboard-header">
            <h3 class="dashboard-title">
              {{ getPositionName(activePosition) }}
              <span class="dashboard-status">
                {{ getPositionStatus(activePosition) }}
              </span>
            </h3>
            <div class="dashboard-stats">
              <div class="stat-item">
                <span class="stat-label">Total Suara:</span>
                <span class="stat-value">{{ getPositionVotes(activePosition) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Kandidat:</span>
                <span class="stat-value">{{ getCandidates(activePosition).length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Partisipasi:</span>
                <span class="stat-value">{{ getPositionParticipation(activePosition) }}%</span>
              </div>
            </div>
          </div>

          <!-- Candidates Ranking -->
          <div class="candidates-ranking">
            <div
              v-for="(candidate, index) in getCandidates(activePosition)"
              :key="candidate.id"
              class="candidate-item"
              :class="{
                'rank-1': index === 0,
                'rank-2': index === 1,
                'rank-3': index === 2,
                'vote-update': candidate.hasUpdate,
                'is-winner': isWinner(candidate.id, activePosition),
                'in-runoff': votingRound === 2 && index < 2,
                eliminated: votingRound === 2 && index >= 2,
              }"
            >
              <div class="candidate-rank">
                <span v-if="votingRound === 2 && index < 2" class="round-2-badge">R2</span>
                <span v-else class="rank-number">#{{ index + 1 }}</span>
              </div>

              <div class="candidate-profile">
                <div class="candidate-avatar">{{ getInitials(candidate.name) }}</div>
                <div class="candidate-info">
                  <div class="candidate-name">{{ candidate.name }}</div>
                  <div class="candidate-meta">
                    <span class="meta-votes">{{ candidate.votes }} suara</span>
                    <span class="meta-separator">•</span>
                    <span class="meta-percentage">{{ candidate.percentage }}%</span>
                    <span v-if="candidate.voteChange > 0" class="meta-change">
                      (+{{ candidate.voteChange }})
                    </span>
                  </div>
                </div>
              </div>

              <div class="candidate-progress">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: candidate.percentage + '%' }"
                    :class="{ supermajority: candidate.percentage > 50 }"
                  ></div>
                </div>
                <div class="progress-text">
                  {{ candidate.percentage }}%
                  <span v-if="candidate.percentage > 50" class="supermajority-indicator"
                    >(>50%)</span
                  >
                </div>
              </div>

              <div class="candidate-status">
                <span v-if="isWinner(candidate.id, activePosition)" class="status-winner">🏆</span>
                <span v-else-if="votingRound === 2 && index < 2" class="status-runoff">🔄</span>
                <span v-else-if="votingRound === 2 && index >= 2" class="status-eliminated"
                  >❌</span
                >
                <span v-else class="status-active">{{ index === 0 ? '👑' : '📈' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Stats -->
      <div class="stats-sidebar">
        <!-- Real-time Stats Card -->
        <div class="stats-card">
          <div class="card-header">
            <h3 class="card-title">📈 STATISTIK REAL-TIME</h3>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-content">
                <div class="stat-value">{{ totalVoters }}</div>
                <div class="stat-label">Total Pemilih</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🗳️</div>
              <div class="stat-content">
                <div class="stat-value">{{ votedCount }}</div>
                <div class="stat-label">Sudah Voting</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⏳</div>
              <div class="stat-content">
                <div class="stat-value">{{ pendingCount }}</div>
                <div class="stat-label">Belum Voting</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📊</div>
              <div class="stat-content">
                <div class="stat-value">{{ participationRate }}%</div>
                <div class="stat-label">Partisipasi</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Activity Feed -->
        <div class="activity-card">
          <div class="card-header">
            <h3 class="card-title">🔄 AKTIVITAS TERBARU</h3>
            <span class="activity-count">{{ activityLog.length }}</span>
          </div>
          <div class="activity-feed">
            <div v-if="activityLog.length === 0" class="empty-activity">
              <p>Menunggu aktivitas voting...</p>
            </div>
            <div v-else class="activity-list">
              <div
                v-for="activity in recentActivities"
                :key="activity.id"
                class="activity-item"
                :class="activity.type"
              >
                <div class="activity-icon">{{ getActivityIcon(activity.type) }}</div>
                <div class="activity-content">
                  <p class="activity-message">{{ activity.message }}</p>
                  <div class="activity-meta">
                    <span class="activity-time">{{ activity.time }}</span>
                    <span v-if="activity.live" class="activity-live">LIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Round Summary -->
        <div class="round-summary-card">
          <div class="card-header">
            <h3 class="card-title">⏱️ RINGKASAN PUTARAN</h3>
          </div>
          <div class="round-summary">
            <div class="summary-item">
              <div class="summary-label">Putaran Saat Ini</div>
              <div class="summary-value">{{ votingRound }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Pemenang</div>
              <div class="summary-value">{{ winners.length }}/2</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Run-off</div>
              <div class="summary-value">{{ runoffs.length }} posisi</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Suara</div>
              <div class="summary-value">{{ totalVotes }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- System Footer -->
    <div class="system-footer">
      <div class="footer-left">
        <div class="system-brand">
          <span class="brand-name">SMANDA VOTE LIVE</span>
          <span class="version">v2.0</span>
        </div>
        <div class="session-info">
          <span class="session-name">{{ sessionName }}</span>
          <span class="session-status">{{ isConnected ? '• REAL-TIME' : '• OFFLINE' }}</span>
        </div>
      </div>
      <div class="footer-right">
        <div class="update-info">
          <span class="update-label">Update Terakhir:</span>
          <span class="update-time">{{ lastUpdateTime }}</span>
        </div>
        <div class="connection-info" :class="{ connected: isConnected }">
          <div class="connection-dot"></div>
          <span class="connection-text">
            {{ isConnected ? 'TERHUBUNG' : 'MEMUAT...' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'

// ===== STATE =====
const isConnected = ref(false)
const isFullscreen = ref(false)
const soundEnabled = ref(true)
const votingRound = ref(1)
const activePosition = ref('kesiswaan')
const isAdmin = ref(true)

// Data
const candidatesData = ref([])
const votesData = ref(0)
const sessionData = ref(null)
const activityLog = ref([])
const recentUpdates = ref([])

// Live Alert
const showVoteAlert = ref(false)
const lastVoter = ref('')
const lastCandidate = ref('')
const lastPosition = ref('')
const lastVoteTime = ref('')
const notificationType = ref('vote')
const notificationTitle = ref('VOTE BARU DITERIMA!')
const notificationAction = ref('memilih')
const notificationPosition = ref('')

// Counters
const updatesCount = ref(0)

// ===== POSITIONS =====
const positions = [
  { id: 'kesiswaan', name: 'WAKA KESISWAAN', icon: '👨‍🎓' },
  { id: 'sarpras', name: 'WAKA SARPRAS', icon: '🏫' },
]

// ===== COMPUTED =====
const totalVoters = computed(() => sessionData.value?.total_pemilih || 150)
const votedCount = computed(() => votesData.value)
const pendingCount = computed(() => Math.max(0, totalVoters.value - votedCount.value))
const participationRate = computed(() => {
  return totalVoters.value > 0 ? Math.round((votedCount.value / totalVoters.value) * 100) : 0
})

const totalVotes = computed(() => votesData.value)

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

const sessionName = computed(() => sessionData.value?.nama_sesi || 'PEMILIHAN WAKA 2024')

const recentActivities = computed(() => {
  return activityLog.value.slice(0, 5)
})

const winners = computed(() => {
  const result = []

  positions.forEach((position) => {
    const candidates = getCandidates(position.id)
    if (candidates.length === 0) return

    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0)
    if (totalVotes === 0) return

    candidates.forEach((candidate) => {
      const percentage = (candidate.votes / totalVotes) * 100
      if (percentage > 50) {
        result.push({
          jabatan: position.id,
          name: candidate.name,
          votes: candidate.votes,
          percentage: Math.round(percentage),
        })
      }
    })
  })

  return result
})

const runoffs = computed(() => {
  const result = []

  positions.forEach((position) => {
    const hasWinner = winners.value.some((w) => w.jabatan === position.id)
    if (!hasWinner) {
      const candidates = getCandidates(position.id)
      if (candidates.length >= 2) {
        result.push(position.id)
      }
    }
  })

  return result
})

// ===== SOUND SYSTEM =====
const playVoteSound = () => {
  if (!soundEnabled.value) return

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch {
    // Silent catch
  }
}

const playWinnerSound = () => {
  if (!soundEnabled.value) return

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.5)

    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.6)
  } catch {
    // Silent catch
  }
}

const playRoundChangeSound = () => {
  if (!soundEnabled.value) return

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 600
    oscillator.type = 'square'

    gainNode.gain.setValueAtTime(0, audioContext.currentTime)

    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1)

    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.15)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.25)
  } catch {
    // Silent catch
  }
}

const playErrorSound = () => {
  if (!soundEnabled.value) return

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 300
    oscillator.type = 'sawtooth'

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch {
    // Silent catch
  }
}

const playConnectionSound = () => {
  if (!soundEnabled.value) return

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
    oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.2)

    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.25)
  } catch {
    // Silent catch
  }
}

// ===== METHODS =====
const getPositionVotes = (positionId) => {
  return getCandidates(positionId).reduce((sum, c) => sum + c.votes, 0)
}

const getCandidates = (positionId) => {
  let candidates = candidatesData.value.filter((c) => c.jabatan === positionId)

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0)
  candidates = candidates.map((c) => ({
    ...c,
    percentage: totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0,
  }))

  return candidates.sort((a, b) => b.votes - a.votes)
}

const getPositionName = (positionId) => {
  const position = positions.find((p) => p.id === positionId)
  return position?.name || positionId
}

const getTabIcon = (positionId) => {
  if (winners.value.some((w) => w.jabatan === positionId)) return '✅'
  if (runoffs.value.includes(positionId)) return '🔄'
  return '📊'
}

const getPositionStatus = (positionId) => {
  if (winners.value.some((w) => w.jabatan === positionId)) return '✅ POSISI TERISI'
  if (runoffs.value.includes(positionId)) return '🔄 PERLU RUN-OFF'
  return '📊 SEDANG BERLANGSUNG'
}

const getPositionParticipation = (positionId) => {
  const positionVotes = getPositionVotes(positionId)
  return totalVoters.value > 0 ? Math.round((positionVotes / totalVoters.value) * 100) : 0
}

const isWinner = (candidateId, positionId) => {
  return winners.value.some(
    (w) =>
      w.jabatan === positionId &&
      getCandidates(positionId).find((c) => c.id === candidateId)?.name === w.name,
  )
}

const formatJabatan = (jabatan) => {
  return jabatan === 'kesiswaan' ? 'Waka Kesiswaan' : 'Waka Sarpras'
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

const getActivityIcon = (type) => {
  const icons = {
    vote: '🗳️',
    winner: '🏆',
    round: '🔄',
    info: 'ℹ️',
    error: '❌',
    success: '✅',
    connection: '🔌',
  }
  return icons[type] || '📝'
}

// ===== ACTIVITY LOG =====
const addActivity = (message, type = 'info', live = false) => {
  activityLog.value.unshift({
    id: Date.now(),
    message,
    type,
    time: new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    live,
    timestamp: Date.now(),
  })

  if (activityLog.value.length > 50) {
    activityLog.value = activityLog.value.slice(0, 50)
  }
}

// ===== NOTIFICATION SYSTEM =====
const showNotification = (type, voter, candidate, position) => {
  showVoteAlert.value = true
  lastVoter.value = voter
  lastCandidate.value = candidate
  lastPosition.value = position
  lastVoteTime.value = currentTime.value
  notificationType.value = type

  switch (type) {
    case 'vote':
      notificationTitle.value = 'VOTE BARU DITERIMA!'
      notificationAction.value = 'memilih'
      notificationPosition.value = `untuk ${formatJabatan(position)}`
      playVoteSound()
      break
    case 'winner':
      notificationTitle.value = '🏆 PEMENANG BARU!'
      notificationAction.value = 'menjadi pemenang'
      notificationPosition.value = formatJabatan(position)
      playWinnerSound()
      break
    case 'round':
      notificationTitle.value = '🔄 PUTARAN BERUBAH!'
      notificationAction.value = 'putaran'
      notificationPosition.value = `ke Putaran ${votingRound.value}`
      playRoundChangeSound()
      break
    case 'connection':
      notificationTitle.value = '🔌 KONEKSI REAL-TIME'
      notificationAction.value = 'terhubung'
      notificationPosition.value = 'sistem voting'
      playConnectionSound()
      break
  }

  setTimeout(() => {
    showVoteAlert.value = false
  }, 3000)
}

// ===== REALTIME FUNCTIONS =====
const setupRealtime = async () => {
  try {
    console.log('🔌 Setting up Supabase Realtime...')

    const { data: session, error: sessionError } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .order('dibuat_pada', { ascending: false })
      .limit(1)
      .single()

    if (sessionError) {
      console.error('Session error:', sessionError)
      addActivity('❌ Tidak ada sesi aktif', 'error')
      return
    }

    sessionData.value = session

    await loadCandidates()
    await loadVotesCount()

    const channel = supabase.channel('live-voting-system')

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'suara',
        filter: `sesi_id=eq.${session.id}`,
      },
      async (payload) => {
        console.log('🎯 New vote detected:', payload.new)
        await handleNewVote(payload.new)
      },
    )

    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'kandidat',
        filter: `sesi_id=eq.${session.id}`,
      },
      (payload) => {
        console.log('📈 Candidate updated:', payload.new)
        handleCandidateUpdate(payload.new)
      },
    )

    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sesi_pemilihan',
        filter: `id=eq.${session.id}`,
      },
      (payload) => {
        console.log('🔄 Session updated:', payload.new)
        sessionData.value = payload.new
      },
    )

    channel.subscribe((status) => {
      console.log('📡 Realtime status:', status)
      isConnected.value = status === 'SUBSCRIBED'

      if (status === 'SUBSCRIBED') {
        showNotification('connection', 'Sistem', 'Live Results', 'connection')
        addActivity('✅ Terhubung ke sistem realtime', 'connection', true)
      } else if (status === 'CHANNEL_ERROR') {
        addActivity('⚠️ Koneksi terputus, mencoba ulang...', 'error')
        playErrorSound()
        setTimeout(setupRealtime, 3000)
      }
    })
  } catch (err) {
    console.error('❌ Setup realtime error:', err)
    addActivity('❌ Gagal menyambung ke realtime', 'error')
    playErrorSound()

    setTimeout(setupRealtime, 5000)
  }
}

const loadCandidates = async () => {
  try {
    if (!sessionData.value?.id) return

    const { data: candidates, error } = await supabase
      .from('kandidat')
      .select(
        `
        *,
        pengguna:pengguna_id(nama_lengkap)
      `,
      )
      .eq('sesi_id', sessionData.value.id)
      .in('jabatan', ['kesiswaan', 'sarpras'])
      .order('total_suara', { ascending: false })

    if (error) {
      console.error('Load candidates error:', error)
      addActivity('❌ Gagal memuat data kandidat', 'error')
      return
    }

    candidatesData.value = (candidates || []).map((candidate) => ({
      id: candidate.id,
      name: candidate.pengguna?.nama_lengkap || 'Unknown',
      jabatan: candidate.jabatan,
      votes: candidate.total_suara || 0,
      voteChange: 0,
      hasUpdate: false,
    }))

    addActivity(`📊 ${candidatesData.value.length} kandidat dimuat`, 'info')
  } catch (err) {
    console.error('❌ Load candidates error:', err)
    addActivity('❌ Gagal memuat data kandidat', 'error')
  }
}

const loadVotesCount = async () => {
  try {
    if (!sessionData.value?.id) return

    const { count, error } = await supabase
      .from('suara')
      .select('*', { count: 'exact', head: true })
      .eq('sesi_id', sessionData.value.id)
      .eq('is_draft', false)

    if (error) {
      console.error('Load votes count error:', error)
      return
    }

    votesData.value = count || 0
  } catch (err) {
    console.error('❌ Load votes count error:', err)
  }
}

const handleNewVote = async (vote) => {
  try {
    updatesCount.value++

    const [voterResult, candidateResult] = await Promise.all([
      supabase.from('pengguna').select('nama_lengkap').eq('id', vote.pemilih_id).single(),
      supabase
        .from('kandidat')
        .select('*, pengguna:pengguna_id(nama_lengkap)')
        .eq('id', vote.kandidat_id)
        .single(),
    ])

    const voterName = voterResult.data?.nama_lengkap || 'Seseorang'
    const candidateName = candidateResult.data?.pengguna?.nama_lengkap || 'Unknown'

    showNotification('vote', voterName, candidateName, vote.jabatan)

    if (!recentUpdates.value.includes(vote.jabatan)) {
      recentUpdates.value.push(vote.jabatan)
      setTimeout(() => {
        recentUpdates.value = recentUpdates.value.filter((p) => p !== vote.jabatan)
      }, 1000)
    }

    votesData.value++

    addActivity(`🗳️ ${voterName} memilih ${candidateName}`, 'vote', true)
  } catch (err) {
    console.error('❌ Handle new vote error:', err)
    addActivity('❌ Gagal memproses vote baru', 'error')
  }
}

const handleCandidateUpdate = (candidate) => {
  try {
    const index = candidatesData.value.findIndex((c) => c.id === candidate.id)
    if (index !== -1) {
      const oldVotes = candidatesData.value[index].votes
      const newVotes = candidate.total_suara || 0

      if (newVotes > oldVotes) {
        const voteChange = newVotes - oldVotes

        candidatesData.value[index] = {
          ...candidatesData.value[index],
          votes: newVotes,
          voteChange: voteChange,
          hasUpdate: true,
        }

        setTimeout(() => {
          checkForNewWinner(candidate)
        }, 100)

        setTimeout(() => {
          if (candidatesData.value[index]) {
            candidatesData.value[index].hasUpdate = false
            candidatesData.value[index].voteChange = 0
          }
        }, 2000)
      }
    }
  } catch (err) {
    console.error('❌ Handle candidate update error:', err)
  }
}

const checkForNewWinner = (candidate) => {
  const positionCandidates = getCandidates(candidate.jabatan)
  const totalVotes = positionCandidates.reduce((sum, c) => sum + c.votes, 0)

  if (totalVotes > 0) {
    const candidateData = positionCandidates.find((c) => c.id === candidate.id)
    if (candidateData) {
      const percentage = (candidateData.votes / totalVotes) * 100

      if (percentage > 50 && !isWinner(candidate.id, candidate.jabatan)) {
        showNotification('winner', candidateData.name, '', candidate.jabatan)
        addActivity(
          `🏆 ${candidateData.name} MENANG sebagai ${formatJabatan(candidate.jabatan)}!`,
          'winner',
          true,
        )
      }
    }
  }
}

// ===== UI CONTROLS =====
const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
  addActivity(soundEnabled.value ? '🔊 Suara diaktifkan' : '🔇 Suara dimatikan', 'info')
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
    addActivity('🖥️ Mode layar penuh diaktifkan', 'info')
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
    addActivity('📱 Mode layar penuh dinonaktifkan', 'info')
  }
}

const startRunoff = () => {
  if (votingRound.value === 1 && runoffs.value.length > 0) {
    votingRound.value = 2
    showNotification('round', 'Putaran', '2', 'round')
    addActivity(`🔄 PUTARAN 2 DIMULAI! ${runoffs.value.length} posisi run-off`, 'round', true)
  }
}

// ===== LIFECYCLE =====
onMounted(async () => {
  console.log('🚀 Live Results mounted')

  if (window.innerWidth > 1024) {
    isFullscreen.value = true
    document.documentElement.requestFullscreen?.()
  }

  await setupRealtime()

  setInterval(() => {
    updatesCount.value = 0
  }, 1000)
})

onUnmounted(() => {
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
  color: white;
  font-family: 'Segoe UI', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fullscreen-mode {
  padding: 0;
}

/* ===== TOP BAR ===== */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.connection-status,
.center-info,
.right-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 1.5s infinite;
}

.status-indicator.connected {
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
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.status-text,
.updates-counter {
  font-weight: 600;
  font-size: 14px;
}

.updates-counter {
  color: #3b82f6;
}

.round-info,
.votes-info,
.winners-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.round-icon,
.votes-icon,
.winners-icon {
  font-size: 16px;
}

.round-text,
.votes-text,
.winners-text {
  font-weight: bold;
  font-size: 14px;
}

.time-display,
.participation-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-text,
.participation-text {
  font-weight: 600;
  font-size: 14px;
}

.sound-toggle,
.fullscreen-toggle {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s;
}

.sound-toggle:hover,
.fullscreen-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
}

.sound-toggle.muted {
  opacity: 0.7;
}

/* ===== VOTE NOTIFICATION ===== */
.vote-notification {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 12px;
  padding: 16px 24px;
  min-width: 400px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    transform: translate(-50%, -20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-icon {
  font-size: 32px;
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

.notification-text {
  flex: 1;
}

.notification-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 4px;
}

.notification-details {
  font-size: 14px;
  margin-bottom: 2px;
}

.voter,
.candidate {
  font-weight: bold;
}

.notification-position {
  font-size: 12px;
  opacity: 0.9;
}

.notification-time {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  opacity: 0.8;
}

/* ===== MAIN DASHBOARD ===== */
.main-dashboard {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  padding: 24px;
  flex: 1;
  overflow: hidden;
}

.fullscreen-mode .main-dashboard {
  padding: 32px;
}

/* ===== WINNERS SECTION ===== */
.winners-section {
  grid-column: 1 / -1;
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid rgba(34, 197, 94, 0.3);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
}

.winners-header {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 24px;
  color: #22c55e;
}

.title-icon {
  font-size: 28px;
}

.title-count {
  background: rgba(34, 197, 94, 0.3);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 16px;
  margin-left: 8px;
}

.winners-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.winner-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  border: 2px solid rgba(34, 197, 94, 0.2);
  position: relative;
  overflow: hidden;
}

.winner-card.supermajority {
  border-color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
}

.winner-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #22c55e, #4ade80);
}

.winner-card.supermajority::before {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.winner-position {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.winner-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
  color: white;
}

.winner-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-votes {
  color: #cbd5e1;
  font-size: 16px;
}

.stat-percentage {
  font-size: 28px;
  font-weight: bold;
  color: #22c55e;
}

.winner-card.supermajority .stat-percentage {
  color: #fbbf24;
}

.winner-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.winner-badge.supermajority {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

/* ===== RUN-OFF SECTION ===== */
.runoff-section {
  grid-column: 1 / -1;
  margin-bottom: 16px;
}

.runoff-alert {
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(245, 158, 11, 0.1);
  border: 2px solid rgba(245, 158, 11, 0.3);
  border-radius: 16px;
  padding: 24px;
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

.runoff-icon {
  font-size: 40px;
}

.runoff-content {
  flex: 1;
}

.runoff-title {
  margin: 0 0 8px 0;
  color: #f59e0b;
  font-size: 20px;
}

.runoff-description {
  margin: 0 0 12px 0;
  color: #cbd5e1;
  font-size: 16px;
}

.runoff-positions {
  display: flex;
  gap: 8px;
}

.position-tag {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
}

.runoff-button {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.runoff-button:hover {
  transform: translateY(-2px);
}

/* ===== POSITIONS CONTAINER ===== */
.positions-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.position-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  flex-shrink: 0;
}

.position-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: none;
  border: none;
  color: white;
  padding: 16px;
  cursor: pointer;
  border-radius: 12px;
  font-weight: bold;
  font-size: 16px;
  transition: all 0.2s;
  position: relative;
}

.position-tab:hover {
  background: rgba(255, 255, 255, 0.1);
}

.position-tab.active {
  background: rgba(59, 130, 246, 0.3);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.position-tab.has-winner {
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid rgba(34, 197, 94, 0.3);
}

.position-tab.has-update {
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

.update-dot {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 10px;
  height: 10px;
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
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
}

/* ===== POSITION DASHBOARD ===== */
.position-dashboard {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.dashboard-title {
  margin: 0;
  font-size: 24px;
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;
}

.dashboard-status {
  font-size: 14px;
  font-weight: normal;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}

.dashboard-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #3b82f6;
}

/* ===== CANDIDATES RANKING ===== */
.candidates-ranking {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 8px;
}

.candidate-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border-left: 4px solid transparent;
  transition: all 0.2s;
  animation: slideIn 0.3s;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.candidate-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.candidate-item.rank-1 {
  border-left-color: #fbbf24;
  background: rgba(251, 191, 36, 0.05);
}

.candidate-item.rank-2 {
  border-left-color: #94a3b8;
  background: rgba(148, 163, 184, 0.05);
}

.candidate-item.rank-3 {
  border-left-color: #92400e;
  background: rgba(146, 64, 14, 0.05);
}

.candidate-item.vote-update {
  animation: highlightVote 1s;
  border-left-color: #3b82f6;
}

@keyframes highlightVote {
  0% {
    background: rgba(59, 130, 246, 0.3);
  }
  100% {
    background: rgba(255, 255, 255, 0.03);
  }
}

.candidate-item.is-winner {
  border-left-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.candidate-item.in-runoff {
  border-left-color: #f59e0b;
}

.candidate-item.eliminated {
  opacity: 0.5;
  border-left-color: #ef4444;
}

.candidate-rank {
  min-width: 60px;
  text-align: center;
}

.round-2-badge {
  background: #f59e0b;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
}

.rank-number {
  font-size: 24px;
  font-weight: bold;
  color: #94a3b8;
}

.candidate-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.candidate-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.candidate-info {
  flex: 1;
}

.candidate-name {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 4px;
}

.candidate-meta {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: #94a3b8;
}

.meta-change {
  color: #22c55e;
  font-weight: bold;
  animation: fadeInUp 0.5s;
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

.candidate-progress {
  width: 200px;
  flex-shrink: 0;
}

.progress-bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.progress-fill.supermajority {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.progress-text {
  text-align: center;
  font-size: 14px;
  color: #94a3b8;
}

.supermajority-indicator {
  color: #fbbf24;
  font-size: 12px;
}

.candidate-status {
  min-width: 40px;
  text-align: center;
  font-size: 24px;
}

.status-winner {
  color: #22c55e;
  animation: spin 2s infinite linear;
}

@keyframes spin {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}

.status-runoff {
  color: #f59e0b;
}

.status-eliminated {
  color: #ef4444;
  opacity: 0.7;
}

.status-active {
  color: #3b82f6;
}

/* ===== STATS SIDEBAR ===== */
.stats-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

.stats-card,
.activity-card,
.round-summary-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  margin: 0;
  font-size: 18px;
  color: white;
}

.activity-count {
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

/* ===== STATS GRID ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.stat-icon {
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #3b82f6;
  display: block;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
}

/* ===== ACTIVITY FEED ===== */
.activity-feed {
  height: 200px;
  overflow-y: auto;
}

.empty-activity {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  font-style: italic;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border-left: 3px solid transparent;
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
  border-left-color: #3b82f6;
}

.activity-item.winner {
  border-left-color: #22c55e;
}

.activity-item.round {
  border-left-color: #f59e0b;
}

.activity-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.activity-content {
  flex: 1;
}

.activity-message {
  font-size: 14px;
  color: #e2e8f0;
  margin-bottom: 4px;
  line-height: 1.4;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.activity-time {
  color: #94a3b8;
  font-family: 'Courier New', monospace;
}

.activity-live {
  background: #ef4444;
  color: white;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  animation: pulse 1s infinite;
}

/* ===== ROUND SUMMARY ===== */
.round-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.summary-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: white;
}

/* ===== SYSTEM FOOTER ===== */
.system-footer {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.system-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-name {
  font-weight: bold;
  color: #3b82f6;
  font-size: 14px;
}

.version {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #94a3b8;
}

.session-status {
  color: #22c55e;
}

.connection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 20px;
}

.connection-info.connected {
  background: rgba(34, 197, 94, 0.1);
}

.connection-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 1.5s infinite;
}

.connection-info.connected .connection-dot {
  background: #22c55e;
  animation: pulse 1s infinite;
}

.connection-text {
  font-size: 12px;
  font-weight: bold;
}

.connection-info.connected .connection-text {
  color: #22c55e;
}

.update-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.update-label {
  color: #94a3b8;
}

.update-time {
  color: white;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

/* ===== TRANSITIONS ===== */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translate(-50%, -20px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1400px) {
  .main-dashboard {
    grid-template-columns: 1fr;
  }

  .winners-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .position-tabs {
    flex-direction: column;
  }

  .vote-notification {
    min-width: 90%;
    left: 5%;
    transform: translateX(0);
  }

  .candidate-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .candidate-progress {
    width: 100%;
  }
}
</style>
