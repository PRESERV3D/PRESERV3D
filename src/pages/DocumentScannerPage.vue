<template>
  <q-page class="q-pa-md column items-center justify-start">
    <!-- Phone Camera Connection Section -->
    <div v-if="showPhoneSetup" class="phone-setup-card q-mb-lg">
      <q-card class="q-pa-md" style="max-width: 600px">
        <q-card-section>
          <div class="text-h6">Connect Phone Camera</div>
          <div class="text-caption text-grey-7">
            Scan QR code or enter connection code on your phone
          </div>
        </q-card-section>

        <!-- Connection Code Display -->
        <q-card-section class="flex flex-center column">
          <div class="text-h4 text-weight-bold text-primary q-mb-md" style="letter-spacing: 4px">
            {{ connectionCode }}
          </div>
          <div class="text-caption text-grey-7 q-mb-lg">Enter this code on your phone</div>

          <q-separator class="q-mb-md full-width" />

          <div class="text-caption text-grey-7 q-mb-sm">Or scan QR code:</div>

          <!-- Loading state while generating QR -->
          <div
            v-if="!iceGatheringComplete"
            class="flex flex-center column q-mb-md"
            style="width: 300px; height: 300px; border: 1px solid #ccc; border-radius: 8px"
          >
            <q-spinner-dots size="50px" color="primary" />
            <div class="text-caption text-grey-7 q-mt-md">Preparing connection...</div>
          </div>

          <canvas
            v-show="iceGatheringComplete"
            ref="qrCanvas"
            width="300"
            height="300"
            class="q-mb-md"
          ></canvas>

          <!-- Fallback URL for manual connection -->
          <div v-if="iceGatheringComplete" class="q-mt-md text-center">
            <div class="text-caption text-grey-7 q-mb-xs">Can't scan QR code?</div>
            <div class="text-body2 text-weight-medium q-mb-xs">Open this URL on your phone:</div>
            <div
              class="text-primary text-weight-medium"
              style="word-break: break-all; padding: 0 20px"
            >
              {{ phoneConnectionUrl }}
            </div>
          </div>
        </q-card-section>

        <q-card-section v-if="connectionStatus === 'connected'">
          <q-banner class="bg-positive text-white" rounded>
            <template v-slot:avatar>
              <q-icon name="check_circle" />
            </template>
            Phone connected successfully! Starting camera...
          </q-banner>
        </q-card-section>

        <q-card-section v-else-if="connectionStatus === 'waiting'">
          <q-banner class="bg-info text-white" rounded>
            <template v-slot:avatar>
              <q-spinner-dots size="20px" />
            </template>
            Waiting for phone connection...
          </q-banner>
        </q-card-section>

        <q-card-section v-else-if="connectionStatus === 'failed'">
          <q-banner class="bg-negative text-white" rounded>
            <template v-slot:avatar>
              <q-icon name="error" />
            </template>
            Connection failed. Please try again.
          </q-banner>
        </q-card-section>
      </q-card>
    </div>

    <!-- Camera Mode Toggle -->
    <div class="q-mb-md" v-if="!showPhoneSetup">
      <q-btn-toggle
        v-model="cameraMode"
        spread
        no-caps
        rounded
        toggle-color="primary"
        :options="[
          { label: '💻 Laptop Camera', value: 'laptop' },
          { label: '📱 Phone Camera', value: 'phone' },
        ]"
        @update:model-value="switchCameraMode"
      />
    </div>

    <!-- Camera & Canvas Area -->
    <div class="q-mt-lg items-center justify-center" v-if="cameraMode === 'laptop' || cameraMode === 'phone' && connectionStatus === 'connected'">
      <video
        ref="video"
        autoplay
        muted
        playsinline
        :class="cameraMode === 'phone' ? 'camera-preview-portrait' : 'camera-preview'"
        style="display: none"
      />
      <canvas ref="canvas" style="display: none" />
    </div>
    <div class="camera-position">
      <canvas ref="resultCanvas" class="result-canvas" style="display: none" />

      <!-- Buttons -->
      <div class="buttons-row">
        <!-- RETAKE buttons moves to the left is result canva is shown -->
        <div class="left-buttons" v-if="showRetake && showSave">
          <q-btn label="RETAKE" class="btn2" @click="resetScan" />
        </div>

        <!-- Center group: used when resultCanvas is hidden -->
        <div class="center-buttons" v-if="!showSave">
          <q-btn v-if="showTake" label="TAKE PHOTO" class="btn1" @click="takePhoto" />
          <q-btn v-if="showTake" label="CHOOSE IMAGES" class="btn2" @click="openFileInput" />
          <q-btn v-if="showTransform" label="TRANSFORM" class="btn1" @click="transformDocument" />
          <q-btn v-if="showRetake" label="RETAKE" class="btn2" @click="resetScan" />
        </div>

        <!-- Right side is ROTATE & SAVE -->
        <div class="right-buttons" v-if="showSave">
          <q-btn label="ROTATE" flat color="primary" @click="rotateTransformedImage" />
          <q-btn label="SAVE" style="background-color: #408f4c; color: white" @click="saveImage" />
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept=".jpg,.jpeg,.png,.gif,.webp"
      style="display: none"
      @change="handleFileSelection"
    />

    <!-- Scanned Thumbnails Grid -->
    <div v-if="scannedImages.length" class="q-mt-lg row wrap justify-center q-gutter-md">
      <div v-for="(img, index) in scannedImages.slice(0, 4)" :key="index" class="thumbnail-wrapper">
        <img :src="img" class="thumbnail-image" />
        <q-btn dense round flat icon="close" class="thumbnail-delete" @click="deleteScan(index)" />
      </div>

      <!-- "+N more" Thumbnail -->
      <div
        v-if="scannedImages.length > 4"
        class="thumbnail-wrapper flex flex-center bg-grey-3 text-dark text-subtitle2"
        style="position: relative"
      >
        +{{ scannedImages.length - 4 }} more
      </div>
    </div>

    <q-btn
      v-if="scannedImages.length"
      label="Export as PDF"
      color="primary"
      @click="openExportDialog"
      class="q-mt-lg export"
    />

    <!-- Export Dialog -->
    <q-dialog v-model="showExportDialog" persistent>
      <q-card class="q-pa-md" style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Export PDF</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="pdfFileName" label="File name" filled />
          <div class="q-mt-md text-subtitle2">Preview:</div>
          <div class="q-gutter-sm row wrap">
            <div v-for="(img, index) in scannedImages" :key="index" class="q-mb-sm">
              <img :src="img" style="width: 100px; border: 1px solid #ccc" />
            </div>
          </div>
          <div class="q-mt-md">
            <q-item-label>Total Pages: {{ scannedImages.length }}</q-item-label>
            <q-item-label>Estimated Size: {{ formattedPdfSize }}</q-item-label>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            color="secondary"
            @click="
              () => {
                openCamera()
                showExportDialog = false
              }
            "
          />
          <q-btn label="Save PDF" color="primary" @click="confirmExport" />
          <q-btn
            label="Upload to Documents"
            color="deep-purple"
            @click="() => confirmExport({ uploadPdf: true })"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { jsPDF } from 'jspdf'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useWebRTC } from '../composables/useWebRTC'

