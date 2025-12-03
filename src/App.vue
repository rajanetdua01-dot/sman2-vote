<template>
  <div id="app">
    <!-- Simple Header -->
    <header>
      <h1>🗳️ SMANDA VOTE</h1>
      <nav>
        <a href="/#/">Home</a>
        <a href="/#/test">Test</a>
        <a href="/#/login-calon">Login Calon</a>
        <a href="/#/admin-login">Admin</a>
        <a href="/#/scan">Scan QR</a>
        <a href="/#/live-results">Hasil</a>
      </nav>
    </header>

    <!-- Main Content -->
    <main>
      <router-view />
    </main>

    <!-- Footer -->
    <footer>
      <p>© 2025 SMAN 2 Bandar Lampung - Pemilihan Waka 2025/2026</p>
    </footer>
  </div>
</template>

<script>
// Empty - Vue will handle it
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
  padding: 1rem;
  margin-top: auto;
}
</style>
