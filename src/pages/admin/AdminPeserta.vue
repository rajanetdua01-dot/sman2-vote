<template>
  <div class="simple-peserta">
    <!-- Header -->
    <div class="page-header">
      <h1>👥 Data Guru</h1>
      <button @click="$router.push('/admin')" class="back-btn">← Dashboard</button>
    </div>

    <!-- Quick Stats -->
    <div class="stats">
      <div class="stat">
        <div class="stat-number">{{ totalGuru }}</div>
        <div class="stat-label">Total Guru</div>
      </div>
      <div class="stat">
        <div class="stat-number">{{ activeGuru }}</div>
        <div class="stat-label">Aktif</div>
      </div>
      <div class="stat">
        <div class="stat-number">{{ sudahVoting }}</div>
        <div class="stat-label">Sudah Voting</div>
      </div>
    </div>

    <!-- Search & Add -->
    <div class="actions">
      <div class="search">
        <input
          v-model="searchQuery"
          placeholder="Cari nama, NIP, atau TTL..."
          class="search-input"
        />
        🔍
      </div>
      <button @click="addPeserta" class="btn-add">+ Tambah Guru</button>
    </div>

    <!-- Table -->
    <div class="table-compact">
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama</th>
            <th>NIP</th>
            <th>TTL</th>
            <th>Status</th>
            <th>Voting</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(guru, index) in filteredGuru" :key="guru.id">
            <td class="text-bold td-no">{{ index + 1 }}</td>
            <td class="td-nama">
              <span class="nama-text">{{ guru.nama_lengkap }}</span>
            </td>
            <td class="td-nip">
              <code class="nip-code">{{ guru.nip }}</code>
            </td>
            <td class="td-ttl">
              <span class="ttl-text">{{ formatDate(guru.tanggal_lahir) }}</span>
            </td>
            <td class="td-status">
              <span :class="['status-badge', guru.is_active ? 'active' : 'inactive']">
                {{ guru.is_active ? 'AKTIF' : 'NON' }}
              </span>
            </td>
            <td class="td-vote">
              <span :class="['vote-badge', hasVoted(guru.id) ? 'voted' : 'pending']">
                {{ hasVoted(guru.id) ? '✅' : '⏳' }}
                <span class="vote-text">{{ hasVoted(guru.id) ? 'Sudah' : 'Belum' }}</span>
              </span>
            </td>
            <td class="td-actions">
              <div class="action-buttons">
                <button @click="editPeserta(guru)" class="btn-action-sm" title="Edit">
                  <span class="action-icon">✏️</span>
                </button>
                <button
                  @click="toggleStatus(guru)"
                  class="btn-action-sm"
                  :title="guru.is_active ? 'Nonaktifkan' : 'Aktifkan'"
                >
                  <span class="action-icon">{{ guru.is_active ? '⏸️' : '▶️' }}</span>
                </button>
                <button @click="deletePeserta(guru)" class="btn-action-sm btn-delete" title="Hapus">
                  <span class="action-icon">🗑️</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredGuru.length === 0" class="empty">
        <p class="empty-text">Belum ada data guru</p>
        <button @click="addPeserta" class="btn-add">+ Tambah Guru Pertama</button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h3>{{ editing ? 'Edit Guru' : 'Tambah Guru Baru' }}</h3>

        <div class="form">
          <input
            v-model="form.nama_lengkap"
            placeholder="Nama lengkap *"
            required
            class="form-input"
          />
          <input v-model="form.nip" placeholder="NIP *" required class="form-input" />
          <input v-model="form.tanggal_lahir" type="date" required class="form-input" />
          <input
            v-model="form.email"
            placeholder="Email (opsional)"
            type="email"
            class="form-input"
          />

          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.is_active" class="checkbox" />
              <span class="checkbox-text">Status Aktif</span>
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeModal" class="btn-cancel">Batal</button>
          <button @click="savePeserta" class="btn-save">
            {{ editing ? 'Update' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'

// Data
const guruList = ref([])
const searchQuery = ref('')
const showModal = ref(false)
const editing = ref(false)
const activeSession = ref(null)
const votingStats = ref({}) // Cache untuk voting status

// Form
const form = ref({
  nama_lengkap: '',
  nip: '',
  tanggal_lahir: '',
  email: '',
  is_active: true,
})

// Load active session
const loadActiveSession = async () => {
  try {
    const { data } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .order('dibuat_pada', { ascending: false })
      .limit(1)
      .single()

    activeSession.value = data
    console.log('Active session:', data?.nama_sesi || 'No session')
  } catch (error) {
    console.error('Error loading active session:', error)
    activeSession.value = null
  }
}

// Load voting stats untuk semua guru
const loadVotingStats = async () => {
  if (!activeSession.value?.id) {
    console.log('No active session, skipping voting stats')
    votingStats.value = {}
    return
  }

  try {
    console.log('Loading voting stats for session:', activeSession.value.id)

    // Ambil semua pemilih yang sudah voting di sesi aktif
    const { data, error } = await supabase
      .from('suara')
      .select('pemilih_id')
      .eq('sesi_id', activeSession.value.id)
      .eq('is_draft', false)

    if (error) throw error

    // Reset dan isi cache
    votingStats.value = {}

    if (data && data.length > 0) {
      data.forEach((vote) => {
        votingStats.value[vote.pemilih_id] = true
      })
      console.log(`Found ${data.length} votes for session`)
    } else {
      console.log('No votes found for current session')
    }
  } catch (error) {
    console.error('Error loading voting stats:', error)
    votingStats.value = {}
  }
}

// Computed
const filteredGuru = computed(() => {
  if (!searchQuery.value) return guruList.value

  const query = searchQuery.value.toLowerCase()
  return guruList.value.filter(
    (guru) =>
      guru.nama_lengkap.toLowerCase().includes(query) ||
      guru.nip.toLowerCase().includes(query) ||
      formatDate(guru.tanggal_lahir).toLowerCase().includes(query),
  )
})

const totalGuru = computed(() => guruList.value.length)
const activeGuru = computed(() => guruList.value.filter((g) => g.is_active).length)

// FIXED: Real data dari cache votingStats
const sudahVoting = computed(() => {
  return Object.keys(votingStats.value).length
})

// Methods
const loadGuru = async () => {
  try {
    console.log('Loading guru data...')
    const { data, error } = await supabase
      .from('pengguna')
      .select('*')
      .eq('peran', 'guru')
      .order('nama_lengkap')

    if (error) throw error

    guruList.value = data || []
    console.log(`Loaded ${guruList.value.length} guru`)

    // Load voting stats setelah data guru dimuat
    await loadVotingStats()
  } catch (error) {
    console.error('Error loading guru:', error)
    alert('Gagal memuat data guru: ' + error.message)
    guruList.value = []
  }
}

// Check voting status dari cache
const hasVoted = (guruId) => {
  return !!votingStats.value[guruId]
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

const addPeserta = () => {
  editing.value = false
  form.value = {
    nama_lengkap: '',
    nip: '',
    tanggal_lahir: '',
    email: '',
    is_active: true,
  }
  showModal.value = true
}

const editPeserta = (guru) => {
  editing.value = true

  // Format tanggal untuk input type="date" (YYYY-MM-DD)
  let formattedDate = ''
  if (guru.tanggal_lahir) {
    try {
      const date = new Date(guru.tanggal_lahir)
      formattedDate = date.toISOString().split('T')[0]
    } catch {
      formattedDate = ''
    }
  }

  form.value = {
    ...guru,
    tanggal_lahir: formattedDate,
  }
  showModal.value = true
}

const deletePeserta = async (guru) => {
  if (
    !confirm(
      `Yakin hapus guru ${guru.nama_lengkap} (${guru.nip})?\n\nAksi ini tidak dapat dibatalkan!`,
    )
  ) {
    return
  }

  try {
    // Check if guru has voting records
    const { data: votingData, error: votingError } = await supabase
      .from('suara')
      .select('id')
      .eq('pemilih_id', guru.id)
      .limit(1)

    if (votingError) throw votingError

    if (votingData && votingData.length > 0) {
      alert(
        '❌ Guru tidak dapat dihapus karena sudah memiliki riwayat voting!\n\nGunakan fitur nonaktifkan saja.',
      )
      return
    }

    // Check if guru is registered as candidate
    const { data: kandidatData, error: kandidatError } = await supabase
      .from('kandidat')
      .select('id')
      .eq('pengguna_id', guru.id)
      .limit(1)

    if (kandidatError) throw kandidatError

    if (kandidatData && kandidatData.length > 0) {
      alert(
        '❌ Guru tidak dapat dihapus karena terdaftar sebagai kandidat!\n\nGunakan fitur nonaktifkan saja.',
      )
      return
    }

    // Check if guru has token
    const { data: tokenData, error: tokenError } = await supabase
      .from('token_qr')
      .select('id')
      .eq('pengguna_id', guru.id)
      .limit(1)

    if (tokenError) throw tokenError

    if (tokenData && tokenData.length > 0) {
      alert(
        '❌ Guru tidak dapat dihapus karena memiliki token voting!\n\nGunakan fitur nonaktifkan saja.',
      )
      return
    }

    // Delete the user
    const { error: deleteError } = await supabase.from('pengguna').delete().eq('id', guru.id)

    if (deleteError) throw deleteError

    // Refresh data
    await loadGuru()
    alert(`✅ Guru ${guru.nama_lengkap} berhasil dihapus!`)
  } catch (error) {
    console.error('Delete error:', error)
    alert('❌ Gagal menghapus guru: ' + error.message)
  }
}

const savePeserta = async () => {
  // Validasi required fields
  if (!form.value.nama_lengkap.trim()) {
    alert('Nama lengkap wajib diisi!')
    return
  }

  if (!form.value.nip.trim()) {
    alert('NIP wajib diisi!')
    return
  }

  if (!form.value.tanggal_lahir) {
    alert('Tanggal lahir wajib diisi!')
    return
  }

  try {
    // Check duplicate NIP (kecuali untuk edit)
    if (!editing.value) {
      const { data: existing, error: checkError } = await supabase
        .from('pengguna')
        .select('id')
        .eq('nip', form.value.nip)
        .single()

      if (checkError && checkError.code !== 'PGRST116') throw checkError // PGRST116 = no rows returned

      if (existing) {
        alert('❌ NIP sudah terdaftar!')
        return
      }
    } else {
      // Untuk edit, check NIP duplikat kecuali untuk diri sendiri
      const { data: existing, error: checkError } = await supabase
        .from('pengguna')
        .select('id')
        .eq('nip', form.value.nip)
        .neq('id', form.value.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') throw checkError

      if (existing) {
        alert('❌ NIP sudah digunakan oleh guru lain!')
        return
      }
    }

    // Prepare data untuk save
    const saveData = {
      nama_lengkap: form.value.nama_lengkap.trim(),
      nip: form.value.nip.trim(),
      tanggal_lahir: form.value.tanggal_lahir,
      email: form.value.email ? form.value.email.trim() : null,
      is_active: form.value.is_active,
      peran: 'guru',
    }

    let result
    if (editing.value) {
      result = await supabase.from('pengguna').update(saveData).eq('id', form.value.id)
    } else {
      result = await supabase.from('pengguna').insert([saveData])
    }

    if (result.error) throw result.error

    // Refresh data
    await loadGuru()
    closeModal()
    alert(`✅ Guru ${editing.value ? 'berhasil diupdate' : 'berhasil ditambahkan'}!`)
  } catch (error) {
    console.error('Save error:', error)
    alert('❌ Error: ' + error.message)
  }
}

const toggleStatus = async (guru) => {
  const newStatus = !guru.is_active
  const statusText = newStatus ? 'aktifkan' : 'nonaktifkan'

  if (!confirm(`Yakin ${statusText} guru ${guru.nama_lengkap}?`)) return

  try {
    const { error } = await supabase
      .from('pengguna')
      .update({ is_active: newStatus })
      .eq('id', guru.id)

    if (error) throw error

    await loadGuru()
    alert(`✅ Status ${guru.nama_lengkap} berhasil diubah!`)
  } catch (error) {
    console.error('Toggle status error:', error)
    alert('❌ Error: ' + error.message)
  }
}

const closeModal = () => {
  showModal.value = false
}

// Lifecycle
onMounted(async () => {
  console.log('AdminPeserta mounted')
  await loadActiveSession()
  await loadGuru()
})

// Expose untuk refresh dari luar jika perlu
defineExpose({
  refreshData: loadGuru,
})
</script>
<style scoped>
/* ============================================
   ULTRA COMPACT CSS
   ============================================ */

.simple-peserta {
  padding: 0.75rem;
  max-width: 1200px;
  margin: 0 auto;
  background: #ffffff;
  min-height: 100vh;
}

/* === HEADER === */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.page-header h1 {
  color: #000000;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.back-btn {
  background: #1e3a8a;
  border: 1px solid #1e3a8a;
  color: #ffffff;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
}

/* === STATS === */
.stats {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat {
  flex: 1;
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 800;
  color: #000000;
  margin-bottom: 0.15rem;
}

.stat-label {
  color: #374151;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* === ACTIONS === */
.actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  align-items: center;
}

.search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: white;
  padding: 0.35rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #d1d5db;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.85rem;
  color: #000000;
  font-weight: 500;
  padding: 0.25rem;
}

.search-input::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

.btn-add {
  background: #000000;
  color: #ffffff;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
}

/* === ULTRA COMPACT TABLE === */
.table-compact {
  background: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  font-size: 0.8rem;
}

.table-compact table {
  width: 100%;
  border-collapse: collapse;
}

.table-compact thead {
  background: #f8fafc;
  border-bottom: 2px solid #1e3a8a;
}

.table-compact th {
  padding: 0.35rem 0.5rem;
  text-align: left;
  color: #000000;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  border-right: 1px solid #e5e7eb;
}

.table-compact th:last-child {
  border-right: none;
}

.table-compact td {
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid #f3f4f6;
  color: #000000;
  font-weight: 500;
  line-height: 1.2;
  vertical-align: middle;
  border-right: 1px solid #f3f4f6;
}

.table-compact td:last-child {
  border-right: none;
}

.table-compact tr:hover td {
  background: #f8fafc;
}

/* Zebra striping */
.table-compact tr:nth-child(even) td {
  background: #fafafa;
}

.table-compact tr:nth-child(even):hover td {
  background: #f1f5f9;
}

/* COLUMN SPECIFIC STYLES */

/* No Column */
.td-no {
  text-align: center;
  font-weight: 700;
  color: #1e3a8a;
  width: 40px;
  padding: 0.3rem 0.25rem !important;
}

/* Nama Column */
.td-nama {
  font-weight: 600;
  white-space: nowrap;
  min-width: 140px;
}

.nama-text {
  font-size: 0.85rem;
}

/* NIP Column */
.td-nip {
  min-width: 100px;
}

.nip-code {
  font-family: 'SF Mono', 'Courier New', monospace;
  font-size: 0.75rem;
  color: #000000;
  font-weight: 600;
  background: #f8fafc;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  border: 1px solid #e2e8f0;
  display: inline-block;
}

/* TTL Column */
.td-ttl {
  min-width: 90px;
}

.ttl-text {
  font-size: 0.75rem;
  color: #4b5563;
  white-space: nowrap;
}

/* Status Column */
.status-badge {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border: 1px solid;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
  border-color: #86efac;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
}

/* Voting Column */
.vote-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.vote-text {
  font-size: 0.75rem;
  font-weight: 600;
}

.vote-badge.voted {
  color: #059669;
}

.vote-badge.pending {
  color: #d97706;
}

/* Action Column */
.td-actions {
  width: 110px;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

.btn-action-sm {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  cursor: pointer;
  color: #000000;
  font-weight: 600;
  transition: all 0.15s;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.btn-action-sm:hover {
  transform: translateY(-1px);
}

.btn-action-sm:first-child:hover {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-action-sm:nth-child(2):hover {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.btn-delete:hover {
  background: #dc2626 !important;
  color: white !important;
  border-color: #dc2626 !important;
}

.action-icon {
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* === EMPTY STATE === */
.empty {
  padding: 2rem;
  text-align: center;
  border-top: 1px dashed #d1d5db;
}

.empty-text {
  color: #000000;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
}

/* === MODAL === */
.modal {
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

.modal-content {
  background: white;
  border-radius: 6px;
  padding: 1.25rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #1e3a8a;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #000000;
  font-size: 1.1rem;
  font-weight: 700;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #1e3a8a;
}

/* FORM INPUTS */
.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}

.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #000000;
  background: white;
  font-weight: 500;
}

.form-input:focus {
  outline: none;
  border-color: #1e3a8a;
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #000000;
  font-weight: 500;
}

.checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #1e3a8a;
}

.checkbox-text {
  font-weight: 600;
  font-size: 0.85rem;
}

/* MODAL ACTIONS */
.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  background: #ffffff;
  border: 1px solid #dc2626;
  color: #dc2626;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
}

.btn-cancel:hover {
  background: #dc2626;
  color: white;
}

.btn-save {
  background: #000000;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
}

.btn-save:hover {
  background: #1e3a8a;
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .simple-peserta {
    padding: 0.5rem;
  }

  .stats {
    flex-direction: column;
  }

  .actions {
    flex-direction: column;
  }

  .search {
    width: 100%;
  }

  .table-compact {
    font-size: 0.75rem;
  }

  .table-compact th,
  .table-compact td {
    padding: 0.25rem 0.35rem;
  }

  .td-nama {
    min-width: 120px;
  }

  .td-nip {
    min-width: 80px;
  }

  .td-actions {
    width: 100px;
  }

  .btn-action-sm {
    width: 26px;
    height: 26px;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
    text-align: center;
  }

  .back-btn {
    width: 100%;
  }

  .modal-content {
    margin: 0.5rem;
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

/* PRINT STYLES */
@media print {
  .simple-peserta {
    background: white;
  }

  .page-header,
  .actions,
  .btn-action-sm {
    display: none;
  }

  .table-compact table {
    border: 1px solid #000000;
  }

  .table-compact th {
    background: #ffffff !important;
    color: #000000 !important;
    border-bottom: 1px solid #000000;
  }
}
</style>
