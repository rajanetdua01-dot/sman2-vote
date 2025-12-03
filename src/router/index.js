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
const AdminDashboard = () => import('@/pages/AdminDashboard.vue')
const PageNotFound = () => import('@/pages/PageNotFound.vue')

const router = createRouter({
  history: createWebHistory(),
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

// Enhanced navigation guard dengan debug logging
router.beforeEach((to, from, next) => {
  console.log('🛡️ Router Guard:', {
    from: from.name,
    to: to.name,
    requiresAuth: to.meta?.requiresAuth,
    allowedRoles: to.meta?.allowedRoles,
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

  console.log('🔐 Auth Check:', {
    hasAdminSession: !!adminSession,
    hasUserSession: !!userSession,
  })

  // Jika tidak ada session sama sekali
  if (!adminSession && !userSession) {
    console.log('❌ No session found, redirecting to login')

    // Redirect berdasarkan tipe route
    if (to.meta.allowedRoles?.includes('admin')) {
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

  // Jika ada session, check role access
  let hasAccess = false
  let userRole = 'guest'

  if (adminSession) {
    try {
      const session = JSON.parse(adminSession)
      userRole = session.user?.peran || 'admin'
      console.log('👑 Admin session detected, role:', userRole)

      // Admin bisa akses admin routes
      if (to.meta.allowedRoles?.includes('admin') || to.meta.allowedRoles?.includes('panitia')) {
        hasAccess = true
      }
    } catch (error) {
      console.error('Error parsing admin session:', error)
      localStorage.removeItem('smanda_admin')
      next({ name: 'adminLogin' })
      return
    }
  }

  if (userSession) {
    try {
      const user = JSON.parse(userSession)
      userRole = user.peran || 'guru'
      console.log('👤 User session detected, role:', userRole)

      // User bisa akses calon atau pemilih routes
      if (to.meta.allowedRoles?.includes('calon') && userRole === 'guru') {
        hasAccess = true
      }
      if (to.meta.allowedRoles?.includes('pemilih') && userRole === 'guru') {
        hasAccess = true
      }
    } catch (error) {
      console.error('Error parsing user session:', error)
      localStorage.removeItem('smanda_user')
      localStorage.removeItem('smanda_session')
      next({ name: 'loginCalon' })
      return
    }
  }

  // Check final access
  if (hasAccess) {
    console.log('✅ Access granted for role:', userRole)
    next()
  } else {
    console.log('❌ Access denied for role:', userRole, 'needs:', to.meta.allowedRoles)

    // Redirect based on current session
    if (adminSession) {
      next({ name: 'adminDashboard' })
    } else if (userSession) {
      next({ name: 'dashboardCalon' })
    } else {
      next({ name: 'home' })
    }
  }
})

// Global error handler untuk router
router.onError((error) => {
  console.error('🚨 Router Error:', error)
})

export default router
