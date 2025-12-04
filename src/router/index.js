import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { useUserStore } from 'src/stores/user'
import { supabase } from 'boot/supabase'
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

  // Helper function to add timeout to promises
  const withTimeout = (promise, timeoutMs = 5000, errorMsg = 'Operation timed out') => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), timeoutMs)),
    ])
  }

  // Supabase auth guard here
  Router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const allowedRoles = to.meta.allowedRoles

    try {
      // Skip auth checks if user is signing out
      if (userStore.isSigningOut) {
        console.log('🔒 User is signing out, allowing navigation')
        next()
        return
      }

      // Fetch session if not already loaded (with 5s timeout)
      if (!userStore.session) {
        try {
          await withTimeout(userStore.fetchSession(), 5000, 'Session fetch timed out')
        } catch (sessionError) {
          console.error('⚠️ Session fetch failed:', sessionError)
          // Continue without session - public routes will still work
        }
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
      const publicRoutes = ['/landing', '/forgotpassword', '/resetpassword']
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
        console.log('🔒 No session found for protected route, redirecting to landing')
        // Double-check session hasn't just loaded
        const {
          data: { session: freshSession },
        } = await supabase.auth.getSession()
        if (freshSession) {
          console.log('✅ Fresh session found, allowing navigation')
          userStore.session = freshSession
          next()
          return
        }
        next('/landing')
        return
      }

      // Ensure profile is loaded before checking role-based access
      if (session && !userStore.profile) {
        console.log('⏳ Waiting for profile to load...')
        try {
          await withTimeout(
            userStore.fetchProfile(session.user.id),
            5000,
            'Profile fetch timed out',
          )
        } catch (profileError) {
          console.error('⚠️ Profile fetch failed:', profileError)
          // If profile loading fails for protected routes, redirect to landing
          if (requiresAuth) {
            console.log('🔒 Redirecting to landing due to profile load failure')
            next('/landing')
            return
          }
        }
      }

      // Get role from profile store (more reliable) or fall back to user_metadata
      const role = userStore.profile?.role || session.user.user_metadata?.role

      // Explicit check for user-management route - block non-admins
      if (to.path.startsWith('/user-management') || to.name === 'user-management') {
        console.log('🔒 User-management access check:', { role, profile: userStore.profile })
        if (role !== 'admin') {
          console.log('❌ Access denied to user-management for role:', role)
          userStore.addNotification({
            type: 'negative',
            message: 'You do not have permission to access this page',
            position: 'top',
          })
          // Redirect based on role
          if (role === 'user') {
            next('/home')
          } else {
            next('/landing')
          }
          return
        }
        console.log('✅ Admin access granted to user-management')
      }

      // Check for security logs access - requires super admin OR security access privilege
      if (to.meta.requiresSecurityAccess) {
        console.log('🔒 Security logs access check:', {
          role,
          isSuperAdmin: userStore.profile?.is_super_admin,
          hasSecurityAccess: userStore.profile?.has_security_access,
        })

        const hasAccess =
          userStore.profile?.is_super_admin === true ||
          userStore.profile?.has_security_access === true

        if (!hasAccess) {
          console.log('❌ Access denied to security logs')
          userStore.addNotification({
            type: 'negative',
            message: 'You do not have permission to access security logs',
            position: 'top',
          })
          next('/admindash')
          return
        }
        console.log('✅ Security logs access granted')
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
          // Add notification to queue instead of using alert
          userStore.addNotification({
            type: 'negative',
            message: 'You do not have permission to access this page',
            position: 'top',
          })
          next('/home')
          return
        }
      }

      next()
    } catch (error) {
      console.error('❌ Router guard error:', error)
      // On any unhandled error, try to continue navigation
      // This prevents the app from getting completely stuck
      if (requiresAuth && !userStore.session && !userStore.isSigningOut) {
        // Verify session one more time before redirecting
        try {
          const {
            data: { session: freshSession },
          } = await supabase.auth.getSession()
          if (freshSession) {
            console.log('✅ Session recovered after error')
            userStore.session = freshSession
            next()
            return
          }
        } catch (sessionCheckError) {
          console.error('Failed to verify session:', sessionCheckError)
        }
        next('/landing')
      } else {
        next()
      }
    }
  })

  return Router
})
