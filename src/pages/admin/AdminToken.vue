<template>
  <div class="simple-token">
    <!-- Header -->
    <div class="page-header">
      <h1>🎫 Token Voting</h1>
      <button @click="$router.push('/admin')" class="back-btn">← Dashboard</button>
    </div>

    <!-- Session Info -->
    <div class="session-info" v-if="activeSession">
      <div class="session-status" :class="activeSession.status">
        {{ activeSession.status.toUpperCase() }}
      </div>
      <h3 class="text-black">{{ activeSession.nama_sesi }}</h3>
      <p class="text-dark">{{ sessionMessage }}</p>
    </div>

    <!-- Stats -->
    <div class="stats">
      <div class="stat">
        <div class="stat-number">{{ totalTokens }}</div>
        <div class="stat-label text-black">Total Token</div>
      </div>
      <div class="stat">
        <div class="stat-number">{{ availableTokens }}</div>
        <div class="stat-label text-black">Tersedia</div>
      </div>
      <div class="stat">
        <div class="stat-number">{{ usedTokens }}</div>
        <div class="stat-label text-black">Digunakan</div>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <button @click="generateTokens" class="btn-generate" :disabled="!canGenerate">
        🔄 Generate Token
      </button>
      <button @click="exportTokens" class="btn-export" :disabled="totalTokens === 0">
        📥 Export
      </button>
    </div>

    <!-- Token List -->
    <div class="token-list">
      <div v-for="token in tokenList" :key="token.id" :class="['token-card', token.status]">
        <div class="token-header">
          <span class="token-badge" :class="token.status">
            {{ token.statusText }}
          </span>
          <button @click="copyToken(token.token)" class="btn-copy">📋</button>
        </div>

        <div class="token-body">
          <div class="token-code">{{ token.token }}</div>
          <div class="token-owner">
            <div class="owner-avatar">{{ getInitials(token.nama) }}</div>
            <div class="owner-info">
              <strong class="text-black">{{ token.nama || 'Tidak diketahui' }}</strong>
              <small class="text-dark">{{ token.nip || 'N/A' }}</small>
            </div>
          </div>
        </div>

        <div class="token-meta">
          <div class="text-dark">Dibuat: {{ formatDate(token.dibuat_pada) }}</div>
          <div v-if="token.digunakan_pada" class="text-dark">
            Digunakan: {{ formatDate(token.digunakan_pada) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="tokenList.length === 0" class="empty">
      <div class="empty-icon">🎫</div>
      <p class="text-black">{{ emptyMessage }}</p>
      <button v-if="canGenerate" @click="generateTokens" class="btn-generate">
        🔄 Generate Token Sekarang
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'

// Data
const tokenList = ref([])
const activeSession = ref(null)

// Computed
const totalTokens = computed(() => tokenList.value.length)
const availableTokens = computed(() => tokenList.value.filter((t) => !t.sudah_digunakan).length)
const usedTokens = computed(() => tokenList.value.filter((t) => t.sudah_digunakan).length)

const canGenerate = computed(() => {
  return activeSession.value?.status === 'voting'
})

const sessionMessage = computed(() => {
  if (!activeSession.value) return 'Tidak ada sesi aktif'
  return activeSession.value.status === 'voting'
    ? 'Token sudah digenerate. Voting sedang berlangsung.'
    : 'Token akan digenerate otomatis saat buka voting.'
})

const emptyMessage = computed(() => {
  if (!activeSession.value) return 'Tidak ada sesi aktif'
  return activeSession.value.status === 'voting'
    ? 'Belum ada token yang digenerate'
    : 'Token akan dibuat otomatis saat sesi masuk status VOTING'
})

// Methods
const loadTokens = async () => {
  // Load active session
  const { data: session } = await supabase
    .from('sesi_pemilihan')
    .select('*')
    .order('dibuat_pada', { ascending: false })
    .limit(1)
    .single()

  activeSession.value = session

  if (!session?.id) {
    tokenList.value = []
    return
  }

  // Load tokens with user info
  const { data } = await supabase
    .from('token_qr')
    .select(
      `
      *,
      pengguna:pengguna_id (nama_lengkap, nip)
    `,
    )
    .eq('sesi_id', session.id)
    .order('dibuat_pada', { ascending: false })

  tokenList.value = (data || []).map((token) => ({
    ...token,
    nama: token.pengguna?.nama_lengkap || 'Unknown',
    nip: token.pengguna?.nip || 'N/A',
    status: token.sudah_digunakan ? 'used' : 'available',
    statusText: token.sudah_digunakan ? 'DIGUNAKAN' : 'TERSEDIA',
  }))
}

const generateTokens = async () => {
  if (!confirm('Generate token untuk semua guru aktif?')) return

  try {
    // Load active teachers
    const { data: activeGurus } = await supabase
      .from('pengguna')
      .select('id')
      .eq('peran', 'guru')
      .eq('is_active', true)

    if (!activeGurus || activeGurus.length === 0) {
      alert('Tidak ada guru aktif untuk digenerate token')
      return
    }

    // Generate tokens
    const tokensToInsert = []
    for (const guru of activeGurus) {
      const token = Math.floor(100000 + Math.random() * 900000).toString()
      tokensToInsert.push({
        pengguna_id: guru.id,
        sesi_id: activeSession.value.id,
        token: token,
        tipe_token: 'voting',
        kadaluarsa_pada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    const { error } = await supabase.from('token_qr').insert(tokensToInsert)

    if (error) {
      alert('❌ Gagal generate token: ' + error.message)
      return
    }

    await loadTokens()
    alert(`✅ ${tokensToInsert.length} token berhasil dibuat!`)
  } catch {
    alert('❌ Gagal generate token')
  }
}

const copyToken = (token) => {
  navigator.clipboard.writeText(token)
  alert(`Token ${token} disalin!`)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
  })
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

const exportTokens = () => {
  if (tokenList.value.length === 0) {
    alert('Tidak ada token untuk diexport')
    return
  }

  const csvContent = [
    ['Token', 'Nama', 'NIP', 'Status', 'Dibuat', 'Digunakan'],
    ...tokenList.value.map((t) => [
      t.token,
      t.nama,
      t.nip,
      t.statusText,
      formatDate(t.dibuat_pada),
      t.digunakan_pada ? formatDate(t.digunakan_pada) : '',
    ]),
  ]
    .map((row) => row.join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `token_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

// Lifecycle
onMounted(async () => {
  await loadTokens()
})
</script>

<style scoped>
.simple-token {
  padding: 1rem;
  max-width: 1000px;
  margin: 0 auto;
  background: #ffffff;
}

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
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #1e3a8a;
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

/* Session Info */
.session-info {
  background: #f0f9ff;
  border: 2px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5rem 0;
}

.session-status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
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

.session-info h3 {
  margin: 0 0 0.5rem 0;
  color: #000000;
  font-weight: 700;
}

.session-info p {
  margin: 0;
  color: #333333;
  font-weight: 600;
}

/* Stats */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.stat {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid #e5e7eb;
}

.stat-number {
  font-size: 1.8rem;
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

/* Actions */
.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn-generate {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  border: 2px solid #059669;
}

.btn-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-export {
  background: white;
  border: 2px solid #000000;
  color: #000000;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Token List */
.token-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.token-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #10b981;
  border: 2px solid #e5e7eb;
}

.token-card.used {
  border-left-color: #6b7280;
  opacity: 0.9;
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.token-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 800;
  color: #000000;
}

.token-badge.available {
  background: #d1fae5;
  border: 2px solid #10b981;
}

.token-badge.used {
  background: #e5e7eb;
  border: 2px solid #6b7280;
}

.btn-copy {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  color: #000000;
}

.token-body {
  text-align: center;
}

.token-code {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e3a8a;
  margin-bottom: 1rem;
  font-family: monospace;
  letter-spacing: 1px;
}

.token-owner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.owner-avatar {
  width: 40px;
  height: 40px;
  background: #000000;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.9rem;
  border: 2px solid #1e3a8a;
}

.owner-info {
  text-align: left;
}

.owner-info strong {
  display: block;
  font-size: 0.9rem;
  color: #000000;
  font-weight: 700;
}

.owner-info small {
  font-size: 0.8rem;
  color: #333333;
  font-weight: 600;
}

.token-meta {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #e5e7eb;
  font-size: 0.8rem;
  color: #333333;
  font-weight: 600;
}

/* Empty State */
.empty {
  text-align: center;
  padding: 3rem;
  color: #000000;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty p {
  margin-bottom: 1.5rem;
  font-weight: 700;
}

/* Responsive */
@media (max-width: 768px) {
  .stats {
    grid-template-columns: 1fr 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .token-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>
