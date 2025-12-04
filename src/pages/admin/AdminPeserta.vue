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
        <input v-model="searchQuery" placeholder="Cari nama atau NIP..." class="search-input" />
        🔍
      </div>
      <button @click="addPeserta" class="btn-add">+ Tambah Guru</button>
    </div>

    <!-- Table -->
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
          <tr v-for="(guru, index) in filteredGuru" :key="guru.id">
            <td class="text-bold">{{ index + 1 }}</td>
            <td>
              <div class="nama">
                <div class="avatar">{{ getInitials(guru.nama_lengkap) }}</div>
                <span class="nama-text text-bold">{{ guru.nama_lengkap }}</span>
              </div>
            </td>
            <td>
              <code class="nip text-bold">{{ guru.nip }}</code>
            </td>
            <td>
              <span :class="['status', guru.is_active ? 'active' : 'inactive']">
                {{ guru.is_active ? 'AKTIF' : 'NONAKTIF' }}
              </span>
            </td>
            <td>
              <span :class="['vote', hasVoted(guru.id) ? 'voted' : 'pending']">
                {{ hasVoted(guru.id) ? '✅' : '⏳' }}
                <span class="vote-text text-bold">{{ hasVoted(guru.id) ? 'Sudah' : 'Belum' }}</span>
              </span>
            </td>
            <td>
              <button @click="editPeserta(guru)" class="btn-action" title="Edit">✏️</button>
              <button
                @click="toggleStatus(guru)"
                class="btn-action"
                :title="guru.is_active ? 'Nonaktifkan' : 'Aktifkan'"
              >
                {{ guru.is_active ? '⏸️' : '▶️' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredGuru.length === 0" class="empty">
        <p class="empty-text text-bold">Belum ada data guru</p>
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
            placeholder="Nama lengkap"
            required
            class="form-input"
          />
          <input v-model="form.nip" placeholder="NIP" required class="form-input" />
          <input
            v-model="form.email"
            placeholder="Email (opsional)"
            type="email"
            class="form-input"
          />

          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.is_active" class="checkbox" />
              <span class="checkbox-text text-bold">Status Aktif</span>
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
/* Script tetap sama seperti sebelumnya */
import { ref, computed, onMounted } from 'vue'
// REMOVED: import { useRouter } from 'vue-router'  // ← Tidak perlu ini
import { supabase } from '@/utils/supabase'

// REMOVED: const router = useRouter()  // ← Tidak perlu ini

// Data
const guruList = ref([])
const searchQuery = ref('')
const showModal = ref(false)
const editing = ref(false)

// Form
const form = ref({
  nama_lengkap: '',
  nip: '',
  email: '',
  is_active: true,
})

// Computed
const filteredGuru = computed(() => {
  if (!searchQuery.value) return guruList.value

  const query = searchQuery.value.toLowerCase()
  return guruList.value.filter(
    (guru) =>
      guru.nama_lengkap.toLowerCase().includes(query) || guru.nip.toLowerCase().includes(query),
  )
})

const totalGuru = computed(() => guruList.value.length)
const activeGuru = computed(() => guruList.value.filter((g) => g.is_active).length)
const sudahVoting = computed(() => {
  // This would need actual vote data
  return 0
})

// Methods
const loadGuru = async () => {
  const { data } = await supabase
    .from('pengguna')
    .select('*')
    .eq('peran', 'guru')
    .order('nama_lengkap')

  guruList.value = data || []
}

const hasVoted = () => {
  // Check if this guru has voted in active session
  return false
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

const addPeserta = () => {
  editing.value = false
  form.value = { nama_lengkap: '', nip: '', email: '', is_active: true }
  showModal.value = true
}

const editPeserta = (guru) => {
  editing.value = true
  form.value = { ...guru }
  showModal.value = true
}

const savePeserta = async () => {
  if (!form.value.nama_lengkap || !form.value.nip) {
    alert('Nama dan NIP wajib diisi!')
    return
  }

  try {
    if (editing.value) {
      await supabase.from('pengguna').update(form.value).eq('id', form.value.id)
    } else {
      await supabase.from('pengguna').insert([
        {
          ...form.value,
          peran: 'guru',
        },
      ])
    }

    await loadGuru()
    closeModal()
    alert(`Guru ${editing.value ? 'berhasil diupdate' : 'berhasil ditambahkan'}!`)
  } catch (error) {
    alert('Error: ' + error.message)
  }
}

const toggleStatus = async (guru) => {
  if (!confirm(`Ubah status ${guru.nama_lengkap}?`)) return

  try {
    await supabase.from('pengguna').update({ is_active: !guru.is_active }).eq('id', guru.id)

    await loadGuru()
    alert(`Status ${guru.nama_lengkap} berhasil diubah!`)
  } catch (error) {
    alert('Error: ' + error.message)
  }
}

const closeModal = () => {
  showModal.value = false
}

// Lifecycle
onMounted(async () => {
  await loadGuru()
})
</script>

<style scoped>
/* ============================================
   EXTREME CONTRAST FIX - SEMUA TEXT HITAM/GELAP
   ============================================ */

/* RESET DAN BASE STYLES */
.simple-peserta {
  padding: 1rem;
  max-width: 1000px;
  margin: 0 auto;
  background: #ffffff; /* Background PUTIH BERSIH */
  min-height: 100vh;
}

/* TEXT CONTRAST UTILITY CLASSES */
.text-bold {
  font-weight: 700 !important;
  color: #000000 !important; /* HITAM PEKAT */
}

.text-dark {
  color: #111827 !important; /* Dark gray - ALMOST BLACK */
}

.text-medium {
  color: #374151 !important; /* Medium gray - DARK ENOUGH */
}

/* === HEADER === */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #1e3a8a; /* Border biru tegas */
}

.page-header h1 {
  color: #000000; /* HITAM */
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
}

.back-btn {
  background: #1e3a8a;
  border: 2px solid #1e3a8a;
  color: #ffffff; /* PUTIH di background biru */
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
}

/* === STATS === */
.stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat {
  flex: 1;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid #e5e7eb;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 900;
  color: #000000; /* HITAM */
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #374151; /* DARK GRAY */
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* === ACTIONS === */
.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}

.search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 2px solid #374151;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #000000; /* HITAM */
  font-weight: 500;
}

.search-input::placeholder {
  color: #6b7280; /* Gray untuk placeholder */
  font-weight: 400;
}

.btn-add {
  background: #000000; /* HITAM */
  color: #ffffff; /* PUTIH */
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #374151;
  transform: translateY(-2px);
}

/* === TABLE === */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #e5e7eb;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #1e3a8a; /* Background biru untuk header */
}

