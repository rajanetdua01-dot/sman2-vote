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
            <span class="session-badge">Sesi Aktif: {{ activeSession.nama_sesi }}</span>
            <span class="status-badge" :class="activeSession.status">{{
              activeSession.status
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
            <h3>Status Voting</h3>
            <p class="stat-status" :class="votingStatusClass">{{ votingStatusText }}</p>
            <p class="stat-time" v-if="timeRemaining">{{ timeRemaining }}</p>
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
        <!-- TAB 1: Kelola Token -->
        <div v-if="activeTab === 'tokens'" class="tab-pane">
          <div class="section-header">
            <h2>🎫 Kelola Token QR</h2>
            <p>Generate dan kelola token untuk pemilih</p>
          </div>

          <div class="token-actions">
            <button @click="confirmGenerateTokens" :disabled="generatingTokens" class="btn-primary">
              {{ generatingTokens ? 'Membuat Token...' : '🎫 Generate Semua Token' }}
            </button>
            <button @click="exportTokensCSV" :disabled="!stats.totalTokens" class="btn-secondary">
              📁 Export ke CSV
            </button>
            <button @click="refreshData" class="btn-refresh">🔄 Refresh Data</button>
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
              <h4>Expired</h4>
              <p class="expired">{{ stats.expiredTokens || 0 }}</p>
            </div>
          </div>

          <div class="token-list" v-if="tokens.length > 0">
            <h3>Daftar Token Terbaru</h3>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nama Guru</th>
                    <th>Token</th>
                    <th>Status</th>
                    <th>Expired</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="token in tokens.slice(0, 10)" :key="token.id">
                    <td>{{ token.pengguna?.nama_lengkap || 'Tidak diketahui' }}</td>
                    <td>
                      <code class="token-code">{{ token.token }}</code>
                    </td>
                    <td>
                      <span
                        :class="{
                          'status-used': token.sudah_digunakan,
                          'status-available':
                            !token.sudah_digunakan && new Date(token.kadaluarsa_pada) > new Date(),
                          'status-expired':
                            !token.sudah_digunakan && new Date(token.kadaluarsa_pada) <= new Date(),
                        }"
                      >
                        {{ getTokenStatus(token) }}
                      </span>
                    </td>
                    <td>{{ formatDate(token.kadaluarsa_pada) }}</td>
                    <td>
                      <button
                        @click="copyToken(token.token)"
                        class="btn-small"
                        :disabled="token.sudah_digunakan"
                      >
                        📋 Copy
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="view-more" v-if="tokens.length > 10">
              ...dan {{ tokens.length - 10 }} token lainnya
            </p>
          </div>

          <div v-else class="empty-state">
            <p>Belum ada token yang digenerate</p>
            <p class="hint">Klik "Generate Semua Token" untuk membuat token untuk semua guru</p>
          </div>
        </div>

        <!-- TAB 2: Monitoring -->
        <div v-else-if="activeTab === 'monitor'" class="tab-pane">
          <div class="section-header">
            <h2>📊 Live Monitoring</h2>
            <p>Pantau perkembangan voting real-time</p>
          </div>

          <div class="monitoring-grid">
            <div class="monitor-card large">
              <h3>Statistik Voting</h3>
              <div class="progress-container">
                <div class="progress-info">
                  <span class="progress-label">Partisipasi</span>
                  <span class="progress-percentage">{{ stats.participationRate }}%</span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: stats.participationRate + '%' }"
                  ></div>
                </div>
                <p class="progress-text">
                  {{ stats.votedCount }} dari {{ stats.totalGuru }} guru sudah voting
                </p>
              </div>

              <div class="time-info" v-if="activeSession">
                <h4>Waktu Voting:</h4>
                <p>
                  {{ formatDateTime(activeSession.waktu_mulai_voting) }} -
                  {{ formatDateTime(activeSession.waktu_selesai_voting) }}
                </p>
                <p class="time-remaining" v-if="timeRemaining">⏰ {{ timeRemaining }}</p>
              </div>
            </div>

            <div class="monitor-card">
              <h3>Hasil Sementara</h3>
              <div v-if="results.length > 0" class="results-preview">
                <div
                  v-for="result in results.slice(0, 4)"
                  :key="result.jabatan"
                  class="result-item"
                >
                  <h4>{{ getPositionName(result.jabatan) }}</h4>
                  <div v-if="result.topCandidate">
                    <p>
                      <strong>{{ result.topCandidate.nama }}</strong>
                    </p>
                    <p>{{ result.topCandidate.votes }} suara</p>
                  </div>
                  <div v-else>
                    <p>Belum ada data</p>
                  </div>
                </div>
              </div>
              <div v-else class="no-results">
                <p>Belum ada hasil voting</p>
              </div>
              <router-link to="/live-results" class="btn-view-results">
                Lihat Hasil Lengkap →
              </router-link>
            </div>
          </div>
        </div>

        <!-- TAB 3: Kelola Sesi -->
        <div v-else-if="activeTab === 'session'" class="tab-pane">
          <div class="section-header">
            <h2>⚙️ Kelola Sesi Pemilihan</h2>
            <p>Atur waktu dan status pemilihan</p>
          </div>

          <div v-if="!activeSession" class="empty-state">
            <p>Belum ada sesi pemilihan</p>
            <button @click="showCreateModal = true" class="btn-primary">+ Buat Sesi Baru</button>
          </div>

          <div v-else class="session-management">
            <!-- Session Card -->
            <div class="session-card">
              <div class="session-header">
                <h3>{{ activeSession.nama_sesi }}</h3>
                <span class="session-badge" :class="activeSession.status">
                  {{ activeSession.status.toUpperCase() }}
                </span>
              </div>

              <div class="session-details">
                <div class="detail-row">
                  <label>Tahun Ajaran:</label>
                  <span>{{ activeSession.tahun_ajaran }}</span>
                </div>
                <div class="detail-row">
                  <label>Pendaftaran:</label>
                  <span>
                    {{ formatDateTime(activeSession.waktu_mulai_pendaftaran) }} -
                    {{ formatDateTime(activeSession.waktu_selesai_pendaftaran) }}
                  </span>
                </div>
                <div class="detail-row">
                  <label>Voting:</label>
                  <span>
                    {{ formatDateTime(activeSession.waktu_mulai_voting) }} -
                    {{ formatDateTime(activeSession.waktu_selesai_voting) }}
                  </span>
                </div>
                <div class="detail-row">
                  <label>Dibuat:</label>
                  <span>{{ formatDate(activeSession.dibuat_pada) }}</span>
                </div>
                <div class="detail-row">
                  <label>Status:</label>
                  <span :class="'status-' + activeSession.status">
                    {{ getStatusLabel(activeSession.status) }}
                  </span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="session-actions">
                <div class="status-controls">
                  <h4>Ubah Status:</h4>
                  <div class="status-buttons">
                    <button
                      @click="confirmChangeStatus('draft')"
                      :class="{ active: activeSession.status === 'draft' }"
                      class="status-btn"
                    >
                      Draft
                    </button>
                    <button
                      @click="confirmChangeStatus('pendaftaran')"
                      :class="{ active: activeSession.status === 'pendaftaran' }"
                      class="status-btn"
                    >
                      Buka Pendaftaran
                    </button>
                    <button
                      @click="confirmChangeStatus('voting')"
                      :class="{ active: activeSession.status === 'voting' }"
                      class="status-btn"
                    >
                      Buka Voting
                    </button>
                    <button
                      @click="confirmChangeStatus('selesai')"
                      :class="{ active: activeSession.status === 'selesai' }"
                      class="status-btn"
                    >
                      Selesaikan
                    </button>
                  </div>
                </div>

                <!-- Edit Button (hanya di draft) -->
                <div class="edit-controls" v-if="activeSession.status === 'draft'">
                  <button @click="openEditModal" class="btn-edit">✏️ Edit Sesi</button>
                  <button @click="confirmDeleteSession" class="btn-delete">🗑️ Hapus Sesi</button>
                </div>
              </div>
            </div>

            <!-- Session Rules -->
            <div class="session-rules">
              <h4>📋 Aturan Status:</h4>
              <ul>
                <li><strong>DRAFT:</strong> Bisa edit semua data. Guru belum bisa akses.</li>
                <li><strong>PENDAFTARAN:</strong> Guru bisa daftar sebagai calon.</li>
                <li><strong>VOTING:</strong> Generate token & mulai pemilihan.</li>
                <li><strong>SELESAI:</strong> Tutup voting & umumkan hasil.</li>
              </ul>
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
            <p>Belum ada data calon kandidat</p>
            <p class="hint">
              Data akan muncul ketika guru mendaftar sebagai calon melalui Dashboard Calon
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

            <div class="form-row">
              <div class="form-group">
                <label>Mulai Pendaftaran *</label>
                <input
                  v-model="newSessionForm.waktu_mulai_pendaftaran"
                  type="datetime-local"
                  required
                />
              </div>
              <div class="form-group">
                <label>Selesai Pendaftaran *</label>
                <input
                  v-model="newSessionForm.waktu_selesai_pendaftaran"
                  type="datetime-local"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Mulai Voting *</label>
                <input v-model="newSessionForm.waktu_mulai_voting" type="datetime-local" required />
              </div>
              <div class="form-group">
                <label>Selesai Voting *</label>
                <input
                  v-model="newSessionForm.waktu_selesai_voting"
                  type="datetime-local"
                  required
                />
              </div>
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

    <!-- Edit Session Modal -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>✏️ Edit Sesi Pemilihan</h3>
          <button @click="showEditModal = false" class="btn-close">×</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="saveSessionEdit">
            <div class="form-group">
              <label>Nama Sesi *</label>
              <input v-model="editForm.nama_sesi" type="text" required />
            </div>

            <div class="form-group">
              <label>Tahun Ajaran *</label>
              <input
                v-model="editForm.tahun_ajaran"
                type="text"
                placeholder="Contoh: 2025/2026"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Mulai Pendaftaran *</label>
                <input v-model="editForm.waktu_mulai_pendaftaran" type="datetime-local" required />
              </div>
              <div class="form-group">
                <label>Selesai Pendaftaran *</label>
                <input
                  v-model="editForm.waktu_selesai_pendaftaran"
                  type="datetime-local"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Mulai Voting *</label>
                <input v-model="editForm.waktu_mulai_voting" type="datetime-local" required />
              </div>
              <div class="form-group">
                <label>Selesai Voting *</label>
                <input v-model="editForm.waktu_selesai_voting" type="datetime-local" required />
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" @click="showEditModal = false" class="btn-cancel">Batal</button>
              <button type="submit" :disabled="savingEdit" class="btn-save">
                {{ savingEdit ? 'Menyimpan...' : 'Simpan Perubahan' }}
              </button>
            </div>
          </form>
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()

