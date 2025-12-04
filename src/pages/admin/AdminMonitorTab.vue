<template>
  <div class="monitor-tab">
    <!-- Section Header -->
    <div class="section-header">
      <h2>📊 Monitoring Real-time</h2>
      <p>Pantau aktivitas voting secara live - Auto refresh setiap 30 detik</p>
      <div class="connection-status">
        <span class="status-dot" :class="{ connected: isConnected }"></span>
        <span class="status-text">{{ isConnected ? '● CONNECTED' : '○ DISCONNECTED' }}</span>
        <button @click="toggleAutoRefresh" class="refresh-toggle">
          {{ autoRefresh ? '⏸️ Pause Auto-refresh' : '▶️ Resume Auto-refresh' }}
        </button>
        <button @click="refreshData" class="btn-refresh" :disabled="refreshing">
          {{ refreshing ? '🔄 Refreshing...' : '🔄 Refresh Now' }}
        </button>
      </div>
    </div>

    <!-- Live Stats Banner -->
    <div class="live-stats-banner">
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <h4>Total Votes</h4>
          <p class="stat-number">{{ stats.totalVotes || 0 }}</p>
          <p class="stat-trend">
            <span :class="stats.votesTrend >= 0 ? 'up' : 'down'">
              {{ stats.votesTrend >= 0 ? '↗' : '↘' }}
              {{ Math.abs(stats.votesTrend) }}
            </span>
            in last 5 min
          </p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h4>Active Voters</h4>
          <p class="stat-number">{{ stats.activeVoters || 0 }}</p>
          <p class="stat-sub">of {{ stats.totalGuru || 0 }} total</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h4>Completion</h4>
          <p class="stat-number">{{ stats.completionRate || 0 }}%</p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: stats.completionRate + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <h4>Voting Speed</h4>
          <p class="stat-number">{{ stats.votesPerMinute || 0 }}/min</p>
          <p class="speed-indicator" :class="getSpeedClass(stats.votesPerMinute)">
            {{ getSpeedLabel(stats.votesPerMinute) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Main Dashboard -->
    <div class="dashboard-grid">
      <!-- Left Column -->
      <div class="dashboard-left">
        <!-- Votes Over Time Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h4>📈 Votes Over Time</h4>
            <select v-model="timeRange" class="time-select">
              <option value="1h">Last 1 Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div class="chart-container">
            <div v-if="votesOverTime.length === 0" class="chart-placeholder">
              <p>No voting data yet</p>
            </div>
            <div v-else class="votes-chart">
              <div class="chart-y-axis">
                <span>{{ maxVotes }}</span>
                <span>{{ Math.floor(maxVotes / 2) }}</span>
                <span>0</span>
              </div>
              <div class="chart-bars">
                <div
                  v-for="(data, index) in votesOverTime"
                  :key="index"
                  class="chart-bar-container"
                >
                  <div
                    class="chart-bar"
                    :style="{ height: getBarHeight(data.votes) + '%' }"
                    :title="`${data.time}: ${data.votes} votes`"
                  ></div>
                  <div class="chart-label">{{ data.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity Feed -->
        <div class="activity-card">
          <div class="card-header">
            <h4>🔄 Recent Activity</h4>
            <button @click="clearActivity" class="btn-clear">Clear</button>
          </div>
          <div class="activity-feed">
            <div v-if="recentActivity.length === 0" class="empty-activity">
              <p>No recent activity</p>
            </div>
            <div v-else>
              <div
                v-for="activity in recentActivity"
                :key="activity.id"
                class="activity-item"
                :class="activity.type"
              >
                <div class="activity-icon">
                  <span v-if="activity.type === 'vote'">🗳️</span>
                  <span v-if="activity.type === 'token_used'">🎫</span>
                  <span v-if="activity.type === 'alert'">⚠️</span>
                  <span v-if="activity.type === 'info'">ℹ️</span>
                </div>
                <div class="activity-content">
                  <p class="activity-message">{{ activity.message }}</p>
                  <span class="activity-time">{{ formatTimeAgo(activity.timestamp) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="dashboard-right">
        <!-- Candidate Leaderboard -->
        <div class="leaderboard-card">
          <div class="card-header">
            <h4>🏆 Candidate Leaderboard</h4>
            <span class="update-time">Updated {{ lastUpdated }}</span>
          </div>
          <div class="leaderboard-list">
            <div v-if="candidateLeaderboard.length === 0" class="empty-leaderboard">
              <p>No candidates yet</p>
            </div>
            <div v-else>
              <div
                v-for="(candidate, index) in candidateLeaderboard"
                :key="candidate.id"
                class="leaderboard-item"
              >
                <div class="rank">{{ index + 1 }}</div>
                <div class="candidate-info">
                  <div class="candidate-name">{{ candidate.nama_lengkap || 'Unknown' }}</div>
                  <div class="candidate-position">{{ formatJabatan(candidate.jabatan) }}</div>
                </div>
                <div class="vote-count">
                  <span class="votes">{{ candidate.total_suara || 0 }}</span>
                  <span class="votes-label">votes</span>
                </div>
                <div class="vote-bar">
                  <div
                    class="bar-fill"
                    :style="{ width: getVotePercentage(candidate.total_suara || 0) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerts & Warnings -->
        <div class="alerts-card">
          <div class="card-header">
            <h4>⚠️ Alerts & Warnings</h4>
            <span class="alert-count" v-if="alerts.length > 0">{{ alerts.length }}</span>
          </div>
          <div class="alerts-list">
            <div v-if="alerts.length === 0" class="no-alerts">
              <p>No alerts - System normal</p>
            </div>
            <div v-else>
              <div
                v-for="alert in alerts"
                :key="alert.id"
                class="alert-item"
                :class="alert.severity"
              >
                <div class="alert-icon">
                  <span v-if="alert.severity === 'high'">🚨</span>
                  <span v-if="alert.severity === 'medium'">⚠️</span>
                  <span v-if="alert.severity === 'low'">ℹ️</span>
                </div>
                <div class="alert-content">
                  <p class="alert-message">{{ alert.message }}</p>
                  <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
                </div>
                <button @click="dismissAlert(alert.id)" class="alert-dismiss">×</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats-card">
          <h4>📋 Quick Stats</h4>
          <div class="stats-grid">
            <div class="quick-stat">
              <span class="stat-label">Avg. Vote Time</span>
              <span class="stat-value">{{ quickStats.avgVoteTime || '0s' }}</span>
            </div>
            <div class="quick-stat">
              <span class="stat-label">Peak Hour</span>
              <span class="stat-value">{{ quickStats.peakHour || 'N/A' }}</span>
            </div>
            <div class="quick-stat">
              <span class="stat-label">Unique Devices</span>
              <span class="stat-value">{{ quickStats.uniqueDevices || 0 }}</span>
            </div>
            <div class="quick-stat">
              <span class="stat-label">Failed Attempts</span>
              <span class="stat-value">{{ quickStats.failedAttempts || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Device Distribution -->
    <div class="device-distribution">
      <div class="section-header-small">
        <h4>📱 Device Distribution</h4>
        <span class="total-devices">{{ deviceStats.totalDevices || 0 }} devices detected</span>
      </div>
      <div class="device-grid">
        <div class="device-item" v-for="device in deviceStats.distribution" :key="device.type">
          <div class="device-icon">
            <span v-if="device.type === 'mobile'">📱</span>
            <span v-if="device.type === 'desktop'">💻</span>
            <span v-if="device.type === 'tablet'">📟</span>
            <span v-if="device.type === 'unknown'">❓</span>
          </div>
          <div class="device-info">
            <span class="device-type">{{ formatDeviceType(device.type) }}</span>
            <span class="device-count">{{ device.count }} ({{ device.percentage }}%)</span>
          </div>
          <div class="device-bar">
            <div class="bar-fill" :style="{ width: device.percentage + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export & Actions -->
    <div class="export-actions">
      <h4>📤 Export & Reports</h4>
      <div class="action-buttons">
        <button @click="exportVotingReport" class="export-btn">📊 Export Voting Report</button>
        <button @click="exportActivityLog" class="export-btn">📝 Export Activity Log</button>
        <button @click="generateAnalytics" class="export-btn">📈 Generate Analytics</button>
        <button @click="sendStatusReport" class="export-btn">📧 Send Status Report</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { supabase } from '@/utils/supabase'

const props = defineProps({
  activeSession: Object,
})

// State
const loading = ref(true)
const refreshing = ref(false)
const isConnected = ref(true)
const autoRefresh = ref(true)
const timeRange = ref('6h')

// Data
const stats = ref({
  totalVotes: 0,
  activeVoters: 0,
  totalGuru: 0,
  completionRate: 0,
  votesPerMinute: 0,
  votesTrend: 0,
})

const votesOverTime = ref([])
const recentActivity = ref([])
const candidateLeaderboard = ref([])
const alerts = ref([])
const quickStats = ref({})
const deviceStats = ref({})

// Auto-refresh interval
let refreshInterval = null

// Load all monitoring data
const loadMonitoringData = async () => {
  if (!props.activeSession?.id) {
    console.log('No active session for monitoring')
    return
  }

  try {
    refreshing.value = true

    // Load stats in parallel
    await Promise.all([
      loadVotingStats(),
      loadVotesOverTime(),
      loadRecentActivity(),
      loadCandidateLeaderboard(),
      loadAlerts(),
      loadQuickStats(),
      loadDeviceStats(),
    ])

    // Add info activity
    addActivity({
      type: 'info',
      message: 'Monitoring data refreshed',
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Error loading monitoring data:', error)
    addActivity({
      type: 'alert',
      message: `Failed to load data: ${error.message}`,
      timestamp: new Date(),
    })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// Load voting statistics
const loadVotingStats = async () => {
  try {
    // Total votes
    const { count: totalVotes, error: votesError } = await supabase
      .from('suara')
      .select('*', { count: 'exact', head: true })
      .eq('sesi_id', props.activeSession.id)
      .eq('is_draft', false)

    if (votesError) throw votesError

    // Distinct voters
    const { data: voters, error: votersError } = await supabase
      .from('suara')
      .select('pemilih_id', { distinct: true })
      .eq('sesi_id', props.activeSession.id)
      .eq('is_draft', false)

    if (votersError) throw votersError

    // Total teachers
    const { count: totalGuru, error: guruError } = await supabase
      .from('pengguna')
      .select('*', { count: 'exact', head: true })
      .eq('peran', 'guru')
      .eq('is_active', true)

    if (guruError) throw guruError

    // Votes in last 5 minutes for trend
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const { count: recentVotes, error: recentError } = await supabase
      .from('suara')
      .select('*', { count: 'exact', head: true })
      .eq('sesi_id', props.activeSession.id)
      .eq('is_draft', false)
      .gte('dibuat_pada', fiveMinutesAgo.toISOString())

    if (recentError) throw recentError

    // Calculate votes per minute (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const { count: hourVotes, error: hourError } = await supabase
      .from('suara')
      .select('*', { count: 'exact', head: true })
      .eq('sesi_id', props.activeSession.id)
      .eq('is_draft', false)
      .gte('dibuat_pada', oneHourAgo.toISOString())

    if (hourError) throw hourError

    const votesPerMinute = Math.round((hourVotes || 0) / 60)
    const completionRate = totalGuru ? Math.round(((voters?.length || 0) / totalGuru) * 100) : 0

    stats.value = {
      totalVotes: totalVotes || 0,
      activeVoters: voters?.length || 0,
      totalGuru: totalGuru || 0,
      completionRate,
      votesPerMinute,
      votesTrend: recentVotes || 0,
    }
  } catch (error) {
    console.error('Error loading voting stats:', error)
    throw error
  }
}

// Load votes over time for chart
const loadVotesOverTime = async () => {
  try {
    // Based on timeRange selection
    let hours = 6 // default 6h
    if (timeRange.value === '1h') hours = 1
    if (timeRange.value === '24h') hours = 24
    if (timeRange.value === 'all') hours = 168 // 7 days

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)

    // Get votes grouped by hour
    const { data: votes, error } = await supabase
      .from('suara')
      .select('dibuat_pada')
      .eq('sesi_id', props.activeSession.id)
      .eq('is_draft', false)
      .gte('dibuat_pada', startTime.toISOString())

    if (error) throw error

    // Group votes by hour
    const groupedVotes = {}
    votes?.forEach((vote) => {
      const date = new Date(vote.dibuat_pada)
      const hourKey = `${date.getHours()}:00`
      groupedVotes[hourKey] = (groupedVotes[hourKey] || 0) + 1
    })

    // Format for chart
    const chartData = []
    for (let i = 0; i < hours; i++) {
      const hour = new Date(Date.now() - (hours - i - 1) * 60 * 60 * 1000)
      const hourKey = `${hour.getHours()}:00`
      const label =
        hour.getHours() === 0
          ? '12AM'
          : hour.getHours() < 12
            ? `${hour.getHours()}AM`
            : hour.getHours() === 12
              ? '12PM'
              : `${hour.getHours() - 12}PM`

      chartData.push({
        time: hourKey,
        label,
        votes: groupedVotes[hourKey] || 0,
      })
    }

    votesOverTime.value = chartData
  } catch (error) {
    console.error('Error loading votes over time:', error)
    votesOverTime.value = []
  }
}

// Load recent activity - SIMPLIFIED VERSION (no complex joins)
const loadRecentActivity = async () => {
  try {
    // Get recent votes with SIMPLE query first
    const { data: recentVotes, error: votesError } = await supabase
      .from('suara')
      .select('id, dibuat_pada, pemilih_id, kandidat_id')
      .eq('sesi_id', props.activeSession.id)
      .eq('is_draft', false)
      .order('dibuat_pada', { ascending: false })
      .limit(10)

    if (votesError) {
      console.error('Votes error:', votesError)
      throw votesError
    }

    console.log('Recent votes loaded:', recentVotes?.length || 0)

    // Get voter names in batch
    const voterIds = [...new Set(recentVotes?.map((v) => v.pemilih_id).filter(Boolean) || [])]
    const voterNames = await getUserNames(voterIds)

    // Get candidate names in batch
    const candidateIds = [...new Set(recentVotes?.map((v) => v.kandidat_id).filter(Boolean) || [])]
    const candidateNames = await getCandidateNames(candidateIds)

    // Format activity items
    const activities =
      recentVotes?.map((vote) => {
        const voterName = voterNames[vote.pemilih_id] || 'Someone'
        const candidateName = candidateNames[vote.kandidat_id] || 'a candidate'

        return {
          id: vote.id,
          type: 'vote',
          message: `${voterName} voted for ${candidateName}`,
          timestamp: new Date(vote.dibuat_pada),
        }
      }) || []

    // Get recent token usage (simple query)
    const { data: recentTokens, error: tokensError } = await supabase
      .from('token_qr')
      .select('id, token, digunakan_pada, pengguna_id')
      .eq('sesi_id', props.activeSession.id)
      .eq('sudah_digunakan', true)
      .order('digunakan_pada', { ascending: false })
      .limit(5)

    if (!tokensError && recentTokens) {
      // Get user names for token users
      const tokenUserIds = recentTokens.map((t) => t.pengguna_id).filter(Boolean)
      const tokenUserNames = await getUserNames(tokenUserIds)

      recentTokens.forEach((token) => {
        activities.push({
          id: token.id,
          type: 'token_used',
          message: `${tokenUserNames[token.pengguna_id] || 'User'} used token ${token.token}`,
          timestamp: new Date(token.digunakan_pada),
        })
      })
    }

    // Sort by timestamp and limit
    recentActivity.value = activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15)

    console.log('Activities loaded:', recentActivity.value.length)
  } catch (error) {
    console.error('Error loading recent activity:', error)
    // Fallback: use simple activity
    loadSimpleRecentActivity()
  }
}

// Helper: Get user names by IDs
const getUserNames = async (userIds) => {
  if (!userIds || userIds.length === 0) return {}

  try {
    const { data: users, error } = await supabase
      .from('pengguna')
      .select('id, nama_lengkap')
      .in('id', userIds)

    if (error) return {}

    const nameMap = {}
    users?.forEach((user) => {
      nameMap[user.id] = user.nama_lengkap
    })
    return nameMap
  } catch (error) {
    console.error('Error getting user names:', error)
    return {}
  }
}

// Helper: Get candidate names by IDs
const getCandidateNames = async (candidateIds) => {
  if (!candidateIds || candidateIds.length === 0) return {}

  try {
    const { data: candidates, error } = await supabase
      .from('kandidat')
      .select('id, pengguna_id')
      .in('id', candidateIds)

    if (error || !candidates) return {}

    // Get user IDs from candidates
    const userIds = candidates.map((c) => c.pengguna_id).filter(Boolean)
    const userNames = await getUserNames(userIds)

    // Map candidate_id -> user_name
    const nameMap = {}
    candidates.forEach((candidate) => {
      nameMap[candidate.id] = userNames[candidate.pengguna_id] || 'Unknown'
    })

    return nameMap
  } catch (error) {
    console.error('Error getting candidate names:', error)
    return {}
  }
}

// Fallback simple activity loader
const loadSimpleRecentActivity = async () => {
  try {
    // Simple query without joins
    const { data: recentVotes, error } = await supabase
      .from('suara')
      .select('id, dibuat_pada')
      .eq('sesi_id', props.activeSession.id)
      .eq('is_draft', false)
      .order('dibuat_pada', { ascending: false })
      .limit(10)

    if (error) throw error

    const activities =
      recentVotes?.map((vote) => ({
        id: vote.id,
        type: 'vote',
        message: `Someone voted`,
        timestamp: new Date(vote.dibuat_pada),
      })) || []

    recentActivity.value = activities
  } catch (error) {
    console.error('Error loading simple activity:', error)
    recentActivity.value = []
  }
}

// Load candidate leaderboard - SIMPLIFIED VERSION
const loadCandidateLeaderboard = async () => {
  try {
    // Get candidates first
    const { data: candidates, error: candidateError } = await supabase
      .from('kandidat')
      .select('id, pengguna_id, jabatan, total_suara')
      .eq('sesi_id', props.activeSession.id)
      .order('total_suara', { ascending: false })
      .limit(10)

    if (candidateError) {
      console.error('Candidate leaderboard error:', candidateError)
      throw candidateError
    }

    if (!candidates || candidates.length === 0) {
      candidateLeaderboard.value = []
      console.log('No candidates found')
      return
    }

    // Get user names for these candidates
    const userIds = candidates.map((c) => c.pengguna_id).filter(Boolean)
    const userNames = await getUserNames(userIds)

    // Combine candidate data with user names
    const leaderboard = candidates.map((candidate) => ({
      id: candidate.id,
      pengguna_id: candidate.pengguna_id,
      nama_lengkap: userNames[candidate.pengguna_id] || 'Unknown',
      jabatan: candidate.jabatan,
      total_suara: candidate.total_suara || 0,
    }))

    candidateLeaderboard.value = leaderboard
    console.log('Leaderboard loaded:', candidateLeaderboard.value.length, 'candidates')
  } catch (error) {
    console.error('Error loading candidate leaderboard:', error)
    candidateLeaderboard.value = []
  }
}

// Load alerts
const loadAlerts = async () => {
  try {
    // Check for suspicious activity
    const currentAlerts = []

    // Check for multiple votes from same IP in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const { data: recentVotes, error: votesError } = await supabase
      .from('suara')
      .select('alamat_ip, dibuat_pada')
      .eq('sesi_id', props.activeSession.id)
      .eq('is_draft', false)
      .gte('dibuat_pada', oneHourAgo.toISOString())

    if (!votesError && recentVotes) {
      const ipCounts = {}
      recentVotes.forEach((vote) => {
        if (vote.alamat_ip) {
          ipCounts[vote.alamat_ip] = (ipCounts[vote.alamat_ip] || 0) + 1
        }
      })

      // Check for IPs with > 5 votes (suspicious)
      Object.entries(ipCounts).forEach(([ip, count]) => {
        if (count > 5) {
          currentAlerts.push({
            id: `ip-alert-${ip}`,
            severity: 'medium',
            message: `IP ${ip} has ${count} votes in last hour`,
            timestamp: new Date(),
          })
        }
      })
    }

    alerts.value = currentAlerts
  } catch (error) {
    console.error('Error loading alerts:', error)
    alerts.value = []
  }
}

// Load quick stats
const loadQuickStats = async () => {
  try {
    // Calculate average vote time (placeholder)
    const avgVoteTime = '2m 15s'

    // Find peak voting hour
    const peakHour = await findPeakHour()

    // Count unique devices
    const { data: tokens, error } = await supabase
      .from('token_qr')
      .select('info_perangkat')
      .eq('sesi_id', props.activeSession.id)
      .not('info_perangkat', 'is', null)

    if (error) throw error

    const uniqueDevices = new Set(tokens?.map((t) => t.info_perangkat) || []).size

    quickStats.value = {
      avgVoteTime,
      peakHour,
      uniqueDevices,
      failedAttempts: 0, // Placeholder
    }
  } catch (error) {
    console.error('Error loading quick stats:', error)
    quickStats.value = {}
  }
}

// Load device statistics
const loadDeviceStats = async () => {
  try {
    const { data: tokens, error } = await supabase
      .from('token_qr')
      .select('info_perangkat')
      .eq('sesi_id', props.activeSession.id)
      .not('info_perangkat', 'is', null)

    if (error) throw error

    // Simple device detection from user agent
    const deviceTypes = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      unknown: 0,
    }

    tokens?.forEach((token) => {
      const ua = token.info_perangkat?.toLowerCase() || ''
      if (ua.includes('mobile') && !ua.includes('tablet')) {
        deviceTypes.mobile++
      } else if (ua.includes('tablet') || ua.includes('ipad')) {
        deviceTypes.tablet++
      } else if (
        ua.includes('windows') ||
        ua.includes('mac') ||
        ua.includes('linux') ||
        ua.includes('x11')
      ) {
        deviceTypes.desktop++
      } else {
        deviceTypes.unknown++
      }
    })

    const total = Object.values(deviceTypes).reduce((a, b) => a + b, 0)
    const distribution = Object.entries(deviceTypes).map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))

    deviceStats.value = {
      totalDevices: total,
      distribution,
    }
  } catch (error) {
    console.error('Error loading device stats:', error)
    deviceStats.value = {}
  }
}

// Helper functions
const findPeakHour = async () => {
  try {
    const { data: votes, error } = await supabase
      .from('suara')
      .select('dibuat_pada')
      .eq('sesi_id', props.activeSession.id)
      .eq('is_draft', false)

    if (error || !votes || votes.length === 0) return 'N/A'

    const hourCounts = {}
    votes.forEach((vote) => {
      const hour = new Date(vote.dibuat_pada).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    const peakHour = Object.entries(hourCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0]

    return `${peakHour}:00 - ${parseInt(peakHour) + 1}:00`
  } catch (error) {
    console.error('Error finding peak hour:', error)
    return 'N/A'
  }
}

const addActivity = (activity) => {
  recentActivity.value.unshift({
    id: Date.now(),
    ...activity,
  })

  // Keep only last 20 activities
  if (recentActivity.value.length > 20) {
    recentActivity.value = recentActivity.value.slice(0, 20)
  }
}

// Computed properties
const maxVotes = computed(() => {
  if (votesOverTime.value.length === 0) return 10
  return Math.max(...votesOverTime.value.map((d) => d.votes), 10)
})

const lastUpdated = computed(() => {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
})

// Methods
const getBarHeight = (votes) => {
  if (maxVotes.value === 0) return 0
  return (votes / maxVotes.value) * 100
}

const getVotePercentage = (votes) => {
  if (stats.value.totalVotes === 0) return 0
  return (votes / stats.value.totalVotes) * 100
}

const getSpeedClass = (speed) => {
  if (speed >= 10) return 'high'
  if (speed >= 5) return 'medium'
  return 'low'
}

const getSpeedLabel = (speed) => {
  if (speed >= 10) return 'Very Fast'
  if (speed >= 5) return 'Fast'
  if (speed >= 2) return 'Normal'
  return 'Slow'
}

const formatJabatan = (jabatan) => {
  const map = {
    humas: 'Waka Humas',
    sarpras: 'Waka Sarpras',
    kesiswaan: 'Waka Kesiswaan',
    kurikulum: 'Waka Kurikulum',
  }
  return map[jabatan] || jabatan
}

const formatDeviceType = (type) => {
  const map = {
    mobile: 'Mobile',
    desktop: 'Desktop',
    tablet: 'Tablet',
    unknown: 'Unknown',
  }
  return map[type] || type
}

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatTimeAgo = (date) => {
  const now = new Date()
  const diffMs = now - new Date(date)
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
    addActivity({
      type: 'info',
      message: 'Auto-refresh enabled',
      timestamp: new Date(),
    })
  } else {
    stopAutoRefresh()
    addActivity({
      type: 'info',
      message: 'Auto-refresh paused',
      timestamp: new Date(),
    })
  }
}

const refreshData = async () => {
  await loadMonitoringData()
}

const clearActivity = () => {
  recentActivity.value = []
  addActivity({
    type: 'info',
    message: 'Activity log cleared',
    timestamp: new Date(),
  })
}

const dismissAlert = (alertId) => {
  alerts.value = alerts.value.filter((alert) => alert.id !== alertId)
}

const exportVotingReport = () => {
  alert('Export Voting Report feature coming soon!')
}

const exportActivityLog = () => {
  alert('Export Activity Log feature coming soon!')
}

const generateAnalytics = () => {
  alert('Generate Analytics feature coming soon!')
}

const sendStatusReport = () => {
  alert('Send Status Report feature coming soon!')
}

// Auto-refresh functions
const startAutoRefresh = () => {
  if (refreshInterval) clearInterval(refreshInterval)
  refreshInterval = setInterval(async () => {
    if (autoRefresh.value && props.activeSession?.id) {
      try {
        // Refresh only essential data
        await loadVotingStats()
        await loadRecentActivity()
      } catch (error) {
        console.warn('Auto-refresh failed:', error)
      }
    }
  }, 30000) // 30 seconds
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Watch for timeRange changes
watch(timeRange, () => {
  loadVotesOverTime()
})

// Watch for active session changes
watch(
  () => props.activeSession,
  () => {
    if (props.activeSession?.id) {
      loadMonitoringData()
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  },
  { immediate: true },
)

// Lifecycle
onMounted(async () => {
  if (props.activeSession?.id) {
    await loadMonitoringData()
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
/* CSS tetap sama seperti sebelumnya */
/* ... semua styling code tetap ... */
</style>

<style scoped>
/* ALL CSS SAMA SEPERTI SEBELUMNYA - TIDAK ADA PERUBAHAN */
.monitor-tab {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Section Header */
.section-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.section-header h2 {
  color: #1e3a8a;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-header p {
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ef4444;
}

.status-dot.connected {
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
}

.refresh-toggle,
.btn-refresh {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-toggle:hover,
.btn-refresh:hover:not(:disabled) {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Live Stats Banner */
.live-stats-banner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.stat-content h4 {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 800;
  color: #1e3a8a;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-trend,
.stat-sub {
  font-size: 0.85rem;
  color: #6b7280;
}

.stat-trend .up {
  color: #10b981;
  font-weight: 600;
}

.stat-trend .down {
  color: #ef4444;
  font-weight: 600;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.speed-indicator {
  font-size: 0.8rem;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
}

.speed-indicator.high {
  background: #d1fae5;
  color: #065f46;
}

.speed-indicator.medium {
  background: #fef3c7;
  color: #92400e;
}

.speed-indicator.low {
  background: #fee2e2;
  color: #991b1b;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* Chart Card */
.chart-card,
.activity-card,
.leaderboard-card,
.alerts-card,
.quick-stats-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-header h4 {
  color: #1e3a8a;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.85rem;
}

.chart-container {
  height: 200px;
}

.chart-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-style: italic;
}

.votes-chart {
  display: flex;
  height: 100%;
  gap: 1rem;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6b7280;
  padding-bottom: 1.5rem;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding-bottom: 1.5rem;
}

.chart-bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.chart-bar {
  width: 100%;
  background: linear-gradient(to top, #3b82f6, #60a5fa);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  min-height: 1px;
}

.chart-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
  text-align: center;
}

/* Activity Feed */
.activity-feed {
  max-height: 300px;
  overflow-y: auto;
}

.empty-activity {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item.vote {
  background: #f0f9ff;
}

.activity-item.token_used {
  background: #f0fdf4;
}

.activity-item.alert {
  background: #fef2f2;
}

.activity-item.info {
  background: #f8fafc;
}

.activity-icon {
  font-size: 1.2rem;
}

.activity-content {
  flex: 1;
}

.activity-message {
  color: #374151;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.btn-clear {
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #6b7280;
  cursor: pointer;
}

.btn-clear:hover {
  background: #e5e7eb;
}

/* Leaderboard */
.update-time {
  font-size: 0.8rem;
  color: #9ca3af;
}

.leaderboard-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-leaderboard {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.leaderboard-item:last-child {
  border-bottom: none;
}

.rank {
  width: 30px;
  height: 30px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #1e3a8a;
  margin-right: 1rem;
}

.leaderboard-item:nth-child(1) .rank {
  background: gold;
  color: #92400e;
}

.leaderboard-item:nth-child(2) .rank {
  background: silver;
  color: #374151;
}

.leaderboard-item:nth-child(3) .rank {
  background: #cd7f32;
  color: white;
}

.candidate-info {
  flex: 1;
}

.candidate-name {
  font-weight: 600;
  color: #1e3a8a;
}

.candidate-position {
  font-size: 0.8rem;
  color: #6b7280;
}

.vote-count {
  text-align: right;
  margin-right: 1rem;
}

.votes {
  font-size: 1.2rem;
  font-weight: bold;
  color: #1e3a8a;
  display: block;
}

.votes-label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.vote-bar {
  width: 100px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
}

/* Alerts */
.alert-count {
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
}

.no-alerts {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.alert-item.high {
  background: #fee2e2;
  border-left: 4px solid #dc2626;
}

.alert-item.medium {
  background: #fef3c7;
  border-left: 4px solid #d97706;
}

.alert-item.low {
  background: #dbeafe;
  border-left: 4px solid #3b82f6;
}

.alert-content {
  flex: 1;
}

.alert-message {
  color: #374151;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.alert-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.alert-dismiss {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
}

.alert-dismiss:hover {
  color: #374151;
}

/* Quick Stats */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.quick-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e3a8a;
}

/* Device Distribution */
.device-distribution {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.section-header-small {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header-small h4 {
  color: #1e3a8a;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.total-devices {
  font-size: 0.9rem;
  color: #6b7280;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.device-icon {
  font-size: 1.5rem;
}

.device-info {
  flex: 1;
}

.device-type {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.125rem;
}

.device-count {
  font-size: 0.85rem;
  color: #6b7280;
}

.device-bar {
  width: 60px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

/* Export Actions */
.export-actions {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.export-actions h4 {
  color: #1e3a8a;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.export-btn {
  flex: 1;
  min-width: 200px;
  padding: 1rem 1.5rem;
  background: #f1f5f9;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #374151;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.export-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .live-stats-banner {
    grid-template-columns: 1fr 1fr;
  }

  .connection-status {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .refresh-toggle,
  .btn-refresh {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }

  .export-btn {
    min-width: 100%;
  }
}

@media (max-width: 480px) {
  .live-stats-banner {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .device-grid {
    grid-template-columns: 1fr;
  }
}
</style>
