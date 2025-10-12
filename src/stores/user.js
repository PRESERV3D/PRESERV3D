import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

export const useUserStore = defineStore('user', {
  state: () => ({
    session: null,
    profile: null, // Includes full profile + role
    isSigningOut: false, // Flag to prevent auth listener interference during logout
    pendingNotifications: [], // Queue for notifications to show after navigation
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
        // Skip auth state changes during logout process
        if (this.isSigningOut) {
          console.log('🔒 Skipping auth state change during logout')
          return
        }

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
        supabase
          .from('approved_visitors')
          .select(
            `
            *,
            registration_visitors (
              first_name,
              last_name,
              contact,
              institution,
              purpose,
              email
            )
          `,
          )
          .eq('user_id', userId),
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
        const visitor = visitorData[0]
        const registrationData = visitor.registration_visitors || {}

        this.profile = {
          ...visitor,
          // Merge registration data into profile
          first_name: registrationData.first_name,
          last_name: registrationData.last_name,
          contact: registrationData.contact,
          institution: registrationData.institution,
          purpose: registrationData.purpose,
          email: registrationData.email || visitor.email,
          // Keep approved_visitors data
          start_date: visitor.start_date,
          end_date: visitor.end_date,
          approved_at: visitor.approved_at,
          approved_by: visitor.approved_by,
          role: 'user',
          user_type: 'visitor',
        }
        return
      }

      if (visitorError) {
        console.error('Error fetching visitor profile:', visitorError)
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

        // Set signing out flag to prevent auth listener interference
        this.isSigningOut = true

        // Clear local state first
        this.session = null
        this.profile = null

        // Sign out from Supabase with timeout protection
        const signOutPromise = supabase.auth.signOut({ scope: 'global' })

        // Add timeout to prevent hanging (10 seconds max)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Sign out timeout')), 10000),
        )

        try {
          await Promise.race([signOutPromise, timeoutPromise])
        } catch (signOutError) {
          console.warn('Supabase sign out timed out or failed:', signOutError)
          // Continue with cleanup even if sign out fails
        }

        // Aggressive cleanup of all auth-related storage
        const authKeys = Object.keys(localStorage).filter(
          (key) =>
            key.startsWith('sb-') ||
            key.includes('supabase') ||
            key.includes('auth') ||
            key.startsWith('vueuse'), // Clear any VueUse auth storage
        )
        authKeys.forEach((key) => {
          try {
            localStorage.removeItem(key)
          } catch (e) {
            console.warn('Failed to remove localStorage key:', key, e)
          }
        })

        // Clear session storage
        try {
          sessionStorage.clear()
        } catch (e) {
          console.warn('Failed to clear sessionStorage:', e)
        }

        // Clear any remaining auth tokens
        try {
          localStorage.removeItem('supabase.auth.token')
          localStorage.removeItem('supabase.auth.refreshToken')
        } catch (e) {
          console.warn('Failed to remove auth tokens:', e)
        }

        console.log('✅ Sign out completed successfully')
        return true
      } catch (error) {
        console.error('Sign out failed:', error)
        // Force clear even on error
        this.session = null
        this.profile = null

        // Emergency cleanup
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (e) {
          console.error('Emergency cleanup failed:', e)
        }

        return true
      } finally {
        // Always clear the signing out flag
        this.isSigningOut = false
      }
    },

    // Notification queue management
    addNotification(notification) {
      this.pendingNotifications.push(notification)
    },

    getAndClearNotifications() {
      const notifications = [...this.pendingNotifications]
      this.pendingNotifications = []
      return notifications
    },
  },
})