// Auth State
const loading = ref(true)
const isAuthenticated = ref(false)
const adminUser = ref(null)

// UI State
const activeTab = ref('tokens')
const tabs = ref([
  { id: 'tokens', label: 'Kelola Token', badge: null },
  { id: 'monitor', label: 'Live Monitor', badge: null },
  { id: 'session', label: 'Kelola Sesi', badge: null },
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
  expiredTokens: 0,
})
const tokens = ref([])
const activeSession = ref(null)
const results = ref([])
const candidateStats = ref({})
const generatingTokens = ref(false)

// Modal State
const showCreateModal = ref(false)
const showEditModal = ref(false)
const creatingSession = ref(false)
const savingEdit = ref(false)

// Form State
const newSessionForm = ref({
  nama_sesi: '',
  tahun_ajaran: '',
  waktu_mulai_pendaftaran: '',
  waktu_selesai_pendaftaran: '',
  waktu_mulai_voting: '',
  waktu_selesai_voting: '',
})

const editForm = ref({
  nama_sesi: '',
  tahun_ajaran: '',
  waktu_mulai_pendaftaran: '',
  waktu_selesai_pendaftaran: '',
  waktu_mulai_voting: '',
  waktu_selesai_voting: '',
})

// Toast
const toastMessage = ref('')
const toastType = ref('success')

