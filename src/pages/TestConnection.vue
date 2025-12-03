<template>
  <div class="test-container">
    <h1>Test Supabase Connection</h1>
    
    <div class="test-buttons">
      <button @click="testUsers" :disabled="loading.users">
        {{ loading.users ? 'Testing...' : 'Test Users' }}
      </button>
      <button @click="testSessions" :disabled="loading.sessions">
        {{ loading.sessions ? 'Testing...' : 'Test Sessions' }}
      </button>
      <button @click="testAll" :disabled="loading.all">
        {{ loading.all ? 'Testing...' : 'Test All Connections' }}
      </button>
    </div>
    
    <div v-if="result" class="result-box">
      <h3>Result:</h3>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
    
    <div v-if="error" class="error-box">
      <h3>Error:</h3>
      <pre>{{ error }}</pre>
    </div>
    
    <div class="stats" v-if="stats">
      <h3>Database Stats:</h3>
      <ul>
        <li>Total Users: {{ stats.users }}</li>
        <li>Active Sessions: {{ stats.sessions }}</li>
        <li>Connection: <span :class="stats.connected ? 'connected' : 'disconnected'">
          {{ stats.connected ? '✅ Connected' : '❌ Disconnected' }}
        </span></li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'

const loading = ref({
  users: false,
  sessions: false,
  all: false
})
const result = ref(null)
const error = ref(null)
const stats = ref(null)

const testUsers = async () => {
  loading.value.users = true
  error.value = null
  
  try {
    const { data, error: supabaseError } = await supabase
      .from('pengguna')
      .select('id, nip, nama_lengkap, peran')
      .limit(5)
    
    if (supabaseError) throw supabaseError
    
    result.value = {
      type: 'users',
      count: data.length,
      data: data
    }
    
    updateStats()
    
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value.users = false
  }
}

const testSessions = async () => {
  loading.value.sessions = true
  error.value = null
  
  try {
    const { data, error: supabaseError } = await supabase
      .from('sesi_pemilihan')
      .select('*')
    
    if (supabaseError) throw supabaseError
    
    result.value = {
      type: 'sessions',
      count: data.length,
      data: data
    }
    
    updateStats()
    
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value.sessions = false
  }
}

const testAll = async () => {
  loading.value.all = true
  error.value = null
  
  try {
    // Test multiple tables
    const [usersResult, sessionsResult] = await Promise.all([
      supabase.from('pengguna').select('count', { count: 'exact', head: true }),
      supabase.from('sesi_pemilihan').select('count', { count: 'exact', head: true })
    ])
    
    if (usersResult.error) throw usersResult.error
    if (sessionsResult.error) throw sessionsResult.error
    
    result.value = {
      type: 'all',
      users: usersResult.count,
      sessions: sessionsResult.count,
      message: '✅ All connections successful!'
    }
    
    updateStats()
    
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value.all = false
  }
}

const updateStats = () => {
  stats.value = {
    users: result.value?.type === 'all' ? result.value.users : 'N/A',
    sessions: result.value?.type === 'all' ? result.value.sessions : 'N/A',
    connected: !error.value
  }
}
</script>

<style scoped>
.test-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.test-buttons {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
}

.test-buttons button {
  padding: 0.75rem 1.5rem;
  background-color: #1e3a8a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.test-buttons button:hover:not(:disabled) {
  background-color: #1e40af;
}

.test-buttons button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.result-box, .error-box {
  margin: 2rem 0;
  padding: 1.5rem;
  border-radius: 8px;
  overflow: auto;
}

.result-box {
  background-color: #f0f7ff;
  border: 1px solid #b3d4ff;
}

.error-box {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c00;
}

.stats {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stats ul {
  list-style: none;
  padding: 0;
}

.stats li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #dee2e6;
}

.connected {
  color: #198754;
  font-weight: 600;
}

.disconnected {
  color: #dc3545;
  font-weight: 600;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>