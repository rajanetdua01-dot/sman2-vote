<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="title">Login Calon Kandidat</h1>
      <p class="subtitle">SMAN 2 Bandar Lampung</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="nip">NIP</label>
          <input type="text" id="nip" v-model="nip" placeholder="Masukkan NIP" required />
        </div>

        <div class="form-group">
          <label for="tanggalLahir">Password (DDMMYYYY)</label>
          <input
            type="password"
            id="tanggalLahir"
            v-model="tanggalLahir"
            placeholder="Contoh: 15041983"
            maxlength="8"
            required
          />
          <small class="hint">Format: DDMMYYYY (Tanggal Lahir)</small>
        </div>

        <button type="submit" :disabled="loading" class="login-btn">
          {{ loading ? 'Memproses...' : 'Login' }}
        </button>

        <div v-if="error" class="error-message">❌ {{ error }}</div>

        <div v-if="success" class="success-message">✅ Login berhasil! Redirecting...</div>
      </form>

      <div class="info-box">
        <p><strong>Contoh:</strong></p>
        <p>Lahir 15 April 1983 → Password: <strong>15041983</strong></p>
        <p>Lahir 3 Mei 1975 → Password: <strong>03051975</strong></p>
      </div>

      <div class="footer-links">
        <router-link to="/scan">Pemilih? Scan QR Code disini</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const nip = ref('')
const tanggalLahir = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

const router = useRouter()
const authStore = useAuthStore()

const handleLogin = async () => {
  if (!nip.value || !tanggalLahir.value) {
    error.value = 'NIP dan Password harus diisi'
    return
  }

  if (!/^\d{8}$/.test(tanggalLahir.value)) {
    error.value = 'Password harus 8 digit angka (DDMMYYYY)'
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  const result = await authStore.loginCalon(nip.value, tanggalLahir.value)

  if (result.success) {
    success.value = true
    setTimeout(() => {
      router.push('/dashboard-calon')
    }, 1500)
  } else {
    error.value = result.error
  }

  loading.value = false
}
</script>

<style scoped>
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
  max-width: 400px;
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
  margin-bottom: 2rem;
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
  color: #666;
  font-size: 0.85rem;
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

.footer-links {
  margin-top: 1.5rem;
  text-align: center;
}

.footer-links a {
  color: #1e3a8a;
  text-decoration: none;
}

.footer-links a:hover {
  text-decoration: underline;
}
</style>