// Computed
const votingStatusText = computed(() => {
  if (!activeSession.value) return 'Tidak ada sesi'
  const now = new Date()
  const start = new Date(activeSession.value.waktu_mulai_voting)
  const end = new Date(activeSession.value.waktu_selesai_voting)

  if (now < start) return 'Belum dimulai'
  if (now > end) return 'Selesai'
  return 'Berlangsung'
})

const votingStatusClass = computed(() => {
  if (!activeSession.value) return 'status-draft'
  return `status-${activeSession.value.status}`
})

const timeRemaining = computed(() => {
  if (!activeSession.value || activeSession.value.status !== 'voting') return ''

  const end = new Date(activeSession.value.waktu_selesai_voting)
  const now = new Date()
  const diff = end - now

  if (diff <= 0) return 'Waktu habis'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours} jam ${minutes} menit lagi`
})

// Methods
const checkAuth = () => {
  console.log('🔐 Checking admin authentication...')

  const adminSession = localStorage.getItem('smanda_admin')

  if (!adminSession) {
    console.log('❌ No admin session found')
    isAuthenticated.value = false
    loading.value = false
    return
  }

  try {
    const session = JSON.parse(adminSession)

    if (!session.user || session.type !== 'admin') {
      console.log('❌ Invalid admin session structure')
      localStorage.removeItem('smanda_admin')
      isAuthenticated.value = false
      loading.value = false
      return
    }

    if (session.user.peran !== 'admin') {
      console.log('❌ User does not have admin role:', session.user.peran)
      isAuthenticated.value = false
      loading.value = false
      return
    }

    console.log('✅ Admin authenticated:', session.user.nama_lengkap)
    adminUser.value = session.user
    isAuthenticated.value = true

    // Load data setelah auth berhasil
    loadDashboardData()
  } catch (error) {
    console.error('❌ Error parsing admin session:', error)
    localStorage.removeItem('smanda_admin')
    isAuthenticated.value = false
    loading.value = false
  }
}

const loadDashboardData = async () => {
  try {
    // Load semua data secara parallel
    await Promise.all([
      loadStats(),
      loadTokens(),
      loadActiveSession(),
      loadResults(),
      loadCandidateStats(),
    ])
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
      .select('*', { count: 'exact', head: true })
      .eq('peran', 'guru')

    if (guruError) throw guruError

    // Total yang sudah voting (hitung dari token digunakan)
    const { count: votedCount, error: voteError } = await supabase
      .from('token_qr')
      .select('*', { count: 'exact', head: true })
      .eq('sudah_digunakan', true)

    if (voteError) throw voteError

    // Token stats
    const { data: allTokens, error: tokenError } = await supabase.from('token_qr').select('*')

    if (tokenError) throw tokenError

    const totalTokens = allTokens?.length || 0
    const usedTokens = allTokens?.filter((t) => t.sudah_digunakan).length || 0
    const availableTokens =
      allTokens?.filter((t) => !t.sudah_digunakan && new Date(t.kadaluarsa_pada) > new Date())
        .length || 0
    const expiredTokens =
      allTokens?.filter((t) => !t.sudah_digunakan && new Date(t.kadaluarsa_pada) <= new Date())
        .length || 0

    stats.value = {
      totalGuru: totalGuru || 0,
      votedCount: votedCount || 0,
      participationRate: totalGuru ? Math.round((votedCount / totalGuru) * 100) : 0,
      totalTokens,
      usedTokens,
      availableTokens,
      expiredTokens,
    }
  } catch (error) {
    console.error('Error loading stats:', error)
    showToast('Gagal memuat statistik', 'error')
  }
}

const loadTokens = async () => {
  try {
    console.log('📋 Loading tokens...')

    // Query dengan foreign key yang benar
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
      .order('dibuat_pada', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ Token query error (trying fallback):', error)

      // FALLBACK: Ambil data tanpa join dulu
      const { data: simpleData, error: simpleError } = await supabase
        .from('token_qr')
        .select('*')
        .order('dibuat_pada', { ascending: false })
        .limit(50)

      if (simpleError) throw simpleError

      if (!simpleData || simpleData.length === 0) {
        tokens.value = []
        return
      }

      // Ambil nama guru secara terpisah
      const userIds = [...new Set(simpleData.map((t) => t.pengguna_id).filter(Boolean))]
      let usersMap = {}

      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('pengguna')
          .select('id, nama_lengkap')
          .in('id', userIds)

        if (usersData) {
          usersData.forEach((user) => {
            usersMap[user.id] = user.nama_lengkap
          })
        }
      }

      // Gabungkan data
      tokens.value = simpleData.map((token) => ({
        ...token,
        pengguna: {
          nama_lengkap: usersMap[token.pengguna_id] || 'Tidak diketahui',
        },
      }))

      return
    }

    console.log('✅ Tokens loaded:', data?.length || 0)
    tokens.value = data || []
  } catch (error) {
    console.error('🚨 Error in loadTokens:', error)
    showToast('Gagal memuat data token', 'error')
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

    // Set edit form data jika ada session
    if (activeSession.value) {
      editForm.value = {
        nama_sesi: activeSession.value.nama_sesi || '',
        tahun_ajaran: activeSession.value.tahun_ajaran || '',
        waktu_mulai_pendaftaran: formatDateTimeForInput(
          activeSession.value.waktu_mulai_pendaftaran,
        ),
        waktu_selesai_pendaftaran: formatDateTimeForInput(
          activeSession.value.waktu_selesai_pendaftaran,
        ),
        waktu_mulai_voting: formatDateTimeForInput(activeSession.value.waktu_mulai_voting),
        waktu_selesai_voting: formatDateTimeForInput(activeSession.value.waktu_selesai_voting),
      }
    }
  } catch (error) {
    console.error('Error loading session:', error)
    activeSession.value = null
  }
}

const loadResults = async () => {
  // Placeholder untuk hasil voting
  results.value = []
}

const loadCandidateStats = async () => {
  // Placeholder untuk statistik calon
  candidateStats.value = {
    pending: 0,
    approved: 0,
    rejected: 0,
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
    const { error } = await supabase.from('sesi_pemilihan').insert({
      nama_sesi: newSessionForm.value.nama_sesi,
      tahun_ajaran: newSessionForm.value.tahun_ajaran,
      waktu_mulai_pendaftaran: newSessionForm.value.waktu_mulai_pendaftaran,
      waktu_selesai_pendaftaran: newSessionForm.value.waktu_selesai_pendaftaran,
      waktu_mulai_voting: newSessionForm.value.waktu_mulai_voting,
      waktu_selesai_voting: newSessionForm.value.waktu_selesai_voting,
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
      waktu_mulai_pendaftaran: '',
      waktu_selesai_pendaftaran: '',
      waktu_mulai_voting: '',
      waktu_selesai_voting: '',
    }
  } catch (error) {
    console.error('Error creating session:', error)
    showToast('Gagal membuat sesi: ' + error.message, 'error')
  } finally {
    creatingSession.value = false
  }
}

const openEditModal = () => {
  if (!activeSession.value) return

  // Set edit form dengan data current session
  editForm.value = {
    nama_sesi: activeSession.value.nama_sesi || '',
    tahun_ajaran: activeSession.value.tahun_ajaran || '',
    waktu_mulai_pendaftaran: formatDateTimeForInput(activeSession.value.waktu_mulai_pendaftaran),
    waktu_selesai_pendaftaran: formatDateTimeForInput(
      activeSession.value.waktu_selesai_pendaftaran,
    ),
    waktu_mulai_voting: formatDateTimeForInput(activeSession.value.waktu_mulai_voting),
    waktu_selesai_voting: formatDateTimeForInput(activeSession.value.waktu_selesai_voting),
  }

  showEditModal.value = true
}

const saveSessionEdit = async () => {
  if (!activeSession.value) return

  savingEdit.value = true

  try {
    const { error } = await supabase
      .from('sesi_pemilihan')
      .update({
        nama_sesi: editForm.value.nama_sesi,
        tahun_ajaran: editForm.value.tahun_ajaran,
        waktu_mulai_pendaftaran: editForm.value.waktu_mulai_pendaftaran,
        waktu_selesai_pendaftaran: editForm.value.waktu_selesai_pendaftaran,
        waktu_mulai_voting: editForm.value.waktu_mulai_voting,
        waktu_selesai_voting: editForm.value.waktu_selesai_voting,
        diperbarui_pada: new Date().toISOString(),
      })
      .eq('id', activeSession.value.id)

    if (error) throw error

    showToast('Perubahan berhasil disimpan!', 'success')
    showEditModal.value = false
    await loadActiveSession()
  } catch (error) {
    console.error('Error updating session:', error)
    showToast('Gagal menyimpan perubahan: ' + error.message, 'error')
  } finally {
    savingEdit.value = false
  }
}

const confirmDeleteSession = async () => {
  if (!activeSession.value) return

  if (!confirm('Yakin menghapus sesi ini? Semua data terkait (token, voting) juga akan dihapus.')) {
    return
  }

  try {
    // Hapus semua data terkait dulu
    await supabase.from('token_qr').delete().eq('sesi_id', activeSession.value.id)
    await supabase.from('kandidat').delete().eq('sesi_id', activeSession.value.id)
    await supabase.from('pendaftaran_kandidat').delete().eq('sesi_id', activeSession.value.id)

    // Hapus sesi
    const { error } = await supabase
      .from('sesi_pemilihan')
      .delete()
      .eq('id', activeSession.value.id)

    if (error) throw error

    showToast('Sesi berhasil dihapus!', 'success')
    activeSession.value = null
  } catch (error) {
    console.error('Error deleting session:', error)
    showToast('Gagal menghapus sesi: ' + error.message, 'error')
  }
}

const confirmChangeStatus = (status) => {
  if (activeSession.value.status !== status) {
    const messages = {
      draft: 'Yakin ubah ke DRAFT? Semua data voting akan direset.',
      pendaftaran: 'Yakin buka pendaftaran?',
      voting: 'Yakin buka voting? Pastikan token sudah digenerate.',
      selesai: 'Yakin selesaikan sesi? Voting akan ditutup permanen.',
    }

    if (confirm(messages[status])) {
      updateSessionStatus(status)
    }
  } else {
    updateSessionStatus(status) // Status sama, langsung update
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

    showToast(`Status sesi berhasil diubah ke "${getStatusLabel(status)}"`, 'success')
    await loadActiveSession()
  } catch (error) {
    console.error('Error updating session status:', error)
    showToast('Gagal mengubah status sesi', 'error')
  }
}

// Token Management
const confirmGenerateTokens = async () => {
  if (
    !confirm('Generate QR tokens untuk semua guru?\n\nPastikan sudah ada sesi pemilihan aktif.')
  ) {
    return
  }

  generatingTokens.value = true

  try {
    // 1. Dapatkan sesi aktif atau buat baru
    let session = activeSession.value
    if (!session) {
      showToast('Buat sesi pemilihan terlebih dahulu', 'error')
      activeTab.value = 'session'
      return
    }

    // 2. Dapatkan semua guru
    const { data: allGuru, error: guruError } = await supabase
      .from('pengguna')
      .select('id')
      .eq('peran', 'guru')

    if (guruError) throw guruError

    if (!allGuru || allGuru.length === 0) {
      showToast('Tidak ada data guru', 'error')
      return
    }

    // 3. Hapus token lama untuk sesi ini
    await supabase.from('token_qr').delete().eq('sesi_id', session.id)

    // 4. Buat token baru untuk setiap guru
    const tokensToInsert = allGuru.map((guru) => ({
      pengguna_id: guru.id,
      sesi_id: session.id,
      token: generateUniqueToken(guru.id),
      tipe_token: 'voting',
      kadaluarsa_pada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 hari
      sudah_digunakan: false,
      dibuat_oleh: adminUser.value.id,
    }))

    const { error: insertError } = await supabase.from('token_qr').insert(tokensToInsert)

    if (insertError) throw insertError

    showToast(`Berhasil generate ${allGuru.length} token QR`, 'success')

    // 5. Refresh data
    await loadTokens()
    await loadStats()
  } catch (error) {
    console.error('Error generating tokens:', error)
    showToast('Gagal generate token: ' + error.message, 'error')
  } finally {
    generatingTokens.value = false
  }
}

const generateUniqueToken = (userId) => {
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase()
  const timestamp = Date.now().toString(36).substring(4, 8)
  return `VOTE-${randomPart}-${timestamp}-${userId.toString().slice(-4)}`
}

const exportTokensCSV = () => {
  if (tokens.value.length === 0) {
    showToast('Tidak ada data token untuk diexport', 'warning')
    return
  }

  const headers = ['Nama Guru', 'Token', 'Status', 'Expired', 'Digunakan Pada']
  const csvData = tokens.value.map((token) => [
    token.pengguna?.nama_lengkap || '',
    token.token,
    getTokenStatus(token),
    formatDate(token.kadaluarsa_pada),
    token.digunakan_pada ? formatDateTime(token.digunakan_pada) : '-',
  ])

  const csvContent = [headers.join(','), ...csvData.map((row) => row.join(','))].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `token-qr-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  showToast(`Berhasil export ${tokens.value.length} token ke CSV`, 'success')
}

