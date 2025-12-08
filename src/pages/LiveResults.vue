<template>
  <div class="live-results" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- Status Header -->
    <div class="status-header">
      <div class="header-left">
        <span class="update-label">Update:</span>
        <span class="update-time">{{ lastUpdateTime }}</span>
        <button @click="manualRefresh" class="refresh-btn" title="Refresh" :disabled="isRefreshing">
          {{ isRefreshing ? '⏳' : '↻' }}
        </button>
      </div>

      <div class="header-center">
        <span class="status-badge">{{ sessionStatus }}</span>
      </div>

      <div class="header-right">
        <div class="connection-status" :class="{ connected: isConnected }">
          <span class="connection-dot"></span>
          <span class="connection-text">
            {{
              isLargeScreen ? (isConnected ? '📺 LIVE TV' : '📺 DISCONNECTED') : '📱 AUTO-REFRESH'
            }}
          </span>
        </div>

        <!-- ⭐ TAMBAH TOGGLE SOUND BUTTON -->
        <button
          @click="toggleSound"
          class="sound-toggle"
          :title="userPrefersSound ? 'Matikan sound' : 'Nyalakan sound'"
        >
          {{ userPrefersSound ? '🔔' : '🔕' }}
        </button>
      </div>
    </div>

    <!-- Live Notification -->
    <div v-if="showVoteAlert" class="vote-notification">
      <div class="notification-content">
        <div class="notification-icon">🎉</div>
        <div class="notification-text">
          <div class="notification-title">{{ notificationTitle }}</div>
          <div class="notification-details">
            Vote baru untuk <strong>{{ lastCandidate }}</strong>
          </div>
        </div>
        <div class="notification-time">{{ lastVoteTime }}</div>
      </div>
    </div>

    <!-- Audio untuk sound effect -->
    <audio ref="voteSound" src="/sounds/vote-beep.mp3" preload="auto" style="display: none"></audio>

    <!-- Main Dashboard -->
    <div class="main-dashboard">
      <!-- 2-Column Results - NOW AT TOP -->
      <div class="two-column-results">
        <!-- Left Column: Waka Kesiswaan -->
        <div class="position-column kesiswaan-column">
          <div class="column-header">
            <h3 class="column-title">
              <span class="title-icon">👨‍🎓</span>
              WAKA KESISWAAN
              <span class="position-status">{{ getPositionStatus('kesiswaan') }}</span>
            </h3>
            <div class="column-stats">
              <span>{{ getCandidates('kesiswaan').length }} Kandidat</span>
              <span
                >{{ formatPercentage(getPositionParticipation('kesiswaan')) }}% Partisipasi</span
              >
            </div>
          </div>

          <div class="candidates-list">
            <div v-if="isLoading.candidates" class="loading">
              <div class="spinner"></div>
              <p>Memuat kandidat...</p>
            </div>

            <div v-else-if="getCandidates('kesiswaan').length === 0" class="empty">
              <p>Belum ada kandidat</p>
            </div>

            <div
              v-else
              v-for="(candidate, index) in getCandidates('kesiswaan')"
              :key="candidate.id"
              class="candidate-item"
              :class="{
                'rank-1': index === 0,
                'rank-2': index === 1,
                'rank-3': index === 2,
                winner: isWinner(candidate.id, 'kesiswaan'),
              }"
            >
              <div class="candidate-rank">#{{ index + 1 }}</div>

              <div class="candidate-info">
                <div class="candidate-avatar">{{ getInitials(candidate.name) }}</div>
                <div class="candidate-details">
                  <div class="candidate-name">{{ candidate.name }}</div>
                  <div class="candidate-votes">{{ candidate.votes }} suara</div>
                </div>
              </div>

              <div class="candidate-progress">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: Math.min(candidate.percentage, 100) + '%' }"
                    :class="{ supermajority: candidate.percentage > 50 }"
                  ></div>
                </div>
                <div class="progress-percentage">{{ formatPercentage(candidate.percentage) }}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Waka Sarpras -->
        <div class="position-column sarpras-column">
          <div class="column-header">
            <h3 class="column-title">
              <span class="title-icon">🏫</span>
              WAKA SARPRAS
              <span class="position-status">{{ getPositionStatus('sarpras') }}</span>
            </h3>
            <div class="column-stats">
              <span>{{ getCandidates('sarpras').length }} Kandidat</span>
              <span>{{ formatPercentage(getPositionParticipation('sarpras')) }}% Partisipasi</span>
            </div>
          </div>

          <div class="candidates-list">
            <div v-if="isLoading.candidates" class="loading">
              <div class="spinner"></div>
              <p>Memuat kandidat...</p>
            </div>

            <div v-else-if="getCandidates('sarpras').length === 0" class="empty">
              <p>Belum ada kandidat</p>
            </div>

            <div
              v-else
              v-for="(candidate, index) in getCandidates('sarpras')"
              :key="candidate.id"
              class="candidate-item"
              :class="{
                'rank-1': index === 0,
                'rank-2': index === 1,
                'rank-3': index === 2,
                winner: isWinner(candidate.id, 'sarpras'),
              }"
            >
              <div class="candidate-rank">#{{ index + 1 }}</div>

              <div class="candidate-info">
                <div class="candidate-avatar">{{ getInitials(candidate.name) }}</div>
                <div class="candidate-details">
                  <div class="candidate-name">{{ candidate.name }}</div>
                  <div class="candidate-votes">{{ candidate.votes }} suara</div>
                </div>
              </div>

              <div class="candidate-progress">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: Math.min(candidate.percentage, 100) + '%' }"
                    :class="{ supermajority: candidate.percentage > 50 }"
                  ></div>
                </div>
                <div class="progress-percentage">{{ formatPercentage(candidate.percentage) }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Stats - NOW BELOW CANDIDATES -->
      <div class="summary-row">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-value" :class="{ loading: isLoading.totalVoters }">
              {{ isLoading.totalVoters ? '...' : formatCompactNumber(totalVoters) }}
            </div>
            <div class="stat-label">Total Peserta</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🗳️</div>
          <div class="stat-content">
            <div class="stat-value" :class="{ loading: isLoading.candidates }">
              {{ isLoading.candidates ? '...' : formatCompactNumber(totalVotesData) }}
            </div>
            <div class="stat-label">Total Vote</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">👤</div>
          <div class="stat-content">
            <div class="stat-value" :class="{ loading: isLoading.uniqueVoters }">
              {{ isLoading.uniqueVoters ? '...' : formatCompactNumber(uniqueVotersCount) }}
            </div>
            <div class="stat-label">Pemilih<br />Sudah Voting</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ formatPercentage(participationRate) }}%</div>
            <div class="stat-label">Tingkat<br />Partisipasi</div>
            <div v-if="participationRate >= 75" class="participation-indicator high">Tinggi</div>
            <div v-else-if="participationRate >= 50" class="participation-indicator medium">
              Sedang
            </div>
            <div v-else class="participation-indicator low">Rendah</div>
          </div>
        </div>
      </div>

      <!-- Run-off Alert -->
      <div v-if="runoffs.length > 0 && votingRound === 1" class="runoff-section">
        <div class="runoff-header">
          <span class="runoff-icon">🔄</span>
          <h3 class="runoff-title">PERLU RUN-OFF</h3>
        </div>
        <div class="runoff-content">
          <p class="runoff-description">{{ runoffs.length }} posisi belum ada pemenang >50%</p>
          <div class="runoff-positions">
            <span v-for="position in runoffs" :key="position" class="runoff-position">
              {{ getPositionName(position) }}
            </span>
          </div>
          <div v-if="isAdmin" class="runoff-actions">
            <button @click="startRunoff" class="runoff-button">MULAI PUTARAN 2</button>
          </div>
        </div>
      </div>

      <!-- Live Activity -->
      <div class="activity-section">
        <div class="activity-header">
          <h3 class="activity-title">
            <span class="activity-icon">🔄</span>
            AKTIVITAS TERBARU
          </h3>
          <button @click="manualRefresh" class="refresh-btn" title="Refresh">🔄</button>
        </div>

        <div class="activity-feed">
          <div v-if="activityLog.length === 0" class="empty-activity">
            <p>Menunggu aktivitas voting...</p>
          </div>

          <div v-else class="activity-list">
            <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
              <div class="activity-icon">{{ getActivityIcon(activity.type) }}</div>
              <div class="activity-content">
                <p class="activity-message">{{ activity.message }}</p>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </div>
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
const votingRound = ref(1)
const isAdmin = ref(false)
const isLargeScreen = ref(false)
const isRefreshing = ref(false)

