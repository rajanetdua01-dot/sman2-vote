<template>
  <div>
    <!-- SIMPLE NAVIGATION WITH HARD LINKS -->
    <div style="background: #1e3a8a; padding: 1rem">
      <a href="/#/" style="color: white; margin-right: 1rem">Home</a>
      <a href="/#/test" style="color: white; margin-right: 1rem">Test</a>
      <a href="/#/login-calon" style="color: white; margin-right: 1rem">Calon</a>
      <a href="/#/admin-login" style="color: white; margin-right: 1rem">Admin</a>
      <a href="/#/scan" style="color: white; margin-right: 1rem">Scan</a>
    </div>

    <!-- SIMPLE CONTENT -->
    <div style="padding: 2rem">
      <h1>SMANDA VOTE</h1>
      <router-view />
    </div>

    <!-- SIMPLE FOOTER -->
    <div style="background: #f1f5f9; padding: 1rem; text-align: center">
      <p>© 2025 SMAN 2 Bandar Lampung</p>
    </div>
  </div>
</template>

<script>
// EMPTY - No imports, no logic
</script>
