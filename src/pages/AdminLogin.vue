<template>
  <div class="admin-login">
    <div class="login-container">
      <div class="login-header">
        <h1>Panel Admin/Panitia</h1>
        <p>Sistem Voting SMAN 2 Bandar Lampung</p>
      </div>

      <div class="login-card">
        <h2>Login Admin</h2>

        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="nip">NIP Admin</label>
            <input type="text" id="nip" v-model="nip" placeholder="Masukkan NIP admin" required />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              v-model="password"
              placeholder="Password (DDMMYYYY)"
              required
            />
            <small>Format: DDMMYYYY (Tanggal Lahir)</small>
          </div>

          <button type="submit" :disabled="loading" class="login-btn">
            {{ loading ? 'Memproses...' : 'Login sebagai Admin' }}
          </button>

          <div v-if="error" class="error-message">❌ {{ error }}</div>
        </form>

        <div class="login-footer">
          <p>
            Bukan admin?
            <router-link to="/login-calon">Login sebagai Calon</router-link> |
            <router-link to="/">Kembali ke Home</router-link>
          </p>
          <p class="hint">
            <strong>Default Admin:</strong><br />
            NIP: <code>admin001</code><br />
            Password: <code>10081975</code> (10 Agustus 1975)
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()

const nip = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!nip.value || !password.value) {
    error.value = 'NIP dan Password harus diisi'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 1. Cek user di database
    const { data: user, error: userError } = await supabase
      .from('pengguna')
      .select('*')
      .eq('nip', nip.value)
      .eq('peran', 'admin')
      .single()

    if (userError || !user) {
      throw new Error('NIP admin tidak ditemukan')
    }

    // 2. Validasi password (tanggal lahir)
    const birthDate = new Date(user.tanggal_lahir)
    const day = String(birthDate.getDate()).padStart(2, '0')
    const month = String(birthDate.getMonth() + 1).padStart(2, '0')
    const year = birthDate.getFullYear()
    const birthPassword = `${day}${month}${year}`

    if (password.value !== birthPassword) {
      throw new Error('Password salah')
    }

    // 3. Simpan session admin
    const adminSession = {
      user,
      type: 'admin',
      role: user.peran,
    }

    localStorage.setItem('smanda_admin', JSON.stringify(adminSession))
    localStorage.setItem('smanda_user', JSON.stringify(user))
    localStorage.setItem('smanda_session', JSON.stringify({ type: 'admin' }))

    // 4. Redirect ke admin dashboard
    router.push('/admin-dashboard')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 500px;
}

.login-header {
  text-align: center;
  color: white;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.login-header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.login-card h2 {
  color: #1e3a8a;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.8rem;
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
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #1e3a8a;
}

.form-group small {
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
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 1rem;
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

.login-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
  text-align: center;
  color: #666;
}

.login-footer a {
  color: #1e3a8a;
  text-decoration: none;
}

.login-footer a:hover {
  text-decoration: underline;
}

.hint {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.9rem;
}

.hint code {
  background: #e2e8f0;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
}
</style>