// Data - SINGLE SOURCE OF TRUTH
const candidatesData = ref([])
const totalVotesData = ref(0)
const uniqueVotersCount = ref(0)
const sessionData = ref(null)
const totalVotersData = ref(0)
const activityLog = ref([])

// Loading states
const isLoading = ref({
  totalVoters: true,
  candidates: true,
  session: true,
  uniqueVoters: true,
})

// Time
const currentTime = ref('')
const currentTimeWithSeconds = ref('')
const currentDateDay = ref('')
const currentDateFormatted = ref('')
const lastUpdateTime = ref('')

// Live Alert
const showVoteAlert = ref(false)
const lastCandidate = ref('')
const lastVoteTime = ref('')
const notificationTitle = ref('VOTE BARU!')

// Audio
const voteSound = ref(null)
const userPrefersSound = ref(localStorage.getItem('sound-enabled') !== 'false')

// Real-time flags untuk mencegah duplicate updates
const isProcessingVote = ref(false)
const lastProcessedCandidateId = ref(null)

// ===== CLEANUP VARIABLES =====
let timeInterval = null
let autoRefreshInterval = null
let realtimeChannel = null
const cleanupListeners = []

// ===== CLEANUP FUNCTIONS =====
const addCleanupListener = (element, event, handler) => {
  element.addEventListener(event, handler)
  cleanupListeners.push({ element, event, handler })
}

