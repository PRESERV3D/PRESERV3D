import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

export const useUserStore = defineStore('user', {
  state: () => ({
    session: null,
    profile: null,
  }),

  actions: {
    // Initialize and listen to auth state changes
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

    // Fetch user's profile
    async fetchProfile(userId) {
      const { data, error } = await supabase
        .from('registered_users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Failed to fetch profile:', error)
        this.profile = null
      } else {
        this.profile = data
      }
    },

    // Manual session fetch
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
