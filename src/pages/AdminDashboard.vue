<template>
  <div class="admin-dashboard">
    <!-- Header -->
    <div class="admin-header">
      <div class="header-left">
        <h1>Dashboard Admin</h1>
        <p>Panel Kontrol Sistem Voting SMANDA</p>
      </div>
      <div class="header-right">
        <div class="admin-info">
          <span>{{ adminUser?.nama_lengkap }}</span>
          <span class="role-badge">{{ adminUser?.peran }}</span>
        </div>
        <button @click="handleLogout" class="logout-btn">Logout</button>
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

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>Memuat data...</p>
    </div>

    <!-- Tab Content -->
    <div v-else class="tab-content">
      <!-- TAB 1: Daftar Calon -->
      <div v-if="activeTab === 'calon'" class="tab-pane">
        <div class="section-header">
          <h2>Verifikasi Calon Kandidat</h2>
          <div class="section-actions">
            <div class="filter-group">
              <label>Filter Jabatan:</label>
              <select v-model="filterJabatan" @change="loadCandidates">
                <option value="">Semua Jabatan</option>
                <option value="humas">Waka Humas</option>
                <option value="sarpras">Waka Sarana Prasarana</option>
                <option value="kesiswaan">Waka Kesiswaan</option>
                <option value="kurikulum">Waka Kurikulum</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Filter Status:</label>
              <select v-model="filterStatus" @change="loadCandidates">
                <option value="">Semua Status</option>
                <option value="menunggu">Menunggu</option>
                <option value="disetujui">Disetujui</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">Total Calon</div>
          </div>
          <div class="stat-card pending">
            <div class="stat-number">{{ stats.menunggu }}</div>
            <div class="stat-label">Menunggu</div>
          </div>
          <div class="stat-card approved">
            <div class="stat-number">{{ stats.disetujui }}</div>
            <div class="stat-label">Disetujui</div>
          </div>
          <div class="stat-card rejected">
            <div class="stat-number">{{ stats.ditolak }}</div>
            <div class="stat-label">Ditolak</div>
          </div>
        </div>

        <!-- Candidates Table -->
        <div class="table-container">
          <table class="candidates-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Calon</th>
                <th>Jabatan</th>
                <th>Status</th>
                <th>Tanggal Daftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(candidate, index) in candidates" :key="candidate.id">
                <td>{{ index + 1 }}</td>
                <td>
                  <div class="candidate-name">
                    <strong>{{ candidate.pengguna.nama_lengkap }}</strong>
                    <small>NIP: {{ candidate.pengguna.nip }}</small>
                  </div>
                </td>
                <td>
                  <span class="jabatan-badge">{{ formatJabatan(candidate.jabatan_diajukan) }}</span>
                </td>
                <td>
                  <span :class="`status-badge ${candidate.status}`">
                    {{ candidate.status.toUpperCase() }}
                  </span>
                </td>
                <td>{{ formatDate(candidate.dibuat_pada) }}</td>
                <td>
                  <div class="action-buttons">
                    <button
                      v-if="candidate.status === 'menunggu'"
                      @click="openDetailModal(candidate)"
                      class="btn-view"
                      title="Lihat Detail"
                    >
                      👁️ Lihat
                    </button>
                    <button
                      v-if="candidate.status === 'menunggu'"
                      @click="approveCandidate(candidate.id)"
                      class="btn-approve"
                      title="Setujui"
                    >
                      ✅ Approve
                    </button>
                    <button
                      v-if="candidate.status === 'menunggu'"
                      @click="openRejectModal(candidate)"
                      class="btn-reject"
                      title="Tolak"
                    >
                      ❌ Reject
                    </button>
                    <span v-else class="no-action"> Sudah diproses </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="candidates.length === 0" class="empty-state">
            <p>Tidak ada data calon</p>
          </div>
        </div>
      </div>

      <!-- TAB 2: Kelola Sesi -->
      <div v-else-if="activeTab === 'sesi'" class="tab-pane">
        <h2>Kelola Sesi Pemilihan</h2>
        <div class="session-management">
          <div class="session-card">
            <h3>Sesi Aktif</h3>
            <div v-if="activeSession" class="session-info">
              <p>
                <strong>{{ activeSession.nama_sesi }}</strong>
              </p>
              <p>Tahun Ajaran: {{ activeSession.tahun_ajaran }}</p>
              <p>
                Status:
                <select v-model="activeSession.status" @change="updateSessionStatus">
                  <option value="draft">Draft</option>
                  <option value="pendaftaran">Pendaftaran</option>
                  <option value="voting">Voting</option>
                  <option value="selesai">Selesai</option>
                </select>
              </p>
              <p>Pendaftaran: {{ formatDate(activeSession.waktu_selesai_pendaftaran) }}</p>
              <p>
                Voting: {{ formatDate(activeSession.waktu_mulai_voting) }} -
                {{ formatDate(activeSession.waktu_selesai_voting) }}
              </p>
            </div>
            <p v-else>Tidak ada sesi aktif</p>
          </div>

          <div class="session-actions">
            <button @click="createNewSession" class="btn-primary">Buat Sesi Baru</button>
            <button @click="resetSimulation" class="btn-danger">Reset Data Simulasi</button>
          </div>
        </div>
      </div>

      <!-- TAB 3: Generate QR -->
      <div v-else-if="activeTab === 'qr'" class="tab-pane">
        <h2>Generate QR Tokens</h2>
        <div class="qr-generator">
          <div class="qr-stats">
            <p>
              Total Guru/Staff: <strong>{{ totalUsers }}</strong>
            </p>
            <p>
              Token Tergenerate: <strong>{{ generatedTokens }}</strong>
            </p>
            <p>
              Token Belum Digunakan: <strong>{{ unusedTokens }}</strong>
            </p>
          </div>

          <div class="qr-actions">
            <button @click="generateQRTokens" class="btn-primary" :disabled="generatingTokens">
              {{ generatingTokens ? 'Sedang generate...' : 'Generate QR Tokens' }}
            </button>
            <button @click="exportTokens" class="btn-secondary">Export ke CSV</button>
          </div>

          <div v-if="recentTokens.length > 0" class="recent-tokens">
            <h4>Token Terbaru:</h4>
            <ul>
              <li v-for="token in recentTokens" :key="token.id">
                {{ token.pengguna.nama_lengkap }}: {{ token.token }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- TAB 4: Monitoring -->
      <div v-else-if="activeTab === 'monitor'" class="tab-pane">
        <h2>Live Monitoring</h2>
        <div class="monitoring">
          <div class="monitor-stats">
            <div class="monitor-card">
              <div class="monitor-number">{{ totalVoters }}</div>
              <div class="monitor-label">Total Pemilih</div>
            </div>
            <div class="monitor-card">
              <div class="monitor-number">{{ votedCount }}</div>
              <div class="monitor-label">Sudah Voting</div>
            </div>
            <div class="monitor-card">
              <div class="monitor-number">{{ participationRate }}%</div>
              <div class="monitor-label">Partisipasi</div>
            </div>
          </div>

          <div class="monitor-progress">
            <h4>Progress Voting:</h4>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: participationRate + '%' }"></div>
            </div>
            <p>{{ votedCount }} dari {{ totalVoters }} guru sudah voting</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Detail Calon -->
    <div v-if="showDetailModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Detail Calon Kandidat</h3>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedCandidate" class="candidate-detail">
            <div class="detail-row">
              <label>Nama:</label>
              <span>{{ selectedCandidate.pengguna.nama_lengkap }}</span>
            </div>
            <div class="detail-row">
              <label>NIP:</label>
              <span>{{ selectedCandidate.pengguna.nip }}</span>
            </div>
            <div class="detail-row">
              <label>Jabatan Diajukan:</label>
              <span>{{ formatJabatan(selectedCandidate.jabatan_diajukan) }}</span>
            </div>
            <div class="detail-row">
              <label>Status:</label>
              <span :class="`status-badge ${selectedCandidate.status}`">
                {{ selectedCandidate.status.toUpperCase() }}
              </span>
            </div>
            <div class="detail-row">
              <label>Visi & Misi:</label>
              <div class="visi-misi">
                {{ selectedCandidate.visi_misi }}
              </div>
            </div>
            <div v-if="selectedCandidate.foto_kampanye" class="detail-row">
              <label>Foto Kampanye:</label>
              <img :src="selectedCandidate.foto_kampanye" alt="Foto" class="candidate-photo" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-cancel">Tutup</button>
        </div>
      </div>
    </div>

    <!-- Modal: Reject dengan Alasan -->
    <div v-if="showRejectModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Tolak Pendaftaran</h3>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedCandidate" class="reject-form">
            <p>Anda akan menolak pendaftaran:</p>
            <p>
              <strong>{{ selectedCandidate.pengguna.nama_lengkap }}</strong>
            </p>
            <p>Jabatan: {{ formatJabatan(selectedCandidate.jabatan_diajukan) }}</p>

            <div class="form-group">
              <label>Alasan Penolakan:</label>
              <textarea
                v-model="rejectReason"
                rows="4"
                placeholder="Masukkan alasan penolakan..."
                required
              ></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-cancel">Batal</button>
          <button @click="confirmReject" :disabled="!rejectReason.trim()" class="btn-reject">
            Tolak Pendaftaran
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()