const cleanupAll = () => {
  // Clear intervals
  if (timeInterval) {
    clearInterval(timeInterval)
    timeInterval = null
  }

  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
  }

  // Remove event listeners
  cleanupListeners.forEach(({ element, event, handler }) => {
    element.removeEventListener(event, handler)
  })
  cleanupListeners.length = 0

  // Unsubscribe Supabase
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }

  // Exit fullscreen
  if (document.fullscreenElement) {
    document.exitFullscreen()
  }
}

// ===== FULLSCREEN HANDLER (named function) =====
const handleFullscreen = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// ===== COMPUTED =====
const totalVoters = computed(() => totalVotersData.value)

// Partisipasi berdasarkan peserta UNIK yang sudah voting
const participationRate = computed(() => {
  if (totalVoters.value === 0 || isLoading.value.totalVoters || isLoading.value.uniqueVoters)
    return 0
  return (uniqueVotersCount.value / totalVoters.value) * 100
})

const sessionStatus = computed(() => {
  if (!sessionData.value) return 'LOADING...'
  return sessionData.value.status.toUpperCase()
})

const recentActivities = computed(() => {
  return activityLog.value.slice(0, 8)
})

const winners = computed(() => {
  const result = []
  const positions = ['kesiswaan', 'sarpras']

  positions.forEach((position) => {
    const candidates = getCandidates(position)
    if (candidates.length === 0) return

    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0)
    if (totalVotes === 0) return

    candidates.forEach((candidate) => {
      const percentage = (candidate.votes / totalVotes) * 100
      if (percentage > 50) {
        result.push({
          jabatan: position,
          name: candidate.name,
          votes: candidate.votes,
          percentage: percentage,
        })
      }
    })
  })

  return result
})

const runoffs = computed(() => {
  const result = []
  const positions = ['kesiswaan', 'sarpras']

  positions.forEach((position) => {
    const hasWinner = winners.value.some((w) => w.jabatan === position)
    if (!hasWinner) {
      const candidates = getCandidates(position)
      if (candidates.length >= 2) {
        result.push(position)
      }
    }
  })

  return result
})

// ===== METHODS =====
const formatPercentage = (value) => {
  if (isNaN(value) || value === null || value === undefined) return '0.00'
  return parseFloat(value).toFixed(2).replace('.', ',')
}

const formatCompactNumber = (value) => {
  if (!value && value !== 0) return '0'
  if (value < 1000) return value.toString()
  if (value < 10000) return (value / 1000).toFixed(1) + 'K'
  if (value < 1000000) return Math.floor(value / 1000) + 'K'
  return Math.floor(value / 1000000) + 'M'
}

