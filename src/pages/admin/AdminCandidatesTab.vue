<template>
  <div class="candidates-tab">
    <div class="section-header">
      <h2>👥 Verifikasi Calon Kandidat</h2>
      <p>Kelola pendaftaran calon Waka untuk sesi: {{ activeSession?.nama_sesi || 'Tidak ada sesi' }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Memuat data pendaftaran...</p>
    </div>

    <!-- Empty State - No Active Session -->
    <div v-else-if="!activeSession" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>Tidak ada sesi aktif</h3>
      <p>Buat atau aktifkan sesi pemilihan terlebih dahulu</p>
    </div>

    <!-- Empty State - No Registrations -->
    <div v-else-if="registrations.length === 0" class="empty-state">
      <div class="empty-icon">👥</div>
      <h3>Belum ada pendaftaran</h3>
      <p>Belum ada guru yang mendaftar sebagai calon kandidat</p>
      <p class="hint">Guru dapat mendaftar melalui Dashboard Calon ketika status sesi adalah <strong>PENDAFTARAN</strong></p>
    </div>

    <!-- Registrations List -->
    <div v-else>
      <!-- Filter & Stats -->
      <div class="filter-stats">
        <!-- Filter Dropdown -->
        <select v-model="filterStatus" class="filter-select">
          <option value="all">Semua Status</option>
          <option value="menunggu">Menunggu ({{ stats.pending }})</option>
          <option value="disetujui">Disetujui ({{ stats.approved }})</option>
          <option value="ditolak">Ditolak ({{ stats.rejected }})</option>
        </select>

        <!-- Stats Cards -->
        <div class="stats-cards">
          <div class="stat-card pending">
            <h4>Menunggu</h4>
            <p>{{ stats.pending }}</p>
          </div>
          <div class="stat-card approved">
            <h4>Disetujui</h4>
            <p>{{ stats.approved }}</p>
          </div>
          <div class="stat-card rejected">
            <h4>Ditolak</h4>
            <p>{{ stats.rejected }}</p>
          </div>
          <div class="stat-card total">
            <h4>Total</h4>
            <p>{{ stats.total }}</p>
          </div>
        </div>
      </div>

      <!-- Registrations Grid -->
      <div class="registrations-grid">
        <div 
          v-for="registration in filteredRegistrations" 
          :key="registration.id"
          class="registration-card"
          :class="registration.status"
        >
          <div class="card-header">
            <div class="candidate-info">
              <div class="avatar">
                {{ getInitials(registration.pengguna?.nama_lengkap) }}
              </div>
              <div class="details">
                <h4>{{ registration.pengguna?.nama_lengkap }}</h4>
                <p>NIP: {{ registration.pengguna?.nip }}</p>
                <p>Jabatan: {{ formatJabatan(registration.jabatan_diajukan) }}</p>
              </div>
            </div>
            <div class="status-badge" :class="registration.status">
              {{ getStatusLabel(registration.status) }}
            </div>
          </div>

          <div class="card-body">
            <div class="visi-misi">
              <h5>Visi & Misi:</h5>
              <p>{{ truncateText(registration.visi_misi, 150) }}</p>
            </div>
          </div>

          <div class="card-footer">
            <!-- Action Buttons (hanya untuk status "menunggu") -->
            <div v-if="registration.status === 'menunggu'" class="action-buttons">
              <button @click="openApproveModal(registration)" class="btn-approve">
                ✅ Setujui
              </button>
              <button @click="openRejectModal(registration)" class="btn-reject">
                ❌ Tolak
              </button>
              <button @click="viewDetails(registration)" class="btn-details">
                🔍 Detail
              </button>
            </div>

            <!-- Info untuk yang sudah diproses -->
            <div v-else class="processed-info">
              <p v-if="registration.status === 'disetujui'">
                ✅ Disetujui pada: {{ formatDate(registration.ditinjau_pada) }}
              </p>
              <p v-else-if="registration.status === 'ditolak'">
                ❌ Ditolak: {{ registration.alasan_ditolak || 'Tanpa alasan spesifik' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals akan ditambahkan nanti -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'

const props = defineProps({
  activeSession: Object
})

const loading = ref(true)
const registrations = ref([])
const filterStatus = ref('all')
const stats = ref({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0
})

// Load registrations
const loadRegistrations = async () => {
  if (!props.activeSession?.id) {
    registrations.value = []
    loading.value = false
    return
  }

  try {
    const { data, error } = await supabase
      .from('pendaftaran_kandidat')
      .select(`
        *,
        pengguna:pengguna_id (
          id,
          nip,
          nama_lengkap,
          peran
        )
      `)
      .eq('sesi_id', props.activeSession.id)
      .order('dibuat_pada', { ascending: false })

    if (error) throw error

    registrations.value = data || []
    updateStats()
  } catch (error) {
    console.error('Error loading registrations:', error)
  } finally {
    loading.value = false
  }
}

// Update stats
const updateStats = () => {
  const statsData = {
    total: registrations.value.length,
    pending: registrations.value.filter(r => r.status === 'menunggu').length,
    approved: registrations.value.filter(r => r.status === 'disetujui').length,
    rejected: registrations.value.filter(r => r.status === 'ditolak').length
  }
  stats.value = statsData
}

// Filtered registrations
const filteredRegistrations = computed(() => {
  if (filterStatus.value === 'all') {
    return registrations.value
  }
  return registrations.value.filter(r => r.status === filterStatus.value)
})

// Helper functions
const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
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

const getStatusLabel = (status) => {
  const map = {
    menunggu: 'MENUNGGU',
    disetujui: 'DISETUJUI',
    ditolak: 'DITOLAK',
  }
  return map[status] || status
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Modal functions (akan diimplementasi nanti)
const openApproveModal = (registration) => {
  console.log('Approve:', registration)
  // TODO: Implement approve modal
}

const openRejectModal = (registration) => {
  console.log('Reject:', registration)
  // TODO: Implement reject modal
}

const viewDetails = (registration) => {
  console.log('View details:', registration)
  // TODO: Implement detail view
}

// Lifecycle
onMounted(() => {
  loadRegistrations()
})
</script>

<style scoped>
/* CSS akan ditambahkan nanti */
.candidates-tab {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.section-header {
  margin-bottom: 2rem;
}

.section-header h2 {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.section-header p {
  color: #666;
  font-size: 0.95rem;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1e3a8a;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.hint {
  font-size: 0.9rem;
  color: #9ca3af;
  font-style: italic;
}

/* Filter & Stats */
.filter-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  min-width: 200px;
}

.stats-cards {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-card {
  padding: 1rem 1.5rem;
  border-radius: 8px;
  text-align: center;
  min-width: 100px;
}

.stat-card h4 {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: #64748b;
}

.stat-card p {
  font-size: 1.8rem;
  font-weight: 700;
}

.stat-card.pending {
  background: #fef3c7;
  border: 1px solid #f59e0b;
}

.stat-card.pending h4 { color: #92400e; }
.stat-card.pending p { color: #92400e; }

.stat-card.approved {
  background: #d1fae5;
  border: 1px solid #10b981;
}

.stat-card.approved h4 { color: #065f46; }
.stat-card.approved p { color: #065f46; }

.stat-card.rejected {
  background: #fee2e2;
  border: 1px solid #ef4444;
}

.stat-card.rejected h4 { color: #991b1b; }
.stat-card.rejected p { color: #991b1b; }

.stat-card.total {
  background: #e0f2fe;
  border: 1px solid #0ea5e9;
}

.stat-card.total h4 { color: #0369a1; }
.stat-card.total p { color: #0369a1; }

/* Registrations Grid */
.registrations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.registration-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid #e5e7eb;
  transition: all 0.3s;
}

.registration-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.registration-card.menunggu {
  border-color: #f59e0b;
}

.registration-card.disetujui {
  border-color: #10b981;
}

.registration-card.ditolak {
  border-color: #ef4444;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.candidate-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.avatar {
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

.details h4 {
  color: #1e3a8a;
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.details p {
  color: #6b7280;
  font-size: 0.85rem;
  margin-bottom: 0.125rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
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

.card-body {
  margin-bottom: 1.5rem;
}

.visi-misi h5 {
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.visi-misi p {
  color: #4b5563;
  font-size: 0.9rem;
  line-height: 1.5;
}

.card-footer {
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-approve,
.btn-reject,
.btn-details {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.btn-approve {
  background: #10b981;
  color: white;
}

.btn-approve:hover {
  background: #0da271;
}

.btn-reject {
  background: #ef4444;
  color: white;
}

.btn-reject:hover {
  background: #dc2626;
}

.btn-details {
  background: #6b7280;
  color: white;
}

.btn-details:hover {
  background: #4b5563;
}

.processed-info {
  color: #6b7280;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .registrations-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-stats {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stats-cards {
    justify-content: center;
  }
  
  .stat-card {
    min-width: 80px;
    padding: 0.75rem 1rem;
  }
  
  .stat-card p {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .card-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .status-badge {
    align-self: flex-start;
  }
}
</style>