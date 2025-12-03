import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Create app
const app = createApp(App)

// Register plugins IN ORDER
app.use(createPinia())
app.use(router)

// Mount
app.mount('#app')

console.log('✅ SMANDA VOTE App started')
