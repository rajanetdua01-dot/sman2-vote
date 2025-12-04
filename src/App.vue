<template>
  <div id="app">
    <!-- Responsive Header -->
    <header>
      <div class="header-container">
        <h1>🗳️ SMANDA VOTE</h1>

        <!-- Mobile Menu Button -->
        <button class="menu-toggle" @click="toggleMenu" aria-label="Toggle menu">
          <span v-if="!menuOpen">☰</span>
          <span v-else>✕</span>
        </button>

        <!-- Desktop Navigation -->
        <nav class="desktop-nav">
          <a href="/">Home</a>
          <a href="/login-calon">Pendaftaran Calon</a>
          <a href="/scan">Voting</a>
          <a href="/live-results">Hasil</a>
          <a href="/admin-login">Admin</a>
        </nav>
      </div>

      <!-- Mobile Navigation -->
      <nav class="mobile-nav" :class="{ show: menuOpen }">
        <a href="/" @click="closeMenu">🏠 Home</a>
        <a href="/login-calon" @click="closeMenu">👤 Daftar Calon</a>
        <a href="/scan" @click="closeMenu">🎫 Voting</a>
        <a href="/live-results" @click="closeMenu">📊 Hasil</a>
        <a href="/admin-login" @click="closeMenu">🔧 Admin</a>
      </nav>
    </header>

    <!-- Main Content -->
    <main>
      <router-view />
    </main>

    <!-- Footer dengan Jam WIB & Links -->
    <footer>
      <div class="footer-content">
        <!-- Web Sekolah -->
        <div class="school-website">
          <a href="https://smandabdl.sch.id" target="_blank" class="school-link">
            <span class="school-icon">🌐</span>
            <span class="school-text">Website Sekolah</span>
          </a>
        </div>

        <!-- Jam WIB Real-time -->
        <div class="time-widget">
          <span class="time-icon">🕐</span>
          <span class="time-value">{{ currentTime }}</span>
        </div>

        <!-- Quick Links -->
        <div class="footer-links">
          <a href="/live-results" class="footer-link">
            <span class="link-icon">📊</span>
            <span class="link-text">Hasil Live</span>
          </a>
          <span class="separator">•</span>
          <a href="/scan" class="footer-link">
            <span class="link-icon">🎫</span>
            <span class="link-text">Voting</span>
          </a>
          <span class="separator">•</span>
          <a href="/login-calon" class="footer-link">
            <span class="link-icon">👥</span>
            <span class="link-text">Daftar</span>
          </a>
        </div>

        <!-- Copyright -->
        <p class="copyright">© 2025 SMAN 2 Bandar Lampung</p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      currentTime: '',
      menuOpen: false,
      isMobile: false,
    }
  },
  mounted() {
    this.updateTime()
    this.timeInterval = setInterval(this.updateTime, 1000)

    // Check if mobile
    this.checkMobile()
    window.addEventListener('resize', this.checkMobile)
  },
  beforeUnmount() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval)
    }
    window.removeEventListener('resize', this.checkMobile)
  },
  methods: {
    updateTime() {
      const now = new Date()

      // Format sederhana untuk mobile
      this.currentTime = now.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    },
    toggleMenu() {
      this.menuOpen = !this.menuOpen
    },
    closeMenu() {
      this.menuOpen = false
    },
    checkMobile() {
      this.isMobile = window.innerWidth <= 768
    },
  },
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f8fafc;
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* HEADER */
header {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Logo */
header h1 {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

/* Menu Toggle (Mobile) */
.menu-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  display: none;
  transition: background 0.2s;
}

.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Desktop Navigation */
.desktop-nav {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.desktop-nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
}

.desktop-nav a:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* Mobile Navigation */
.mobile-nav {
  display: none;
  flex-direction: column;
  background: rgba(30, 58, 138, 0.98);
  backdrop-filter: blur(10px);
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s ease;
}

.mobile-nav.show {
  display: flex;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mobile-nav a {
  color: white;
  text-decoration: none;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.2s;
}

.mobile-nav a:active {
  background: rgba(255, 255, 255, 0.2);
}

/* MAIN CONTENT */
main {
  flex: 1;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* FOOTER */
footer {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #cbd5e1;
  padding: 1.2rem 1rem;
  margin-top: auto;
  border-top: 3px solid #1e3a8a;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

/* School Website */
.school-website {
  width: 100%;
}

.school-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #93c5fd;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.7rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.school-link:active {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(0.98);
}

.school-icon {
  font-size: 1.2rem;
}

/* Time Widget */
.time-widget {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 0.7rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-family: 'SF Mono', 'Courier New', monospace;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
}

.time-icon {
  font-size: 1.1rem;
}

.time-value {
  color: #f1f5f9;
}

/* Footer Links */
.footer-links {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  margin: 0.3rem 0;
  flex-wrap: wrap;
  justify-content: center;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.03);
  min-width: 100px;
  justify-content: center;
}

.footer-link:active {
  background: rgba(255, 255, 255, 0.08);
  transform: scale(0.98);
}

.link-icon {
  font-size: 1.1rem;
}

.link-text {
  font-weight: 500;
}

.separator {
  color: #64748b;
  font-size: 1.1rem;
  opacity: 0.5;
}

/* Copyright */
.copyright {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 0.3rem;
  color: #94a3b8;
  text-align: center;
  line-height: 1.4;
}

/* RESPONSIVE DESIGN */

/* Tablet (768px ke bawah) */
@media (max-width: 768px) {
  body {
    font-size: 15px;
  }

  .menu-toggle {
    display: block;
  }

  .desktop-nav {
    display: none;
  }

  .header-container {
    padding: 0.7rem 1rem;
  }

  header h1 {
    font-size: 1.2rem;
  }

  main {
    padding: 0.8rem;
  }

  .footer-links {
    gap: 0.5rem;
  }

  .footer-link {
    min-width: 90px;
    padding: 0.6rem;
    font-size: 0.85rem;
  }

  .separator {
    font-size: 1rem;
  }
}

/* HP Kecil (480px ke bawah) */
@media (max-width: 480px) {
  body {
    font-size: 14px;
  }

  .header-container {
    padding: 0.6rem 0.8rem;
  }

  header h1 {
    font-size: 1.1rem;
  }

  .menu-toggle {
    font-size: 1.3rem;
    padding: 0.4rem;
  }

  .mobile-nav a {
    padding: 0.7rem 0.9rem;
    font-size: 0.95rem;
  }

  main {
    padding: 0.6rem;
  }

  footer {
    padding: 1rem 0.8rem;
  }

  .school-link {
    padding: 0.6rem;
    font-size: 0.9rem;
  }

  .time-widget {
    padding: 0.6rem 0.8rem;
    font-size: 0.9rem;
    flex-direction: row;
    gap: 0.4rem;
  }

  .time-value {
    font-size: 0.9rem;
  }

  .footer-links {
    flex-direction: row;
    gap: 0.5rem;
  }

  .footer-link {
    flex-direction: column;
    gap: 0.3rem;
    min-width: 80px;
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .link-icon {
    font-size: 1.2rem;
  }

  .link-text {
    font-size: 0.75rem;
  }

  .separator {
    display: none;
  }

  .copyright {
    font-size: 0.75rem;
    padding: 0 0.5rem;
  }
}

/* HP Sangat Kecil (360px ke bawah) */
@media (max-width: 360px) {
  header h1 {
    font-size: 1rem;
  }

  .mobile-nav a {
    padding: 0.6rem 0.8rem;
    font-size: 0.9rem;
  }

  .school-link {
    font-size: 0.85rem;
    padding: 0.5rem;
  }

  .time-widget {
    font-size: 0.85rem;
    padding: 0.5rem 0.7rem;
  }

  .footer-link {
    min-width: 70px;
    padding: 0.4rem;
  }

  .link-icon {
    font-size: 1rem;
  }

  .link-text {
    font-size: 0.7rem;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .desktop-nav a,
  .footer-link,
  .school-link {
    min-height: 44px; /* Minimum touch target size */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-toggle {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  body {
    background: #0f172a;
    color: #f1f5f9;
  }
}

/* Print styles */
@media print {
  header,
  footer,
  .menu-toggle {
    display: none !important;
  }

  main {
    padding: 0;
  }
}
</style>
