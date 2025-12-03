// src/main.js - WITH ERROR BOUNDARY
import { createApp } from 'vue'
import App from './App.vue'

// Error Boundary Component
const ErrorBoundary = {
  data() {
    return { hasError: false, error: null }
  },
  errorCaptured(err, instance, info) {
    this.hasError = true
    this.error = err
    console.error('Vue Error:', err, info)
    return false
  },
  render(h) {
    if (this.hasError) {
      return h('div', { style: 'padding: 2rem; color: red;' }, [
        h('h2', 'Application Error'),
        h('pre', this.error?.message || 'Unknown error'),
        h(
          'button',
          {
            on: { click: () => location.reload() },
          },
          'Reload Page',
        ),
        h('div', { style: 'margin-top: 1rem;' }, [
          h('a', { attrs: { href: '/#/' } }, 'Home'),
          ' | ',
          h('a', { attrs: { href: '/#/admin-login' } }, 'Admin Login'),
          ' | ',
          h('a', { attrs: { href: '/#/test' } }, 'Test'),
        ]),
      ])
    }
    return h(App)
  },
}

try {
  const app = createApp(ErrorBoundary)
  app.mount('#app')
  console.log('✅ Vue app mounted with error boundary')
} catch (error) {
  console.error('❌ Failed to mount app:', error)
  document.getElementById('app').innerHTML = `
    <div style="padding: 2rem; color: red;">
      <h2>Critical Error</h2>
      <pre>${error.message}</pre>
      <button onclick="location.reload()">Reload</button>
      <div style="margin-top: 1rem;">
        <a href="/#/">Home</a> |
        <a href="/#/admin-login">Admin</a> |
        <a href="/#/test">Test</a>
      </div>
    </div>
  `
}
