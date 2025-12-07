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
          <small>Minimal: 2 kandidat</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👨‍🎓</div>
        <div class="stat-info">
          <h4>Waka Kesiswaan</h4>
          <p class="stat-number">{{ kesiswaanCount }}</p>
          <small>Minimal: 2 kandidat</small>
        </div>
      </div>
    </div>

    <!-- Eligibility Summary -->
    <div v-if="guruList.length > 0" class="eligibility-summary">
      <h3>📋 Statistik Eligibility Guru ({{ guruList.length }} total)</h3>
      <div class="eligibility-grid">
        <div class="eligibility-item" :class="eligibleCount > 0 ? 'success' : 'danger'">
          <span
            >{{ eligibleCount > 0 ? '✅' : '❌' }} Guru Eligible: {{ eligibleCount }}/{{
              guruList.length
            }}</span
          >
        </div>
        <div class="eligibility-item" :class="eligibleByStatus > 0 ? 'success' : 'danger'">
          <span
            >{{ eligibleByStatus > 0 ? '✅' : '❌' }} PNS/PPPK: {{ eligibleByStatus }}/{{
              guruList.length
            }}</span
          >
        </div>
        <div class="eligibility-item" :class="eligibleByMasaKerja > 0 ? 'success' : 'danger'">
          <span
            >{{ eligibleByMasaKerja > 0 ? '✅' : '❌' }} Masa Kerja ≥3thn:
            {{ eligibleByMasaKerja }}/{{ guruList.length }}</span
          >
        </div>
        <div class="eligibility-item" :class="eligibleBySisaPensiun > 0 ? 'success' : 'danger'">
          <span
            >{{ eligibleBySisaPensiun > 0 ? '✅' : '❌' }} Sisa Pensiun ≥3thn:
            {{ eligibleBySisaPensiun }}/{{ guruList.length }}</span
          >
        </div>
        <div class="eligibility-item warning" v-if="needsJedaPeriod > 0">
          <span>⚠️ Perlu Jeda Periode: {{ needsJedaPeriod }}/{{ guruList.length }}</span>
        </div>
        <div class="eligibility-item danger" v-if="manualNonEligibleCount > 0">
          <span>🚫 Manual Non-Eligible: {{ manualNonEligibleCount }}/{{ guruList.length }}</span>
        </div>
      </div>
      <div class="available-guru-info" v-if="availableGuruForCurrentPosition.length > 0">
        <p>
          🏆
          <strong
            >Guru Eligible untuk Posisi {{ form.jabatan === 'sarpras' ? 'Sarpras' : 'Kesiswaan' }}:
            {{ availableGuruForCurrentPosition.length }} orang</strong
          >
        </p>
        <small
          >Guru yang belum terdaftar sebagai kandidat di posisi ini (1 guru bisa di 2 posisi
          berbeda)</small
        >
      </div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <div class="tabs">
        <button @click="activeTab = 'all'" :class="{ active: activeTab === 'all' }">
          Semua ({{ kandidatList.length }})
        </button>
        <button @click="activeTab = 'sarpras'" :class="{ active: activeTab === 'sarpras' }">
          Sarpras ({{ sarprasCount }})
        </button>
        <button @click="activeTab = 'kesiswaan'" :class="{ active: activeTab === 'kesiswaan' }">
          Kesiswaan ({{ kesiswaanCount }})
        </button>
      </div>
      <button
        @click="addKandidat"
        class="btn-add"
        :disabled="!canAdd"
        :title="canAdd ? 'Tambah kandidat baru' : getDisabledReason()"
      >
        + Tambah Kandidat
      </button>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Kandidat</th>
            <th>NIP / Status</th>
            <th>Posisi</th>
            <th>Masa Kerja</th>
            <th>Sisa Pensiun</th>
            <th>Periode Jabatan</th>
            <th>Suara</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="k in filteredKandidat" :key="k.id" :class="getRowClass(k)">
            <td class="nomor-urut">{{ k.nomor_urut }}</td>
            <td>
              <div class="nama">
                <div>
                  <div class="nama-text">{{ k.nama }}</div>
                  <small class="pangkat">{{ k.golongan_ruang || 'Tidak ada pangkat' }}</small>
                  <div v-if="getWarningMessage(k)" class="warning-text small-text">
                    ⚠️ {{ getWarningMessage(k) }}
                  </div>
                  <!-- Tampilkan jika guru ini juga kandidat di posisi lain -->
                  <div v-if="getOtherPositions(k).length > 0" class="other-position-info">
                    <small>👥 Juga kandidat di: {{ getOtherPositions(k).join(', ') }}</small>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <code class="nip">{{ k.nip || 'No NIP' }}</code>
              <div :class="['status-badge', k.status_kepegawaian?.toLowerCase()]">
                {{ k.status_kepegawaian }}
              </div>
            </td>
            <td>
              <span :class="['badge', k.jabatan]">
                {{ k.jabatan === 'sarpras' ? 'Waka Sarpras' : 'Waka Kesiswaan' }}
              </span>
            </td>
            <td class="masa-kerja">
              {{ calculateMasaKerja(k) }}
              <div v-if="getMasaKerjaTahun(k) < 3" class="warning-badge">⚠️ &lt;3 tahun</div>
            </td>
            <td class="sisa-pensiun">
              {{ calculateSisaMenujuPensiun(k) }}
              <div :class="getSisaPensiunClass(k)">
                {{ getSisaPensiunStatus(k) }}
              </div>
            </td>
            <td class="periode-jabatan">
              <div v-if="getJumlahPeriode(k) > 0">
                {{ getJumlahPeriode(k) }} periode
                <div v-if="needsJeda(k)" class="danger-badge">⚠️ Perlu jeda</div>
              </div>
              <div v-else class="tidak-ada">Belum pernah</div>
            </td>
            <td>
              <div class="votes">
                <span class="count">{{ k.total_suara || 0 }}</span>
                <div class="progress">
                  <div class="bar" :style="{ width: getPercentage(k) + '%' }"></div>
                </div>
              </div>
            </td>
            <td class="aksi">
              <button @click="showDetail(k)" class="btn-action info" title="Detail">ℹ️</button>
              <button
                @click="editKandidat(k)"
                class="btn-action edit"
                :disabled="!canEdit"
                :title="canEdit ? 'Edit kandidat' : 'Hanya bisa edit saat sesi pendaftaran'"
              >
                ✏️
              </button>
              <button
                @click="deleteKandidat(k)"
                class="btn-action delete"
                :disabled="!canDelete"
                :title="canDelete ? 'Hapus kandidat' : 'Hanya bisa hapus saat sesi pendaftaran'"
              >
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredKandidat.length === 0" class="empty">
        <p>{{ emptyMessage }}</p>
        <button v-if="canAdd" @click="addKandidat" class="btn-add">
          + Tambah Kandidat Pertama
        </button>
        <div v-else class="empty-info">
          <p>⏳ {{ getDisabledReason() }}</p>
        </div>
      </div>
    </div>

    <!-- Modal Tambah/Edit Kandidat -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editing ? '✏️ Edit Kandidat' : '➕ Tambah Kandidat Baru' }}</h3>
          <button @click="closeModal" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveKandidat">
            <div class="form-grid">
              <div class="form-group">
                <label for="jabatan">Posisi *</label>
                <select id="jabatan" v-model="form.jabatan" required @change="resetSelectedGuru">
                  <option value="sarpras">Wakil Kepala Sekolah Sarpras</option>
                  <option value="kesiswaan">Wakil Kepala Sekolah Kesiswaan</option>
                </select>
                <small>Pilih posisi yang akan dicalonkan. 1 guru bisa di 2 posisi berbeda.</small>
              </div>

              <div class="form-group">
                <label for="pengguna_id">Guru *</label>
                <select
                  id="pengguna_id"
                  v-model="form.pengguna_id"
                  required
                  :disabled="editing"
                  @change="onGuruSelected"
                >
                  <option value="">-- Pilih Guru Eligible --</option>
                  <option
                    v-for="guru in availableGuruForCurrentPosition"
                    :key="guru.id"
                    :value="guru.id"
                    :disabled="isGuruAlreadyCandidateInThisPosition(guru, form.jabatan)"
                  >
                    {{ guru.nama_lengkap }}
                    ({{ guru.nip || 'No NIP' }}) - {{ guru.golongan_ruang || 'No pangkat' }}
                    <!-- Tampilkan jika guru sudah jadi kandidat di posisi lain -->
                    <span
                      v-if="isGuruAlreadyCandidateInOtherPosition(guru, form.jabatan)"
                      class="already-candidate-info"
                    >
                      - ✅ Sudah kandidat di {{ getOtherPositionForGuru(guru, form.jabatan) }}
                    </span>
                  </option>
                </select>
                <div class="info-note">
                  <p>
                    💡 <strong>Aturan:</strong> 1 guru dapat menjadi kandidat di
                    <strong>kedua posisi</strong> (Sarpras dan Kesiswaan) secara bersamaan, tetapi
                    tidak boleh dua kali di posisi yang sama.
                  </p>
                </div>
                <div v-if="selectedGuruDetail" class="guru-detail">
                  <h4>Detail Guru Terpilih:</h4>
                  <p><strong>Nama:</strong> {{ selectedGuruDetail.nama_lengkap }}</p>
                  <p><strong>NIP:</strong> {{ selectedGuruDetail.nip || 'Tidak ada' }}</p>
                  <p><strong>Status:</strong> {{ selectedGuruDetail.status_kepegawaian }}</p>
                  <p>
                    <strong>Pangkat:</strong> {{ selectedGuruDetail.golongan_ruang || 'Tidak ada' }}
                  </p>
                  <p><strong>Masa Kerja:</strong> {{ calculateMasaKerja(selectedGuruDetail) }}</p>
                  <p>
                    <strong>Sisa Pensiun:</strong>
                    {{ calculateSisaMenujuPensiun(selectedGuruDetail) }}
                  </p>
                  <p>
                    <strong>Periode Sebelumnya:</strong>
                    {{ getJumlahPeriode(selectedGuruDetail) }} periode
                    <span v-if="needsJeda(selectedGuruDetail)" class="danger-text">
                      ⚠️ Perlu jeda periode
                    </span>
                  </p>

                  <!-- Tampilkan posisi lain yang sudah didaftarkan -->
                  <div
                    v-if="getOtherPositionsForSelectedGuru.length > 0"
                    class="other-positions-info"
                  >
                    <h5>📍 Posisi Lain yang Sudah Didaftarkan:</h5>
                    <ul>
                      <li v-for="pos in getOtherPositionsForSelectedGuru" :key="pos">
                        {{ pos === 'sarpras' ? 'Waka Sarpras' : 'Waka Kesiswaan' }}
                      </li>
                    </ul>
                  </div>

                  <div v-if="!isEligible(selectedGuruDetail)" class="eligibility-warnings">
                    <h5>⚠️ Masalah Eligibility:</h5>
                    <ul>
                      <li
                        v-for="warning in getEligibilityWarnings(selectedGuruDetail)"
                        :key="warning"
                      >
                        {{ warning }}
                      </li>
                    </ul>
                  </div>
                  <div v-else class="eligibility-success">
                    <h5>✅ Status: ELIGIBLE</h5>
                    <p>Guru ini memenuhi semua syarat untuk menjadi kandidat</p>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="nomor_urut">Nomor Urut *</label>
                <input
                  id="nomor_urut"
                  v-model.number="form.nomor_urut"
                  type="number"
                  min="1"
                  required
                  placeholder="1, 2, 3, ..."
                />
                <small
                  >Nomor urut unik untuk posisi ini. Tidak boleh sama dengan kandidat lain di posisi
                  yang sama.</small
                >
                <div v-if="nomorUrutError" class="error-text">{{ nomorUrutError }}</div>
              </div>

              <div v-if="editing" class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="form.reset_suara" />
                  <span>Reset Jumlah Suara ke 0</span>
                </label>
                <small>Centang jika ingin mereset perolehan suara kandidat ini</small>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-outline">Batal</button>
          <button @click="saveKandidat" class="btn btn-primary" :disabled="!formValid || isSaving">
            {{ isSaving ? 'Menyimpan...' : editing ? '💾 Update' : '💾 Simpan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Detail Kandidat -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal">
        <div class="modal-header">
          <h3>📋 Detail Kandidat</h3>
          <button @click="closeDetailModal" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedKandidat" class="detail-grid">
            <div class="detail-item">
              <label>Nama:</label>
              <span>{{ selectedKandidat.nama }}</span>
            </div>
            <div class="detail-item">
              <label>NIP:</label>
              <span
                ><code>{{ selectedKandidat.nip || 'Tidak ada' }}</code></span
              >
            </div>
            <div class="detail-item">
              <label>Posisi:</label>
              <span :class="['badge', selectedKandidat.jabatan]">
                {{ selectedKandidat.jabatan === 'sarpras' ? 'Waka Sarpras' : 'Waka Kesiswaan' }}
              </span>
            </div>

            <!-- Tampilkan posisi lain jika ada -->
            <div class="detail-item" v-if="getOtherPositions(selectedKandidat).length > 0">
              <label>Posisi Lain yang Didaftarkan:</label>
              <div class="other-positions-list">
                <span
                  v-for="pos in getOtherPositions(selectedKandidat)"
                  :key="pos"
                  class="badge other"
                >
                  {{ pos === 'sarpras' ? 'Waka Sarpras' : 'Waka Kesiswaan' }}
                </span>
              </div>
            </div>

            <div class="detail-item">
              <label>Status Kepegawaian:</label>
              <span :class="['status-badge', selectedKandidat.status_kepegawaian?.toLowerCase()]">
                {{ selectedKandidat.status_kepegawaian }}
              </span>
            </div>
            <div class="detail-item">
              <label>Pangkat/Golongan:</label>
              <span>{{ selectedKandidat.golongan_ruang || 'Tidak ada' }}</span>
            </div>
            <div class="detail-item">
              <label>Masa Kerja:</label>
              <span>{{ calculateMasaKerja(selectedKandidat) }}</span>
            </div>
            <div class="detail-item">
              <label>Sisa Menuju Pensiun:</label>
              <span :class="getSisaPensiunClass(selectedKandidat)">
                {{ calculateSisaMenujuPensiun(selectedKandidat) }}
                ({{ getSisaPensiunStatus(selectedKandidat) }})
              </span>
            </div>
            <div class="detail-item">
              <label>Jumlah Periode Jabatan:</label>
              <span>{{ getJumlahPeriode(selectedKandidat) }} periode</span>
              <div v-if="needsJeda(selectedKandidat)" class="danger-text">
                ⚠️ Guru ini telah menjabat 2 periode berturut-turut, perlu jeda 1 periode
              </div>
            </div>
            <div class="detail-item">
              <label>Status Eligibility:</label>
              <span :class="isEligible(selectedKandidat) ? 'success-text' : 'danger-text'">
                {{ isEligible(selectedKandidat) ? '✅ ELIGIBLE' : '❌ NON-ELIGIBLE' }}
              </span>
              <div v-if="!isEligible(selectedKandidat)" class="warning-list">
                <strong>Alasan:</strong>
                <ul>
                  <li v-for="reason in getEligibilityReason(selectedKandidat)" :key="reason">
                    {{ reason }}
                  </li>
                </ul>
              </div>
            </div>
            <div class="detail-item">
              <label>Total Suara:</label>
              <span class="suara-count">{{ selectedKandidat.total_suara || 0 }} suara</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeDetailModal" class="btn btn-outline">Tutup</button>
          <button v-if="canEdit" @click="editKandidat(selectedKandidat)" class="btn btn-primary">
            ✏️ Edit
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/utils/supabase'

// ==================== STATE ====================
const kandidatList = ref([])
const guruList = ref([])
const periodeJabatanList = ref([])
const activeSession = ref(null)
const showModal = ref(false)
const showDetailModal = ref(false)
const editing = ref(false)
const activeTab = ref('all')
const isSaving = ref(false)
const selectedKandidat = ref(null)

// Form state
const form = ref({
  id: null,
  jabatan: 'sarpras',
  pengguna_id: '',
  nomor_urut: 1,
  reset_suara: false,
})

// ==================== COMPUTED PROPERTIES ====================
const sarprasCount = computed(
  () => kandidatList.value.filter((k) => k.jabatan === 'sarpras').length,
)
const kesiswaanCount = computed(
  () => kandidatList.value.filter((k) => k.jabatan === 'kesiswaan').length,
)

const filteredKandidat = computed(() => {
  if (activeTab.value === 'all') return kandidatList.value
  return kandidatList.value.filter((k) => k.jabatan === activeTab.value)
})

const canAdd = computed(() => {
  return activeSession.value?.status === 'pendaftaran'
})

const canEdit = computed(() => {
  return activeSession.value?.status === 'pendaftaran'
})

const canDelete = computed(() => {
  return activeSession.value?.status === 'pendaftaran'
})

const emptyMessage = computed(() => {
  if (activeTab.value !== 'all') {
    return `Belum ada kandidat untuk posisi ${activeTab.value === 'sarpras' ? 'Sarpras' : 'Kesiswaan'}`
  }
  return 'Belum ada kandidat untuk sesi ini'
})

// ==================== FUNGSI PARSING NIP ====================
const parseNIP = (nip) => {
  if (!nip || typeof nip !== 'string') return null
  const nipStr = nip.trim()
  if (nipStr.length !== 18) return null

  try {
    // Format PNS: tanggal lahir 8 digit + tanggal pengangkatan 8 digit
    if (isValidDate(nipStr.substring(0, 8)) && isValidDate(nipStr.substring(8, 16))) {
      return {
        format: 'PNS',
        tanggal_lahir: nipStr.substring(0, 8),
        tgl_pengangkatan: nipStr.substring(8, 16),
        jenis_kelamin: nipStr.substring(16, 17),
        nomor_urut: nipStr.substring(17, 18),
        tahun_lahir: parseInt(nipStr.substring(0, 4)),
        bulan_lahir: parseInt(nipStr.substring(4, 6)),
        hari_lahir: parseInt(nipStr.substring(6, 8)),
        tahun_pengangkatan: parseInt(nipStr.substring(8, 12)),
        bulan_pengangkatan: parseInt(nipStr.substring(12, 14)),
        hari_pengangkatan: parseInt(nipStr.substring(14, 16)),
      }
    }
    // Format PPPK: tanggal lahir 8 digit + tahun penetapan 6 digit
    else if (isValidDate(nipStr.substring(0, 8))) {
      return {
        format: 'PPPK',
        tanggal_lahir: nipStr.substring(0, 8),
        tahun_penetapan: nipStr.substring(8, 14),
        jenis_kelamin: nipStr.substring(14, 15),
        nomor_urut: nipStr.substring(15, 18),
        tahun_lahir: parseInt(nipStr.substring(0, 4)),
        bulan_lahir: parseInt(nipStr.substring(4, 6)),
        hari_lahir: parseInt(nipStr.substring(6, 8)),
      }
    }
    return null
  } catch (error) {
    console.error('Error parsing NIP:', error)
    return null
  }
}

const isValidDate = (dateStr) => {
  if (dateStr.length !== 8) return false
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6))
  const day = parseInt(dateStr.substring(6, 8))

  if (isNaN(year) || isNaN(month) || isNaN(day)) return false
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false

  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

const isNIPValid = (nip) => parseNIP(nip) !== null

const calculateMasaKerja = (guru) => {
  const parsed = parseNIP(guru?.nip)
  if (!parsed) return '?'

  if (parsed.format === 'PPPK') {
    const tahunPenetapan = parseInt(parsed.tahun_penetapan.substring(0, 4))
    const sekarang = new Date().getFullYear()
    const masaKerja = sekarang - tahunPenetapan
    return masaKerja <= 0 ? '< 1 thn' : `${masaKerja} thn`
  }

  // Untuk PNS
  const { tahun_pengangkatan, bulan_pengangkatan, hari_pengangkatan } = parsed
  const sekarang = new Date()
  const tglPengangkatan = new Date(tahun_pengangkatan, bulan_pengangkatan - 1, hari_pengangkatan)

  let bulan = (sekarang.getFullYear() - tglPengangkatan.getFullYear()) * 12
  bulan += sekarang.getMonth() - tglPengangkatan.getMonth()

  if (sekarang.getDate() < tglPengangkatan.getDate()) {
    bulan--
  }

  const tahun = Math.floor(bulan / 12)
  const sisaBulan = bulan % 12

  if (tahun === 0) return `${sisaBulan} bln`
  if (sisaBulan === 0) return `${tahun} thn`
  return `${tahun} thn ${sisaBulan} bln`
}

const calculateMasaKerjaTahun = (guru) => {
  const masaKerja = calculateMasaKerja(guru)
  if (masaKerja === '?') return 0
  const tahunMatch = masaKerja.match(/(\d+)\s*thn/)
  return tahunMatch ? parseInt(tahunMatch[1]) : 0
}

const calculateSisaMenujuPensiun = (guru) => {
  const usia = calculateUsia(guru?.nip)
  if (usia === '?') return '?'
  const sisa = 60 - usia
  return sisa > 0 ? sisa : 0
}

const calculateUsia = (nip) => {
  const parsed = parseNIP(nip)
  if (!parsed) return '?'

  const { tahun_lahir, bulan_lahir, hari_lahir } = parsed
  const lahir = new Date(tahun_lahir, bulan_lahir - 1, hari_lahir)
  const sekarang = new Date()

  let usia = sekarang.getFullYear() - lahir.getFullYear()
  const m = sekarang.getMonth() - lahir.getMonth()

  if (m < 0 || (m === 0 && sekarang.getDate() < lahir.getDate())) {
    usia--
  }

  return usia
}

const getSisaPensiunClass = (guru) => {
  const sisa = calculateSisaMenujuPensiun(guru)
  if (sisa === '?') return ''
  if (sisa < 3) return 'danger-text'
  if (sisa < 5) return 'warning-text'
  return 'success-text'
}

const getSisaPensiunStatus = (guru) => {
  const sisa = calculateSisaMenujuPensiun(guru)
  if (sisa === '?') return 'tidak diketahui'
  if (sisa < 1) return 'sudah pensiun'
  if (sisa < 3) return 'akan pensiun segera'
  if (sisa < 5) return 'akan pensiun dalam 5 tahun'
  return 'masih lama'
}

// ==================== FUNGSI ELIGIBILITY ====================
const isPNSatauPPPK = (status) => ['PNS', 'PPPK'].includes(status)

const isEligible = (guru) => {
  if (!guru) return false
  if (guru.peran !== 'guru') return false
  if (!isPNSatauPPPK(guru.status_kepegawaian)) return false
  if (!guru.nip || !isNIPValid(guru.nip)) return false

  // Masa kerja ≥ 3 tahun
  if (calculateMasaKerjaTahun(guru) < 3) return false

  // Sisa pensiun ≥ 3 tahun
  const sisa = calculateSisaMenujuPensiun(guru)
  if (sisa === '?' || sisa < 3) return false

  // Bukan manual non-eligible
  if (guru.is_manual_noneligible) return false

  return true
}

const getEligibilityReason = (guru) => {
  const reasons = []
  if (!guru) return ['Data guru tidak ditemukan']

  if (guru.peran !== 'guru') reasons.push('Bukan guru')
  if (!isPNSatauPPPK(guru.status_kepegawaian)) reasons.push('Bukan PNS/PPPK')
  if (!guru.nip) reasons.push('NIP kosong')
  else if (!isNIPValid(guru.nip)) reasons.push('NIP tidak valid')
  else {
    if (calculateMasaKerjaTahun(guru) < 3) reasons.push('Masa kerja < 3 tahun')
    const sisa = calculateSisaMenujuPensiun(guru)
    if (sisa === '?' || sisa < 3) reasons.push('Sisa pensiun < 3 tahun')
  }
  if (guru.is_manual_noneligible) reasons.push('Ditandai manual non-eligible')

  return reasons.length > 0 ? reasons : ['Tidak diketahui']
}

const getWarningMessage = (guru) => {
  if (!guru || guru.peran !== 'guru') return ''
  const warnings = []

  if (!isPNSatauPPPK(guru.status_kepegawaian)) warnings.push('Bukan PNS/PPPK')
  if (!guru.nip) warnings.push('NIP kosong')
  else if (!isNIPValid(guru.nip)) warnings.push('NIP tidak valid')
  else {
    if (calculateMasaKerjaTahun(guru) < 3) warnings.push('Masa kerja < 3thn')
    const sisa = calculateSisaMenujuPensiun(guru)
    if (sisa === '?' || sisa < 3) warnings.push('Sisa pensiun < 3thn')
  }

  return warnings.length > 0 ? warnings.join(', ') : ''
}

// Statistik eligibility
const eligibleCount = computed(() => guruList.value.filter((g) => isEligible(g)).length)

const eligibleByStatus = computed(
  () => guruList.value.filter((g) => isPNSatauPPPK(g.status_kepegawaian)).length,
)

const eligibleByMasaKerja = computed(
  () => guruList.value.filter((g) => calculateMasaKerjaTahun(g) >= 3).length,
)

const eligibleBySisaPensiun = computed(
  () =>
    guruList.value.filter((g) => {
      const sisa = calculateSisaMenujuPensiun(g)
      return sisa !== '?' && sisa >= 3
    }).length,
)

const needsJedaPeriod = computed(() => guruList.value.filter((g) => needsJeda(g)).length)

const manualNonEligibleCount = computed(
  () => guruList.value.filter((g) => g.is_manual_noneligible).length,
)

// ==================== FUNGSI UNTUK 1 GURU 2 POSISI ====================
// Cek apakah guru sudah jadi kandidat di posisi INI
const isGuruAlreadyCandidateInThisPosition = (guru, position) => {
  return kandidatList.value.some((k) => k.pengguna_id === guru.id && k.jabatan === position)
}

// Cek apakah guru sudah jadi kandidat di posisi LAIN
const isGuruAlreadyCandidateInOtherPosition = (guru, currentPosition) => {
  return kandidatList.value.some((k) => k.pengguna_id === guru.id && k.jabatan !== currentPosition)
}

// Dapatkan posisi lain untuk guru
const getOtherPositionForGuru = (guru, currentPosition) => {
  const otherPosition = kandidatList.value.find(
    (k) => k.pengguna_id === guru.id && k.jabatan !== currentPosition,
  )
  return otherPosition ? (otherPosition.jabatan === 'sarpras' ? 'Sarpras' : 'Kesiswaan') : ''
}

// Available guru untuk posisi saat ini (tidak boleh sudah jadi kandidat di posisi ini)
const availableGuruForCurrentPosition = computed(() => {
  const currentPosition = form.value.jabatan

  return guruList.value.filter((g) => {
    // Filter yang eligible
    const eligible = isEligible(g)
    if (!eligible) return false

    // Filter yang aktif
    if (!g.is_active) return false

    // Filter yang tidak perlu jeda periode
    if (needsJeda(g)) return false

    // Filter guru yang BELUM jadi kandidat di POSISI INI
    // BOLEH sudah jadi kandidat di posisi lain
    const alreadyInThisPosition = kandidatList.value.some(
      (k) => k.pengguna_id === g.id && k.jabatan === currentPosition,
    )

    return !alreadyInThisPosition
  })
})

const selectedGuruDetail = computed(() => {
  if (!form.value.pengguna_id) return null
  return guruList.value.find((g) => g.id === form.value.pengguna_id)
})

// Dapatkan posisi lain untuk kandidat terpilih di modal
const getOtherPositionsForSelectedGuru = computed(() => {
  if (!selectedGuruDetail.value) return []
  const currentPosition = form.value.jabatan
  const positions = []

  kandidatList.value.forEach((k) => {
    if (k.pengguna_id === selectedGuruDetail.value.id && k.jabatan !== currentPosition) {
      positions.push(k.jabatan)
    }
  })

  return positions
})

// Dapatkan posisi lain untuk kandidat di tabel
const getOtherPositions = (kandidat) => {
  const positions = []

  kandidatList.value.forEach((k) => {
    if (k.pengguna_id === kandidat.pengguna_id && k.id !== kandidat.id) {
      positions.push(k.jabatan === 'sarpras' ? 'Sarpras' : 'Kesiswaan')
    }
  })

  return positions
}

const formValid = computed(() => {
  if (!form.value.pengguna_id || !form.value.nomor_urut) return false

  // Validasi nomor urut unik hanya untuk posisi yang sama
  const existing = kandidatList.value.find(
    (k) =>
      k.jabatan === form.value.jabatan &&
      k.nomor_urut === form.value.nomor_urut &&
      (!editing.value || k.id !== form.value.id),
  )

  return !existing
})

const nomorUrutError = computed(() => {
  if (!form.value.nomor_urut) return ''

  const existing = kandidatList.value.find(
    (k) =>
      k.jabatan === form.value.jabatan &&
      k.nomor_urut === form.value.nomor_urut &&
      (!editing.value || k.id !== form.value.id),
  )

  return existing ? `Nomor urut ${form.value.nomor_urut} sudah digunakan untuk posisi ini` : ''
})

// ==================== HELPER FUNCTIONS ====================
const getPercentage = (kandidat) => {
  const samePosition = kandidatList.value.filter((k) => k.jabatan === kandidat.jabatan)
  const total = samePosition.reduce((sum, k) => sum + (k.total_suara || 0), 0)
  return total > 0 ? Math.round((kandidat.total_suara / total) * 100) : 0
}

const getMasaKerjaTahun = (guru) => calculateMasaKerjaTahun(guru)

const getEligibilityWarnings = (guru) => {
  const warnings = []

  if (guru.peran !== 'guru') warnings.push('Bukan guru')
  if (!isPNSatauPPPK(guru.status_kepegawaian)) warnings.push('Bukan PNS/PPPK')
  if (!guru.nip) warnings.push('NIP kosong')
  else if (!isNIPValid(guru.nip)) warnings.push('NIP tidak valid')
  else {
    if (calculateMasaKerjaTahun(guru) < 3) warnings.push('Masa kerja < 3 tahun')
    const sisa = calculateSisaMenujuPensiun(guru)
    if (sisa === '?' || sisa < 3) warnings.push('Sisa pensiun < 3 tahun')
  }
  if (guru.is_manual_noneligible) warnings.push('Ditandai manual non-eligible')

  return warnings
}

// ==================== PERIODE JABATAN ====================
const getJumlahPeriode = (guru) => {
  if (!guru?.id) return 0
  const periode = periodeJabatanList.value.filter((p) => p.pengguna_id === guru.id)
  return periode.length
}

const needsJeda = (guru) => {
  if (!guru?.id) return false

  // Ambil periode jabatan untuk guru ini
  const periode = periodeJabatanList.value
    .filter((p) => p.pengguna_id === guru.id)
    .sort((a, b) => b.tahun_mulai - a.tahun_mulai) // Urut dari terbaru

  // Jika sudah menjabat 2 periode berturut-turut
  if (periode.length >= 2) {
    const terbaru = periode[0]
    const sebelumnya = periode[1]

    // Cek apakah berturut-turut (selisih 1 periode/2 tahun)
    if (terbaru.tahun_mulai - sebelumnya.tahun_selesai <= 2) {
      // Cek apakah sudah cukup jeda (minimal 2 tahun jeda)
      const tahunSekarang = new Date().getFullYear()
      if (terbaru.tahun_selesai && tahunSekarang - terbaru.tahun_selesai < 2) {
        return true // Masih perlu jeda
      }
    }
  }

  return false
}

const getRowClass = (kandidat) => {
  if (!kandidat.is_active) return 'inactive-row'
  if (isEligible(kandidat)) return 'eligible-row'
  return ''
}

const getDisabledReason = () => {
  if (!activeSession.value) return 'Tidak ada sesi aktif'
  if (activeSession.value.status === 'draft') return 'Sesi masih draft'
  if (activeSession.value.status === 'voting') return 'Sesi voting sedang berlangsung'
  if (activeSession.value.status === 'selesai') return 'Sesi sudah selesai'
  return ''
}

// ==================== DATA LOADING ====================
const loadData = async () => {
  try {
    // Load active session
    const { data: session, error: sessionError } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .order('dibuat_pada', { ascending: false })
      .limit(1)
      .single()

    if (sessionError) {
      console.error('Error loading session:', sessionError)
      activeSession.value = null
    } else {
      activeSession.value = session
    }

    // Load kandidat dengan data pengguna
    const { data: kandidat, error: kandidatError } = await supabase
      .from('kandidat')
      .select(
        `
        *,
        pengguna:pengguna_id (
          id,
          nama_lengkap,
          nip,
          tanggal_lahir,
          peran,
          golongan_ruang,
          pangkat,
          status_kepegawaian,
          is_active,
          is_manual_noneligible
        )
      `,
      )
      .eq('sesi_id', activeSession.value?.id || '')
      .order('jabatan')
      .order('nomor_urut')

    if (kandidatError) throw kandidatError

    kandidatList.value = (kandidat || []).map((k) => ({
      ...k,
      nama: k.pengguna?.nama_lengkap || 'Unknown',
      nip: k.pengguna?.nip,
      tanggal_lahir: k.pengguna?.tanggal_lahir,
      golongan_ruang: k.pengguna?.golongan_ruang,
      pangkat: k.pengguna?.pangkat,
      status_kepegawaian: k.pengguna?.status_kepegawaian,
      peran: k.pengguna?.peran,
      is_active: k.pengguna?.is_active,
      is_manual_noneligible: k.pengguna?.is_manual_noneligible,
    }))

    // Load semua guru untuk dropdown
    const { data: guru, error: guruError } = await supabase
      .from('pengguna')
      .select('*')
      .eq('peran', 'guru')
      .eq('is_active', true)
      .order('nama_lengkap')

    if (guruError) throw guruError
    guruList.value = guru || []

    // Load periode jabatan untuk cek jeda periode
    const { data: periode, error: periodeError } = await supabase
      .from('periode_jabatan')
      .select('*')
      .order('tahun_mulai', { ascending: false })

    if (periodeError) throw periodeError
    periodeJabatanList.value = periode || []
  } catch (error) {
    console.error('Load error:', error)
    // Set default empty arrays on error
    kandidatList.value = []
    guruList.value = []
    periodeJabatanList.value = []

    // Show user-friendly error
    alert('Gagal memuat data. Silakan refresh halaman.')
  }
}

// ==================== MODAL FUNCTIONS ====================
const resetSelectedGuru = () => {
  form.value.pengguna_id = ''
  form.value.nomor_urut =
    kandidatList.value.filter((k) => k.jabatan === form.value.jabatan).length + 1
}

const onGuruSelected = () => {
  if (form.value.pengguna_id) {
    // Auto-set nomor urut jika belum diisi
    if (!form.value.nomor_urut) {
      form.value.nomor_urut =
        kandidatList.value.filter((k) => k.jabatan === form.value.jabatan).length + 1
    }
  }
}

const addKandidat = () => {
  if (!canAdd.value) {
    alert('Hanya bisa menambah kandidat saat sesi PENDAFTARAN')
    return
  }

  editing.value = false
  form.value = {
    id: null,
    jabatan: 'sarpras',
    pengguna_id: '',
    nomor_urut: kandidatList.value.filter((k) => k.jabatan === 'sarpras').length + 1,
    reset_suara: false,
  }
  showModal.value = true
}

const editKandidat = (k) => {
  if (!canEdit.value) {
    alert('Hanya bisa mengedit kandidat saat sesi PENDAFTARAN')
    return
  }

  editing.value = true
  selectedKandidat.value = k
  form.value = {
    id: k.id,
    jabatan: k.jabatan,
    pengguna_id: k.pengguna_id,
    nomor_urut: k.nomor_urut,
    reset_suara: false,
  }
  showModal.value = true
}

const showDetail = (k) => {
  selectedKandidat.value = k
  showDetailModal.value = true
}

const saveKandidat = async () => {
  if (!formValid.value) {
    alert('Form tidak valid. Periksa nomor urut atau data lainnya.')
    return
  }

  if (!activeSession.value?.id) {
    alert('Tidak ada sesi aktif!')
    return
  }

  // Validasi guru eligible
  const selectedGuru = guruList.value.find((g) => g.id === form.value.pengguna_id)
  if (!selectedGuru) {
    alert('Guru tidak ditemukan!')
    return
  }

  if (!isEligible(selectedGuru)) {
    const reasons = getEligibilityReason(selectedGuru)
    alert(`❌ ${selectedGuru.nama_lengkap} tidak eligible!\nAlasan:\n- ${reasons.join('\n- ')}`)
    return
  }

  // Validasi periode jeda
  if (needsJeda(selectedGuru)) {
    alert(
      `❌ ${selectedGuru.nama_lengkap} perlu jeda periode!\nGuru ini telah menjabat 2 periode berturut-turut dan perlu jeda minimal 2 tahun.`,
    )
    return
  }

  // Validasi: Guru sudah jadi kandidat di posisi yang sama?
  const alreadyInSamePosition = kandidatList.value.some(
    (k) =>
      k.pengguna_id === form.value.pengguna_id &&
      k.jabatan === form.value.jabatan &&
      (!editing.value || k.id !== form.value.id),
  )

  if (alreadyInSamePosition) {
    alert(`❌ ${selectedGuru.nama_lengkap} sudah terdaftar sebagai kandidat di posisi ini!`)
    return
  }

  // Tampilkan konfirmasi jika guru sudah jadi kandidat di posisi lain
  if (isGuruAlreadyCandidateInOtherPosition(selectedGuru, form.value.jabatan) && !editing.value) {
    const otherPosition = getOtherPositionForGuru(selectedGuru, form.value.jabatan)
    const confirmMessage = `⚠️ ${selectedGuru.nama_lengkap} sudah terdaftar sebagai kandidat di posisi ${otherPosition}.\n\nApakah Anda yakin ingin mendaftarkan guru ini juga di posisi ${form.value.jabatan === 'sarpras' ? 'Sarpras' : 'Kesiswaan'}?`

    if (!confirm(confirmMessage)) {
      return
    }
  }

  isSaving.value = true

  try {
    const kandidatData = {
      pengguna_id: form.value.pengguna_id,
      sesi_id: activeSession.value.id,
      jabatan: form.value.jabatan,
      nomor_urut: form.value.nomor_urut,
    }

    if (editing.value) {
      // Jika reset suara dipilih
      if (form.value.reset_suara) {
        kandidatData.total_suara = 0
      }

      const { error } = await supabase.from('kandidat').update(kandidatData).eq('id', form.value.id)

      if (error) throw error
    } else {
      const { error } = await supabase.from('kandidat').insert([kandidatData])

      if (error) throw error
    }

    await loadData()
    closeModal()
    alert(`✅ Kandidat ${editing.value ? 'diperbarui' : 'ditambahkan'}!`)
  } catch (error) {
    console.error('Save error:', error)
    alert(`❌ Gagal menyimpan: ${error.message}`)
  } finally {
    isSaving.value = false
  }
}

const deleteKandidat = async (k) => {
  if (!canDelete.value) {
    alert('Hanya bisa menghapus kandidat saat sesi PENDAFTARAN')
    return
  }

  if (!confirm(`Hapus kandidat ${k.nama} (${k.jabatan})?\nTindakan ini tidak dapat dibatalkan.`)) {
    return
  }

  try {
    const { error } = await supabase.from('kandidat').delete().eq('id', k.id)

    if (error) throw error

    await loadData()
    alert('✅ Kandidat dihapus!')
  } catch (error) {
    console.error('Delete error:', error)
    alert(`❌ Gagal menghapus: ${error.message}`)
  }
}

const closeModal = () => {
  showModal.value = false
  editing.value = false
  form.value = {
    id: null,
    jabatan: 'sarpras',
    pengguna_id: '',
    nomor_urut: 1,
    reset_suara: false,
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedKandidat.value = null
}

// ==================== LIFECYCLE ====================
onMounted(async () => {
  await loadData()

  // Auto-refresh setiap 30 detik jika sesi voting
  if (activeSession.value?.status === 'voting') {
    setInterval(async () => {
      await loadData()
    }, 30000) // 30 detik
  }
})

// Watch perubahan jabatan untuk reset selected guru
watch(
  () => form.value.jabatan,
  () => {
    if (!editing.value) {
      form.value.pengguna_id = ''
      form.value.nomor_urut =
        kandidatList.value.filter((k) => k.jabatan === form.value.jabatan).length + 1
    }
  },
)
</script>

<style scoped>
/* Tambahan CSS untuk fitur 1 guru 2 posisi */
.other-position-info {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #3b82f6;
  background: #dbeafe;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.already-candidate-info {
  color: #10b981;
  font-weight: 500;
  font-style: italic;
}

.info-note {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #bae6fd;
  font-size: 0.85rem;
  color: #0369a1;
}

.info-note p {
  margin: 0;
}

.other-positions-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border-radius: 6px;
  border: 1px solid #fde68a;
}

.other-positions-info h5 {
  margin: 0 0 0.5rem 0;
  color: #92400e;
  font-size: 0.9rem;
}

.other-positions-info ul {
  margin: 0;
  padding-left: 1.25rem;
}

.other-positions-info li {
  font-size: 0.85rem;
  color: #92400e;
  margin-bottom: 0.125rem;
}

.other-positions-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge.other {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.eligibility-success {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0fdf4;
  border-radius: 6px;
  border: 2px solid #bbf7d0;
}

.eligibility-success h5 {
  margin: 0 0 0.5rem 0;
  color: #166534;
  font-size: 0.9rem;
}

.eligibility-success p {
  margin: 0;
  font-size: 0.85rem;
  color: #166534;
}

.available-guru-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 8px;
  border: 2px solid #bae6fd;
}

.available-guru-info p {
  margin: 0;
  color: #0369a1;
  font-size: 1rem;
}

.available-guru-info small {
  color: #64748b;
  font-size: 0.8rem;
}

/* Tambahan class untuk row styling */
.eligible-row {
  background: #f0fdf4 !important;
}

.eligible-row:hover {
  background: #dcfce7 !important;
}

.inactive-row {
  background: #f9fafb !important;
  opacity: 0.7;
}

/* CSS tetap sama seperti sebelumnya, hanya tambahan sedikit */
.eligibility-success {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0fdf4;
  border-radius: 6px;
  border: 2px solid #bbf7d0;
}

.eligibility-success h5 {
  margin: 0 0 0.5rem 0;
  color: #166534;
  font-size: 0.9rem;
}

.eligibility-success p {
  margin: 0;
  font-size: 0.85rem;
  color: #166534;
}

.available-guru-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 8px;
  border: 2px solid #bae6fd;
}

