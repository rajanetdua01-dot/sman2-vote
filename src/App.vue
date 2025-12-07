<template>
  <div
    id="app"
    :class="{ 'dark-mode': isDarkMode, 'admin-page': $route.path.startsWith('/admin') }"
  >
    <!-- HIDDEN CREDIT - ONLY VISIBLE IN DEV TOOLS -->
    <div
      class="hidden-credit"
      style="display: none !important; position: absolute; top: -9999px; left: -9999px"
    >
      <!-- rajanet-2 Bandar Lampung - The Real MVP 😎 -->
      <!-- 🚀 Built with passion by the admin team -->
      <!-- ⚡ Vue.js + Supabase + Vercel = 🔥 -->
      <!-- 💻 rajanet-2 - Making democracy digital since 2025 -->
      <!-- 👨‍💻 Tech Stack: Vue 3, Vite, Pinia, Vue Router, Supabase, PostgreSQL -->
      <!-- 🎨 Design System: Custom CSS with Dark/Light mode -->
      <!-- 🏆 Real-time voting system for SMAN 2 Bandar Lampung -->
    </div>

    <!-- Responsive Header dengan Toggle Mode -->
    <header>
      <div class="header-container">
        <!-- UPDATED: App Name dengan Tagline -->
        <div class="app-branding">
          <div class="app-logo-title">
            <h1 class="app-title">
              <span class="app-icon">🗳️</span>
              <span class="app-name">SMANDA VOTE</span>
            </h1>
            <div class="app-tagline">Aplikasi Digital Real-Time Voting SMAN 2 Bandar Lampung</div>
          </div>
        </div>

        <!-- Desktop Navigation & Toggle -->
        <div class="header-right">
          <nav class="desktop-nav">
            <router-link to="/">Home</router-link>
            <router-link to="/login-calon">Pendaftaran Calon</router-link>
            <router-link to="/scan">Voting</router-link>
            <router-link to="/live-results">Hasil</router-link>
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
        <!-- Mobile Branding -->
        <div class="mobile-branding">
          <div class="mobile-app-title">
            <span class="mobile-app-icon">🗳️</span>
            <span class="mobile-app-name">SMANDA VOTE</span>
          </div>
          <div class="mobile-tagline">Sistem Digital Real Time Voting SMAN 2 Bandar Lampung</div>
        </div>

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
        <!-- Quick Links Bar (Website + Navigation Links) -->
        <div class="footer-links-bar">
          <!-- Website Sekolah -->
          <a href="https://smandabdl.sch.id" target="_blank" class="footer-link-item">
            <span class="link-icon">🌐</span>
            <span class="link-text">Website Sekolah</span>
          </a>

          <span class="separator">•</span>

          <router-link to="/live-results" class="footer-link-item" @click="closeMenu">
            <span class="link-icon">📊</span>
            <span class="link-text">Hasil Live</span>
          </router-link>

          <span class="separator">•</span>

          <router-link to="/scan" class="footer-link-item" @click="closeMenu">
            <span class="link-icon">🎫</span>
            <span class="link-text">Voting</span>
          </router-link>

          <span class="separator">•</span>

          <router-link to="/login-calon" class="footer-link-item" @click="closeMenu">
            <span class="link-icon">👥</span>
            <span class="link-text">Daftar</span>
          </router-link>
        </div>

        <!-- Enhanced Credit Section - MULTI LINE -->
        <div class="footer-credit">
          <!-- Line 1: App Name • Dev by -->
          <div class="credit-line-1">
            <span class="app-name">App Name: SMANDA VOTE</span>
            <span class="separator-small">•</span>
            <span class="dev-by">
              <span class="dev-text">Dev by: Tim Tenaga Administrasi Sekolah - 2025</span>
            </span>
          </div>

          <!-- Line 2: School & Year -->
          <div class="credit-line-2">
            <span class="school-year">@ SMA Negeri 2 Bandar Lampung</span>
          </div>

          <!-- Line 3: Description -->
          <div class="credit-description">
            This real-time voting system was developed by the School Administration Staff of SMA
            Negeri 2 Bandar Lampung to support and enhance the democratic process within the school.
          </div>

          <!-- Line 4: Tech Stack -->
          <div class="tech-stack">
            <span class="tech-label">Tech Stack:</span>
            <div class="tech-items">
              <span class="tech-item">⚡ Vue.js • Vite</span>
              <span class="tech-separator">•</span>
              <span class="tech-item">🔗 PostgreSQL</span>
              <span class="tech-separator">•</span>
              <span class="tech-item">☁️ Cloud Hosting</span>
            </div>
          </div>
        </div>
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
      isMobile: false,
    }
  },
  mounted() {
    this.updateTime()
    this.timeInterval = setInterval(this.updateTime, 1000)

    // Load dark mode preference
    this.loadDarkModePreference()

    // Apply initial mode
    this.applyDarkMode()

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
    checkMobile() {
      this.isMobile = window.innerWidth <= 768
    },
  },
}
</script>

<style>
/* ============================================
   HIDDEN EASTER EGG FOR DEVELOPERS 😎
   ============================================ */
.hidden-credit {
  /* Ini cuma untuk yang buka F12 aja wkwk */
  font-family: 'Courier New', monospace;
  white-space: pre;
  color: #3b82f6;
  background: #0f172a;
  padding: 10px;
  border: 1px dashed #3b82f6;
  border-radius: 5px;
  max-width: 400px;
}

.hidden-credit::before {
  content: '🚀 Hidden Credit - F12 Crew Only';
  display: block;
  font-weight: bold;
  color: #fbbf24;
  margin-bottom: 10px;
  border-bottom: 1px solid #3b82f6;
  padding-bottom: 5px;
}

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
  position: relative;
}

