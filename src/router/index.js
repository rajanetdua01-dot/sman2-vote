import { createRouter, createWebHashHistory } from 'vue-router'

// Import semua pages
const HomeView = () => import('@/views/HomeView.vue')
const TestConnection = () => import('@/pages/TestConnection.vue')
const LoginCalon = () => import('@/pages/LoginCalon.vue')
const ScanQR = () => import('@/pages/ScanQR.vue')
const AdminLogin = () => import('@/pages/AdminLogin.vue')
const LiveResults = () => import('@/pages/LiveResults.vue')
const DashboardCalon = () => import('@/pages/DashboardCalon.vue')
const AdminDashboard = () => import('@/pages/AdminDashboard.vue')
const VotingPage = () => import('@/pages/VotingPage.vue')
const PageNotFound = () => import('@/pages/PageNotFound.vue')

// Routes
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'SMANDA VOTE' },
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
    meta: { title: 'Login Calon' },
  },
  {
    path: '/admin-login',
    name: 'adminLogin',
    component: AdminLogin,
    meta: { title: 'Admin Login' },
  },
  {
    path: '/scan',
    name: 'scan',
    component: ScanQR,
    meta: { title: 'Scan QR' },
  },
  {
    path: '/live-results',
    name: 'liveResults',
    component: LiveResults,
    meta: { title: 'Live Results' },
  },
  {
    path: '/dashboard-calon',
    name: 'dashboardCalon',
    component: DashboardCalon,
    meta: {
      title: 'Dashboard Calon',
      requiresAuth: true,
    },
  },
  {
    path: '/admin-dashboard',
    name: 'adminDashboard',
    component: AdminDashboard,
    meta: {
      title: 'Admin Dashboard',
      requiresAuth: true,
    },
  },
  {
    path: '/voting',
    name: 'voting',
    component: VotingPage,
    meta: {
      title: 'Voting',
      requiresAuth: true,
    },
  },
  {
    path: '/:path(.*)',
    name: 'notFound',
    component: PageNotFound,
    meta: { title: '404 - Not Found' },
  },
]

// Create router
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// Simple navigation guard
router.beforeEach((to, from, next) => {
  // Set page title
  document.title = to.meta.title || 'SMANDA VOTE'

  // Check auth for protected routes
  if (to.meta.requiresAuth) {
    const hasAdminSession = localStorage.getItem('smanda_admin')
    const hasUserSession = localStorage.getItem('smanda_user')

    if (!hasAdminSession && !hasUserSession) {
      // Redirect to appropriate login
      if (to.name === 'adminDashboard') {
        next({ name: 'adminLogin' })
      } else {
        next({ name: 'loginCalon' })
      }
      return
    }
  }

  next()
})

export default router
