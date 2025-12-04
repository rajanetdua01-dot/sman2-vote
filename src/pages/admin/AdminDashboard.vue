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
    <div v-else class="dashboard-content">
      <!-- Header -->
      <AdminHeader :activeSession="activeSession" :adminUser="adminUser" @logout="handleLogout" />

      <!-- Stats Overview -->
      <AdminStats :stats="stats" :activeSession="activeSession" />

      <!-- Tabs Navigation -->
      <AdminTabs
        v-model="activeTab"
        :candidateStats="candidateStats"
        :tokenStats="{
          availableTokens: stats.availableTokens,
          totalTokens: stats.totalTokens,
        }"
      />

      <!-- Tab Content -->
      <div class="tab-content-wrapper">
        <!-- Session Tab -->
        <AdminSessionTab
          v-if="activeTab === 'session'"
          :activeSession="activeSession"
          :stats="stats"
          :loading="loading"
          @open-create-modal="showCreateModal = true"
          @confirm-action="confirmAction"
          @switch-tab="switchTab"
        />

        <!-- Tokens Tab -->
        <AdminTokensTab
          v-if="activeTab === 'tokens'"
          :activeSession="activeSession"
          :stats="stats"
          @refresh="refreshDashboardData"
        />

        <!-- Candidates Tab -->
        <AdminCandidatesTab
          v-if="activeTab === 'candidates'"
          :activeSession="activeSession"
          @refresh="refreshDashboardData"
        />

        <!-- Monitor Tab -->
        <AdminMonitorTab v-if="activeTab === 'monitor'" :activeSession="activeSession" />
      </div>

      <!-- Modals -->
      <!-- Create Session Modal -->
      <AdminModalCreate
        v-if="showCreateModal"
        @close="showCreateModal = false"
        @create="createNewSession"
      />

      <!-- Confirm Action Modal -->
      <AdminModalConfirm
        v-if="showConfirmModal"
        :message="confirmMessage"
        :loading="executingAction"
        @close="showConfirmModal = false"
        @confirm="executeAction"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

// Components
import AdminHeader from './AdminHeader.vue'
import AdminStats from './AdminStats.vue'
import AdminTabs from './AdminTabs.vue'
import AdminSessionTab from './AdminSessionTab.vue'
import AdminCandidatesTab from './AdminCandidatesTab.vue'
import AdminTokensTab from './AdminTokensTab.vue'
import AdminMonitorTab from './AdminMonitorTab.vue' // ✅ IMPORT MONITOR TAB
import AdminModalCreate from './modals/AdminModalCreate.vue'
import AdminModalConfirm from './modals/AdminModalConfirm.vue'

const router = useRouter()

// State
const loading = ref(true)
const isAuthenticated = ref(false)
const adminUser = ref(null)
const activeTab = ref('session')
const activeSession = ref(null)
const stats = ref({
  totalGuru: 0,
  votedCount: 0,
  participationRate: 0,
  totalTokens: 0,
  usedTokens: 0,
  availableTokens: 0,
})
const candidateStats = ref({
  pending: 0,
  approved: 0,
  rejected: 0,
  total: 0,
})

// Modal State
const showCreateModal = ref(false)
const showConfirmModal = ref(false)
const confirmMessage = ref('')
const pendingAction = ref(null)
const executingAction = ref(false)

// Auto-refresh
let refreshInterval = null
let isRefreshing = false

// Check Authentication
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

// Load Dashboard Data
const loadDashboardData = async () => {
  try {
    // Load active session dulu
    await loadActiveSession()

    // Load stats
    await loadStats()

    // Load candidate stats
    await loadCandidateStats()
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
}

// Load Active Session
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

// Load Stats
const loadStats = async () => {
  try {
    // Total guru
    const { count: totalGuru, error: guruError } = await supabase
      .from('pengguna')
      .select('*', { count: 'exact', head: true })
      .eq('peran', 'guru')
      .eq('is_active', true)

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
  }
}

// Load Candidate Stats
const loadCandidateStats = async () => {
  try {
    let pending = 0
    let approved = 0
    let rejected = 0
    let total = 0

    if (activeSession.value?.id) {
      // Count pending registrations
      const { data: pendingData } = await supabase
        .from('pendaftaran_kandidat')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'menunggu')
        .eq('sesi_id', activeSession.value.id)

      const { data: approvedData } = await supabase
        .from('pendaftaran_kandidat')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disetujui')
        .eq('sesi_id', activeSession.value.id)

      const { data: rejectedData } = await supabase
        .from('pendaftaran_kandidat')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ditolak')
        .eq('sesi_id', activeSession.value.id)

      const { data: totalData } = await supabase
        .from('pendaftaran_kandidat')
        .select('*', { count: 'exact', head: true })
        .eq('sesi_id', activeSession.value.id)

      pending = pendingData?.count || 0
      approved = approvedData?.count || 0
      rejected = rejectedData?.count || 0
      total = totalData?.count || 0
    }

    candidateStats.value = {
      pending,
      approved,
      rejected,
      total,
    }
  } catch (error) {
    console.error('Error loading candidate stats:', error)
  }
}

