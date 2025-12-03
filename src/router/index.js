import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Lazy load components - SEMUA dari '@/pages/'
const HomeView = () => import('@/views/HomeView.vue')
const LoginCalon = () => import('@/pages/LoginCalon.vue')
const ScanQR = () => import('@/pages/ScanQR.vue')
const TestConnection = () => import('@/pages/TestConnection.vue')
const DashboardCalon = () => import('@/pages/DashboardCalon.vue')
const VotingPage = () => import('@/pages/VotingPage.vue')
const LiveResults = () => import('@/pages/LiveResults.vue')
const AdminLogin = () => import('@/pages/AdminLogin.vue')
const AdminDashboard = () => import('@/pages/AdminDashboard.vue')
const PageNotFound = () => import('@/pages/PageNotFound.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'SMANDA VOTE - Home' },
    },
    {
      path: '/test',
      name: 'test',
      component: TestConnection,
      meta: { title: 'Test Connection' },
    },
    {
      path: '/login-calon',
      name: 'loginCalon',
      component: LoginCalon,
      meta: { title: 'Login Calon Kandidat' },
    },
    {
      path: '/scan',
      name: 'scan',
      component: ScanQR,
      meta: { title: 'Scan QR Code' },
    },
    {
      path: '/dashboard-calon',
      name: 'dashboardCalon',
      component: DashboardCalon,
      meta: {
        title: 'Dashboard Calon',
        requiresAuth: true,
        allowedRoles: ['calon'],
      },
    },
    {
      path: '/voting',
      name: 'voting',
      component: VotingPage,
      meta: {
        title: 'Voting Page',
        requiresAuth: true,
        allowedRoles: ['pemilih'],
      },
    },
    {
      path: '/live-results',
      name: 'liveResults',
      component: LiveResults,
      meta: { title: 'Hasil Live Voting' },
    },
    {
      path: '/admin-login',
      name: 'adminLogin',
      component: AdminLogin,
      meta: { title: 'Login Admin/Panitia' },
    },
    {
      path: '/admin-dashboard',
      name: 'adminDashboard',
      component: AdminDashboard,
      meta: {
        title: 'Dashboard Admin',
        requiresAuth: true,
        allowedRoles: ['admin', 'panitia'],
      },
    },
    // Fallback route untuk 404
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: PageNotFound,
      meta: { title: 'Halaman Tidak Ditemukan' },
    },
  ],
})

// Navigation guard untuk auth
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Set page title
  const pageTitle = to.meta?.title || 'SMANDA VOTE'
  document.title = pageTitle

  // Check for admin routes first
  if (to.path.includes('/admin-')) {
    const adminSession = localStorage.getItem('smanda_admin')

    if (!adminSession && to.name !== 'adminLogin') {
      // Redirect to admin login if not authenticated
      next({ name: 'adminLogin' })
      return
    }

    if (adminSession && to.name === 'adminLogin') {
      // If already logged in as admin, redirect to dashboard
      next({ name: 'adminDashboard' })
      return
    }
  }

  // Cek jika route membutuhkan auth
  if (to.meta?.requiresAuth) {
    if (!authStore.isLoggedIn) {
      // Redirect ke login calon jika belum login
      if (to.meta.allowedRoles?.includes('calon')) {
        next({ name: 'loginCalon' })
      } else if (to.meta.allowedRoles?.includes('pemilih')) {
        next({ name: 'scan' })
      } else {
        next({ name: 'home' })
      }
      return
    }

    // Cek role jika ada requirement
    if (to.meta.allowedRoles) {
      const userRole = authStore.userRole
      const sessionType = authStore.session?.type
      let hasAccess = false

      // Logic untuk role access
      if (to.meta.allowedRoles.includes('calon') && sessionType === 'calon') {
        hasAccess = true
      }
      if (to.meta.allowedRoles.includes('pemilih') && sessionType === 'pemilih') {
        hasAccess = true
      }
      if (to.meta.allowedRoles.includes('admin') && userRole === 'admin') {
        hasAccess = true
      }
      if (to.meta.allowedRoles.includes('panitia') && userRole === 'panitia') {
        hasAccess = true
      }

      if (!hasAccess) {
        // Redirect ke home jika tidak punya akses
        next({ name: 'home' })
        return
      }
    }
  }

  next()
})

export default router
