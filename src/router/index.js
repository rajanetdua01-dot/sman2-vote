import { createRouter, createWebHistory } from 'vue-router'

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

    // ===== USER ROUTES =====
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

    // ===== ADMIN ROUTES =====
    // ✅ ROUTE UTAMA BARU
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard,
      meta: {
        title: 'Dashboard Admin',
        requiresAuth: true,
        allowedRoles: ['admin', 'panitia'],
      },
    },

    // ✅ SUB-ROUTES ADMIN
    {
      path: '/admin/peserta',
      name: 'adminPeserta',
      component: AdminPeserta,
      meta: {
        title: 'Data Peserta - Admin',
        requiresAuth: true,
        allowedRoles: ['admin', 'panitia'],
      },
    },
    {
      path: '/admin/token',
      name: 'adminToken',
      component: AdminToken,
      meta: {
        title: 'Token Voting - Admin',
        requiresAuth: true,
        allowedRoles: ['admin', 'panitia'],
      },
    },
    {
      path: '/admin/kandidat',
      name: 'adminKandidat',
      component: AdminKandidat,
      meta: {
        title: 'Data Kandidat - Admin',
        requiresAuth: true,
        allowedRoles: ['admin', 'panitia'],
      },
    },

    // ✅ BACKWARD COMPATIBILITY - route lama tetap bekerja
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

    // ===== 404 FALLBACK =====
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: PageNotFound,
      meta: { title: 'Halaman Tidak Ditemukan' },
    },
  ],
})

// Enhanced navigation guard dengan debug logging
router.beforeEach((to, from, next) => {
  console.log('🛡️ Router Guard:', {
    from: from.name,
    to: to.name,
    requiresAuth: to.meta?.requiresAuth,
  })

  // Set page title
  document.title = to.meta?.title || 'SMANDA VOTE'

  // Skip auth check untuk public routes
  if (!to.meta?.requiresAuth) {
    console.log('✅ Public route, allowing access')
    next()
    return
  }

  // Check authentication
  const adminSession = localStorage.getItem('smanda_admin')
  const userSession = localStorage.getItem('smanda_user')
  const voterSession = localStorage.getItem('smanda_voter')

  console.log('🔐 Auth Check:', {
    hasAdminSession: !!adminSession,
    hasUserSession: !!userSession,
    hasVoterSession: !!voterSession,
  })

  // ✅ Admin bisa akses semua admin pages
  if (adminSession) {
    try {
      const session = JSON.parse(adminSession)
      const adminName = session.user?.nama_lengkap || 'Admin'
      console.log(`👑 Admin session detected: ${adminName}`)

      // Admin bisa akses SEMUA routes admin
      if (to.path.startsWith('/admin')) {
        console.log('✅ Admin accessing admin route, allowing')
        next()
        return
      }

      // Admin bisa test voting/scan
      if (to.name === 'voting' || to.name === 'scan') {
        console.log('👑 Admin testing voting/scan, allowing')
        next()
        return
      }
    } catch (error) {
      console.error('❌ Error parsing admin session:', error)
      localStorage.removeItem('smanda_admin')
      next({ name: 'adminLogin' })
      return
    }
  }

  // ✅ Check voter session for voting page
  if (to.name === 'voting' && voterSession) {
    try {
      const voterData = JSON.parse(voterSession)
      console.log('✅ Voter session valid, token:', voterData.token)
      next()
      return
    } catch {
      console.log('❌ Invalid voter session, clearing')
      localStorage.removeItem('smanda_voter')
    }
  }

  // Jika tidak ada session sama sekali
  if (!adminSession && !userSession && !voterSession) {
    console.log('❌ No session found, redirecting to login')

    // Redirect berdasarkan tipe route
    if (to.path.startsWith('/admin')) {
      next({ name: 'adminLogin' })
    } else if (to.meta.allowedRoles?.includes('calon')) {
      next({ name: 'loginCalon' })
    } else if (to.meta.allowedRoles?.includes('pemilih')) {
      next({ name: 'scan' })
    } else {
      next({ name: 'home' })
    }
    return
  }

  // Jika ada session tapi bukan admin
  if (userSession) {
    try {
      const user = JSON.parse(userSession)
      console.log('👤 User session detected, role:', user.peran)

      // User bisa akses calon routes
      if (to.meta.allowedRoles?.includes('calon') && user.peran === 'guru') {
        console.log('✅ User accessing calon route, allowing')
        next()
        return
      }

      // User dengan voter session bisa akses voting
      if (to.meta.allowedRoles?.includes('pemilih') && voterSession) {
        console.log('✅ User with voter session accessing voting, allowing')
        next()
        return
      }
    } catch (error) {
      console.error('❌ Error parsing user session:', error)
      localStorage.removeItem('smanda_user')
      localStorage.removeItem('smanda_session')
      next({ name: 'loginCalon' })
      return
    }
  }

  // Jika sampai sini berarti gak punya akses
  console.log('❌ Access denied, redirecting based on session')

  if (adminSession) {
    next({ name: 'admin' })
  } else if (userSession) {
    next({ name: 'dashboardCalon' })
  } else if (voterSession) {
    next({ name: 'voting' })
  } else {
    next({ name: 'home' })
  }
})

// Global error handler
router.onError((error) => {
  console.error('🚨 Router Error:', error)
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    window.location.href = '/'
  }
})

export default router
