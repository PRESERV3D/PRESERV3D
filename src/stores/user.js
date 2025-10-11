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

      supabase.auth.onAuthStateChange((_, session) => {
        this.session = session
        if (session?.user) {
          this.fetchUserAndProfile()
        } else {
          this.profile = null
        }
      })
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

    async fetchProfile(userId) {
      if (!userId) return

      // Parallel queries for faster profile loading
      const [
        { data: userData, error: userError },
        { data: facultyData, error: facultyError },
        { data: adminData, error: adminError },
        { data: visitorData, error: visitorError },
      ] = await Promise.all([
        supabase.from('registered_users').select('*').eq('id', userId),
        supabase.from('registered_faculty').select('*').eq('id', userId),
        supabase.from('registered_admins').select('*').eq('id', userId),
        supabase.from('approved_visitors').select('*').eq('id', userId),
      ])

      // Check results in priority order
      if (userData?.length > 0) {
        this.profile = {
          ...userData[0],
          role: 'user',
          user_type: userData[0].user_type || 'student',
        }
        return
      } else if (userError) {
        console.error('Error fetching user profile:', userError)
      }

      if (facultyData?.length > 0) {
        this.profile = {
          ...facultyData[0],
          role: 'user',
          user_type: 'faculty',
        }
        return
      }

      if (facultyError) {
        console.error('Error fetching faculty profile:', facultyError)
      }

      if (adminData?.length > 0) {
        if (adminData[0].is_super_admin) {
          this.profile = {
            ...adminData[0],
            role: 'admin',
            user_type: 'super admin',
            is_super_admin: true,
          }
        } else {
          this.profile = {
            ...adminData[0],
            role: 'admin',
            user_type: 'admin',
            is_super_admin: false,
          }
        }
        return
      }

      if (adminError) {
        console.error('Error fetching admin profile:', adminError)
      }

      if (visitorData?.length > 0) {
        this.profile = {
          ...visitorData[0],
          role: 'user',
          user_type: 'visitor',
        }
        return
      }

      if (visitorError) {
        console.error('Error fetching admin profile:', visitorError)
      }

      // If all fail
      console.warn('No matching profile found for user:', userId)
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
      try {
        console.log('🔒 Starting sign out process...')

        // Clear local state first
        this.session = null
        this.profile = null

        // Sign out from Supabase (use 'global' to clear all sessions across devices)
        const { error } = await supabase.auth.signOut({ scope: 'global' })

        if (error) {
          console.error('Error during Supabase sign out:', error)
          // Don't throw - continue with cleanup
        }

        // Clear all Supabase auth storage
        const authKeys = Object.keys(localStorage).filter(
          (key) => key.startsWith('sb-') || key.includes('supabase'),
        )
        authKeys.forEach((key) => localStorage.removeItem(key))

        // Clear session storage
        sessionStorage.clear()

        // Clear any remaining auth tokens
        localStorage.removeItem('supabase.auth.token')

        console.log('✅ Sign out completed successfully')
        return true
      } catch (error) {
        console.error('Sign out failed:', error)
        // Force clear even on error
        this.session = null
        this.profile = null

        // Clear storage even on error
        localStorage.clear()
        sessionStorage.clear()

        return true // Return true to allow navigation
      }
    },
  },
})
