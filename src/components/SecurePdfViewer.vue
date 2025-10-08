<template>
  <q-dialog
    v-model="isOpen"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @hide="onClose"
  >
    <q-card class="secure-pdf-viewer">
      <!-- Header with controls -->
      <q-card-section class="viewer-header row items-center q-pa-md">
        <div class="col">
          <div class="text-h6 text-white">{{ documentTitle }}</div>
          <div class="text-caption text-grey-4">{{ documentAuthor }}</div>
        </div>
        <q-space />
        <div class="row q-gutter-sm items-center">
          <q-btn
            flat
            dense
            round
            icon="zoom_out"
            color="white"
            @click="zoomOut"
            :disable="scale <= 0.5"
          />
          <span class="text-white">{{ Math.round(scale * 100) }}%</span>
          <q-btn
            flat
            dense
            round
            icon="zoom_in"
            color="white"
            @click="zoomIn"
            :disable="scale >= 3"
          />
          <q-separator vertical inset color="grey-6" />
          <q-btn flat dense round icon="close" color="white" @click="close" />
        </div>
      </q-card-section>

      <!-- PDF Canvas Container -->
      <q-card-section class="pdf-container" ref="containerRef">
        <div
          v-if="loading"
          class="absolute-center column items-center"
          style="background: rgba(0, 0, 0, 0.8)"
        >
          <q-spinner color="primary" size="3em" />
          <p class="text-white q-mt-md">Loading document...</p>
        </div>

        <div v-if="error" class="absolute-center column items-center text-center q-pa-md">
          <q-icon name="error_outline" color="negative" size="4em" />
          <p class="text-white q-mt-md">{{ error }}</p>
          <q-btn label="Close" color="primary" @click="close" class="q-mt-md" />
        </div>

        <!-- Canvas for each page -->
        <div v-if="!loading && !error" class="pages-wrapper">
          <div
            v-for="pageNum in numPages"
            :key="pageNum"
            class="page-container"
            :ref="(el) => setPageRef(el, pageNum)"
          >
            <canvas :id="`pdf-canvas-${pageNum}`"></canvas>
            <div class="page-number">Page {{ pageNum }} of {{ numPages }}</div>
            <div v-if="userInfoText" class="user-info-badge">{{ userInfoText }}</div>
          </div>
        </div>

        <!-- Watermark overlay -->
        <div v-if="!loading && !error" class="watermark-overlay">
          <div class="watermark-text">{{ watermarkText }}</div>
          <div v-if="userInfoText" class="watermark-user-info">{{ userInfoText }}</div>
        </div>
      </q-card-section>

      <!-- Footer with page navigation -->
      <q-card-section class="viewer-footer row items-center justify-center q-pa-sm">
        <q-btn
          flat
          dense
          round
          icon="keyboard_arrow_up"
          color="white"
          @click="scrollToPage(currentPage - 1)"
          :disable="currentPage <= 1"
        />
        <span class="text-white q-mx-md">Page {{ currentPage }} of {{ numPages }}</span>
        <q-btn
          flat
          dense
          round
          icon="keyboard_arrow_down"
          color="white"
          @click="scrollToPage(currentPage + 1)"
          :disable="currentPage >= numPages"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import { supabase } from 'boot/supabase'
import { useUserStore } from 'stores/user'

// Configure PDF.js worker - using local worker file for better reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const userStore = useUserStore()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  pdfUrl: {
    type: String,
    required: true,
  },
  documentId: {
    type: String,
    default: null,
  },
  documentTitle: {
    type: String,
    default: 'Document',
  },
  documentAuthor: {
    type: String,
    default: '',
  },
  watermarkText: {
    type: String,
    default: 'PRESERV3D - PUP Library',
  },
  userName: {
    type: String,
    default: '',
  },
  userEmail: {
    type: String,
    default: '',
  },
  viewedAt: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'close'])

const isOpen = ref(props.modelValue)
const loading = ref(false)
const error = ref(null)
const pdfDoc = shallowRef(null)
const numPages = ref(0)
const currentPage = ref(1)
const scale = ref(1.2)
const containerRef = ref(null)
const pageRefs = ref({})

// Security monitoring
const screenshotAttempts = ref(0)
const devToolsOpen = ref(false)

// Track rendering tasks to cancel them if needed
const renderingTasks = ref({})

// Generate user info text for watermark
const userInfoText = computed(() => {
  const parts = []
  if (props.userName) parts.push(props.userName)
  if (props.viewedAt) parts.push(props.viewedAt)
  return parts.join(' • ')
})

