<template>
  <q-page class="preserv3d-page">
    <!-- Hero Section -->
    <div v-if="!showGodot" class="hero-section">
      <div class="hero-content">
        <h1 class="font-benne text-tertiary text-center title-spacing main-title">
          PRESERV<span class="text-secondary title-3d">3D</span>
        </h1>

        <div class="gallery-image-container">
          <q-img
            src="/img/gallery.png"
            alt="PRESERV3D Gallery"
            class="gallery-image"
          />
        </div>

        <p class="hero-subtitle">
          A virtual gallery that showcases PUP's archival materials, highlighting its rich culture and heritage.
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

    <!-- Godot Iframe Section -->
    <div v-if="showGodot" class="godot-section">
      <div class="godot-container">
        <!-- X Button positioned in upper right -->
        <q-btn
          flat
          icon="close"
          @click="closeGallery"
          class="exit-btn"
        />

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
          sendURLsToGodot()
        }, 1000)
      })
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

// Load file URLs from Supabase
async function loadModelUrls() {
  loading.value = true

  const { data, error } = await supabase
    .from('artifacts_view')
    .select('file_url, title, metadata')
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

  modelUrls.value = data.map((item) => ({
    url: item.file_url,
    title: item.title ?? 'Untitled',
    author: item.metadata?.author ?? 'Unknown',
    summary: item.metadata?.summary ?? 'No summary available',
    date: item.metadata?.date ?? 'Unknown date',
  }))
  console.log('Loaded model URLs:', modelUrls.value.length)
  console.log('Loaded model URLs:', modelUrls.value)
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
  background: linear-gradient(180deg, rgba(77, 0, 0, 0.90) 0%, #101010 100%);
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
  color: #FBF4D0;
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
  display: block;
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

/* Responsive Design */
@media (max-width: 1024px) {
  .main-title {
    font-size: 4rem;
  }

  .hero-content {
    gap: 2rem;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 2rem 1.5rem;
  }

  .hero-content {
    gap: 1.5rem;
  }

  .main-title {
    font-size: 3.2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
    padding: 0 1rem;
    white-space: normal;
    max-width: 90%;
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