// State
const adminUser = ref(null)
const loading = ref(true)
const activeTab = ref('calon')
const candidates = ref([])
const activeSession = ref(null)
const stats = ref({ total: 0, menunggu: 0, disetujui: 0, ditolak: 0 })
const filterJabatan = ref('')
const filterStatus = ref('')
const showDetailModal = ref(false)
const showRejectModal = ref(false)
const selectedCandidate = ref(null)
const rejectReason = ref('')
const totalUsers = ref(0)
const generatedTokens = ref(0)
const unusedTokens = ref(0)
const generatingTokens = ref(false)
const recentTokens = ref([])
const totalVoters = ref(0)
const votedCount = ref(0)
const participationRate = ref(0)

// Tabs
const tabs = ref([
  { id: 'calon', label: 'Verifikasi Calon', badge: null },
  { id: 'sesi', label: 'Kelola Sesi', badge: null },
  { id: 'qr', label: 'Generate QR', badge: null },
  { id: 'monitor', label: 'Live Monitor', badge: null },
])

// Load admin data
onMounted(async () => {
  await loadAdminData()
  await loadCandidates()
  await loadSessionData()
  await loadStats()
})

const loadAdminData = () => {
  const adminSession = localStorage.getItem('smanda_admin')
  if (!adminSession) {
    router.push('/admin-login')
    return
  }

  try {
    adminUser.value = JSON.parse(adminSession).user
  } catch (err) {
    console.error('Error parsing admin session:', err)
    router.push('/admin-login')
  }
}