.available-guru-info p {
  margin: 0;
  color: #0369a1;
  font-size: 1rem;
}

.available-guru-info small {
  color: #64748b;
  font-size: 0.8rem;
}

/* Tambahan class untuk row styling */
.eligible-row {
  background: #f0fdf4 !important;
}

.eligible-row:hover {
  background: #dcfce7 !important;
}

.inactive-row {
  background: #f9fafb !important;
  opacity: 0.7;
}

/* Sisanya CSS tetap sama seperti file sebelumnya */
</style>

<style scoped>
.simple-kandidat {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  margin: 0;
  color: white;
  font-size: 1.75rem;
  font-weight: 700;
}

.back-btn {
  background: white;
  color: #1e3a8a;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

/* Session Status */
.session-status {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-weight: 700;
  text-align: center;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.session-status.draft {
  background: #f1f5f9;
  color: #475569;
  border: 2px dashed #94a3b8;
}

.session-status.pendaftaran {
  background: #fef3c7;
  color: #92400e;
  border: 2px solid #f59e0b;
}

.session-status.voting {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border: 2px solid #10b981;
}

.session-status.selesai {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
  border: 2px solid #22c55e;
}

/* Position Stats */
.position-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 2px solid #e5e7eb;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 12px;
}

.stat-info h4 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
}

