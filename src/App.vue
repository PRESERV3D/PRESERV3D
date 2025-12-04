<template>
  <router-view />
</template>

<script setup>
import { useUserStore } from 'src/stores/user'
import { trackAuthChanges } from '/services/auth_service.js'
import { onMounted, onErrorCaptured } from 'vue'

onMounted(async () => {
  const userStore = useUserStore()

  try {
    userStore.initSessionListener()
    trackAuthChanges()

    // Monitor performance metrics in development
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      try {
        const { startMonitoring } = await import('src/utils/performance')
        startMonitoring()
      } catch {
        // Performance monitoring optional
      }
    }
  } catch (error) {
    console.error('❌ App initialization error:', error)
  }
})

// Global error handler to catch unhandled promise rejections
onErrorCaptured((err, instance, info) => {
  console.error('❌ Global error caught:', err, info)
  // Return false to prevent error propagation
  return false
})

// Handle unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason)
    event.preventDefault() // Prevent the default browser error
  })
}
</script>