th {
  padding: 1rem;
  text-align: left;
  border-bottom: 3px solid #1e40af;
  color: #ffffff; /* PUTIH di background biru */
  font-weight: 800;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  padding: 1rem;
  border-bottom: 2px solid #f3f4f6;
  vertical-align: middle;
  color: #000000; /* HITAM untuk semua text di table */
  font-weight: 500;
}

/* NAMA COLUMN */
.nama {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nama-text {
  color: #000000; /* HITAM */
  font-weight: 600;
  font-size: 1rem;
}

.avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #000000, #374151); /* Gradient hitam */
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
  flex-shrink: 0;
  border: 2px solid #1e3a8a;
}

/* NIP COLUMN */
.nip {
  background: #f3f4f6;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-family: 'SF Mono', 'Courier New', monospace;
  font-size: 0.9rem;
  color: #000000; /* HITAM */
  font-weight: 600;
  border: 1px solid #d1d5db;
}

/* STATUS BADGES - EXTREME CONTRAST */
.status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  display: inline-block;
  min-width: 90px;
  text-align: center;
  border: 2px solid;
  text-transform: uppercase;
}

.status.active {
  background: #10b981; /* HIJAU TERANG */
  color: #000000; /* HITAM text di hijau */
  border-color: #047857;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.status.inactive {
  background: #dc2626; /* MERAH TERANG */
  color: #ffffff; /* PUTIH text di merah */
  border-color: #b91c1c;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
}

/* VOTE STATUS */
.vote {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
}

.vote-text {
  color: #000000; /* HITAM */
  font-size: 0.9rem;
  font-weight: 700;
}

.vote.voted .vote-text {
  color: #059669; /* HIJAU GELAP */
}

.vote.pending .vote-text {
  color: #d97706; /* ORANGE GELAP */
}

/* ACTION BUTTONS */
.btn-action {
  background: white;
  border: 2px solid #374151;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  margin-right: 0.5rem;
  color: #000000;
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-action:hover {
  background: #1e3a8a;
  color: white;
  border-color: #1e3a8a;
  transform: translateY(-2px);
}

/* === EMPTY STATE === */
.empty {
  padding: 3rem;
  text-align: center;
  border-top: 2px dashed #d1d5db;
}

.empty-text {
  color: #000000; /* HITAM */
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  font-weight: 700;
}

/* === MODAL === */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8); /* DARK OVERLAY */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 3px solid #1e3a8a;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #000000; /* HITAM */
  font-size: 1.5rem;
  font-weight: 800;
  border-bottom: 3px solid #1e3a8a;
  padding-bottom: 0.5rem;
}

/* FORM INPUTS - HIGH CONTRAST */
.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 1.5rem 0;
}

.form-input {
  padding: 1rem;
  border: 2px solid #374151;
  border-radius: 8px;
  font-size: 1rem;
  color: #000000; /* HITAM */
  background: white;
  font-weight: 500;
}

.form-input:focus {
  outline: none;
  border-color: #000000; /* HITAM saat focus */
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1);
}

.form-input::placeholder {
  color: #6b7280; /* Gray untuk placeholder */
  font-weight: 400;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: #000000; /* HITAM */
  font-weight: 600;
}

.checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #1e3a8a;
}

.checkbox-text {
  font-weight: 700;
  color: #000000;
}

/* MODAL ACTIONS */
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e5e7eb;
}

.btn-cancel {
  background: #ffffff;
  border: 2px solid #dc2626;
  color: #dc2626; /* MERAH */
  padding: 0.75rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #dc2626;
  color: white;
}

.btn-save {
  background: #000000; /* HITAM */
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
  transition: all 0.2s;
}

.btn-save:hover {
  background: #1e3a8a;
  transform: translateY(-2px);
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .stats {
    flex-direction: column;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search {
    width: 100%;
  }

  .btn-add {
    width: 100%;
  }

  table {
    display: block;
    overflow-x: auto;
  }

  th,
  td {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .vote-text {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    text-align: center;
  }

  .modal-content {
    margin: 1rem;
    padding: 1.5rem;
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
  .btn-action {
    display: none;
  }

  table {
    border: 2px solid #000000;
  }

  th {
    background: #ffffff !important;
    color: #000000 !important;
    border-bottom: 2px solid #000000;
  }
}
</style>
