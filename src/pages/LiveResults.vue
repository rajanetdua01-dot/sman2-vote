<template>
  <div class="live-results" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- BACKGROUND OVERLAY (untuk kontras) -->
    <div class="background-overlay"></div>

    <!-- MAIN CONTENT -->
    <div class="results-container">
      <!-- HEADER SECTION -->
      <header class="results-header">
        <div class="header-left">
          <div class="session-title">
            <h1 class="main-title">🏆 PEMILIHAN WAKA SMAN 2</h1>
            <h2 class="sub-title">{{ activeSession?.nama_sesi || 'Sesi Pemilihan' }}</h2>
          </div>
          <div class="session-info">
            <div class="info-item">
              <span class="info-icon">📅</span>
              <span class="info-text">{{ currentDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-icon">📍</span>
              <span class="info-text">Ruang Aula SMAN 2 Bandar Lampung</span>
            </div>
          </div>
        </div>

        <div class="header-right">
          <!-- LIVE BADGE -->
          <div class="live-badge">
            <span class="live-pulse"></span>
            <span class="live-text">HASIL SEMENTARA</span>
          </div>

          <!-- TIMER SECTION -->
          <div class="timer-section">
            <div class="timer-display">
              <span class="timer-icon">⏱️</span>
              <span class="timer-text" :class="timerClass">
                {{ formatTimeRemaining(timeRemaining) }}
              </span>
            </div>
            <div class="timer-label">WAKTU TERSISA</div>
          </div>

          <!-- REFRESH INDICATOR -->
          <div class="refresh-indicator">
            <span class="refresh-icon" :class="{ refreshing: isRefreshing }">🔄</span>
            <span class="refresh-text">Update: {{ lastUpdate }}</span>
          </div>
        </div>
      </header>

      <!-- MAIN STATS BANNER -->
      <div class="stats-banner">
        <!-- TOTAL PARTICIPATION -->
        <div class="stat-card participation-stat">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-label">PARTISIPASI</div>
            <div class="stat-numbers">
              <span class="stat-current">{{ votedCount }}</span>
              <span class="stat-total">/{{ totalGuru }}</span>
            </div>
            <div class="stat-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: participationRate + '%' }"></div>
              </div>
              <div class="progress-text">{{ participationRate }}%</div>
            </div>
          </div>
        </div>

        <!-- VOTING SPEED -->
        <div class="stat-card speed-stat">
          <div class="stat-icon">⚡</div>
          <div class="stat-content">
            <div class="stat-label">KECEPATAN VOTING</div>
            <div class="stat-numbers">
              <span class="stat-value">{{ votesPerMinute }}</span>
              <span class="stat-unit">vote/menit</span>
            </div>
            <div class="speed-indicator" :class="getSpeedClass(votesPerMinute)">
              {{ getSpeedLabel(votesPerMinute) }}
            </div>
          </div>
        </div>

        <!-- TIME ELAPSED -->
        <div class="stat-card time-stat">
          <div class="stat-icon">🕐</div>
          <div class="stat-content">
            <div class="stat-label">WAKTU BERJALAN</div>
            <div class="stat-numbers">
              <span class="stat-value">{{ timeElapsed }}</span>
            </div>
            <div class="time-estimate">Estimasi selesai: {{ estimatedCompletion }}</div>
          </div>
        </div>

        <!-- COMPLETION STATUS -->
        <div class="stat-card completion-stat">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-label">STATUS</div>
            <div class="completion-text" :class="completionStatusClass">
              {{ getCompletionStatus() }}
            </div>
            <div class="remaining-count" v-if="remainingCount > 0">
              {{ remainingCount }} peserta belum voting
            </div>
          </div>
        </div>
      </div>

      <!-- CANDIDATE LEADERBOARD -->
      <section class="leaderboard-section">
        <div class="section-header">
          <h2 class="section-title">🏆 PERINGKAT KANDIDAT</h2>
          <div class="section-update">
            <span class="update-icon">🔄</span>
            <span class="update-text">Update real-time</span>
          </div>
        </div>

        <div class="leaderboard-container">
          <!-- TOP 3 CANDIDATES (BIG CARDS) -->
          <div class="top-three">
            <!-- 2nd Place -->
            <div class="candidate-card silver" v-if="candidates[1]">
              <div class="candidate-rank">2</div>
              <div class="candidate-medal">🥈</div>
              <div class="candidate-avatar">
                {{ getInitials(candidates[1].nama_lengkap) }}
              </div>
              <div class="candidate-info">
                <h3 class="candidate-name">{{ candidates[1].nama_lengkap }}</h3>
                <div class="candidate-position">{{ formatJabatan(candidates[1].jabatan) }}</div>
              </div>
              <div class="candidate-votes">
                <div class="votes-count">{{ candidates[1].total_suara }}</div>
                <div class="votes-label">SUARA</div>
              </div>
              <div class="candidate-progress">
                <div class="votes-bar">
                  <div
                    class="votes-fill"
                    :style="{ width: getVotePercentage(candidates[1].total_suara) + '%' }"
                  ></div>
                </div>
                <div class="votes-percentage">
                  {{ getVotePercentage(candidates[1].total_suara) }}%
                </div>
              </div>
            </div>

            <!-- 1st Place (BIGGEST) -->
            <div class="candidate-card gold" v-if="candidates[0]">
              <div class="candidate-rank">1</div>
              <div class="candidate-medal">🥇</div>
              <div class="candidate-avatar">
                {{ getInitials(candidates[0].nama_lengkap) }}
              </div>
              <div class="candidate-info">
                <h3 class="candidate-name">{{ candidates[0].nama_lengkap }}</h3>
                <div class="candidate-position">{{ formatJabatan(candidates[0].jabatan) }}</div>
              </div>
              <div class="candidate-votes">
                <div class="votes-count">{{ candidates[0].total_suara }}</div>
                <div class="votes-label">SUARA</div>
              </div>
              <div class="candidate-progress">
                <div class="votes-bar">
                  <div
                    class="votes-fill"
                    :style="{ width: getVotePercentage(candidates[0].total_suara) + '%' }"
                  ></div>
                </div>
                <div class="votes-percentage">
                  {{ getVotePercentage(candidates[0].total_suara) }}%
                </div>
              </div>
            </div>

            <!-- 3rd Place -->
            <div class="candidate-card bronze" v-if="candidates[2]">
              <div class="candidate-rank">3</div>
              <div class="candidate-medal">🥉</div>
              <div class="candidate-avatar">
                {{ getInitials(candidates[2].nama_lengkap) }}
              </div>
              <div class="candidate-info">
                <h3 class="candidate-name">{{ candidates[2].nama_lengkap }}</h3>
                <div class="candidate-position">{{ formatJabatan(candidates[2].jabatan) }}</div>
              </div>
              <div class="candidate-votes">
                <div class="votes-count">{{ candidates[2].total_suara }}</div>
                <div class="votes-label">SUARA</div>
              </div>
              <div class="candidate-progress">
                <div class="votes-bar">
                  <div
                    class="votes-fill"
                    :style="{ width: getVotePercentage(candidates[2].total_suara) + '%' }"
                  ></div>
                </div>
                <div class="votes-percentage">
                  {{ getVotePercentage(candidates[2].total_suara) }}%
                </div>
              </div>
            </div>
          </div>

          <!-- OTHER CANDIDATES LIST -->
          <div class="other-candidates" v-if="otherCandidates.length > 0">
            <div class="list-header">
              <h3 class="list-title">KANDIDAT LAINNYA</h3>
            </div>
            <div class="candidates-grid">
              <div
                v-for="(candidate, index) in otherCandidates"
                :key="candidate.id"
                class="candidate-item"
              >
                <div class="item-rank">{{ index + 4 }}</div>
                <div class="item-avatar">
                  {{ getInitials(candidate.nama_lengkap) }}
                </div>
                <div class="item-info">
                  <div class="item-name">{{ candidate.nama_lengkap }}</div>
                  <div class="item-position">{{ formatJabatan(candidate.jabatan) }}</div>
                </div>
                <div class="item-votes">
                  <div class="item-votes-count">{{ candidate.total_suara }}</div>
                  <div class="item-votes-percentage">
                    {{ getVotePercentage(candidate.total_suara) }}%
                  </div>
                </div>
                <div class="item-progress">
                  <div class="item-bar">
                    <div
                      class="item-fill"
                      :style="{ width: getVotePercentage(candidate.total_suara) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PARTICIPATION SECTION -->
      <section class="participation-section">
        <div class="section-header">
          <h2 class="section-title">👥 STATUS PESERTA</h2>
          <div class="participation-stats">
            <span class="stat-voted">✅ {{ votedCount }} SUDAH</span>
            <span class="stat-pending">⏳ {{ pendingCount }} BELUM</span>
          </div>
        </div>

        <div class="participation-visual">
          <!-- PARTICIPATION CIRCLE -->
          <div class="participation-circle">
            <div class="circle-container">
              <svg class="progress-ring" width="200" height="200">
                <!-- Background circle -->
                <circle
                  class="ring-background"
                  cx="100"
                  cy="100"
                  r="90"
                  stroke-width="20"
                  fill="transparent"
                />
                <!-- Progress circle -->
                <circle
                  class="ring-progress"
                  cx="100"
                  cy="100"
                  r="90"
                  stroke-width="20"
                  fill="transparent"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="dashOffset"
                />
              </svg>
              <div class="circle-content">
                <div class="circle-percentage">{{ participationRate }}%</div>
                <div class="circle-label">PARTISIPASI</div>
              </div>
            </div>
          </div>

          <!-- PARTICIPATION LIST -->
          <div class="participation-list">
            <div class="list-section voted-section">
              <h4 class="list-section-title">✅ SUDAH VOTING</h4>
              <div class="participant-scroll">
                <div
                  v-for="guru in votedParticipants.slice(0, 8)"
                  :key="guru.id"
                  class="participant-item voted"
                >
                  <div class="participant-avatar">
                    {{ getInitials(guru.nama_lengkap) }}
                  </div>
                  <div class="participant-name">{{ guru.nama_lengkap }}</div>
                </div>
              </div>
            </div>

            <div class="list-section pending-section">
              <h4 class="list-section-title">⏳ BELUM VOTING</h4>
              <div class="participant-scroll">
                <div
                  v-for="guru in pendingParticipants.slice(0, 8)"
                  :key="guru.id"
                  class="participant-item pending"
                >
                  <div class="participant-avatar">
                    {{ getInitials(guru.nama_lengkap) }}
                  </div>
                  <div class="participant-name">{{ guru.nama_lengkap }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="results-footer">
        <div class="footer-left">
          <div class="watermark">
            <span class="watermark-icon">🗳️</span>
            <span class="watermark-text">SMANDA VOTE SYSTEM</span>
          </div>
          <div class="footer-info">
            <span class="info-item">📱 sman2-vote.vercel.app</span>
            <span class="info-item">📧 voting@sman2-bandarlampung.sch.id</span>
          </div>
        </div>

        <div class="footer-center">
          <div class="next-update">
            <span class="update-label">UPDATE SELANJUTNYA:</span>
            <span class="update-time">{{ nextUpdateTime }}</span>
          </div>
        </div>

        <div class="footer-right">
          <div class="refresh-timer">
            <span class="timer-icon">🔄</span>
            <span class="timer-text">Auto-refresh: {{ refreshCountdown }}</span>
          </div>
          <div class="timestamp">Terakhir update: {{ currentTime }}</div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'

// State
const loading = ref(true)
const isRefreshing = ref(false)
const isFullscreen = ref(true) // Default fullscreen untuk smartboard
const activeSession = ref(null)
const candidates = ref([])
const allGuru = ref([])
const votesData = ref([])

// Voting stats
const totalGuru = ref(0)
const votedCount = ref(0)
const votesPerMinute = ref(0)
const timeRemaining = ref('30:00')
const timeElapsed = ref('00:00')

// Timer
let refreshInterval = null
let countdownInterval = null
const refreshCountdown = ref(5)

// Computed
const participationRate = computed(() => {
  if (totalGuru.value === 0) return 0
  return Math.round((votedCount.value / totalGuru.value) * 100)
})

const pendingCount = computed(() => {
  return totalGuru.value - votedCount.value
})

const otherCandidates = computed(() => {
  return candidates.value.slice(3)
})

const votedParticipants = computed(() => {
  // Get participants who have voted
  const voterIds = [...new Set(votesData.value.map((v) => v.pemilih_id))]
  return allGuru.value.filter((guru) => voterIds.includes(guru.id))
})

const pendingParticipants = computed(() => {
  const voterIds = [...new Set(votesData.value.map((v) => v.pemilih_id))]
  return allGuru.value.filter((guru) => !voterIds.includes(guru.id))
})

const completionStatusClass = computed(() => {
  if (participationRate.value >= 90) return 'excellent'
  if (participationRate.value >= 70) return 'good'
  if (participationRate.value >= 50) return 'average'
  return 'low'
})

const timerClass = computed(() => {
  const minutes = parseInt(timeRemaining.value.split(':')[0])
  if (minutes < 5) return 'warning'
  if (minutes < 10) return 'alert'
  return 'normal'
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const currentTime = computed(() => {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

const lastUpdate = computed(() => {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const nextUpdateTime = computed(() => {
  const next = new Date(Date.now() + 5000)
  return next.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

const estimatedCompletion = computed(() => {
  if (votesPerMinute.value === 0) return '--:--'
  const remainingVotes = pendingCount.value
  const minutesNeeded = Math.ceil(remainingVotes / votesPerMinute.value)
  const completionTime = new Date(Date.now() + minutesNeeded * 60000)
  return completionTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
})

// Circle progress for participation
const circumference = computed(() => 2 * Math.PI * 90)
const dashOffset = computed(() => {
  return circumference.value * (1 - participationRate.value / 100)
})

// Methods
const loadData = async () => {
  try {
    isRefreshing.value = true

    // Get active session
    const { data: sessions } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .order('dibuat_pada', { ascending: false })
      .limit(1)

    activeSession.value = sessions?.[0] || null

    if (!activeSession.value) return

    // Load candidates
    const { data: candidatesData } = await supabase
      .from('kandidat')
      .select(
        `
        *,
        pengguna:pengguna_id(nama_lengkap)
      `,
      )
      .eq('sesi_id', activeSession.value.id)
      .order('total_suara', { ascending: false })

    candidates.value = (candidatesData || []).map((c) => ({
      ...c,
      nama_lengkap: c.pengguna?.nama_lengkap || 'Unknown',
    }))

    // Load votes
    const { data: votes } = await supabase
      .from('suara')
      .select('*')
      .eq('sesi_id', activeSession.value.id)
      .eq('is_draft', false)

    votesData.value = votes || []

    // Count distinct voters
    const voterIds = [...new Set(votesData.value.map((v) => v.pemilih_id))]
    votedCount.value = voterIds.length

    // Calculate votes per minute (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentVotes = votesData.value.filter(
      (v) => new Date(v.dibuat_pada) > tenMinutesAgo,
    ).length

    votesPerMinute.value = Math.round(recentVotes / 10)

    // Load all teachers
    const { data: teachers } = await supabase
      .from('pengguna')
      .select('id, nama_lengkap, nip')
      .eq('peran', 'guru')
      .eq('is_active', true)

    allGuru.value = teachers || []
    totalGuru.value = allGuru.value.length
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
    isRefreshing.value = false
  }
}

const getVotePercentage = (votes) => {
  if (votesData.value.length === 0) return 0
  return Math.round((votes / votesData.value.length) * 100)
}

const getSpeedClass = (speed) => {
  if (speed >= 10) return 'very-fast'
  if (speed >= 5) return 'fast'
  if (speed >= 2) return 'normal'
  return 'slow'
}

const getSpeedLabel = (speed) => {
  if (speed >= 10) return 'Sangat Cepat'
  if (speed >= 5) return 'Cepat'
  if (speed >= 2) return 'Normal'
  return 'Lambat'
}

const getCompletionStatus = () => {
  if (participationRate.value >= 90) return 'Sangat Baik'
  if (participationRate.value >= 70) return 'Baik'
  if (participationRate.value >= 50) return 'Cukup'
  return 'Perlu Ditingkatkan'
}

const formatTimeRemaining = (timeString) => {
  return timeString
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

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Auto-refresh
const startAutoRefresh = () => {
  if (refreshInterval) clearInterval(refreshInterval)

  // Auto refresh every 5 seconds
  refreshInterval = setInterval(async () => {
    await loadData()
    refreshCountdown.value = 5
  }, 5000)

  // Countdown timer
  setInterval(() => {
    refreshCountdown.value = Math.max(0, refreshCountdown.value - 1)
  }, 1000)

  // Simulate time countdown (30 minutes total)
  let totalSeconds = 30 * 60
  countdownInterval = setInterval(() => {
    if (totalSeconds <= 0) {
      clearInterval(countdownInterval)
      return
    }
    totalSeconds--
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    timeRemaining.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    // Calculate elapsed time
    const elapsedSeconds = 30 * 60 - totalSeconds
    const elapsedMinutes = Math.floor(elapsedSeconds / 60)
    const elapsedSecs = elapsedSeconds % 60
    timeElapsed.value = `${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSecs.toString().padStart(2, '0')}`
  }, 1000)
}

// Lifecycle
onMounted(async () => {
  await loadData()
  startAutoRefresh()

  // Auto enter fullscreen (if supported)
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen()
  }
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  if (countdownInterval) clearInterval(countdownInterval)

  // Exit fullscreen when leaving
  if (document.exitFullscreen) {
    document.exitFullscreen()
  }
})
</script>

<style scoped>
/* SMARTBOARD 100 INCH STYLES */

.live-results {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-x: hidden;
}

.fullscreen-mode {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.background-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(30, 58, 138, 0.1), transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.results-container {
  position: relative;
  z-index: 1;
  max-width: 3840px; /* 4K width */
  margin: 0 auto;
  padding: 40px 60px;
}

/* HEADER STYLES */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 50px;
  padding-bottom: 30px;
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  flex: 1;
}

.main-title {
  font-size: 4rem;
  font-weight: 900;
  margin: 0 0 10px 0;
  background: linear-gradient(90deg, #60a5fa, #8b5cf6);
  -webkit-background-clip: text; /* Vendor prefix */
  background-clip: text; /* Standard property - ADD THIS LINE */
  -webkit-text-fill-color: transparent; /* Vendor prefix */
  color: transparent; /* Standard fallback - ADD THIS LINE */
  text-shadow: 0 2px 10px rgba(96, 165, 250, 0.3);
}

.sub-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #cbd5e1;
  margin: 0;
}

.session-info {
  display: flex;
  gap: 30px;
  margin-top: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.8rem;
  color: #94a3b8;
}

.info-icon {
  font-size: 2rem;
}

/* LIVE BADGE */
.live-badge {
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(220, 38, 38, 0.2);
  padding: 15px 30px;
  border-radius: 50px;
  border: 3px solid #ef4444;
}

.live-pulse {
  width: 20px;
  height: 20px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.live-text {
  font-size: 2rem;
  font-weight: 700;
  color: #fecaca;
  letter-spacing: 2px;
}

/* TIMER SECTION */
.timer-section {
  text-align: center;
  margin: 30px 0;
}

.timer-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 10px;
}

.timer-icon {
  font-size: 3rem;
}

.timer-text {
  font-size: 4.5rem;
  font-weight: 900;
  font-family: 'Courier New', monospace;
}

.timer-text.normal {
  color: #10b981;
}

.timer-text.alert {
  color: #f59e0b;
  animation: blink 1s infinite;
}

.timer-text.warning {
  color: #ef4444;
  animation: blink 0.5s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.timer-label {
  font-size: 1.5rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* STATS BANNER */
.stats-banner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  margin-bottom: 60px;
}

.stat-card {
  background: rgba(30, 41, 59, 0.7);
  border-radius: 25px;
  padding: 30px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(96, 165, 250, 0.3);
}

.stat-icon {
  font-size: 3.5rem;
  margin-bottom: 20px;
}

.stat-label {
  font-size: 1.8rem;
  color: #cbd5e1;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-numbers {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 20px;
}

.stat-current {
  font-size: 4rem;
  font-weight: 900;
  color: white;
}

.stat-total {
  font-size: 2.5rem;
  color: #94a3b8;
}

.stat-value {
  font-size: 4rem;
  font-weight: 900;
  color: white;
}

.stat-unit {
  font-size: 2rem;
  color: #94a3b8;
}

/* PROGRESS BARS */
.progress-bar {
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  margin: 15px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  border-radius: 10px;
  transition: width 1s ease;
}

.progress-text {
  font-size: 2rem;
  font-weight: 700;
  color: #10b981;
}

/* SPEED INDICATOR */
.speed-indicator {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 10px;
}

.speed-indicator.very-fast {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 2px solid #4ade80;
}

.speed-indicator.fast {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.speed-indicator.normal {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.speed-indicator.slow {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
}

/* TIME ESTIMATE */
.time-estimate {
  font-size: 1.5rem;
  color: #cbd5e1;
  margin-top: 10px;
}

/* COMPLETION STATUS */
.completion-text {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
}

.completion-text.excellent {
  color: #10b981;
}

.completion-text.good {
  color: #3b82f6;
}

.completion-text.average {
  color: #f59e0b;
}

.completion-text.low {
  color: #ef4444;
}

.remaining-count {
  font-size: 1.5rem;
  color: #fbbf24;
}

/* LEADERBOARD SECTION */
.leaderboard-section {
  margin-bottom: 60px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.section-title {
  font-size: 3rem;
  font-weight: 800;
  color: white;
  margin: 0;
}

.section-update {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #94a3b8;
  font-size: 1.8rem;
}

.update-icon {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* TOP THREE CANDIDATES */
.top-three {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 40px;
  margin-bottom: 50px;
  align-items: end;
}

.candidate-card {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 30px;
  padding: 40px;
  text-align: center;
  position: relative;
  backdrop-filter: blur(10px);
  border: 3px solid transparent;
  transition: all 0.3s ease;
}

.candidate-card.gold {
  border-color: gold;
  box-shadow: 0 0 50px rgba(255, 215, 0, 0.3);
  transform: scale(1.1);
  margin-bottom: -20px;
}

.candidate-card.silver {
  border-color: silver;
  box-shadow: 0 0 40px rgba(192, 192, 192, 0.3);
}

.candidate-card.bronze {
  border-color: #cd7f32;
  box-shadow: 0 0 40px rgba(205, 127, 50, 0.3);
}

.candidate-rank {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 900;
  border: 3px solid currentColor;
}

.gold .candidate-rank {
  color: gold;
}
.silver .candidate-rank {
  color: silver;
}
.bronze .candidate-rank {
  color: #cd7f32;
}

.candidate-medal {
  font-size: 4rem;
  margin-bottom: 20px;
}

.candidate-avatar {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 900;
  margin: 0 auto 20px;
  color: white;
}

.candidate-name {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: white;
}

.candidate-position {
  font-size: 1.8rem;
  color: #cbd5e1;
  margin-bottom: 30px;
}

.candidate-votes {
  margin-bottom: 20px;
}

.votes-count {
  font-size: 3.5rem;
  font-weight: 900;
  color: white;
}

.votes-label {
  font-size: 1.5rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.votes-bar {
  height: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 7.5px;
  overflow: hidden;
  margin: 10px 0;
}

.votes-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  border-radius: 7.5px;
  transition: width 1s ease;
}

.votes-percentage {
  font-size: 2rem;
  font-weight: 700;
  color: #10b981;
}

/* OTHER CANDIDATES */
.other-candidates {
  background: rgba(30, 41, 59, 0.6);
  border-radius: 25px;
  padding: 30px;
}

.list-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 30px 0;
}

.candidates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.candidate-item {
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(15, 23, 42, 0.8);
  padding: 20px;
  border-radius: 15px;
  transition: background 0.3s ease;
}

.candidate-item:hover {
  background: rgba(30, 58, 138, 0.3);
}

.item-rank {
  font-size: 2rem;
  font-weight: 900;
  color: #94a3b8;
  min-width: 50px;
}

.item-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.item-name {
  font-size: 1.8rem;
  font-weight: 600;
  color: white;
}

.item-position {
  font-size: 1.4rem;
  color: #cbd5e1;
}

.item-votes-count {
  font-size: 2rem;
  font-weight: 700;
  color: white;
}

.item-votes-percentage {
  font-size: 1.4rem;
  color: #10b981;
}

.item-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 5px;
}

.item-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
}

/* PARTICIPATION SECTION */
.participation-section {
  margin-bottom: 60px;
}

.participation-stats {
  display: flex;
  gap: 40px;
}

.stat-voted {
  font-size: 2rem;
  font-weight: 700;
  color: #10b981;
}

.stat-pending {
  font-size: 2rem;
  font-weight: 700;
  color: #fbbf24;
}

.participation-visual {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 50px;
  align-items: center;
  margin-top: 30px;
}

/* PARTICIPATION CIRCLE */
.participation-circle {
  display: flex;
  justify-content: center;
}

.circle-container {
  position: relative;
  width: 300px;
  height: 300px;
}

.ring-background {
  stroke: rgba(255, 255, 255, 0.1);
}

.ring-progress {
  stroke: url(#progress-gradient);
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dashoffset 1s ease;
}

#progress-gradient {
  --color-start: #10b981;
  --color-end: #3b82f6;
}

.circle-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.circle-percentage {
  font-size: 4.5rem;
  font-weight: 900;
  color: white;
}

.circle-label {
  font-size: 1.8rem;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-top: 10px;
}

/* PARTICIPATION LIST */
.participation-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.list-section-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid;
}

.voted-section .list-section-title {
  color: #10b981;
  border-color: #10b981;
}

.pending-section .list-section-title {
  color: #fbbf24;
  border-color: #fbbf24;
}

.participant-scroll {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 20px;
}

.participant-scroll::-webkit-scrollbar {
  width: 8px;
}

.participant-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.participant-scroll::-webkit-scrollbar-thumb {
  background: #3b82f6;
  border-radius: 4px;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 10px;
  transition: background 0.3s ease;
}

.participant-item.voted {
  background: rgba(16, 185, 129, 0.1);
}

.participant-item.pending {
  background: rgba(251, 191, 36, 0.1);
}

.participant-item:hover {
  background: rgba(59, 130, 246, 0.2);
}

.participant-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.participant-name {
  font-size: 1.8rem;
  font-weight: 600;
  color: white;
}

/* FOOTER */
.results-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 30px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
  margin-top: 40px;
}

.watermark {
  display: flex;
  align-items: center;
  gap: 15px;
}

.watermark-icon {
  font-size: 2.5rem;
}

.watermark-text {
  font-size: 2rem;
  font-weight: 700;
  color: #cbd5e1;
}

.footer-info {
  display: flex;
  gap: 30px;
  margin-top: 15px;
}

.info-item {
  font-size: 1.5rem;
  color: #94a3b8;
}

.next-update {
  text-align: center;
}

.update-label {
  display: block;
  font-size: 1.4rem;
  color: #94a3b8;
  margin-bottom: 5px;
}

.update-time {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  font-family: 'Courier New', monospace;
}

.refresh-timer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.timer-icon {
  font-size: 1.8rem;
}

.timer-text {
  font-size: 1.6rem;
  color: #cbd5e1;
}

.timestamp {
  font-size: 1.4rem;
  color: #94a3b8;
  text-align: right;
}

/* RESPONSIVE DESIGN FOR SMARTBOARD */
@media (max-width: 2560px) {
  .results-container {
    padding: 30px 40px;
  }
  .main-title {
    font-size: 3rem;
  }
  .timer-text {
    font-size: 3.5rem;
  }
  .stat-current {
    font-size: 3rem;
  }
  .candidate-name {
    font-size: 2rem;
  }
}

@media (max-width: 1920px) {
  .results-container {
    padding: 20px 30px;
  }
  .main-title {
    font-size: 2.5rem;
  }
  .timer-text {
    font-size: 3rem;
  }
  .stat-current {
    font-size: 2.5rem;
  }
  .top-three {
    gap: 20px;
  }
  .candidate-card {
    padding: 20px;
  }
}

@media (max-width: 1366px) {
  .results-container {
    padding: 15px 20px;
  }
  .main-title {
    font-size: 2rem;
  }
  .sub-title {
    font-size: 1.5rem;
  }
  .timer-text {
    font-size: 2.5rem;
  }
  .stats-banner {
    grid-template-columns: repeat(2, 1fr);
  }
  .top-three {
    grid-template-columns: 1fr;
  }
  .candidate-card.gold {
    transform: scale(1);
    margin-bottom: 0;
  }
  .participation-visual {
    grid-template-columns: 1fr;
  }
}

/* LOADING STATE */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #0f172a;
}

.loading-spinner {
  width: 100px;
  height: 100px;
  border: 8px solid rgba(59, 130, 246, 0.3);
  border-top: 8px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 30px;
}

.loading-text {
  font-size: 2.5rem;
  color: #cbd5e1;
  text-align: center;
}
</style>
