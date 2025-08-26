<template>
  <router-view />
</template>

<script setup>
import { useUserStore } from 'src/stores/user'
import { trackAuthChanges } from '/services/auth_service.js'
import { onMounted } from 'vue'

onMounted(() => {
  const userStore = useUserStore()
  userStore.initSessionListener()
  trackAuthChanges()
})
</script>
