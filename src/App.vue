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
        <!-- App Name dengan Tagline -->
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
            <router-link to="/live-results">Hasil Live</router-link>
            <!-- ⭐ UPDATED -->
          </nav>

          <!-- Dark/Light Mode Toggle -->
          <div class="mode-toggle" @click="toggleDarkMode">
            <div class="toggle-slider" :class="{ dark: isDarkMode }">
              <span class="toggle-icon">🌙</span>
              <span class="toggle-icon">☀️</span>
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main :class="{ 'has-bottom-nav': isMobile }">
      <router-view />
    </main>

    <!-- ============================================
         BOTTOM NAVBAR UNTUK HP (MOBILE ONLY)
         ============================================ -->
    <nav v-if="isMobile" class="bottom-navbar">
      <router-link to="/" class="nav-item" @click="closeMenu">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">Home</span>
      </router-link>

      <router-link to="/login-calon" class="nav-item" @click="closeMenu">
        <span class="nav-icon">👤</span>
        <span class="nav-label">Daftar</span>
      </router-link>

      <router-link to="/scan" class="nav-item nav-scan" @click="closeMenu">
        <span class="nav-icon-scan">🎫</span>
        <span class="nav-label">Voting</span>
      </router-link>

      <!-- ⭐ TAMBAH LIVE RESULTS UNTUK HP -->
      <router-link to="/live-results-hp" class="nav-item" @click="closeMenu">
        <span class="nav-icon">📊</span>
        <span class="nav-label">Hasil</span>
      </router-link>

      <div class="nav-item" @click="toggleDarkMode">
        <span class="nav-icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
        <span class="nav-label">{{ isDarkMode ? 'Light' : 'Dark' }}</span>
      </div>
    </nav>

    <!-- Footer -->
    <footer :class="{ 'has-bottom-nav': isMobile }">
      <div class="footer-content">
        <!-- Quick Links Bar -->

        <!-- Credit Section -->
        <div class="footer-credit">
          <div class="credit-line-1">
            <span class="app-name">App Name: SMANDA VOTE</span>
            <span class="separator-small">•</span>
            <span class="dev-by">
              <span class="dev-text">Dev by: Tim Tenaga Administrasi Sekolah - 2025</span>
            </span>
          </div>

          <div class="credit-line-2">
            <span class="school-year">SMAN 2 Bandar Lampung - Pemilihan Waka Tahun 2025</span>
          </div>

          <div class="credit-description">
            This real-time voting system was developed by the School Administration Staff of SMA
            Negeri 2 Bandar Lampung to support and enhance the democratic process within the school.
          </div>

          <div class="footer-school-link">
            <a href="https://smandabdl.sch.id" target="_blank" class="footer-link-item">
              <span class="link-icon">🌐</span>
              <span class="link-text">https://www.smandabdl.sch.id</span>
            </a>
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
   VARIABLES FOR LIGHT & DARK MODE
   ============================================ */
:root {
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
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  position: relative;
  padding-bottom: 70px; /* Space for bottom navbar */
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
  max-width: 320px;
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

main.has-bottom-nav {
  padding-bottom: 5rem; /* Extra space for bottom navbar */
}

/* ============================================
   BOTTOM NAVBAR FOR MOBILE - SEMUA MENU SAMA
   ============================================ */
.bottom-navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-bg-soft);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.5rem 0;
  z-index: 999;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  height: 70px;
}

.dark-mode .bottom-navbar {
  background: rgba(30, 41, 59, 0.95);
  border-top-color: var(--color-border);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
}

/* ⭐ NORMAL STATE - SEMUA MENU BIRU TUA */
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #1e3a8a !important; /* ⭐ BIRU TUA DI LIGHT MODE */
  padding: 0.5rem 0.3rem;
  flex: 1;
  min-height: 60px;
  transition: all 0.2s;
  border-radius: 8px;
  margin: 0 0.2rem;
  cursor: pointer;
  position: relative;
  background: rgba(30, 58, 138, 0.05); /* ⭐ BIRU TUA TRANSPARAN 5% */
}

.dark-mode .nav-item {
  color: #3b82f6 !important; /* ⭐ BIRU CERAH DI DARK MODE */
  background: rgba(59, 130, 246, 0.05); /* ⭐ BIRU CERAH TRANSPARAN 5% */
}

/* ⭐ ACTIVE STATE - SEMUA MENU BIRU TERANG */
.nav-item.router-link-active {
  color: #3b82f6 !important; /* ⭐ BIRU TERANG */
  background: rgba(59, 130, 246, 0.15); /* ⭐ BIRU TERANG TRANSPARAN 15% */
  font-weight: 600;
}

