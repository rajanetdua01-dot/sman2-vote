// src/main.js - SIMPLE VERSION
import { createApp } from 'vue'
import App from './App.vue'

// Create and mount app - MINIMAL
try {
  const app = createApp(App)
  app.mount('#app')
  console.log('✅ Vue app mounted successfully')
} catch (error) {
  console.error('❌ Vue app failed to mount:', error)
  document.getElementById('app').innerHTML = `
    <div style="color: red; padding: 2rem;">
      <h2>Application Error</h2>
      <pre>${error.message}</pre>
      <button onclick="location.reload()">Reload</button>
    </div>
  `
}
