<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Gallery</h2>
      <h5 class="q-mt-xs q-mb-lg">Lorem ipsum dolor sit, amet consectetur adipisicing elit.</h5>
    </div>

    <!-- Start Button Section -->
    <div v-if="!showGodot" class="start-section">
      <div class="text-center q-pa-xl">
        <div class="q-mb-lg">
          <q-icon name="view_in_ar" size="4rem" color="primary" />
        </div>
        <h4 class="q-mb-md">3D Model Gallery</h4>
        <p class="q-mb-xl text-grey-7">
          Explore interactive 3D models in our gallery.
          {{ modelUrls.length }} models are ready to view.
        </p>
        <q-btn
          size="lg"
          color="primary"
          icon="play_arrow"
          label="Start Gallery"
          @click="startGallery"
          :loading="loading"
          :disable="modelUrls.length === 0"
        />
        <div v-if="loading" class="q-mt-md text-grey-6">Loading models...</div>
      </div>
    </div>

    <!-- Godot Iframe Section -->
    <div v-if="showGodot" class="godot-section">
      <div class="q-mb-md text-right">
        <q-btn flat icon="close" label="Close Gallery" @click="closeGallery" color="grey-7" />
      </div>
      <iframe
        ref="godotIframe"
        :src="godotIframeSrc"
        width="100%"
        height="600"
        frameborder="0"
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"
        class="godot-iframe"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'src/boot/supabase'

const modelUrls = ref([])
const godotIframeSrc = ref('')
const godotIframe = ref(null)
const showGodot = ref(false)
const loading = ref(false)

onMounted(async () => {
  await loadModelUrls()
})

function startGallery() {
  if (modelUrls.value.length === 0) {
    console.warn('No models to display')
    return
  }

  loading.value = true

  // Set up the iframe source
  const encoded = encodeURIComponent(JSON.stringify(modelUrls.value))
  godotIframeSrc.value = `/godot_gallery/Gallery.html?models=${encoded}`

  // Show the Godot iframe
  showGodot.value = true

  // Wait for iframe to be rendered, then set up event listener
  setTimeout(() => {
    if (godotIframe.value) {
      godotIframe.value.addEventListener('load', () => {
        console.log('iframe loaded, sending URLs to Godot')
        loading.value = false
        // Add a small delay to ensure Godot is fully initialized
        setTimeout(() => {
          sendUrlsToGodot()
        }, 1000)
      })
    }
  }, 100)
}

function closeGallery() {
  showGodot.value = false
  godotIframeSrc.value = ''
}

function sendUrlsToGodot() {
  const iframe = godotIframe.value?.contentWindow
  if (!iframe) {
    console.error('Could not access iframe contentWindow')
    return
  }

  if (modelUrls.value.length === 0) {
    console.warn('No model URLs to send to Godot')
    return
  }

  console.log('Sending model URLs to Godot:', modelUrls.value)

  iframe.postMessage(
    {
      type: 'load_models',
      urls: modelUrls.value.map(String), // plain array of strings
    },
    '*',
  )
}

// Load file URLs from Supabase
async function loadModelUrls() {
  console.log('Loading model URLs from Supabase...')
  loading.value = true

  const { data, error } = await supabase
    .from('artifacts_view')
    .select('file_url')
    .order('views', { ascending: false })
    .limit(12)

  loading.value = false

  if (error) {
    console.error('Failed to fetch file_urls:', error)
    return
  }

  if (!data || data.length === 0) {
    console.warn('No model URLs found in database')
    return
  }

  modelUrls.value = data.map((item) => item.file_url)
  console.log('Loaded model URLs:', modelUrls.value.length)
}
</script>

<style scoped>
.start-section {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.godot-iframe {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.godot-section {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