const detectDeviceType = () => {
  const width = window.innerWidth
  const height = window.innerHeight
  const isWideScreen = width > 1024 && width / height > 1.5
  const urlParams = new URLSearchParams(window.location.search)
  const forceTV = urlParams.has('tv') || localStorage.getItem('tv_mode') === 'true'
  return forceTV || isWideScreen
}

// Sound functions
// ===== UPDATE playVoteSound() function =====
const playVoteSound = () => {
  if (!userPrefersSound.value || !isLargeScreen.value) return

  try {
    // Check if AudioContext is supported
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) {
      console.log('Web Audio API not supported')
      return
    }

    // Create audio context
    const audioContext = new AudioContext()

    // Create oscillator (sound source)
    const oscillator = audioContext.createOscillator()

    // Create gain node (volume control)
    const gainNode = audioContext.createGain()

    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Configure sound
    oscillator.frequency.value = 800 // Frequency in Hz (A5 note)
    oscillator.type = 'sine' // Sine wave (smooth sound)

    // Volume envelope: quick attack, quick decay
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05) // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3) // Decay

    // Start and stop
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.3) // Duration: 300ms

    console.log('🔊 Beep sound played')
  } catch (err) {
    console.log('Web Audio error:', err)
    // Fallback: try HTML5 audio if Web Audio fails
    playFallbackSound()
  }
}

// Fallback menggunakan HTML5 Audio
const playFallbackSound = () => {
  try {
    // Create beep sound with base64 (no external file)
    const audio = new Audio()
    // Very short beep sound as base64
    audio.src =
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA=='
    audio.volume = 0.3
    audio.play().catch((e) => console.log('Fallback audio failed:', e))
  } catch {
    // ⭐ HAPUS 'err' PARAMETER
    console.log('All audio methods failed')
  }
}

const toggleSound = () => {
  userPrefersSound.value = !userPrefersSound.value
  localStorage.setItem('sound-enabled', userPrefersSound.value)
  addActivity(userPrefersSound.value ? '🔔 Sound diaktifkan' : '🔕 Sound dimatikan', 'info')
}

const loadTotalVoters = async () => {
  try {
    isLoading.value.totalVoters = true
    const { count, error } = await supabase
      .from('pengguna')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) {
      console.error('Error load total peserta:', error)
      totalVotersData.value = 0
      addActivity('❌ Gagal memuat total peserta', 'error')
    } else {
      totalVotersData.value = count || 0
    }
  } catch (err) {
    console.error('Load total peserta error:', err)
    totalVotersData.value = 0
  } finally {
    isLoading.value.totalVoters = false
  }
}

// Load semua data sekaligus dengan SINGLE SOURCE
const loadAllData = async () => {
  try {
    if (!sessionData.value?.id) return

    isLoading.value.candidates = true

    // 1. Load kandidat untuk sesi ini
    const { data: candidates, error } = await supabase
      .from('kandidat')
      .select('*, pengguna:pengguna_id(nama_lengkap)')
      .eq('sesi_id', sessionData.value.id)
      .in('jabatan', ['kesiswaan', 'sarpras'])
      .order('total_suara', { ascending: false })

    if (error) {
      console.error('Load candidates error:', error)
      return
    }

    candidatesData.value = (candidates || []).map((candidate) => ({
      id: candidate.id,
      name: candidate.pengguna?.nama_lengkap || 'Unknown',
      jabatan: candidate.jabatan,
      votes: candidate.total_suara || 0,
      hasUpdate: false,
    }))

    console.log(`📊 ${candidatesData.value.length} kandidat dimuat`)

    // 2. Hitung TOTAL VOTE dari kandidat (SINGLE SOURCE)
    totalVotesData.value = candidatesData.value.reduce((sum, c) => sum + c.votes, 0)
  } catch (err) {
    console.error('❌ Load candidates error:', err)
  } finally {
    isLoading.value.candidates = false
  }
}

// Hitung peserta UNIK yang sudah voting
const loadUniqueVoters = async () => {
  try {
    if (!sessionData.value?.id) return
    isLoading.value.uniqueVoters = true

    const { data: votes, error } = await supabase
      .from('suara')
      .select('pemilih_id')
      .eq('sesi_id', sessionData.value.id)
      .eq('is_draft', false)

    if (error) {
      console.error('Load unique voters error:', error)
      uniqueVotersCount.value = 0
      return
    }

    // Hitung peserta unik
    const uniqueVoters = new Set(votes.map((v) => v.pemilih_id))
    uniqueVotersCount.value = uniqueVoters.size
  } catch (err) {
    console.error('❌ Load unique voters error:', err)
    uniqueVotersCount.value = 0
  } finally {
    isLoading.value.uniqueVoters = false
  }
}

