<template>
  <div class="home-view">
    <!-- Hero Section -->
    <div class="hero">
      <h1>🗳️ SMANDA VOTE</h1>
      <p class="subtitle">Sistem Voting Online SMAN 2 Bandar Lampung</p>
      <p class="date-info">Pemilihan Waka 2025/2026 - {{ currentDate }}</p>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <div class="action-card">
        <div class="action-icon">👤</div>
        <h3>Calon Kandidat</h3>
        <p>Daftar sebagai calon Waka Humas, Sarpras, Kesiswaan, atau Kurikulum</p>
        <router-link to="/#/login-calon" class="action-btn">Login sebagai Calon</router-link>
      </div>

      <div class="action-card">
        <div class="action-icon">🗳️</div>
        <h3>Pemilih (Guru/Staff)</h3>
        <p>Gunakan QR Code untuk masuk dan pilih kandidat terbaik</p>
        <router-link to="/#/scan" class="action-btn">Scan QR Code</router-link>
      </div>

      <div class="action-card">
        <div class="action-icon">📊</div>
        <h3>Hasil Real-time</h3>
        <p>Pantau perkembangan voting secara langsung</p>
        <router-link to="/#/live-results" class="action-btn">Lihat Hasil</router-link>
      </div>

      <div class="action-card">
        <div class="action-icon">⚙️</div>
        <h3>Panitia/Admin</h3>
        <p>Kelola sesi pemilihan dan monitoring</p>
        <router-link to="/#/admin-login" class="action-btn admin-btn">Panel Admin</router-link>
      </div>
    </div>

    <!-- Jadwal Pemilihan -->
    <div class="schedule">
      <h2>📅 Jadwal Pemilihan</h2>
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-date">Sekarang - 7 Des 2025</div>
          <div class="timeline-content">
            <h4>Pendaftaran Calon</h4>
            <p>Guru dapat mendaftar sebagai calon kandidat</p>
          </div>
        </div>
        <div class="timeline-item active">
          <div class="timeline-date">8 Des 2025</div>
          <div class="timeline-content">
            <h4>Voting Day</h4>
            <p>10:00 - 11:00 WIB (1 Jam)</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-date">Setelah 11:00</div>
          <div class="timeline-content">
            <h4>Pengumuman Hasil</h4>
            <p>Hasil final akan diumumkan</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="quick-links">
      <h2>🔗 Quick Links</h2>
      <div class="links-grid">
        <router-link to="/#/test" class="link-card">🔧 Test Koneksi</router-link>
        <router-link to="/#/admin-login" class="link-card">🎮 Mode Simulasi</router-link>
        <a href="#" class="link-card">📖 Panduan Voting</a>
        <a href="mailto:panitia@smanda.sch.id" class="link-card">📧 Kontak Panitia</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const currentDate = ref(
  new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)
</script>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  border-radius: 16px;
  color: white;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.date-info {
  background: rgba(255, 255, 255, 0.2);
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease;
}

.action-card:hover {
  transform: translateY(-5px);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.action-card h3 {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
}

.action-card p {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.action-btn {
  display: inline-block;
  background: #1e3a8a;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.3s;
}

.action-btn:hover {
  background: #1e40af;
}

.admin-btn {
  background: #dc2626;
}

.admin-btn:hover {
  background: #b91c1b;
}

.schedule {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.schedule h2 {
  color: #1e3a8a;
  margin-bottom: 1.5rem;
  text-align: center;
}

.timeline {
  max-width: 600px;
  margin: 0 auto;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 2rem;
  position: relative;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 100px;
  top: 30px;
  width: 2px;
  height: calc(100% + 1rem);
  background: #e2e8f0;
}

.timeline-date {
  min-width: 120px;
  background: #f1f5f9;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  color: #475569;
  margin-right: 1rem;
}

.timeline-item.active .timeline-date {
  background: #1e3a8a;
  color: white;
}

.timeline-content h4 {
  color: #1e3a8a;
  margin-bottom: 0.25rem;
}

.timeline-content p {
  color: #666;
}

.quick-links {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.quick-links h2 {
  color: #1e3a8a;
  margin-bottom: 1.5rem;
  text-align: center;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.link-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  text-decoration: none;
  color: #475569;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
}

.link-card:hover {
  background: #1e3a8a;
  color: white;
  border-color: #1e3a8a;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .timeline-item {
    flex-direction: column;
  }

  .timeline-item:not(:last-child)::after {
    left: 20px;
    top: 50px;
  }

  .timeline-date {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
}
</style>
