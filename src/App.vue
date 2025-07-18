<template>
  <router-view />
</template>

<script setup>
import { useUserStore } from 'src/stores/user'
import { onMounted } from 'vue'

onMounted(() => {
  const userStore = useUserStore()
  userStore.initSessionListener()
})
</script>
