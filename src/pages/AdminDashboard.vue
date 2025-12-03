<template>
  <div class="admin-dashboard">
    <h1>Dashboard Admin SMANDA VOTE</h1>
    <p>Loading admin dashboard...</p>

    <div v-if="loading">
      <p>Memuat data...</p>
    </div>

    <div v-else>
      <div class="admin-info">
        <h2>Selamat datang, {{ adminUser?.nama_lengkap }}</h2>
        <p>Role: {{ adminUser?.peran }}</p>
        <button @click="handleLogout">Logout</button>
      </div>

      <div class="dashboard-sections">
        <router-link to="/#/" class="section-card">
          <h3>🏠 Kembali ke Home</h3>
        </router-link>

        <div class="section-card" @click="testConnection">
          <h3>🔗 Test Database</h3>
          <p>Test koneksi ke Supabase</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const loading = ref(true)
const adminUser = ref(null)

onMounted(async () => {
  // Cek session admin
  const adminSession = localStorage.getItem('smanda_admin')
  if (!adminSession) {
    router.push('/#/admin-login')
    return
  }

  try {
    adminUser.value = JSON.parse(adminSession).user
  } catch (error) {
    console.error('Error parsing admin session:', error)
    router.push('/#/admin-login')
  } finally {
    loading.value = false
  }
})

const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('pengguna')
      .select('count', { count: 'exact', head: true })

    if (error) throw error
    alert(`✅ Koneksi berhasil! Total users: ${data}`)
  } catch (error) {
    alert(`❌ Error: ${error.message}`)
  }
}

const handleLogout = () => {
  localStorage.removeItem('smanda_admin')
  localStorage.removeItem('smanda_user')
  localStorage.removeItem('smanda_session')
  router.push('/#/')
}
</script>

<style scoped>
.admin-dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-info {
  background: #f0f7ff;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  border-left: 4px solid #1e3a8a;
}

.dashboard-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.section-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
}

.section-card:hover {
  border-color: #1e3a8a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.1);
}

.section-card h3 {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
}

.section-card p {
  color: #666;
  font-size: 0.9rem;
}
</style>