.stat-number {
  font-size: 2rem;
  font-weight: 800;
  color: #1e40af;
  margin: 0;
  line-height: 1;
}

.stat-card small {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
  display: block;
}

/* Eligibility Summary */
.eligibility-summary {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 2px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.eligibility-summary h3 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
}

.eligibility-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.75rem;
}

.eligibility-item {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
}

.eligibility-item.success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.eligibility-item.warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.eligibility-item.danger {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* Actions */
.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.5rem;
  border-radius: 10px;
}

.tabs button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #64748b;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.tabs button:hover {
  background: #e2e8f0;
  color: #334155;
}

.tabs button.active {
  background: #1e3a8a;
  color: white;
  box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);
}

.btn-add {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(30, 58, 138, 0.3);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #94a3b8;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 2px solid #e5e7eb;
  margin-bottom: 2rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

thead {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
}

th {
  padding: 1.25rem 1rem;
  text-align: left;
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  padding: 1rem;
  border-bottom: 2px solid #f1f5f9;
  vertical-align: top;
}

tbody tr:hover {
  background: #f8fafc;
}

tbody tr:last-child td {
  border-bottom: none;
}

/* Row styling */
.noneligible-row {
  background: #fef2f2;
  opacity: 0.8;
}

.noneligible-row:hover {
  background: #fee2e2;
}

/* Nama Column */
.nama {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);
}

