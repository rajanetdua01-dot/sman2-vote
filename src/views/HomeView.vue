<template>
  <div class="home-container">
    <div class="hero">
      <h1 class="hero-title">SMANDA VOTE</h1>
      <p class="hero-subtitle">Sistem Voting Online SMAN 2 Bandar Lampung</p>
      <p class="hero-date">Pemilihan Waka 2025/2026 - 3 Desember 2025</p>
    </div>

    <div class="options-grid">
      <div class="option-card">
        <div class="option-icon">👤</div>
        <h3>Calon Kandidat</h3>
        <p>Daftar sebagai calon Waka Humas, Sarpras, Kesiswaan, atau Kurikulum</p>
        <router-link to="/login-calon" class="option-btn"> Login sebagai Calon </router-link>
      </div>

      <div class="option-card">
        <div class="option-icon">🗳️</div>
        <h3>Pemilih (Guru/Staff)</h3>
        <p>Gunakan QR Code untuk masuk dan pilih kandidat terbaik</p>
        <router-link to="/scan" class="option-btn"> Scan QR Code </router-link>
      </div>

      <div class="option-card">
        <div class="option-icon">📊</div>
        <h3>Hasil Real-time</h3>
        <p>Pantau perkembangan voting secara langsung</p>
        <router-link to="/live-results" class="option-btn"> Lihat Hasil </router-link>
      </div>

      <div class="option-card">
        <div class="option-icon">⚙️</div>
        <h3>Panitia/Admin</h3>
        <p>Kelola sesi pemilihan dan monitoring</p>
        <router-link to="/admin-login" class="option-btn"> Panel Admin </router-link>
      </div>
    </div>

    <div class="info-section">
      <h2>Jadwal Pemilihan</h2>
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-date">Sekarang - 2 Des 2025</div>
          <div class="timeline-content">
            <strong>Pendaftaran Calon</strong>
            <p>Guru dapat mendaftar sebagai calon kandidat</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-date">3 Des 2025</div>
          <div class="timeline-content">
            <strong>Voting Day</strong>
            <p>10:00 - 11:00 WIB (1 Jam)</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-date">Setelah 11:00</div>
          <div class="timeline-content">
            <strong>Pengumuman Hasil</strong>
            <p>Hasil final akan diumumkan</p>
          </div>
        </div>
      </div>
    </div>

    <div class="quick-links">
      <h2>Quick Links</h2>
      <div class="links-grid">
        <router-link to="/test" class="link-card">Test Koneksi</router-link>
        <router-link to="/simulasi" class="link-card">Mode Simulasi</router-link>
        <router-link to="/panduan" class="link-card">Panduan Voting</router-link>
        <router-link to="/kontak" class="link-card">Kontak Panitia</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// Home page tidak butuh logic khusus
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem 3rem;
}

.hero {
  text-align: center;
  padding: 3rem 1rem;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 3rem;
}

.hero-title {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  font-weight: 800;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.hero-date {
  font-size: 1.2rem;
  background: rgba(255, 255, 255, 0.2);
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  margin-top: 1rem;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.option-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.option-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.option-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.option-card h3 {
  color: #1e3a8a;
  margin-bottom: 1rem;
}

.option-card p {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.option-btn {
  display: inline-block;
  background-color: #1e3a8a;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.3s;
}

.option-btn:hover {
  background-color: #1e40af;
}

.info-section {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
}

.info-section h2 {
  color: #1e3a8a;
  text-align: center;
  margin-bottom: 2rem;
}

.timeline {
  max-width: 600px;
  margin: 0 auto;
}

.timeline-item {
  display: flex;
  margin-bottom: 1.5rem;
  align-items: flex-start;
}

.timeline-date {
  min-width: 150px;
  background: #1e3a8a;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  margin-right: 1.5rem;
}

.timeline-content {
  flex: 1;
  padding-top: 0.5rem;
}

.quick-links {
  margin-top: 3rem;
}

.quick-links h2 {
  color: #1e3a8a;
  text-align: center;
  margin-bottom: 2rem;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.link-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  text-decoration: none;
  color: #1e3a8a;
  font-weight: 600;
  transition: all 0.3s;
}

.link-card:hover {
  background: #1e3a8a;
  color: white;
  border-color: #1e3a8a;
}
</style>
