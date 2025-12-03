<template>
  <div id="app">
    <!-- Navigation Header -->
    <nav class="app-nav">
      <div class="nav-container">
        <!-- Logo/Brand -->
        <div class="nav-brand">
          <router-link to="/#/" class="brand-link"> 🗳️ SMANDA VOTE </router-link>
        </div>

        <!-- Navigation Links -->
        <div class="nav-links">
          <router-link to="/#/" class="nav-link">Home</router-link>
          <router-link to="/#/test" class="nav-link">Test</router-link>
          <router-link to="/#/login-calon" class="nav-link">Login Calon</router-link>
          <router-link to="/#/scan" class="nav-link">Scan QR</router-link>
          <router-link to="/#/live-results" class="nav-link">Hasil</router-link>
          <router-link to="/#/admin-login" class="nav-link admin-link">Admin</router-link>

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

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-container">
        <p>Sistem Voting Online SMAN 2 Bandar Lampung © 2025 - Pemilihan Waka 2025/2026</p>
        <div class="footer-links">
          <router-link to="/#/admin-login" class="footer-link">Panel Admin</router-link>
          <span class="separator">•</span>
          <a href="https://sman2.sch.id" target="_blank" class="footer-link">Website SMANDA</a>
          <span class="separator">•</span>
          <router-link to="/#/test" class="footer-link">Test Koneksi</router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Auto-redirect jika URL tanpa hash (untuk handle Vercel 404)
const fixHashRouting = () => {
  const currentPath = window.location.pathname
  const hasHash = window.location.hash

  // Jika ada path selain root dan tidak ada hash, redirect ke hash mode
  if (currentPath !== '/' && !hasHash) {
    const newUrl = `/#${currentPath}${window.location.search}`
    window.location.replace(newUrl)
    return true
  }

  return false
}

onMounted(() => {
  // Check auth saat app mount
  authStore.checkAuth()

  // Fix routing jika perlu
  if (fixHashRouting()) {
    console.log('Fixed routing to hash mode')
  }
})

const handleLogout = () => {
  authStore.logout()
  // Redirect ke home dengan hash
  window.location.href = '/#/'
}
</script>

<style scoped>
/* Navigation Styles */
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

.nav-brand .brand-link:hover {
  opacity: 0.9;
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
  position: relative;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: white;
  border-radius: 2px;
}

.admin-link {
  background: rgba(220, 38, 38, 0.2);
  border: 1px solid rgba(220, 38, 38, 0.3);
}

.admin-link:hover {
  background: rgba(220, 38, 38, 0.3);
}

/* User Section */
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
  transition: background 0.3s;
}

.logout-btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

/* Main Content */
.app-main {
  min-height: calc(100vh - 140px);
  padding: 2rem 1rem;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

/* Footer */
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

.footer-container p {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.footer-link {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.3s;
}

.footer-link:hover {
  color: white;
  text-decoration: underline;
}

.separator {
  color: #475569;
}

/* Responsive Design */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }

  .nav-link {
    padding: 0.25rem 0.5rem;
    font-size: 0.9rem;
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

  .footer-links {
    flex-direction: column;
    gap: 0.5rem;
  }

  .separator {
    display: none;
  }
}

/* Animation for page transitions */
.router-view-enter-active,
.router-view-leave-active {
  transition: opacity 0.3s ease;
}

.router-view-enter-from,
.router-view-leave-to {
  opacity: 0;
}
</style>

<!-- Auto-redirect script untuk handle langsung dari URL -->
<script>
// Script untuk handle direct URL access (tanpa hash)
if (window.location.pathname !== '/' && !window.location.hash) {
  // Redirect ke hash mode
  const newPath = window.location.pathname + window.location.search
  window.location.href = `/#${newPath}`
}
</script>