const copyToken = async (token) => {
  try {
    await navigator.clipboard.writeText(token)
    showToast('Token berhasil disalin!', 'success')
  } catch (error) {
    console.error('Error copying token:', error)
    showToast('Gagal menyalin token', 'error')
  }
}

const refreshData = async () => {
  loading.value = true
  await loadDashboardData()
  showToast('Data berhasil diperbarui', 'success')
}

// Helper Functions
const getTokenStatus = (token) => {
  if (token.sudah_digunakan) return 'Digunakan'
  if (new Date(token.kadaluarsa_pada) <= new Date()) return 'Expired'
  return 'Tersedia'
}

const getPositionName = (jabatan) => {
  const map = {
    humas: 'Waka Humas',
    sarpras: 'Waka Sarpras',
    kesiswaan: 'Waka Kesiswaan',
    kurikulum: 'Waka Kurikulum',
  }
  return map[jabatan] || jabatan
}

const getStatusLabel = (status) => {
  const map = {
    draft: 'Draft',
    pendaftaran: 'Pendaftaran',
    voting: 'Voting',
    selesai: 'Selesai',
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

const formatDateTimeForInput = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
}

const showToast = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type

  setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
}

const handleLogout = () => {
  if (confirm('Yakin ingin logout?')) {
    localStorage.removeItem('smanda_admin')
    router.push('/admin-login')
  }
}

