<template>
  <div class="simple-kandidat">
    <!-- Header -->
    <div class="page-header">
      <h1>👤 Data Kandidat</h1>
      <button @click="$router.push('/admin')" class="back-btn">← Dashboard</button>
    </div>

    <!-- Session Status -->
    <div v-if="activeSession" class="session-status" :class="activeSession.status">
      Sesi: {{ activeSession.nama_sesi }} - {{ activeSession.status.toUpperCase() }}
    </div>

    <!-- Position Stats -->
    <div class="position-stats">
      <div class="stat-card">
        <div class="stat-icon">🏗️</div>
        <div class="stat-info">
          <h4>Waka Sarpras</h4>
          <p class="stat-number">{{ sarprasCount }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👨‍🎓</div>
        <div class="stat-info">
          <h4>Waka Kesiswaan</h4>
          <p class="stat-number">{{ kesiswaanCount }}</p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <div class="tabs">
        <button @click="activeTab = 'all'" :class="{ active: activeTab === 'all' }">Semua</button>
        <button @click="activeTab = 'sarpras'" :class="{ active: activeTab === 'sarpras' }">
          Sarpras
        </button>
        <button @click="activeTab = 'kesiswaan'" :class="{ active: activeTab === 'kesiswaan' }">
          Kesiswaan
        </button>
      </div>
      <button @click="addKandidat" class="btn-add" :disabled="!canAdd">+ Tambah Kandidat</button>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama</th>
            <th>Posisi</th>
            <th>Suara</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="k in filteredKandidat" :key="k.id">
            <td class="text-black">{{ k.nomor_urut }}</td>
            <td>
              <div class="nama">
                <div class="avatar">{{ getInitials(k.nama) }}</div>
                <div>
                  <div class="nama-text text-black">{{ k.nama }}</div>
                  <small class="nip text-dark">{{ k.nip }}</small>
                </div>
              </div>
            </td>
            <td>
              <span :class="['badge', k.jabatan]">
                {{ k.jabatan === 'sarpras' ? 'Waka Sarpras' : 'Waka Kesiswaan' }}
              </span>
            </td>
            <td>
              <div class="votes">
                <span class="count text-black">{{ k.total_suara || 0 }}</span>
                <div class="progress">
                  <div class="bar" :style="{ width: getPercentage(k) + '%' }"></div>
                </div>
              </div>
            </td>
            <td>
              <button @click="editKandidat(k)" class="btn-edit">✏️</button>
              <button @click="deleteKandidat(k)" class="btn-delete">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty -->
      <div v-if="filteredKandidat.length === 0" class="empty">
        <p class="text-black">{{ emptyMessage }}</p>
        <button v-if="canAdd" @click="addKandidat" class="btn-add">+ Tambah Kandidat</button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <h3 class="text-black">{{ editing ? 'Edit' : 'Tambah' }} Kandidat</h3>

        <div class="form">
          <div class="form-group">
            <label class="text-black">Posisi</label>
            <select v-model="form.jabatan" class="form-select">
              <option value="sarpras">Waka Sarpras</option>
              <option value="kesiswaan">Waka Kesiswaan</option>
            </select>
          </div>

          <div class="form-group">
            <label class="text-black">Guru</label>
            <select v-model="form.pengguna_id" class="form-select" :disabled="editing">
              <option value="">Pilih Guru</option>
              <option v-for="g in availableGuru" :key="g.id" :value="g.id">
                {{ g.nama_lengkap }} ({{ g.nip }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="text-black">Nomor Urut</label>
            <input v-model.number="form.nomor_urut" type="number" min="1" class="form-input" />
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeModal" class="btn-cancel">Batal</button>
          <button @click="saveKandidat" class="btn-save" :disabled="!formValid">
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
const kandidatList = ref([])
const guruList = ref([])
const activeSession = ref(null)
const showModal = ref(false)
const editing = ref(false)
const activeTab = ref('all')

// Form
const form = ref({
  jabatan: 'sarpras',
  pengguna_id: '',
  nomor_urut: 1,
})

// Computed
const sarprasCount = computed(
  () => kandidatList.value.filter((k) => k.jabatan === 'sarpras').length,
)
const kesiswaanCount = computed(
  () => kandidatList.value.filter((k) => k.jabatan === 'kesiswaan').length,
)

const filteredKandidat = computed(() => {
  let filtered = kandidatList.value
  if (activeTab.value !== 'all') {
    filtered = filtered.filter((k) => k.jabatan === activeTab.value)
  }
  return filtered
})

const availableGuru = computed(() => {
  const candidateIds = kandidatList.value.map((k) => k.pengguna_id)
  return guruList.value.filter((g) => !candidateIds.includes(g.id))
})

const formValid = computed(() => {
  return form.value.pengguna_id && form.value.nomor_urut > 0
})

const canAdd = computed(() => {
  return activeSession.value?.status === 'pendaftaran' || activeSession.value?.status === 'voting'
})

const emptyMessage = computed(() => {
  if (!canAdd.value) return 'Sesi tidak aktif untuk menambah kandidat'
  return 'Belum ada kandidat'
})

// Methods
const loadData = async () => {
  try {
    // Load session
    const { data: session } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .order('dibuat_pada', { ascending: false })
      .limit(1)
      .single()
    activeSession.value = session

    // Load kandidat
    const { data: kandidat } = await supabase
      .from('kandidat')
      .select(
        `
        *,
        pengguna:pengguna_id (nama_lengkap, nip)
      `,
      )
      .order('nomor_urut')

    kandidatList.value = (kandidat || []).map((k) => ({
      ...k,
      nama: k.pengguna?.nama_lengkap || 'Unknown',
      nip: k.pengguna?.nip || 'N/A',
    }))

    // Load guru
    const { data: guru } = await supabase
      .from('pengguna')
      .select('*')
      .eq('peran', 'guru')
      .eq('is_active', true)
      .order('nama_lengkap')

    guruList.value = guru || []
  } catch (error) {
    console.error('Load error:', error)
  }
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

const getPercentage = (kandidat) => {
  const total = kandidatList.value
    .filter((k) => k.jabatan === kandidat.jabatan)
    .reduce((sum, k) => sum + (k.total_suara || 0), 0)
  return total > 0 ? Math.round((kandidat.total_suara / total) * 100) : 0
}

const addKandidat = () => {
  if (!canAdd.value) {
    alert('Hanya bisa menambah kandidat saat sesi PENDAFTARAN atau VOTING')
    return
  }
  editing.value = false
  form.value = { jabatan: 'sarpras', pengguna_id: '', nomor_urut: kandidatList.value.length + 1 }
  showModal.value = true
}

const editKandidat = (k) => {
  editing.value = true
  form.value = {
    jabatan: k.jabatan,
    pengguna_id: k.pengguna_id,
    nomor_urut: k.nomor_urut,
    id: k.id,
    total_suara: k.total_suara,
  }
  showModal.value = true
}

const createPendaftaranDummy = async (penggunaId, sesiId, jabatan) => {
  try {
    // Cek apakah sudah ada pendaftaran
    const { data: existing } = await supabase
      .from('pendaftaran_kandidat')
      .select('id')
      .eq('pengguna_id', penggunaId)
      .eq('sesi_id', sesiId)
      .maybeSingle()

    if (existing) return existing.id

    // Buat pendaftaran baru
    const { data: newPendaftaran } = await supabase
      .from('pendaftaran_kandidat')
      .insert([
        {
          pengguna_id: penggunaId,
          sesi_id: sesiId,
          jabatan_diajukan: jabatan,
          visi_misi: 'Ditambahkan langsung oleh admin',
          status: 'disetujui',
        },
      ])
      .select('id')
      .single()

    return newPendaftaran?.id
  } catch (error) {
    console.error('Failed to create pendaftaran:', error)
    return null
  }
}

const saveKandidat = async () => {
  try {
    if (!activeSession.value?.id) {
      alert('Tidak ada sesi aktif!')
      return
    }

    // Buat pendaftaran dummy
    const pendaftaranId = await createPendaftaranDummy(
      form.value.pengguna_id,
      activeSession.value.id,
      form.value.jabatan,
    )

    if (!pendaftaranId) {
      alert('❌ Gagal membuat data pendaftaran')
      return
    }

    // Simpan kandidat
    const kandidatData = {
      pendaftaran_id: pendaftaranId,
      pengguna_id: form.value.pengguna_id,
      sesi_id: activeSession.value.id,
      jabatan: form.value.jabatan,
      nomor_urut: form.value.nomor_urut,
      visi_misi: '',
      total_suara: editing.value ? form.value.total_suara || 0 : 0,
    }

    if (editing.value) {
      await supabase.from('kandidat').update(kandidatData).eq('id', form.value.id)
    } else {
      await supabase.from('kandidat').insert([kandidatData])
    }

    await loadData()
    closeModal()
    alert('✅ Berhasil!')
  } catch (error) {
    console.error('Save error:', error)
    alert('❌ Gagal: ' + (error.message || 'Unknown error'))
  }
}

const deleteKandidat = async (k) => {
  if (!confirm(`Hapus kandidat ${k.nama}?`)) return
  try {
    await supabase.from('kandidat').delete().eq('id', k.id)
    await loadData()
    alert('✅ Dihapus!')
  } catch (error) {
    alert('❌ Gagal: ' + error.message)
  }
}

const closeModal = () => {
  showModal.value = false
}

// Lifecycle
onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.simple-kandidat {
  padding: 1rem;
  max-width: 1000px;
  margin: 0 auto;
  background: #ffffff;
}

/* TEXT UTILITIES */
.text-black {
  color: #000000 !important;
  font-weight: 600;
}

.text-dark {
  color: #333333 !important;
  font-weight: 500;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  color: #000000;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.back-btn {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

/* Session Status */
.session-status {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-weight: 700;
  text-align: center;
  color: #000000;
}

.session-status.draft {
  background: #f1f5f9;
}
.session-status.pendaftaran {
  background: #fef3c7;
}
.session-status.voting {
  background: #d1fae5;
}
.session-status.selesai {
  background: #dcfce7;
}

/* Stats */
.position-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid #e5e7eb;
}

.stat-icon {
  font-size: 2rem;
}
.stat-info h4 {
  margin: 0 0 0.25rem 0;
  color: #000000;
  font-size: 0.9rem;
  font-weight: 700;
}
.stat-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e3a8a;
}

/* Actions */
.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tabs button {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  color: #000000;
  font-weight: 600;
}

.tabs button.active {
  background: #1e3a8a;
  color: white;
  border-color: #1e3a8a;
}

.btn-add {
  background: #000000;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Table - ALL TEXT BLACK */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid #e5e7eb;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #1e3a8a;
}

th {
  padding: 1rem;
  text-align: left;
  color: white !important;
  font-weight: 700;
}

td {
  padding: 1rem;
  border-bottom: 2px solid #f3f4f6;
  color: #000000 !important;
  font-weight: 500;
}

/* Nama */
.nama {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 40px;
  height: 40px;
  background: #000000;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  border: 2px solid #1e3a8a;
}

.nama-text {
  color: #000000;
  font-weight: 700;
}

.nip {
  color: #333333;
  font-weight: 600;
  font-size: 0.85rem;
}

/* Badges - Background tetap, text hitam */
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #000000 !important;
  border: 2px solid;
}

.badge.sarpras {
  background: #d1fae5;
  border-color: #10b981;
}

.badge.kesiswaan {
  background: #dbeafe;
  border-color: #3b82f6;
}

/* Votes */
.votes {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.count {
  font-weight: 800;
  color: #000000;
  min-width: 30px;
}

.progress {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: #1e3a8a;
  border-radius: 4px;
}

/* Action Buttons */
.btn-edit,
.btn-delete {
  background: white;
  border: 2px solid #374151;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  margin-right: 0.5rem;
  color: #000000;
  font-weight: 600;
}

.btn-edit:hover,
.btn-delete:hover {
  background: #1e3a8a;
  color: white;
}

/* Empty */
.empty {
  padding: 3rem;
  text-align: center;
}

.empty p {
  margin-bottom: 1rem;
  color: #000000;
  font-weight: 600;
}

/* Modal */
.modal {
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  border: 3px solid #1e3a8a;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #000000;
  font-weight: 800;
  border-bottom: 2px solid #1e3a8a;
  padding-bottom: 0.5rem;
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 700;
  color: #000000;
}

.form-select,
.form-input {
  padding: 0.5rem;
  border: 2px solid #374151;
  border-radius: 6px;
  font-size: 1rem;
  color: #000000;
  font-weight: 500;
  background: white;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #000000;
}

/* Modal Actions */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e5e7eb;
}

.btn-cancel {
  background: white;
  border: 2px solid #dc2626;
  color: #dc2626;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
}

.btn-save {
  background: #000000;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .position-stats {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .tabs {
    justify-content: center;
  }

  .btn-add {
    width: 100%;
  }

  table {
    display: block;
    overflow-x: auto;
  }

  .modal-content {
    margin: 1rem;
    padding: 1.5rem;
  }
}

/* PRINT STYLES */
@media print {
  .simple-kandidat {
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
