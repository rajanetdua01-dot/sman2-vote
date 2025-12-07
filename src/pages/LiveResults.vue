<template>
  <div class="live-results" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- Minimal Header -->
    <div class="minimal-header">
      <button class="back-button" @click="goToHome" title="Kembali ke Home">← HOME</button>

      <div class="header-center">
        <div class="session-name">
          <div class="main-title">SISTEM HITUNG CEPAT</div>
          <div class="sub-title">Pemilihan Wakil Kepala Sekolah SMA Negeri 2 Bandar Lampung</div>
        </div>
        <div class="round-info">PUTARAN {{ votingRound }}</div>
        <div class="status-indicator" :class="{ connected: isConnected }"></div>
      </div>

      <div class="header-controls">
        <button
          class="control-btn"
          @click="toggleSound"
          :title="soundEnabled ? 'Mute suara' : 'Unmute suara'"
        >
          {{ soundEnabled ? '🔊' : '🔇' }}
        </button>
        <button
          class="control-btn"
          @click="toggleFullscreen"
          :title="isFullscreen ? 'Keluar fullscreen' : 'Fullscreen'"
        >
          {{ isFullscreen ? '📱' : '🖥️' }}
        </button>
      </div>
    </div>

    <!-- Live Notification -->
    <transition name="slide-down">
      <div v-if="showVoteAlert" class="vote-notification" :class="notificationType">
        <div class="notification-content">
          <div class="notification-icon">🎉</div>
          <div class="notification-text">
            <div class="notification-title">{{ notificationTitle }}</div>
            <div class="notification-details">
              Vote baru diterima untuk <span class="candidate">{{ lastCandidate }}</span>
            </div>
          </div>
          <div class="notification-time">{{ lastVoteTime }}</div>
        </div>
      </div>
    </transition>

    <!-- Main Dashboard -->
    <div class="main-dashboard">
      <!-- Summary Stats Row -->
      <div class="summary-row">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-value" :class="{ loading: isLoading.totalVoters }">
              {{ isLoading.totalVoters ? '...' : totalVoters }}
            </div>
            <div class="stat-label">Total Peserta</div>
            <div v-if="isLoading.totalVoters" class="stat-loading">Memuat...</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🗳️</div>
          <div class="stat-content">
            <div class="stat-value" :class="{ loading: isLoading.votes }">
              {{ isLoading.votes ? '...' : votedCount }}
            </div>
            <div class="stat-label">Sudah Voting</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value" :class="{ loading: isLoading.totalVoters || isLoading.votes }">
              {{
                isLoading.totalVoters || isLoading.votes
                  ? '...'
                  : formatPercentage(participationRate)
              }}%
            </div>
            <div class="stat-label">Partisipasi</div>
            <div v-if="participationRate >= 75" class="participation-high">🎯 Tinggi</div>
            <div v-else-if="participationRate >= 50" class="participation-medium">📈 Sedang</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏰</div>
          <div class="stat-content">
            <div class="stat-value">{{ currentTime }}</div>
            <div class="stat-label">Waktu WIB</div>
            <div v-if="timeRemaining" class="time-remaining">{{ timeRemaining }}</div>
          </div>
        </div>
      </div>

      <!-- Winners Section (if any) -->
      <div v-if="winners.length > 0" class="winners-section">
        <h3 class="section-title">
          <span class="title-icon">🏆</span>
          PEMENANG PUTARAN {{ votingRound }}
        </h3>
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
              <span class="stat-votes">{{ winner.votes }} suara</span>
              <span class="stat-percentage">{{ formatPercentage(winner.percentage) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Run-off Alert -->
      <div v-if="runoffs.length > 0 && votingRound === 1" class="runoff-section">
        <div class="runoff-alert">
          <div class="runoff-icon">🔄</div>
          <div class="runoff-content">
            <h4 class="runoff-title">PERLU RUN-OFF</h4>
            <p class="runoff-description">{{ runoffs.length }} posisi belum ada pemenang >50%</p>
            <div class="runoff-details">
              <div v-for="position in runoffs" :key="position" class="runoff-position">
                {{ getPositionName(position) }}
              </div>
            </div>
          </div>
          <button v-if="isAdmin" @click="startRunoff" class="runoff-button">MULAI PUTARAN 2</button>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Position Tabs -->
        <div class="position-tabs-container">
          <div class="position-tabs">
            <button
              v-for="position in positions"
              :key="position.id"
              class="position-tab"
              :class="{
                active: activePosition === position.id,
                'has-winner': winners.some((w) => w.jabatan === position.id),
              }"
              @click="activePosition = position.id"
            >
              <span class="tab-icon">{{ position.icon }}</span>
              <span class="tab-name">{{ position.name }}</span>
              <span class="tab-count">{{ getPositionVotes(position.id) }}</span>
            </button>
          </div>
        </div>

        <!-- Candidates Ranking -->
        <div class="candidates-container">
          <div class="candidates-header">
            <h3 class="candidates-title">
              {{ getPositionName(activePosition) }}
              <span class="status-badge">{{ getPositionStatus(activePosition) }}</span>
            </h3>
            <div class="candidates-stats">
              <span class="stat">{{ getCandidates(activePosition).length }} Kandidat</span>
              <span class="stat"
                >{{ formatPercentage(getPositionParticipation(activePosition)) }}% Partisipasi</span
              >
            </div>
          </div>

          <div class="candidates-ranking">
            <div v-if="isLoading.candidates" class="loading-candidates">
              <div class="loading-spinner"></div>
              <p>Memuat data kandidat...</p>
            </div>

            <div
              v-for="(candidate, index) in getCandidates(activePosition)"
              v-else
              :key="candidate.id"
              class="candidate-item"
              :class="{
                'rank-1': index === 0,
                'rank-2': index === 1,
                'rank-3': index === 2,
                'vote-update': candidate.hasUpdate,
                'is-winner': isWinner(candidate.id, activePosition),
              }"
            >
              <div class="candidate-rank">
                <span class="rank-number">#{{ index + 1 }}</span>
                <div v-if="index === 0 && candidate.percentage > 50" class="winner-badge">🏆</div>
              </div>

              <div class="candidate-info">
                <div class="candidate-avatar">{{ getInitials(candidate.name) }}</div>
                <div class="candidate-details">
                  <div class="candidate-name">{{ candidate.name }}</div>
                  <div class="candidate-meta">
                    <span class="meta-votes">{{ candidate.votes }} suara</span>
                    <span class="meta-separator">•</span>
                    <span class="meta-percentage"
                      >{{ formatPercentage(candidate.percentage) }}%</span
                    >
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
                  {{ formatPercentage(candidate.percentage) }}%
                  <span v-if="candidate.percentage > 50" class="supermajority-indicator"
                    >(>50%)</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Activity -->
        <div class="activity-container">
          <div class="activity-header">
            <h3 class="activity-title">
              <span class="activity-icon">🔄</span>
              AKTIVITAS TERBARU
            </h3>
            <button @click="refreshAllData" class="refresh-btn" title="Refresh data">🔄</button>
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="footer-info">
        <div class="update-info">
          <span class="update-label">Update Terakhir:</span>
          <span class="update-time">{{ lastUpdateTime }}</span>
          <button @click="refreshAllData" class="refresh-mini-btn" title="Refresh">↻</button>
        </div>
        <div class="session-info" v-if="sessionData">
          <span class="session-status">{{ sessionData.status }}</span>
          <span class="session-period">{{ formatSessionPeriod(sessionData) }}</span>
        </div>
        <div class="connection-info" :class="{ connected: isConnected }">
          <div class="connection-dot"></div>
          <span class="connection-text">
            {{ isConnected ? 'LIVE' : 'CONNECTING...' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()

// ===== STATE =====
const isConnected = ref(false)
const isFullscreen = ref(false)
const soundEnabled = ref(true)
const votingRound = ref(1)
const isAdmin = ref(true)
const activePosition = ref('kesiswaan')

// Data
const candidatesData = ref([])
const votesData = ref(0)
const sessionData = ref(null)
const totalVotersData = ref(0) // Data total peserta (semua pengguna aktif)
const activityLog = ref([])
const realtimeChannel = ref(null)

// Loading states
const isLoading = ref({
  totalVoters: true,
  votes: true,
  candidates: true,
  session: true,
})

// Time
const currentTime = ref('')
const timeRemaining = ref('')
const lastUpdateTime = ref('')

// Live Alert
const showVoteAlert = ref(false)
const lastCandidate = ref('')
const lastVoteTime = ref('')
const notificationType = ref('vote')
const notificationTitle = ref('VOTE BARU!')

// ===== POSITIONS =====
const positions = [
  { id: 'kesiswaan', name: 'WAKA KESISWAAN', icon: '👨‍🎓' },
  { id: 'sarpras', name: 'WAKA SARPRAS', icon: '🏫' },
]

// ===== HELPER FUNCTIONS =====
// Format angka dengan 2 desimal untuk persentase
const formatPercentage = (value) => {
  if (isNaN(value) || value === null || value === undefined) return '0.00'
  return parseFloat(value).toFixed(2).replace('.', ',')
}

// Format periode sesi
const formatSessionPeriod = (session) => {
  if (!session) return ''
  const start = new Date(session.waktu_mulai_voting).toLocaleDateString('id-ID')
  const end = new Date(session.waktu_selesai_voting).toLocaleDateString('id-ID')
  return `${start} - ${end}`
}

// ===== QUERY FUNCTIONS =====
// FUNGSI UNTUK MENGHITUNG TOTAL PESERTA (semua pengguna aktif)
const loadTotalVoters = async () => {
  try {
    isLoading.value.totalVoters = true

    const { count, error } = await supabase
      .from('pengguna')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true) // Hanya pengguna aktif

    if (error) {
      console.error('❌ Error load total peserta:', error)
      totalVotersData.value = 0
      addActivity('❌ Gagal memuat total peserta', 'error')
    } else {
      totalVotersData.value = count || 0
      addActivity(`✅ Total peserta: ${count}`, 'info')
    }
  } catch (err) {
    console.error('❌ Load total peserta error:', err)
    totalVotersData.value = 0
  } finally {
    isLoading.value.totalVoters = false
  }
}

// ===== COMPUTED =====
// Total peserta berdasarkan query database
const totalVoters = computed(() => totalVotersData.value)

const votedCount = computed(() => votesData.value)

// Partisipasi dengan 2 desimal
const participationRate = computed(() => {
  if (totalVoters.value === 0 || isLoading.value.totalVoters || isLoading.value.votes) return 0
  return (votedCount.value / totalVoters.value) * 100
})

const recentActivities = computed(() => {
  return activityLog.value.slice(0, 3)
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
          percentage: percentage,
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
    console.log('Audio context not supported')
  }
}

// ===== METHODS =====
const goToHome = () => {
  router.push('/')
}

const getPositionVotes = (positionId) => {
  return getCandidates(positionId).reduce((sum, c) => sum + c.votes, 0)
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
  const position = positions.find((p) => p.id === positionId)
  return position?.name || positionId
}

const getPositionStatus = (positionId) => {
  if (winners.value.some((w) => w.jabatan === positionId)) return '✅'
  if (runoffs.value.includes(positionId)) return '🔄'
  return '📊'
}

const getPositionParticipation = (positionId) => {
  const positionVotes = getPositionVotes(positionId)
  return totalVoters.value > 0 ? (positionVotes / totalVoters.value) * 100 : 0
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
    connection: '🔌',
  }
  return icons[type] || '📝'
}