// Lifecycle
onMounted(() => {
  checkAuth()

  // Auto refresh setiap 30 detik
  const refreshInterval = setInterval(() => {
    if (isAuthenticated.value) {
      loadStats()
    }
  }, 30000)

  onUnmounted(() => {
    clearInterval(refreshInterval)
  })
})
</script>

<style scoped>
/* Tambahkan CSS ini di bawah style yang sudah ada */
.admin-dashboard {
  min-height: 100vh;
  background: #f8f9fa;
}

/* Header Improvements */
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

.status-draft {
  background: #f1f5f9;
  color: #64748b;
}

.status-pendaftaran {
  background: #fef3c7;
  color: #92400e;
}

.status-voting {
  background: #d1fae5;
  color: #065f46;
}

.status-selesai {
  background: #fecaca;
  color: #991b1b;
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

.stat-time {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 0.25rem;
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

/* Token Actions */
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
}

.btn-primary {
  background: #1e3a8a;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1e40af;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-refresh {
  background: #10b981;
  color: white;
}

.btn-refresh:hover {
  background: #0da271;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
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

.token-stat .expired {
  color: #ef4444;
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

.status-expired {
  color: #ef4444;
  font-weight: 600;
}

.btn-small {
  background: #6b7280;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-small:hover:not(:disabled) {
  background: #4b5563;
}

.btn-small:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.view-more {
  text-align: center;
  color: #64748b;
  margin-top: 1rem;
  font-size: 0.9rem;
}

/* Monitoring Grid */
.monitoring-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .monitoring-grid {
    grid-template-columns: 1fr;
  }
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

.time-info h4 {
  color: #374151;
  margin-bottom: 0.5rem;
}

.time-remaining {
  color: #dc2626;
  font-weight: 600;
  margin-top: 0.5rem;
}

.results-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.result-item {
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
}

.result-item h4 {
  color: #1e3a8a;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.btn-view-results {
  display: inline-block;
  margin-top: 1rem;
  color: #1e3a8a;
  text-decoration: none;
  font-weight: 600;
}

.btn-view-results:hover {
  text-decoration: underline;
}

/* Session Card */
.session-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 600px;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.session-header h3 {
  color: #1e3a8a;
}

.detail-row {
  display: flex;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  width: 120px;
  font-weight: 600;
  color: #374151;
}

.detail-row span {
  flex: 1;
  color: #64748b;
}

.session-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.status-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  color: #64748b;
}

.status-btn:hover {
  border-color: #94a3b8;
}

.status-btn.active {
  border-color: #1e3a8a;
  background: #1e3a8a;
  color: white;
}

/* Candidates Stats */
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

/* Loading & Unauthorized */
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

/* Responsive */
@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .stats-overview {
    grid-template-columns: 1fr 1fr;
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
}

/* Tambah di bagian style AdminDashboard.vue */

/* Form elements di modal */
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

.form-group input[type='text'],
.form-group input[type='datetime-local'],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
  background: white;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #1e3a8a;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
}

/* Form row untuk 2 kolom */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

/* Modal styles */
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
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
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

/* Session status buttons & controls */
.session-management {
  max-width: 800px;
  margin: 0 auto;
}

.session-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.session-header h3 {
  color: #1f2937;
  font-size: 1.25rem;
  margin: 0;
}

.session-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.session-badge.draft {
  background: #f3f4f6;
  color: #6b7280;
}

.session-badge.pendaftaran {
  background: #fef3c7;
  color: #92400e;
}

.session-badge.voting {
  background: #d1fae5;
  color: #065f46;
}

.session-badge.selesai {
  background: #fee2e2;
  color: #991b1b;
}

.session-details {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  min-width: 140px;
  font-weight: 600;
  color: #4b5563;
  font-size: 0.9rem;
}

.detail-row span {
  color: #1f2937;
  flex: 1;
}

.detail-row .status-draft {
  color: #6b7280;
  font-weight: 600;
}

.detail-row .status-pendaftaran {
  color: #d97706;
  font-weight: 600;
}

.detail-row .status-voting {
  color: #059669;
  font-weight: 600;
}

.detail-row .status-selesai {
  color: #dc2626;
  font-weight: 600;
}

/* Status control buttons */
.status-controls {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
}

.status-controls h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #374151;
  font-size: 1rem;
}