// Watch for prop changes
watch(
  () => props.modelValue,
  (newVal) => {
    isOpen.value = newVal
    if (newVal) {
      loadPdf()
      enableSecurityMeasures()
    } else {
      disableSecurityMeasures()
    }
  },
)

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal)
})

watch(scale, async () => {
  if (pdfDoc.value) {
    // Cancel any ongoing rendering tasks
    Object.values(renderingTasks.value).forEach((task) => {
      try {
        if (task && typeof task.cancel === 'function') {
          task.cancel()
        }
      } catch (error) {
        // Silently ignore cancellation errors (task may already be complete)
        console.debug('Could not cancel rendering task:', error.message)
      }
    })
    renderingTasks.value = {}

    // Re-render all pages with new scale
    await nextTick()
    await renderAllPages()
  }
})

const setPageRef = (el, pageNum) => {
  if (el) {
    pageRefs.value[pageNum] = el
  }
}

const loadPdf = async () => {
  loading.value = true
  error.value = null

  try {
    const loadingTask = pdfjsLib.getDocument({
      url: props.pdfUrl,
      withCredentials: false,
    })

    pdfDoc.value = await loadingTask.promise
    numPages.value = pdfDoc.value.numPages

    // Wait for loading to be false first so v-if can render the canvas elements
    loading.value = false

    // Wait for DOM to update with all canvas elements
    await nextTick()

    // Wait for canvases to be available in the DOM
    await waitForCanvases()

    await renderAllPages()

    // Add scroll listener after PDF is fully loaded
    await nextTick()
    if (containerRef.value) {
      const container = containerRef.value.$el || containerRef.value
      container.addEventListener('scroll', handleScroll)
    }
  } catch (err) {
    console.error('Error loading PDF:', err)
    error.value = 'Failed to load PDF document. Please try again.'
    loading.value = false
  }
}

const waitForCanvases = async () => {
  // Poll for canvas elements to be available (max 2 seconds)
  const maxAttempts = 20
  const delayMs = 100

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const canvas1 = document.getElementById('pdf-canvas-1')
    if (canvas1) {
      console.log('Canvas elements are ready in DOM')
      return
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  console.warn('Canvas elements not found after waiting')
}

const renderAllPages = async () => {
  if (!pdfDoc.value) return

  for (let pageNum = 1; pageNum <= numPages.value; pageNum++) {
    await renderPage(pageNum)
  }
}

const renderPage = async (pageNum) => {
  try {
    // Cancel previous rendering task for this page if it exists
    if (renderingTasks.value[pageNum]) {
      try {
        if (typeof renderingTasks.value[pageNum].cancel === 'function') {
          renderingTasks.value[pageNum].cancel()
        }
      } catch (error) {
        // Silently ignore cancellation errors
        console.debug('Could not cancel previous rendering task:', error.message)
      }
    }

    const page = await pdfDoc.value.getPage(pageNum)

    const canvas = document.getElementById(`pdf-canvas-${pageNum}`)
    if (!canvas && canvas !== 0) {
      console.warn(`Canvas for page ${pageNum} not found in DOM yet`)
      return
    }

    const context = canvas.getContext('2d', { willReadFrequently: false })
    if (!context) {
      console.error(`Could not get 2d context for canvas ${pageNum}`)
      return
    }

    const viewport = page.getViewport({ scale: scale.value })

    canvas.width = viewport.width
    canvas.height = viewport.height

    // Disable right-click on canvas
    canvas.oncontextmenu = (e) => {
      e.preventDefault()
      return false
    }

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    }

    const renderTask = page.render(renderContext)
    renderingTasks.value[pageNum] = renderTask

    await renderTask.promise

    // Clear the task once completed
    delete renderingTasks.value[pageNum]
  } catch (err) {
    // Ignore cancellation errors
    if (err.name === 'RenderingCancelledException') {
      console.log(`Rendering cancelled for page ${pageNum}`)
    } else {
      console.error(`Error rendering page ${pageNum}:`, err)
    }
  }
}

const zoomIn = async () => {
  if (scale.value < 3) {
    scale.value += 0.2
  }
}

const zoomOut = async () => {
  if (scale.value > 0.5) {
    scale.value -= 0.2
  }
}

const scrollToPage = (pageNum) => {
  if (pageNum < 1 || pageNum > numPages.value) return

  const pageElement = pageRefs.value[pageNum]
  if (pageElement) {
    pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    currentPage.value = pageNum
  }
}

// Intersection Observer for detecting visible pages
let scrollTimeout = null