const getCandidates = (positionId) => {
  let candidates = candidatesData.value.filter((c) => c.jabatan === positionId)
  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0)
  candidates = candidates.map((c) => ({
    ...c,
    percentage: totalVotes > 0 ? (c.votes / totalVotes) * 100 : 0,
  }))
  return candidates.sort((a, b) => b.votes - a.votes)
}

const getPositionName = (positionId) => {
  const positionNames = {
    kesiswaan: 'WAKA KESISWAAN',
    sarpras: 'WAKA SARPRAS',
  }
  return positionNames[positionId] || positionId
}

const getPositionStatus = (positionId) => {
  if (winners.value.some((w) => w.jabatan === positionId)) return '✅'
  if (runoffs.value.includes(positionId)) return '🔄'
  return '📊'
}

const getPositionParticipation = (positionId) => {
  const positionVotes = getCandidates(positionId).reduce((sum, c) => sum + c.votes, 0)
  return totalVoters.value > 0 ? (positionVotes / totalVoters.value) * 100 : 0
}

const isWinner = (candidateId, positionId) => {
  const winner = winners.value.find((w) => w.jabatan === positionId)
  if (!winner) return false
  const candidate = getCandidates(positionId).find((c) => c.id === candidateId)
  return candidate?.name === winner.name
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
    connection: '🔌',
  }
  return icons[type] || '📝'
}

const addActivity = (message, type = 'info') => {
  activityLog.value.unshift({
    id: Date.now(),
    message,
    type,
    time: new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: Date.now(),
  })

  if (activityLog.value.length > 20) {
    activityLog.value = activityLog.value.slice(0, 20)
  }
}

const manualRefresh = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    addActivity('🔄 Manual refresh data...', 'info')
    await Promise.all([loadTotalVoters(), loadAllData(), loadUniqueVoters()])
    // Update waktu dengan detik untuk semua device
    lastUpdateTime.value = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta',
    })
    addActivity('✅ Data berhasil diperbarui', 'info')
  } catch (err) {
    console.error('❌ Manual refresh error:', err)
    addActivity('❌ Gagal memuat ulang data', 'error')
  } finally {
    isRefreshing.value = false
  }
}

const setupRealtime = async () => {
  try {
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
    isLoading.value.session = false

    // Load semua data sekaligus
    await Promise.all([loadTotalVoters(), loadAllData(), loadUniqueVoters()])

    const channelName = `tv-live-voting-${session.id}`

    // ⭐ SIMPAN CHANNEL KE VARIABLE GLOBAL
    realtimeChannel = supabase.channel(channelName)

    // HANYA gunakan UPDATE pada kandidat (SINGLE SOURCE)
    realtimeChannel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'kandidat',
        filter: `sesi_id=eq.${session.id}`,
      },
      async (payload) => {
        // Cegah duplicate processing
        if (isProcessingVote.value || lastProcessedCandidateId.value === payload.new.id) {
          console.log('🔄 Skip duplicate candidate update')
          return
        }

        isProcessingVote.value = true
        lastProcessedCandidateId.value = payload.new.id

        try {
          await handleCandidateUpdate(payload.new)
        } finally {
          setTimeout(() => {
            isProcessingVote.value = false
          }, 1000)
        }
      },
    )

    realtimeChannel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sesi_pemilihan',
        filter: `id=eq.${session.id}`,
      },
      (payload) => {
        handleSessionUpdate(payload.new)
      },
    )

    realtimeChannel.subscribe((status) => {
      console.log('📺 TV Realtime status:', status)
      isConnected.value = status === 'SUBSCRIBED'
      if (status === 'SUBSCRIBED') {
        addActivity('📺 Terhubung ke sistem realtime TV', 'connection')
      } else if (status === 'CHANNEL_ERROR') {
        addActivity('❌ Koneksi TV terganggu', 'error')
        isConnected.value = false
        startPolling(5000)
      }
    })
  } catch (err) {
    console.error('❌ Setup realtime TV error:', err)
    addActivity('❌ Gagal menyambung TV realtime', 'error')
    startPolling(10000)
  }
}

