<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  console.log('User:', authStore.user)
  console.log('Session:', authStore.session)
  console.log('LocalStorage:', {
    user: localStorage.getItem('smanda_user'),
    session: localStorage.getItem('smanda_session'),
    admin: localStorage.getItem('smanda_admin'),
  })
})
</script>