// ===== ACTIVITY LOG =====
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

// ===== NOTIFICATION SYSTEM =====
const showNotification = (type, candidate) => {
  showVoteAlert.value = true
  lastCandidate.value = candidate
  lastVoteTime.value = currentTime.value
  notificationType.value = type

  if (type === 'vote') {
    notificationTitle.value = 'VOTE BARU!'
    playVoteSound()
  } else if (type === 'winner') {
    notificationTitle.value = '🏆 PEMENANG!'
  }

  setTimeout(() => {
    showVoteAlert.value = false
  }, 3000)
}

// ===== ENHANCED REALTIME FUNCTIONS =====
const setupRealtime = async () => {
  try {
    // Load session data first
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

    // Initial data load - SEMUA DATA termasuk total peserta
    await Promise.all([
      loadTotalVoters(), // Load total peserta (semua pengguna aktif)
      loadCandidates(),
      loadVotesCount(),
    ])

    // Setup real-time subscription
    const channelName = `live-voting-${session.id}-${Date.now()}`
    realtimeChannel.value = supabase.channel(channelName)

    // Subscribe ke INSERT suara
    realtimeChannel.value.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'suara',
        filter: `sesi_id=eq.${session.id}`,
      },
      async (payload) => {
        await handleNewVote(payload.new)
      },
    )

    // Subscribe ke UPDATE kandidat
    realtimeChannel.value.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'kandidat',
        filter: `sesi_id=eq.${session.id}`,
      },
      (payload) => {
        handleCandidateUpdate(payload.new)
      },
    )

    // Subscribe ke UPDATE sesi
    realtimeChannel.value.on(
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

    // Subscribe ke UPDATE pengguna (jika ada perubahan status aktif)
    realtimeChannel.value.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'pengguna',
      },
      async (payload) => {
        // Jika ada perubahan status aktif, refresh total peserta
        if (payload.new.is_active !== payload.old?.is_active) {
          console.log('🔄 Status pengguna berubah, refresh total peserta')
          await loadTotalVoters()
        }
      },
    )

    // Subscribe ke INSERT pengguna (penambahan peserta baru)
    realtimeChannel.value.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'pengguna',
      },
      async () => {
        console.log('🔄 Peserta baru ditambahkan, refresh total peserta')
        await loadTotalVoters()
      },
    )

    // Status subscription
    realtimeChannel.value.subscribe((status) => {
      console.log('🔔 Realtime status:', status)
      isConnected.value = status === 'SUBSCRIBED'

      if (status === 'SUBSCRIBED') {
        addActivity('✅ Terhubung ke sistem realtime', 'connection')

        // Mulai auto-refresh data
        startPeriodicRefresh()
      } else if (status === 'CHANNEL_ERROR') {
        addActivity('❌ Koneksi realtime terganggu', 'error')
        isConnected.value = false
      }
    })
  } catch (err) {
    console.error('❌ Setup realtime error:', err)
    addActivity('❌ Gagal menyambung ke realtime', 'error')
  }
}

