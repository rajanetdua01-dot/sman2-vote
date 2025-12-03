<template>
  <div id="app">
    <!-- Simple Navigation dengan <a> tags -->
    <nav style="background: #1e3a8a; padding: 1rem; color: white">
      <div style="max-width: 1200px; margin: 0 auto; display: flex; gap: 1rem">
        <a href="/#/" style="color: white; text-decoration: none; font-weight: bold">🏠 Home</a>
        <a href="/#/test" style="color: white; text-decoration: none">🔧 Test</a>
        <a href="/#/login-calon" style="color: white; text-decoration: none">👤 Login Calon</a>
        <a href="/#/admin-login" style="color: white; text-decoration: none">⚙️ Admin</a>
        <a href="/#/scan" style="color: white; text-decoration: none">📱 Scan QR</a>
        <a href="/#/live-results" style="color: white; text-decoration: none">📊 Hasil</a>
      </div>
    </nav>

    <!-- Main Content -->
    <main style="min-height: 80vh; padding: 2rem">
      <router-view />
    </main>

    <!-- Footer -->
    <footer style="background: #f1f5f9; padding: 1rem; text-align: center">
      <p>SMANDA VOTE © 2025 - Pemilihan Waka 2025/2026</p>
    </footer>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  authStore.checkAuth()
})
</script>