// Create New Session
const createNewSession = async (sessionData) => {
  if (!sessionData.nama_sesi || !sessionData.tahun_ajaran) return

  executingAction.value = true

  try {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { error } = await supabase.from('sesi_pemilihan').insert({
      nama_sesi: sessionData.nama_sesi,
      tahun_ajaran: sessionData.tahun_ajaran,
      waktu_mulai_pendaftaran: now,
      waktu_selesai_pendaftaran: nextWeek,
      waktu_mulai_voting: nextWeek,
      waktu_selesai_voting: new Date(nextWeek.getTime() + 24 * 60 * 60 * 1000),
      status: 'draft',
      dibuat_oleh: adminUser.value.id,
    })

    if (error) throw error

    showCreateModal.value = false
    await loadDashboardData()
  } catch (error) {
    console.error('Error creating session:', error)
    alert('Gagal membuat sesi: ' + error.message)
  } finally {
    executingAction.value = false
  }
}

// Confirm Action
const confirmAction = (action) => {
  const messages = {
    bukaPendaftaran: 'Buka pendaftaran? Guru bisa daftar sebagai calon kandidat.',
    bukaVoting: 'Buka voting? Token 6 digit akan otomatis dibuat untuk semua guru.',
    tutupVoting: 'Tutup voting? Voting akan dihentikan dan hasil menjadi final.',
    resetSesi: 'Reset sesi? Semua data (token, voting) akan dihapus dan status kembali ke DRAFT.',
  }

  if (!messages[action]) {
    console.error('Unknown action:', action)
    return
  }

  confirmMessage.value = messages[action]
  pendingAction.value = action
  showConfirmModal.value = true
}

// Execute Action
const executeAction = async () => {
  if (!pendingAction.value) return

  executingAction.value = true

  try {
    switch (pendingAction.value) {
      case 'bukaPendaftaran':
        await updateSessionStatus('pendaftaran')
        break

      case 'bukaVoting':
        await updateSessionStatus('voting')
        // Auto generate tokens when opening voting
        await generateTokensForAllGuru()
        break

      case 'tutupVoting':
        await updateSessionStatus('selesai')
        break

      case 'resetSesi':
        await resetSessionData()
        await updateSessionStatus('draft')
        break
    }

    // Refresh data
    await loadDashboardData()
  } catch (error) {
    console.error('Error in action:', pendingAction.value, error)
    alert('Gagal: ' + error.message)
  } finally {
    executingAction.value = false
    showConfirmModal.value = false
    pendingAction.value = null
  }
}

// Update Session Status
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

// Generate Tokens for All Guru
const generateTokensForAllGuru = async () => {
  if (!activeSession.value) {
    alert('Tidak ada sesi aktif')
    return
  }

  try {
    // Get all active teachers
    const { data: allGuru, error: guruError } = await supabase
      .from('pengguna')
      .select('id, nama_lengkap')
      .eq('peran', 'guru')
      .eq('is_active', true)

    if (guruError) throw guruError

    if (!allGuru || allGuru.length === 0) {
      alert('Tidak ada data guru aktif')
      return
    }

    // Delete old tokens for this session
    const { error: deleteError } = await supabase
      .from('token_qr')
      .delete()
      .eq('sesi_id', activeSession.value.id)

    if (deleteError) throw deleteError

    // Generate unique tokens
    const tokensToInsert = []
    const existingTokens = new Set()

    for (const guru of allGuru) {
      let token
      let attempts = 0
      const maxAttempts = 50

      // Generate unique token
      while (attempts < maxAttempts) {
        token = generate6DigitToken(existingTokens)

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

    // Insert in batches
    const batchSize = 100
    for (let i = 0; i < tokensToInsert.length; i += batchSize) {
      const batch = tokensToInsert.slice(i, i + batchSize)
      const { error: insertError } = await supabase.from('token_qr').insert(batch)

      if (insertError) {
        console.error('Batch insert error:', insertError)
        throw insertError
      }
    }

    console.log(`Generated ${allGuru.length} tokens`)
  } catch (error) {
    console.error('Error generating tokens:', error)
    alert('Gagal generate token: ' + error.message)
    throw error
  }
}

// Generate 6 Digit Token
const generate6DigitToken = (existingTokens = new Set()) => {
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

// Reset Session Data
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
  } catch (error) {
    console.error('Error resetting session data:', error)
    throw error
  }
}

// Switch Tab
const switchTab = (tabId) => {
  activeTab.value = tabId
}

// Refresh Dashboard Data
const refreshDashboardData = async () => {
  console.log('🔄 Refreshing dashboard data...')
  await loadDashboardData()
}

// Handle Logout
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
        await loadCandidateStats()
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
.admin-dashboard {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 1rem;
}

/* Loading & Unauthorized States */
.loading-screen,
.unauthorized {
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

/* Dashboard Content */
.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
}

/* Tab Content */
.tab-content-wrapper {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: 400px;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 0.5rem;
  }

  .tab-content-wrapper {
    padding: 1.5rem;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }

  .btn-login,
  .btn-home {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .tab-content-wrapper {
    padding: 1rem;
  }
}
</style>