const loadCandidates = async () => {
  loading.value = true

  try {
    let query = supabase
      .from('pendaftaran_kandidat')
      .select(
        `
        *,
        pengguna (*),
        sesi_pemilihan (*)
      `,
      )
      .order('dibuat_pada', { ascending: false })

    // Apply filters
    if (filterJabatan.value) {
      query = query.eq('jabatan_diajukan', filterJabatan.value)
    }

    if (filterStatus.value) {
      query = query.eq('status', filterStatus.value)
    }

    const { data, error } = await query

    if (error) throw error

    candidates.value = data || []
    updateStats(data || [])
  } catch (err) {
    console.error('Error loading candidates:', err)
    alert('Gagal memuat data calon: ' + err.message)
  } finally {
    loading.value = false
  }
}

const loadSessionData = async () => {
  try {
    const { data, error } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .order('dibuat_pada', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

    activeSession.value = data
  } catch (err) {
    console.error('Error loading session:', err)
  }
}

const loadStats = async () => {
  try {
    // Count total users
    const { count: userCount } = await supabase
      .from('pengguna')
      .select('*', { count: 'exact', head: true })
      .eq('peran', 'guru')

    totalUsers.value = userCount || 0

    // Count tokens
    const { count: tokenCount } = await supabase
      .from('token_qr')
      .select('*', { count: 'exact', head: true })

    generatedTokens.value = tokenCount || 0

    const { count: unusedCount } = await supabase
      .from('token_qr')
      .select('*', { count: 'exact', head: true })
      .eq('sudah_digunakan', false)

    unusedTokens.value = unusedCount || 0

    // Get recent tokens
    const { data: tokens } = await supabase
      .from('token_qr')
      .select('*, pengguna(*)')
      .order('dibuat_pada', { ascending: false })
      .limit(5)

    recentTokens.value = tokens || []

    // Voting stats
    totalVoters.value = userCount || 0

    const { count: voted } = await supabase
      .from('suara')
      .select('pemilih_id', { count: 'exact', head: true })
      .eq('is_draft', false)

    votedCount.value = voted || 0
    participationRate.value =
      totalVoters.value > 0 ? Math.round((votedCount.value / totalVoters.value) * 100) : 0
  } catch (err) {
    console.error('Error loading stats:', err)
  }
}

const updateStats = (data) => {
  stats.value = {
    total: data.length,
    menunggu: data.filter((d) => d.status === 'menunggu').length,
    disetujui: data.filter((d) => d.status === 'disetujui').length,
    ditolak: data.filter((d) => d.status === 'ditolak').length,
  }

  // Update tab badge
  const calonTab = tabs.value.find((t) => t.id === 'calon')
  if (calonTab) {
    calonTab.badge = stats.value.menunggu > 0 ? stats.value.menunggu : null
  }
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

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const openDetailModal = (candidate) => {
  selectedCandidate.value = candidate
  showDetailModal.value = true
}

const openRejectModal = (candidate) => {
  selectedCandidate.value = candidate
  rejectReason.value = ''
  showRejectModal.value = true
}

const closeModal = () => {
  showDetailModal.value = false
  showRejectModal.value = false
  selectedCandidate.value = null
  rejectReason.value = ''
}

const approveCandidate = async (candidateId) => {
  if (!confirm('Setujui pendaftaran calon ini?')) return

  try {
    const { error } = await supabase
      .from('pendaftaran_kandidat')
      .update({
        status: 'disetujui',
        disetujui_oleh: adminUser.value.id,
        ditinjau_pada: new Date().toISOString(),
      })
      .eq('id', candidateId)

    if (error) throw error

    alert('Calon berhasil disetujui!')
    loadCandidates()
    loadStats()
  } catch (err) {
    console.error('Error approving candidate:', err)
    alert('Gagal menyetujui calon: ' + err.message)
  }
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    alert('Harap masukkan alasan penolakan')
    return
  }

  if (!confirm('Tolak pendaftaran calon ini?')) return

  try {
    const { error } = await supabase
      .from('pendaftaran_kandidat')
      .update({
        status: 'ditolak',
        alasan_ditolak: rejectReason.value,
        disetujui_oleh: adminUser.value.id,
        ditinjau_pada: new Date().toISOString(),
      })
      .eq('id', selectedCandidate.value.id)

    if (error) throw error

    alert('Calon berhasil ditolak!')
    closeModal()
    loadCandidates()
    loadStats()
  } catch (err) {
    console.error('Error rejecting candidate:', err)
    alert('Gagal menolak calon: ' + err.message)
  }
}

const updateSessionStatus = async () => {
  if (!activeSession.value) return

  try {
    const { error } = await supabase
      .from('sesi_pemilihan')
      .update({
        status: activeSession.value.status,
        diperbarui_pada: new Date().toISOString(),
      })
      .eq('id', activeSession.value.id)

    if (error) throw error

    alert('Status sesi berhasil diupdate!')
  } catch (err) {
    console.error('Error updating session:', err)
    alert('Gagal update status sesi: ' + err.message)
  }
}

const generateQRTokens = async () => {
  if (!confirm('Generate QR tokens untuk semua guru? Token lama akan dihapus.')) return

  generatingTokens.value = true

  try {
    // 1. Hapus token lama
    const { error: deleteError } = await supabase
      .from('token_qr')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // dummy condition

    if (deleteError) throw deleteError

    // 2. Ambil semua guru
    const { data: users, error: usersError } = await supabase
      .from('pengguna')
      .select('id')
      .eq('peran', 'guru')
      .eq('is_active', true)

    if (usersError) throw usersError

    if (!users || users.length === 0) {
      alert('Tidak ada guru yang aktif')
      return
    }

    // 3. Generate token untuk setiap guru
    const tokens = users.map((user) => ({
      pengguna_id: user.id,
      sesi_id: activeSession.value?.id || null,
      token: generateRandomToken(),
      kadaluarsa_pada:
        activeSession.value?.waktu_selesai_voting ||
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      dibuat_oleh: adminUser.value.id,
    }))

    // 4. Insert ke database
    const { error: insertError } = await supabase.from('token_qr').insert(tokens)

    if (insertError) throw insertError

    alert(`Berhasil generate ${tokens.length} QR tokens!`)
    loadStats()
  } catch (err) {
    console.error('Error generating tokens:', err)
    alert('Gagal generate tokens: ' + err.message)
  } finally {
    generatingTokens.value = false
  }
}

const generateRandomToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

const exportTokens = () => {
  alert('Fitur export akan segera tersedia!')
}

const createNewSession = () => {
  alert('Fitur buat sesi baru akan segera tersedia!')
}

const resetSimulation = () => {
  if (!confirm('Reset semua data simulasi? Tindakan ini tidak dapat dibatalkan!')) return
  alert('Fitur reset simulasi akan segera tersedia!')
}

const handleLogout = () => {
  localStorage.removeItem('smanda_admin')
  localStorage.removeItem('smanda_user')
  localStorage.removeItem('smanda_session')
  router.push('/')
}
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: #f8f9fa;
}

