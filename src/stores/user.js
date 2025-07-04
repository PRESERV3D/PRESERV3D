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
          this.fetchUserAndProfile()
        }
      })

      // supabase.auth.onAuthStateChange((_, session) => {
      //   this.session = session
      //   if (session?.user) {
      //     this.fetchUserAndProfile()
      //   } else {
      //     this.profile = null
      //   }
      // })
    },

    // Fetch user and profile data when authenticated
    async fetchUserAndProfile() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        console.error('No authenticated user:', error)
        return
      }

      await this.fetchProfile(user.id)
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

      if (!userData) {
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

        if (adminError) {
          console.error('Error fetching admin profile:', adminError)
        }
      }

      console.error('Failed to fetch profile from both tables:', userError)
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
