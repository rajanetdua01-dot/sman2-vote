<template>
  <div id="app">
    <nav style="background: #1e3a8a; color: white; padding: 1rem">
      <div
        style="
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        "
      >
        <div>
          <router-link
            to="/"
            style="color: white; text-decoration: none; font-weight: bold; font-size: 1.2rem"
          >
            🗳️ SMANDA VOTE
          </router-link>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center">
          <router-link to="/" style="color: white; text-decoration: none">Home</router-link>
          <router-link to="/test" style="color: white; text-decoration: none">Test</router-link>
          <router-link to="/login-calon" style="color: white; text-decoration: none"
            >Login Calon</router-link
          >
          <router-link to="/scan" style="color: white; text-decoration: none">Scan QR</router-link>
          <router-link to="/live-results" style="color: white; text-decoration: none"
            >Hasil</router-link
          >

          <!-- User info kalo udah login -->
          <span
            v-if="authStore.isLoggedIn"
            style="
              margin-left: 1rem;
              padding: 0.25rem 0.5rem;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 4px;
            "
          >
            {{ authStore.userName }}
          </span>
          <button
            v-if="authStore.isLoggedIn"
            @click="handleLogout"
            style="
              background: #dc2626;
              color: white;
              border: none;
              padding: 0.25rem 0.75rem;
              border-radius: 4px;
              cursor: pointer;
            "
          >
            Logout
          </button>
        </div>
      </div>
    </nav>

    <main style="min-height: calc(100vh - 140px)">
      <router-view />
    </main>

    <footer style="background: #f1f1f1; padding: 1rem; text-align: center; margin-top: 3rem">
      <p>Sistem Voting Online SMAN 2 Bandar Lampung © 2025 - Pemilihan Waka 2025/2026</p>
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

const handleLogout = () => {
  authStore.logout()
  window.location.href = '/'
}
</script>
