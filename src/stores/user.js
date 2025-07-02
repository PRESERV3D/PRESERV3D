import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

export const useUserStore = defineStore('user', {
  state: () => ({
    session: null,
    profile: null, // Includes full profile + role
  }),

  actions: {
    // Automatically initialize session and profile
    initSessionListener() {
      supabase.auth.getSession().then(({ data: { session } }) => {
        this.session = session
        if (session?.user) {
          this.fetchProfile(session.user.id)
        }
      })

      supabase.auth.onAuthStateChange((_, session) => {
        this.session = session
        if (session?.user) {
          this.fetchProfile(session.user.id)
        } else {
          this.profile = null
        }
      })
    },

    // Fetch user or admin profile
    async fetchProfile(userId) {
      // First, check if user is in registered_users
      let { data: userData, error: userError } = await supabase
        .from('registered_users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userData) {
        this.profile = { ...userData, role: 'user' }
        return
      }

      // Next, check if user is in registered_admins
      const { data: adminData, error: adminError } = await supabase
        .from('registered_admins')
        .select('*')
        .eq('id', userId)
        .single()

      if (adminData) {
        this.profile = { ...adminData, role: 'admin' }
        return
      }

      console.error('Failed to fetch profile from both tables:', userError || adminError)
      this.profile = null
    },

    // Manually fetch session + profile (e.g., on page reload)
    async fetchSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      this.session = session

      if (session?.user) {
        await this.fetchProfile(session.user.id)
      }
    },

    async signOut() {
      await supabase.auth.signOut()
      this.session = null
      this.profile = null
    },
  },
})
