<template>
  <div
    id="app"
    :class="{ 'dark-mode': isDarkMode, 'admin-page': $route.path.startsWith('/admin') }"
  >
    <!-- Responsive Header dengan Toggle Mode -->
    <header>
      <div class="header-container">
        <h1>🗳️ SMANDA VOTE</h1>

        <!-- Desktop Navigation & Toggle -->
        <div class="header-right">
          <nav class="desktop-nav">
            <router-link to="/">Home</router-link>
            <router-link to="/login-calon">Pendaftaran Calon</router-link>
            <router-link to="/scan">Voting</router-link>
            <router-link to="/live-results">Hasil</router-link>
            <router-link to="/admin-login">Admin</router-link>
          </nav>

          <!-- Dark/Light Mode Toggle -->
          <div class="mode-toggle" @click="toggleDarkMode">
            <div class="toggle-slider" :class="{ dark: isDarkMode }">
              <span class="toggle-icon">🌙</span>
              <span class="toggle-icon">☀️</span>
              <div class="toggle-knob"></div>
            </div>
          </div>

          <!-- Mobile Menu Button -->
          <button class="menu-toggle" @click="toggleMenu" aria-label="Toggle menu">
            <span v-if="!menuOpen">☰</span>
            <span v-else>✕</span>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <nav class="mobile-nav" :class="{ show: menuOpen }">
        <router-link to="/" @click="closeMenu">🏠 Home</router-link>
        <router-link to="/login-calon" @click="closeMenu">👤 Daftar Calon</router-link>
        <router-link to="/scan" @click="closeMenu">🎫 Voting</router-link>
        <router-link to="/live-results" @click="closeMenu">📊 Hasil</router-link>
        <router-link to="/admin-login" @click="closeMenu">🔧 Admin</router-link>

        <!-- Mobile Mode Toggle -->
        <div class="mobile-mode-toggle" @click="toggleDarkMode">
          <span class="mode-icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
          <span class="mode-text">{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</span>
        </div>
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
          <router-link to="/live-results" class="footer-link" @click="closeMenu">
            <span class="link-icon">📊</span>
            <span class="link-text">Hasil Live</span>
          </router-link>
          <span class="separator">•</span>
          <router-link to="/scan" class="footer-link" @click="closeMenu">
            <span class="link-icon">🎫</span>
            <span class="link-text">Voting</span>
          </router-link>
          <span class="separator">•</span>
          <router-link to="/login-calon" class="footer-link" @click="closeMenu">
            <span class="link-icon">👥</span>
            <span class="link-text">Daftar</span>
          </router-link>
        </div>

        <!-- Copyright -->
        <p class="copyright">
          © 2025 Tenaga Administrasi SMAN 2 Bandar Lampung. All rights reserved.
        </p>
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
      isDarkMode: false,
    }
  },
  mounted() {
    this.updateTime()
    this.timeInterval = setInterval(this.updateTime, 1000)

    // Load dark mode preference
    this.loadDarkModePreference()

    // Apply initial mode
    this.applyDarkMode()
  },
  beforeUnmount() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval)
    }
  },
  methods: {
    updateTime() {
      const now = new Date()
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
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode
      this.saveDarkModePreference()
      this.applyDarkMode()
    },
    loadDarkModePreference() {
      const saved = localStorage.getItem('sman2-vote-darkmode')
      if (saved !== null) {
        this.isDarkMode = JSON.parse(saved)
      } else {
        // Default to system preference
        this.isDarkMode =
          window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      }
    },
    saveDarkModePreference() {
      localStorage.setItem('sman2-vote-darkmode', JSON.stringify(this.isDarkMode))
    },
    applyDarkMode() {
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      }
    },
  },
}
</script>

<style>
/* ============================================
   VARIABLES FOR LIGHT & DARK MODE
   ============================================ */
