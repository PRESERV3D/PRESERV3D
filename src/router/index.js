import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { useUserStore } from 'src/stores/user'
/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Supabase auth guard here
  Router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const allowedRoles = to.meta.allowedRoles

    // Fetch session if not already loaded
    if (!userStore.session) {
      await userStore.fetchSession()
    }

    // Get the current session
    const session = userStore.session

    // Allow phone-camera route without authentication - check name and path
    if (to.name === 'phone-camera' || to.path.includes('/phone-camera')) {
      console.log('✅ Allowing access to phone-camera page')
      next()
      return
    }

    // Allow public routes
    const publicRoutes = ['/landing', '/admin/landing', '/forgotpassword', '/resetpassword']
    if (
      publicRoutes.includes(to.path) ||
      to.path.startsWith('/user') ||
      to.path.startsWith('/admin/login') ||
      to.path.startsWith('/admin/register')
    ) {
      next()
      return
    }

    if (requiresAuth && !session) {
      next('/landing')
      return
    }

    // Get role from profile store (more reliable) or fall back to user_metadata
    const role = userStore.profile?.role || session.user.user_metadata?.role

    // Super admin check for user management - only restrict the full view
    if (to.name === 'user-management') {
      // Allow all admins to access, but the page will control what they see
      if (!session || role !== 'admin') {
        next('/admindash')
        return
      }
    }

    // Role-based redirect if landing on root path
    if (to.path === '/') {
      if (role === 'admin') {
        next('/admindash')
        return
      } else if (role === 'user') {
        next('/home')
        return
      }
    }

    // Role-based redirect if going to appointment
    if (to.path === '/appointment') {
      if (role === 'admin') {
        next('/admin/appointments')
        return
      } else if (role === 'user') {
        next()
        return
      }
    }

    // Role-based access control (for non-super-admin routes)
    if (requiresAuth && allowedRoles) {
      if (!allowedRoles.includes(role)) {
        alert('Unauthorized access')
        next('/')
        return
      }
    }

    next()
  })

  return Router
})
