<template>
  <div class="live-results-simple">
    <h1>📊 LIVE RESULTS SMANDA VOTE</h1>

    <div class="stats">
      <div class="stat">
        <h3>Total Pemilih</h3>
        <p>{{ totalVoters }}</p>
      </div>
      <div class="stat">
        <h3>Sudah Voting</h3>
        <p>{{ votedCount }}</p>
      </div>
      <div class="stat">
        <h3>Partisipasi</h3>
        <p>{{ participationRate }}%</p>
      </div>
    </div>

    <button @click="loadData">Refresh</button>
    <p>Last update: {{ lastUpdate }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'

const totalVoters = ref(0)
const votedCount = ref(0)
const participationRate = ref(0)
const lastUpdate = ref('')

const loadData = async () => {
  try {
    // Simple query yang pasti work
    const { count: totalGuru } = await supabase
      .from('pengguna')
      .select('*', { count: 'exact', head: true })
      .eq('peran', 'guru')

    totalVoters.value = totalGuru || 0

    const { count: totalVotes } = await supabase
      .from('suara')
      .select('*', { count: 'exact', head: true })
      .eq('is_draft', false)

    votedCount.value = totalVotes || 0

    participationRate.value =
      totalVoters.value > 0 ? Math.round((votedCount.value / totalVoters.value) * 100) : 0

    lastUpdate.value = new Date().toLocaleTimeString()
  } catch (error) {
    console.error('Error:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style>
.live-results-simple {
  padding: 2rem;
  text-align: center;
}
.stats {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin: 2rem 0;
}
.stat {
  background: #f0f7ff;
  padding: 1rem 2rem;
  border-radius: 8px;
}
</style>