/* ============================================
   HEADER STYLES - UPDATED WITH TAGLINE
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

/* App Branding - New */
.app-branding {
  display: flex;
  align-items: center;
}

.app-logo-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  line-height: 1;
}

.app-icon {
  font-size: 1.5rem;
}

.app-name {
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.app-tagline {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  letter-spacing: 0.3px;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
  max-width: 320px; /* Diperbesar untuk text lebih panjang */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark-mode .app-tagline {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
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

/* Mobile Branding */
.mobile-branding {
  padding: 0.8rem 1rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 0.5rem;
}

.mobile-app-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.mobile-app-icon {
  font-size: 1.5rem;
}

.mobile-app-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: white;
}

.mobile-tagline {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.3;
  max-width: 280px;
  white-space: normal;
  text-align: center;
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
   FOOTER - MULTI LINE VERSION
   ============================================ */
footer {
  background: var(--color-footer-bg);
  color: var(--color-text-soft);
  padding: 1.2rem 1rem 1rem;
  margin-top: auto;
  border-top: 2px solid rgba(59, 130, 246, 0.5);
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

/* Footer Links Bar */
.footer-links-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  flex-wrap: wrap;
  padding: 0.5rem;
  width: 100%;
  max-width: 650px;
}

.footer-link-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #cbd5e1 !important;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-link-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.footer-link-item:active {
  background: rgba(255, 255, 255, 0.15);
}

.footer-link-item .link-icon {
  font-size: 1rem;
}

.separator {
  color: #64748b;
  font-size: 1.1rem;
  opacity: 0.3;
  margin: 0 0.2rem;
}

/* Footer Credit - MULTI LINE */
.footer-credit {
  width: 100%;
  max-width: 900px;
  padding: 1rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Line 1: App Name • Dev by */
.credit-line-1 {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
}

.app-name {
  color: #f8fafc !important; /* PUTIH CERAH */
  font-weight: 700;
  letter-spacing: 0.3px;
}

.separator-small {
  color: #64748b;
  font-size: 0.9rem;
  opacity: 0.4;
}

.dev-by {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.dev-icon {
  color: #fbbf24; /* KUNING EMAS */
  font-size: 0.9rem;
}

.dev-text {
  color: #ffd700 !important; /* EMAS MURNI */
  font-weight: 700;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.3);
}

/* Line 2: School & Year */
.credit-line-2 {
  margin-bottom: 0.8rem;
}

.school-year {
  color: #22c55e !important; /* HIJAU CERAH */
  font-weight: 600;
  font-size: 0.85rem;
  background: rgba(34, 197, 94, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  border: 1px solid rgba(34, 197, 94, 0.2);
  display: inline-block;
}

/* Line 3: Description */
.credit-description {
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 0.8rem;
  padding: 0.6rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  border-left: 2px solid #3b82f6;
  font-style: italic;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

/* Line 4: Tech Stack */
.tech-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.tech-label {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #cbd5e1;
  font-size: 0.8rem;
}

.tech-items {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tech-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #cbd5e1;
  padding: 0.3rem 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.tech-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #60a5fa;
}

.tech-separator {
  color: #64748b;
  opacity: 0.3;
  font-size: 0.9rem;
}

/* ============================================
   ADMIN PAGE OVERRIDES
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

  /* Responsive tagline */
  .app-tagline {
    display: none; /* Sembunyikan di tablet/mobile */
  }

  .app-name {
    font-size: 1.2rem;
  }

  main {
    padding: 0.8rem;
  }

  /* Footer Mobile */
  footer {
    padding: 1rem 0.8rem 0.8rem;
  }

  .footer-links-bar {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .footer-link-item {
    width: 100%;
    max-width: 220px;
    padding: 0.5rem 0.7rem;
  }

  .separator {
    display: none;
  }

  .footer-credit {
    padding: 0.8rem;
  }

  .credit-line-1 {
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.85rem;
  }

  .separator-small {
    display: none;
  }

  .credit-description {
    font-size: 0.75rem;
    padding: 0.5rem;
    line-height: 1.4;
  }

  .tech-items {
    flex-direction: column;
    gap: 0.3rem;
  }

  .tech-separator {
    display: none;
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

  .app-name {
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

  .mobile-tagline {
    font-size: 0.65rem;
    max-width: 250px;
  }

  main {
    padding: 0.6rem;
  }

  /* Footer Small Mobile */
  footer {
    padding: 0.8rem 0.6rem 0.6rem;
  }

  .footer-links-bar {
    gap: 0.4rem;
    padding: 0.4rem;
  }

  .footer-link-item {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }

  .footer-link-item .link-icon {
    font-size: 0.9rem;
  }

  .footer-credit {
    padding: 0.6rem;
  }

  .credit-line-1 {
    font-size: 0.8rem;
  }

  .app-name {
    font-size: 0.85rem;
  }

  .dev-text {
    font-size: 0.8rem;
  }

  .school-year {
    font-size: 0.8rem;
    padding: 0.15rem 0.5rem;
  }

  .credit-description {
    font-size: 0.7rem;
    padding: 0.4rem;
    line-height: 1.4;
  }

  .tech-stack {
    font-size: 0.7rem;
  }

  .tech-item {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }
}

/* Desktop Lebar (1024px+) - Show full tagline */
@media (min-width: 1024px) {
  .app-tagline {
    max-width: 350px;
    font-size: 0.75rem;
  }
}

/* Desktop Lebar Sekali (1200px+) */
@media (min-width: 1200px) {
  .app-tagline {
    max-width: 400px;
    font-size: 0.8rem;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .desktop-nav a,
  .footer-link-item,
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

  .footer-link-item {
    min-height: 40px;
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