:root {
  /* Light Mode Colors */
  --color-bg: #ffffff;
  --color-bg-soft: #f8f9fa;
  --color-bg-mute: #f1f3f4;

  --color-text: #000000;
  --color-text-soft: #5f6368;
  --color-text-mute: #80868b;

  --color-border: #dadce0;
  --color-border-hover: #bdc1c6;

  --color-primary: #1e3a8a;
  --color-primary-light: #3b82f6;
  --color-secondary: #10b981;
  --color-accent: #f59e0b;
  --color-danger: #ef4444;

  --color-header-bg: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  --color-footer-bg: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.dark-mode {
  /* Dark Mode Colors */
  --color-bg: #0f172a;
  --color-bg-soft: #1e293b;
  --color-bg-mute: #334155;

  --color-text: #f1f5f9;
  --color-text-soft: #cbd5e1;
  --color-text-mute: #94a3b8;

  --color-border: #475569;
  --color-border-hover: #64748b;

  --color-primary: #3b82f6;
  --color-primary-light: #60a5fa;
  --color-secondary: #34d399;
  --color-accent: #fbbf24;
  --color-danger: #f87171;

  --color-header-bg: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  --color-footer-bg: linear-gradient(135deg, #0f172a 0%, #020617 100%);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
}

/* ============================================
   GLOBAL STYLES
   ============================================ */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

/* ============================================
   HEADER STYLES
   ============================================ */
header {
  background: var(--color-header-bg);
  color: white;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: var(--shadow-md);
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

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Logo */
header h1 {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
  color: white;
}

/* Mode Toggle */
.mode-toggle {
  cursor: pointer;
  user-select: none;
}

.toggle-slider {
  width: 60px;
  height: 30px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  transition: background 0.3s;
}

.toggle-slider.dark {
  background: rgba(0, 0, 0, 0.3);
}

.toggle-icon {
  font-size: 14px;
  z-index: 1;
}

.toggle-knob {
  position: absolute;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  left: 3px;
  transition: transform 0.3s;
}

.toggle-slider.dark .toggle-knob {
  transform: translateX(30px);
}

.mobile-mode-toggle {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  margin-top: 0.5rem;
  cursor: pointer;
}

.mode-icon {
  font-size: 1.2rem;
}

.mode-text {
  color: white;
  font-weight: 500;
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
  color: white !important;
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
  box-shadow: var(--shadow-lg);
  animation: slideDown 0.3s ease;
}

.dark-mode .mobile-nav {
  background: rgba(15, 23, 42, 0.98);
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
  color: white !important;
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

/* ============================================
   MAIN CONTENT
   ============================================ */
main {
  flex: 1;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  color: var(--color-text);
  background: var(--color-bg);
}

/* ============================================
   FOOTER
   ============================================ */
footer {
  background: var(--color-footer-bg);
  color: var(--color-text-soft);
  padding: 1.2rem 1rem;
  margin-top: auto;
  border-top: 3px solid var(--color-primary);
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
  color: #93c5fd !important;
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
  color: #cbd5e1 !important;
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

/* ============================================
   ADMIN PAGE OVERRIDES (ALWAYS LIGHT MODE)
   ============================================ */
.admin-page {
  /* Admin pages selalu light mode */
  --color-bg: #ffffff !important;
  --color-bg-soft: #f8f9fa !important;
  --color-bg-mute: #f1f3f4 !important;

  --color-text: #000000 !important;
  --color-text-soft: #5f6368 !important;
  --color-text-mute: #80868b !important;

  --color-border: #dadce0 !important;
  --color-border-hover: #bdc1c6 !important;
}

/* Force admin pages to use light colors */
.admin-page main * {
  color: #000000 !important;
}

.admin-page main input,
.admin-page main select,
.admin-page main textarea,
.admin-page main table,
.admin-page main td,
.admin-page main th,
.admin-page main p,
.admin-page main span,
.admin-page main div:not(.btn):not(button):not(.menu-toggle):not(.footer-link):not(.school-link) {
  color: #000000 !important;
}

.admin-page main a {
  color: #000000 !important;
}

.admin-page main button,
.admin-page main .btn {
  color: initial !important;
}

.admin-page main {
  background: #ffffff !important;
}

.admin-page .simple-peserta,
.admin-page .simple-kandidat,
.admin-page .admin-dashboard {
  background: #ffffff !important;
}

.admin-page table th,
.admin-page table td {
  color: #000000 !important;
}

.admin-page input,
.admin-page select,
.admin-page textarea {
  color: #000000 !important;
}

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */

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

  .mode-toggle {
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

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .desktop-nav a,
  .footer-link,
  .school-link,
  .mobile-mode-toggle {
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-toggle,
  .mode-toggle {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* Print styles */
@media print {
  header,
  footer,
  .menu-toggle,
  .mode-toggle {
    display: none !important;
  }

  main {
    padding: 0;
    color: #000000 !important;
  }

  .admin-page main * {
    color: #000000 !important;
  }
}
</style>
