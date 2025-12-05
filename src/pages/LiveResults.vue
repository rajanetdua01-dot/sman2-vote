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
/* ===== GLOBAL RESET & BASE ===== */
.live-results {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  font-family: 'Segoe UI', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.live-results * {
  box-sizing: border-box;
}

/* ===== TOP BAR COMPONENT ===== */
.live-results .top-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.live-results .connection-status,
.live-results .center-info,
.live-results .right-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.live-results .status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 1.5s infinite;
}

.live-results .status-indicator.connected {
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

.live-results .status-text,
.live-results .updates-counter {
  font-weight: 600;
  font-size: 14px;
}

.live-results .updates-counter {
  color: #3b82f6;
}

.live-results .round-info,
.live-results .votes-info,
.live-results .winners-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.live-results .round-icon,
.live-results .votes-icon,
.live-results .winners-icon {
  font-size: 16px;
}

.live-results .round-text,
.live-results .votes-text,
.live-results .winners-text {
  font-weight: bold;
  font-size: 14px;
}

.live-results .time-display,
.live-results .participation-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.live-results .time-text,
.live-results .participation-text {
  font-weight: 600;
  font-size: 14px;
}

.live-results .sound-toggle,
.live-results .fullscreen-toggle {
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
  flex-shrink: 0;
}

.live-results .sound-toggle:hover,
.live-results .fullscreen-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
}

.live-results .sound-toggle.muted {
  opacity: 0.7;
}

/* ===== VOTE NOTIFICATION COMPONENT ===== */
.live-results .vote-notification {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 12px;
  padding: 16px 24px;
  min-width: 300px;
  max-width: 90%;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.3s ease;
}

.live-results .vote-notification.vote {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-left: 4px solid #3b82f6;
}

.live-results .vote-notification.winner {
  background: linear-gradient(135deg, #22c55e, #4ade80);
  border-left: 4px solid #22c55e;
}

.live-results .vote-notification.round {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-left: 4px solid #f59e0b;
}

.live-results .vote-notification.connection {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  border-left: 4px solid #8b5cf6;
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

.live-results .notification-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.live-results .notification-icon {
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

.live-results .notification-text {
  flex: 1;
}

.live-results .notification-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 4px;
}

.live-results .notification-details {
  font-size: 14px;
  margin-bottom: 2px;
}

.live-results .voter,
.live-results .candidate {
  font-weight: bold;
}

.live-results .notification-position {
  font-size: 12px;
  opacity: 0.9;
}

.live-results .notification-time {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  opacity: 0.8;
}

/* ===== MAIN DASHBOARD COMPONENT ===== */
.live-results .main-dashboard {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.live-results .fullscreen-mode .main-dashboard {
  padding: 32px;
  height: calc(100vh - 140px);
}

/* ===== WINNERS SECTION COMPONENT ===== */
.live-results .winners-section {
  grid-column: 1 / -1;
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid rgba(34, 197, 94, 0.3);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
}

.live-results .winners-header {
  margin-bottom: 20px;
}

.live-results .section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 24px;
  color: #22c55e;
}

.live-results .title-icon {
  font-size: 28px;
}

.live-results .title-count {
  background: rgba(34, 197, 94, 0.3);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 16px;
  margin-left: 8px;
}

.live-results .winners-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.live-results .winner-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  border: 2px solid rgba(34, 197, 94, 0.2);
  position: relative;
  overflow: hidden;
}

.live-results .winner-card.supermajority {
  border-color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
}

.live-results .winner-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #22c55e, #4ade80);
}