const route = useRoute()
const router = useRouter()
const {
  remoteStream,
  initializeHostConnection,
  disconnectWebRTC,
  generateConnectionQR,
  connectionStatus,
  connectionCode,
  iceGatheringComplete,
  isConnectionActive,
  resumeExistingConnection,
} = useWebRTC()

// NEW: Camera mode state
const cameraMode = ref('laptop')
const showPhoneSetup = ref(false)
const qrCanvas = ref(null)

const scannedImages = ref([])
const transformedImage = ref(null)
const video = ref(null)
const canvas = ref(null)
const resultCanvas = ref(null)
const fileInput = ref(null)
const corners = ref([])
let draggingPointIndex = null
let cleanImage = null
let localStream = null // Store local camera stream

// Button visibility states
const showTake = ref(true)
const showTransform = ref(false)
const showRetake = ref(false)
const showSave = ref(false)

// Export dialog
const showExportDialog = ref(false)
const pdfFileName = ref('scanned-document')
const formattedPdfSize = ref('Calculating...')

// Computed property for phone connection URL
const phoneConnectionUrl = computed(() => {
  const baseUrl = import.meta.env.DEV ? 'http://localhost:9000' : window.location.origin
  return `${baseUrl}/phone-camera?code=${connectionCode.value}`
})

