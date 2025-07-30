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
          <span v-if="modelsAreCached" class="text-positive">
            <q-icon name="cached" class="q-ml-sm" />
            Models cached - instant loading!
          </span>
        </p>
        <q-btn
          size="lg"
          color="primary"
          :icon="modelsAreCached ? 'rocket_launch' : 'play_arrow'"
          :label="modelsAreCached ? 'Launch Gallery (Instant)' : 'Start Gallery'"
          @click="startGallery"
          :loading="loading"
          :disable="modelUrls.length === 0"
        />
        <div v-if="loading" class="q-mt-md text-grey-6">
          <div class="q-mb-sm">
            {{
              modelsAreCached
                ? 'Launching gallery with cached models...'
                : 'Downloading and caching models...'
            }}
          </div>
          <q-linear-progress indeterminate color="primary" class="q-mt-sm" style="height: 4px" />
          <div class="q-mt-sm text-caption">
            {{
              modelsAreCached
                ? 'Using cached models for instant loading'
                : 'Waiting for "All models downloaded and loaded." confirmation...'
            }}
          </div>
        </div>
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

// Session-level model cache
const modelCache = new Map()
const cacheUrls = new Set()

const modelUrls = ref([])
const godotIframeSrc = ref('')
const godotIframe = ref(null)
const showGodot = ref(false)
const loading = ref(false)
const modelsAreCached = ref(false)

onMounted(async () => {
  await loadModelUrls()
  checkCacheStatus()
})

function checkCacheStatus() {
  // Check if all current model URLs are already cached
  const allCached = modelUrls.value.every((url) => cacheUrls.has(url))
  modelsAreCached.value = allCached

  if (allCached) {
    console.log('All models are already cached in session')
  } else {
    const cachedCount = modelUrls.value.filter((url) => cacheUrls.has(url)).length
    console.log(`${cachedCount}/${modelUrls.value.length} models cached`)
  }
}

async function startGallery() {
  if (modelUrls.value.length === 0) {
    console.warn('No models to display')
    return
  }

  loading.value = true

  // If models are already cached, skip the download step
  if (modelsAreCached.value) {
    console.log('Using cached models, starting gallery immediately')
    setupGodotWithCache()
  } else {
    console.log('Downloading and caching models...')
    await downloadAndCacheModels()
    setupGodotWithCache()
  }
}

async function downloadAndCacheModels(urls) {
  if (!Array.isArray(urls)) {
    console.error('Expected an array of URLs, but got:', urls)
    return
  }

  for (const url of urls) {
    if (modelCache.has(url)) {
      console.log(`Model already cached: ${url}`)
      continue
    }

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch model from ${url}`)
      }

      const data = new Uint8Array(await response.arrayBuffer())
      const filename = url.split('/').pop() || 'model.glb'

      modelCache.set(url, { filename, data })
      console.log(`Model cached: ${filename}`)
    } catch (err) {
      console.error(`Error downloading model from ${url}:`, err)
    }
  }
}

function setupGodotWithCache() {
  // Instead of URLs, we'll send the raw model data
  const encoded = encodeURIComponent(JSON.stringify(modelUrls.value))
  godotIframeSrc.value = `/godot_gallery/Gallery.html?models=${encoded}`

  // Create hidden iframe to load Godot in background
  createHiddenIframe()
}

function closeGallery() {
  showGodot.value = false
  godotIframeSrc.value = ''
  // Note: We keep the cache intact for faster subsequent loads
}

function sendUrlsToGodot() {
  if (!godotIframe.value) {
    console.error('No Godot iframe available')
    return
  }

  postModelsToIframe(godotIframe.value, modelUrls.value)
}

function createHiddenIframe() {
  // Create a hidden iframe to load Godot in background
  const hiddenIframe = document.createElement('iframe')
  hiddenIframe.src = godotIframeSrc.value
  hiddenIframe.style.position = 'absolute'
  hiddenIframe.style.left = '-9999px'
  hiddenIframe.style.width = '100%'
  hiddenIframe.style.height = '600px'
  hiddenIframe.allow = 'fullscreen'
  hiddenIframe.sandbox = 'allow-scripts allow-same-origin allow-pointer-lock allow-popups'

  document.body.appendChild(hiddenIframe)

  // Listen for console messages from the hidden iframe
  const originalConsoleLog = console.log
  console.log = function (...args) {
    const message = args.join(' ')

    // Check if this is the message we're waiting for
    if (message.includes('All models downloaded and loaded.')) {
      console.log('Godot reports all models loaded, showing gallery to user')

      // Restore original console.log
      console.log = originalConsoleLog

      // Remove hidden iframe
      document.body.removeChild(hiddenIframe)

      // Show the real iframe to user
      showGodotToUser()
      return
    }

    // Call original console.log
    originalConsoleLog.apply(console, args)
  }

  // Set up iframe load listener
  hiddenIframe.addEventListener('load', () => {
    console.log('Hidden iframe loaded, sending URLs to Godot')
    setTimeout(() => {
      sendUrlsToHiddenGodot(hiddenIframe)
    }, 1000)
  })

  // Fallback timeout in case message never comes
  setTimeout(() => {
    console.warn(
      'Timeout waiting for "All models downloaded and loaded." message, showing gallery anyway',
    )
    console.log = originalConsoleLog
    if (document.body.contains(hiddenIframe)) {
      document.body.removeChild(hiddenIframe)
    }
    showGodotToUser()
  }, 30000) // 30 second timeout
}

/**
 * Sends model URLs to a hidden Godot iframe.
 * @param {HTMLIFrameElement} iframe - The target iframe element.
 */
function sendUrlsToHiddenGodot(iframe) {
  postModelsToIframe(iframe, modelUrls.value)
}

function showGodotToUser() {
  // Show the Godot iframe to user
  showGodot.value = true
  loading.value = false

  // Set up event listener for the visible iframe
  setTimeout(() => {
    if (godotIframe.value) {
      godotIframe.value.addEventListener('load', () => {
        console.log('Visible iframe loaded, sending URLs to Godot')
        setTimeout(() => {
          sendUrlsToGodot()
        }, 1000)
      })
    }
  }, 100)
}
async function loadModelUrls() {
  console.log('Loading model URLs from Supabase...')
  loading.value = true

  const { data, error } = await supabase
    .from('top_artifacts')
    .select('file_url')
    .order('views', { ascending: false })

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
  console.log('Loaded model URLs:', modelUrls.value)
}

/**
 * Sends model data to a Godot iframe.
 * @param {HTMLIFrameElement} iframe - The target iframe element.
 * @param {string[]} modelUrls - Array of model URLs to send.
 */
function postModelsToIframe(iframe, modelUrls) {
  if (!iframe?.contentWindow) {
    console.warn('Iframe not ready to receive model data')
    return
  }

  const modelData = modelUrls.map((url, index) => {
    const cached = modelCache.get(url)
    if (cached) {
      return {
        index: index,
        filename: cached.filename,
        data: Array.from(cached.data),
        originalUrl: url,
        fromCache: true,
      }
    } else {
      return {
        index: index,
        filename: url.split('/').pop() || `model_${index}.glb`,
        url: url,
        originalUrl: url,
        fromCache: false,
      }
    }
  })

  console.log(
    `Sending ${modelData.length} models to iframe (cached: ${
      modelData.filter((m) => m.fromCache).length
    })`,
  )

  iframe.contentWindow.postMessage(
    {
      type: 'load_model_data',
      models: modelData,
    },
    '*',
  )
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