const handleCandidateUpdate = async (candidate) => {
  try {
    console.log('🔄 Update kandidat:', candidate.id)

    // ⭐ PLAY SOUND HANYA DI TV MODE
    if (isLargeScreen.value) {
      playVoteSound()
    }

    // ⭐ REFRESH SEMUA DATA
    await loadAllData()
    await loadUniqueVoters()

    // Show notification
    showVoteAlert.value = true
    lastCandidate.value = candidate.name
    lastVoteTime.value = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })

    // Auto hide notification after 5 seconds
    setTimeout(() => {
      showVoteAlert.value = false
    }, 5000)

    console.log('✅ Data refreshed')
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

const handleSessionUpdate = (session) => {
  try {
    console.log('🔄 Session updated:', session.status)
    sessionData.value = { ...sessionData.value, ...session }
    if (session.status === 'voting') {
      addActivity('🚀 Voting dimulai!', 'info')
    } else if (session.status === 'selesai') {
      addActivity('🏁 Voting selesai!', 'info')
    }
  } catch (err) {
    console.error('❌ Handle session update error:', err)
  }
}

const startRunoff = () => {
  if (votingRound.value === 1 && runoffs.value.length > 0) {
    votingRound.value = 2
    addActivity(`🔄 PUTARAN 2 DIMULAI`, 'round')
  }
}

const updateCurrentTime = () => {
  const now = new Date()

  // Format dengan detik: "21:25:45"
  currentTimeWithSeconds.value = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
  })

  // Format tanpa detik untuk keperluan lain
  currentTime.value = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  })

  // Hari: "Senin"
  currentDateDay.value = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    timeZone: 'Asia/Jakarta',
  })

  // Tanggal: "8 Des 2025"
  currentDateFormatted.value = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })

  const minutes = now.getMinutes()
  if (minutes !== lastMinutes.value) {
    lastUpdateTime.value = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    })
    lastMinutes.value = minutes
  }
}

let lastMinutes = ref(null)

const startPolling = (interval = 30000) => {
  // Clear interval lama
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
  }

  const refreshData = async () => {
    try {
      await Promise.all([loadTotalVoters(), loadAllData(), loadUniqueVoters()])
      // Update waktu polling juga dengan detik
      lastUpdateTime.value = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta',
      })
    } catch (err) {
      console.error('❌ Polling error:', err)
    }
  }

  refreshData()
  autoRefreshInterval = setInterval(refreshData, interval)
}

// ===== LIFECYCLE =====
onMounted(async () => {
  isLargeScreen.value = detectDeviceType()
  updateCurrentTime()

  // ⭐ SIMPAN INTERVAL REFERENCE
  timeInterval = setInterval(updateCurrentTime, 1000)

  // ⭐ GUNAKAN CLEANUP LISTENER (bukan langsung addEventListener)
  addCleanupListener(document, 'fullscreenchange', handleFullscreen)

  // TV Mode: Realtime updates
  // Mobile/PC Mode: Polling every 30s
  if (isLargeScreen.value) {
    console.log('📺 TV/Smartboard mode detected - using realtime')
    await setupRealtime()
  } else {
    console.log('📱 Mobile/PC mode detected - using polling')
    startPolling(30000)
    addActivity('📱 Mode Auto-Refresh aktif (30 detik)', 'info')
  }
})

onUnmounted(() => {
  // ⭐ PANGGIL CLEANUP SEMUA
  cleanupAll()
  console.log('🧹 LiveResults cleanup complete')
})
</script>

<style scoped>
/* ===== GLOBAL STYLES ===== */
.live-results {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* ===== STATUS HEADER ===== */
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-bg-soft);
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;
}

.header-left,
.header-center,
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-label {
  color: var(--color-text-soft);
}

.update-time {
  font-weight: 600;
  color: var(--color-text);
}

.refresh-btn {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-bg-mute);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 12px;
  background: var(--color-primary);
  color: white;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(239, 68, 68, 0.1);
}

.connection-status.connected {
  background: rgba(34, 197, 94, 0.1);
}

.connection-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.connection-status.connected .connection-dot {
  background: #22c55e;
}

.connection-text {
  font-size: 12px;
  font-weight: 500;
}