onMounted(async () => {
  openCamera()
})

onUnmounted(() => {
  stopCamera()
  disconnectWebRTC()
  scannedImages.value.forEach((imgUrl) => URL.revokeObjectURL(imgUrl))
})

onBeforeRouteLeave(() => {
  stopCamera()
})

// watch route change as fallback
watch(
  () => route.path,
  (path) => {
    if (!path.includes('document-scanner')) {
      stopCamera()
    }
  },
)

watch(scannedImages, () => {
  if (scannedImages.value.length) {
    estimatePdfSize().then((size) => {
      formattedPdfSize.value = size
    })
  } else {
    formattedPdfSize.value = '0 MB'
  }
})

// Watch for ICE gathering completion to generate QR code
watch(iceGatheringComplete, async (isComplete) => {
  if (isComplete && showPhoneSetup.value && qrCanvas.value) {
    await generateConnectionQR(qrCanvas.value, import.meta.env.DEV)
  }
})

// NEW: Camera mode switching with connection check
async function switchCameraMode(mode) {
  if (mode === 'phone') {
    // Stop local camera before switching
    stopLocalCamera()

    // Check if we have an existing phone connection
    if (isConnectionActive()) {
      console.log('Reusing existing phone connection')
      showPhoneSetup.value = false // Don't show setup if already connected
      resumeExistingConnection(video.value)
    } else {
      // New connection needed
      console.log('No active connection, showing setup')
      showPhoneSetup.value = true
      await setupPhoneConnection()
    }
  } else {
    // Switching to laptop camera
    // Don't disconnect WebRTC - just pause the phone stream
    if (video.value && video.value.srcObject === remoteStream.value) {
      video.value.pause()
    }
    showPhoneSetup.value = false
    await openCamera()
  }
}

async function setupPhoneConnection() {
  await initializeHostConnection(video.value)

  // The QR code will be generated automatically when ICE gathering completes
  // via the watch on iceGatheringComplete
}

// Watch for successful connection
watch(connectionStatus, (status) => {
  if (status === 'connected') {
    setTimeout(() => {
      if (remoteStream.value && video.value) {
        video.value.srcObject = remoteStream.value
        video.value.style.display = 'block'
        video.value.muted = true
        video.value
          .play()
          .then(() => {
            showPhoneSetup.value = false // Close the setup dialog
          })
          .catch((err) => console.error('Play error:', err))
      }
    }, 1000)
  }
})

// Also watch remoteStream directly
watch(remoteStream, (newStream) => {
  if (newStream && video.value && cameraMode.value === 'phone') {
    video.value.srcObject = newStream
    video.value.style.display = 'block'
    video.value.muted = true
    video.value
      .play()
      .then(() => {
        showPhoneSetup.value = false
      })
      .catch((err) => console.error('Play error:', err))
  }
})

// Image selection functions
function openFileInput() {
  fileInput.value.click()
}

async function handleFileSelection(event) {
  const files = Array.from(event.target.files)
  const validImages = files.filter(isValidImageFile)

  if (validImages.length !== files.length) {
    alert('Some files were filtered out. Only image files are allowed.')
  }

  if (validImages.length === 0) {
    alert('Please select valid image files (JPG, JPEG, PNG, GIF, WebP)')
    return
  }

  for (const file of validImages) {
    try {
      const imageUrl = URL.createObjectURL(file)
      const imageElement = await createImageElement(imageUrl)

      const canvas = document.createElement('canvas')
      canvas.width = imageElement.width
      canvas.height = imageElement.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(imageElement, 0, 0)

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.9))
      const scannedImageUrl = URL.createObjectURL(blob)

      scannedImages.value.push(scannedImageUrl)

      URL.revokeObjectURL(imageUrl)
    } catch (error) {
      console.error('Error processing image:', error)
      alert(`Error processing ${file.name}. Please try again.`)
    }
  }

  event.target.value = ''
}

function isValidImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  return validTypes.includes(file.type)
}

function createImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Original camera functions
function takePhoto() {
  const ctx = canvas.value.getContext('2d')
  ctx.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height)
  video.value.pause()

  cleanImage = ctx.getImageData(0, 0, canvas.value.width, canvas.value.height)

  video.value.style.display = 'none'
  canvas.value.style.display = 'block'

  detectEdges()
}

