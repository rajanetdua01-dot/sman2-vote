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
      <div class="admin-avatar">{{ getInitials(adminUser?.nama_lengkap) }}</div>
      <div class="admin-details">
        <h3 class="text-black">{{ adminUser?.nama_lengkap || 'Admin' }}</h3>
        <p class="text-dark">Administrator</p>
      </div>
      <button @click="logout" class="logout-btn">Logout</button>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <div class="stat">
        <div class="stat-number">{{ stats.totalGuru }}</div>
        <div class="stat-label text-black">Total Guru</div>
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

    <!-- Main Menu -->
    <div class="main-menu">
      <h2 class="text-black">📁 Menu Admin</h2>
      <div class="menu-grid">
        <!-- Data Peserta -->
        <div class="menu-card" @click="goToPeserta">
          <div class="menu-icon">👥</div>
          <div class="menu-content">
            <h3 class="text-black">Data Peserta</h3>
            <p class="text-dark">Kelola data guru</p>
            <div class="menu-count">{{ stats.totalGuru }} peserta</div>
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
          >
            🚀 Buka Pendaftaran
          </button>

          <!-- PENDAFTARAN → VOTING -->
          <button
            v-if="activeSession.status === 'pendaftaran'"
            @click="openVoting"
            :disabled="!canOpenVoting"
            class="btn-phase pendaftaran"
          >
            🗳️ Buka Voting
          </button>

          <!-- VOTING → SELESAI -->
          <button
            v-if="activeSession.status === 'voting'"
            @click="updateSession('selesai')"
            class="btn-phase voting"
          >
            ✅ Tutup Voting
          </button>

          <!-- SELESAI → RESET -->
          <button
            v-if="activeSession.status === 'selesai'"
            @click="resetSession"
            class="btn-phase selesai"
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

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h2 class="text-black">⚡ Aksi Cepat</h2>
      <div class="action-buttons">
        <button @click="goToPeserta" class="btn-action">
          <span>➕</span>
          <span class="text-black">Tambah Peserta</span>
        </button>

        <button @click="goToKandidat" class="btn-action">
          <span>👤</span>
          <span class="text-black">Tambah Kandidat</span>
        </button>

        <button @click="generateTokens" class="btn-action" :disabled="!canGenerateTokens">
          <span>🎫</span>
          <span class="text-black">Generate Token</span>
        </button>
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
const adminUser = ref(null)
const activeSession = ref(null)
const stats = ref({
  totalGuru: 0,
  votedCount: 0,
  totalKandidat: 0,
  totalTokens: 0,
  kandidatSarpras: 0,
  kandidatKesiswaan: 0,
})

// Computed
const canOpenVoting = computed(() => {
  if (!activeSession.value || activeSession.value.status !== 'pendaftaran') return false
  return stats.value.kandidatSarpras >= 1 && stats.value.kandidatKesiswaan >= 1
})