const handleScroll = () => {
  // Debounce scroll events for better performance
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  scrollTimeout = setTimeout(() => {
    if (!containerRef.value) return

    const container = containerRef.value.$el || containerRef.value
    const containerRect = container.getBoundingClientRect()
    const containerMiddle = containerRect.top + containerRect.height / 2

    let closestPage = 1
    let minDistance = Infinity

    // Find the page closest to the middle of the viewport
    Object.entries(pageRefs.value).forEach(([pageNum, element]) => {
      if (!element) return

      const rect = element.getBoundingClientRect()
      const pageMiddle = rect.top + rect.height / 2
      const distance = Math.abs(pageMiddle - containerMiddle)

      if (distance < minDistance) {
        minDistance = distance
        closestPage = parseInt(pageNum)
      }
    })

    currentPage.value = closestPage
  }, 50)
}

const close = () => {
  isOpen.value = false
  emit('close')
}

const onClose = () => {
  // Remove scroll listener when closing
  if (containerRef.value) {
    const container = containerRef.value.$el || containerRef.value
    container.removeEventListener('scroll', handleScroll)
  }
  disableSecurityMeasures()
}

// ============== Security Measures ==============

const enableSecurityMeasures = () => {
  // Disable right-click
  document.addEventListener('contextmenu', preventContextMenu)

  // Disable keyboard shortcuts for screenshots and dev tools
  document.addEventListener('keydown', preventScreenshotKeys)
  document.addEventListener('keyup', preventScreenshotKeys)

  // Disable text selection
  document.addEventListener('selectstart', preventSelection)

  // Disable drag
  document.addEventListener('dragstart', preventDrag)

  // Detect dev tools
  detectDevTools()

  // Disable clipboard
  document.addEventListener('copy', preventCopy)
  document.addEventListener('cut', preventCut)

  // Monitor for print attempts
  window.addEventListener('beforeprint', preventPrint)
  window.addEventListener('afterprint', preventPrint)
}

const disableSecurityMeasures = () => {
  document.removeEventListener('contextmenu', preventContextMenu)
  document.removeEventListener('keydown', preventScreenshotKeys)
  document.removeEventListener('keyup', preventScreenshotKeys)
  document.removeEventListener('selectstart', preventSelection)
  document.removeEventListener('dragstart', preventDrag)
  document.removeEventListener('copy', preventCopy)
  document.removeEventListener('cut', preventCut)
  window.removeEventListener('beforeprint', preventPrint)
  window.removeEventListener('afterprint', preventPrint)
}

const preventContextMenu = (e) => {
  e.preventDefault()
  return false
}

const preventScreenshotKeys = (e) => {
  // Prevent PrintScreen, Ctrl+P, Ctrl+S, F12, Ctrl+Shift+I, etc.
  const forbiddenKeys = ['PrintScreen', 'F12', 'F11']

  const forbiddenCombos = [
    { key: 'p', ctrl: true, event: 'print_attempt', desc: 'Print' }, // Print
    { key: 's', ctrl: true, event: 'restricted_action', desc: 'Save' }, // Save
    {
      key: 'i',
      ctrl: true,
      shift: true,
      event: 'dev_tools_detected',
      desc: 'Dev tools (Ctrl+Shift+I)',
    }, // Dev tools
    {
      key: 'j',
      ctrl: true,
      shift: true,
      event: 'dev_tools_detected',
      desc: 'Console (Ctrl+Shift+J)',
    }, // Console
    {
      key: 'c',
      ctrl: true,
      shift: true,
      event: 'dev_tools_detected',
      desc: 'Inspect (Ctrl+Shift+C)',
    }, // Inspect
    { key: 'u', ctrl: true, event: 'restricted_action', desc: 'View source' }, // View source
  ]

  if (forbiddenKeys.includes(e.key)) {
    e.preventDefault()
    screenshotAttempts.value++
    const eventType = e.key === 'PrintScreen' ? 'screenshot_attempt' : 'dev_tools_detected'
    showSecurityWarning(eventType, `${e.key} key pressed`)
    return false
  }

  for (const combo of forbiddenCombos) {
    if (
      e.key.toLowerCase() === combo.key &&
      e.ctrlKey === (combo.ctrl || false) &&
      e.shiftKey === (combo.shift || false)
    ) {
      e.preventDefault()
      screenshotAttempts.value++
      showSecurityWarning(combo.event, combo.desc)
      return false
    }
  }
}

const preventSelection = (e) => {
  e.preventDefault()
  return false
}

const preventDrag = (e) => {
  e.preventDefault()
  return false
}

