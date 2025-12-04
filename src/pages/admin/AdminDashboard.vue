<template>
  <div class="admin-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1>Dashboard Admin</h1>
        <p>Sesi: {{ activeSession?.nama_sesi || 'Tidak ada sesi' }}</p>
      </div>
      <div class="header-right">
        <div class="admin-badge">
          {{ adminUser?.nama_lengkap || 'Admin' }}
        </div>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
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
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👤</div>
        <div class="stat-content">
          <h3>Calon Menunggu</h3>
          <p class="stat-number">{{ candidateStats.pending }}</p>
        </div>
      </div>
    </div>

    <!-- Session Control -->
    <div class="session-card">
      <h2>Kontrol Sesi</h2>

      <div v-if="!activeSession" class="no-session">
        <p>Belum ada sesi aktif</p>
        <button @click="createSession" class="btn-primary">+ Buat Sesi Baru</button>
      </div>

      <div v-else class="session-info">
        <div class="session-status">
          <span class="status-badge" :class="activeSession.status">
            {{ activeSession.status.toUpperCase() }}
          </span>
          <span class="session-name">{{ activeSession.nama_sesi }}</span>
        </div>

        <div class="session-actions">
          <button
            v-if="activeSession.status === 'draft'"
            @click="updateSession('pendaftaran')"
            class="action-btn btn-primary"
          >
            🚀 Buka Pendaftaran
          </button>

          <button
            v-if="activeSession.status === 'pendaftaran'"
            @click="openVoting"
            class="action-btn btn-success"
          >
            🗳️ Buka Voting
          </button>

          <button
            v-if="activeSession.status === 'voting'"
            @click="updateSession('selesai')"
            class="action-btn btn-warning"
          >
            ✅ Tutup Voting
          </button>

          <button
            v-if="activeSession.status === 'selesai'"
            @click="resetSession"
            class="action-btn btn-danger"
          >
            🔄 Reset Sesi
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
        class="tab-btn"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Participants -->
      <div v-if="activeTab === 'participants'" class="tab-pane">
        <!-- HEADER DENGAN BUTTON TAMBAH YANG JELAS -->
        <div class="pane-header">
          <div class="pane-title">
            <h3>👥 Data Guru</h3>
            <span class="count-badge">{{ participants.length }} peserta</span>
          </div>
          <button @click="addParticipant" class="btn-add">
            <span class="btn-icon">➕</span>
            Tambah Peserta
          </button>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>NIP</th>
                <th>Status</th>
                <th>Voting</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, index) in participants" :key="p.id">
                <td class="text-center">{{ index + 1 }}</td>
                <td class="name-cell">{{ p.nama_lengkap }}</td>
                <td>
                  <code class="nip">{{ p.nip }}</code>
                </td>
                <td>
                  <span :class="['status-badge-small', p.is_active ? 'active' : 'inactive']">
                    {{ p.is_active ? 'AKTIF' : 'NONAKTIF' }}
                  </span>
                </td>
                <td class="vote-cell">
                  <span :class="['vote-indicator', p.has_voted ? 'voted' : 'not-voted']">
                    {{ p.has_voted ? '✅' : '⏳' }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button @click="editParticipant(p)" class="btn-action edit" title="Edit">
                      ✏️ Edit
                    </button>
                    <button
                      @click="toggleParticipant(p)"
                      class="btn-action toggle"
                      :title="p.is_active ? 'Nonaktifkan' : 'Aktifkan'"
                    >
                      {{ p.is_active ? '⏸️' : '▶️' }}
                    </button>
                    <button @click="deleteParticipant(p)" class="btn-action delete" title="Hapus">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tokens -->
      <div v-if="activeTab === 'tokens'" class="tab-pane">
        <div class="pane-header">
          <h3>🎫 Token Voting</h3>
          <span class="count-badge">{{ tokens.length }} token</span>
        </div>

        <div v-if="tokens.length === 0" class="empty-state">
          <div class="empty-icon">⏳</div>
          <p>Belum ada token</p>
          <p class="hint">Token akan dibuat otomatis saat status sesi berubah ke VOTING</p>
        </div>
        <div v-else class="table-container">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Guru</th>
                <th>Token</th>
                <th>Status</th>
                <th>Digunakan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(t, index) in tokens" :key="t.id">
                <td class="text-center">{{ index + 1 }}</td>
                <td>{{ t.pengguna?.nama_lengkap }}</td>
                <td>
                  <div class="token-cell">
                    <code class="token">{{ t.token }}</code>
                    <button @click="copyToken(t.token)" class="copy-btn" title="Salin token">
                      📋
                    </button>
                  </div>
                </td>
                <td>
                  <span :class="['token-status', t.sudah_digunakan ? 'used' : 'available']">
                    {{ t.sudah_digunakan ? 'DIGUNAKAN' : 'TERSEDIA' }}
                  </span>
                </td>
                <td>{{ t.digunakan_pada ? formatDate(t.digunakan_pada) : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Candidates -->
      <div v-if="activeTab === 'candidates'" class="tab-pane">
        <div class="pane-header">
          <h3>👤 Verifikasi Calon</h3>
          <span class="count-badge">{{ registrations.length }} pendaftaran</span>
        </div>

        <div v-if="registrations.length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <p>Belum ada pendaftaran calon</p>
          <p class="hint">Guru dapat mendaftar saat status sesi adalah PENDAFTARAN</p>
        </div>
        <div v-else>
          <!-- Filter -->
          <div class="filter-bar">
            <select v-model="filterStatus" class="filter-select">
              <option value="all">Semua Status</option>
              <option value="menunggu">Menunggu</option>
              <option value="disetujui">Disetujui</option>
              <option value="ditolak">Ditolak</option>
            </select>
            <span class="filter-count">
              {{ filteredRegistrations.length }} dari {{ registrations.length }}
            </span>
          </div>

          <!-- Registrations List -->
          <div class="registrations-list">
            <div
              v-for="r in filteredRegistrations"
              :key="r.id"
              class="registration-card"
              :class="r.status"
            >
              <div class="candidate-info">
                <div class="candidate-avatar">
                  {{ getInitials(r.pengguna?.nama_lengkap) }}
                </div>
                <div class="candidate-details">
                  <h4>{{ r.pengguna?.nama_lengkap }}</h4>
                  <p class="candidate-nip">NIP: {{ r.pengguna?.nip }}</p>
                  <p class="candidate-position">Jabatan: {{ formatJabatan(r.jabatan_diajukan) }}</p>
                </div>
              </div>

              <div class="registration-right">
                <div class="registration-status">
                  <span :class="['status-badge', r.status]">
                    {{ getStatusLabel(r.status) }}
                  </span>
                </div>

                <div v-if="r.status === 'menunggu'" class="registration-actions">
                  <button @click="approveCandidate(r)" class="btn-action approve">
                    ✅ Setujui
                  </button>
                  <button @click="rejectCandidate(r)" class="btn-action reject">❌ Tolak</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Add Button for Mobile -->
    <button v-if="activeTab === 'participants'" @click="addParticipant" class="floating-add-btn">
      <span>➕</span>
      <span>Tambah Peserta</span>
    </button>
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
const activeTab = ref('participants')
const filterStatus = ref('all')

// Stats
const stats = ref({
  totalGuru: 0,
  votedCount: 0,
  participationRate: 0,
  availableTokens: 0,
})

const candidateStats = ref({ pending: 0 })
const participants = ref([])
const tokens = ref([])
const registrations = ref([])

// Tabs
const tabs = [
  { id: 'participants', label: 'Peserta' },
  { id: 'tokens', label: 'Token' },
  { id: 'candidates', label: 'Calon' },
]

// Filtered registrations
const filteredRegistrations = computed(() => {
  if (filterStatus.value === 'all') return registrations.value
  return registrations.value.filter((r) => r.status === filterStatus.value)
})

// Initialize
onMounted(async () => {
  await checkAuth()
  await loadAllData()
})

// Check auth
const checkAuth = async () => {
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

// Load semua data
const loadAllData = async () => {
  try {
    // Load semua paralel
    const [sessionData, participantsData, tokensData, registrationsData] = await Promise.all([
      loadSession(),
      loadParticipants(),
      loadTokens(),
      loadRegistrations(),
    ])

    activeSession.value = sessionData
    participants.value = participantsData
    tokens.value = tokensData
    registrations.value = registrationsData

    // Hitung stats
    await calculateStats()
  } catch (error) {
    console.error('Load error:', error)
  }
}

// Load session
const loadSession = async () => {
  const { data } = await supabase
    .from('sesi_pemilihan')
    .select('*')
    .order('dibuat_pada', { ascending: false })
    .limit(1)
    .single()

  return data
}

// Load participants
const loadParticipants = async () => {
  const { data } = await supabase
    .from('pengguna')
    .select('*')
    .eq('peran', 'guru')
    .order('nama_lengkap', { ascending: true })

  return data || []
}

// Load tokens
const loadTokens = async () => {
  if (!activeSession.value?.id) return []

  const { data } = await supabase
    .from('token_qr')
    .select(
      `
      *,
      pengguna:pengguna_id (nama_lengkap)
    `,
    )
    .eq('sesi_id', activeSession.value.id)
    .order('dibuat_pada', { ascending: false })

  return data || []
}

// Load registrations
const loadRegistrations = async () => {
  if (!activeSession.value?.id) return []

  const { data } = await supabase
    .from('pendaftaran_kandidat')
    .select(
      `
      *,
      pengguna:pengguna_id (nama_lengkap, nip)
    `,
    )
    .eq('sesi_id', activeSession.value.id)
    .order('dibuat_pada', { ascending: false })

  return data || []
}

// Calculate stats
const calculateStats = async () => {
  // Total guru
  const totalGuru = participants.value.length

  // Count votes
  let votedCount = 0
  if (activeSession.value?.id) {
    const { data: votes } = await supabase
      .from('suara')
      .select('pemilih_id', { distinct: true })
      .eq('sesi_id', activeSession.value.id)
      .eq('is_draft', false)

    votedCount = votes?.length || 0
  }

  // Count pending candidates
  const pending = registrations.value.filter((r) => r.status === 'menunggu').length

  // Token stats
  const availableTokens = tokens.value.filter((t) => !t.sudah_digunakan).length

  stats.value = {
    totalGuru,
    votedCount,
    participationRate: totalGuru ? Math.round((votedCount / totalGuru) * 100) : 0,
    availableTokens,
  }

  candidateStats.value = { pending }
}

// ===== CRUD PARTICIPANTS =====

// Tambah peserta baru
const addParticipant = async () => {
  const nama = prompt('Nama lengkap peserta:')
  if (!nama || nama.trim() === '') return

  const nip = prompt('NIP peserta:')
  if (!nip || nip.trim() === '') return

  // Check NIP unik
  const { data: existing } = await supabase
    .from('pengguna')
    .select('id')
    .eq('nip', nip.trim())
    .single()

  if (existing) {
    alert('❌ NIP sudah terdaftar!')
    return
  }

  try {
    const { error } = await supabase.from('pengguna').insert({
      nip: nip.trim(),
      nama_lengkap: nama.trim(),
      peran: 'guru',
      tanggal_lahir: '2000-01-01',
      is_active: true,
    })

    if (error) throw error

    await loadAllData()
    alert('✅ Peserta berhasil ditambahkan!')
  } catch (error) {
    alert('❌ Gagal menambah peserta: ' + error.message)
  }
}

// Edit peserta
const editParticipant = async (participant) => {
  const newNama = prompt('Edit Nama:', participant.nama_lengkap)
  if (newNama === null || newNama.trim() === '') return

  const newNIP = prompt('Edit NIP:', participant.nip)
  if (newNIP === null || newNIP.trim() === '') return

  // Check NIP unik (kalo berubah)
  if (newNIP !== participant.nip) {
    const { data: existing } = await supabase
      .from('pengguna')
      .select('id')
      .eq('nip', newNIP.trim())
      .neq('id', participant.id)
      .single()

    if (existing) {
      alert('❌ NIP sudah digunakan peserta lain!')
      return
    }
  }

  try {
    const { error } = await supabase
      .from('pengguna')
      .update({
        nama_lengkap: newNama.trim(),
        nip: newNIP.trim(),
        diperbarui_pada: new Date().toISOString(),
      })
      .eq('id', participant.id)

    if (error) throw error

    // Update local data
    participant.nama_lengkap = newNama.trim()
    participant.nip = newNIP.trim()

    alert('✅ Data peserta berhasil diperbarui!')
  } catch (error) {
    alert('❌ Gagal update: ' + error.message)
  }
}

// Toggle status aktif/nonaktif
const toggleParticipant = async (participant) => {
  const action = participant.is_active ? 'menonaktifkan' : 'mengaktifkan'
  if (!confirm(`${action} ${participant.nama_lengkap}?`)) return

  try {
    const { error } = await supabase
      .from('pengguna')
      .update({
        is_active: !participant.is_active,
        diperbarui_pada: new Date().toISOString(),
      })
      .eq('id', participant.id)

    if (error) throw error

    participant.is_active = !participant.is_active
    alert(`✅ Status ${participant.nama_lengkap} berhasil diubah!`)
  } catch (error) {
    alert('❌ Gagal mengubah status: ' + error.message)
  }
}

// Hapus peserta
const deleteParticipant = async (participant) => {
  if (!confirm(`Hapus ${participant.nama_lengkap}? Data akan dihapus permanen!`)) return

  // Cek apakah sudah voting
  if (participant.has_voted) {
    if (!confirm('⚠️ Peserta ini sudah voting. Yakin tetap menghapus?')) return
  }

  try {
    const { error } = await supabase.from('pengguna').delete().eq('id', participant.id)

    if (error) throw error

    await loadAllData()
    alert('✅ Peserta berhasil dihapus!')
  } catch (error) {
    alert('❌ Gagal menghapus: ' + error.message)
  }
}

// ===== SESSION ACTIONS =====
const createSession = async () => {
  const namaSesi = prompt('Nama sesi baru:')
  const tahunAjaran = prompt('Tahun ajaran:')

  if (!namaSesi || !tahunAjaran) return

  const { error } = await supabase.from('sesi_pemilihan').insert({
    nama_sesi: namaSesi,
    tahun_ajaran: tahunAjaran,
    status: 'draft',
    dibuat_oleh: adminUser.value.id,
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

  activeSession.value.status = status
  alert('✅ Berhasil!')
}

const openVoting = async () => {
  if (!confirm('Buka voting dan generate token untuk semua guru?')) return

  // Update status
  await updateSession('voting')

  // Generate tokens
  await generateTokens()
}

const generateTokens = async () => {
  try {
    // Generate untuk semua guru
    const tokensToInsert = []
    for (const guru of participants.value) {
      const token = Math.floor(100000 + Math.random() * 900000).toString()
      tokensToInsert.push({
        pengguna_id: guru.id,
        sesi_id: activeSession.value.id,
        token: token,
        tipe_token: 'voting',
        kadaluarsa_pada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    // Insert semua token
    const { error } = await supabase.from('token_qr').insert(tokensToInsert)

    if (error) throw error

    await loadTokens()
    alert(`✅ ${participants.value.length} token berhasil dibuat!`)
  } catch (error) {
    alert('❌ Gagal generate token: ' + error.message)
  }
}

const resetSession = async () => {
  if (!confirm('Reset sesi? Semua data voting akan dihapus.')) return

  try {
    if (activeSession.value?.id) {
      await supabase.from('token_qr').delete().eq('sesi_id', activeSession.value.id)
      await supabase.from('suara').delete().eq('sesi_id', activeSession.value.id)
    }

    await updateSession('draft')
    alert('✅ Sesi berhasil direset!')
  } catch (error) {
    alert('❌ Gagal reset: ' + error.message)
  }
}

// ===== CANDIDATE ACTIONS =====
const approveCandidate = async (r) => {
  if (!confirm(`Setujui ${r.pengguna?.nama_lengkap} sebagai calon?`)) return

  try {
    const { error } = await supabase
      .from('pendaftaran_kandidat')
      .update({
        status: 'disetujui',
        ditinjau_pada: new Date().toISOString(),
      })
      .eq('id', r.id)

    if (error) throw error

    r.status = 'disetujui'
    candidateStats.value.pending--
    alert('✅ Calon berhasil disetujui!')
  } catch (error) {
    alert('❌ Gagal: ' + error.message)
  }
}

const rejectCandidate = async (r) => {
  const reason = prompt('Alasan penolakan:')
  if (!reason) return

  try {
    const { error } = await supabase
      .from('pendaftaran_kandidat')
      .update({
        status: 'ditolak',
        alasan_ditolak: reason,
        ditinjau_pada: new Date().toISOString(),
      })
      .eq('id', r.id)

    if (error) throw error

    r.status = 'ditolak'
    candidateStats.value.pending--
    alert('✅ Calon berhasil ditolak!')
  } catch (error) {
    alert('❌ Gagal: ' + error.message)
  }
}

// ===== HELPERS =====
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID')
}

const formatJabatan = (jabatan) => {
  const map = {
    humas: 'Waka Humas',
    sarpras: 'Waka Sarana Prasarana',
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

const getStatusLabel = (status) => {
  const map = {
    menunggu: 'MENUNGGU',
    disetujui: 'DISETUJUI',
    ditolak: 'DITOLAK',
  }
  return map[status] || status
}

const copyToken = (token) => {
  navigator.clipboard.writeText(token)
  alert('Token disalin: ' + token)
}

// Logout
const logout = () => {
  localStorage.removeItem('smanda_admin')
  router.push('/admin-login')
}
</script>

<style scoped>
/* ===== DASHBOARD STYLES ===== */
.admin-dashboard {
  padding: 1rem;
  background: #f8fafc;
  min-height: 100vh;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.header-left h1 {
  margin: 0 0 0.5rem 0;
  color: #1e3a8a;
  font-size: 1.8rem;
}

.header-left p {
  margin: 0;
  color: #64748b;
  font-size: 1rem;
}

/* Admin badge - HIGH CONTRAST */
.admin-badge {
  background: #1e3a8a;
  color: white;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1.1rem;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(30, 58, 138, 0.3);
}

.logout-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #b91c1b;
  transform: translateY(-1px);
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.stat-content h3 {
  margin: 0 0 0.5rem 0;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 600;
}

.stat-number {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: #1e3a8a;
  line-height: 1;
}

.stat-percentage {
  margin: 0.25rem 0 0 0;
  color: #10b981;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Session Card */
.session-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.session-card h2 {
  margin: 0 0 1rem 0;
  color: #1e3a8a;
  font-size: 1.3rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f1f5f9;
}

.session-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
}

.status-badge.draft {
  background: #f1f5f9;
  color: #64748b;
}
.status-badge.pendaftaran {
  background: #fef3c7;
  color: #92400e;
}
.status-badge.voting {
  background: #d1fae5;
  color: #065f46;
}
.status-badge.selesai {
  background: #dcfce7;
  color: #166534;
  border: 2px solid #22c55e;
}
.status-badge.menunggu {
  background: #fef3c7;
  color: #92400e;
}
.status-badge.disetujui {
  background: #d1fae5;
  color: #065f46;
}
.status-badge.ditolak {
  background: #fee2e2;
  color: #991b1b;
}

.session-name {
  color: #374151;
  font-weight: 600;
  font-size: 1.1rem;
}

.session-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: #1e3a8a;
  color: white;
}
.btn-success {
  background: #10b981;
  color: white;
}
.btn-warning {
  background: #f59e0b;
  color: white;
}
.btn-danger {
  background: #dc2626;
  color: white;
}

/* Tabs */
.tabs {
  display: flex;
  background: white;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  border-bottom: none;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  background: #f8fafc;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  color: #64748b;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f1f5f9;
  color: #1e3a8a;
}

.tab-btn.active {
  background: white;
  color: #1e3a8a;
  border-bottom: 3px solid #1e3a8a;
}

/* Tab Content */
.tab-content {
  background: white;
  padding: 1.5rem;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  border-top: none;
  min-height: 400px;
}

/* Pane Header */
.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
}

.pane-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pane-header h3 {
  margin: 0;
  color: #1e3a8a;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count-badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* BUTTON TAMBAH PESERTA - JELAS BANGET */
.btn-add {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
  transition: all 0.2s;
  border: 2px solid white;
}

.btn-add:hover {
  background: linear-gradient(135deg, #0da271, #10b981);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4);
}

.btn-icon {
  font-size: 1.2rem;
}

/* ===== TABLE STYLES - FULL WIDTH ===== */
.table-container {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

th {
  background: #f8fafc;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
  position: sticky;
  top: 0;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
  vertical-align: middle;
}

tr:hover {
  background: #f9fafb;
}

/* Column widths */
th:nth-child(1),
td:nth-child(1) {
  width: 60px;
} /* No */
th:nth-child(2),
td:nth-child(2) {
  width: 25%;
} /* Nama */
th:nth-child(3),
td:nth-child(3) {
  width: 20%;
} /* NIP */
th:nth-child(4),
td:nth-child(4) {
  width: 15%;
} /* Status */
th:nth-child(5),
td:nth-child(5) {
  width: 10%;
} /* Voting */
th:nth-child(6),
td:nth-child(6) {
  width: 30%;
} /* Aksi */

.text-center {
  text-align: center;
}

/* Nama cell */
.name-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 250px;
  font-weight: 500;
  color: #1e3a8a;
}

/* NIP & Token */
.nip,
.token {
  font-family: 'SF Mono', 'Courier New', monospace;
  font-size: 0.9rem;
  color: #4b5563;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.token-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.7;
  padding: 0.25rem;
}

.copy-btn:hover {
  opacity: 1;
}

/* Status badges */
.status-badge-small {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge-small.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge-small.inactive {
  background: #f1f5f9;
  color: #64748b;
}

/* Vote indicator */
.vote-indicator {
  font-size: 1.2rem;
  display: inline-block;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vote-indicator.voted {
  background: #d1fae5;
  color: #065f46;
}

.vote-indicator.not-voted {
  background: #fef3c7;
  color: #92400e;
}

/* Token status */
.token-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.token-status.available {
  background: #d1fae5;
  color: #065f46;
}

.token-status.used {
  background: #dbeafe;
  color: #1e40af;
}

/* Action buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-action:hover {
  transform: translateY(-1px);
}

.btn-action.edit {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.btn-action.toggle {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.btn-action.delete {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-action.approve {
  background: #10b981;
  color: white;
  border: 1px solid #0da271;
}

.btn-action.reject {
  background: #ef4444;
  color: white;
  border: 1px solid #dc2626;
}

/* Filter bar */
.filter-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.95rem;
}

.filter-count {
  color: #64748b;
  font-size: 0.9rem;
}

/* Registrations */
.registrations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.registration-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: white;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.2s;
}

.registration-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.registration-card.menunggu {
  border-left: 4px solid #f59e0b;
}

.registration-card.disetujui {
  border-left: 4px solid #10b981;
}

.registration-card.ditolak {
  border-left: 4px solid #ef4444;
}

.candidate-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.candidate-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.candidate-details h4 {
  margin: 0 0 0.25rem 0;
  color: #1e3a8a;
  font-size: 1.1rem;
}

.candidate-nip,
.candidate-position {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.candidate-position {
  font-weight: 500;
  color: #4b5563;
}

.registration-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.registration-actions {
  display: flex;
  gap: 0.5rem;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.hint {
  color: #9ca3af;
  font-size: 0.9rem;
  font-style: italic;
  margin-top: 0.5rem;
}

/* Floating Add Button */
.floating-add-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 50px;
  font-weight: bold;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.4);
  z-index: 1000;
  border: 3px solid white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  display: none; /* Hide by default, show on mobile */
}

.floating-add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(30, 58, 138, 0.5);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 0.5rem;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
    padding: 1rem;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1.25rem;
  }

  .pane-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .pane-title {
    justify-content: space-between;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .session-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .tabs {
    flex-wrap: wrap;
  }

  .tab-btn {
    min-width: calc(50% - 1px);
    font-size: 0.9rem;
    padding: 0.75rem 0.5rem;
  }

  .tab-content {
    padding: 1rem;
  }

  /* Table responsive */
  .table-container {
    margin: 0 -0.5rem;
    width: calc(100% + 1rem);
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  /* Adjust column widths for mobile */
  th:nth-child(1),
  td:nth-child(1) {
    width: 50px;
  }
  th:nth-child(2),
  td:nth-child(2) {
    width: 22%;
    max-width: 150px;
  }
  th:nth-child(3),
  td:nth-child(3) {
    width: 25%;
  }
  th:nth-child(4),
  td:nth-child(4) {
    width: 18%;
  }
  th:nth-child(5),
  td:nth-child(5) {
    width: 10%;
  }
  th:nth-child(6),
  td:nth-child(6) {
    width: 25%;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }

  .btn-action {
    width: 100%;
    justify-content: center;
    padding: 0.5rem;
  }

  /* Show floating button on mobile */
  .floating-add-btn {
    display: flex;
  }

  /* Registration card responsive */
  .registration-card {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .registration-right {
    align-items: stretch;
  }

  .registration-actions {
    justify-content: stretch;
  }

  .btn-action.approve,
  .btn-action.reject {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .tab-btn {
    min-width: 100%;
    font-size: 0.85rem;
    padding: 0.75rem;
  }

  .admin-badge {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }

  .logout-btn {
    padding: 0.5rem 1rem;
  }

  .floating-add-btn {
    bottom: 1rem;
    right: 1rem;
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
  }
}
</style>
