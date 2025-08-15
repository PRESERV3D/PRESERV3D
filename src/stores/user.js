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
    // async fetchProfile(userId) {
    //   // First, check if user is in registered_users
    //   if (userId) {
    //     let { data: userData, error: userError } = await supabase
    //       .from('registered_users')
    //       .select('*')
    //       .eq('id', userId)

    //     if (userData.length > 0) {
    //       this.profile = { ...userData[0], role: 'user' }
    //       return
    //     } else if (userError) {
    //       console.error('Error fetching user profile:', userError)
    //     }

    //     if (!userData || userData.length === 0) {
    //       // Next, check if user is in registered_admins
    //       const { data: adminData, error: adminError } = await supabase
    //         .from('registered_admins')
    //         .select('*')
    //         .eq('id', userId)

    //       if (adminData && adminData.length > 0) {
    //         this.profile = { ...adminData[0], role: 'admin' }
    //         return
    //       }

    //       if (adminError) {
    //         console.error('Error fetching admin profile:', adminError)
    //       }

    //       if (userError && adminError) {
    //         // If both queries failed, log the errors
    //         console.error('Failed to fetch profile from both tables:', userError, adminError)
    //       }
    //     }
    //   }
    // },

    async fetchProfile(userId) {
      if (!userId) return

      // Check registered_users (students)
      let { data: userData, error: userError } = await supabase
        .from('registered_users')
        .select('*')
        .eq('id', userId)

      if (userData?.length > 0) {
        this.profile = {
          ...userData[0],
          role: 'user',
          user_type: userData[0].user_type || 'student', // default if missing
        }
        return
      } else if (userError) {
        console.error('Error fetching user profile:', userError)
      }

      // Check registered_faculty
      const { data: facultyData, error: facultyError } = await supabase
        .from('registered_faculty')
        .select('*')
        .eq('id', userId)

      if (facultyData?.length > 0) {
        this.profile = {
          ...facultyData[0],
          role: 'user',
          user_type: 'faculty', // always faculty for this table
        }
        return
      }

      if (facultyError) {
        console.error('Error fetching faculty profile:', facultyError)
      }

      // Check registered_admins
      const { data: adminData, error: adminError } = await supabase
        .from('registered_admins')
        .select('*')
        .eq('id', userId)

      if (adminData?.length > 0) {
        this.profile = {
          ...adminData[0],
          role: 'admin',
          user_type: 'admin',
        }
        return
      }

      if (adminError) {
        console.error('Error fetching admin profile:', adminError)
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
      await supabase.auth.signOut()
      this.session = null
      this.profile = null
    },
  },
})
