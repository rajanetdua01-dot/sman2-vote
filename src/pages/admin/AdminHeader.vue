<template>
  <div class="admin-header">
    <div class="header-left">
      <h1>Dashboard Admin</h1>
      <p>Panel Kontrol Sistem Voting SMANDA</p>
      <div class="session-info" v-if="activeSession">
        <span class="session-badge">Sesi: {{ activeSession.nama_sesi }}</span>
        <span class="status-badge" :class="activeSession.status">{{
          activeSession.status.toUpperCase()
        }}</span>
      </div>
    </div>
    <div class="header-right">
      <div class="admin-info" v-if="adminUser">
        <div class="admin-avatar">
          {{ getAdminInitials(adminUser.nama_lengkap) }}
        </div>
        <div class="admin-details">
          <strong>{{ adminUser.nama_lengkap }}</strong>
          <span class="role-badge">{{ adminUser.peran }}</span>
        </div>
      </div>
      <button @click="logoutAdmin" class="logout-btn">Logout</button>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable-next-line no-unused-vars */
const props = defineProps({
  activeSession: Object,
  adminUser: Object,
})

const emit = defineEmits(['logout'])

const getAdminInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const logoutAdmin = () => {
  emit('logout')
}
</script>

<style scoped>
.admin-header {
  background: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 12px;
}

.header-left h1 {
  color: #1e3a8a;
  margin-bottom: 0.25rem;
  font-size: 1.8rem;
}

.header-left p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.session-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
}

.session-badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.draft {
  background: #f1f5f9;
  color: #64748b;
}

.status-badge.pendaftaran {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.voting {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.selesai {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border-radius: 8px;
}

.admin-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
}

.admin-details {
  display: flex;
  flex-direction: column;
}

.role-badge {
  background: #1e3a8a;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  align-self: flex-start;
  margin-top: 0.25rem;
}

.logout-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #b91c1b;
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    align-items: stretch;
    padding: 1rem;
  }

  .header-right {
    flex-direction: column;
    gap: 1rem;
  }

  .logout-btn {
    width: 100%;
    text-align: center;
  }
}
</style>
