<template>
  <div class="admin-peserta">
    <!-- Header -->
    <div class="header">
      <div class="title-group">
        <h1>👥 Data Peserta Pemilih</h1>
        <p>Guru, Tendik & Honorer - Eligible hanya untuk Guru PNS/PPPK</p>
      </div>
      <div class="header-actions">
        <router-link to="/admin" class="btn btn-outline">← Dashboard</router-link>
        <button @click="showAddModal" class="btn btn-primary">+ Tambah Peserta</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ totalPeserta }}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ activePesertaCount }}</div>
        <div class="stat-label active-label">Aktif</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ guruCount }}</div>
        <div class="stat-label">Guru</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ pnsCount }}</div>
        <div class="stat-label pns-label">PNS</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ pppkCount }}</div>
        <div class="stat-label pppk-label">PPPK</div>
      </div>
      <div class="stat-card highlight">
        <div class="stat-value">{{ eligibleCount }}</div>
        <div class="stat-label eligible-label">Eligible</div>
      </div>
    </div>

    <!-- Tabs - Simplified -->
    <div class="tabs">
      <button @click="activeTab = 'all'" :class="['tab-btn', { active: activeTab === 'all' }]">
        📋 Semua ({{ totalPeserta }})
      </button>
      <button
        @click="activeTab = 'eligible'"
        :class="['tab-btn', { active: activeTab === 'eligible' }]"
      >
        🏆 Eligible ({{ eligibleCount }})
      </button>
    </div>

    <!-- Search & Filters -->
    <div class="filters-section">
      <div class="search-box">
        🔍
        <input v-model="searchQuery" placeholder="Cari nama, NIP..." class="search-input" />
        <div v-if="searchQuery" class="search-result-info">
          Menampilkan {{ filteredPeserta.length }} dari {{ currentTabTotal }} peserta
        </div>
      </div>

      <div class="status-filters">
        <select v-model="statusFilter" class="filter-select">
          <option value="">Semua Status</option>
          <option value="PNS">PNS</option>
          <option value="PPPK">PPPK</option>
          <option value="GTT">GTT</option>
          <option value="PTT">PTT</option>
          <option value="Honorer">Honorer</option>
        </select>

        <select v-model="peranFilter" class="filter-select">
          <option value="">Semua Peran</option>
          <option value="guru">Guru</option>
          <option value="tendik">Tendik</option>
        </select>

        <select v-model="aktifFilter" class="filter-select">
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Non-Aktif</option>
        </select>

        <button @click="clearFilters" class="btn btn-outline btn-sm">❌ Clear</button>
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-section">
      <div class="table-header">
        <h3>{{ getTableTitle() }}</h3>
        <div class="table-info">
          <span class="info-item">👨‍🏫 Guru: {{ currentGuruCount }}</span>
          <span class="info-item">✅ Aktif: {{ currentAktifCount }}</span>
          <span class="info-item" v-if="activeTab === 'all'">
            🏆 Eligible: {{ currentEligibleCount }}
          </span>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama</th>
              <th>NIP</th>
              <th>Status</th>
              <th>Peran</th>
              <th>Golongan</th>
              <th>Masa Kerja*</th>
              <th>Sisa Pensiun</th>
              <th>Eligible</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, index) in filteredPeserta" :key="p.id" :class="getRowClass(p)">
              <td class="text-center">{{ index + 1 }}</td>
              <td>
                <strong>{{ p.nama_lengkap }}</strong>
                <div v-if="p.nip && !isNIPValid(p.nip)" class="nip-warning">⚠️ NIP tidak valid</div>
                <div v-if="getWarningMessage(p)" class="warning-text small-text">
                  ⚠️ {{ getWarningMessage(p) }}
                </div>
              </td>
              <td>
                <code>{{ p.nip || '-' }}</code>
                <div class="nip-info">{{ getNIPInfo(p.nip) }}</div>
              </td>
              <td>
                <span :class="['status-badge', getStatusClass(p.status_kepegawaian)]">
                  {{ p.status_kepegawaian }}
                </span>
              </td>
              <td>
                <span :class="['peran-badge', p.peran]">
                  {{ p.peran === 'guru' ? '👨‍🏫' : '👨‍💼' }} {{ p.peran }}
                </span>
              </td>
              <td>{{ p.golongan_ruang || '-' }}</td>
              <td>
                {{ calculateMasaKerja(p.nip) }}
                <div class="small-text" v-if="getTahunPengangkatan(p.nip)">
                  sejak {{ getTahunPengangkatan(p.nip) }}
                </div>
              </td>
              <td>
                {{ calculateSisaMenujuPensiun(p.nip) }} thn
                <div class="small-text" :class="getSisaPensiunClass(p.nip)">
                  {{ getSisaPensiunStatus(p.nip) }}
                </div>
              </td>
              <td class="text-center">
                <div v-if="p.peran === 'guru'">
                  <span v-if="isEligible(p)" class="eligible-badge">🏆 Eligible</span>
                  <span v-else class="noneligible-badge">🚫 Non</span>
                  <div class="small-text">
                    <label class="checkbox-inline">
                      <input
                        type="checkbox"
                        :checked="p.is_manual_noneligible"
                        @change="toggleManualNonEligible(p, $event.target.checked)"
                      />
                      Manual Non
                    </label>
                  </div>
                </div>
                <span v-else class="not-applicable">-</span>
              </td>
              <td class="text-center">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    :checked="p.is_active"
                    @change="toggleStatusPeserta(p, $event.target.checked)"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <div class="small-text">
                  {{ p.is_active ? '✅ Aktif' : '❌ Non-Aktif' }}
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="editPeserta(p)" class="btn-icon" title="Edit">✏️</button>
                  <button @click="showDetail(p)" class="btn-icon info" title="Detail">ℹ️</button>
                  <button
                    v-if="isEligible(p)"
                    @click="navigateToKandidat(p)"
                    class="btn-icon success"
                    title="Jadikan Kandidat"
                  >
                    👤
                  </button>
                  <button @click="confirmDeletePeserta(p)" class="btn-icon danger" title="Hapus">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredPeserta.length === 0">
              <td colspan="11" class="empty-state">📭 Tidak ada data peserta</td>
            </tr>
          </tbody>
        </table>
        <div class="table-footer">
          <small
            >*Eligible: Guru PNS/PPPK, Masa kerja ≥ 3thn, Sisa pensiun ≥ 3thn, Bukan manual
            non</small
          >
        </div>
      </div>
    </div>

    <!-- Modal Tambah/Edit Peserta -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEditing ? '✏️ Edit Peserta' : '➕ Tambah Peserta Baru' }}</h3>
          <button @click="closeFormModal" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="savePeserta">
            <div class="form-grid">
              <div class="form-group">
                <label for="nama_lengkap">Nama Lengkap *</label>
                <input
                  id="nama_lengkap"
                  v-model="formData.nama_lengkap"
                  type="text"
                  placeholder="Nama lengkap"
                  required
                />
              </div>

              <div class="form-group">
                <label for="nip">NIP</label>
                <input
                  id="nip"
                  v-model="formData.nip"
                  type="text"
                  placeholder="197711072014072001 (opsional)"
                  @blur="validateNIP"
                />
                <div v-if="nipValidation.valid" class="success-text">
                  ✓ Format NIP valid: {{ nipValidation.format }}
                </div>
                <div v-if="nipValidation.error" class="error-text">
                  ❌ {{ nipValidation.error }}
                </div>
                <div class="small-text">Kosongkan untuk honorer/GTT/PTT</div>
              </div>

              <div class="form-group">
                <label for="peran">Peran *</label>
                <select id="peran" v-model="formData.peran" required>
                  <option value="guru">Guru</option>
                  <option value="tendik">Tenaga Kependidikan</option>
                </select>
              </div>

              <div class="form-group">
                <label for="status_kepegawaian">Status Kepegawaian *</label>
                <select id="status_kepegawaian" v-model="formData.status_kepegawaian" required>
                  <option value="PNS">PNS</option>
                  <option value="PPPK">PPPK</option>
                  <option value="GTT">Guru Tidak Tetap (GTT)</option>
                  <option value="PTT">Pegawai Tidak Tetap (PTT)</option>
                  <option value="Honorer">Honorer</option>
                </select>
              </div>

              <div class="form-group">
                <label for="golongan_ruang">Golongan/Ruang</label>
                <input
                  id="golongan_ruang"
                  v-model="formData.golongan_ruang"
                  type="text"
                  placeholder="III/b, IV/a, IX, etc"
                />
              </div>

              <div class="form-group">
                <label for="pangkat">Pangkat/Jabatan</label>
                <input
                  id="pangkat"
                  v-model="formData.pangkat"
                  type="text"
                  placeholder="Penata Muda Tk. I, dll"
                />
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="formData.is_active" />
                  <span>Status Aktif</span>
                </label>
              </div>

              <div class="form-group" v-if="isEditing">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="formData.is_manual_noneligible" />
                  <span>Manual Non-Eligible</span>
                </label>
              </div>

              <div class="form-group" v-if="isEditing && formData.is_manual_noneligible">
                <label for="manual_noneligible_reason">Alasan Non-Eligible</label>
                <textarea
                  id="manual_noneligible_reason"
                  v-model="formData.manual_noneligible_reason"
                  placeholder="Alasan non-eligible..."
                  rows="2"
                ></textarea>
              </div>
            </div>

            <div v-if="nipValidation.valid && nipValidation.parsed" class="info-box">
              <h4>Info dari NIP:</h4>
              <p>Format: {{ nipValidation.format }}</p>
              <p v-if="nipValidation.parsed.tanggal_lahir">
                Tanggal Lahir: {{ formatTanggal(nipValidation.parsed.tanggal_lahir) }}
              </p>
              <p v-if="nipValidation.parsed.tgl_pengangkatan">
                Pengangkatan: {{ formatTanggal(nipValidation.parsed.tgl_pengangkatan) }}
              </p>
              <p>Usia: {{ calculateUsia(formData.nip) }} tahun</p>
              <p>Masa Kerja: {{ calculateMasaKerja(formData.nip) }}</p>
              <p>Pensiun: {{ calculateTahunPensiun(formData.nip) }} (usia 60)</p>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="closeFormModal" class="btn btn-outline">Batal</button>
          <button @click="savePeserta" class="btn btn-primary" :disabled="isSaving">
            {{ isSaving ? 'Menyimpan...' : '💾 Simpan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Detail -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal">
        <div class="modal-header">
          <h3>📋 Detail Peserta</h3>
          <button @click="closeDetailModal" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Nama:</label>
              <span>{{ selectedPeserta?.nama_lengkap }}</span>
            </div>
            <div class="detail-item">
              <label>Status Aktif:</label>
              <span :class="selectedPeserta?.is_active ? 'active-text' : 'inactive-text'">
                {{ selectedPeserta?.is_active ? '✅ AKTIF' : '❌ NON-AKTIF' }}
              </span>
            </div>
            <div class="detail-item">
              <label>NIP:</label>
              <span
                ><code>{{ selectedPeserta?.nip || '-' }}</code></span
              >
              <div class="small-text">{{ getNIPInfo(selectedPeserta?.nip) }}</div>
            </div>
            <div class="detail-item">
              <label>Peran:</label>
              <span :class="['peran-badge', selectedPeserta?.peran]">
                {{ selectedPeserta?.peran === 'guru' ? '👨‍🏫 Guru' : '👨‍💼 Tendik' }}
              </span>
            </div>
            <div class="detail-item">
              <label>Status Kepegawaian:</label>
              <span :class="['status-badge', getStatusClass(selectedPeserta?.status_kepegawaian)]">
                {{ selectedPeserta?.status_kepegawaian }}
              </span>
            </div>
            <div class="detail-item">
              <label>Golongan/Ruang:</label>
              <span>{{ selectedPeserta?.golongan_ruang || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>Usia Saat Ini:</label>
              <span>{{ calculateUsia(selectedPeserta?.nip) }} tahun</span>
            </div>
            <div class="detail-item">
              <label>Masa Kerja:</label>
              <span>{{ calculateMasaKerja(selectedPeserta?.nip) }}</span>
            </div>
            <div class="detail-item">
              <label>Sisa Menuju Pensiun:</label>
              <span :class="getSisaPensiunClass(selectedPeserta?.nip)">
                {{ calculateSisaMenujuPensiun(selectedPeserta?.nip) }} tahun -
                {{ getSisaPensiunStatus(selectedPeserta?.nip) }}
              </span>
            </div>
            <div class="detail-item">
              <label>Status Eligible:</label>
              <span :class="isEligible(selectedPeserta) ? 'eligible-text' : 'noneligible-text'">
                {{ isEligible(selectedPeserta) ? '🏆 ELIGIBLE' : '🚫 NON-ELIGIBLE' }}
              </span>
              <div v-if="!isEligible(selectedPeserta)" class="small-text error-text">
                {{ getEligibilityReason(selectedPeserta) }}
              </div>
            </div>
            <div class="detail-item" v-if="selectedPeserta?.is_manual_noneligible">
              <label>Alasan Non-Eligible:</label>
              <span>{{ selectedPeserta?.manual_noneligible_reason }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeDetailModal" class="btn btn-outline">Tutup</button>
          <button @click="editPeserta(selectedPeserta)" class="btn btn-primary">✏️ Edit</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const pesertaList = ref([])
const searchQuery = ref('')
const activeTab = ref('all')
const statusFilter = ref('')
const peranFilter = ref('')
const aktifFilter = ref('')

// Modal states
const showFormModal = ref(false)
const showDetailModal = ref(false)
const selectedPeserta = ref(null)
const isEditing = ref(false)
const isSaving = ref(false)

// NIP validation state
const nipValidation = reactive({
  valid: false,
  format: '',
  error: '',
  parsed: null,
})

// Form data
const formData = ref({
  nama_lengkap: '',
  nip: '',
  peran: 'guru',
  status_kepegawaian: 'PNS',
  golongan_ruang: '',
  pangkat: '',
  is_active: true,
  is_manual_noneligible: false,
  manual_noneligible_reason: '',
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

const validateNIP = () => {
  const nip = formData.value.nip?.trim()

  if (!nip) {
    nipValidation.valid = false
    nipValidation.format = ''
    nipValidation.error = ''
    nipValidation.parsed = null
    return
  }

  if (nip.length !== 18) {
    nipValidation.valid = false
    nipValidation.error = 'NIP harus 18 digit'
    nipValidation.parsed = null
    return
  }

  const parsed = parseNIP(nip)
  if (!parsed) {
    nipValidation.valid = false
    nipValidation.error = 'Format NIP tidak valid'
    nipValidation.parsed = null
    return
  }

  nipValidation.valid = true
  nipValidation.format = parsed.format
  nipValidation.error = ''
  nipValidation.parsed = parsed
}

// ==================== FUNGSI PERHITUNGAN ====================
const isNIPValid = (nip) => parseNIP(nip) !== null

const getNIPInfo = (nip) => {
  if (!nip) return 'NIP kosong'
  const parsed = parseNIP(nip)
  if (!parsed) return 'Format NIP tidak valid'

  if (parsed.format === 'PNS') {
    return `Lahir: ${formatTanggal(parsed.tanggal_lahir)} | CPNS: ${formatTanggal(parsed.tgl_pengangkatan)}`
  } else {
    return `Lahir: ${formatTanggal(parsed.tanggal_lahir)} | PPPK: ${parsed.tahun_penetapan.substring(0, 4)}`
  }
}

const formatTanggal = (dateStr) => {
  if (!dateStr || dateStr.length !== 8) return '?'
  const tahun = dateStr.substring(0, 4)
  const bulan = dateStr.substring(4, 6)
  const hari = dateStr.substring(6, 8)
  return `${hari}/${bulan}/${tahun}`
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

const calculateMasaKerja = (nip) => {
  const parsed = parseNIP(nip)
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

const calculateMasaKerjaTahun = (nip) => {
  const masaKerja = calculateMasaKerja(nip)
  if (masaKerja === '?') return 0
  const tahunMatch = masaKerja.match(/(\d+)\s*thn/)
  return tahunMatch ? parseInt(tahunMatch[1]) : 0
}

const calculateTahunPensiun = (nip) => {
  const parsed = parseNIP(nip)
  if (!parsed) return '?'
  return parsed.tahun_lahir + 60
}

const calculateSisaMenujuPensiun = (nip) => {
  const usia = calculateUsia(nip)
  if (usia === '?') return '?'
  const sisa = 60 - usia
  return sisa > 0 ? sisa : 0
}

const getTahunPengangkatan = (nip) => {
  const parsed = parseNIP(nip)
  if (!parsed) return null
  if (parsed.format === 'PNS') return parsed.tahun_pengangkatan
  return parseInt(parsed.tahun_penetapan.substring(0, 4))
}

const getSisaPensiunClass = (nip) => {
  const sisa = calculateSisaMenujuPensiun(nip)
  if (sisa === '?') return ''
  if (sisa < 3) return 'danger-text'
  if (sisa < 5) return 'warning-text'
  return 'success-text'
}

const getSisaPensiunStatus = (nip) => {
  const sisa = calculateSisaMenujuPensiun(nip)
  if (sisa === '?') return 'tidak diketahui'
  if (sisa < 1) return 'sudah pensiun'
  if (sisa < 3) return 'akan pensiun segera'
  if (sisa < 5) return 'akan pensiun dalam 5 tahun'
  return 'masih lama'
}

// ==================== FUNGSI ELIGIBLE ====================
const isPNSatauPPPK = (status) => ['PNS', 'PPPK'].includes(status)

const isEligible = (p) => {
  if (!p) return false
  if (p.peran !== 'guru') return false
  if (!isPNSatauPPPK(p.status_kepegawaian)) return false
  if (!p.nip || !isNIPValid(p.nip)) return false

  // Masa kerja ≥ 3 tahun
  if (calculateMasaKerjaTahun(p.nip) < 3) return false

  // Sisa pensiun ≥ 3 tahun
  const sisa = calculateSisaMenujuPensiun(p.nip)
  if (sisa === '?' || sisa < 3) return false

  // Bukan manual non-eligible
  if (p.is_manual_noneligible) return false

  return true
}

const getEligibilityReason = (p) => {
  if (!p) return ''
  if (p.peran !== 'guru') return 'Bukan guru'
  if (!isPNSatauPPPK(p.status_kepegawaian)) return 'Bukan PNS/PPPK'
  if (!p.nip) return 'NIP kosong'
  if (!isNIPValid(p.nip)) return 'NIP tidak valid'
  if (calculateMasaKerjaTahun(p.nip) < 3) return 'Masa kerja < 3 tahun'
  const sisa = calculateSisaMenujuPensiun(p.nip)
  if (sisa === '?' || sisa < 3) return 'Sisa pensiun < 3 tahun'
  if (p.is_manual_noneligible) return 'Ditandai manual non-eligible'
  return 'Tidak eligible'
}

const getWarningMessage = (p) => {
  if (!p || p.peran !== 'guru') return ''
  const warnings = []

  if (!isPNSatauPPPK(p.status_kepegawaian)) warnings.push('Bukan PNS/PPPK')
  if (!p.nip) warnings.push('NIP kosong')
  else if (!isNIPValid(p.nip)) warnings.push('NIP tidak valid')
  else {
    if (calculateMasaKerjaTahun(p.nip) < 3) warnings.push('Masa kerja < 3thn')
    const sisa = calculateSisaMenujuPensiun(p.nip)
    if (sisa === '?' || sisa < 3) warnings.push('Sisa pensiun < 3thn')
  }

  return warnings.length > 0 ? warnings.join(', ') : ''
}

// ==================== COMPUTED PROPERTIES ====================
const totalPeserta = computed(() => pesertaList.value.length)
const activePesertaCount = computed(() => pesertaList.value.filter((p) => p.is_active).length)
const guruCount = computed(() => pesertaList.value.filter((p) => p.peran === 'guru').length)
const pnsCount = computed(
  () => pesertaList.value.filter((p) => p.status_kepegawaian === 'PNS').length,
)
const pppkCount = computed(
  () => pesertaList.value.filter((p) => p.status_kepegawaian === 'PPPK').length,
)
const eligibleCount = computed(() => pesertaList.value.filter((p) => isEligible(p)).length)

// Filter data berdasarkan tab aktif
const filteredByTab = computed(() => {
  if (activeTab.value === 'eligible') {
    return pesertaList.value.filter((p) => isEligible(p))
  }
  return pesertaList.value // 'all'
})

// Filter tambahan
const filteredPeserta = computed(() => {
  let data = filteredByTab.value

  // Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    data = data.filter(
      (p) => p.nama_lengkap.toLowerCase().includes(q) || (p.nip && p.nip.includes(q)),
    )
  }

  // Status filter
  if (statusFilter.value) {
    data = data.filter((p) => p.status_kepegawaian === statusFilter.value)
  }

  // Peran filter
  if (peranFilter.value) {
    data = data.filter((p) => p.peran === peranFilter.value)
  }

  // Aktif filter
  if (aktifFilter.value === 'aktif') {
    data = data.filter((p) => p.is_active)
  } else if (aktifFilter.value === 'nonaktif') {
    data = data.filter((p) => !p.is_active)
  }

  return data
})

// Stats untuk tab aktif
const currentTabTotal = computed(() => filteredByTab.value.length)
const currentGuruCount = computed(
  () => filteredByTab.value.filter((p) => p.peran === 'guru').length,
)
const currentAktifCount = computed(() => filteredByTab.value.filter((p) => p.is_active).length)
const currentEligibleCount = computed(() => filteredByTab.value.filter((p) => isEligible(p)).length)

// ==================== FUNGSI UI HELPER ====================
const getTableTitle = () => {
  return activeTab.value === 'all' ? '📋 Semua Peserta' : '🏆 Calon Kandidat Eligible'
}

const getRowClass = (p) => {
  if (!p.is_active) return 'inactive-row'
  if (isEligible(p)) return 'eligible-row'
  return ''
}

const getStatusClass = (status) => {
  if (!status) return ''
  const statusLower = status.toLowerCase()
  if (statusLower === 'pns') return 'pns'
  if (statusLower === 'pppk') return 'pppk'
  if (statusLower === 'gtt' || statusLower === 'ptt') return 'gtt'
  if (statusLower === 'honorer') return 'honorer'
  return ''
}

// ==================== LOAD DATA ====================
const loadPeserta = async () => {
  try {
    const { data, error } = await supabase.from('pengguna').select('*').order('nama_lengkap')

    if (error) throw error
    pesertaList.value = data || []
  } catch (error) {
    console.error('Gagal load peserta:', error)
    alert('Gagal memuat data peserta')
  }
}

// ==================== FORM FUNCTIONS ====================
const showAddModal = () => {
  isEditing.value = false
  formData.value = {
    nama_lengkap: '',
    nip: '',
    peran: 'guru',
    status_kepegawaian: 'PNS',
    golongan_ruang: '',
    pangkat: '',
    is_active: true,
    is_manual_noneligible: false,
    manual_noneligible_reason: '',
  }
  nipValidation.valid = false
  nipValidation.error = ''
  showFormModal.value = true
}

const editPeserta = (p) => {
  isEditing.value = true
  selectedPeserta.value = p
  formData.value = {
    nama_lengkap: p.nama_lengkap,
    nip: p.nip || '',
    peran: p.peran,
    status_kepegawaian: p.status_kepegawaian,
    golongan_ruang: p.golongan_ruang || '',
    pangkat: p.pangkat || '',
    is_active: p.is_active,
    is_manual_noneligible: p.is_manual_noneligible || false,
    manual_noneligible_reason: p.manual_noneligible_reason || '',
  }
  validateNIP()
  showFormModal.value = true
}

const savePeserta = async () => {
  if (!formData.value.nama_lengkap.trim()) {
    alert('Nama lengkap harus diisi')
    return
  }

  isSaving.value = true

  try {
    const dataToSave = {
      nama_lengkap: formData.value.nama_lengkap.trim(),
      nip: formData.value.nip?.trim() || null,
      peran: formData.value.peran,
      status_kepegawaian: formData.value.status_kepegawaian,
      golongan_ruang: formData.value.golongan_ruang?.trim() || null,
      pangkat: formData.value.pangkat?.trim() || null,
      is_active: formData.value.is_active,
      is_manual_noneligible: formData.value.is_manual_noneligible || false,
      manual_noneligible_reason: formData.value.manual_noneligible_reason?.trim() || null,
      // FIX: Gunakan 'diperbarui_pada' bukan 'updated_at'
      diperbarui_pada: new Date().toISOString(),
    }

    if (isEditing.value && selectedPeserta.value) {
      const { error } = await supabase
        .from('pengguna')
        .update(dataToSave)
        .eq('id', selectedPeserta.value.id)

      if (error) {
        console.error('Supabase update error:', error)
        throw new Error(`Gagal update: ${error.message}`)
      }
      alert('✅ Data peserta berhasil diperbarui!')
    } else {
      const { error } = await supabase.from('pengguna').insert([dataToSave])
      if (error) {
        console.error('Supabase insert error:', error)
        throw new Error(`Gagal insert: ${error.message}`)
      }
      alert('✅ Peserta baru berhasil ditambahkan!')
    }

    await loadPeserta()
    closeFormModal()
  } catch (error) {
    console.error('Gagal menyimpan peserta:', error)
    alert(`Gagal menyimpan: ${error.message}`)
  } finally {
    isSaving.value = false
  }
}

const closeFormModal = () => {
  showFormModal.value = false
  isEditing.value = false
  selectedPeserta.value = null
}

// ==================== TOGGLE STATUS AKTIF - FIXED ====================
const toggleStatusPeserta = async (p, checked) => {
  if (!confirm(`Ubah status aktif ${p.nama_lengkap} menjadi ${checked ? 'AKTIF' : 'NON-AKTIF'}?`)) {
    return
  }

  try {
    // FIX: Gunakan 'diperbarui_pada' bukan 'updated_at'
    const updateData = {
      is_active: checked,
      diperbarui_pada: new Date().toISOString(),
    }

    console.log('Mengupdate peserta:', p.id, 'dengan data:', updateData)

    const { error } = await supabase.from('pengguna').update(updateData).eq('id', p.id)

    if (error) {
      console.error('Supabase error detail:', error)
      throw new Error(`Database error: ${error.message} (code: ${error.code})`)
    }

    await loadPeserta()
    alert(`✅ Status peserta berhasil diubah!`)
  } catch (error) {
    console.error('Gagal mengubah status peserta:', error)
    alert(`Gagal mengubah status: ${error.message}`)

    // Revert toggle di UI jika gagal
    await loadPeserta()
  }
}

// ==================== DELETE PESERTA ====================
const confirmDeletePeserta = (p) => {
  if (!confirm(`Hapus ${p.nama_lengkap}? Tindakan ini tidak dapat dibatalkan.`)) return
  deletePeserta(p)
}

const deletePeserta = async (p) => {
  try {
    const { error } = await supabase.from('pengguna').delete().eq('id', p.id)
    if (error) {
      console.error('Supabase delete error:', error)
      throw new Error(`Gagal hapus: ${error.message}`)
    }

    await loadPeserta()
    alert('✅ Data peserta berhasil dihapus!')
  } catch (error) {
    console.error('Gagal menghapus peserta:', error)
    alert(`Gagal menghapus: ${error.message}`)
  }
}

// ==================== NON-ELIGIBLE FUNCTIONS - FIXED ====================
const toggleManualNonEligible = async (p, checked) => {
  if (p.peran !== 'guru') {
    alert('Non-eligible hanya bisa ditandai untuk guru')
    return
  }

  const reason = prompt(
    `Alasan menandai ${p.nama_lengkap} sebagai non-eligible:`,
    p.manual_noneligible_reason || '',
  )
  if (reason === null) return

  try {
    const updateData = {
      is_manual_noneligible: checked,
      manual_noneligible_reason: checked ? reason.trim() : null,
      // FIX: Gunakan 'diperbarui_pada'
      diperbarui_pada: new Date().toISOString(),
    }

    const { error } = await supabase.from('pengguna').update(updateData).eq('id', p.id)

    if (error) {
      console.error('Supabase error:', error)
      throw new Error(`Gagal update: ${error.message}`)
    }

    await loadPeserta()
    alert(`✅ Peserta berhasil ${checked ? 'ditandai' : 'dihapus dari'} non-eligible!`)
  } catch (error) {
    console.error('Gagal mengubah status non-eligible:', error)
    alert(`Gagal mengubah: ${error.message}`)
  }
}

// ==================== DETAIL MODAL ====================
const showDetail = (p) => {
  selectedPeserta.value = p
  showDetailModal.value = true
}

const navigateToKandidat = (p) => {
  if (!isEligible(p)) {
    alert('Peserta tidak eligible untuk dijadikan kandidat')
    return
  }
  router.push(`/admin/kandidat?peserta_id=${p.id}&nama=${encodeURIComponent(p.nama_lengkap)}`)
}

const clearFilters = () => {
  statusFilter.value = ''
  peranFilter.value = ''
  aktifFilter.value = ''
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedPeserta.value = null
}

// ==================== INIT ====================
onMounted(() => {
  loadPeserta()
})
</script>

<style scoped>
/* CSS tetap sama seperti sebelumnya */
.admin-peserta {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-group h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #1e3a8a;
}

.title-group p {
  margin: 0.25rem 0 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.stat-card.highlight {
  border: 2px solid #10b981;
  background: #f0fdf4;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: bold;
  color: #1e3a8a;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #6b7280;
  font-size: 0.85rem;
}

.eligible-label {
  color: #10b981 !important;
}
.pns-label {
  color: #1e40af !important;
}
.pppk-label {
  color: #92400e !important;
}
.active-label {
  color: #10b981 !important;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}

.tab-btn:hover {
  background: #f9fafb;
}
.tab-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.filters-section {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
}

.search-result-info {
  font-size: 0.8rem;
  color: #6b7280;
}

.status-filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  min-width: 150px;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-outline {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.85rem;
}

.table-section {
  margin-bottom: 2rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.table-header h3 {
  margin: 0;
  color: #374151;
  font-size: 1.25rem;
}

.table-info {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #6b7280;
}

.table-wrapper {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.table-footer {
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  font-size: 0.8rem;
  color: #6b7280;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table thead {
  background: #f3f4f6;
  border-bottom: 2px solid #e5e7eb;
}

.data-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: top;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

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

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
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

.peran-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.peran-badge.guru {
  background: #dbeafe;
  color: #1e40af;
}

.peran-badge.tendik {
  background: #e5e7eb;
  color: #374151;
}

.eligible-badge {
  display: inline-block;
  background: #10b981;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.noneligible-badge {
  display: inline-block;
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.not-applicable {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.85rem;
}

.nip-warning {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.warning-text {
  color: #d97706;
}
.small-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
}
.nip-info {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.danger-text {
  color: #dc2626;
  font-weight: 500;
}
.warning-text {
  color: #d97706;
  font-weight: 500;
}
.success-text {
  color: #059669;
  font-weight: 500;
}
.error-text {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.checkbox-inline {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.checkbox-inline input[type='checkbox'] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #10b981;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #f3f4f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  transform: translateY(-1px);
}
.btn-icon.danger {
  background: #fee2e2;
  color: #dc2626;
}
.btn-icon.danger:hover {
  background: #fecaca;
}
.btn-icon.success {
  background: #d1fae5;
  color: #065f46;
}
.btn-icon.success:hover {
  background: #a7f3d0;
}
.btn-icon.info {
  background: #dbeafe;
  color: #1e40af;
}
.btn-icon.info:hover {
  background: #bfdbfe;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
}

.text-center {
  text-align: center;
}

/* Modal styles */
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
}

.modal {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: #e5e7eb;
}

.modal-body {
  padding: 1.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.detail-item span {
  color: #4b5563;
  font-size: 0.95rem;
}

.eligible-text {
  color: #10b981;
  font-weight: bold;
}
.noneligible-text {
  color: #ef4444;
  font-weight: bold;
}
.active-text {
  color: #10b981;
  font-weight: bold;
}
.inactive-text {
  color: #6b7280;
  font-weight: bold;
}

/* Form Modal */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.info-box {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.info-box h4 {
  margin: 0 0 0.5rem 0;
  color: #0369a1;
}
.info-box p {
  margin: 0.25rem 0;
  font-size: 0.85rem;
  color: #0c4a6e;
}

.success-text {
  color: #059669;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.modal-footer {
  padding: 1.25rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  background: #f9fafb;
}

/* Responsive */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions {
    justify-content: flex-start;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .tabs {
    flex-wrap: wrap;
  }
  .tab-btn {
    flex: 1;
    min-width: 120px;
  }

  .status-filters {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-select {
    width: 100%;
  }

  .data-table {
    display: block;
    overflow-x: auto;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .table-info {
    width: 100%;
    justify-content: space-between;
  }

  .modal {
    max-width: 95%;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .data-table thead {
    display: none;
  }

  .data-table tbody tr {
    display: block;
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
  }

  .data-table td {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.5rem 0;
    border: none;
  }

  .data-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #374151;
    min-width: 120px;
    margin-right: 1rem;
  }

  .action-buttons {
    justify-content: flex-start;
  }
}
</style>
