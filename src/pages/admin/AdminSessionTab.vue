<template>
  <div class="session-tab">
    <!-- Section Header -->
    <div class="section-header">
      <h2>⚙️ Kelola Sesi Pemilihan</h2>
      <p>Kontrol manual sistem voting</p>
    </div>

    <!-- Empty State - No Active Session -->
    <div v-if="!activeSession" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>Belum ada sesi pemilihan aktif</h3>
      <p>Buat sesi baru untuk memulai proses pemilihan</p>
      <button @click="$emit('open-create-modal')" class="btn-primary">
        <span class="btn-icon">+</span>
        Buat Sesi Baru
      </button>
    </div>

    <!-- Session Management - Active Session -->
    <div v-else class="session-management">
      <!-- Session Card -->
      <div class="session-card">
        <div class="session-header">
          <h3>{{ activeSession.nama_sesi }}</h3>
          <div class="session-meta">
            <span class="session-year">{{ activeSession.tahun_ajaran }}</span>
            <span class="session-date">Dibuat: {{ formatDate(activeSession.dibuat_pada) }}</span>
          </div>
        </div>

        <!-- Session Status Display -->
        <div class="session-status-display">
          <div class="current-status">
            <span class="status-label">Status saat ini:</span>
            <span class="status-badge-large" :class="activeSession.status">
              {{ getStatusLabel(activeSession.status) }}
            </span>
          </div>

          <!-- Status Flow -->
          <div class="status-flow">
            <div
              class="flow-step"
              :class="{
                active: activeSession.status === 'draft',
                completed: ['pendaftaran', 'voting', 'selesai'].includes(activeSession.status),
              }"
            >
              <div class="step-circle">1</div>
              <div class="step-label">DRAFT</div>
            </div>

            <div class="flow-arrow">→</div>

            <div
              class="flow-step"
              :class="{
                active: activeSession.status === 'pendaftaran',
                completed: ['voting', 'selesai'].includes(activeSession.status),
              }"
            >
              <div class="step-circle">2</div>
              <div class="step-label">PENDAFTARAN</div>
            </div>

            <div class="flow-arrow">→</div>

            <div
              class="flow-step"
              :class="{
                active: activeSession.status === 'voting',
                completed: activeSession.status === 'selesai',
              }"
            >
              <div class="step-circle">3</div>
              <div class="step-label">VOTING</div>
            </div>

            <div class="flow-arrow">→</div>

            <div class="flow-step" :class="{ active: activeSession.status === 'selesai' }">
              <div class="step-circle">4</div>
              <div class="step-label">SELESAI</div>
            </div>
          </div>

          <!-- Status Info -->
          <div class="status-info" v-if="activeSession.status === 'voting'">
            <p>📊 Partisipasi: {{ participationRate }}% ({{ votedCount }}/{{ totalGuru }})</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="session-actions">
          <div class="action-group">
            <h4>Kontrol Sesi:</h4>

            <div class="action-buttons-grid">
              <!-- DRAFT → PENDAFTARAN -->
              <button
                v-if="activeSession.status === 'draft'"
                @click="$emit('confirm-action', 'bukaPendaftaran')"
                class="action-btn btn-primary"
                :disabled="loading"
              >
                <span class="action-icon">🚀</span>
                <span class="action-text">BUKA PENDAFTARAN</span>
                <span class="action-desc">Guru bisa daftar sebagai calon</span>
              </button>

              <!-- PENDAFTARAN → VOTING -->
              <button
                v-if="activeSession.status === 'pendaftaran'"
                @click="$emit('confirm-action', 'bukaVoting')"
                class="action-btn btn-success"
                :disabled="loading"
              >
                <span class="action-icon">🗳️</span>
                <span class="action-text">BUKA VOTING</span>
                <span class="action-desc">Auto generate token 6 digit untuk semua guru</span>
              </button>

              <!-- VOTING → SELESAI -->
              <button
                v-if="activeSession.status === 'voting'"
                @click="$emit('confirm-action', 'tutupVoting')"
                class="action-btn btn-warning"
                :disabled="loading"
              >
                <span class="action-icon">✅</span>
                <span class="action-text">TUTUP VOTING</span>
                <span class="action-desc">Selesaikan & umumkan hasil</span>
              </button>

              <!-- SELESAI → DRAFT (Reset) -->
              <button
                v-if="activeSession.status === 'selesai'"
                @click="$emit('confirm-action', 'resetSesi')"
                class="action-btn btn-danger"
                :disabled="loading"
              >
                <span class="action-icon">🔄</span>
                <span class="action-text">RESET SESI</span>
                <span class="action-desc">Kembali ke status DRAFT</span>
              </button>

              <!-- Additional Actions -->
              <button
                v-if="activeSession.status === 'pendaftaran'"
                @click="$emit('switch-tab', 'candidates')"
                class="action-btn btn-secondary"
              >
                <span class="action-icon">👥</span>
                <span class="action-text">VERIFIKASI CALON</span>
                <span class="action-desc">Lihat & verifikasi pendaftar</span>
              </button>

              <button
                v-if="activeSession.status === 'voting'"
                @click="$emit('switch-tab', 'monitor')"
                class="action-btn btn-info"
              >
                <span class="action-icon">📊</span>
                <span class="action-text">MONITOR VOTING</span>
                <span class="action-desc">Pantau perkembangan real-time</span>
              </button>
            </div>
          </div>

          <!-- Quick Info -->
          <div class="quick-info">
            <div class="info-card">
              <h5>📋 Panduan Status:</h5>
              <ul>
                <li><strong>DRAFT:</strong> Sesi dibuat, belum aktif</li>
                <li><strong>PENDAFTARAN:</strong> Guru bisa daftar sebagai calon</li>
                <li><strong>VOTING:</strong> Token otomatis dibuat, pemilih bisa voting</li>
                <li><strong>SELESAI:</strong> Voting ditutup, hasil final</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeSession: Object,
  stats: {
    type: Object,
    default: () => ({
      totalGuru: 0,
      votedCount: 0,
      participationRate: 0,
    }),
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

// ✅ FIX: Panggil defineEmits() tanpa assign ke variable
defineEmits(['open-create-modal', 'confirm-action', 'switch-tab'])

// Computed
const totalGuru = computed(() => props.stats.totalGuru || 0)
const votedCount = computed(() => props.stats.votedCount || 0)
const participationRate = computed(() => props.stats.participationRate || 0)

// Methods
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getStatusLabel = (status) => {
  const map = {
    draft: 'DRAFT',
    pendaftaran: 'PENDAFTARAN',
    voting: 'VOTING',
    selesai: 'SELESAI',
  }
  return map[status] || status
}
</script>

<style scoped>
/* CSS TETAP SAMA SEPERTI SEBELUMNYA */
.session-tab {
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

.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  margin-bottom: 2rem;
}

.btn-primary {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #1e40af;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.session-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.session-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.session-header h3 {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
  font-size: 1.4rem;
}

.session-meta {
  display: flex;
  gap: 1rem;
  color: #6b7280;
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.session-year {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
}

.session-status-display {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.current-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.status-label {
  font-weight: 600;
  color: #374151;
}

.status-badge-large {
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
}

.status-badge-large.draft {
  background: #f1f5f9;
  color: #64748b;
}

.status-badge-large.pendaftaran {
  background: #fef3c7;
  color: #92400e;
}

.status-badge-large.voting {
  background: #d1fae5;
  color: #065f46;
}

.status-badge-large.selesai {
  background: #d1fae5;
  color: #065f46;
  border: 2px solid #10b981;
}

.status-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem 0;
  flex-wrap: wrap;
}

.flow-step {
  text-align: center;
  padding: 0.75rem;
  min-width: 100px;
  opacity: 0.6;
  transition: all 0.3s;
}

.flow-step.active {
  opacity: 1;
  transform: scale(1.05);
}

.flow-step.completed {
  opacity: 0.8;
}

.flow-step.completed .step-circle {
  background: #10b981;
  color: white;
}

.flow-step.active .step-circle {
  background: #1e3a8a;
  color: white;
  box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.2);
}

.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin: 0 auto 0.5rem;
  transition: all 0.3s;
}

