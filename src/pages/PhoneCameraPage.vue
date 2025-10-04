<template>
  <q-layout view="lHh lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center column q-pa-md">
        <div v-if="!showSuccess" class="connection-card">
          <h5>Connect Phone Camera</h5>

          <q-input v-model="connectionCode" label="Connection Code" outlined class="q-mb-md" />

          <q-btn
            label="Connect"
            color="primary"
            @click="connectToLaptop"
            :loading="connectionStatus === 'waiting'"
          />

          <div v-if="errorMessage" class="text-negative q-mt-md">
            {{ errorMessage }}
          </div>
        </div>

        <div v-else class="success-message">
          <q-icon name="check_circle" size="64px" color="positive" />
          <h6>Connected!</h6>
          <p>Your phone camera is now connected to your laptop.</p>
          <p class="text-caption">Keep this page open.</p>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useWebRTC } from '../composables/useWebRTC'

const route = useRoute()
const { initializeClientConnection, connectionStatus } = useWebRTC()

const connectionCode = ref('')
const showSuccess = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  // Get connection code from URL
  const code = route.query.code

  if (code) {
    connectionCode.value = code
    await connectToLaptop()
  }
})

async function connectToLaptop() {
  try {
    errorMessage.value = ''
    await initializeClientConnection(connectionCode.value)
    showSuccess.value = true
  } catch (error) {
    console.error('Connection failed:', error)
    errorMessage.value = error.message || 'Failed to connect. Please check the code and try again.'
  }
}
</script>

<style scoped>
.q-page {
  min-height: 100vh;
}
</style>
