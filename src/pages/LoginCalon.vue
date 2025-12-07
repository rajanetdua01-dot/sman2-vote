<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="title">Login Peserta Pemilihan</h1>
      <p class="subtitle">SMAN 2 Bandar Lampung</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="nip">NIP / Nomor Induk</label>
          <input
            type="text"
            id="nip"
            v-model="nip"
            placeholder="Masukkan NIP"
            required
            @input="updatePasswordHint"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-input-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="password"
              placeholder="Masukkan password"
              required
            />
            <button
              type="button"
              class="toggle-password"
              @click="toggleShowPassword"
              :title="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
            >
              <span v-if="showPassword">👁️</span>
              <span v-else>👁️‍🗨️</span>
            </button>
          </div>
          <small v-if="passwordHint" class="hint">{{ passwordHint }}</small>
        </div>

        <button type="submit" :disabled="loading" class="login-btn">
          {{ loading ? 'Memproses...' : 'Login sebagai Peserta' }}
        </button>

        <div v-if="error" class="error-message">❌ {{ error }}</div>
        <div v-if="success" class="success-message">✅ Login berhasil! Mengalihkan...</div>
      </form>

      <div class="info-box">
        <p><strong>Petunjuk Login:</strong></p>

        <div class="password-guide">
          <div class="guide-item" @click="setExample('PNS')">
            <strong>PNS:</strong> Password = Tanggal Lahir (DDMMYYYY)<br />
            <small>Contoh: NIP 197711072014072001 → Password: 07111977</small>
          </div>

          <div class="guide-item" @click="setExample('PPPK')">
            <strong>PPPK:</strong> Password = Tanggal Lahir (DDMMYYYY)<br />
            <small>Contoh: NIP 199509292024212031 → Password: 29091995</small>
          </div>

          <div class="guide-item" @click="setExample('PTT')">
            <strong>PTT/GTT/Honorer:</strong> Password = smanda123<br />
            <small>Contoh: NIP PTT20250001 → Password: smanda123</small>
          </div>
        </div>

        <p class="note">
          <small>Semua peserta (guru & tendik) bisa login untuk mendaftarkan calon kandidat</small>
        </p>
      </div>

      <div class="footer-links">
        <router-link to="/scan">Pemilih? Scan QR Code</router-link>
        <br />
        <router-link to="/admin-login">Admin? Login disini</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const nip = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)
const passwordHint = ref('')
const showPassword = ref(false) // 🔥 TAMBAHKAN STATE INI

const router = useRouter()
const authStore = useAuthStore()

// 🔥 TOGGLE SHOW PASSWORD
const toggleShowPassword = () => {
  showPassword.value = !showPassword.value
}

// Update password hint berdasarkan NIP
const updatePasswordHint = () => {
  const nipStr = nip.value.trim()

  if (nipStr.startsWith('PTT') || nipStr.startsWith('GTT') || nipStr.startsWith('HNR')) {
    passwordHint.value = 'Password: smanda123 (default)'
  } else if (/^\d{8,}/.test(nipStr)) {
    const yyyymmdd = nipStr.substring(0, 8)
    if (/^\d{8}$/.test(yyyymmdd)) {
      const day = yyyymmdd.substring(6, 8)
      const month = yyyymmdd.substring(4, 6)
      const year = yyyymmdd.substring(0, 4)
      passwordHint.value = `Password yang diharapkan: ${day}${month}${year} (DDMMYYYY)`
    } else {
      passwordHint.value = 'Format NIP tidak valid'
    }
  } else {
    passwordHint.value = ''
  }
}

// Set contoh login
const setExample = (type) => {
  switch (type) {
    case 'PNS':
      nip.value = '197711072014072001'
      password.value = '07111977'
      break
    case 'PPPK':
      nip.value = '199509292024212031'
      password.value = '29091995'
      break
    case 'PTT':
      nip.value = 'PTT20250001'
      password.value = 'smanda123'
      break
  }
  updatePasswordHint()
}

// Auto redirect jika sudah login
onMounted(async () => {
  const user = await authStore.checkSession()
  if (user && authStore.isPeserta()) {
    router.push('/dashboard-calon')
  }
})

// Handle login
const handleLogin = async () => {
  if (!nip.value || !password.value) {
    error.value = 'NIP dan Password harus diisi'
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  try {
    const result = await authStore.loginPeserta(nip.value, password.value)

    if (result.success) {
      success.value = true
      setTimeout(() => {
        router.push('/dashboard-calon')
      }, 1000)
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = `Error: ${err.message}`
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 🔥 TAMBAHKAN STYLE UNTUK TOGGLE PASSWORD */
.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  width: 100%;
  padding-right: 45px; /* Space untuk toggle button */
}

.toggle-password {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.toggle-password:hover {
  background-color: #f0f0f0;
}

.toggle-password:active {
  transform: scale(0.95);
}

/* STYLE LAINNYA TETAP SAMA */
.login-container {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 450px;
}

.title {
  color: #1e3a8a;
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.subtitle {
  color: #666;
  text-align: center;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #1e3a8a;
}

.hint {
  display: block;
  margin-top: 0.25rem;
  color: #1e3a8a;
  font-size: 0.85rem;
  font-weight: 500;
  background: #f0f7ff;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  border-left: 3px solid #1e3a8a;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #1e3a8a;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-btn:hover:not(:disabled) {
  background-color: #1e40af;
}

.login-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fee;
  color: #c00;
  border-radius: 4px;
  text-align: center;
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #d4edda;
  color: #155724;
  border-radius: 4px;
  text-align: center;
}

.info-box {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #1e3a8a;
}

.info-box p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.password-guide {
  margin-top: 1rem;
}

.guide-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f0f7ff;
  border-radius: 4px;
  border-left: 3px solid #1e3a8a;
  cursor: pointer;
  transition: all 0.2s;
}

.guide-item:hover {
  background: #e1f0ff;
  transform: translateX(5px);
}

.guide-item small {
  color: #666;
  font-size: 0.8rem;
  display: block;
  margin-top: 0.25rem;
}

.note {
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #ddd;
  color: #666;
  font-style: italic;
}

.footer-links {
  margin-top: 1.5rem;
  text-align: center;
}

.footer-links a {
  color: #1e3a8a;
  text-decoration: none;
  font-size: 0.9rem;
}

.footer-links a:hover {
  text-decoration: underline;
}

/* Responsive untuk toggle password */
@media (max-width: 480px) {
  .toggle-password {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .password-input-wrapper input {
    padding-right: 40px;
  }
}
</style>