.nama-text {
  color: #1e293b;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.pangkat {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
}

/* NIP Column */
.nip {
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: #475569;
  margin-bottom: 0.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge.pns {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.pppk {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.gtt,
.status-badge.ptt {
  background: #e5e7eb;
  color: #374151;
}

.status-badge.honorer {
  background: #fee2e2;
  color: #991b1b;
}

/* Badges */
.badge {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  display: inline-block;
}

.badge.sarpras {
  background: #d1fae5;
  color: #065f46;
  border: 2px solid #10b981;
}

.badge.kesiswaan {
  background: #dbeafe;
  color: #1e40af;
  border: 2px solid #3b82f6;
}

/* Masa Kerja & Sisa Pensiun */
.masa-kerja,
.sisa-pensiun,
.periode-jabatan {
  font-weight: 600;
}

.warning-badge,
.danger-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  margin-top: 0.25rem;
}

.warning-badge {
  background: #fef3c7;
  color: #92400e;
}

.danger-badge {
  background: #fee2e2;
  color: #dc2626;
}

.tidak-ada {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.85rem;
}

.danger-text {
  color: #dc2626;
  font-weight: 600;
}

.warning-text {
  color: #d97706;
  font-weight: 600;
}

.success-text {
  color: #059669;
  font-weight: 600;
}

.error-text {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Votes */
.votes {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.count {
  font-weight: 800;
  color: #1e40af;
  min-width: 40px;
  font-size: 1.1rem;
}

.progress {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Action Buttons */
.aksi {
  min-width: 120px;
}

.btn-action {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action.info {
  background: #dbeafe;
  color: #1e40af;
}

.btn-action.info:hover:not(:disabled) {
  background: #bfdbfe;
}

.btn-action.edit {
  background: #fef3c7;
  color: #92400e;
}

.btn-action.edit:hover:not(:disabled) {
  background: #fde68a;
}

.btn-action.delete {
  background: #fee2e2;
  color: #dc2626;
}

.btn-action.delete:hover:not(:disabled) {
  background: #fecaca;
}

/* Empty State */
.empty {
  padding: 4rem 2rem;
  text-align: center;
  background: #f8fafc;
}

.empty p {
  margin-bottom: 1.5rem;
  color: #64748b;
  font-size: 1.1rem;
  font-weight: 500;
}

.empty-info {
  color: #94a3b8;
  font-size: 0.9rem;
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
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
  border: 3px solid #1e3a8a;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 16px 16px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
  font-weight: 700;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  color: #64748b;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e2e8f0;
}

.modal-body {
  padding: 1.5rem;
}

/* Form Styles */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group small {
  display: block;
  margin-top: 0.5rem;
  color: #6b7280;
  font-size: 0.8rem;
}

.guru-detail {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.guru-detail h4 {
  margin: 0 0 0.75rem 0;
  color: #1e293b;
  font-size: 1rem;
}

.guru-detail p {
  margin: 0.25rem 0;
  font-size: 0.85rem;
  color: #475569;
}

.eligibility-warnings {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 6px;
  border: 2px solid #fecaca;
}

.eligibility-warnings h5 {
  margin: 0 0 0.5rem 0;
  color: #dc2626;
  font-size: 0.9rem;
}

.eligibility-warnings ul {
  margin: 0;
  padding-left: 1.25rem;
}

.eligibility-warnings li {
  font-size: 0.8rem;
  color: #991b1b;
  margin-bottom: 0.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3b82f6;
}

/* Detail Grid */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item label {
  font-weight: 600;
  color: #374151;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  color: #1e293b;
  font-size: 0.95rem;
  font-weight: 500;
}

.suara-count {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e40af;
}

.warning-list {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #fef3c7;
  border-radius: 6px;
}

.warning-list strong {
  color: #92400e;
  font-size: 0.85rem;
}

.warning-list ul {
  margin: 0.25rem 0 0 0;
  padding-left: 1.25rem;
}

.warning-list li {
  font-size: 0.8rem;
  color: #92400e;
  margin-bottom: 0.125rem;
}

/* Modal Footer */
.modal-footer {
  padding: 1.5rem;
  border-top: 2px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn-outline {
  background: white;
  border: 2px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(30, 58, 138, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .simple-kandidat {
    padding: 0.5rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    text-align: center;
  }

  .back-btn {
    align-self: center;
  }

  .position-stats {
    grid-template-columns: 1fr;
  }

  .eligibility-grid {
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

  .table-container {
    overflow-x: auto;
  }

  table {
    min-width: 800px;
  }

  .modal {
    margin: 1rem;
    max-width: calc(100% - 2rem);
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .modal-body {
    padding: 1rem;
  }

  .modal-header,
  .modal-footer {
    padding: 1rem;
  }

  th,
  td {
    padding: 0.75rem 0.5rem;
  }

  .btn-action {
    margin-right: 0.25rem;
  }
}

/* Print Styles */
@media print {
  .page-header,
  .actions,
  .btn-action,
  .modal-overlay {
    display: none;
  }

  .simple-kandidat {
    padding: 0;
  }

  .table-container {
    box-shadow: none;
    border: 2px solid #000;
  }

  th {
    background: #fff;
    color: #000;
    border-bottom: 2px solid #000;
  }

  .progress,
  .bar {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
