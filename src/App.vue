<template>
  <router-view />
</template>

<script setup>
import { useUserStore } from 'src/stores/user'
import { trackAuthChanges } from '/services/auth_service.js'
import { onMounted } from 'vue'

onMounted(async () => {
  const userStore = useUserStore()
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
})
</script>