.status-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.status-btn {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #4a5568;
  transition: all 0.2s;
  text-align: center;
}

.status-btn:hover:not(.active) {
  border-color: #94a3b8;
  background: #f8fafc;
}

.status-btn.active {
  border-color: #1e3a8a;
  background: #1e3a8a;
  color: white;
}

.status-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Edit controls */
.edit-controls {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-edit {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-edit:hover {
  background: #2563eb;
}

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-delete:hover {
  background: #dc2626;
}

/* Session rules */
.session-rules {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 2rem;
}

.session-rules h4 {
  color: #0369a1;
  margin-top: 0;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.session-rules ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #1e40af;
}

.session-rules li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.session-rules li:last-child {
  margin-bottom: 0;
}

/* Candidate stats enhancement */
.candidates-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.candidate-stat {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border-top: 5px solid;
  transition: transform 0.2s;
}

.candidate-stat:hover {
  transform: translateY(-3px);
}

.candidate-stat.pending {
  border-color: #f59e0b;
}

.candidate-stat.approved {
  border-color: #10b981;
}

.candidate-stat.rejected {
  border-color: #ef4444;
}

.candidate-stat h4 {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.candidate-stat p {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  color: #1e3a8a;
}

/* Table enhancements */
.table-container {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-top: 1rem;
}

.table-container table {
  width: 100%;
  border-collapse: collapse;
}

.table-container thead {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
}

.table-container th {
  padding: 1rem 1.25rem;
  text-align: left;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-container tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s;
}

.table-container tbody tr:hover {
  background: #f8fafc;
}

.table-container td {
  padding: 1rem 1.25rem;
  color: #374151;
  vertical-align: middle;
}

.table-container .token-code {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Droid Sans Mono', monospace;
  background: #f1f5f9;
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  border: 1px solid #e2e8f0;
  display: inline-block;
  letter-spacing: 0.5px;
}

/* Status badges in table */
.table-container .status-used,
.table-container .status-available,
.table-container .status-expired {
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-used {
  background: #d1fae5;
  color: #065f46;
}

.status-available {
  background: #dbeafe;
  color: #1e40af;
}

.status-expired {
  background: #fee2e2;
  color: #991b1b;
}

/* View more link */
.view-more {
  text-align: center;
  padding: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 10px 10px;
}

/* Enhanced empty states */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  margin: 2rem 0;
  border: 2px dashed #d1d5db;
}

.empty-state p {
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.empty-state .hint {
  font-size: 0.875rem;
  color: #9ca3af;
  max-width: 400px;
  margin: 0 auto 1.5rem;
  line-height: 1.5;
}

.empty-state .btn-primary {
  margin-top: 1rem;
}

/* No results state */
.no-results {
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #d1d5db;
}

/* Loading enhancements */
.loading-screen {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.loader {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #1e3a8a;
  border-radius: 50%;
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

/* Mobile responsive */
@media (max-width: 640px) {
  .admin-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1rem;
  }

  .header-right {
    flex-direction: column;
    gap: 1rem;
  }

  .admin-info {
    justify-content: center;
  }

  .logout-btn {
    width: 100%;
    text-align: center;
  }

  .stats-overview {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .tabs {
    padding: 0 0.5rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab-btn {
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
    white-space: nowrap;
  }

  .tab-content {
    padding: 1rem;
  }

  .token-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary,
  .btn-refresh {
    width: 100%;
  }

  .table-container {
    font-size: 0.85rem;
  }

  .table-container th,
  .table-container td {
    padding: 0.75rem;
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

/* Tablet responsive */
@media (min-width: 641px) and (max-width: 1024px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .monitoring-grid {
    grid-template-columns: 1fr;
  }

  .candidates-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Add smooth transitions */
.tab-pane,
.stat-card,
.token-stat,
.candidate-stat,
.session-card {
  transition: all 0.3s ease;
}

/* Hover effects */
.btn-primary:hover,
.btn-secondary:hover,
.btn-refresh:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Fade in animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tab-pane {
  animation: fadeInUp 0.4s ease;
}

/* Toast animation */
.toast {
  animation: slideInRight 0.3s ease;
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

/* Custom scrollbar for better UX */
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
