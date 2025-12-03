<template>
  <div id="app">
    <!-- Navigation Header -->
    <nav class="app-nav">
      <div class="nav-container">
        <!-- Logo/Brand -->
        <div class="nav-brand">
          <a href="/#/" class="brand-link"> 🗳️ SMANDA VOTE </a>
        </div>

        <!-- Navigation Links (PAKAI <a> tag bukan router-link) -->
        <div class="nav-links">
          <a href="/#/" class="nav-link">Home</a>
          <a href="/#/test" class="nav-link">Test</a>
          <a href="/#/login-calon" class="nav-link">Login Calon</a>
          <a href="/#/scan" class="nav-link">Scan QR</a>
          <a href="/#/live-results" class="nav-link">Hasil</a>
          <a href="/#/admin-login" class="nav-link admin-link">Admin</a>

          <!-- User Info & Logout jika sudah login -->
          <div v-if="authStore.isLoggedIn" class="user-section">
            <span class="user-name">{{ authStore.userName }}</span>
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="app-main">
      <router-view />
    </main>

    <!-- Footer (PAKAI <a> tag) -->
    <footer class="app-footer">
      <div class="footer-container">
        <p>Sistem Voting Online SMAN 2 Bandar Lampung © 2025 - Pemilihan Waka 2025/2026</p>
        <div class="footer-links">
          <a href="/#/admin-login" class="footer-link">Panel Admin</a>
          <span class="separator">•</span>
          <a href="https://sman2.sch.id" target="_blank" class="footer-link">Website SMANDA</a>
          <span class="separator">•</span>
          <a href="/#/test" class="footer-link">Test Koneksi</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Auto-redirect jika URL tanpa hash
const fixHashRouting = () => {
  const currentPath = window.location.pathname
  const hasHash = window.location.hash

  if (currentPath !== '/' && !hasHash) {
    const newUrl = `/#${currentPath}${window.location.search}`
    window.location.replace(newUrl)
    return true
  }
  return false
}

onMounted(() => {
  authStore.checkAuth()

  if (fixHashRouting()) {
    console.log('Fixed routing to hash mode')
  }
})

const handleLogout = () => {
  authStore.logout()
  window.location.href = '/#/'
}
</script>

<style scoped>
/* Styles tetap sama seperti sebelumnya */
.app-nav {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}

.nav-brand .brand-link {
  color: white;
  text-decoration: none;
  font-weight: bold;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

.admin-link {
  background: rgba(220, 38, 38, 0.2);
  border: 1px solid rgba(220, 38, 38, 0.3);
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.user-name {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.logout-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.app-main {
  min-height: calc(100vh - 140px);
  padding: 2rem 1rem;
  background: #f8fafc;
}

.app-footer {
  background: #1e293b;
  color: #cbd5e1;
  padding: 2rem 0;
  margin-top: 3rem;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  padding: 0 1rem;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.footer-link {
  color: #94a3b8;
  text-decoration: none;
}

.separator {
  color: #475569;
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }

  .user-section {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 0.5rem;
    width: 100%;
    justify-content: center;
  }
}
</style>

<!-- Script untuk handle semua link clicks -->
<script>
document.addEventListener('DOMContentLoaded', function () {
  // Convert semua internal links ke hash mode
  document.querySelectorAll('a[href^="/"]').forEach((link) => {
    const href = link.getAttribute('href')
    if (href && !href.startsWith('/#') && !href.includes('://')) {
      link.setAttribute('href', '/#' + href.replace(/^\//, ''))
    }
  })

  // Handle click untuk semua links
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a')
    if (link && link.href && link.href.includes(window.location.hostname)) {
      const url = new URL(link.href)
      if (url.hash) {
        e.preventDefault()
        window.location.hash = url.hash
      }
    }
  })
})
</script>