// PERIODIC REFRESH FALLBACK
let periodicRefreshInterval = null
const startPeriodicRefresh = () => {
  if (periodicRefreshInterval) {
    clearInterval(periodicRefreshInterval)
  }

  // Refresh setiap 30 detik sebagai backup
  periodicRefreshInterval = setInterval(async () => {
    if (isConnected.value) {
      await Promise.all([loadTotalVoters(), loadCandidates(), loadVotesCount()])
    }
  }, 30000)
}

const loadCandidates = async () => {
  try {
    if (!sessionData.value?.id) return

    isLoading.value.candidates = true

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
  } catch (err) {
    console.error('❌ Load candidates error:', err)
  } finally {
    isLoading.value.candidates = false
  }
}

const loadVotesCount = async () => {
  try {
    if (!sessionData.value?.id) return

    isLoading.value.votes = true

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
  } finally {
    isLoading.value.votes = false
  }
}

const handleNewVote = async (vote) => {
  try {
    const { data: candidate } = await supabase
      .from('kandidat')
      .select('*, pengguna:pengguna_id(nama_lengkap)')
      .eq('id', vote.kandidat_id)
      .single()

    const candidateName = candidate?.pengguna?.nama_lengkap || 'Unknown'

    // Update UI
    showNotification('vote', candidateName)
    votesData.value++

    // Tambahkan ke activity log
    addActivity(`🗳️ Vote baru untuk ${candidateName}`, 'vote')

    // Update data kandidat
    const candidateIndex = candidatesData.value.findIndex((c) => c.id === vote.kandidat_id)
    if (candidateIndex !== -1) {
      candidatesData.value[candidateIndex].votes++
      candidatesData.value[candidateIndex].hasUpdate = true

      setTimeout(() => {
        if (candidatesData.value[candidateIndex]) {
          candidatesData.value[candidateIndex].hasUpdate = false
        }
      }, 1500)
    }
  } catch (err) {
    console.error('❌ Handle new vote error:', err)
  }
}

