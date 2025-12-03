<template>
  <div v-if="!hasError">
    <!-- Simple Navigation -->
    <nav style="background: #1e3a8a; padding: 1rem; color: white">
      <a href="/#/" style="color: white; margin-right: 1rem">Home</a>
      <a href="/#/test" style="color: white; margin-right: 1rem">Test</a>
      <a href="/#/login-calon" style="color: white; margin-right: 1rem">Calon</a>
      <a href="/#/admin-login" style="color: white; margin-right: 1rem">Admin</a>
      <a href="/#/scan" style="color: white; margin-right: 1rem">Scan</a>

      <!-- Logout button jika logged in -->
      <span v-if="authStore.isLoggedIn" style="margin-left: auto">
        {{ authStore.userName }}
        <button
          @click="handleLogout"
          style="
            margin-left: 0.5rem;
            background: #dc2626;
            color: white;
            border: none;
            padding: 0.25rem 0.5rem;
            border-radius: 3px;
          "
        >
          Logout
        </button>
      </span>
    </nav>

    <!-- Main Content -->
    <main style="padding: 2rem; min-height: 70vh">
      <router-view v-if="routerReady" />
      <div v-else>Loading router...</div>
    </main>

    <!-- Footer -->
    <footer style="background: #f1f5f9; padding: 1rem; text-align: center">
      <p>SMANDA VOTE © 2025</p>
    </footer>
  </div>

  <div v-else style="padding: 2rem; color: red">
    <h2>Application Error</h2>
    <button @click="resetError">Reset App</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const hasError = ref(false)
const routerReady = ref(false)

onMounted(() => {
  routerReady.value = true
  authStore.checkAuth() // Check auth saat app mount

  // Error handling
  window.addEventListener('error', (e) => {
    console.error('Global error:', e)
    hasError.value = true
  })
})

const handleLogout = () => {
  authStore.logout() // Pakai logout dari store
}

const resetError = () => {
  hasError.value = false
  location.reload()
}
</script>
