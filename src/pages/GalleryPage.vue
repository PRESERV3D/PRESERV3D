<template>
  <q-page class="preserv3d-page">
    <!-- Hero Section -->
    <div v-if="!showGodot" class="hero-section">
      <div class="hero-content">
        <h1 class="font-benne text-tertiary text-center title-spacing main-title">
          PRESERV<span class="text-secondary title-3d">3D</span>
        </h1>

        <div class="gallery-image-container">
          <q-img src="/img/gallery.png" alt="PRESERV3D Gallery" class="gallery-image" />
        </div>

        <p class="hero-subtitle">
          A virtual gallery that showcases PUP's archival materials, highlighting its rich culture
          and heritage.
        </p>

        <div class="button-container">
          <q-btn
            size="md"
            class="start-tour-btn"
            label="Start Tour"
            @click="startGallery"
            :loading="loading"
            :disable="modelUrls.length === 0"
            no-caps
          />
        </div>

        <div v-if="loading" class="loading-text">Loading models...</div>
      </div>
    </div>

    <!-- Warning Dialog -->
    <q-dialog v-model="showWarningDialog" persistent class="logout-confirmation-dialog">
      <q-card>
        <q-card-section class="column items-center q-gutter-y-sm dialog-header">
          <q-icon class="dialog-warning-icon" name="warning" color="amber-8" size="40px" />
          <div class="text-h6">Virtual Gallery – High Memory Usage</div>
        </q-card-section>
        <q-card-section class="text-body2 warning-message">
          The Virtual Gallery is resource-intensive and can consume a large amount of memory. On
          lower-spec devices or with many tabs open, it may become unresponsive or crash. Do you
          want to continue?
        </q-card-section>
        <q-card-section>
          <q-checkbox v-model="dontShowAgain" label="Don't show this again" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey-7" @click="cancelStartTour" />
          <q-btn unelevated label="Start Tour" color="primary" @click="confirmStartTour" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Godot Iframe Section -->
    <div v-if="showGodot" class="godot-section">
      <div class="godot-container">
        <!-- X Button positioned in upper right -->
        <q-btn flat icon="close" @click="closeGallery" class="exit-btn" />

        <iframe
          ref="godotIframe"
          :src="godotIframeSrc"
          width="100%"
          height="100%"
          frameborder="0"
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"
          class="godot-iframe"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { supabase } from 'src/boot/supabase'
import { convertToWorkingUrl } from 'src/composables/useR2Url'

const modelUrls = ref([])
const godotIframeSrc = ref('')
const godotIframe = ref(null)
const showGodot = ref(false)
const loading = ref(false)
const showWarningDialog = ref(false)
const dontShowAgain = ref(false)
const WARN_KEY = 'gallery_skip_warning'
let iframeLoadHandler = null

onMounted(async () => {
  await loadModelUrls()
})

onBeforeUnmount(() => {
  // Clean up iframe event listener
  if (godotIframe.value && iframeLoadHandler) {
    godotIframe.value.removeEventListener('load', iframeLoadHandler)
    iframeLoadHandler = null
  }
})

function startGallery() {
  if (modelUrls.value.length === 0) {
    console.warn('No models to display')
    return
  }

  const skipWarning = localStorage.getItem(WARN_KEY) === 'true'
  if (skipWarning) {
    launchGallery()
  } else {
    dontShowAgain.value = false
    showWarningDialog.value = true
  }
}

function confirmStartTour() {
  if (dontShowAgain.value) {
    localStorage.setItem(WARN_KEY, 'true')
  }
  showWarningDialog.value = false
  launchGallery()
}

function cancelStartTour() {
  showWarningDialog.value = false
}

function launchGallery() {
  loading.value = true

  // Send optimized data to Godot
  const optimizedData = modelUrls.value.map((model) => ({
    url: model.url,
    title: model.title,
    author: model.author,
    summary: model.summary || `${model.title} by ${model.author}`,
    date: model.date,
  }))

  const encoded = encodeURIComponent(JSON.stringify(optimizedData))
  godotIframeSrc.value = `/godot_gallery/Gallery.html?models=${encoded}`

  showGodot.value = true

  setTimeout(() => {
    if (godotIframe.value) {
      // Remove old listener if exists
      if (iframeLoadHandler) {
        godotIframe.value.removeEventListener('load', iframeLoadHandler)
      }

      // Create new listener
      iframeLoadHandler = () => {
        console.log('Godot gallery loaded')
        loading.value = false
        setTimeout(() => {
          sendURLsToGodot()
        }, 500) // Reduced delay
      }

      godotIframe.value.addEventListener('load', iframeLoadHandler)
    }
  }, 100)
}

function closeGallery() {
  showGodot.value = false
  godotIframeSrc.value = ''
}

