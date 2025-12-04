<template>
  <div class="tokens-tab">
    <!-- Section Header -->
    <div class="section-header">
      <h2>🎫 Token Voting</h2>
      <p>Kelola token 6 digit untuk sesi: {{ activeSession?.nama_sesi || 'Tidak ada sesi' }}</p>
    </div>

    <!-- Empty State - No Active Session -->
    <div v-if="!activeSession" class="empty-state">
      <div class="empty-icon">🔒</div>
      <h3>Belum ada sesi aktif</h3>
      <p>Aktifkan sesi pemilihan terlebih dahulu untuk mengelola token</p>
    </div>

    <!-- Empty State - Tokens not generated -->
    <div
      v-else-if="activeSession.status !== 'voting' && activeSession.status !== 'selesai'"
      class="empty-state"
    >
      <div class="empty-icon">⏳</div>
      <h3>Token Belum Tersedia</h3>
      <p>Token akan otomatis dibuat saat status sesi berubah ke <strong>VOTING</strong></p>
      <p class="hint">Admin dapat membuka voting melalui tab "Kelola Sesi"</p>
    </div>

    <!-- Tokens Management -->
    <div v-else>
      <!-- Overview Stats -->
      <div class="tokens-stats">
        <div class="stat-card">
          <div class="stat-icon">🔢</div>
          <div class="stat-content">
            <h3>Total Token</h3>
            <p class="stat-number">{{ stats.totalTokens || 0 }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <h3>Sudah Digunakan</h3>
            <p class="stat-number">{{ stats.usedTokens || 0 }}</p>
            <p class="stat-percentage">{{ stats.usedPercentage || 0 }}%</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🆕</div>
          <div class="stat-content">
            <h3>Tersedia</h3>
            <p class="stat-number">{{ stats.availableTokens || 0 }}</p>
            <p class="stat-percentage">{{ stats.availablePercentage || 0 }}%</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h3>Total Guru</h3>
            <p class="stat-number">{{ stats.totalGuru || 0 }}</p>
            <p class="stat-sub">Aktif</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="refreshTokens" class="btn-refresh" :disabled="loading">
          <span class="btn-icon">🔄</span>
          {{ loading ? 'Memuat...' : 'Refresh Data' }}
        </button>

        <button @click="exportToCSV" class="btn-export">
          <span class="btn-icon">📥</span>
          Export CSV
        </button>

        <button @click="printTokens" class="btn-print" v-if="tokens.length > 0">
          <span class="btn-icon">🖨️</span>
          Cetak Token
        </button>

        <button
          @click="showGenerateModal = true"
          class="btn-generate"
          v-if="stats.totalGuru > stats.totalTokens"
        >
          <span class="btn-icon">✨</span>
          Generate Token Baru
        </button>
      </div>

      <!-- Search & Filter -->
      <div class="search-filter">
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Cari nama guru, NIP, atau token..."
            class="search-input"
          />
          <span class="search-icon">🔍</span>
        </div>

        <select v-model="filterStatus" class="filter-select">
          <option value="all">Semua Status</option>
          <option value="available">Tersedia ({{ availableCount }})</option>
          <option value="used">Sudah Digunakan ({{ usedCount }})</option>
          <option value="expired">Kadaluarsa ({{ expiredCount }})</option>
        </select>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <p>Memuat data token...</p>
      </div>

      <!-- Tokens Table -->
      <div v-else class="tokens-table-container">
        <div class="table-wrapper">
          <table class="tokens-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Guru</th>
                <th>NIP</th>
                <th>Token</th>
                <th>Status</th>
                <th>Digunakan Pada</th>
                <th>Kadaluarsa</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(token, index) in paginatedTokens" :key="token.id">
                <td class="text-center">{{ (currentPage - 1) * perPage + index + 1 }}</td>
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">
                      {{ getInitials(token.pengguna?.nama_lengkap) }}
                    </div>
                    <div class="user-info">
                      <strong>{{ token.pengguna?.nama_lengkap }}</strong>
                    </div>
                  </div>
                </td>
                <td>{{ token.pengguna?.nip || '-' }}</td>
                <td>
                  <div class="token-cell">
                    <code class="token-code">{{ token.token }}</code>
                    <button @click="copyToken(token.token)" class="copy-btn" title="Salin token">
                      📋
                    </button>
                  </div>
                </td>
                <td>
                  <span class="status-badge" :class="getTokenStatus(token)">
                    {{ getTokenStatusLabel(token) }}
                  </span>
                </td>
                <td>
                  {{ token.digunakan_pada ? formatDate(token.digunakan_pada) : '-' }}
                  <small v-if="token.info_perangkat" class="device-info">
                    {{ token.info_perangkat }}
                  </small>
                </td>
                <td :class="{ 'expired-soon': isExpiringSoon(token) }">
                  {{ formatDate(token.kadaluarsa_pada) }}
                  <small v-if="isExpiringSoon(token)" class="expiry-warning">
                    (Segera kadaluarsa)
                  </small>
                </td>
                <td>
                  <div class="action-buttons-cell">
                    <button
                      @click="viewTokenDetails(token)"
                      class="btn-action view"
                      title="Detail token"
                    >
                      👁️
                    </button>

                    <button
                      @click="resetToken(token)"
                      v-if="token.sudah_digunakan && !isExpired(token)"
                      class="btn-action reset"
                      title="Reset token"
                    >
                      🔄
                    </button>

                    <button
                      @click="revokeToken(token)"
                      v-if="!token.sudah_digunakan"
                      class="btn-action revoke"
                      title="Batalkan token"
                    >
                      🚫
                    </button>

                    <button
                      @click="extendToken(token)"
                      v-if="!isExpired(token)"
                      class="btn-action extend"
                      title="Perpanjang masa aktif"
                    >
                      ⏳
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty Table State -->
        <div v-if="filteredTokens.length === 0" class="empty-table">
          <div class="empty-icon">🔍</div>
          <h4>Tidak ada token ditemukan</h4>
          <p v-if="searchQuery">Tidak ada token yang cocok dengan pencarian "{{ searchQuery }}"</p>
          <p v-else>Belum ada token yang dibuat untuk sesi ini</p>
        </div>

        <!-- Pagination -->
        <div v-if="filteredTokens.length > 0" class="pagination">
          <div class="pagination-info">
            Menampilkan {{ startIndex + 1 }}-{{ endIndex }} dari {{ filteredTokens.length }} token
          </div>
          <div class="pagination-controls">
            <button @click="prevPage" :disabled="currentPage === 1" class="pagination-btn">
              ◀️ Sebelumnya
            </button>

            <div class="page-numbers">
              <span
                v-for="page in pageNumbers"
                :key="page"
                @click="goToPage(page)"
                :class="{ active: page === currentPage }"
                class="page-number"
              >
                {{ page }}
              </span>
            </div>

            <button @click="nextPage" :disabled="currentPage === totalPages" class="pagination-btn">
              Selanjutnya ▶️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals will be added later -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'

const props = defineProps({
  activeSession: Object,
  stats: {
    type: Object,
    default: () => ({
      totalGuru: 0,
      totalTokens: 0,
      usedTokens: 0,
      availableTokens: 0,
    }),
  },
})

const emit = defineEmits(['refresh'])

// State
const loading = ref(true)
const tokens = ref([])
const searchQuery = ref('')
const filterStatus = ref('all')
const currentPage = ref(1)
const perPage = 20

const showGenerateModal = ref(false)

// Load tokens
const loadTokens = async () => {
  if (!props.activeSession?.id) {
    tokens.value = []
    loading.value = false
    return
  }

  try {
    const { data, error } = await supabase
      .from('token_qr')
      .select(
        `
        *,
        pengguna:pengguna_id (
          id,
          nip,
          nama_lengkap,
          peran,
          is_active
        )
      `,
      )
      .eq('sesi_id', props.activeSession.id)
      .order('dibuat_pada', { ascending: false })

    if (error) throw error

    tokens.value = data || []
  } catch (error) {
    console.error('Error loading tokens:', error)
    alert('Gagal memuat data token: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Computed stats
const stats = computed(() => {
  const totalTokens = tokens.value.length
  const usedTokens = tokens.value.filter((t) => t.sudah_digunakan).length
  const availableTokens = totalTokens - usedTokens
  const usedPercentage = totalTokens ? Math.round((usedTokens / totalTokens) * 100) : 0
  const availablePercentage = 100 - usedPercentage

  return {
    totalTokens,
    usedTokens,
    availableTokens,
    usedPercentage,
    availablePercentage,
    totalGuru: props.stats.totalGuru || 0,
  }
})

// Filtered tokens
const filteredTokens = computed(() => {
  let result = tokens.value

  // Filter by status
  if (filterStatus.value !== 'all') {
    result = result.filter((token) => {
      if (filterStatus.value === 'available') {
        return !token.sudah_digunakan && !isExpired(token)
      } else if (filterStatus.value === 'used') {
        return token.sudah_digunakan
      } else if (filterStatus.value === 'expired') {
        return isExpired(token)
      }
      return true
    })
  }

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (token) =>
        token.pengguna?.nama_lengkap?.toLowerCase().includes(query) ||
        token.pengguna?.nip?.toLowerCase().includes(query) ||
        token.token?.toLowerCase().includes(query),
    )
  }

  return result
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredTokens.value.length / perPage))
const paginatedTokens = computed(() => {
  const start = (currentPage.value - 1) * perPage
  const end = start + perPage
  return filteredTokens.value.slice(start, end)
})
const startIndex = computed(() => (currentPage.value - 1) * perPage)
const endIndex = computed(() => Math.min(currentPage.value * perPage, filteredTokens.value.length))
const pageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Counts for filter dropdown
const availableCount = computed(
  () => tokens.value.filter((t) => !t.sudah_digunakan && !isExpired(t)).length,
)
const usedCount = computed(() => tokens.value.filter((t) => t.sudah_digunakan).length)
const expiredCount = computed(() => tokens.value.filter((t) => isExpired(t)).length)

// Helper functions
const getInitials = (name) => {
  if (!name) return '??'
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
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isExpired = (token) => {
  if (!token.kadaluarsa_pada) return false
  return new Date(token.kadaluarsa_pada) < new Date()
}

const isExpiringSoon = (token) => {
  if (!token.kadaluarsa_pada || token.sudah_digunakan) return false
  const expiryDate = new Date(token.kadaluarsa_pada)
  const now = new Date()
  const hoursLeft = (expiryDate - now) / (1000 * 60 * 60)
  return hoursLeft > 0 && hoursLeft <= 24 // 24 jam ke depan
}

const getTokenStatus = (token) => {
  if (token.sudah_digunakan) return 'used'
  if (isExpired(token)) return 'expired'
  return 'available'
}

const getTokenStatusLabel = (token) => {
  const status = getTokenStatus(token)
  const labels = {
    available: 'TERSEDIA',
    used: 'DIGUNAKAN',
    expired: 'KADALUARSA',
  }
  return labels[status] || status
}

// Action functions
const refreshTokens = async () => {
  loading.value = true
  await loadTokens()
  emit('refresh')
}

const copyToken = (token) => {
  navigator.clipboard.writeText(token)
  // Bisa tambahin toast notification nanti
  alert('Token berhasil disalin: ' + token)
}

const exportToCSV = () => {
  const headers = [
    'Nama Guru',
    'NIP',
    'Token',
    'Status',
    'Digunakan Pada',
    'Kadaluarsa Pada',
    'Info Perangkat',
  ]
  const csvData = tokens.value.map((token) => [
    token.pengguna?.nama_lengkap || '',
    token.pengguna?.nip || '',
    token.token,
    getTokenStatusLabel(token),
    token.digunakan_pada ? formatDate(token.digunakan_pada) : '',
    token.kadaluarsa_pada ? formatDate(token.kadaluarsa_pada) : '',
    token.info_perangkat || '',
  ])

  let csvContent = headers.join(',') + '\n'
  csvData.forEach((row) => {
    csvContent += row.map((cell) => `"${cell}"`).join(',') + '\n'
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute(
    'download',
    `tokens_${props.activeSession?.nama_sesi || 'session'}_${new Date().toISOString().split('T')[0]}.csv`,
  )
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const printTokens = () => {
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
      <head>
        <title>Cetak Token - ${props.activeSession?.nama_sesi || 'Sesi Pemilihan'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1e3a8a; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f1f5f9; }
          .token { font-family: monospace; font-size: 1.2em; font-weight: bold; }
          .header { text-align: center; margin-bottom: 30px; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 0.9em; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Token Voting SMANDA</h1>
          <h3>Sesi: ${props.activeSession?.nama_sesi || '-'}</h3>
          <p>Tanggal cetak: ${new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Guru</th>
              <th>NIP</th>
              <th>Token</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tokens.value
              .map(
                (token, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${token.pengguna?.nama_lengkap || '-'}</td>
                <td>${token.pengguna?.nip || '-'}</td>
                <td class="token">${token.token}</td>
                <td>${getTokenStatusLabel(token)}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Total Token: ${tokens.value.length} | Sudah digunakan: ${stats.value.usedTokens} | Tersedia: ${stats.value.availableTokens}</p>
          <p class="no-print">
            <button onclick="window.print()">🖨️ Cetak Halaman Ini</button>
            <button onclick="window.close()">❌ Tutup</button>
          </p>
        </div>
      </body>
    </html>
  `)
  printWindow.document.close()
}

const viewTokenDetails = (token) => {
  const details = `
    Nama Guru: ${token.pengguna?.nama_lengkap || '-'}
    NIP: ${token.pengguna?.nip || '-'}
    Token: ${token.token}
    Status: ${getTokenStatusLabel(token)}
    Dibuat: ${formatDate(token.dibuat_pada)}
    Kadaluarsa: ${formatDate(token.kadaluarsa_pada)}
    ${token.digunakan_pada ? `Digunakan: ${formatDate(token.digunakan_pada)}` : 'Belum digunakan'}
    ${token.info_perangkat ? `Perangkat: ${token.info_perangkat}` : ''}
    ${token.alamat_ip ? `IP Address: ${token.alamat_ip}` : ''}
  `
  alert(details)
}

const resetToken = async (token) => {
  if (
    !confirm(
      `Reset token ${token.token} untuk ${token.pengguna?.nama_lengkap}? Token bisa digunakan kembali.`,
    )
  )
    return

  try {
    const { error } = await supabase
      .from('token_qr')
      .update({
        sudah_digunakan: false,
        digunakan_pada: null,
        info_perangkat: null,
        alamat_ip: null,
      })
      .eq('id', token.id)

    if (error) throw error

    await refreshTokens()
    alert('Token berhasil direset!')
  } catch (error) {
    console.error('Error resetting token:', error)
    alert('Gagal mereset token: ' + error.message)
  }
}

const revokeToken = async (token) => {
  if (!confirm(`Batalkan token ${token.token}? Token tidak bisa digunakan lagi.`)) return

  try {
    const { error } = await supabase
      .from('token_qr')
      .update({
        kadaluarsa_pada: new Date().toISOString(), // Expire now
      })
      .eq('id', token.id)

    if (error) throw error

    await refreshTokens()
    alert('Token berhasil dibatalkan!')
  } catch (error) {
    console.error('Error revoking token:', error)
    alert('Gagal membatalkan token: ' + error.message)
  }
}

const extendToken = async (token) => {
  const newExpiry = new Date()
  newExpiry.setDate(newExpiry.getDate() + 7) // Tambah 7 hari

  if (!confirm(`Perpanjang token ${token.token} sampai ${newExpiry.toLocaleDateString('id-ID')}?`))
    return

  try {
    const { error } = await supabase
      .from('token_qr')
      .update({
        kadaluarsa_pada: newExpiry.toISOString(),
      })
      .eq('id', token.id)

    if (error) throw error

    await refreshTokens()
    alert('Token berhasil diperpanjang!')
  } catch (error) {
    console.error('Error extending token:', error)
    alert('Gagal memperpanjang token: ' + error.message)
  }
}

// Pagination controls
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const goToPage = (page) => {
  currentPage.value = page
}

// Lifecycle
onMounted(() => {
  loadTokens()
})
</script>

<style scoped>
.tokens-tab {
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

/* Empty States */
.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
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
  line-height: 1.5;
}

.hint {
  font-size: 0.9rem;
  color: #9ca3af;
  font-style: italic;
  margin-top: 1rem;
}

/* Stats Overview */
.tokens-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.stat-content h3 {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 0.25rem;
  font-weight: 600;
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
  margin-top: 0.125rem;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.btn-refresh,
.btn-export,
.btn-print,
.btn-generate {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-refresh {
  background: #f1f5f9;
  color: #1e3a8a;
}

.btn-refresh:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-export {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
}

.btn-export:hover {
  background: linear-gradient(135deg, #047857, #0da271);
}

.btn-print {
  background: linear-gradient(135deg, #d97706, #f59e0b);
  color: white;
}

.btn-print:hover {
  background: linear-gradient(135deg, #b45309, #d97706);
}

.btn-generate {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
}

.btn-generate:hover {
  background: linear-gradient(135deg, #1e40af, #2563eb);
}

.btn-icon {
  font-size: 1.1rem;
}

/* Search & Filter */
.search-filter {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 300px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1.1rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  min-width: 200px;
}

/* Loading State */
.loading-state {
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Tokens Table */
.tokens-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.tokens-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.tokens-table th {
  background: #f8fafc;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tokens-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
}

.tokens-table tr:hover {
  background: #f9fafb;
}

/* Table Cells */
.text-center {
  text-align: center;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.user-info strong {
  color: #1e3a8a;
  display: block;
  margin-bottom: 0.125rem;
}

.token-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.token-code {
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-weight: bold;
  color: #1e3a8a;
  font-size: 1rem;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity 0.2s;
  padding: 0.25rem;
}

.copy-btn:hover {
  opacity: 1;
}

/* Status Badges */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  display: inline-block;
}

.status-badge.available {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.used {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.expired {
  background: #fee2e2;
  color: #991b1b;
}

/* Expiry Warning */
.expired-soon {
  color: #d97706;
  font-weight: 600;
}

.expiry-warning {
  display: block;
  font-size: 0.75rem;
  color: #d97706;
  margin-top: 0.25rem;
}

.device-info {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Action Buttons in Table */
.action-buttons-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-action.view {
  background: #f1f5f9;
  color: #4b5563;
}

.btn-action.view:hover {
  background: #e5e7eb;
}

.btn-action.reset {
  background: #fef3c7;
  color: #92400e;
}

.btn-action.reset:hover {
  background: #fde68a;
}

.btn-action.revoke {
  background: #fee2e2;
  color: #991b1b;
}

.btn-action.revoke:hover {
  background: #fecaca;
}

.btn-action.extend {
  background: #e0f2fe;
  color: #0369a1;
}

.btn-action.extend:hover {
  background: #bae6fd;
}

/* Empty Table State */
.empty-table {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.empty-table .empty-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.empty-table h4 {
  color: #374151;
  margin-bottom: 0.5rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.pagination-info {
  color: #6b7280;
  font-size: 0.9rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #4b5563;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  color: #4b5563;
}

.page-number:hover {
  background: #f1f5f9;
}

.page-number.active {
  background: #1e3a8a;
  color: white;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .tokens-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-refresh,
  .btn-export,
  .btn-print,
  .btn-generate {
    width: 100%;
    justify-content: center;
  }

  .search-box {
    min-width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .pagination-controls {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .tokens-stats {
    grid-template-columns: 1fr;
  }

  .action-buttons-cell {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
  }
}
</style>
