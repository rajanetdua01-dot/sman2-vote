<template>
  <div class="dashboard-calon">
    <!-- HEADER DENGAN LOGOUT -->
    <div class="header">
      <div class="header-top">
        <h1>Dashboard Peserta Pemilihan</h1>
        <button class="logout-btn" @click="handleLogout" title="Logout" v-if="user">
          🚪 Logout
        </button>
      </div>

      <!-- LOADING USER -->
      <div v-if="loadingUser" class="user-info loading">
        <div class="spinner"></div>
        <p>Memuat data user...</p>
      </div>

      <!-- USER INFO SETELAH LOAD -->
      <div v-else-if="user" class="user-info">
        <p>
          Selamat datang, <strong>{{ user.nama_lengkap }}</strong>
        </p>
        <p>NIP: {{ user.nip }}</p>
        <p>Status: {{ user.status_kepegawaian || 'Tidak tersedia' }}</p>
        <p v-if="user.status_kepegawaian === 'PNS' || user.status_kepegawaian === 'PPPK'">
          Hak: <span class="badge-success">Bisa mendaftarkan calon</span>
        </p>
        <p v-else>Hak: <span class="badge-warning">Hanya bisa melihat</span></p>
      </div>

      <!-- NO USER -->
      <div v-else class="user-info error">
        <p>⚠️ Data user tidak tersedia</p>
        <button @click="goToLogin" class="retry-btn">Kembali ke Login</button>
      </div>
    </div>

    <!-- LOADING SESSION DATA -->
    <div v-if="loading && user" class="loading-session">
      <div class="spinner"></div>
      <p>Memuat data sesi pemilihan...</p>
    </div>

    <!-- MAIN CONTENT (hanya jika user ada dan sudah load) -->
    <div v-else-if="user && !loading" class="content">
      <!-- SESSION INFO -->
      <div class="session-info card">
        <h3>Sesi Pemilihan Saat Ini</h3>
        <div v-if="activeSession">
          <p>
            <strong>{{ activeSession.nama_sesi }}</strong>
          </p>
          <p>Tahun Ajaran: {{ activeSession.tahun_ajaran }}</p>
          <p>
            Status:
            <span :class="'status-' + activeSession.status">
              {{ formatStatus(activeSession.status) }}
            </span>
          </p>

          <!-- POSITION STATS -->
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

          <!-- ELIGIBILITY SUMMARY -->
          <div
            v-if="guruList.length > 0 && activeSession.status === 'pendaftaran'"
            class="eligibility-summary"
          >
            <h3>📋 Statistik Eligibility Guru ({{ guruList.length }} total)</h3>
            <div class="eligibility-grid">
              <div class="eligibility-item" :class="eligibleCount > 0 ? 'success' : 'danger'">
                <span
                  >{{ eligibleCount > 0 ? '✅' : '❌' }} Eligible: {{ eligibleCount }}/{{
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
              <div
                class="eligibility-item"
                :class="eligibleBySisaPensiun > 0 ? 'success' : 'danger'"
              >
                <span
                  >{{ eligibleBySisaPensiun > 0 ? '✅' : '❌' }} Sisa Pensiun ≥3thn:
                  {{ eligibleBySisaPensiun }}/{{ guruList.length }}</span
                >
              </div>
            </div>
          </div>

          <div class="limit-info" v-if="activeSession.status === 'pendaftaran'">
            <p><strong>📋 Ketentuan Pendaftaran Calon:</strong></p>
            <p>• Setiap peserta boleh mendaftarkan <strong>1 calon per jabatan</strong></p>
            <p>
              • <strong>1 guru dapat menjadi kandidat di kedua posisi</strong> (Sarpras dan
              Kesiswaan)
            </p>
            <p>• Calon harus memenuhi semua syarat eligibility:</p>
            <ul>
              <li>✅ Status PNS atau PPPK</li>
              <li>✅ Masa kerja minimal 3 tahun</li>
              <li>✅ Sisa pensiun minimal 3 tahun</li>
              <li>✅ Jeda periode (jika pernah menjabat)</li>
              <li>✅ NIP valid (18 digit)</li>
            </ul>
            <p>• Anda sudah mendaftarkan:</p>
            <ul>
              <li v-if="myRegistrations.sarpras">
                ✅ Waka Sarpras: {{ myRegistrations.sarpras.nama }}
                <span v-if="myRegistrations.sarpras.is_self" class="self-badge"
                  >👤 (Didaftarkan sendiri)</span
                >
              </li>
              <li v-else>❌ Waka Sarpras: Belum ada</li>
              <li v-if="myRegistrations.kesiswaan">
                ✅ Waka Kesiswaan: {{ myRegistrations.kesiswaan.nama }}
                <span v-if="myRegistrations.kesiswaan.is_self" class="self-badge"
                  >👤 (Didaftarkan sendiri)</span
                >
              </li>
              <li v-else>❌ Waka Kesiswaan: Belum ada</li>
            </ul>
          </div>
        </div>
        <div v-else><p>Tidak ada sesi pemilihan aktif</p></div>
      </div>

      <!-- CURRENT CANDIDATES -->
      <div
        class="current-candidates card"
        v-if="
          activeSession &&
          (activeSession.status === 'pendaftaran' || activeSession.status === 'voting')
        "
      >
        <h3>Kandidat yang Sudah Terdaftar</h3>

        <!-- TABS -->
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

        <div class="candidates-table-container">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Kandidat</th>
                <th>NIP / Status</th>
                <th>Posisi</th>
                <th>Masa Kerja</th>
                <th>Sisa Pensiun</th>
                <th>Periode</th>
                <th>Status Eligibility</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="candidate in filteredKandidat"
                :key="candidate.id"
                :class="getRowClass(candidate)"
              >
                <td class="nomor-urut">{{ candidate.nomor_urut }}</td>
                <td>
                  <div class="candidate-avatar">{{ getInitials(candidate.nama) }}</div>
                  <div class="candidate-details">
                    <p class="candidate-name">{{ candidate.nama }}</p>
                    <p class="pangkat">{{ candidate.golongan_ruang || 'Tidak ada pangkat' }}</p>
                    <p v-if="candidate.pendaftar" class="registered-by">
                      <small>Didaftarkan oleh: {{ candidate.pendaftar }}</small>
                    </p>
                    <div v-if="getOtherPositions(candidate).length > 0" class="other-position-info">
                      <small
                        >👥 Juga kandidat di: {{ getOtherPositions(candidate).join(', ') }}</small
                      >
                    </div>
                  </div>
                </td>
                <td>
                  <code class="nip">{{ candidate.nip || 'No NIP' }}</code>
                  <div :class="['status-badge', candidate.status_kepegawaian?.toLowerCase()]">
                    {{ candidate.status_kepegawaian }}
                  </div>
                </td>
                <td>
                  <span :class="['badge', candidate.jabatan]">
                    {{ candidate.jabatan === 'sarpras' ? 'Waka Sarpras' : 'Waka Kesiswaan' }}
                  </span>
                </td>
                <td class="masa-kerja">
                  {{ calculateMasaKerja(candidate) }}
                  <div v-if="getMasaKerjaTahun(candidate) < 3" class="warning-badge">
                    ⚠️ &lt;3 tahun
                  </div>
                </td>
                <td class="sisa-pensiun">
                  {{ calculateSisaMenujuPensiun(candidate) }}
                  <div :class="getSisaPensiunClass(candidate)">
                    {{ getSisaPensiunStatus(candidate) }}
                  </div>
                </td>
                <td class="periode-jabatan">
                  <div v-if="getJumlahPeriode(candidate) > 0">
                    {{ getJumlahPeriode(candidate) }} periode
                    <div v-if="needsJeda(candidate)" class="danger-badge">⚠️ Perlu jeda</div>
                  </div>
                  <div v-else class="tidak-ada">Belum pernah</div>
                </td>
                <td>
                  <span :class="isEligible(candidate) ? 'success-text' : 'danger-text'">
                    {{ isEligible(candidate) ? '✅ ELIGIBLE' : '❌ NON-ELIGIBLE' }}
                  </span>
                  <div v-if="!isEligible(candidate)" class="warning-list">
                    <ul>
                      <li v-for="reason in getEligibilityReason(candidate)" :key="reason">
                        {{ reason }}
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="filteredKandidat.length === 0" class="empty">
            <p>{{ emptyMessage }}</p>
          </div>
        </div>
      </div>

      <!-- REGISTRATION FORM -->
      <div class="registration-form card" v-if="canRegister">
        <h3>Daftarkan Calon Kandidat</h3>

        <div class="my-limit-info">
          <p v-if="remainingQuota === 0" class="limit-full">
            ⚠️ Anda sudah mendaftarkan calon untuk <strong>kedua jabatan</strong>.
          </p>
          <p v-else class="limit-remaining">
            Anda masih bisa mendaftarkan calon untuk:
            <span v-if="!myRegistrations.sarpras" class="available-position">✅ Waka Sarpras</span>
            <span v-if="!myRegistrations.kesiswaan" class="available-position"
              >✅ Waka Kesiswaan</span
            >
          </p>
          <p class="self-registration-note">
            <small
              >💡 <strong>Aturan:</strong> 1 guru dapat menjadi kandidat di
              <strong>kedua posisi</strong> (Sarpras dan Kesiswaan) secara bersamaan. Anda juga bisa
              mendaftarkan diri sendiri.</small
            >
          </p>
        </div>

        <div class="form-container" v-if="remainingQuota > 0">
          <form @submit.prevent="submitRegistration">
            <!-- POSITION SELECTION -->
            <div class="form-group">
              <label>Pilih Jabatan *</label>
              <select
                v-model="form.jabatan"
                required
                class="form-select"
                @change="resetSelectedGuru"
              >
                <option value="">Pilih Jabatan</option>
                <option v-if="!myRegistrations.sarpras" value="sarpras">
                  Waka Sarana Prasarana (Sarpras)
                </option>
                <option v-if="!myRegistrations.kesiswaan" value="kesiswaan">Waka Kesiswaan</option>
              </select>
              <p class="form-hint">
                <small>Anda hanya bisa mendaftarkan 1 calon untuk setiap jabatan</small>
              </p>
            </div>

            <!-- SELECT CANDIDATE -->
            <div class="form-group">
              <label>Pilih Guru yang Akan Didaftarkan *</label>
              <p class="form-hint">
                <small
                  >Hanya guru yang memenuhi semua syarat eligibility yang akan ditampilkan</small
                >
              </p>
              <select
                v-model="form.pengguna_id"
                required
                class="form-select"
                @change="onGuruSelected"
                :disabled="!form.jabatan"
              >
                <option value="">-- Pilih Guru Eligible --</option>
                <option
                  v-for="guru in availableGuruForCurrentPosition"
                  :key="guru.id"
                  :value="guru.id"
                  :class="{ 'self-option': guru.id === user.id }"
                >
                  {{ guru.nama_lengkap }}
                  ({{ guru.nip || 'No NIP' }}) - {{ calculateMasaKerja(guru) }}
                  <span v-if="guru.id === user.id">👤 (Anda)</span>
                  <span
                    v-if="isGuruAlreadyCandidateInOtherPosition(guru, form.jabatan)"
                    class="already-candidate-info"
                  >
                    - ✅ Sudah kandidat di {{ getOtherPositionForGuru(guru, form.jabatan) }}
                  </span>
                </option>
              </select>

              <!-- GURU DETAIL -->
              <div v-if="selectedGuruDetail" class="guru-detail">
                <h4>📋 Detail Guru Terpilih:</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <label>Nama:</label>
                    <span>{{ selectedGuruDetail.nama_lengkap }}</span>
                  </div>
                  <div class="detail-item">
                    <label>NIP:</label>
                    <span
                      ><code>{{ selectedGuruDetail.nip || 'Tidak ada' }}</code></span
                    >
                  </div>
                  <div class="detail-item">
                    <label>Status:</label>
                    <span
                      :class="[
                        'status-badge',
                        selectedGuruDetail.status_kepegawaian?.toLowerCase(),
                      ]"
                    >
                      {{ selectedGuruDetail.status_kepegawaian }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <label>Pangkat:</label>
                    <span>{{ selectedGuruDetail.golongan_ruang || 'Tidak ada' }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Masa Kerja:</label>
                    <span>{{ calculateMasaKerja(selectedGuruDetail) }}</span>
                    <div v-if="getMasaKerjaTahun(selectedGuruDetail) < 3" class="danger-text">
                      ❌ Masa kerja kurang dari 3 tahun
                    </div>
                  </div>
                  <div class="detail-item">
                    <label>Sisa Pensiun:</label>
                    <span :class="getSisaPensiunClass(selectedGuruDetail)">
                      {{ calculateSisaMenujuPensiun(selectedGuruDetail) }}
                      ({{ getSisaPensiunStatus(selectedGuruDetail) }})
                    </span>
                  </div>
                  <div class="detail-item">
                    <label>Jumlah Periode:</label>
                    <span>{{ getJumlahPeriode(selectedGuruDetail) }} periode</span>
                    <div v-if="needsJeda(selectedGuruDetail)" class="danger-text">
                      ❌ Perlu jeda periode (telah menjabat 2 periode berturut-turut)
                    </div>
                  </div>
                </div>

                <!-- POSISI LAIN YANG SUDAH DITEMPATI -->
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

                <!-- ELIGIBILITY STATUS -->
                <div v-if="!isEligible(selectedGuruDetail)" class="eligibility-warnings">
                  <h5>❌ Masalah Eligibility:</h5>
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

                <!-- SELF-REGISTRATION WARNING -->
                <div v-if="isSelfRegistration" class="self-warning-box">
                  <h5>👤 Anda akan mendaftarkan diri sendiri</h5>
                  <div class="confirmation-checkbox">
                    <input type="checkbox" id="confirmSelf" v-model="confirmSelfRegistration" />
                    <label for="confirmSelf"
                      >Saya memahami dan menyetujui untuk mendaftarkan diri sendiri sebagai
                      calon</label
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- NOMOR URUT -->
            <div class="form-group">
              <label>Nomor Urut *</label>
              <input
                v-model.number="form.nomor_urut"
                type="number"
                min="1"
                required
                class="form-input"
                placeholder="1, 2, 3, ..."
                :disabled="!form.pengguna_id"
              />
              <p class="form-hint">
                <small
                  >Nomor urut untuk posisi ini. Akan otomatis diisi dengan nomor berikutnya.</small
                >
              </p>
              <div v-if="nomorUrutError" class="error-text">{{ nomorUrutError }}</div>
            </div>

            <!-- SUBMIT BUTTON -->
            <div class="form-actions">
              <button
                type="submit"
                :disabled="
                  !canSubmit || submitting || (isSelfRegistration && !confirmSelfRegistration)
                "
                class="btn-submit"
              >
                {{ submitting ? 'Mendaftarkan...' : 'Daftarkan Calon' }}
              </button>
              <p v-if="isSelfRegistration && !confirmSelfRegistration" class="confirmation-error">
                ⚠️ Anda harus mencentang kotak konfirmasi untuk mendaftarkan diri sendiri
              </p>
            </div>
          </form>
        </div>

        <!-- REGISTRATION RESULT -->
        <div v-if="registrationResult" class="registration-result" :class="registrationResult.type">
          <h4>{{ registrationResult.title }}</h4>
          <p>{{ registrationResult.message }}</p>
          <button v-if="registrationResult.success" @click="resetForm" class="btn-again">
            Daftarkan Calon Lain
          </button>
        </div>
      </div>

      <!-- CANNOT REGISTER -->
      <div v-else class="cannot-register card">
        <h3>Tidak Dapat Mendaftar</h3>
        <div v-if="!activeSession"><p>❌ Tidak ada sesi pemilihan aktif</p></div>
        <div v-else-if="activeSession.status !== 'pendaftaran'">
          <p>❌ Pendaftaran hanya saat sesi PENDAFTARAN</p>
        </div>
        <div v-else-if="remainingQuota === 0">
          <p>❌ Anda sudah mendaftarkan calon untuk kedua jabatan</p>
        </div>
        <div v-else-if="!user.can_register_candidate">
          <p>❌ Anda tidak dapat mendaftarkan calon (hanya PNS/PPPK yang bisa)</p>
        </div>
      </div>

      <!-- INFO BOX -->
      <div class="info-box card">
        <h3>📋 Informasi Penting</h3>
        <p><strong>Posisi yang dipilih:</strong></p>
        <p>• Waka Sarana Prasarana (Sarpras)</p>
        <p>• Waka Kesiswaan</p>
        <p><strong>Status Anda:</strong> {{ user.status_kepegawaian }}</p>
        <p>
          <strong>Hak Anda:</strong>
          {{ user.can_register_candidate ? 'Bisa mendaftarkan calon' : 'Hanya bisa melihat' }}
        </p>
        <p><strong>Syarat Eligibility Calon:</strong></p>
        <ul>
          <li>✓ Status kepegawaian: PNS atau PPPK</li>
          <li>✓ Masa kerja minimal: 3 tahun</li>
          <li>✓ Sisa pensiun minimal: 3 tahun</li>
          <li>✓ NIP valid (18 digit, format benar)</li>
          <li>✓ Jeda periode (jika pernah menjabat)</li>
          <li>✓ Tidak ditandai manual non-eligible</li>
        </ul>
        <p><strong>Aturan Khusus:</strong></p>
        <ul>
          <li>✓ 1 guru dapat menjadi kandidat di kedua posisi</li>
          <li>✓ 1 peserta boleh mendaftarkan 1 calon per jabatan</li>
          <li>✓ Boleh mendaftarkan diri sendiri</li>
          <li>✓ Tidak boleh mendaftarkan guru yang sudah jadi kandidat di posisi yang sama</li>
        </ul>
      </div>
    </div>

    <!-- NO USER MESSAGE -->
    <div v-else-if="!loadingUser && !user" class="no-user">
      <div class="error-card card">
        <h3>⚠️ Akses Ditolak</h3>
        <p>Anda belum login atau sesi telah berakhir.</p>
        <button @click="goToLogin" class="btn-primary">Login Kembali</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const authStore = useAuthStore()

// ==================== STATE ====================
const loadingUser = ref(true)
const loading = ref(true)
const activeSession = ref(null)
const myRegistrations = ref({ sarpras: null, kesiswaan: null })
const guruList = ref([])
const kandidatList = ref([])
const periodeJabatanList = ref([])
const submitting = ref(false)
const registrationResult = ref(null)
const confirmSelfRegistration = ref(false)
const activeTab = ref('all')

// Form
const form = ref({
  pengguna_id: '',
  jabatan: '',
  nomor_urut: 1,
})

// ==================== COMPUTED PROPERTIES ====================
const user = computed(() => authStore.user || null)

const canRegister = computed(() => {
  if (!user.value) return false
  if (!activeSession.value) return false
  if (activeSession.value.status !== 'pendaftaran') return false
  if (user.value.can_register_candidate === false) return false
  return true
})

const remainingQuota = computed(() => {
  let count = 2
  if (myRegistrations.value.sarpras) count--
  if (myRegistrations.value.kesiswaan) count--
  return count
})

// Count kandidat per posisi
const sarprasCount = computed(
  () => kandidatList.value.filter((k) => k.jabatan === 'sarpras').length,
)
const kesiswaanCount = computed(
  () => kandidatList.value.filter((k) => k.jabatan === 'kesiswaan').length,
)

// Filter kandidat berdasarkan tab
const filteredKandidat = computed(() => {
  if (activeTab.value === 'all') return kandidatList.value
  return kandidatList.value.filter((k) => k.jabatan === activeTab.value)
})

const emptyMessage = computed(() => {
  if (activeTab.value !== 'all') {
    return `Belum ada kandidat untuk posisi ${activeTab.value === 'sarpras' ? 'Sarpras' : 'Kesiswaan'}`
  }
  return 'Belum ada kandidat untuk sesi ini'
})

// ==================== FUNGSI PARSING NIP (SAMA DENGAN ADMIN) ====================
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

// ==================== FUNGSI PERHITUNGAN (SAMA DENGAN ADMIN) ====================
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

// ==================== FUNGSI ELIGIBILITY (SAMA DENGAN ADMIN) ====================
const isPNSatauPPPK = (status) => ['PNS', 'PPPK'].includes(status)

const isEligible = (guru) => {
  if (!guru) return false
  if (guru.peran !== 'guru') return false
  if (!isPNSatauPPPK(guru.status_kepegawaian)) return false
  if (!guru.nip || !isNIPValid(guru.nip)) return false
  if (calculateMasaKerjaTahun(guru) < 3) return false

  const sisa = calculateSisaMenujuPensiun(guru)
  if (sisa === '?' || sisa < 3) return false
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

// ==================== STATISTIK ELIGIBILITY ====================
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

// ==================== FUNGSI UNTUK 1 GURU 2 POSISI (SAMA DENGAN ADMIN) ====================
const isGuruAlreadyCandidateInThisPosition = (guru, position) => {
  return kandidatList.value.some((k) => k.pengguna_id === guru.id && k.jabatan === position)
}

const isGuruAlreadyCandidateInOtherPosition = (guru, currentPosition) => {
  return kandidatList.value.some((k) => k.pengguna_id === guru.id && k.jabatan !== currentPosition)
}

const getOtherPositionForGuru = (guru, currentPosition) => {
  const otherPosition = kandidatList.value.find(
    (k) => k.pengguna_id === guru.id && k.jabatan !== currentPosition,
  )
  return otherPosition ? (otherPosition.jabatan === 'sarpras' ? 'Sarpras' : 'Kesiswaan') : ''
}

// Available guru untuk posisi saat ini (tidak boleh sudah jadi kandidat di posisi ini)
const availableGuruForCurrentPosition = computed(() => {
  const currentPosition = form.value.jabatan
  if (!currentPosition) return []

  return guruList.value.filter((g) => {
    // Filter yang eligible
    if (!isEligible(g)) return false
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

const isSelfRegistration = computed(() => {
  return form.value.pengguna_id && user.value && form.value.pengguna_id === user.value.id
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

// Validasi form
const nomorUrutError = computed(() => {
  if (!form.value.nomor_urut || !form.value.jabatan) return ''

  const existing = kandidatList.value.find(
    (k) => k.jabatan === form.value.jabatan && k.nomor_urut === form.value.nomor_urut,
  )

  return existing ? `Nomor urut ${form.value.nomor_urut} sudah digunakan untuk posisi ini` : ''
})

const canSubmit = computed(() => {
  if (!form.value.jabatan || !form.value.pengguna_id || !form.value.nomor_urut) return false
  if (nomorUrutError.value) return false
  if (!selectedGuruDetail.value) return false
  if (!isEligible(selectedGuruDetail.value)) return false
  if (needsJeda(selectedGuruDetail.value)) return false
  if (isSelfRegistration.value && !confirmSelfRegistration.value) return false
  return true
})

// ==================== PERIODE JABATAN (SAMA DENGAN ADMIN) ====================
const getJumlahPeriode = (guru) => {
  if (!guru?.id) return 0
  const periode = periodeJabatanList.value.filter((p) => p.pengguna_id === guru.id)
  return periode.length
}

const needsJeda = (guru) => {
  if (!guru?.id) return false
  const periode = periodeJabatanList.value
    .filter((p) => p.pengguna_id === guru.id)
    .sort((a, b) => b.tahun_mulai - a.tahun_mulai)

  if (periode.length >= 2) {
    const terbaru = periode[0]
    const sebelumnya = periode[1]
    if (terbaru.tahun_mulai - sebelumnya.tahun_selesai <= 2) {
      const tahunSekarang = new Date().getFullYear()
      if (terbaru.tahun_selesai && tahunSekarang - terbaru.tahun_selesai < 2) {
        return true
      }
    }
  }
  return false
}

// ==================== HELPER FUNCTIONS ====================
const getMasaKerjaTahun = (guru) => calculateMasaKerjaTahun(guru)

const getRowClass = (kandidat) => {
  if (isEligible(kandidat)) return 'eligible-row'
  return 'noneligible-row'
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatStatus = (status) => {
  const map = {
    draft: 'Draft',
    pendaftaran: 'Pendaftaran',
    voting: 'Voting Berlangsung',
    selesai: 'Selesai',
  }
  return map[status] || status
}

const formatJabatan = (jabatan) => {
  const map = { sarpras: 'Waka Sarana Prasarana', kesiswaan: 'Waka Kesiswaan' }
  return map[jabatan] || jabatan
}

// ==================== METHODS ====================
const goToLogin = () => {
  router.push('/login-calon')
}

const resetSelectedGuru = () => {
  form.value.pengguna_id = ''
  form.value.nomor_urut =
    kandidatList.value.filter((k) => k.jabatan === form.value.jabatan).length + 1
  confirmSelfRegistration.value = false
}

const onGuruSelected = () => {
  if (form.value.pengguna_id && form.value.jabatan) {
    if (!form.value.nomor_urut) {
      form.value.nomor_urut =
        kandidatList.value.filter((k) => k.jabatan === form.value.jabatan).length + 1
    }
  }
}

const resetForm = () => {
  form.value = { pengguna_id: '', jabatan: '', nomor_urut: 1 }
  confirmSelfRegistration.value = false
  registrationResult.value = null
}

// ==================== DATA LOADING ====================
const loadData = async () => {
  loading.value = true
  try {
    // Get current session
    const { data: sessions } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .in('status', ['pendaftaran', 'voting'])
      .order('dibuat_pada', { ascending: false })
      .limit(1)

    if (sessions && sessions.length > 0) {
      activeSession.value = sessions[0]
      await loadKandidat()
      await loadMyRegistrations()
    } else {
      activeSession.value = null
    }

    // Load all active teachers
    const { data: guru } = await supabase
      .from('pengguna')
      .select('*')
      .eq('peran', 'guru')
      .eq('is_active', true)
      .order('nama_lengkap')

    guruList.value = guru || []

    // Load periode jabatan
    const { data: periode } = await supabase
      .from('periode_jabatan')
      .select('*')
      .order('tahun_mulai', { ascending: false })

    periodeJabatanList.value = periode || []
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

const loadKandidat = async () => {
  try {
    if (!activeSession.value) return

    const { data: kandidat } = await supabase
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
        ),
        pendaftar:dibuat_oleh (id, nama_lengkap)
      `,
      )
      .eq('sesi_id', activeSession.value.id)
      .order('jabatan')
      .order('nomor_urut')

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
      pendaftar: k.pendaftar?.nama_lengkap,
      is_self: k.pengguna_id === k.dibuat_oleh,
    }))
  } catch (error) {
    console.error('Error loading kandidat:', error)
    kandidatList.value = []
  }
}

const loadMyRegistrations = async () => {
  try {
    if (!activeSession.value || !user.value) return

    const { data: registrations } = await supabase
      .from('kandidat')
      .select(
        `
        *,
        calon:pengguna_id (id, nama_lengkap),
        pendaftar:dibuat_oleh (id, nama_lengkap)
      `,
      )
      .eq('sesi_id', activeSession.value.id)
      .eq('dibuat_oleh', user.value.id)

    myRegistrations.value = { sarpras: null, kesiswaan: null }

    if (registrations) {
      registrations.forEach((reg) => {
        if (reg.jabatan === 'sarpras') {
          myRegistrations.value.sarpras = {
            id: reg.calon.id,
            nama: reg.calon.nama_lengkap,
            kandidat_id: reg.id,
            is_self: reg.pengguna_id === user.value.id,
          }
        } else if (reg.jabatan === 'kesiswaan') {
          myRegistrations.value.kesiswaan = {
            id: reg.calon.id,
            nama: reg.calon.nama_lengkap,
            kandidat_id: reg.id,
            is_self: reg.pengguna_id === user.value.id,
          }
        }
      })
    }
  } catch (error) {
    console.error('Error loading my registrations:', error)
  }
}

const handleLogout = async () => {
  try {
    if (confirm('Yakin ingin logout?')) {
      const success = await authStore.logout()
      if (success) {
        router.push('/login-calon')
      } else {
        alert('Logout gagal')
      }
    }
  } catch (error) {
    console.error('Logout error:', error)
    alert('Terjadi kesalahan saat logout')
  }
}

const submitRegistration = async () => {
  if (!canSubmit.value) return

  submitting.value = true
  registrationResult.value = null

  try {
    // Validasi: Guru sudah jadi kandidat di posisi yang sama?
    if (isGuruAlreadyCandidateInThisPosition(selectedGuruDetail.value, form.value.jabatan)) {
      throw new Error(
        `${selectedGuruDetail.value.nama_lengkap} sudah terdaftar sebagai kandidat di posisi ini!`,
      )
    }

    // Validasi periode jeda
    if (needsJeda(selectedGuruDetail.value)) {
      throw new Error(
        `${selectedGuruDetail.value.nama_lengkap} perlu jeda periode! (telah menjabat 2 periode berturut-turut)`,
      )
    }

    // Tampilkan konfirmasi jika guru sudah jadi kandidat di posisi lain
    if (isGuruAlreadyCandidateInOtherPosition(selectedGuruDetail.value, form.value.jabatan)) {
      const otherPosition = getOtherPositionForGuru(selectedGuruDetail.value, form.value.jabatan)
      const confirmMessage = `⚠️ ${selectedGuruDetail.value.nama_lengkap} sudah terdaftar sebagai kandidat di posisi ${otherPosition}.\n\nApakah Anda yakin ingin mendaftarkan guru ini juga di posisi ${form.value.jabatan === 'sarpras' ? 'Sarpras' : 'Kesiswaan'}?`

      if (!confirm(confirmMessage)) {
        throw new Error('Pendaftaran dibatalkan')
      }
    }

    // Insert kandidat
    const { error: kandidatError } = await supabase.from('kandidat').insert({
      pengguna_id: form.value.pengguna_id,
      sesi_id: activeSession.value.id,
      jabatan: form.value.jabatan,
      nomor_urut: form.value.nomor_urut,
      dibuat_oleh: user.value.id,
      total_suara: 0,
      dibuat_pada: new Date().toISOString(),
    })

    if (kandidatError) {
      if (kandidatError.code === '23505') {
        throw new Error('Guru ini sudah terdaftar sebagai kandidat untuk jabatan ini')
      }
      throw kandidatError
    }

    // Success
    registrationResult.value = {
      success: true,
      type: 'success',
      title: '✅ Pendaftaran Berhasil!',
      message: `Anda berhasil mendaftarkan ${selectedGuruDetail.value.nama_lengkap} sebagai calon ${formatJabatan(form.value.jabatan)} (No. ${form.value.nomor_urut})`,
    }

    // Reset form
    resetForm()

    // Reload data
    await loadData()
  } catch (error) {
    console.error('Registration error:', error)
    registrationResult.value = {
      success: false,
      type: 'error',
      title: '❌ Gagal Mendaftarkan',
      message: error.message || 'Terjadi kesalahan',
    }
  } finally {
    submitting.value = false
  }
}

// ==================== LIFECYCLE ====================
onMounted(async () => {
  try {
    loadingUser.value = true
    await new Promise((resolve) => setTimeout(resolve, 100))

    const userData = await authStore.checkSession()
    console.log('Dashboard mounted - User:', userData)
    console.log('Is peserta?', authStore.isPeserta())

    if (!userData || !authStore.isPeserta()) {
      console.log('No valid session, redirecting to login')
      router.push('/login-calon')
      return
    }

    await loadData()
  } catch (error) {
    console.error('Error loading dashboard:', error)
    router.push('/login-calon')
  } finally {
    loadingUser.value = false
  }
})

// Watch perubahan jabatan
watch(
  () => form.value.jabatan,
  () => {
    if (form.value.jabatan) {
      resetSelectedGuru()
    }
  },
)
</script>

<style scoped>
.dashboard-calon {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #000000;
}

/* HEADER */
.header {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 25px;
  box-shadow: 0 5px 15px rgba(30, 58, 138, 0.2);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header h1 {
  margin: 0;
  font-size: 1.8rem;
}

/* LOGOUT BUTTON */
.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
  font-size: 0.9rem;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

/* USER INFO */
.user-info {
  background: rgba(255, 255, 255, 0.15);
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.user-info.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.user-info.error {
  background: rgba(254, 202, 202, 0.2);
  border: 1px solid rgba(220, 38, 38, 0.3);
}

.user-info p {
  margin: 8px 0;
}

.badge-success {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* LOADING */
.loading-session {
  text-align: center;
  padding: 50px;
  color: #000000;
  font-size: 1.1rem;
  background: #f9fafb;
  border-radius: 10px;
  margin: 20px 0;
  font-weight: 600;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1e3a8a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* NO USER */
.no-user {
  margin-top: 50px;
  text-align: center;
}

.error-card {
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}

.btn-primary {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 15px;
}

.btn-primary:hover {
  background: #1e40af;
}

.retry-btn {
  background: white;
  color: #1e3a8a;
  border: 2px solid #1e3a8a;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 10px;
}

/* CARDS */
.card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid #eef2ff;
}

.card h3 {
  color: #000000;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eef2ff;
  font-size: 1.3rem;
  font-weight: 700;
}

/* SESSION INFO */
.session-info p {
  color: #000000 !important;
  margin: 8px 0;
}

.session-info strong {
  color: #000000;
  font-weight: 700;
}

.session-info .status-pendaftaran {
  background: #fef3c7;
  color: #000000;
  padding: 5px 12px;
  border-radius: 20px;
  font-weight: 700;
  margin-left: 8px;
  border: 1px solid #fbbf24;
}

/* POSITION STATS */
.position-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.stat-card {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.stat-icon {
  font-size: 1.5rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 10px;
}

.stat-info h4 {
  margin: 0 0 0.25rem 0;
  color: #1e293b;
  font-size: 0.9rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e40af;
  margin: 0;
  line-height: 1;
}

.stat-info small {
  font-size: 0.7rem;
  color: #64748b;
}

/* ELIGIBILITY SUMMARY */
.eligibility-summary {
  margin: 1.5rem 0;
}

.eligibility-summary h3 {
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.eligibility-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.eligibility-item {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.eligibility-item.success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.eligibility-item.danger {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* LIMIT INFO */
.limit-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #f0f7ff;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.limit-info ul {
  margin: 0.5rem 0 0 1.5rem;
}

.limit-info li {
  margin: 0.25rem 0;
}

.self-badge {
  font-size: 0.7rem;
  background: #fef3c7;
  color: #92400e;
  padding: 2px 6px;
  border-radius: 8px;
  display: inline-block;
  margin-left: 0.5rem;
}

/* CURRENT CANDIDATES */
.candidates-table-container {
  margin-top: 1rem;
  overflow-x: auto;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.5rem;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.tabs button {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #64748b;
  font-weight: 600;
  font-size: 0.85rem;
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

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

thead {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
}

th {
  padding: 0.75rem 1rem;
  text-align: left;
  color: white;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

tbody tr:hover {
  background: #f8fafc;
}

tbody tr:last-child td {
  border-bottom: none;
}

/* Row styling */
.eligible-row {
  background: #f0fdf4 !important;
}

.eligible-row:hover {
  background: #dcfce7 !important;
}

.noneligible-row {
  background: #fef2f2;
  opacity: 0.8;
}

.noneligible-row:hover {
  background: #fee2e2;
}

/* Candidate details */
.nomor-urut {
  font-weight: 800;
  color: #1e40af;
  font-size: 1.1rem;
}

.candidate-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.candidate-name {
  font-weight: 600;
  color: #000000;
  margin-bottom: 0.25rem;
}

.pangkat {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
}

.registered-by {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

/* NIP */
.nip {
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #475569;
  margin-bottom: 0.25rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 15px;
  font-size: 0.7rem;
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

/* Badges */
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-block;
}

.badge.sarpras {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.badge.kesiswaan {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #3b82f6;
}

/* Masa Kerja & Sisa Pensiun */
.masa-kerja,
.sisa-pensiun,
.periode-jabatan {
  font-weight: 600;
  font-size: 0.85rem;
}

.warning-badge,
.danger-badge {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.65rem;
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
  font-size: 0.75rem;
}

.danger-text {
  color: #dc2626;
  font-weight: 600;
  font-size: 0.8rem;
}

.warning-text {
  color: #d97706;
  font-weight: 600;
  font-size: 0.8rem;
}

.success-text {
  color: #059669;
  font-weight: 600;
  font-size: 0.8rem;
}

.error-text {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.warning-list {
  margin-top: 0.25rem;
}

.warning-list ul {
  margin: 0;
  padding-left: 1rem;
  font-size: 0.7rem;
}

.warning-list li {
  color: #dc2626;
  margin-bottom: 0.125rem;
}

.other-position-info {
  margin-top: 0.25rem;
  font-size: 0.7rem;
  color: #3b82f6;
  background: #dbeafe;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.empty {
  padding: 2rem 1rem;
  text-align: center;
  background: #f8fafc;
  border-radius: 8px;
}

.empty p {
  color: #64748b;
  font-size: 0.9rem;
}

/* FORM */
.form-container {
  margin-top: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #000000;
  font-size: 0.9rem;
}

.form-hint {
  color: #666;
  font-size: 0.8rem;
  margin-top: -0.25rem;
  margin-bottom: 0.5rem;
  font-style: italic;
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  transition: border 0.3s;
  color: #000000;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-select option.self-option {
  background-color: #fef3c7;
  font-weight: bold;
}

.already-candidate-info {
  color: #10b981;
  font-weight: 500;
  font-style: italic;
  font-size: 0.8rem;
}

/* GURU DETAIL */
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
  font-size: 0.95rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.detail-item label {
  font-weight: 600;
  color: #374151;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  color: #1e293b;
  font-size: 0.85rem;
  font-weight: 500;
}

/* OTHER POSITIONS INFO */
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
  font-size: 0.85rem;
}

.other-positions-info ul {
  margin: 0;
  padding-left: 1.25rem;
}

.other-positions-info li {
  font-size: 0.8rem;
  color: #92400e;
  margin-bottom: 0.125rem;
}

/* ELIGIBILITY WARNINGS */
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
  font-size: 0.85rem;
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
  font-size: 0.85rem;
}

.eligibility-success p {
  margin: 0;
  font-size: 0.8rem;
  color: #166534;
}

/* SELF WARNING BOX */
.self-warning-box {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border-radius: 6px;
  border: 2px solid #fbbf24;
}

.self-warning-box h5 {
  margin: 0 0 0.5rem 0;
  color: #92400e;
  font-size: 0.85rem;
}

.confirmation-checkbox {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #d1d5db;
}

.confirmation-checkbox input {
  margin-right: 0.5rem;
}

.confirmation-checkbox label {
  font-weight: 600;
  color: #000000;
  font-size: 0.85rem;
}

.confirmation-error {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  font-weight: 600;
}

/* FORM ACTIONS */
.form-actions {
  margin-top: 2rem;
  text-align: center;
}

.btn-submit {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 200px;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(30, 58, 138, 0.3);
}

.btn-submit:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-again {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 0.75rem;
}

.btn-again:hover {
  background: #059669;
}

/* REGISTRATION RESULT */
.registration-result {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
}

.registration-result.success {
  background: #d1fae5;
  border: 1px solid #a7f3d0;
}

.registration-result.error {
  background: #fee2e2;
  border: 1px solid #fca5a5;
}

.registration-result h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #000000;
}

.registration-result p {
  margin: 0 0 0.75rem 0;
  color: #000000;
  font-weight: 600;
  font-size: 0.9rem;
}

/* LIMIT INFO */
.my-limit-info {
  margin-bottom: 1.5rem;
}

.limit-full {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.limit-remaining {
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.self-registration-note {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  color: #92400e;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

.available-position {
  display: inline-block;
  margin: 0 0.5rem;
  padding: 0.25rem 0.5rem;
  background: white;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.85rem;
}

/* INFO BOX */
.info-box ul {
  margin: 0.5rem 0 0.5rem 1.5rem;
}

.info-box li {
  margin: 0.25rem 0;
  color: #000000;
  font-size: 0.9rem;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .dashboard-calon {
    padding: 15px;
  }

  .header,
  .card {
    padding: 20px;
  }

  .header-top {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .logout-btn {
    align-self: center;
  }

  .position-stats {
    grid-template-columns: 1fr;
  }

  .eligibility-grid {
    grid-template-columns: 1fr;
  }

  .candidates-table-container {
    overflow-x: auto;
  }

  table {
    min-width: 800px;
  }

  .btn-submit {
    width: 100%;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .card {
    padding: 15px;
  }

  th,
  td {
    padding: 0.5rem 0.75rem;
  }

  .tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .tabs button {
    white-space: nowrap;
  }
}
</style>