async function openCamera() {
  // If switching from phone to laptop, keep phone connection alive
  if (cameraMode.value === 'laptop' && remoteStream.value) {
    // Keep phone connection alive but hide video
    if (video.value && video.value.srcObject === remoteStream.value) {
      video.value.pause()
    }
  }

  // Only open local camera if in laptop mode
  if (cameraMode.value === 'laptop') {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      video.value.srcObject = localStream
      video.value.style.display = 'block'
      video.value.play()
    } catch (error) {
      console.error('Camera access error:', error)
      alert('Unable to access camera. Please check permissions.')
      return
    }
  } else if (cameraMode.value === 'phone' && remoteStream.value) {
    // Resume phone camera
    video.value.srcObject = remoteStream.value
    video.value.style.display = 'block'
    video.value.play()
  }

  canvas.value.style.display = 'none'
  resultCanvas.value.style.display = 'none'

  video.value.onloadedmetadata = () => {
    const videoWidth = video.value.videoWidth
    const videoHeight = video.value.videoHeight

    canvas.value.width = videoWidth
    canvas.value.height = videoHeight
    resultCanvas.value.width = videoWidth
    resultCanvas.value.height = videoHeight
  }

  canvas.value.addEventListener('mousedown', onMouseDown)
  canvas.value.addEventListener('mousemove', onMouseMove)
  canvas.value.addEventListener('mouseup', onMouseUp)
}

function stopLocalCamera() {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop())
    localStream = null
  }
}

function stopCamera() {
  stopLocalCamera()

  if (video.value && video.value.srcObject && video.value.srcObject !== remoteStream.value) {
    const stream = video.value.srcObject
    const tracks = stream.getTracks()
    tracks.forEach((track) => track.stop())
    video.value.srcObject = null
  }
}

async function detectEdges() {
  const ctx = canvas.value.getContext('2d')
  const { width, height } = canvas.value
  const imgData = ctx.getImageData(0, 0, width, height)

  let src = cv.matFromImageData(imgData)
  let gray = new cv.Mat()
  let blurred = new cv.Mat()
  let edges = new cv.Mat()
  let contours = new cv.MatVector()
  let hierarchy = new cv.Mat()

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0)
  cv.Canny(blurred, edges, 75, 200)
  cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

  let maxArea = 0
  let bestContour = null

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i)
    const approx = new cv.Mat()
    cv.approxPolyDP(contour, approx, 0.02 * cv.arcLength(contour, true), true)

    if (approx.rows === 4) {
      const area = cv.contourArea(approx)
      if (area > maxArea) {
        maxArea = area
        bestContour = approx
      }
    }
  }

  if (bestContour) {
    corners.value = []
    for (let i = 0; i < 4; i++) {
      const point = bestContour.intPtr(i)
      corners.value.push({ x: point[0], y: point[1] })
    }
  } else {
    alert('No document-like shape found.')

    const marginX = width * 0.1
    const marginY = height * 0.1
    corners.value = [
      { x: marginX, y: marginY },
      { x: width - marginX, y: marginY },
      { x: width - marginX, y: height - marginY },
      { x: marginX, y: height - marginY },
    ]
  }

  drawCorners()

  src.delete()
  gray.delete()
  blurred.delete()
  edges.delete()
  contours.delete()
  hierarchy.delete()
  bestContour?.delete()
}

function drawCorners() {
  const ctx = canvas.value.getContext('2d')
  ctx.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height)
  ctx.strokeStyle = 'red'
  ctx.lineWidth = 3
  corners.value.forEach(({ x, y }) => {
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, 2 * Math.PI)
    ctx.fillStyle = 'red'
    ctx.fill()
  })
  if (corners.value.length === 4) {
    ctx.beginPath()
    ctx.moveTo(corners.value[0].x, corners.value[0].y)
    corners.value.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.stroke()
  }

  showTake.value = false
  showTransform.value = true
  showRetake.value = true
}

function getMousePos(e) {
  const rect = canvas.value.getBoundingClientRect()
  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  }
}

function onMouseDown(e) {
  const { x, y } = getMousePos(e)
  corners.value.forEach((pt, i) => {
    if (Math.hypot(pt.x - x, pt.y - y) < 10) draggingPointIndex = i
  })
}