const handleCandidateUpdate = (candidate) => {
  try {
    const index = candidatesData.value.findIndex((c) => c.id === candidate.id)
    if (index !== -1) {
      const oldVotes = candidatesData.value[index].votes
      const newVotes = candidate.total_suara || 0

      if (newVotes !== oldVotes) {
        candidatesData.value[index] = {
          ...candidatesData.value[index],
          votes: newVotes,
          hasUpdate: true,
        }

        if (Math.abs(newVotes - oldVotes) > 0) {
          console.log(
            `📈 Kandidat ${candidatesData.value[index].name} update: ${oldVotes} → ${newVotes}`,
          )
        }

        setTimeout(() => {
          if (candidatesData.value[index]) {
            candidatesData.value[index].hasUpdate = false
          }
        }, 1500)
      }
    }
  } catch (err) {
    console.error('❌ Handle candidate update error:', err)
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
      showNotification('winner', '')
    }
  } catch (err) {
    console.error('❌ Handle session update error:', err)
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
    addActivity(`🔄 PUTARAN 2 DIMULAI`, 'round')
    showNotification('round', '')
  }
}

// Refresh semua data
const refreshAllData = async () => {
  try {
    addActivity('🔄 Memuat ulang semua data...', 'info')

    await Promise.all([loadTotalVoters(), loadCandidates(), loadVotesCount()])

    addActivity('✅ Data berhasil dimuat ulang', 'info')

    // Update waktu terakhir
    lastUpdateTime.value = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    })
  } catch (err) {
    console.error('❌ Refresh data error:', err)
    addActivity('❌ Gagal memuat ulang data', 'error')
  }
}