function sendURLsToGodot() {
  const iframe = godotIframe.value?.contentWindow
  if (!iframe) {
    console.error('Could not access iframe contentWindow')
    return
  }

  if (modelUrls.value.length === 0) {
    console.warn('No model URLs to send to Godot')
    return
  }

  // Deep clone to remove Proxy wrappers
  const cleanModelUrls = JSON.parse(JSON.stringify(modelUrls.value))

  console.log('Sending model URLs to Godot:', cleanModelUrls)

  iframe.postMessage(
    {
      type: 'load_models',
      models: cleanModelUrls,
    },
    '*',
  )
}

// Enhanced caching with change detection
const CACHE_KEY = 'gallery_models_cache'
const CACHE_TIMESTAMP_KEY = 'gallery_models_timestamp'
const CACHE_VERSION_KEY = 'gallery_cache_version'
const CACHE_HASH_KEY = 'gallery_models_hash'
const CACHE_VERSION = '1.2'
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

// Generate hash from model data to detect changes
function generateModelsHash(models) {
  const hashData = models.map((model) => ({
    id: model.id,
    url: model.url,
    title: model.title,
    author: model.author,
    date: model.date,
  }))
  return btoa(JSON.stringify(hashData))
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 32)
}

function getValidCachedData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    const version = localStorage.getItem(CACHE_VERSION_KEY)
    const cachedHash = localStorage.getItem(CACHE_HASH_KEY)

    if (!cached || !timestamp || version !== CACHE_VERSION || !cachedHash) {
      clearModelCache()
      return null
    }

    const age = Date.now() - parseInt(timestamp)
    if (age > CACHE_DURATION) {
      clearModelCache()
      return null
    }

    return {
      models: JSON.parse(cached),
      hash: cachedHash,
    }
  } catch (error) {
    console.warn('Cache read error:', error)
    clearModelCache()
    return null
  }
}

function cacheModelData(models) {
  try {
    const hash = generateModelsHash(models)
    localStorage.setItem(CACHE_KEY, JSON.stringify(models))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
    localStorage.setItem(CACHE_HASH_KEY, hash)
    console.log('Models cached successfully with hash:', hash)
  } catch (error) {
    console.warn('Cache write error:', error)
  }
}

function clearModelCache() {
  ;[CACHE_KEY, CACHE_TIMESTAMP_KEY, CACHE_VERSION_KEY, CACHE_HASH_KEY].forEach((key) =>
    localStorage.removeItem(key),
  )
}

// Check if cached data is still valid by comparing with fresh data
async function isCacheStillValid(cachedData) {
  try {
    // Fetch fresh data for comparison
    const { data: freshData, error } = await supabase
      .from('artifacts_view')
      .select('item_id, file_url, title, metadata->author, metadata->summary, metadata->date')
      .order('views', { ascending: false })
      .limit(10)

    if (error || !freshData?.length) {
      console.warn('Could not fetch fresh data for cache validation')
      return true // Keep cache if we can't validate
    }

    const processedFreshModels = await Promise.all(
      freshData.map(async (item) => {
        let workingUrl = item.file_url

        try {
          if (item.file_url) {
            workingUrl = await convertToWorkingUrl(item.file_url)
          }
        } catch (err) {
          console.warn('Could not convert URL for cache validation:', item.item_id, err)
        }

        return {
          id: item.item_id,
          url: workingUrl,
          title: item.title || 'Untitled',
          author: item.author || 'Unknown',
          summary: item.summary || '',
          date: item.date || '',
        }
      }),
    )

    const freshHash = generateModelsHash(processedFreshModels)
    const cacheIsValid = freshHash === cachedData.hash

    if (!cacheIsValid) {
      console.log('Cache invalidated - data has changed')
      console.log('Cached hash:', cachedData.hash)
      console.log('Fresh hash:', freshHash)
    }

    return cacheIsValid
  } catch (error) {
    console.warn('Error validating cache:', error)
    return true // Keep cache if validation fails
  }
}

// Load file URLs from Supabase with enhanced caching
async function loadModelUrls() {
  loading.value = true

  // Check cache first
  const cachedData = getValidCachedData()
  if (cachedData) {
    console.log('Checking if cached data is still valid...')

    // Validate cache against fresh data
    const cacheValid = await isCacheStillValid(cachedData)

    if (cacheValid) {
      modelUrls.value = cachedData.models
      loading.value = false
      console.log('Loaded', cachedData.models.length, 'models from valid cache')
      return
    } else {
      console.log('Cache invalidated, fetching fresh data...')
      clearModelCache()
    }
  }

  try {
    const { data, error } = await supabase
      .from('artifacts_view')
      .select('item_id, file_url, title, metadata->author, metadata->summary, metadata->date')
      .order('views', { ascending: false })
      .limit(10)

    loading.value = false

    if (error) throw error

    if (!data?.length) {
      console.warn('No models found')
      return
    }

    const processedModels = await Promise.all(
      data.map(async (item) => {
        let workingUrl = item.file_url

        try {
          if (item.file_url) {
            workingUrl = await convertToWorkingUrl(item.file_url)
          }
        } catch (err) {
          console.warn('Could not convert gallery model URL:', item.item_id, err)
        }

        return {
          id: item.item_id,
          url: workingUrl,
          title: item.title || 'Untitled',
          author: item.author || 'Unknown',
          summary: item.summary || '',
          date: item.date || '',
        }
      }),
    )

    modelUrls.value = processedModels
    cacheModelData(processedModels)

    console.log('Loaded', processedModels.length, 'models from database')
  } catch (error) {
    console.error('Failed to load models:', error)
    loading.value = false
  }
}
</script>

