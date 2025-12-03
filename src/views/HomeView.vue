<template>
  <div class="home">
    <!-- ... -->
    <div class="actions">
      <div class="card">
        <h3>👤 Calon Kandidat</h3>
        <p>Daftar sebagai calon Waka</p>
        <!-- PAKAI #/ bukan /#/ -->
        <a href="#/login-calon" class="btn">Login Calon</a>
      </div>

      <div class="card">
        <h3>🗳️ Pemilih (Guru/Staff)</h3>
        <p>Gunakan QR Code untuk voting</p>
        <a href="#/scan" class="btn">Scan QR</a>
      </div>

      <div class="card">
        <h3>📊 Hasil Live</h3>
        <p>Pantau perkembangan voting</p>
        <a href="#/live-results" class="btn">Lihat Hasil</a>
      </div>

      <div class="card">
        <h3>⚙️ Admin/Panitia</h3>
        <p>Kelola sistem voting</p>
        <a href="#/admin-login" class="btn admin-btn">Panel Admin</a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.hero h2 {
  color: #1e3a8a;
  margin-bottom: 1rem;
}

.date {
  background: #f0f7ff;
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  color: #1e3a8a;
  font-weight: bold;
  margin-top: 1rem;
}

.actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.card h3 {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
}

.card p {
  color: #666;
  margin-bottom: 1rem;
}

.btn {
  display: inline-block;
  background: #1e3a8a;
  color: white;
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  border-radius: 6px;
  font-weight: bold;
}

.admin-btn {
  background: #dc2626;
}

.btn:hover {
  opacity: 0.9;
}
</style>
