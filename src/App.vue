<template>
  <div id="app">
    <!-- Simple Header -->
    <header>
      <h1>🗳️ SMANDA VOTE</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/login-calon">Pendaftaran Calon</a>
        <a href="/scan">Pilih Kandidat</a>
        <a href="/live-results">Hasil</a>
        <a href="/admin-login">Admin</a>
      </nav>
    </header>

    <!-- Main Content -->
    <main>
      <router-view />
    </main>

    <!-- Footer dengan Jam WIB -->
    <footer>
      <div class="footer-content">
        <p>© 2025 SMAN 2 Bandar Lampung - Pemilihan Waka 2025/2026</p>

        <!-- Jam WIB Real-time -->
        <div class="time-widget">
          <span class="time-icon">🕐</span>
          <span class="time-label">WIB:</span>
          <span class="time-value">{{ currentTime }}</span>
        </div>

        <!-- Quick Links -->
        <div class="footer-links">
          <a href="/live-results" class="footer-link">📊 Live Results</a>
          <span class="separator">•</span>
          <a href="/scan" class="footer-link">🎫 Voting</a>
          <span class="separator">•</span>
          <a href="/login-calon" class="footer-link">👥 Daftar Calon</a>
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
    }
  },
  mounted() {
    this.updateTime()
    // Update setiap detik
    this.timeInterval = setInterval(this.updateTime, 1000)
  },
  beforeUnmount() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval)
    }
  },
  methods: {
    updateTime() {
      const now = new Date()

      // Format dengan timezone Asia/Jakarta (WIB)
      this.currentTime = now.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    },
  },
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background: #f8fafc;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  padding: 1rem;
  text-align: center;
}

header h1 {
  margin-bottom: 1rem;
}

nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.3s;
}

nav a:hover {
  background: rgba(255, 255, 255, 0.2);
}

main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

footer {
  background: #1e293b;
  color: #cbd5e1;
  text-align: center;
  padding: 1.5rem;
  margin-top: auto;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.footer-content p {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* Time Widget Styles */
.time-widget {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.time-icon {
  font-size: 1rem;
}

.time-label {
  opacity: 0.9;
  font-size: 0.85rem;
}

.time-value {
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

/* Footer Links */
.footer-links {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-top: 0.5rem;
}

.footer-link {
  color: #93c5fd;
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.2s;
}

.footer-link:hover {
  color: white;
  text-decoration: underline;
}

.separator {
  color: #64748b;
  font-size: 0.8rem;
}

/* Responsive */
@media (max-width: 768px) {
  main {
    padding: 1rem;
  }

  nav {
    gap: 0.5rem;
  }

  nav a {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }

  footer {
    padding: 1rem;
  }

  .time-widget {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .footer-links {
    flex-direction: column;
    gap: 0.5rem;
  }

  .separator {
    display: none;
  }
}
</style>