function onMouseMove(e) {
  if (draggingPointIndex !== null) {
    const { x, y } = getMousePos(e)
    corners.value[draggingPointIndex] = { x, y }
    drawCorners()
  }
}

function onMouseUp() {
  draggingPointIndex = null
}

function sortCorners(pts) {
  const center = {
    x: pts.reduce((sum, p) => sum + p.x, 0) / pts.length,
    y: pts.reduce((sum, p) => sum + p.y, 0) / pts.length,
  }

  return pts
    .slice()
    .sort((a, b) => {
      const angleA = Math.atan2(a.y - center.y, a.x - center.x)
      const angleB = Math.atan2(b.y - center.y, b.x - center.x)
      return angleA - angleB
    })
    .map((p, i, arr) => {
      const topLeft = arr.reduce((prev, curr) => (curr.x + curr.y < prev.x + prev.y ? curr : prev))
      const index = arr.indexOf(topLeft)
      return arr[(i + index) % 4]
    })
}

async function transformDocument() {
  showTake.value = false
  showTransform.value = true
  showRetake.value = true
  showSave.value = true

  if (corners.value.length !== 4 || !cv) return

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = cleanImage.width
  tempCanvas.height = cleanImage.height
  tempCanvas.getContext('2d').putImageData(cleanImage, 0, 0)

  const src = cv.imread(tempCanvas)
  const [tl, tr, br, bl] = sortCorners(corners.value)

  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x,
    tl.y,
    tr.x,
    tr.y,
    br.x,
    br.y,
    bl.x,
    bl.y,
  ])

  const widthA = Math.hypot(br.x - bl.x, br.y - bl.y)
  const widthB = Math.hypot(tr.x - tl.x, tr.y - tl.y)
  const maxWidth = Math.max(widthA, widthB)

  const heightA = Math.hypot(tr.x - br.x, tr.y - br.y)
  const heightB = Math.hypot(tl.x - bl.x, tl.y - bl.y)
  const maxHeight = Math.max(heightA, heightB)

  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    maxWidth - 1,
    0,
    maxWidth - 1,
    maxHeight - 1,
    0,
    maxHeight - 1,
  ])

  const M = cv.getPerspectiveTransform(srcTri, dstTri)
  const dst = new cv.Mat()
  const dsize = new cv.Size(maxWidth, maxHeight)

  cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar())

  const sharpened = new cv.Mat()
  const kernel = cv.matFromArray(3, 3, cv.CV_32F, [0, -1, 0, -1, 5, -1, 0, -1, 0])
  cv.filter2D(dst, sharpened, cv.CV_8U, kernel)

  resultCanvas.value.width = maxWidth
  resultCanvas.value.height = maxHeight
  cv.imshow(resultCanvas.value, dst)
  resultCanvas.value.style.display = 'block'

  const imageBlob = await new Promise((resolve) =>
    resultCanvas.value.toBlob(resolve, 'image/png', 1.0),
  )
  transformedImage.value = URL.createObjectURL(imageBlob)

  showTransform.value = false
  showRetake.value = true
  showSave.value = true

  kernel.delete()
  sharpened.delete()
  src.delete()
  dst.delete()
  srcTri.delete()
  dstTri.delete()
  M.delete()
}

function rotateTransformedImage() {
  const canvasEl = resultCanvas.value
  const ctx = canvasEl.getContext('2d')

  const oldWidth = canvasEl.width
  const oldHeight = canvasEl.height

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = oldWidth
  tempCanvas.height = oldHeight
  const tempCtx = tempCanvas.getContext('2d')
  tempCtx.drawImage(canvasEl, 0, 0)

  canvasEl.width = oldHeight
  canvasEl.height = oldWidth

  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
  ctx.save()
  ctx.translate(canvasEl.width / 2, canvasEl.height / 2)
  ctx.rotate((90 * Math.PI) / 180)
  ctx.drawImage(tempCanvas, -oldWidth / 2, -oldHeight / 2)
  ctx.restore()

  resultCanvas.value.toBlob(
    (blob) => {
      transformedImage.value = URL.createObjectURL(blob)
    },
    'image/png',
    1.0,
  )
}