.nav-item.router-link-active::after {
  content: '';
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: #3b82f6; /* ⭐ DOT BIRU TERANG */
  border-radius: 50%;
}

.dark-mode .nav-item.router-link-active {
  color: #60a5fa !important; /* ⭐ BIRU LEBIH TERANG DI DARK MODE */
  background: rgba(96, 165, 250, 0.15);
}

.dark-mode .nav-item.router-link-active::after {
  background: #60a5fa; /* ⭐ DOT BIRU LEBIH TERANG DI DARK MODE */
}

/* ⭐ HOVER STATE */
.nav-item:hover {
  background: rgba(30, 58, 138, 0.1); /* ⭐ BIRU TUA TRANSPARAN 10% */
  transform: translateY(-1px);
}

.dark-mode .nav-item:hover {
  background: rgba(59, 130, 246, 0.1); /* ⭐ BIRU CERAH TRANSPARAN 10% */
}

/* ⭐ NAV ICONS - SEMUA SAMA */
.nav-icon {
  font-size: 1.5rem;
  margin-bottom: 0.2rem;
}

.nav-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
}

/* ============================================
   FOOTER
   ============================================ */
footer {
  background: var(--color-footer-bg);
  color: var(--color-text-soft);
  padding: 1.2rem 1rem 1rem;
  margin-top: auto;
  border-top: 2px solid rgba(59, 130, 246, 0.5);
}

footer.has-bottom-nav {
  padding-bottom: 5rem; /* Space for bottom navbar */
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

.footer-link-item .link-icon {
  font-size: 1rem;
}

.separator {
  color: #64748b;
  font-size: 1.1rem;
  opacity: 0.3;
  margin: 0 0.2rem;
}

/* Footer Credit */
.footer-credit {
  width: 100%;
  max-width: 900px;
  padding: 1rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

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
  color: #f8fafc !important;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.separator-small {
  color: #64748b;
  font-size: 0.9rem;
  opacity: 0.4;
}

.dev-text {
  color: #ffd700 !important;
  font-weight: 700;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.3);
}

.credit-line-2 {
  margin-bottom: 0.8rem;
}

.school-year {
  color: #22c55e !important;
  font-weight: 600;
  font-size: 0.85rem;
  background: rgba(34, 197, 94, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  border: 1px solid rgba(34, 197, 94, 0.2);
  display: inline-block;
}

.credit-description {
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.5;
  padding: 0.6rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  border-left: 2px solid #3b82f6;
  font-style: italic;
  max-width: 700px;
  margin: 0 auto;
}

.footer-school-link {
  margin-top: 1rem;
}

/* ============================================
   ADMIN PAGE OVERRIDES
   ============================================ */
.admin-page {
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

.admin-page main {
  background: #ffffff !important;
}

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */

/* Tablet & Mobile (768px ke bawah) */
@media (max-width: 768px) {
  body {
    font-size: 15px;
  }

  .desktop-nav {
    display: none;
  }

  .mode-toggle {
    display: none;
  }

  .app-tagline {
    display: none;
  }

  .app-name {
    font-size: 1.2rem;
  }

  main {
    padding: 0.8rem;
  }

  /* Bottom Navbar Mobile */
  .bottom-navbar {
    height: 65px;
  }

  .nav-item {
    min-height: 55px;
    padding: 0.4rem 0.2rem;
  }

  .nav-icon {
    font-size: 1.4rem;
  }

  .nav-label {
    font-size: 0.65rem;
  }

  .nav-item.router-link-active::after {
    width: 5px;
    height: 5px;
    top: -2px;
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
}

/* Desktop (768px ke atas) */
@media (min-width: 769px) {
  .bottom-navbar {
    display: none;
  }

  #app {
    padding-bottom: 0;
  }

  main.has-bottom-nav {
    padding-bottom: 1rem;
  }

  footer.has-bottom-nav {
    padding-bottom: 1.2rem;
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

  main {
    padding: 0.6rem;
  }

  /* Bottom Navbar Small Mobile */
  .bottom-navbar {
    height: 60px;
  }

  .nav-item {
    min-height: 50px;
    padding: 0.3rem 0.1rem;
  }

  .nav-icon {
    font-size: 1.3rem;
  }

  .nav-label {
    font-size: 0.6rem;
  }

  .nav-item.router-link-active::after {
    width: 4px;
    height: 4px;
    top: -1px;
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
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .nav-item {
    min-height: 56px;
  }

  .footer-link-item {
    min-height: 40px;
  }
}

/* Print styles */
@media print {
  header,
  footer,
  .bottom-navbar {
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