const preventCopy = (e) => {
  e.preventDefault()
  showSecurityWarning('copy_attempt', 'User attempted to copy content')
  return false
}

const preventCut = (e) => {
  e.preventDefault()
  showSecurityWarning('copy_attempt', 'User attempted to cut content')
  return false
}

const preventPrint = (e) => {
  e.preventDefault()
  showSecurityWarning('print_attempt', 'User attempted to print document')
  return false
}

const detectDevTools = () => {
  const threshold = 160
  const check = () => {
    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      if (!devToolsOpen.value) {
        devToolsOpen.value = true
        showSecurityWarning(
          'dev_tools_detected',
          'Developer tools detected - window size change detected',
        )
      }
    } else {
      devToolsOpen.value = false
    }
  }

  const interval = setInterval(check, 1000)

  onBeforeUnmount(() => {
    clearInterval(interval)
  })
}

const showSecurityWarning = (
  eventType = 'restricted_action',
  message = 'This action is restricted for security reasons.',
) => {
  // You can integrate with Quasar Notify here
  console.warn('⚠️ Security Alert:', message)

  // Log to server for monitoring
  logSecurityEvent(eventType, message)
}

const logSecurityEvent = async (eventType, description) => {
  // Log security events to backend for monitoring
  try {
    const logData = {
      event_type: eventType,
      document_id: props.documentId,
      user_id: userStore.session?.user?.id,
      user_email: props.userEmail || userStore.session?.user?.email,
      user_name: props.userName || userStore.profile?.full_name,
      description: description,
      metadata: {
        document_title: props.documentTitle,
        document_author: props.documentAuthor,
        page_number: currentPage.value,
        zoom_level: scale.value,
        timestamp_viewed: props.viewedAt,
      },
      user_agent: navigator.userAgent,
    }

    const { error } = await supabase.from('security_logs').insert(logData)

    if (error) {
      console.error('Failed to log security event to database:', error)
    }
  } catch (err) {
    console.error('Failed to log security event:', err)
  }
}

// Setup and cleanup
onMounted(() => {
  // Scroll listener will be added after PDF loads in loadPdf()
})

onBeforeUnmount(() => {
  // Clean up scroll listener
  if (containerRef.value) {
    const container = containerRef.value.$el || containerRef.value
    container.removeEventListener('scroll', handleScroll)
  }

  // Clear any pending scroll timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  disableSecurityMeasures()
})
</script>

<style scoped>
.secure-pdf-viewer {
  background: #1e1e1e;
  display: flex;
  flex-direction: column;
  height: 100vh;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.viewer-header {
  background: #2d2d2d;
  border-bottom: 1px solid #444;
  flex-shrink: 0;
}

.viewer-footer {
  background: #2d2d2d;
  border-top: 1px solid #444;
  flex-shrink: 0;
}

.pdf-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: #1e1e1e;
  position: relative;
  padding: 0;
  /* Disable text selection */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  /* Disable drag */
  -webkit-user-drag: none;
  -moz-user-drag: none;
  -ms-user-drag: none;
}

.pages-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
  gap: 2rem;
}

.page-container {
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  background: white;
  /* Prevent interactions */
  pointer-events: auto;
}

.page-container canvas {
  display: block;
  max-width: 100%;
  height: auto;
  /* Disable drag */
  -webkit-user-drag: none;
  -moz-user-drag: none;
  -ms-user-drag: none;
  user-select: none;
}

.page-number {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Poppins', sans-serif;
  pointer-events: none;
}

.user-info-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: darkgray;
  color: white;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 10px;
  font-family: 'Poppins', sans-serif;
  pointer-events: none;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.watermark-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: -5rem;
  pointer-events: none;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.watermark-text {
  font-size: 3.5rem;
  font-weight: bold;
  color: rgba(136, 0, 0, 0.13);
  transform: rotate(-45deg);
  user-select: none;
  pointer-events: none;
  white-space: nowrap;
  font-family: 'Poppins', sans-serif;
}

.watermark-user-info {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(136, 0, 0, 0.08);
  transform: rotate(-45deg);
  user-select: none;
  pointer-events: none;
  white-space: nowrap;
  font-family: 'Poppins', sans-serif;
  margin-top: 2rem;
}

/* Additional security: Prevent screenshot tools from capturing */
@media print {
  .secure-pdf-viewer {
    display: none !important;
  }
}

/* Hide scrollbar for cleaner look */
.pdf-container::-webkit-scrollbar {
  width: 8px;
}

.pdf-container::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.pdf-container::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

.pdf-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