function saveImage() {
  if (transformedImage.value) {
    scannedImages.value = [...scannedImages.value, transformedImage.value]
    transformedImage.value = null
  }

  resultCanvas.value.style.display = 'none'
  canvas.value.style.display = 'none'
  video.value.style.display = 'block'
  video.value.play()

  showTake.value = true
  showTransform.value = false
  showRetake.value = false
  showSave.value = false

  resetScan()
}

function deleteScan(index) {
  const imgUrl = scannedImages.value[index]
  URL.revokeObjectURL(imgUrl)
  scannedImages.value.splice(index, 1)
}

function resetScan() {
  video.value.play()
  video.value.style.display = 'block'
  canvas.value.style.display = 'none'
  resultCanvas.value.style.display = 'none'
  corners.value = []

  showTake.value = true
  showTransform.value = false
  showRetake.value = false
  showSave.value = false
}

async function estimatePdfSize() {
  const doc = new jsPDF()
  scannedImages.value.forEach((img, i) => {
    if (i !== 0) doc.addPage()
    doc.addImage(img, 'PNG', 0, 0, 210, 297)
  })
  const blob = doc.output('blob')
  const sizeInMB = blob.size / 1024 / 1024

  return `${sizeInMB.toFixed(2)} MB`
}

function openExportDialog() {
  stopCamera()
  showExportDialog.value = true
  pdfFileName.value = 'scanned-document'
}

async function confirmExport({ uploadPdf = false } = {}) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210
  const pageHeight = 297

  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image()
      img.src = src
      img.onload = () => resolve(img)
    })

  const images = await Promise.all(scannedImages.value.map(loadImage))

  images.forEach((image, i) => {
    if (i !== 0) pdf.addPage()

    const imgWidth = image.width
    const imgHeight = image.height

    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight)
    const width = imgWidth * ratio
    const height = imgHeight * ratio
    const x = (pageWidth - width) / 2
    const y = (pageHeight - height) / 2

    const canvas = document.createElement('canvas')
    canvas.width = imgWidth
    canvas.height = imgHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, imgWidth, imgHeight)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    pdf.addImage(dataUrl, 'JPEG', x, y, width, height)
  })

  stopCamera()
  const pdfBlob = pdf.output('blob')
  const file = new File([pdfBlob], `${pdfFileName.value}.pdf`, {
    type: 'application/pdf',
  })

  if (uploadPdf) {
    router.push({ name: 'documents', state: { scannedFile: file } })
  } else {
    pdf.save(`${pdfFileName.value || 'scanned-document'}.pdf`)
  }

  showExportDialog.value = false
  resetScan()
}
</script>

<style scoped>
.phone-setup-card {
  width: 100%;
  display: flex;
  justify-content: center;
}

canvas {
  max-width: 80vw;
  height: auto;
  border-radius: 8px;
  border: 1px solid #ccc;
  cursor: crosshair;
  pointer-events: auto;
}

.result-canvas {
  width: 30vw;
  height: auto;
  margin-top: 2em;
  border: 1px solid #ccc;
  border-radius: 8px;
}

/* Landscape camera (laptop) */
.camera-preview {
  width: 100%;
  max-width: 80vw;
  height: auto;
  aspect-ratio: 16 / 9;
  border: 1px solid #ccc;
  border-radius: 8px;
  object-fit: cover;
}

/* Portrait camera (phone) */
.camera-preview-portrait {
  width: auto;
  max-width: 45vw; /* Narrower for portrait */
  height: 70vh; /* Taller for portrait */
  max-height: 70vh;
  border: 1px solid #ccc;
  border-radius: 8px;
  object-fit: cover;
}

.thumbnail-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border: 1px solid #ccc;
  border-radius: 6px;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumbnail-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
}

.thumbnail-wrapper:hover .thumbnail-delete {
  opacity: 1;
}

/* buttons */
.export,
.buttons-row {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
}

.btn1 {
  background: #880000;
  color: white;
}

.btn2 {
  background: #ccac00b2 !important;
}

.camera-position {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.buttons-row {
  width: 30vw; /* same as result canvas */
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1em;
}

.left-buttons {
  display: flex;
  gap: 0.5em;
}

.center-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5em;
  margin: 0 auto;
}

.right-buttons {
  display: flex;
  gap: 0.5em;
}
</style>
