<template>
  <div class="admin-dashboard">
    <!-- Loading State -->
    <div v-if="loading" class="loading-screen">
      <div class="loader"></div>
      <p>Memeriksa autentikasi...</p>
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
    <div v-else>
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

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- TAB 1: Daftar Calon -->
        <div v-if="activeTab === 'calon'" class="tab-pane">
          <div class="section-header">
            <h2>Verifikasi Calon Kandidat</h2>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">0</div>
              <div class="stat-label">Total Calon</div>
            </div>
            <div class="stat-card pending">
              <div class="stat-number">0</div>
              <div class="stat-label">Menunggu</div>
            </div>
            <div class="stat-card approved">
              <div class="stat-number">0</div>
              <div class="stat-label">Disetujui</div>
            </div>
            <div class="stat-card rejected">
              <div class="stat-number">0</div>
              <div class="stat-label">Ditolak</div>
            </div>
          </div>

          <div class="empty-state">
            <p>Tidak ada data calon</p>
            <p class="hint">Data akan muncul ketika guru mendaftar sebagai calon</p>
          </div>
        </div>

        <!-- TAB 2: Kelola Sesi -->
        <div v-else-if="activeTab === 'sesi'" class="tab-pane">
          <h2>Kelola Sesi Pemilihan</h2>
          <div class="session-management">
            <div class="session-card">
              <h3>Status Sesi</h3>
              <div class="session-info">
                <p><strong>PEMILIHAN WAKA SMANDA 2025/2026</strong></p>
                <p>Tahun Ajaran: 2025/2026</p>
                <p>Status: <span class="status-active">PENDAFTARAN</span></p>
                <p>Pendaftaran: 1 - 7 Desember 2025</p>
                <p>Voting: 8 Desember 2025 (10:00-11:00 WIB)</p>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: Generate QR -->
        <div v-else-if="activeTab === 'qr'" class="tab-pane">
          <h2>Generate QR Tokens</h2>
          <div class="qr-generator">
            <div class="qr-stats">
              <p>Total Guru/Staff: <strong>0</strong></p>
              <p>Token Tergenerate: <strong>0</strong></p>
              <p>Token Belum Digunakan: <strong>0</strong></p>
            </div>

            <div class="qr-actions">
              <button @click="generateQRTokens" class="btn-primary">Generate QR Tokens</button>
              <button class="btn-secondary">Export ke CSV</button>
            </div>

            <div class="hint-box">
              <p>⚠️ <strong>Perhatian:</strong> Generate token untuk semua guru sebelum voting.</p>
              <p>Token akan dikirim ke email masing-masing guru.</p>
            </div>
          </div>
        </div>

        <!-- TAB 4: Monitoring -->
        <div v-else-if="activeTab === 'monitor'" class="tab-pane">
          <h2>Live Monitoring</h2>
          <div class="monitoring">
            <div class="monitor-stats">
              <div class="monitor-card">
                <div class="monitor-number">0</div>
                <div class="monitor-label">Total Pemilih</div>
              </div>
              <div class="monitor-card">
                <div class="monitor-number">0</div>
                <div class="monitor-label">Sudah Voting</div>
              </div>
              <div class="monitor-card">
                <div class="monitor-number">0%</div>
                <div class="monitor-label">Partisipasi</div>
              </div>
            </div>

            <div class="monitor-progress">
              <h4>Progress Voting:</h4>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
              </div>
              <p>0 dari 0 guru sudah voting</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Auth State
const loading = ref(true)
const isAuthenticated = ref(false)
const adminUser = ref(null)

// UI State
const activeTab = ref('calon')
const tabs = ref([
  { id: 'calon', label: 'Verifikasi Calon', badge: null },
  { id: 'sesi', label: 'Kelola Sesi', badge: null },
  { id: 'qr', label: 'Generate QR', badge: null },
  { id: 'monitor', label: 'Live Monitor', badge: null },
])

// Auth Check Function
const checkAuth = () => {
  console.log('🔐 Checking admin authentication...')

  const adminSession = localStorage.getItem('smanda_admin')

  if (!adminSession) {
    console.log('❌ No admin session found')
    isAuthenticated.value = false
    loading.value = false
    return
  }

  try {
    const session = JSON.parse(adminSession)

    // Validate session structure
    if (!session.user || session.type !== 'admin') {
      console.log('❌ Invalid admin session structure')
      localStorage.removeItem('smanda_admin')
      isAuthenticated.value = false
      loading.value = false
      return
    }

    // Check if user has admin role
    if (session.user.peran !== 'admin' && session.user.peran !== 'panitia') {
      console.log('❌ User does not have admin role:', session.user.peran)
      isAuthenticated.value = false
      loading.value = false
      return
    }

    console.log('✅ Admin authenticated:', session.user.nama_lengkap)
    adminUser.value = session.user
    isAuthenticated.value = true
  } catch (error) {
    console.error('❌ Error parsing admin session:', error)
    localStorage.removeItem('smanda_admin')
    isAuthenticated.value = false
  } finally {
    loading.value = false
  }
}

// Functions
const generateQRTokens = () => {
  alert('Fitur generate QR tokens akan segera tersedia!')
}

const handleLogout = () => {
  if (confirm('Yakin ingin logout?')) {
    localStorage.removeItem('smanda_admin')
    localStorage.removeItem('smanda_user')
    localStorage.removeItem('smanda_session')
    router.push('/admin-login')
  }
}

// Lifecycle
onMounted(() => {
  checkAuth()

  // Jika tidak terautentikasi, redirect setelah delay
  if (!isAuthenticated.value) {
    setTimeout(() => {
      if (!isAuthenticated.value) {
        router.push('/admin-login')
      }
    }, 2000)
  }
})
</script>

<style scoped>
/* Loading Screen */
.loading-screen {
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

/* Unauthorized Screen */
.unauthorized {
  text-align: center;
  padding: 3rem;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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

/* Admin Dashboard Styles */
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

/* Tabs */
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

/* Tab Content */
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

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

.hint {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

/* Session Card */
.session-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.session-info p {
  margin: 0.5rem 0;
}

.status-active {
  color: #10b981;
  font-weight: 600;
}

/* QR Generator */
.qr-generator {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 600px;
}

.qr-stats p {
  margin: 0.5rem 0;
}

.qr-actions {
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background: #1e3a8a;
  color: white;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.hint-box {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1.5rem;
  color: #92400e;
}

/* Monitoring */
.monitoring {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.monitor-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.monitor-card {
  text-align: center;
  flex: 1;
}

.monitor-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1e3a8a;
}

.monitor-label {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.progress-bar {
  height: 10px;
  background: #e2e8f0;
  border-radius: 5px;
  overflow: hidden;
  margin: 1rem 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1e3a8a, #3b82f6);
  transition: width 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .tabs {
    overflow-x: auto;
  }

  .tab-btn {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }

  .monitor-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }
}
</style>