// ===== RECONNECTION LOGIC =====
const reconnectToRealtime = async () => {
  try {
    console.log('🔄 Attempting to reconnect...')
    addActivity('🔄 Mencoba menyambung ulang...', 'connection')

    if (realtimeChannel.value) {
      await supabase.removeChannel(realtimeChannel.value)
    }

    await setupRealtime()
  } catch (err) {
    console.error('❌ Reconnection failed:', err)
    setTimeout(() => {
      if (!isConnected.value) {
        reconnectToRealtime()
      }
    }, 5000)
  }
}

// ===== TIME FUNCTIONS =====
const updateCurrentTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
  })

  // Update last update time setiap menit
  const minutes = now.getMinutes()
  if (minutes !== lastMinutes.value) {
    lastUpdateTime.value = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    })
    lastMinutes.value = minutes
  }

  // Hitung waktu tersisa jika ada sesi aktif
  if (sessionData.value?.waktu_selesai_voting) {
    const endTime = new Date(sessionData.value.waktu_selesai_voting)
    const diffMs = endTime - now
    if (diffMs > 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      timeRemaining.value = `${diffHours}j ${diffMinutes}m`
    } else {
      timeRemaining.value = 'Selesai'
    }
  }
}

let lastMinutes = ref(null)

// ===== LIFECYCLE =====
onMounted(async () => {
  // Auto fullscreen untuk layar besar
  if (window.innerWidth > 1024) {
    isFullscreen.value = true
  }

  // Setup waktu real-time
  updateCurrentTime()
  const timeInterval = setInterval(updateCurrentTime, 1000)

  // Setup realtime
  await setupRealtime()

  // Setup reconnection checker
  const reconnectionInterval = setInterval(() => {
    if (!isConnected.value && sessionData.value) {
      console.log('⚠️ Connection lost, attempting to reconnect...')
      reconnectToRealtime()
    }
  }, 10000)

  // Listen for fullscreen changes
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })

  // Cleanup intervals on unmount
  onUnmounted(() => {
    clearInterval(timeInterval)
    clearInterval(reconnectionInterval)
  })
})

onUnmounted(() => {
  if (realtimeChannel.value) {
    supabase.removeChannel(realtimeChannel.value)
    console.log('🔕 Realtime channel cleaned up')
  }

  if (periodicRefreshInterval) {
    clearInterval(periodicRefreshInterval)
  }

  if (document.fullscreenElement) {
    document.exitFullscreen()
  }

  document.removeEventListener('fullscreenchange', () => {})
})