/* ===== VOTE NOTIFICATION ===== */
.vote-notification {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  z-index: 1000;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-icon {
  font-size: 20px;
}

.notification-text {
  flex: 1;
}

.notification-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 2px;
}

.notification-details {
  font-size: 12px;
  opacity: 0.9;
}

.notification-time {
  font-size: 11px;
  opacity: 0.8;
}

/* ===== MAIN DASHBOARD ===== */
.main-dashboard {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

/* ===== TWO COLUMN RESULTS - NOW AT TOP ===== */
.two-column-results {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.position-column {
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
}

.kesiswaan-column {
  border-top: 4px solid #3b82f6;
}

.sarpras-column {
  border-top: 4px solid #8b5cf6;
}

.column-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.column-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 20px;
}

.position-status {
  margin-left: auto;
  font-size: 16px;
}

.column-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--color-text-soft);
}

.column-stats span {
  background: var(--color-bg-mute);
  padding: 4px 8px;
  border-radius: 4px;
}

/* ===== CANDIDATES LIST ===== */
.candidates-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading,
.empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-soft);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.candidate-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-bg-mute);
  border-radius: 6px;
  border-left: 4px solid transparent;
}

.candidate-item.rank-1 {
  border-left-color: #fbbf24;
  background: rgba(251, 191, 36, 0.05);
}

.candidate-item.rank-2 {
  border-left-color: #94a3b8;
}

.candidate-item.rank-3 {
  border-left-color: #92400e;
}

.candidate-item.winner {
  border-left-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.candidate-rank {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-text-soft);
  min-width: 36px;
}

.candidate-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.candidate-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 12px;
  flex-shrink: 0;
}