.step-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #374151;
}

.flow-arrow {
  color: #9ca3af;
  font-size: 1.2rem;
}

.status-info {
  text-align: center;
  color: #4b5563;
  font-size: 0.95rem;
  margin-top: 1rem;
}

.action-group {
  margin-bottom: 2rem;
}

.action-group h4 {
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.action-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.action-btn {
  padding: 1.5rem;
  border: none;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: white;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.action-btn.btn-primary {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
}

.action-btn.btn-success {
  background: linear-gradient(135deg, #059669, #10b981);
}

.action-btn.btn-warning {
  background: linear-gradient(135deg, #d97706, #f59e0b);
}

.action-btn.btn-danger {
  background: linear-gradient(135deg, #dc2626, #ef4444);
}

.action-btn.btn-secondary {
  background: linear-gradient(135deg, #4b5563, #6b7280);
}

.action-btn.btn-info {
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
}

.action-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.action-text {
  font-size: 1.1rem;
  font-weight: 700;
}

.action-desc {
  font-size: 0.9rem;
  opacity: 0.9;
  line-height: 1.4;
}

.quick-info {
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.info-card {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1.5rem;
}

.info-card h5 {
  color: #0369a1;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.info-card ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #1e40af;
}

.info-card li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .session-card {
    padding: 1.5rem;
  }

  .status-flow {
    flex-direction: column;
    gap: 0.5rem;
  }

  .flow-arrow {
    transform: rotate(90deg);
  }

  .flow-step {
    min-width: 100%;
  }

  .action-buttons-grid {
    grid-template-columns: 1fr;
  }

  .current-status {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
