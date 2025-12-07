<template>
  <div class="simple-dashboard">
    <!-- Header -->
    <div class="header">
      <h1>🚀 Admin SMANDA VOTE</h1>
      <div class="session-info">
        <span class="session-label">Sesi:</span>
        <span class="session-name">{{ activeSession?.nama_sesi || 'Tidak ada sesi' }}</span>
        <span v-if="activeSession" :class="['session-status', activeSession.status]">
          {{ activeSession.status.toUpperCase() }}
        </span>
      </div>
    </div>

    <!-- Admin Info -->
    <div class="admin-card">
      <div class="admin-avatar">{{ getInitials(userEmail) }}</div>
      <div class="admin-details">
        <h3 class="text-black">{{ userEmail }}</h3>
        <p class="text-dark">Administrator</p>
      </div>
      <button @click="logout" class="logout-btn">Logout</button>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <div class="stat">
        <div class="stat-number">{{ stats.totalPeserta }}</div>
        <div class="stat-label text-black">Total Peserta</div>
      </div>
      <div class="stat">
        <div class="stat-number">{{ stats.votedCount }}</div>
        <div class="stat-label text-black">Sudah Voting</div>
      </div>
      <div class="stat">
        <div class="stat-number">{{ stats.totalKandidat }}</div>
        <div class="stat-label text-black">Total Calon</div>
      </div>
      <div class="stat">
        <div class="stat-number">{{ stats.totalTokens }}</div>
        <div class="stat-label text-black">Total Token</div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isGeneratingTokens" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">🔄</div>
        <h3 class="text-black">Sedang Generate Token...</h3>
        <p class="text-dark">{{ generateProgress }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <p class="loading-details text-dark">
          Membuat token untuk {{ progressTotal }} peserta<br />
          {{ progressSuccess }} berhasil, {{ progressFailed }} gagal
        </p>
      </div>
    </div>

    <!-- Main Menu -->
    <div class="main-menu">
      <h2 class="text-black">📁 Menu Admin</h2>
      <div class="menu-grid">
        <!-- Data Peserta -->
        <div class="menu-card" @click="goToPeserta">
          <div class="menu-icon">👥</div>
          <div class="menu-content">
            <h3 class="text-black">Data Peserta</h3>
            <p class="text-dark">Kelola data peserta (guru & kependidikan)</p>
            <div class="menu-count">{{ stats.totalPeserta }} peserta</div>
          </div>
        </div>

        <!-- Token Voting -->
        <div class="menu-card" @click="goToToken">
          <div class="menu-icon">🎫</div>
          <div class="menu-content">
            <h3 class="text-black">Token Voting</h3>
            <p class="text-dark">Generate token voting</p>
            <div class="menu-count">{{ stats.totalTokens }} token</div>
          </div>
        </div>

        <!-- Data Kandidat -->
        <div class="menu-card" @click="goToKandidat">
          <div class="menu-icon">👤</div>
          <div class="menu-content">
            <h3 class="text-black">Data Kandidat</h3>
            <p class="text-dark">Kelola calon</p>
            <div class="menu-count">{{ stats.totalKandidat }} calon</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Session Control -->
    <div class="session-control">
      <h2 class="text-black">⚙️ Kontrol Sesi</h2>

      <div v-if="!activeSession" class="no-session">
        <p class="text-black">Belum ada sesi aktif</p>
        <button @click="createSession" class="btn-create">🚀 Buat Sesi Baru</button>
      </div>

      <div v-else class="session-card">
        <div class="session-header">
          <h3 class="text-black">{{ activeSession.nama_sesi }}</h3>
          <div :class="['phase-badge', activeSession.status]">
            {{ formatPhase(activeSession.status) }}
          </div>
        </div>

        <div class="session-actions">
          <!-- DRAFT → PENDAFTARAN -->
          <button
            v-if="activeSession.status === 'draft'"
            @click="updateSession('pendaftaran')"
            class="btn-phase draft"
            :disabled="isGeneratingTokens"
          >
            🚀 Buka Pendaftaran
          </button>

          <!-- PENDAFTARAN → VOTING -->
          <button
            v-if="activeSession.status === 'pendaftaran'"
            @click="openVoting"
            :disabled="!canOpenVoting || isGeneratingTokens"
            class="btn-phase pendaftaran"
          >
            🗳️ Buka Voting
          </button>

          <!-- VOTING → SELESAI -->
          <button
            v-if="activeSession.status === 'voting'"
            @click="updateSession('selesai')"
            class="btn-phase voting"
            :disabled="isGeneratingTokens"
          >
            ✅ Tutup Voting
          </button>

          <!-- SELESAI → RESET -->
          <button
            v-if="activeSession.status === 'selesai'"
            @click="resetSession"
            class="btn-phase selesai"
            :disabled="isGeneratingTokens"
          >
            🔄 Reset Sesi
          </button>
        </div>

        <!-- Warning -->
        <div v-if="activeSession.status === 'pendaftaran' && !canOpenVoting" class="warning">
          ⚠️ Minimal 1 calon Waka Sarpras dan 1 calon Waka Kesiswaan (Saat ini:
          {{ stats.kandidatSarpras }} Sarpras, {{ stats.kandidatKesiswaan }} Kesiswaan)
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()

// Data
const activeSession = ref(null)
const userEmail = ref('')
const stats = ref({
  totalPeserta: 0,
  votedCount: 0,
  totalKandidat: 0,
  totalTokens: 0,
  kandidatSarpras: 0,
  kandidatKesiswaan: 0,
})

// Loading state untuk generate token
const isGeneratingTokens = ref(false)
const generateProgress = ref('')
const progressTotal = ref(0)
const progressCurrent = ref(0)
const progressSuccess = ref(0)
const progressFailed = ref(0)

// Computed
const canOpenVoting = computed(() => {
  if (!activeSession.value || activeSession.value.status !== 'pendaftaran') return false
  return stats.value.kandidatSarpras >= 1 && stats.value.kandidatKesiswaan >= 1
})

const progressPercentage = computed(() => {
  if (progressTotal.value === 0) return 0
  return Math.round((progressCurrent.value / progressTotal.value) * 100)
})

// Navigation
const goToPeserta = () => router.push('/admin/peserta')
const goToToken = () => router.push('/admin/token')
const goToKandidat = () => router.push('/admin/kandidat')

// Initialize
onMounted(async () => {
  await checkAuth()
  await loadAllData()
})

// CHECK AUTH
const checkAuth = async () => {
  try {
    const { data } = await supabase.auth.getSession()
    console.log('🔐 Auth check:', data.session)

    if (!data.session) {
      console.log('❌ No session, redirect to login')
      router.push('/admin-login')
      return false
    }

    userEmail.value = data.session.user.email
    console.log('✅ User logged in:', userEmail.value)
    return true
  } catch (error) {
    console.error('Auth error:', error)
    router.push('/admin-login')
    return false
  }
}

// Load all real data
const loadAllData = async () => {
  try {
    // Load session
    const { data: session } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .order('dibuat_pada', { ascending: false })
      .limit(1)
      .single()

    activeSession.value = session

    if (!session) {
      resetStats()
      return
    }

    // Load stats in parallel
    await Promise.all([
      loadPesertaStats(),
      loadVotingStats(session.id),
      loadKandidatStats(session.id),
      loadTokenStats(session.id),
    ])
  } catch (error) {
    console.error('Load error:', error)
    resetStats()
  }
}

const resetStats = () => {
  stats.value = {
    totalPeserta: 0,
    votedCount: 0,
    totalKandidat: 0,
    totalTokens: 0,
    kandidatSarpras: 0,
    kandidatKesiswaan: 0,
  }
}

const loadPesertaStats = async () => {
  const { count } = await supabase
    .from('pengguna')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  stats.value.totalPeserta = count || 0
}

const loadVotingStats = async (sessionId) => {
  const { data } = await supabase
    .from('suara')
    .select('pemilih_id', { distinct: true })
    .eq('sesi_id', sessionId)
    .eq('is_draft', false)

  stats.value.votedCount = data?.length || 0
}

const loadKandidatStats = async (sessionId) => {
  const { data } = await supabase.from('kandidat').select('jabatan').eq('sesi_id', sessionId)

  if (data) {
    const sarpras = data.filter((c) => c.jabatan === 'sarpras')
    const kesiswaan = data.filter((c) => c.jabatan === 'kesiswaan')

    stats.value.totalKandidat = sarpras.length + kesiswaan.length
    stats.value.kandidatSarpras = sarpras.length
    stats.value.kandidatKesiswaan = kesiswaan.length
  }
}

const loadTokenStats = async (sessionId) => {
  const { count } = await supabase
    .from('token_qr')
    .select('*', { count: 'exact', head: true })
    .eq('sesi_id', sessionId)

  stats.value.totalTokens = count || 0
}

// Session actions
const createSession = async () => {
  const namaSesi = prompt('Nama sesi baru:')
  if (!namaSesi) return

  const year = new Date().getFullYear()
  const tahunAjaran = `${year}/${year + 1}`

  // TIDAK PAKAI dibuat_oleh untuk menghindari foreign key constraint error
  const { error } = await supabase.from('sesi_pemilihan').insert({
    nama_sesi: namaSesi,
    tahun_ajaran: tahunAjaran,
    status: 'draft',
    waktu_mulai_pendaftaran: new Date(),
    waktu_selesai_pendaftaran: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    waktu_mulai_voting: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    waktu_selesai_voting: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    // TIDAK ADA: dibuat_oleh: userId,
  })

  if (error) {
    alert('❌ Gagal membuat sesi: ' + error.message)
    return
  }

  await loadAllData()
  alert('✅ Sesi berhasil dibuat!')
}

const updateSession = async (status) => {
  if (!activeSession.value) return

  const confirmMsg = {
    pendaftaran: 'Buka pendaftaran calon?',
    voting: 'Buka voting?',
    selesai: 'Tutup voting?',
  }[status]

  if (!confirm(confirmMsg)) return

  const { error } = await supabase
    .from('sesi_pemilihan')
    .update({ status })
    .eq('id', activeSession.value.id)

  if (error) {
    alert('❌ Gagal: ' + error.message)
    return
  }

  await loadAllData()
  alert('✅ Berhasil!')
}

const openVoting = async () => {
  if (!confirm('Buka voting dan generate token untuk semua peserta aktif?')) return
  await updateSession('voting')
  await generateTokens()
}

const generateTokens = async () => {
  try {
    isGeneratingTokens.value = true
    generateProgress.value = 'Mengambil data peserta...'
    progressCurrent.value = 0
    progressSuccess.value = 0
    progressFailed.value = 0

    // Get all active peserta
    const { data: activePeserta } = await supabase
      .from('pengguna')
      .select('id')
      .eq('is_active', true)

    if (!activePeserta?.length) {
      alert('Tidak ada peserta aktif!')
      isGeneratingTokens.value = false
      return
    }

    generateProgress.value = 'Mengecek token yang sudah ada...'

    // Cek dulu apakah sudah ada token untuk sesi ini
    const { data: existingTokens } = await supabase
      .from('token_qr')
      .select('pengguna_id')
      .eq('sesi_id', activeSession.value.id)

    const existingPesertaIds = new Set(existingTokens?.map((t) => t.pengguna_id) || [])
    const pesertaToGenerate = activePeserta.filter((p) => !existingPesertaIds.has(p.id))

    if (pesertaToGenerate.length === 0) {
      alert('✅ Semua peserta sudah memiliki token!')
      isGeneratingTokens.value = false
      return
    }

    progressTotal.value = pesertaToGenerate.length
    generateProgress.value = `Membuat ${pesertaToGenerate.length} token...`

    // Generate tokens dengan BATCH INSERT (SAMA DENGAN AdminToken.vue)
    const tokensToInsert = []
    const generatedTokens = new Set()

    for (const peserta of pesertaToGenerate) {
      let token
      let isUnique = false
      let attempts = 0
      const maxAttempts = 10

      // Generate token yang unique
      while (!isUnique && attempts < maxAttempts) {
        token = Math.floor(100000 + Math.random() * 900000).toString()

        if (!generatedTokens.has(token)) {
          isUnique = true
          generatedTokens.add(token)
        }
        attempts++
      }

      if (!isUnique) {
        console.error(`Gagal generate token unik untuk peserta ${peserta.id}`)
        progressFailed.value++
        continue
      }

      // SAMA DENGAN AdminToken.vue - TANPA 'dibuat_oleh'
      tokensToInsert.push({
        pengguna_id: peserta.id,
        sesi_id: activeSession.value.id,
        token: token,
        tipe_token: 'voting',
        kadaluarsa_pada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        // TIDAK ADA 'dibuat_oleh' - menghindari foreign key constraint error
      })
    }

    // Insert semua token sekaligus
    if (tokensToInsert.length > 0) {
      generateProgress.value = `Menyimpan ${tokensToInsert.length} token ke database...`

      const { error } = await supabase.from('token_qr').insert(tokensToInsert)

      if (error) {
        console.error('Batch insert error:', error)
        alert(`❌ Gagal insert token: ${error.message}`)
      } else {
        progressSuccess.value = tokensToInsert.length
        generateProgress.value = `Berhasil membuat ${tokensToInsert.length} token!`

        // Tunggu sebentar sebelum reload
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // Update stats
    generateProgress.value = 'Menyelesaikan...'
    await loadTokenStats(activeSession.value.id)

    isGeneratingTokens.value = false

    // Show result
    if (tokensToInsert.length > 0) {
      alert(`✅ ${tokensToInsert.length} token berhasil dibuat!`)
    } else {
      alert('⚠️ Tidak ada token baru yang dibuat.')
    }
  } catch (error) {
    console.error('Generate tokens error:', error)
    isGeneratingTokens.value = false
    alert('❌ Terjadi kesalahan saat generate token')
  }
}

const resetSession = async () => {
  if (!confirm('Reset sesi? Semua data voting akan dihapus.')) return

  try {
    if (activeSession.value?.id) {
      await supabase.from('token_qr').delete().eq('sesi_id', activeSession.value.id)
      await supabase.from('suara').delete().eq('sesi_id', activeSession.value.id)
      await supabase.from('kandidat').delete().eq('sesi_id', activeSession.value.id)
    }

    await updateSession('draft')
    alert('✅ Sesi berhasil direset!')
  } catch (error) {
    alert('❌ Gagal reset: ' + error.message)
  }
}

// Utility
const getInitials = (email) => {
  if (!email) return 'AD'
  const name = email.split('@')[0]
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatPhase = (status) => {
  const phases = {
    draft: 'Draf',
    pendaftaran: 'Pendaftaran',
    voting: 'Voting',
    selesai: 'Selesai',
  }
  return phases[status] || status
}

// LOGOUT
const logout = async () => {
  try {
    await supabase.auth.signOut()
    console.log('✅ Logout success')
    router.push('/admin-login')
  } catch (error) {
    console.error('Logout error:', error)
    router.push('/admin-login')
  }
}
</script>

<style scoped>
/* ============================================
   DASHBOARD SPECIFIC STYLES
   ============================================ */
.simple-dashboard {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
}

/* Header */
.header {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  color: #1e3a8a;
  font-size: 1.8rem;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #eef2ff;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #c7d2fe;
}

.session-label {
  font-weight: 600;
  color: #4f46e5;
}

.session-name {
  color: #1e40af;
  font-weight: 500;
}

.session-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}

.session-status.draft {
  background: #fef3c7;
  color: #92400e;
}

.session-status.pendaftaran {
  background: #dbeafe;
  color: #1e40af;
}

.session-status.voting {
  background: #dcfce7;
  color: #166534;
}

.session-status.selesai {
  background: #f3f4f6;
  color: #374151;
}

/* Admin Card */
.admin-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

.admin-details {
  flex: 1;
}

.admin-details h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #1f2937;
}

.admin-details p {
  margin: 0.25rem 0 0 0;
  color: #6b7280;
}

.logout-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background: #dc2626;
}

/* Quick Stats */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat:hover {
  transform: translateY(-2px);
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #1e3a8a;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  border: 2px solid #1e3a8a;
}

.loading-spinner {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-content h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.2rem;
}

.loading-content p {
  margin: 0.5rem 0;
  color: #6b7280;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  margin: 1.5rem 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.loading-details {
  font-size: 0.9rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  line-height: 1.5;
}

/* Main Menu */
.main-menu {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.main-menu h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.menu-card {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.menu-card:hover {
  background: #e0e7ff;
  border-color: #1e3a8a;
  transform: translateY(-2px);
}

.menu-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.menu-content h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.2rem;
}

.menu-content p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.menu-count {
  margin-top: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: #e0e7ff;
  color: #1e40af;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
}

/* Session Control */
.session-control {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.session-control h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.no-session {
  text-align: center;
  padding: 3rem;
  background: #f8fafc;
  border-radius: 10px;
  border: 2px dashed #cbd5e1;
}

.no-session p {
  margin: 0 0 1rem 0;
  color: #6b7280;
}

.btn-create {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-create:hover {
  background: #1e40af;
}

.session-card {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 10px;
  border: 2px solid #e0e7ff;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.session-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.3rem;
}

.phase-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.85rem;
}

.phase-badge.draft {
  background: #fef3c7;
  color: #92400e;
}

.phase-badge.pendaftaran {
  background: #dbeafe;
  color: #1e40af;
}

.phase-badge.voting {
  background: #dcfce7;
  color: #166534;
}

.phase-badge.selesai {
  background: #f3f4f6;
  color: #374151;
}

.session-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.btn-phase {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-phase:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-phase:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-phase.draft {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.btn-phase.pendaftaran {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
}

.btn-phase.voting {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.btn-phase.selesai {
  background: linear-gradient(135deg, #6b7280, #9ca3af);
  color: white;
}

.warning {
  padding: 1rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 6px;
  border: 1px solid #fbbf24;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .session-info {
    flex-wrap: wrap;
    justify-content: center;
  }

  .admin-card {
    flex-direction: column;
    text-align: center;
  }

  .menu-grid {
    grid-template-columns: 1fr;
  }

  .session-actions {
    flex-direction: column;
  }
}

.text-black {
  color: #000000 !important;
}

.text-dark {
  color: #374151 !important;
}
</style>
