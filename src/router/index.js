import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from '@/stores/auth'

// Lazy load components
const HomeView = () => import('@/views/HomeView.vue')
const LoginCalon = () => import('@/pages/LoginCalon.vue')
const ScanQR = () => import('@/pages/ScanQR.vue')
const TestConnection = () => import('@/pages/TestConnection.vue')
const DashboardCalon = () => import('@/pages/DashboardCalon.vue')
const VotingPage = () => import('@/pages/VotingPage.vue')
const LiveResults = () => import('@/pages/LiveResults.vue')
const AdminLogin = () => import('@/pages/AdminLogin.vue')
const PageNotFound = () => import('@/pages/PageNotFound.vue')

// ✅ Admin Components
const AdminDashboard = () => import('@/pages/admin/AdminDashboard.vue')
const AdminPeserta = () => import('@/pages/admin/AdminPeserta.vue')
const AdminToken = () => import('@/pages/admin/AdminToken.vue')
const AdminKandidat = () => import('@/pages/admin/AdminKandidat.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ===== PUBLIC ROUTES =====
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

    // ===== PESERTA/CALON ROUTES =====
    {
      path: '/dashboard-calon',
      name: 'dashboardCalon',
      component: DashboardCalon,
      meta: {
        title: 'Dashboard Calon',
        requiresPesertaAuth: true,
      },
    },

    // ===== VOTER ROUTES (pakai token QR) =====
    {
      path: '/voting',
      name: 'voting',
      component: VotingPage,
      meta: {
        title: 'Voting Page',
        requiresTokenAuth: true, // ← Untuk voter dengan token QR
      },
    },

    // ===== ADMIN ROUTES =====
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard,
      meta: {
        title: 'Dashboard Admin',
        requiresAdminAuth: true,
      },
    },

    // ✅ SUB-ROUTES ADMIN
    {
      path: '/admin/peserta',
      name: 'adminPeserta',
      component: AdminPeserta,
      meta: {
        title: 'Data Peserta - Admin',
        requiresAdminAuth: true,
      },
    },
    {
      path: '/admin/token',
      name: 'adminToken',
      component: AdminToken,
      meta: {
        title: 'Token Voting - Admin',
        requiresAdminAuth: true,
      },
    },
    {
      path: '/admin/kandidat',
      name: 'adminKandidat',
      component: AdminKandidat,
      meta: {
        title: 'Data Kandidat - Admin',
        requiresAdminAuth: true,
      },
    },

    // ===== 404 FALLBACK =====
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: PageNotFound,
      meta: { title: 'Halaman Tidak Ditemukan' },
    },
  ],
})

// ✅ ENHANCED ROUTER GUARD
router.beforeEach(async (to, from, next) => {
  console.log('🛡️ Route:', to.path, to.meta)

  // Set page title
  document.title = to.meta?.title || 'SMANDA VOTE'

  // 1. PUBLIC ROUTES - langsung lewat
  const publicRoutes = ['/', '/test', '/login-calon', '/scan', '/live-results', '/admin-login']

  if (publicRoutes.includes(to.path)) {
    console.log('✅ Public route')
    next()
    return
  }

  // 2. GUARD UNTUK ROUTE KHUSUS
  // Import auth store di sini (harus setelah router dibuat)
  const authStore = useAuthStore()

  // A. ROUTE PESERTA/CALON
  if (to.meta.requiresPesertaAuth) {
    console.log('🔐 Checking peserta auth...')

    // Cek session peserta dari auth store (localStorage)
    const user = await authStore.checkSession()
    const isPeserta = authStore.isPeserta()

    console.log('Peserta check:', { user, isPeserta })

    if (!user || !isPeserta) {
      console.log('❌ Not authenticated as peserta, redirecting to login-calon')
      return next({ name: 'loginCalon' })
    }

    console.log('✅ Peserta authenticated')
    next()
    return
  }

  // B. ROUTE ADMIN
  if (to.meta.requiresAdminAuth) {
    console.log('🔐 Checking admin auth...')

    // Cek session admin dari Supabase Auth
    const { data } = await supabase.auth.getSession()
    const hasAdminSession = !!data.session

    console.log('Admin session:', hasAdminSession)

    if (!hasAdminSession) {
      console.log('❌ Not authenticated as admin, redirecting to admin-login')
      return next({ name: 'adminLogin' })
    }

    console.log('✅ Admin authenticated')
    next()
    return
  }

  // C. ROUTE VOTER (token QR) - ✅ DIIMPLEMENTASIKAN
  if (to.meta.requiresTokenAuth) {
    console.log('🔐 Checking token auth...')

    // Cek apakah ada session voter di localStorage
    const voterSession = localStorage.getItem('smanda_voter')

    console.log('🔍 Voter session from localStorage:', voterSession)

    if (!voterSession) {
      console.log('❌ No voter session found, redirecting to scan')
      return next({ name: 'scan' })
    }

    try {
      const voterData = JSON.parse(voterSession)

      // Validasi struktur data
      if (!voterData.token || !voterData.pengguna || !voterData.sesi_id) {
        console.log('❌ Invalid voter session data structure')
        localStorage.removeItem('smanda_voter')
        return next({ name: 'scan' })
      }

      // Optional: Validasi waktu token (jika ada timestamp di voterData)
      if (voterData.timestamp) {
        const sessionAge = new Date() - new Date(voterData.timestamp)
        const maxAge = 30 * 60 * 1000 // 30 menit

        if (sessionAge > maxAge) {
          console.log('❌ Voter session expired (30 minutes)')
          localStorage.removeItem('smanda_voter')
          return next({ name: 'scan' })
        }
      }

      console.log('✅ Voter authenticated with token:', voterData.token.substring(0, 3) + '***')
      next()
      return
    } catch (err) {
      console.error('❌ Error parsing voter session:', err)
      localStorage.removeItem('smanda_voter')
      return next({ name: 'scan' })
    }
  }

  // 3. DEFAULT: lanjutkan
  console.log('✅ Route allowed')
  next()
})

// Global error handler
router.onError((error) => {
  console.error('🚨 Router Error:', error)
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    window.location.href = '/'
  }
})

export default router