// Watch untuk koneksi status changes
watch(isConnected, (newVal) => {
  if (newVal) {
    console.log('✅ Realtime connected')
  } else {
    console.log('❌ Realtime disconnected')
  }
})
</script>

<style scoped>
/* ===== GLOBAL STYLES ===== */
.live-results {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  font-family: 'Segoe UI', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

/* ===== MINIMAL HEADER ===== */
.minimal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
  gap: 12px;
}

.back-button {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: #93c5fd;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.back-button:hover {
  background: rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.header-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.session-name {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.main-title {
  font-size: 18px;
  font-weight: 800;
  color: white;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.sub-title {
  font-size: 12px;
  color: #cbd5e1;
  text-align: center;
  max-width: 400px;
  line-height: 1.3;
}

.round-info {
  font-size: 12px;
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  margin-top: 4px;
}

.status-indicator.connected {
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

.header-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

/* ===== VOTE NOTIFICATION ===== */
.vote-notification {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 12px;
  padding: 12px 20px;
  max-width: 400px;
  width: 90%;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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
  font-size: 24px;
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
  font-size: 14px;
  margin-bottom: 2px;
}

.notification-details {
  font-size: 12px;
  opacity: 0.9;
}

.notification-details .candidate {
  font-weight: bold;
}

.notification-time {
  font-size: 11px;
  opacity: 0.8;
  font-family: 'Courier New', monospace;
}

/* ===== MAIN DASHBOARD ===== */
.main-dashboard {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

/* ===== SUMMARY ROW ===== */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.08);
}

.stat-icon {
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: white;
  display: block;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Loading States */
.stat-value.loading {
  color: #94a3b8 !important;
  animation: pulse 1.5s infinite;
}

.stat-loading {
  font-size: 10px;
  color: #64748b;
  margin-top: 2px;
}

/* Participation indicators */
.participation-high,
.participation-medium {
  font-size: 10px;
  margin-top: 2px;
  padding: 1px 6px;
  border-radius: 8px;
  display: inline-block;
}

.participation-high {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.participation-medium {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

/* Time remaining */
.time-remaining {
  font-size: 10px;
  color: #fbbf24;
  margin-top: 2px;
  font-weight: 600;
}

/* ===== WINNERS SECTION ===== */
.winners-section {
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid rgba(34, 197, 94, 0.2);
  border-radius: 16px;
  padding: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #22c55e;
}

.title-icon {
  font-size: 20px;
}

.winners-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.winner-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid #22c55e;
  position: relative;
  overflow: hidden;
}

.winner-card.supermajority {
  border-left-color: #fbbf24;
  background: rgba(251, 191, 36, 0.05);
}

.winner-position {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.winner-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
  color: white;
}

.winner-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-votes {
  color: #cbd5e1;
  font-size: 14px;
}

.stat-percentage {
  font-size: 20px;
  font-weight: bold;
  color: #22c55e;
  font-family: 'Courier New', monospace;
}

.winner-card.supermajority .stat-percentage {
  color: #fbbf24;
}

/* ===== RUN-OFF SECTION ===== */
.runoff-section {
  background: rgba(245, 158, 11, 0.1);
  border: 2px solid rgba(245, 158, 11, 0.2);
  border-radius: 16px;
  padding: 16px;
}

.runoff-alert {
  display: flex;
  align-items: center;
  gap: 16px;
}

.runoff-icon {
  font-size: 32px;
}

.runoff-content {
  flex: 1;
}

.runoff-title {
  margin: 0 0 4px 0;
  color: #f59e0b;
  font-size: 16px;
}

.runoff-description {
  margin: 0;
  color: #cbd5e1;
  font-size: 14px;
}

.runoff-details {
  margin-top: 8px;
}

.runoff-position {
  display: inline-block;
  background: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
  padding: 4px 8px;
  border-radius: 6px;
  margin-right: 4px;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
}

.runoff-button {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s;
  white-space: nowrap;
}

.runoff-button:hover {
  transform: translateY(-2px);
}

/* ===== CONTENT GRID ===== */
.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

/* ===== POSITION TABS ===== */
.position-tabs-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
}

.position-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  gap: 8px;
}

.position-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: none;
  border: none;
  color: white;
  padding: 12px;
  cursor: pointer;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
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
}

.tab-icon {
  font-size: 16px;
}

.tab-name {
  white-space: nowrap;
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

/* ===== CANDIDATES CONTAINER ===== */
.candidates-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
}

.candidates-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.candidates-title {
  margin: 0;
  font-size: 18px;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 8px;
}

.candidates-stats {
  display: flex;
  gap: 16px;
}

.candidates-stats .stat {
  font-size: 12px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
}

/* ===== CANDIDATES RANKING ===== */
.candidates-ranking {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading-candidates {
  text-align: center;
  padding: 40px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #3b82f6;
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
  gap: 16px;
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
}

.candidate-item.rank-3 {
  border-left-color: #92400e;
}

.candidate-item.vote-update {
  animation: highlightVote 1s;
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

.candidate-rank {
  min-width: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.rank-number {
  font-size: 20px;
  font-weight: bold;
  color: #94a3b8;
}

.winner-badge {
  font-size: 14px;
  margin-top: 2px;
}

.candidate-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.candidate-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 14px;
  flex-shrink: 0;
}

.candidate-details {
  flex: 1;
}

.candidate-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 4px;
  color: white;
}

.candidate-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.meta-percentage {
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.candidate-progress {
  width: 120px;
  flex-shrink: 0;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-fill.supermajority {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.progress-text {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
}

.supermajority-indicator {
  color: #fbbf24;
  font-size: 10px;
}

/* ===== ACTIVITY CONTAINER ===== */
.activity-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.activity-title {
  margin: 0;
  font-size: 16px;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-icon {
  font-size: 18px;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(180deg);
}

.activity-feed {
  height: 150px;
  overflow-y: auto;
}

.empty-activity {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  font-style: italic;
  font-size: 14px;
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

.activity-item.connection {
  border-left-color: #8b5cf6;
}

.activity-item .activity-icon {
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-message {
  font-size: 12px;
  color: #e2e8f0;
  margin-bottom: 4px;
  line-height: 1.4;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.activity-time {
  color: #94a3b8;
  font-family: 'Courier New', monospace;
}

/* ===== FOOTER INFO ===== */
.footer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.update-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.update-label {
  color: #94a3b8;
}

.update-time {
  color: white;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.refresh-mini-btn {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #94a3b8;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
  margin-left: 8px;
  font-size: 12px;
  transition: all 0.2s;
}

.refresh-mini-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Session info */
.session-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
}

.session-status {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.session-period {
  color: #94a3b8;
  font-size: 10px;
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
  font-size: 11px;
  font-weight: bold;
}

.connection-info.connected .connection-text {
  color: #22c55e;
}

/* ===== FULLSCREEN MODE ===== */
.live-results.fullscreen-mode .main-dashboard {
  padding: 24px;
  height: calc(100vh - 60px);
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

/* ===== RESPONSIVE BREAKPOINTS ===== */

/* Mobile: ≤480px */
@media (max-width: 480px) {
  .minimal-header {
    padding: 10px 12px;
    flex-direction: column;
    gap: 8px;
  }

  .back-button {
    align-self: flex-start;
    font-size: 12px;
    padding: 6px 12px;
  }

  .header-center {
    order: 3;
    width: 100%;
  }

  .main-title {
    font-size: 14px;
    text-align: center;
  }

  .sub-title {
    font-size: 10px;
    max-width: 280px;
  }

  .header-controls {
    align-self: flex-end;
  }

  .summary-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .winners-grid {
    grid-template-columns: 1fr;
  }

  .content-grid {
    gap: 12px;
  }

  .position-tabs {
    flex-direction: column;
  }

  .candidate-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .candidate-info {
    width: 100%;
  }

  .candidate-progress {
    width: 100%;
  }

  .activity-feed {
    height: 120px;
  }

  .footer-info {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .session-info {
    display: none;
  }

  .refresh-mini-btn {
    margin-left: 4px;
  }
}

/* Tablet: 481px-768px */
@media (min-width: 481px) and (max-width: 768px) {
  .minimal-header {
    padding: 12px 16px;
  }

  .main-title {
    font-size: 16px;
  }

  .sub-title {
    font-size: 11px;
  }

  .summary-row {
    grid-template-columns: repeat(4, 1fr);
  }

  .winners-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .candidate-item {
    gap: 12px;
  }

  .candidate-progress {
    width: 100px;
  }

  .activity-feed {
    height: 130px;
  }
}

/* Desktop: 769px-1024px */
@media (min-width: 769px) {
  .content-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .activity-container {
    grid-column: 1 / -1;
  }
}

/* Large Desktop: 1025px-1920px */
@media (min-width: 1025px) {
  .main-dashboard {
    padding: 24px 32px;
    gap: 20px;
  }

  .summary-row {
    gap: 16px;
  }

  .stat-card {
    padding: 20px;
  }

  .stat-value {
    font-size: 24px;
  }

  .winners-section {
    padding: 24px;
  }

  .winner-name {
    font-size: 20px;
  }

  .content-grid {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .candidates-container {
    padding: 24px;
  }

  .activity-container {
    grid-column: 1 / -1;
  }

  .activity-feed {
    height: 180px;
  }
}

/* TV Mode: ≥1921px */
@media (min-width: 1921px) {
  .live-results {
    font-size: 1.1em;
  }

  .minimal-header {
    padding: 20px 40px;
  }

  .main-title {
    font-size: 24px;
    letter-spacing: 1px;
  }

  .sub-title {
    font-size: 16px;
    max-width: 600px;
  }

  .round-info {
    font-size: 16px;
    padding: 6px 16px;
  }

  .control-btn {
    width: 50px;
    height: 50px;
    font-size: 22px;
  }

  .main-dashboard {
    padding: 32px 48px;
    gap: 24px;
    max-width: 3840px;
    margin: 0 auto;
  }

  .summary-row {
    gap: 24px;
  }

  .stat-card {
    padding: 24px;
    border-radius: 16px;
  }

  .stat-icon {
    font-size: 32px;
  }

  .stat-value {
    font-size: 28px;
  }

  .stat-label {
    font-size: 14px;
  }

  .winners-section {
    padding: 32px;
    border-radius: 20px;
  }

  .section-title {
    font-size: 24px;
  }

  .winner-card {
    padding: 24px;
    border-radius: 16px;
  }

  .winner-name {
    font-size: 24px;
  }

  .winner-stats {
    font-size: 18px;
  }

  .content-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }

  .activity-container {
    grid-column: span 1;
  }

  .position-tab {
    padding: 16px;
    font-size: 16px;
    border-radius: 16px;
  }

  .candidate-item {
    padding: 20px;
    gap: 20px;
    border-radius: 16px;
  }

  .candidate-avatar {
    width: 50px;
    height: 50px;
    font-size: 18px;
  }

  .candidate-name {
    font-size: 18px;
  }

  .candidate-meta {
    font-size: 14px;
  }

  .candidate-progress {
    width: 200px;
  }

  .progress-bar {
    height: 10px;
  }

  .progress-text {
    font-size: 14px;
  }

  .activity-feed {
    height: 250px;
  }

  .activity-message {
    font-size: 14px;
  }

  .footer-info {
    padding: 16px 24px;
    border-radius: 16px;
  }

  .update-info {
    font-size: 14px;
  }

  .connection-text {
    font-size: 14px;
  }

  /* No scroll on 70 inch TV */
  .live-results.fullscreen-mode .main-dashboard {
    height: calc(100vh - 80px);
    overflow-y: hidden;
  }

  .live-results.fullscreen-mode .activity-feed {
    height: calc(50vh - 100px);
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .back-button,
  .control-btn,
  .position-tab,
  .runoff-button {
    min-height: 44px;
    min-width: 44px;
  }

  .candidate-item {
    padding: 16px;
    margin-bottom: 8px;
  }

  .candidates-ranking,
  .activity-feed {
    -webkit-overflow-scrolling: touch;
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .live-results * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .vote-notification {
    animation: none;
  }

  .status-indicator,
  .connection-dot {
    animation: none;
  }
}
</style>
