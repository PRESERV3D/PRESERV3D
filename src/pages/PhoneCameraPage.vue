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

        <div v-else-if="connectionStatus === 'answered'" class="success-message">
          <q-spinner-dots size="64px" color="primary" />
          <h6>Camera Stream Sent</h6>
          <p>Waiting for device to establish connection...</p>
          <p class="text-caption">Keep this page open.</p>
          <q-btn
            label="Terminate Connection"
            color="negative"
            outline
            @click="terminateConnection"
            class="q-mt-md"
          />
        </div>

        <div v-else-if="connectionStatus === 'connected'" class="success-message">
          <q-icon name="check_circle" size="64px" color="positive" />
          <h6>Connected!</h6>
          <p>Your phone camera is now connected to your laptop.</p>
          <p class="text-caption">Keep this page open.</p>
          <q-btn
            label="Terminate Connection"
            color="negative"
            outline
            @click="terminateConnection"
            class="q-mt-md"
          />
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
const { initializeClientConnection, connectionStatus, disconnectWebRTC } = useWebRTC()

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
    connectionStatus.value = 'waiting'
    await initializeClientConnection(connectionCode.value)
    showSuccess.value = true
  } catch (error) {
    console.error('Connection failed:', error)
    errorMessage.value = error.message || 'Failed to connect. Please check the code and try again.'
    connectionStatus.value = 'failed'
  }
}

function terminateConnection() {
  disconnectWebRTC()
  showSuccess.value = false
  connectionCode.value = ''
  errorMessage.value = ''
  connectionStatus.value = 'waiting'
}
</script>

<style scoped>
.q-page {
  min-height: 100vh;
}
</style>