.admin-header {
  background: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h1 {
  color: #1e3a8a;
  margin-bottom: 0.25rem;
}

.header-left p {
  color: #666;
  font-size: 0.9rem;
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
  border-radius: 6px;
}

.role-badge {
  background: #1e3a8a;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
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

.tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 2rem;
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
  position: relative;
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

.loading {
  padding: 3rem;
  text-align: center;
  color: #64748b;
}

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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  color: #1e3a8a;
}

.section-actions {
  display: flex;
  gap: 1rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #4b5563;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card.pending {
  border-top: 4px solid #f59e0b;
}

.stat-card.approved {
  border-top: 4px solid #10b981;
}

.stat-card.rejected {
  border-top: 4px solid #ef4444;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1e3a8a;
}

.stat-label {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.candidates-table {
  width: 100%;
  border-collapse: collapse;
}

.candidates-table th {
  background: #f8fafc;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #4b5563;
  border-bottom: 1px solid #e2e8f0;
}

.candidates-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.candidates-table tr:hover {
  background: #f8fafc;
}

.candidate-name {
  display: flex;
  flex-direction: column;
}

.candidate-name small {
  color: #64748b;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.jabatan-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
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

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-buttons button {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
}

.btn-view {
  background: #3b82f6;
  color: white;
}

.btn-approve {
  background: #10b981;
  color: white;
}

.btn-reject {
  background: #ef4444;
  color: white;
}

.no-action {
  color: #9ca3af;
  font-size: 0.85rem;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #9ca3af;
}

/* Modal Styles */
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
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #1e3a8a;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem;
}

.candidate-detail .detail-row {
  margin-bottom: 1rem;
  display: flex;
  align-items: flex-start;
}

.candidate-detail label {
  font-weight: 600;
  min-width: 150px;
  color: #4b5563;
}

.candidate-detail span {
  flex: 1;
}

.visi-misi {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  white-space: pre-wrap;
  line-height: 1.6;
}

.candidate-photo {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  margin-top: 0.5rem;
}

.reject-form .form-group {
  margin-top: 1rem;
}

.reject-form textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  resize: vertical;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel,
.btn-reject {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel {
  background: #6b7280;
  color: white;
}

.btn-reject {
  background: #ef4444;
  color: white;
}

.btn-reject:disabled {
  background: #fca5a5;
  cursor: not-allowed;
}
</style>
