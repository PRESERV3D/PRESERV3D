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

    const userStore = useUserStore()

    if (!userStore.session) {
      await userStore.fetchSession()
    }

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const allowedRoles = to.meta.allowedRoles
    const session = userStore.session

    if (requiresAuth && !session) {
      next('/landing')
      return
    }

    // Role-based redirect if landing on root path
    if (to.path === '/') {
      const role = session.user.user_metadata?.role
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
      const role = session.user.user_metadata?.role
      if (role === 'admin') {
        next('/admin/appointments')
        return
      } else if (role === 'user') {
        next()
        return
      }
    }

    // Role-based access control
    if (requiresAuth && allowedRoles) {
      const role = session.user.user_metadata?.role
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