.sarpras-column .candidate-avatar {
  background: linear-gradient(135deg, #8b5cf6, #d946ef);
}

.candidate-details {
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

.candidate-progress {
  width: 120px;
  flex-shrink: 0;
}

.progress-bar {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.sarpras-column .progress-fill {
  background: linear-gradient(90deg, #8b5cf6, #d946ef);
}

.progress-fill.supermajority {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.progress-percentage {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-soft);
  font-weight: 600;
}

/* ===== SUMMARY ROW - NOW BELOW CANDIDATES ===== */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 70px; /* FIXED HEIGHT - cukup untuk 2 baris */
  overflow: hidden; /* Pastikan tidak ada overflow */
}

.stat-icon {
  font-size: 22px; /* Sedikit lebih kecil */
  flex-shrink: 0;
  width: 40px; /* Fixed width untuk icon */
  text-align: center;
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0; /* Penting untuk mencegah overflow */
  overflow: hidden; /* Pastikan tidak overflow */
}

.stat-value {
  font-size: 20px; /* Besar tapi proporsional */
  font-weight: bold;
  color: var(--color-text);
  margin-bottom: 0; /* Tidak ada margin bawah */
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value.loading {
  color: var(--color-text-mute);
}

.stat-label {
  font-size: 11px; /* Sangat kecil */
  color: var(--color-text-soft);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

/* Date card specific - WITH SECONDS */
.date-value {
  font-size: 16px; /* Sedikit lebih kecil untuk muat detik */
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.5px;
  font-family: 'Courier New', monospace; /* Font monospace untuk jam digital */
}

.date-label {
  font-size: 10px;
  color: var(--color-text-soft);
  text-transform: uppercase;
  font-weight: 600;
}

.date-detail {
  font-size: 9px;
  color: var(--color-text-mute);
  line-height: 1.2;
  margin-top: 1px;
}

/* Participation indicators */
.participation-indicator {
  font-size: 8px; /* Sangat kecil */
  margin-top: 2px;
  padding: 1px 4px;
  border-radius: 2px;
  display: inline-block;
  font-weight: 600;
  white-space: nowrap;
  width: fit-content;
}

.participation-indicator.high {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.participation-indicator.medium {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

.participation-indicator.low {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* ===== RUN-OFF SECTION ===== */
.runoff-section {
  background: rgba(245, 158, 11, 0.1);
  border: 2px solid rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.runoff-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.runoff-icon {
  font-size: 24px;
}

.runoff-title {
  margin: 0;
  color: #f59e0b;
  font-size: 18px;
}

.runoff-description {
  margin: 0 0 12px 0;
  color: var(--color-text);
}

.runoff-positions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.runoff-position {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.runoff-actions {
  text-align: center;
}

.runoff-button {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
}

.runoff-button:hover {
  opacity: 0.9;
}

/* ===== ACTIVITY SECTION ===== */
.activity-section {
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.activity-title {
  margin: 0;
  font-size: 16px;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-icon {
  font-size: 18px;
}

.activity-feed {
  height: 200px;
  overflow-y: auto;
}

.empty-activity {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-soft);
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
  background: var(--color-bg-mute);
  border-radius: 6px;
  border-left: 3px solid var(--color-primary);
}

.activity-item:nth-child(odd) {
  background: var(--color-bg-soft);
}

.activity-icon {
  font-size: 16px;
  margin-top: 2px;
}

.activity-content {
  flex: 1;
}

.activity-message {
  font-size: 13px;
  color: var(--color-text);
  margin-bottom: 4px;
  line-height: 1.4;
}

.activity-time {
  font-size: 11px;
  color: var(--color-text-soft);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .two-column-results {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .summary-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card {
    height: 65px;
    padding: 10px 8px;
  }

  .stat-value {
    font-size: 18px;
  }

  .date-value {
    font-size: 15px; /* Sedikit lebih kecil di tablet */
  }

  .stat-icon {
    font-size: 20px;
    width: 36px;
  }
}

@media (max-width: 768px) {
  .status-header {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .header-left,
  .header-center,
  .header-right {
    justify-content: center;
  }

  .summary-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-card {
    height: 60px;
    padding: 8px 6px;
    gap: 8px;
  }

  .stat-value {
    font-size: 16px;
  }

  .date-value {
    font-size: 14px; /* Lebih kecil di mobile */
  }

  .stat-label {
    font-size: 10px;
  }

  .date-label {
    font-size: 9px;
  }

  .date-detail {
    font-size: 8px;
  }

  .candidate-item {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .candidate-progress {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .main-dashboard {
    padding: 12px;
  }

  .summary-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .stat-card {
    height: 55px;
    padding: 6px 4px;
  }

  .stat-icon {
    font-size: 18px;
    width: 32px;
  }

  .stat-value {
    font-size: 14px;
  }

  .date-value {
    font-size: 12px; /* Paling kecil di mobile kecil */
    letter-spacing: 0.3px;
  }

  .stat-label {
    font-size: 9px;
  }

  .date-label {
    font-size: 8px;
  }

  .date-detail {
    font-size: 7px;
  }

  .participation-indicator {
    font-size: 7px;
    padding: 1px 3px;
  }

  .position-column {
    padding: 16px;
  }

  .candidate-info {
    gap: 8px;
  }

  .candidate-avatar {
    width: 32px;
    height: 32px;
    font-size: 11px;
  }
}

/* ===== FULLSCREEN MODE ===== */
.live-results.fullscreen-mode .main-dashboard {
  padding: 24px;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

.live-results.fullscreen-mode .two-column-results {
  margin-bottom: 24px;
}

.live-results.fullscreen-mode .summary-row {
  gap: 16px;
  margin-bottom: 24px;
}

.live-results.fullscreen-mode .stat-card {
  height: 75px;
  padding: 14px 12px;
}

.live-results.fullscreen-mode .stat-value {
  font-size: 22px;
}

.live-results.fullscreen-mode .date-value {
  font-size: 20px; /* Lebih besar di fullscreen */
}

.live-results.fullscreen-mode .stat-label {
  font-size: 12px;
}

@media (min-width: 1921px) {
  .live-results {
    font-size: 1.1em;
  }

  .main-dashboard {
    max-width: 90%;
  }

  .stat-card {
    height: 80px;
  }

  .stat-value {
    font-size: 24px;
  }

  .date-value {
    font-size: 22px; /* Lebih besar di layar sangat lebar */
  }

  .stat-label {
    font-size: 13px;
  }

  .column-title {
    font-size: 20px;
  }

  .candidate-name {
    font-size: 16px;
  }

  .progress-bar {
    height: 8px;
  }
}

/* Hover effects for cards */
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

/* Loading animation for stats */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.stat-value.loading {
  animation: pulse 1.5s infinite;
}

/* Digital clock effect */
@keyframes second-tick {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.date-value {
  animation: second-tick 1s infinite;
}
</style>
