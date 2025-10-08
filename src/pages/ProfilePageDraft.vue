<template>
  <q-page class="profile-page">
    <div class="page-container">
      <!-- Main Content -->
      <div class="profile-content">
        <component :is="currentProfileComponent" :key="userType" />
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue'

import { useUserStore } from 'src/stores/user'
import FacultyProfile from './ProfileFaculty.vue'
import StudentProfile from './ProfileStudent.vue'
import VisitorProfile from './ProfileVisitor.vue'
import AdminProfile from './ProfileAdmin.vue'

export default {
  name: 'ProfilePage',
  components: {
    FacultyProfile,
    StudentProfile,
    VisitorProfile,
    AdminProfile
  },
  setup() {

    const userStore = useUserStore()
    const userType = ref('visitor')
    const isLoading = ref(true)

    const getUserType = () => {
      console.log('🔍 Checking user session...')

      // Check Supabase session first
      if (userStore.session) {
        const role = userStore.session.user?.user_metadata?.role
        console.log('✅ Found Supabase session with role:', role)
        return role || 'visitor'
      }

      // Fallback to localStorage for development
      const userData = localStorage.getItem('userData')
      if (userData) {
        try {
          const parsed = JSON.parse(userData)
          console.log('📁 Found localStorage user data:', parsed)
          return parsed.userType || parsed.role || 'visitor'
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }

      console.log('❌ No user session found, defaulting to visitor')
      return 'visitor'
    }

    const currentProfileComponent = computed(() => {
      console.log('🎯 Rendering profile for user type:', userType.value)
      switch (userType.value) {
        case 'faculty':
          return FacultyProfile
        case 'student':
          return StudentProfile
        case 'admin':
          return AdminProfile
        case 'user':
          return StudentProfile
        default:
          return VisitorProfile
      }
    })

    onMounted(async () => {
      console.log('🚀 ProfilePage mounted')

      // Ensure we have the latest session
      if (!userStore.session) {
        console.log('🔄 Fetching session...')
        await userStore.fetchSession()
      }

      userType.value = getUserType()
      isLoading.value = false

      console.log('✅ Final user type:', userType.value)
      console.log('📊 Session data:', userStore.session)
    })

    return {
      userType,
      isLoading,
      currentProfileComponent
    }
  }
}
</script>