.live-results .winner-card.supermajority::before {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.live-results .winner-position {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.live-results .winner-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
  color: white;
}

.live-results .winner-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.live-results .stat-votes {
  color: #cbd5e1;
  font-size: 16px;
}

.live-results .stat-percentage {
  font-size: 28px;
  font-weight: bold;
  color: #22c55e;
}

.live-results .winner-card.supermajority .stat-percentage {
  color: #fbbf24;
}

.live-results .winner-badge {
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

.live-results .winner-badge.supermajority {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

/* ===== RUN-OFF SECTION COMPONENT ===== */
.live-results .runoff-section {
  grid-column: 1 / -1;
  margin-bottom: 16px;
}

.live-results .runoff-alert {
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

.live-results .runoff-icon {
  font-size: 40px;
}

.live-results .runoff-content {
  flex: 1;
}

.live-results .runoff-title {
  margin: 0 0 8px 0;
  color: #f59e0b;
  font-size: 20px;
}

.live-results .runoff-description {
  margin: 0 0 12px 0;
  color: #cbd5e1;
  font-size: 16px;
}

.live-results .runoff-positions {
  display: flex;
  gap: 8px;
}

.live-results .position-tag {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
}

.live-results .runoff-button {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.live-results .runoff-button:hover {
  transform: translateY(-2px);
}

/* ===== POSITIONS CONTAINER COMPONENT ===== */
.live-results .positions-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.live-results .position-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  flex-shrink: 0;
}

.live-results .position-tab {
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

.live-results .position-tab:hover {
  background: rgba(255, 255, 255, 0.1);
}

.live-results .position-tab.active {
  background: rgba(59, 130, 246, 0.3);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.live-results .position-tab.has-winner {
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid rgba(34, 197, 94, 0.3);
}

.live-results .position-tab.has-update {
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

.live-results .update-dot {
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

.live-results .tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
}

/* ===== POSITION DASHBOARD COMPONENT ===== */
.live-results .position-dashboard {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.live-results .dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.live-results .dashboard-title {
  margin: 0;
  font-size: 24px;
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;
}

.live-results .dashboard-status {
  font-size: 14px;
  font-weight: normal;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}

.live-results .dashboard-stats {
  display: flex;
  gap: 24px;
}

.live-results .stat-item {
  text-align: center;
}

.live-results .stat-label {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.live-results .stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #3b82f6;
}

/* ===== CANDIDATES RANKING COMPONENT ===== */
.live-results .candidates-ranking {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 8px;
}

.live-results .candidate-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border-left: 4px solid transparent;
  transition: all 0.2s;
  animation: slideIn 0.3s;
  position: relative;
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

.live-results .candidate-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.live-results .candidate-item.rank-1 {
  border-left-color: #fbbf24;
  background: rgba(251, 191, 36, 0.05);
}

.live-results .candidate-item.rank-2 {
  border-left-color: #94a3b8;
  background: rgba(148, 163, 184, 0.05);
}

.live-results .candidate-item.rank-3 {
  border-left-color: #92400e;
  background: rgba(146, 64, 14, 0.05);
}

.live-results .candidate-item.vote-update {
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

.live-results .candidate-item.is-winner {
  border-left-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.live-results .candidate-item.in-runoff {
  border-left-color: #f59e0b;
}

.live-results .candidate-item.eliminated {
  opacity: 0.5;
  border-left-color: #ef4444;
}

.live-results .candidate-rank {
  min-width: 60px;
  text-align: center;
}

.live-results .round-2-badge {
  background: #f59e0b;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
}

.live-results .rank-number {
  font-size: 24px;
  font-weight: bold;
  color: #94a3b8;
}

.live-results .candidate-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.live-results .candidate-avatar {
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

.live-results .candidate-info {
  flex: 1;
}

.live-results .candidate-name {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 4px;
  color: white;
}

.live-results .candidate-meta {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: #94a3b8;
}

.live-results .meta-change {
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

.live-results .candidate-progress {
  width: 200px;
  flex-shrink: 0;
}

.live-results .progress-bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 4px;
}

.live-results .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.live-results .progress-fill.supermajority {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.live-results .progress-text {
  text-align: center;
  font-size: 14px;
  color: #94a3b8;
}

.live-results .supermajority-indicator {
  color: #fbbf24;
  font-size: 12px;
}

.live-results .candidate-status {
  min-width: 40px;
  text-align: center;
  font-size: 24px;
}

.live-results .status-winner {
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

.live-results .status-runoff {
  color: #f59e0b;
}

.live-results .status-eliminated {
  color: #ef4444;
  opacity: 0.7;
}

.live-results .status-active {
  color: #3b82f6;
}

/* ===== STATS SIDEBAR COMPONENT ===== */
.live-results .stats-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.live-results .stats-card,
.live-results .activity-card,
.live-results .round-summary-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
}

.live-results .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.live-results .card-title {
  margin: 0;
  font-size: 18px;
  color: white;
}

.live-results .activity-count {
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

/* ===== STATS GRID COMPONENT ===== */
.live-results .stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.live-results .stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.live-results .stat-icon {
  font-size: 24px;
}

.live-results .stat-content {
  flex: 1;
}

.live-results .stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #3b82f6;
  display: block;
  margin-bottom: 2px;
}

.live-results .stat-label {
  font-size: 12px;
  color: #94a3b8;
}

/* ===== ACTIVITY FEED COMPONENT ===== */
.live-results .activity-feed {
  height: 200px;
  overflow-y: auto;
}

.live-results .empty-activity {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  font-style: italic;
}

.live-results .activity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.live-results .activity-item {
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

.live-results .activity-item.vote {
  border-left-color: #3b82f6;
}

.live-results .activity-item.winner {
  border-left-color: #22c55e;
}

.live-results .activity-item.round {
  border-left-color: #f59e0b;
}

.live-results .activity-item.info {
  border-left-color: #94a3b8;
}

.live-results .activity-item.error {
  border-left-color: #ef4444;
}

.live-results .activity-item.success {
  border-left-color: #22c55e;
}

.live-results .activity-item.connection {
  border-left-color: #8b5cf6;
}

.live-results .activity-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.live-results .activity-content {
  flex: 1;
}

.live-results .activity-message {
  font-size: 14px;
  color: #e2e8f0;
  margin-bottom: 4px;
  line-height: 1.4;
}

.live-results .activity-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.live-results .activity-time {
  color: #94a3b8;
  font-family: 'Courier New', monospace;
}

.live-results .activity-live {
  background: #ef4444;
  color: white;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  animation: pulse 1s infinite;
}

/* ===== ROUND SUMMARY COMPONENT ===== */
.live-results .round-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.live-results .summary-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.live-results .summary-label {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.live-results .summary-value {
  font-size: 24px;
  font-weight: bold;
  color: white;
}

/* ===== SYSTEM FOOTER COMPONENT ===== */
.live-results .system-footer {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.live-results .footer-left,
.live-results .footer-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.live-results .system-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.live-results .brand-name {
  font-weight: bold;
  color: #3b82f6;
  font-size: 14px;
}

.live-results .version {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.live-results .session-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #94a3b8;
}

.live-results .session-status {
  color: #22c55e;
}

.live-results .connection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 20px;
}

.live-results .connection-info.connected {
  background: rgba(34, 197, 94, 0.1);
}

.live-results .connection-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 1.5s infinite;
}

.live-results .connection-info.connected .connection-dot {
  background: #22c55e;
  animation: pulse 1s infinite;
}

.live-results .connection-text {
  font-size: 12px;
  font-weight: bold;
}

.live-results .connection-info.connected .connection-text {
  color: #22c55e;
}

.live-results .update-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.live-results .update-label {
  color: #94a3b8;
}

.live-results .update-time {
  color: white;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

/* ===== TRANSITIONS COMPONENT ===== */
.live-results .slide-down-enter-active,
.live-results .slide-down-leave-active {
  transition: all 0.3s ease;
}

.live-results .slide-down-enter-from,
.live-results .slide-down-leave-to {
  transform: translate(-50%, -20px);
  opacity: 0;
}

.live-results .fade-enter-active,
.live-results .fade-leave-active {
  transition: opacity 0.3s ease;
}

.live-results .fade-enter-from,
.live-results .fade-leave-to {
  opacity: 0;
}

/* ===== RESPONSIVE BREAKPOINTS ===== */

/* Mobile: ≤768px */
@media (max-width: 768px) {
  .live-results .top-bar {
    flex-direction: column;
    text-align: center;
    padding: 16px 12px;
    gap: 12px;
  }

  .live-results .connection-status,
  .live-results .center-info,
  .live-results .right-info {
    width: 100%;
    justify-content: center;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  .live-results .main-dashboard {
    grid-template-columns: 1fr;
    padding: 16px 12px;
    gap: 16px;
  }

  .live-results .winners-grid {
    grid-template-columns: 1fr !important;
  }

  .live-results .runoff-alert {
    flex-direction: column;
    text-align: center;
    gap: 16px;
    padding: 20px;
  }

  .live-results .runoff-button {
    width: 100%;
  }

  .live-results .position-tabs {
    flex-direction: column;
  }

  .live-results .position-tab {
    width: 100%;
    margin-bottom: 4px;
    padding: 14px;
  }

  .live-results .candidate-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 20px 16px;
  }

  .live-results .candidate-profile {
    width: 100%;
  }

  .live-results .candidate-progress {
    width: 100% !important;
  }

  .live-results .candidate-status {
    position: absolute;
    top: 20px;
    right: 20px;
  }

  .live-results .candidate-rank {
    position: absolute;
    top: 20px;
    left: 20px;
  }

  .live-results .stats-sidebar {
    gap: 16px;
  }

  .live-results .stats-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .live-results .activity-feed {
    height: 150px;
  }

  .live-results .round-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .live-results .system-footer {
    flex-direction: column;
    text-align: center;
    padding: 16px 12px;
    gap: 12px;
  }

  .live-results .footer-left,
  .live-results .footer-right {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .live-results .vote-notification {
    top: 70px;
    width: calc(100% - 24px);
    min-width: auto;
    padding: 12px 16px;
  }

  .live-results .notification-content {
    gap: 12px;
  }

  .live-results .notification-icon {
    font-size: 24px;
  }

  .live-results .notification-title {
    font-size: 14px;
  }

  .live-results .notification-details {
    font-size: 13px;
  }
}

/* Tablet: 769px-1024px */
@media (min-width: 769px) and (max-width: 1024px) {
  .live-results .top-bar {
    padding: 12px 16px;
    gap: 12px;
  }

  .live-results .center-info {
    flex-wrap: wrap;
    justify-content: center;
  }

  .live-results .main-dashboard {
    grid-template-columns: 1.5fr 1fr;
    padding: 16px;
    gap: 16px;
  }

  .live-results .position-tab {
    padding: 12px 8px;
    font-size: 14px;
  }

  .live-results .candidate-item {
    padding: 14px;
    gap: 16px;
  }

  .live-results .candidate-progress {
    width: 120px;
  }

  .live-results .candidate-avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .live-results .stats-card,
  .live-results .activity-card,
  .live-results .round-summary-card {
    padding: 16px;
  }

  .live-results .activity-feed {
    height: 180px;
  }

  .live-results .system-footer {
    padding: 16px;
  }
}

/* Desktop: 1025px-1920px */
@media (min-width: 1025px) and (max-width: 1920px) {
  .live-results .main-dashboard {
    grid-template-columns: 2fr 1fr;
    padding: 24px;
    gap: 24px;
  }

  .live-results .candidate-item {
    padding: 16px;
    gap: 20px;
  }

  .live-results .candidate-progress {
    width: 150px;
  }
}

/* TV 70inch / 4K: ≥1921px */
@media (min-width: 1921px) {
  .live-results .top-bar {
    padding: 24px 40px;
    font-size: 1.2em;
  }

  .live-results .status-text,
  .live-results .round-text,
  .live-results .votes-text,
  .live-results .winners-text,
  .live-results .time-text,
  .live-results .participation-text {
    font-size: 18px;
  }

  .live-results .sound-toggle,
  .live-results .fullscreen-toggle {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }

  .live-results .main-dashboard {
    grid-template-columns: 2.5fr 1fr;
    padding: 32px 40px;
    gap: 32px;
    max-width: 3840px;
    margin: 0 auto;
  }

  .live-results .section-title {
    font-size: 36px !important;
  }

  .live-results .winner-name {
    font-size: 32px !important;
  }

  .live-results .dashboard-title {
    font-size: 32px !important;
  }

  .live-results .candidate-name {
    font-size: 24px !important;
  }

  .live-results .position-tab {
    padding: 24px 16px;
    font-size: 20px;
    border-radius: 16px;
  }

  .live-results .tab-icon {
    font-size: 24px;
  }

  .live-results .candidate-item {
    padding: 24px;
    gap: 24px;
    margin-bottom: 16px;
    border-radius: 16px;
  }

  .live-results .candidate-avatar {
    width: 64px;
    height: 64px;
    font-size: 24px;
  }

  .live-results .candidate-name {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .live-results .candidate-progress {
    width: 250px;
  }

  .live-results .progress-bar {
    height: 12px;
    border-radius: 6px;
  }

  .live-results .rank-number {
    font-size: 32px;
  }

  .live-results .stats-sidebar {
    gap: 32px;
  }

  .live-results .stats-card,
  .live-results .activity-card,
  .live-results .round-summary-card {
    padding: 32px;
    border-radius: 20px;
  }

  .live-results .card-title {
    font-size: 24px;
    margin-bottom: 24px;
  }

  .live-results .stat-card {
    padding: 20px;
  }

  .live-results .stat-value {
    font-size: 32px;
  }

  .live-results .stat-label {
    font-size: 16px;
  }

  .live-results .activity-feed {
    height: 300px;
  }

  .live-results .activity-message {
    font-size: 18px;
  }

  .live-results .vote-notification {
    top: 120px;
    padding: 24px 32px;
    border-radius: 20px;
    max-width: 600px;
  }

  .live-results .notification-icon {
    font-size: 48px;
  }

  .live-results .notification-title {
    font-size: 24px;
  }

  .live-results .notification-details {
    font-size: 20px;
  }

  .live-results .system-footer {
    padding: 24px 40px;
  }

  .live-results .brand-name {
    font-size: 18px;
  }

  .live-results .session-name {
    font-size: 16px;
  }

  .live-results .connection-text {
    font-size: 16px;
  }
}

/* Fullscreen mode enhancements */
.live-results.fullscreen-mode {
  padding: 0;
}

.live-results.fullscreen-mode .top-bar {
  padding: 16px 32px;
}

.live-results.fullscreen-mode .main-dashboard {
  height: calc(100vh - 140px);
}

/* TV Mode: Enhanced untuk layar besar */
@media (min-width: 1921px) {
  .live-results.fullscreen-mode .main-dashboard {
    height: calc(100vh - 180px);
    padding: 40px 60px;
  }

  .live-results.fullscreen-mode .candidates-ranking {
    max-height: 60vh;
  }

  .live-results.fullscreen-mode .activity-feed {
    height: 40vh;
  }
}

/* Typography scaling untuk berbagai device */
@media (max-width: 480px) {
  .live-results .section-title {
    font-size: 18px !important;
  }

  .live-results .winner-name {
    font-size: 18px !important;
  }

  .live-results .dashboard-title {
    font-size: 16px !important;
  }

  .live-results .candidate-name {
    font-size: 14px !important;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .live-results .section-title {
    font-size: 20px !important;
  }

  .live-results .winner-name {
    font-size: 20px !important;
  }

  .live-results .dashboard-title {
    font-size: 18px !important;
  }

  .live-results .candidate-name {
    font-size: 16px !important;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .live-results .section-title {
    font-size: 22px !important;
  }

  .live-results .winner-name {
    font-size: 22px !important;
  }

  .live-results .dashboard-title {
    font-size: 20px !important;
  }

  .live-results .candidate-name {
    font-size: 17px !important;
  }
}

@media (min-width: 1025px) and (max-width: 1920px) {
  .live-results .section-title {
    font-size: 24px !important;
  }

  .live-results .winner-name {
    font-size: 24px !important;
  }

  .live-results .dashboard-title {
    font-size: 22px !important;
  }

  .live-results .candidate-name {
    font-size: 18px !important;
  }
}

/* Touch friendly untuk mobile */
@media (max-width: 768px) {
  .live-results .sound-toggle,
  .live-results .fullscreen-toggle,
  .live-results .runoff-button {
    min-height: 44px;
    min-width: 44px;
  }

  .live-results .candidate-item {
    padding: 16px;
    margin-bottom: 8px;
  }

  .live-results .candidates-ranking,
  .live-results .activity-feed {
    padding-right: 4px;
    -webkit-overflow-scrolling: touch;
  }
}

/* Print styles */
@media print {
  .live-results {
    background: white !important;
    color: black !important;
  }

  .live-results .top-bar,
  .live-results .system-footer,
  .live-results .sound-toggle,
  .live-results .fullscreen-toggle,
  .live-results .runoff-button,
  .live-results .vote-notification {
    display: none !important;
  }

  .live-results .main-dashboard {
    display: block !important;
    height: auto !important;
  }

  .live-results .winners-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .live-results {
    background: black;
  }

  .live-results .candidate-item {
    border: 2px solid white;
  }

  .live-results .progress-fill {
    border: 1px solid white;
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .live-results *,
  .live-results *::before,
  .live-results *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .live-results .vote-notification {
    animation: none;
  }

  .live-results .notification-icon {
    animation: none;
  }

  .live-results .status-indicator,
  .live-results .update-dot,
  .live-results .connection-dot {
    animation: none;
  }
}
</style>
