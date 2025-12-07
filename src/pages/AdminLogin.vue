<template>
  <div class="login-page">
    <div class="login-card">
      <h1>🔐 Login Admin</h1>

      <form @submit.prevent="login">
        <div class="input-group">
          <label>Email</label>
          <input type="email" v-model="email" placeholder="admin@example.com" required />
        </div>

        <div class="input-group">
          <label>Password</label>
          <div class="password-wrap">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="********"
              required
            />
            <button type="button" @click="showPassword = !showPassword" class="eye-btn">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <button type="submit" :disabled="loading" class="login-btn">
          {{ loading ? 'Loading...' : 'Login Admin' }}
        </button>

        <div v-if="error" class="error-box">{{ error }}</div>
      </form>

      <div class="demo-info" v-if="isDev"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const isDev = import.meta.env.DEV

const login = async () => {
  loading.value = true
  error.value = ''

  try {
    // 1. LOGIN KE SUPABASE
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (loginError) throw loginError

    console.log('✅ Login berhasil:', data.user.email)

    // 2. LANGSUNG KE ADMIN DASHBOARD
    router.push('/admin')
  } catch (err) {
    console.error('❌ Login gagal:', err)
    error.value = err.message || 'Login gagal. Cek email/password.'
  } finally {
    loading.value = false
  }
}

// Auto redirect kalo udah login
onMounted(async () => {
  const { data } = await supabase.auth.getSession()

  if (data.session) {
    console.log('📱 Session ditemukan, redirect ke admin')
    router.push('/admin')
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a8a, #1e40af);
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h1 {
  color: #1e3a8a;
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.8rem;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.input-group input:focus {
  outline: none;
  border-color: #1e3a8a;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.password-wrap {
  position: relative;
}

.eye-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: #1e3a8a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  transition: 0.3s;
}

.login-btn:hover:not(:disabled) {
  background: #1e40af;
}

.login-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.error-box {
  margin-top: 15px;
  padding: 12px;
  background: #fee;
  color: #c00;
  border-radius: 6px;
  text-align: center;
  border-left: 4px solid #c00;
}

.demo-info {
  margin-top: 20px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  text-align: center;
  font-size: 0.9rem;
  color: #4b5563;
}

@media (max-width: 500px) {
  .login-card {
    padding: 30px 20px;
  }

  h1 {
    font-size: 1.5rem;
  }
}
</style>