const canGenerateTokens = computed(() => {
  return activeSession.value?.status === 'voting'
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

// Check auth
const checkAuth = () => {
  const session = localStorage.getItem('smanda_admin')
  if (!session) {
    router.push('/admin-login')
    return
  }

  try {
    const data = JSON.parse(session)
    adminUser.value = data.user
  } catch {
    router.push('/admin-login')
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
      loadGuruStats(),
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
    totalGuru: 0,
    votedCount: 0,
    totalKandidat: 0,
    totalTokens: 0,
    kandidatSarpras: 0,
    kandidatKesiswaan: 0,
  }
}

const loadGuruStats = async () => {
  const { count } = await supabase
    .from('pengguna')
    .select('*', { count: 'exact', head: true })
    .eq('peran', 'guru')
    .eq('is_active', true)

  stats.value.totalGuru = count || 0
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

  const { error } = await supabase.from('sesi_pemilihan').insert({
    nama_sesi: namaSesi,
    tahun_ajaran: tahunAjaran,
    status: 'draft',
    waktu_mulai_pendaftaran: new Date(),
    waktu_selesai_pendaftaran: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    waktu_mulai_voting: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    waktu_selesai_voting: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  })

  if (error) {
    alert('❌ Gagal membuat sesi')
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
    alert('❌ Gagal')
    return
  }

  await loadAllData()
  alert('✅ Berhasil!')
}

const openVoting = async () => {
  if (!confirm('Buka voting dan generate token untuk semua guru?')) return
  await updateSession('voting')
  await generateTokens()
}

const generateTokens = async () => {
  try {
    const { data: activeGurus } = await supabase
      .from('pengguna')
      .select('id')
      .eq('peran', 'guru')
      .eq('is_active', true)

    if (!activeGurus?.length) {
      alert('Tidak ada guru aktif!')
      return
    }

    for (const guru of activeGurus) {
      const token = Math.floor(100000 + Math.random() * 900000).toString()
      await supabase.from('token_qr').insert({
        pengguna_id: guru.id,
        sesi_id: activeSession.value.id,
        token: token,
        tipe_token: 'voting',
        kadaluarsa_pada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    await loadTokenStats(activeSession.value.id)
    alert(`✅ ${activeGurus.length} token berhasil dibuat!`)
  } catch {
    alert('❌ Gagal generate token')
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
  } catch {
    alert('❌ Gagal reset')
  }
}

// Utility
const getInitials = (name) => {
  if (!name) return 'AD'
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

const logout = () => {
  localStorage.removeItem('smanda_admin')
  router.push('/admin-login')
}
</script>

<style scoped>
.simple-dashboard {
  padding: 1rem;
  background: #f8fafc;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
}

.text-black {
  color: #000000 !important;
  font-weight: 600;
}
.text-dark {
  color: #333333 !important;
  font-weight: 500;
}

.header {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid #1e3a8a;
}

.header h1 {
  margin: 0 0 0.5rem 0;
  color: #000000;
  font-size: 1.8rem;
  font-weight: 800;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.session-label {
  color: #333333;
  font-weight: 600;
}
.session-name {
  color: #000000;
  font-weight: 700;
}

.session-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 800;
  color: #000000;
}

.session-status.draft {
  background: #f1f5f9;
  border: 2px solid #64748b;
}
.session-status.pendaftaran {
  background: #fef3c7;
  border: 2px solid #92400e;
}
.session-status.voting {
  background: #d1fae5;
  border: 2px solid #065f46;
}
.session-status.selesai {
  background: #dcfce7;
  border: 2px solid #166534;
}

.admin-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid #e5e7eb;
}

.admin-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #000000, #1e3a8a);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.2rem;
  border: 2px solid #1e3a8a;
}

.admin-details h3 {
  margin: 0 0 0.25rem 0;
  color: #000000;
  font-size: 1.2rem;
  font-weight: 700;
}

.admin-details p {
  margin: 0;
  color: #333333;
  font-size: 0.9rem;
  font-weight: 600;
}

.logout-btn {
  margin-left: auto;
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid #b91c1b;
}

.logout-btn:hover {
  background: #b91c1b;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid #e5e7eb;
}

.stat-number {
  font-size: 2rem;
  font-weight: 800;
  color: #1e3a8a;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #000000;
  font-size: 0.9rem;
  font-weight: 700;
}

.main-menu {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid #e5e7eb;
}

.main-menu h2 {
  margin: 0 0 1.5rem 0;
  color: #000000;
  font-size: 1.3rem;
  font-weight: 800;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f1f5f9;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.menu-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-card:hover {
  background: white;
  border-color: #000000;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.menu-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000000;
  color: white;
}

.menu-content h3 {
  margin: 0 0 0.25rem 0;
  color: #000000;
  font-size: 1.1rem;
  font-weight: 700;
}

.menu-content p {
  margin: 0 0 0.5rem 0;
  color: #333333;
  font-size: 0.9rem;
  font-weight: 600;
}

.menu-count {
  background: #000000;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 800;
  display: inline-block;
  border: 1px solid #000000;
}

.session-control {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid #e5e7eb;
}

.session-control h2 {
  margin: 0 0 1.5rem 0;
  color: #000000;
  font-size: 1.3rem;
  font-weight: 800;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f1f5f9;
}

.no-session {
  text-align: center;
  padding: 2rem;
  color: #000000;
  font-weight: 600;
}

.btn-create {
  background: #000000;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 1rem;
  border: 2px solid #000000;
}

.session-card {
  background: #f0f9ff;
  border: 2px solid #1e3a8a;
  border-radius: 10px;
  padding: 1.5rem;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.session-header h3 {
  margin: 0;
  color: #000000;
  font-size: 1.2rem;
  font-weight: 700;
}

.phase-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 800;
  color: #000000;
}

.phase-badge.draft {
  background: #f1f5f9;
  border: 2px solid #64748b;
}
.phase-badge.pendaftaran {
  background: #fef3c7;
  border: 2px solid #92400e;
}
.phase-badge.voting {
  background: #d1fae5;
  border: 2px solid #065f46;
}
.phase-badge.selesai {
  background: #dcfce7;
  border: 2px solid #166534;
}

.session-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-phase {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
  flex: 1;
  min-width: 200px;
  color: white;
  font-weight: 800;
  border: 2px solid;
}

.btn-phase:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-phase:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-phase.draft {
  background: #1e3a8a;
  border-color: #1e3a8a;
}
.btn-phase.pendaftaran {
  background: #10b981;
  border-color: #10b981;
}
.btn-phase.voting {
  background: #f59e0b;
  border-color: #f59e0b;
}
.btn-phase.selesai {
  background: #dc2626;
  border-color: #dc2626;
}

.warning {
  background: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 1rem;
  color: #000000;
  font-size: 0.9rem;
  text-align: center;
  font-weight: 700;
}

.quick-actions {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid #e5e7eb;
}

.quick-actions h2 {
  margin: 0 0 1.5rem 0;
  color: #000000;
  font-size: 1.3rem;
  font-weight: 800;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f1f5f9;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.btn-action {
  background: #f8fafc;
  border: 2px solid #000000;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:hover:not(:disabled) {
  background: #000000;
}

.btn-action:hover:not(:disabled) span {
  color: white !important;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action span:first-child {
  font-size: 1.5rem;
}
.btn-action span:last-child {
  font-weight: 700;
  color: #000000;
}

/* Responsive */
@media (max-width: 768px) {
  .simple-dashboard {
    padding: 1rem;
  }
  .menu-grid {
    grid-template-columns: 1fr;
  }
  .session-actions {
    flex-direction: column;
  }
  .btn-phase {
    min-width: 100%;
  }
  .action-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
