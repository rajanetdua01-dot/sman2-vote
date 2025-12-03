<template>
  <div class="admin-dashboard">
    <!-- Loading State -->
    <div v-if="loading" class="loading-screen">
      <div class="loader"></div>
      <p>Memuat dashboard...</p>
    </div>

    <!-- Unauthorized State -->
    <div v-else-if="!isAuthenticated" class="unauthorized">
      <h2>⚠️ Akses Ditolak</h2>
      <p>Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      <div class="action-buttons">
        <router-link to="/admin-login" class="btn-login">Login sebagai Admin</router-link>
        <router-link to="/" class="btn-home">Kembali ke Home</router-link>
      </div>
    </div>

    <!-- Authorized Content -->
    <div v-else>
      <!-- Header -->
      <div class="admin-header">
        <div class="header-left">
          <h1>Dashboard Admin</h1>
          <p>Panel Kontrol Sistem Voting SMANDA</p>
          <div class="session-info" v-if="activeSession">
            <span class="session-badge">Sesi: {{ activeSession.nama_sesi }}</span>
            <span class="status-badge" :class="activeSession.status">{{
              activeSession.status.toUpperCase()
            }}</span>
          </div>
        </div>
        <div class="header-right">
          <div class="admin-info">
            <div class="admin-avatar">
              {{ getInitials(adminUser?.nama_lengkap) }}
            </div>
            <div class="admin-details">
              <strong>{{ adminUser?.nama_lengkap }}</strong>
              <span class="role-badge">{{ adminUser?.peran }}</span>
            </div>
          </div>
          <button @click="handleLogout" class="logout-btn">Logout</button>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h3>Total Guru</h3>
            <p class="stat-number">{{ stats.totalGuru }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <h3>Sudah Voting</h3>
            <p class="stat-number">{{ stats.votedCount }}</p>
            <p class="stat-percentage">{{ stats.participationRate }}%</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎫</div>
          <div class="stat-content">
            <h3>Token Tersedia</h3>
            <p class="stat-number">{{ stats.availableTokens }}</p>
            <p class="stat-sub">dari {{ stats.totalTokens }}</p>
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

      <!-- Session Status Flow -->
      <div class="status-flow" v-if="activeSession">
        <div class="flow-container">
          <div
            class="flow-step"
            :class="{
              active: activeSession.status === 'draft',
              completed: ['pendaftaran', 'voting', 'selesai'].includes(activeSession.status),
            }"
          >
            <div class="step-circle">1</div>
            <div class="step-label">DRAFT</div>
            <div class="step-description">Buat sesi pemilihan</div>
          </div>

          <div class="flow-arrow">→</div>

          <div
            class="flow-step"
            :class="{
              active: activeSession.status === 'pendaftaran',
              completed: ['voting', 'selesai'].includes(activeSession.status),
            }"
          >
            <div class="step-circle">2</div>
            <div class="step-label">PENDAFTARAN</div>
            <div class="step-description">Guru daftar calon</div>
          </div>

          <div class="flow-arrow">→</div>

          <div
            class="flow-step"
            :class="{
              active: activeSession.status === 'voting',
              completed: activeSession.status === 'selesai',
            }"
          >
            <div class="step-circle">3</div>
            <div class="step-label">VOTING</div>
            <div class="step-description">Pemungutan suara</div>
          </div>

          <div class="flow-arrow">→</div>

          <div class="flow-step" :class="{ active: activeSession.status === 'selesai' }">
            <div class="step-circle">4</div>
            <div class="step-label">SELESAI</div>
            <div class="step-description">Hasil final</div>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
          class="tab-btn"
        >
          {{ tab.label }}
          <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- TAB 1: Kelola Sesi -->
        <div v-if="activeTab === 'session'" class="tab-pane">
          <div class="section-header">
            <h2>⚙️ Kelola Sesi Pemilihan</h2>
            <p>Kontrol manual sistem voting</p>
          </div>

          <div v-if="!activeSession" class="empty-state">
            <p>Belum ada sesi pemilihan aktif</p>
            <button @click="showCreateModal = true" class="btn-primary">+ Buat Sesi Baru</button>
          </div>

          <div v-else class="session-management">
            <!-- Session Card -->
            <div class="session-card">
              <div class="session-header">
                <h3>{{ activeSession.nama_sesi }}</h3>
                <div class="session-meta">
                  <span class="session-year">{{ activeSession.tahun_ajaran }}</span>
                  <span class="session-date"
                    >Dibuat: {{ formatDate(activeSession.dibuat_pada) }}</span
                  >
                </div>
              </div>

              <div class="session-status-display">
                <div class="current-status">
                  <span class="status-label">Status saat ini:</span>
                  <span class="status-badge-large" :class="activeSession.status">
                    {{ getStatusLabel(activeSession.status) }}
                  </span>
                </div>

                <div class="status-info" v-if="activeSession.status === 'voting'">
                  <p>
                    📊 Partisipasi: {{ stats.participationRate }}% ({{ stats.votedCount }}/{{
                      stats.totalGuru
                    }})
                  </p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="session-actions">
                <div class="action-group">
                  <h4>Kontrol Sesi:</h4>

                  <div class="action-buttons-grid">
                    <!-- DRAFT → PENDAFTARAN -->
                    <button
                      v-if="activeSession.status === 'draft'"
                      @click="confirmAction('bukaPendaftaran')"
                      class="action-btn btn-primary"
                    >
                      <span class="action-icon">🚀</span>
                      <span class="action-text">BUKA PENDAFTARAN</span>
                      <span class="action-desc">Guru bisa daftar sebagai calon</span>
                    </button>

                    <!-- PENDAFTARAN → VOTING -->
                    <button
                      v-if="activeSession.status === 'pendaftaran'"
                      @click="confirmAction('bukaVoting')"
                      class="action-btn btn-success"
                    >
                      <span class="action-icon">🗳️</span>
                      <span class="action-text">BUKA VOTING</span>
                      <span class="action-desc">Auto generate token 6 digit untuk semua guru</span>
                    </button>

                    <!-- VOTING → SELESAI -->
                    <button
                      v-if="activeSession.status === 'voting'"
                      @click="confirmAction('tutupVoting')"
                      class="action-btn btn-warning"
                    >
                      <span class="action-icon">✅</span>
                      <span class="action-text">TUTUP VOTING</span>
                      <span class="action-desc">Selesaikan & umumkan hasil</span>
                    </button>

                    <!-- SELESAI → DRAFT (Reset) -->
                    <button
                      v-if="activeSession.status === 'selesai'"
                      @click="confirmAction('resetSesi')"
                      class="action-btn btn-danger"
                    >
                      <span class="action-icon">🔄</span>
                      <span class="action-text">RESET SESI</span>
                      <span class="action-desc">Kembali ke status DRAFT</span>
                    </button>

                    <!-- Additional Actions -->
                    <button
                      v-if="activeSession.status === 'pendaftaran'"
                      @click="activeTab = 'candidates'"
                      class="action-btn btn-secondary"
                    >
                      <span class="action-icon">👥</span>
                      <span class="action-text">VERIFIKASI CALON</span>
                      <span class="action-desc">Lihat & verifikasi pendaftar</span>
                    </button>

                    <button
                      v-if="activeSession.status === 'voting'"
                      @click="activeTab = 'monitor'"
                      class="action-btn btn-info"
                    >
                      <span class="action-icon">📊</span>
                      <span class="action-text">MONITOR VOTING</span>
                      <span class="action-desc">Pantau perkembangan real-time</span>
                    </button>
                  </div>
                </div>

                <!-- Quick Info -->
                <div class="quick-info">
                  <div class="info-card">
                    <h5>Panduan Status:</h5>
                    <ul>
                      <li><strong>DRAFT:</strong> Sesi dibuat, belum aktif</li>
                      <li><strong>PENDAFTARAN:</strong> Guru bisa daftar sebagai calon</li>
                      <li><strong>VOTING:</strong> Token otomatis dibuat, pemilih bisa voting</li>
                      <li><strong>SELESAI:</strong> Voting ditutup, hasil final</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: Kelola Token -->
        <div v-else-if="activeTab === 'tokens'" class="tab-pane">
          <div class="section-header">
            <h2>🎫 Token Voting (6 Digit)</h2>
            <p>Token otomatis dibuat saat BUKA VOTING</p>
          </div>

          <div class="token-controls">
            <div class="control-info">
              <p v-if="activeSession?.status !== 'voting' && activeSession?.status !== 'selesai'">
                ⚠️ Token akan otomatis dibuat saat <strong>BUKA VOTING</strong>
              </p>
              <p v-else-if="stats.totalTokens === 0">
                <button @click="confirmAction('generateTokensNow')" class="btn-primary">
                  🎫 Generate Token Sekarang
                </button>
              </p>
              <p v-else>✅ Token sudah digenerate untuk {{ stats.totalGuru }} guru</p>
            </div>

            <div class="token-actions">
              <button @click="exportTokensCSV" :disabled="!stats.totalTokens" class="btn-secondary">
                📁 Export ke CSV
              </button>
              <button @click="printTokens" :disabled="!stats.totalTokens" class="btn-secondary">
                🖨️ Cetak Token
              </button>
              <button @click="refreshData" class="btn-refresh">🔄 Refresh</button>
            </div>
          </div>

          <div class="token-stats">
            <div class="token-stat">
              <h4>Total Token</h4>
              <p>{{ stats.totalTokens || 0 }}</p>
            </div>
            <div class="token-stat">
              <h4>Sudah Digunakan</h4>
              <p class="used">{{ stats.usedTokens || 0 }}</p>
            </div>
            <div class="token-stat">
              <h4>Tersedia</h4>
              <p class="available">{{ stats.availableTokens || 0 }}</p>
            </div>
            <div class="token-stat">
              <h4>Partisipasi</h4>
              <p class="percentage">{{ stats.participationRate || 0 }}%</p>
            </div>
          </div>

          <div class="token-list" v-if="tokens.length > 0">
            <h3>Daftar Token (6 Digit) - Semua {{ tokens.length }} Token</h3>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Guru</th>
                    <th>Token</th>
                    <th>Status</th>
                    <th>Digunakan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(token, index) in tokens" :key="token.id">
                    <td>{{ index + 1 }}</td>
                    <td>{{ token.pengguna?.nama_lengkap || 'Tidak diketahui' }}</td>
                    <td>
                      <code class="token-code">{{ token.token }}</code>
                    </td>
                    <td>
                      <span
                        :class="{
                          'status-used': token.sudah_digunakan,
                          'status-available': !token.sudah_digunakan,
                        }"
                      >
                        {{ token.sudah_digunakan ? '✅ Digunakan' : '⏳ Tersedia' }}
                      </span>
                    </td>
                    <td>
                      {{ token.digunakan_pada ? formatDateTime(token.digunakan_pada) : '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="view-more">Menampilkan semua {{ tokens.length }} token</p>
          </div>

          <div v-else class="empty-state">
            <p v-if="activeSession?.status === 'voting' || activeSession?.status === 'selesai'">
              Token belum digenerate. Klik "Generate Token Sekarang" di atas.
            </p>
            <p v-else>
              Token akan otomatis dibuat saat sesi mencapai status <strong>VOTING</strong>
            </p>
          </div>
        </div>

        <!-- TAB 3: Monitoring -->
        <div v-else-if="activeTab === 'monitor'" class="tab-pane">
          <div class="section-header">
            <h2>📊 Live Monitoring</h2>
            <p>Pantau perkembangan voting real-time</p>
          </div>

          <div class="monitoring-grid">
            <div class="monitor-card large">
              <h3>Statistik Partisipasi</h3>
              <div class="progress-container">
                <div class="progress-info">
                  <span class="progress-label">Guru sudah voting</span>
                  <span class="progress-percentage">{{ stats.participationRate }}%</span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: stats.participationRate + '%' }"
                  ></div>
                </div>
                <p class="progress-text">{{ stats.votedCount }} dari {{ stats.totalGuru }} guru</p>
              </div>

              <div class="time-info">
                <p>
                  Status: <strong>{{ votingStatusText }}</strong>
                </p>
                <p v-if="activeSession?.status === 'voting'">⏰ Voting sedang berlangsung</p>
                <p v-if="activeSession?.status === 'selesai'">✅ Voting sudah selesai</p>
              </div>
            </div>

            <div class="monitor-card">
              <h3>Quick Actions</h3>
              <div class="quick-actions-list">
                <button @click="activeTab = 'tokens'" class="quick-action-btn">
                  🎫 Lihat Token
                </button>
                <button @click="activeTab = 'session'" class="quick-action-btn">
                  ⚙️ Kelola Sesi
                </button>
                <a href="/live-results" target="_blank" class="quick-action-btn"> 📈 Hasil Live </a>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: Calon Kandidat -->
        <div v-else-if="activeTab === 'candidates'" class="tab-pane">
          <div class="section-header">
            <h2>👥 Verifikasi Calon Kandidat</h2>
            <p>Kelola pendaftaran calon Waka</p>
          </div>

          <div class="candidates-stats">
            <div class="candidate-stat pending">
              <h4>Menunggu</h4>
              <p>{{ candidateStats.pending || 0 }}</p>
            </div>
            <div class="candidate-stat approved">
              <h4>Disetujui</h4>
              <p>{{ candidateStats.approved || 0 }}</p>
            </div>
            <div class="candidate-stat rejected">
              <h4>Ditolak</h4>
              <p>{{ candidateStats.rejected || 0 }}</p>
            </div>
          </div>

          <div class="empty-state">
            <p>Fitur verifikasi calon akan segera tersedia</p>
            <p class="hint">
              Saat ini guru bisa langsung daftar di Dashboard Calon ketika status
              <strong>PENDAFTARAN</strong> aktif
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Session Modal -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>➕ Buat Sesi Pemilihan Baru</h3>
          <button @click="showCreateModal = false" class="btn-close">×</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="createNewSession">
            <div class="form-group">
              <label>Nama Sesi *</label>
              <input
                v-model="newSessionForm.nama_sesi"
                type="text"
                placeholder="Contoh: Pemilihan Waka SMAN 2 2025/2026"
                required
              />
            </div>

            <div class="form-group">
              <label>Tahun Ajaran *</label>
              <input
                v-model="newSessionForm.tahun_ajaran"
                type="text"
                placeholder="Contoh: 2025/2026"
                required
              />
            </div>

            <div class="form-info">
              <p>📌 Sistem akan menggunakan kontrol manual:</p>
              <ul>
                <li>DRAFT → Buat sesi</li>
                <li>PENDAFTARAN → Buka pendaftaran calon</li>
                <li>VOTING → Auto generate token & mulai voting</li>
                <li>SELESAI → Tutup voting & umumkan hasil</li>
              </ul>
            </div>

            <div class="modal-actions">
              <button type="button" @click="showCreateModal = false" class="btn-cancel">
                Batal
              </button>
              <button type="submit" :disabled="creatingSession" class="btn-save">
                {{ creatingSession ? 'Membuat...' : 'Buat Sesi' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Confirm Action Modal -->
    <div v-if="showConfirmModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>⚠️ Konfirmasi Aksi</h3>
          <button @click="showConfirmModal = false" class="btn-close">×</button>
        </div>

        <div class="modal-body">
          <p>{{ confirmMessage }}</p>

          <div class="modal-actions">
            <button @click="showConfirmModal = false" class="btn-cancel">Batal</button>
            <button @click="executeAction" class="btn-save" :disabled="executingAction">
              {{ executingAction ? 'Memproses...' : 'Ya, Lanjutkan' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Toast -->
    <div v-if="toastMessage" class="toast" :class="toastType">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()

// Auth State
const loading = ref(true)
const isAuthenticated = ref(false)
const adminUser = ref(null)

// UI State
const activeTab = ref('session')
const tabs = ref([
  { id: 'session', label: 'Kelola Sesi', badge: null },
  { id: 'tokens', label: 'Token', badge: null },
  { id: 'monitor', label: 'Monitoring', badge: null },
  { id: 'candidates', label: 'Verifikasi Calon', badge: null },
])

// Data State
const stats = ref({
  totalGuru: 0,
  votedCount: 0,
  participationRate: 0,
  totalTokens: 0,
  usedTokens: 0,
  availableTokens: 0,
})
const tokens = ref([])
const activeSession = ref(null)
const candidateStats = ref({})
const generatingTokens = ref(false)

// Modal State
const showCreateModal = ref(false)
const creatingSession = ref(false)
const showConfirmModal = ref(false)
const confirmMessage = ref('')
const pendingAction = ref(null)
const executingAction = ref(false)

// Form State
const newSessionForm = ref({
  nama_sesi: '',
  tahun_ajaran: '',
})

// Toast
const toastMessage = ref('')
const toastType = ref('success')

// Auto-refresh
let refreshInterval = null
let isRefreshing = false

// Computed
const votingStatusText = computed(() => {
  if (!activeSession.value) return 'Tidak ada sesi'
  return getStatusLabel(activeSession.value.status)
})

const votingStatusClass = computed(() => {
  if (!activeSession.value) return 'status-draft'
  return `status-${activeSession.value.status}`
})

// Watch for badge updates
watch(
  [() => candidateStats.value.pending, () => stats.value.availableTokens],
  ([pending, availableTokens]) => {
    tabs.value = tabs.value.map((tab) => {
      const newTab = { ...tab }
      if (tab.id === 'candidates' && pending > 0) {
        newTab.badge = pending
      } else if (tab.id === 'tokens' && availableTokens > 0) {
        newTab.badge = availableTokens
      } else {
        newTab.badge = null
      }
      return newTab
    })
  },
)

// Methods
const checkAuth = async () => {
  console.log('🔐 Checking admin authentication...')

  const adminSession = localStorage.getItem('smanda_admin')

  if (!adminSession) {
    console.log('❌ No admin session found - Redirecting to login')
    router.push('/admin-login')
    loading.value = false
    return
  }

  try {
    const session = JSON.parse(adminSession)

    if (!session.user || session.type !== 'admin') {
      console.log('❌ Invalid admin session structure')
      localStorage.removeItem('smanda_admin')
      router.push('/admin-login')
      return
    }

    if (session.user.peran !== 'admin') {
      console.log('❌ User does not have admin role:', session.user.peran)
      localStorage.removeItem('smanda_admin')
      router.push('/admin-login')
      return
    }

    console.log('✅ Admin authenticated:', session.user.nama_lengkap)
    adminUser.value = session.user
    isAuthenticated.value = true

    // Load data setelah auth berhasil
    await loadDashboardData()
  } catch (error) {
    console.error('❌ Error parsing admin session:', error)
    localStorage.removeItem('smanda_admin')
    router.push('/admin-login')
  }
}

const loadDashboardData = async () => {
  try {
    // Load active session dulu
    await loadActiveSession()

    // Load lainnya
    await Promise.all([loadStats(), loadTokens(), loadCandidateStats()])
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    showToast('Gagal memuat data dashboard', 'error')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    // Total guru
    const { count: totalGuru, error: guruError } = await supabase
      .from('pengguna')
      .select('*', { count: 'exact' })
      .eq('peran', 'guru')

    if (guruError) throw guruError

    // Total yang sudah voting (distinct pemilih)
    let votedCount = 0
    if (activeSession.value?.id) {
      const { data: votingData, error: voteError } = await supabase
        .from('suara')
        .select('pemilih_id', { distinct: true })
        .eq('is_draft', false)
        .eq('sesi_id', activeSession.value.id)

      if (voteError) throw voteError
      votedCount = votingData?.length || 0
    }

    // Token stats
    let totalTokens = 0
    let usedTokens = 0
    let availableTokens = 0

    if (activeSession.value?.id) {
      const { data: allTokens, error: tokenError } = await supabase
        .from('token_qr')
        .select('*')
        .eq('sesi_id', activeSession.value.id)

      if (tokenError) throw tokenError

      totalTokens = allTokens?.length || 0
      usedTokens = allTokens?.filter((t) => t.sudah_digunakan).length || 0
      availableTokens = totalTokens - usedTokens
    }

    stats.value = {
      totalGuru: totalGuru || 0,
      votedCount,
      participationRate: totalGuru ? Math.round((votedCount / totalGuru) * 100) : 0,
      totalTokens,
      usedTokens,
      availableTokens,
    }
  } catch (error) {
    console.error('Error loading stats:', error)
    stats.value = {
      totalGuru: 0,
      votedCount: 0,
      participationRate: 0,
      totalTokens: 0,
      usedTokens: 0,
      availableTokens: 0,
    }
  }
}

const loadTokens = async () => {
  try {
    if (!activeSession.value?.id) {
      tokens.value = []
      return
    }

    const { data, error } = await supabase
      .from('token_qr')
      .select(
        `
        *,
        pengguna:pengguna_id (
          nama_lengkap
        )
      `,
      )
      .eq('sesi_id', activeSession.value.id)
      .order('dibuat_pada', { ascending: false })

    if (error) {
      console.error('Token query error:', error)
      // Fallback tanpa join
      const { data: simpleData } = await supabase
        .from('token_qr')
        .select('*')
        .eq('sesi_id', activeSession.value.id)
        .order('dibuat_pada', { ascending: false })

      if (simpleData) {
        tokens.value = simpleData
      }
      return
    }

    tokens.value = data || []
  } catch (error) {
    console.error('Error loading tokens:', error)
    tokens.value = []
  }
}

const loadActiveSession = async () => {
  try {
    const { data, error } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .order('dibuat_pada', { ascending: false })
      .limit(1)

    if (error) throw error

    activeSession.value = data?.[0] || null
  } catch (error) {
    console.error('Error loading session:', error)
    activeSession.value = null
  }
}

const loadCandidateStats = async () => {
  try {
    let pending = 0
    let approved = 0
    let rejected = 0

    if (activeSession.value?.id) {
      // Count pending registrations
      const { count: pendingCount } = await supabase
        .from('pendaftaran_kandidat')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'menunggu')
        .eq('sesi_id', activeSession.value.id)

      const { count: approvedCount } = await supabase
        .from('pendaftaran_kandidat')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disetujui')
        .eq('sesi_id', activeSession.value.id)

      const { count: rejectedCount } = await supabase
        .from('pendaftaran_kandidat')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ditolak')
        .eq('sesi_id', activeSession.value.id)

      pending = pendingCount || 0
      approved = approvedCount || 0
      rejected = rejectedCount || 0
    }

    candidateStats.value = {
      pending,
      approved,
      rejected,
    }
  } catch (error) {
    console.error('Error loading candidate stats:', error)
    candidateStats.value = { pending: 0, approved: 0, rejected: 0 }
  }
}

// Session Management
const createNewSession = async () => {
  if (!newSessionForm.value.nama_sesi || !newSessionForm.value.tahun_ajaran) {
    showToast('Nama sesi dan tahun ajaran harus diisi', 'error')
    return
  }

  creatingSession.value = true

  try {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { error } = await supabase.from('sesi_pemilihan').insert({
      nama_sesi: newSessionForm.value.nama_sesi,
      tahun_ajaran: newSessionForm.value.tahun_ajaran,
      waktu_mulai_pendaftaran: now,
      waktu_selesai_pendaftaran: nextWeek,
      waktu_mulai_voting: nextWeek,
      waktu_selesai_voting: new Date(nextWeek.getTime() + 24 * 60 * 60 * 1000),
      status: 'draft',
      dibuat_oleh: adminUser.value.id,
    })

    if (error) throw error

    showToast('Sesi baru berhasil dibuat!', 'success')
    showCreateModal.value = false
    await loadActiveSession()

    // Reset form
    newSessionForm.value = {
      nama_sesi: '',
      tahun_ajaran: '',
    }
  } catch (error) {
    console.error('Error creating session:', error)
    showToast('Gagal membuat sesi: ' + error.message, 'error')
  } finally {
    creatingSession.value = false
  }
}

const confirmAction = (action) => {
  const messages = {
    bukaPendaftaran: 'Buka pendaftaran? Guru bisa daftar sebagai calon kandidat.',
    bukaVoting: 'Buka voting? Token 6 digit akan otomatis dibuat untuk semua guru.',
    tutupVoting: 'Tutup voting? Voting akan dihentikan dan hasil menjadi final.',
    resetSesi: 'Reset sesi? Semua data (token, voting) akan dihapus dan status kembali ke DRAFT.',
    generateTokensNow: 'Generate token sekarang? Token 6 digit akan dibuat untuk semua guru.',
  }

  if (!messages[action]) {
    console.error('Unknown action:', action)
    return
  }

  confirmMessage.value = messages[action]
  pendingAction.value = action
  showConfirmModal.value = true
}

const executeAction = async () => {
  if (!pendingAction.value) return

  executingAction.value = true

  try {
    switch (pendingAction.value) {
      case 'bukaPendaftaran':
        await updateSessionStatus('pendaftaran')
        showToast('Pendaftaran dibuka! Guru bisa daftar sebagai calon.', 'success')
        break

      case 'bukaVoting':
        await generateTokensForAllGuru()
        await updateSessionStatus('voting')
        showToast('Voting dibuka! Token sudah dibuat.', 'success')
        break

      case 'tutupVoting':
        await updateSessionStatus('selesai')
        showToast('Voting ditutup! Hasil sudah final.', 'success')
        break

      case 'resetSesi':
        await resetSessionData()
        await updateSessionStatus('draft')
        showToast('Sesi direset! Kembali ke status DRAFT.', 'success')
        break

      case 'generateTokensNow':
        await generateTokensForAllGuru()
        showToast('Token berhasil digenerate!', 'success')
        break
    }

    // Refresh data
    await loadDashboardData()
  } catch (error) {
    console.error('Error in action:', pendingAction.value, error)
    showToast('Gagal: ' + error.message, 'error')
  } finally {
    executingAction.value = false
    showConfirmModal.value = false
    pendingAction.value = null
  }
}

const updateSessionStatus = async (status) => {
  if (!activeSession.value) return

  try {
    const { error } = await supabase
      .from('sesi_pemilihan')
      .update({
        status,
        diperbarui_pada: new Date().toISOString(),
      })
      .eq('id', activeSession.value.id)

    if (error) throw error

    // Update local state
    activeSession.value.status = status
  } catch (error) {
    console.error('Error updating session status:', error)
    throw error
  }
}

const generateTokensForAllGuru = async () => {
  if (!activeSession.value) {
    showToast('Tidak ada sesi aktif', 'error')
    return
  }

  generatingTokens.value = true

  try {
    // Get all teachers
    const { data: allGuru, error: guruError } = await supabase
      .from('pengguna')
      .select('id')
      .eq('peran', 'guru')

    if (guruError) throw guruError

    if (!allGuru || allGuru.length === 0) {
      showToast('Tidak ada data guru', 'error')
      return
    }

    // Delete old tokens for this session
    await supabase.from('token_qr').delete().eq('sesi_id', activeSession.value.id)

    // Generate unique tokens
    const tokensToInsert = []
    const existingTokens = new Set()

    for (const guru of allGuru) {
      let token
      let attempts = 0
      const maxAttempts = 50

      // Generate unique token
      while (attempts < maxAttempts) {
        token = await generate6DigitToken(existingTokens)

        // Check in database
        const { data: existing } = await supabase
          .from('token_qr')
          .select('token')
          .eq('token', token)
          .limit(1)

        if (!existing || existing.length === 0) {
          existingTokens.add(token)
          break
        }
        attempts++
      }

      // Fallback if no unique token found
      if (!token) {
        token = Math.floor(100000 + Math.random() * 900000).toString()
      }

      tokensToInsert.push({
        pengguna_id: guru.id,
        sesi_id: activeSession.value.id,
        token: token,
        tipe_token: 'voting',
        kadaluarsa_pada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        sudah_digunakan: false,
        dibuat_oleh: adminUser.value.id,
      })
    }

    const { error: insertError } = await supabase.from('token_qr').insert(tokensToInsert)

    if (insertError) throw insertError

    showToast(`Berhasil generate ${allGuru.length} token`, 'success')
  } catch (error) {
    console.error('Error generating tokens:', error)
    showToast('Gagal generate token: ' + error.message, 'error')
    throw error
  } finally {
    generatingTokens.value = false
  }
}

const generate6DigitToken = async (existingTokens = new Set()) => {
  const maxAttempts = 30

  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const token = Math.floor(100000 + Math.random() * 900000).toString()

    // Check for bad patterns
    const allSame = /^(\d)\1{5}$/.test(token) // 111111
    const isSequential = '01234567890123456789'.includes(token) // 123456
    const isReverse = '98765432109876543210987654'.includes(token) // 654321

    if (allSame || isSequential || isReverse) {
      continue
    }

    // Check if already in this batch
    if (existingTokens.has(token)) {
      continue
    }

    return token
  }

  // Fallback
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const resetSessionData = async () => {
  if (!activeSession.value) return

  try {
    // Delete all related data
    const deletePromises = [
      supabase.from('token_qr').delete().eq('sesi_id', activeSession.value.id),
      supabase.from('pendaftaran_kandidat').delete().eq('sesi_id', activeSession.value.id),
      supabase.from('suara').delete().eq('sesi_id', activeSession.value.id),
      supabase.from('kandidat').delete().eq('sesi_id', activeSession.value.id),
    ]

    await Promise.all(deletePromises)
    showToast('Data sesi berhasil direset', 'success')
  } catch (error) {
    console.error('Error resetting session data:', error)
    throw error
  }
}

// Token Management
const exportTokensCSV = () => {
  if (tokens.value.length === 0) {
    showToast('Tidak ada data token untuk diexport', 'warning')
    return
  }

  const headers = ['No', 'Nama Guru', 'Token', 'Status', 'Digunakan Pada']
  const csvData = tokens.value.map((token, index) => [
    index + 1,
    token.pengguna?.nama_lengkap || '',
    token.token,
    token.sudah_digunakan ? 'Digunakan' : 'Tersedia',
    token.digunakan_pada ? formatDateTime(token.digunakan_pada) : '-',
  ])

  const csvContent = [headers.join(','), ...csvData.map((row) => row.join(','))].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `token-voting-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  showToast(`Berhasil export ${tokens.value.length} token ke CSV`, 'success')
}

const printTokens = () => {
  if (tokens.value.length === 0) {
    showToast('Tidak ada data token untuk dicetak', 'warning')
    return
  }

  const printContent = `
    <html>
      <head>
        <title>Token Voting SMANDA</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: center; }
          th { background-color: #f0f0f0; }
          .token { font-family: monospace; font-size: 1.2em; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Token Voting SMANDA</h1>
        <h3>Sesi: ${activeSession.value?.nama_sesi || ''}</h3>
        <p>Total: ${tokens.value.length} token | Dicetak: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Guru</th>
              <th>Token (6 Digit)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tokens.value
              .map(
                (token, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${token.pengguna?.nama_lengkap || ''}</td>
                <td class="token">${token.token}</td>
                <td>${token.sudah_digunakan ? '✓ Digunakan' : '● Tersedia'}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.print()
}

const refreshData = async () => {
  loading.value = true
  await loadDashboardData()
  showToast('Data berhasil diperbarui', 'success')
}

// Helper Functions
const getStatusLabel = (status) => {
  const map = {
    draft: 'DRAFT',
    pendaftaran: 'PENDAFTARAN',
    voting: 'VOTING',
    selesai: 'SELESAI',
  }
  return map[status] || status
}

const getInitials = (name) => {
  if (!name) return 'AD'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const showToast = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type

  setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
}

const handleLogout = () => {
  localStorage.removeItem('smanda_admin')
  router.push('/admin-login')
}

// Lifecycle
onMounted(async () => {
  await checkAuth()

  // Auto refresh setiap 30 detik untuk sesi voting
  refreshInterval = setInterval(async () => {
    if (isAuthenticated.value && activeSession.value?.status === 'voting' && !isRefreshing) {
      isRefreshing = true
      try {
        await loadStats()
      } catch (error) {
        console.warn('Auto-refresh failed:', error)
      } finally {
        isRefreshing = false
      }
    }
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
/* ============================================
   ADMIN DASHBOARD STYLES
   ============================================ */

/* Base Layout */
.admin-dashboard {
  min-height: 100vh;
  background: #f8f9fa;
}

/* Loading & Unauthorized States */
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1e3a8a;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.unauthorized {
  text-align: center;
  padding: 3rem;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.unauthorized h2 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-login,
.btn-home {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-login {
  background: #1e3a8a;
  color: white;
}

.btn-home {
  background: #6b7280;
  color: white;
}

.btn-login:hover,
.btn-home:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Header */
.admin-header {
  background: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h1 {
  color: #1e3a8a;
  margin-bottom: 0.25rem;
}

.header-left p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.session-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
}

.session-badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.draft,
.status-draft {
  background: #f1f5f9;
  color: #64748b;
}

.status-badge.pendaftaran,
.status-pendaftaran {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.voting,
.status-voting {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.selesai,
.status-selesai {
  background: #d1fae5;
  color: #065f46;
  border: 2px solid #10b981;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border-radius: 8px;
}

.admin-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
}

.admin-details {
  display: flex;
  flex-direction: column;
}

.role-badge {
  background: #1e3a8a;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  align-self: flex-start;
  margin-top: 0.25rem;
}

.logout-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.logout-btn:hover {
  background: #b91c1c;
}

/* Stats Overview */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1.5rem 2rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
}

.stat-content h3 {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 0.25rem;
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
}

.stat-status {
  font-weight: 600;
  color: #1e3a8a;
}

/* Status Flow */
.status-flow {
  background: white;
  padding: 1.5rem;
  margin: 1rem 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.flow-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.flow-step {
  text-align: center;
  padding: 1rem;
  min-width: 120px;
  opacity: 0.6;
  transition: all 0.3s;
}

.flow-step.active {
  opacity: 1;
  transform: scale(1.05);
}

.flow-step.completed {
  opacity: 0.8;
}

.flow-step.completed .step-circle {
  background: #10b981;
  color: white;
}

.flow-step.active .step-circle {
  background: #1e3a8a;
  color: white;
  box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.2);
}

.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin: 0 auto 0.5rem;
  transition: all 0.3s;
}

.step-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  margin-bottom: 0.25rem;
}

.step-description {
  font-size: 0.8rem;
  color: #6b7280;
}

.flow-arrow {
  color: #9ca3af;
  font-size: 1.5rem;
}

/* Tabs */
.tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 2rem;
  overflow-x: auto;
}

.tab-btn {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 600;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #1e3a8a;
}

.tab-btn.active {
  color: #1e3a8a;
  border-bottom-color: #1e3a8a;
}

.tab-badge {
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

/* Tab Content */
.tab-content {
  padding: 2rem;
}

.tab-pane {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Section Header */
.section-header {
  margin-bottom: 2rem;
}

.section-header h2 {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
}

.section-header p {
  color: #666;
}

/* Session Management */
.session-management {
  max-width: 800px;
  margin: 0 auto;
}

.session-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.session-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.session-header h3 {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
}

.session-meta {
  display: flex;
  gap: 1rem;
  color: #6b7280;
  font-size: 0.9rem;
}

.session-year {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
}

.session-status-display {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.current-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-label {
  font-weight: 600;
  color: #374151;
}

.status-badge-large {
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
}

.status-badge-large.draft {
  background: #f1f5f9;
  color: #64748b;
}

.status-badge-large.pendaftaran {
  background: #fef3c7;
  color: #92400e;
}

.status-badge-large.voting {
  background: #d1fae5;
  color: #065f46;
}

.status-badge-large.selesai {
  background: #d1fae5;
  color: #065f46;
  border: 2px solid #10b981;
}

/* Action Buttons */
.action-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.action-btn {
  padding: 1.5rem;
  border: none;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.action-btn.btn-primary {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
}

.action-btn.btn-success {
  background: linear-gradient(135deg, #059669, #10b981);
}

.action-btn.btn-warning {
  background: linear-gradient(135deg, #d97706, #f59e0b);
}

.action-btn.btn-danger {
  background: linear-gradient(135deg, #dc2626, #ef4444);
}

.action-btn.btn-secondary {
  background: linear-gradient(135deg, #4b5563, #6b7280);
}

.action-btn.btn-info {
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
}

.action-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.action-text {
  font-size: 1.1rem;
  font-weight: 700;
}

.action-desc {
  font-size: 0.9rem;
  opacity: 0.9;
  line-height: 1.4;
}

/* Quick Info */
.quick-info {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.info-card {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1.5rem;
}

.info-card h5 {
  color: #0369a1;
  margin-bottom: 1rem;
}

.info-card ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #1e40af;
}

.info-card li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

/* Token Management */
.token-controls {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-info {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 6px;
}

.token-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-refresh {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-primary {
  background: #1e3a8a;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1e40af;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
  transform: translateY(-2px);
}

.btn-refresh {
  background: #10b981;
  color: white;
}

.btn-refresh:hover {
  background: #0da271;
  transform: translateY(-2px);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none !important;
}

/* Token Stats */
.token-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.token-stat {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.token-stat h4 {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.token-stat p {
  font-size: 1.5rem;
  font-weight: 700;
}

.token-stat .used {
  color: #10b981;
}

.token-stat .available {
  color: #3b82f6;
}

.token-stat .percentage {
  color: #1e3a8a;
}

/* Token List */
.token-list h3 {
  margin-bottom: 1rem;
  color: #374151;
}

.table-container {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8fafc;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e2e8f0;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

tr:hover {
  background: #f8fafc;
}

.token-code {
  font-family: 'Courier New', monospace;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.status-used {
  color: #10b981;
  font-weight: 600;
}

.status-available {
  color: #3b82f6;
  font-weight: 600;
}

.view-more {
  text-align: center;
  color: #64748b;
  margin-top: 1rem;
  font-size: 0.9rem;
}

/* Monitoring */
.monitoring-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.monitor-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.monitor-card.large {
  grid-column: 1;
}

.progress-container {
  margin-bottom: 1.5rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.progress-label {
  color: #64748b;
}

.progress-percentage {
  color: #1e3a8a;
  font-weight: 600;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1e3a8a, #3b82f6);
  transition: width 0.3s ease;
}

.progress-text {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.time-info {
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.quick-actions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.quick-action-btn {
  padding: 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  text-align: left;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
}

.quick-action-btn:hover {
  border-color: #1e3a8a;
  background: #f0f7ff;
}

/* Candidates */
.candidates-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.candidate-stat {
  flex: 1;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.candidate-stat.pending {
  border-top: 4px solid #f59e0b;
}

.candidate-stat.approved {
  border-top: 4px solid #10b981;
}

.candidate-stat.rejected {
  border-top: 4px solid #ef4444;
}

.candidate-stat h4 {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.candidate-stat p {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e3a8a;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

.hint {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1e3a8a;
  font-size: 1.25rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: #1e3a8a;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.form-info {
  background: #f0f9ff;
  padding: 1rem;
  border-radius: 6px;
  margin: 1.5rem 0;
  color: #0369a1;
}

.form-info ul {
  margin: 0.5rem 0 0 1.5rem;
}

.form-info li {
  margin-bottom: 0.25rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  background: #6b7280;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background: #4b5563;
}

.btn-save {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-save:hover:not(:disabled) {
  background: #1e40af;
}

.btn-save:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.toast.success {
  background: #10b981;
}

.toast.error {
  background: #ef4444;
}

.toast.warning {
  background: #f59e0b;
}

.toast.info {
  background: #3b82f6;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    align-items: stretch;
    padding: 1rem;
  }

  .header-right {
    flex-direction: column;
    gap: 1rem;
  }

  .logout-btn {
    width: 100%;
    text-align: center;
  }

  .stats-overview {
    grid-template-columns: 1fr 1fr;
    padding: 1rem;
  }

  .status-flow {
    margin: 1rem;
    padding: 1rem;
  }

  .flow-container {
    flex-direction: column;
    gap: 0.5rem;
  }

  .flow-arrow {
    transform: rotate(90deg);
  }

  .flow-step {
    min-width: 100%;
  }

  .tabs {
    padding: 0 1rem;
  }

  .tab-btn {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }

  .tab-content {
    padding: 1rem;
  }

  .action-buttons-grid {
    grid-template-columns: 1fr;
  }

  .session-card {
    padding: 1.5rem;
    margin: 0 1rem;
  }

  .token-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary,
  .btn-refresh {
    width: 100%;
    justify-content: center;
  }

  .monitoring-grid {
    grid-template-columns: 1fr;
  }

  .candidates-stats {
    flex-direction: column;
  }

  .modal {
    margin: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-save {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }

  .token-stats {
    grid-template-columns: 1fr 1fr;
  }

  .section-header h2 {
    font-size: 1.25rem;
  }
}

/* Custom Scrollbar */
.modal::-webkit-scrollbar,
.table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.modal::-webkit-scrollbar-track,
.table-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.modal::-webkit-scrollbar-thumb,
.table-container::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 4px;
}

.modal::-webkit-scrollbar-thumb:hover,
.table-container::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>