<style scoped>
@font-face {
  font-family: 'Benne';
  src: url('src/assets/fonts/Benne.ttf') format('truetype');
}

.font-benne {
  font-family: 'Benne', serif;
}

.preserv3d-page {
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(77, 0, 0, 0.9) 0%, #101010 100%);
  position: relative;
  overflow-x: hidden;
}

/* Hero Section */
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* Title Styling */
.main-title {
  font-size: 6rem;
  margin: 0.25rem;
  line-height: 1.1;
  letter-spacing: 0.75rem;
}

.title-3d {
  color: #ffd700;
  font-weight: 600;
}

/* Gallery Image Container */
.gallery-image-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: -5.5rem 0 1rem 0;
}

.gallery-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
}

/* Hero Subtitle */
.hero-subtitle {
  font-size: 1.1rem;
  color: #fbf4d0;
  line-height: 1.4;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
  font-weight: 300;
  max-width: 800px;
  margin: -0.5rem 0 0 0;
  text-align: center;
  white-space: nowrap;
}

/* Button Container */
.button-container {
  margin: 1rem 0;
}

.start-tour-btn {
  background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%);
  color: #2d1810;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  padding: 1rem 3rem;
  border-radius: 10px;
  box-shadow:
    0 8px 32px rgba(212, 175, 55, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  border: none;
  text-transform: none;
  letter-spacing: 0.025em;
}

.start-tour-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 40px rgba(212, 175, 55, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, #ffd700 0%, #d4af37 100%);
}

.start-tour-btn:active {
  transform: translateY(0);
}

.loading-text {
  color: #d4af37;
  font-size: 1rem;
  opacity: 0.8;
  margin: 0;
}

/* Godot Section - Fullscreen*/
.godot-section {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  animation: fadeIn 0.5s ease-in-out;
  background: #000;
}

.godot-container {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background: #000;
}

.exit-btn {
  position: absolute;
  top: 10px;
  right: 30px;
  z-index: 10000;
  background: rgba(212, 175, 55, 0.1);
  color: #8a8a8a;
  border: 1px solid rgb(89, 89, 89);
  border-radius: 25px;
  padding: 0.5rem 1.2rem;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.exit-btn:hover {
  background: rgba(212, 175, 55, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
}

.godot-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .main-title {
    font-size: 4.5rem;
  }

  .hero-content {
    gap: 2rem;
  }

  .start-tour-btn {
    font-size: 1.1rem;
    padding: 0.9rem 2.5rem;
  }

  .exit-btn {
    top: 15px;
    right: 15px;
    padding: 0.6rem 1.4rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .hero-content {
    gap: 1.2rem;
  }

  .main-title {
    font-size: 3.2rem;
  }

  .hero-subtitle {
    font-size: 0.95rem;
    padding: 0 1rem;
    white-space: normal;
    max-width: 90%;
  }

  .start-tour-btn {
    font-size: 1rem;
    padding: 0.9rem 2.5rem;
  }

  .exit-btn {
    top: 15px;
    right: 15px;
    padding: 0.6rem 1.4rem;
    font-size: 0.9rem;
  }

  .godot-container {
    border: none;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 1.5rem 1rem;
  }

  .hero-content {
    gap: 1.2rem;
  }

  .main-title {
    font-size: 2.8rem;
  }

  .hero-subtitle {
    font-size: 0.95rem;
    padding: 0 0.5rem;
    white-space: normal;
    max-width: 95%;
  }

  .start-tour-btn {
    font-size: 1rem;
    padding: 0.8rem 2rem;
  }

  .exit-btn {
    top: 10px;
    right: 10px;
    padding: 0.6rem 1.4rem;
    font-size: 0.9rem;
  }

  .godot-container {
    border: none;
  }
}

@media (max-width: 360px) {
  .main-title {
    font-size: 2.4rem;
  }

  .hero-subtitle {
    font-size: 0.95rem;
  }

  .start-tour-btn {
    padding: 0.7rem 1.8rem;
    font-size: 0.95rem;
  }

  .godot-container {
    border: none;
  }
}
</style>
