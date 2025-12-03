import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

// Create app
const app = createApp(App)

// Use router
app.use(router)

// Fix untuk hash routing di Vercel
if (window.location.pathname !== '/' && !window.location.hash) {
  const path = window.location.pathname.replace(/^\//, '')
  window.location.replace(`/#/${path}${window.location.search}`)
}

// Mount app
app.mount('#app')

// Debug info
console.log('🚀 SMANDA VOTE App mounted')
console.log('📍 Current hash:', window.location.hash)
console.log('🌐 Router mode:', 'hash')
