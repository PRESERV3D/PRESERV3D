<template>
  <q-page class="q-pa-md column items-center justify-start">
    <!-- Mobile camera toggle button -->
    <q-btn
      v-if="!showMobileOption && !isHost && !isClient"
      flat
      icon="smartphone"
      label="Connect Phone Camera"
      @click="enableMobileCamera"
      class="q-mb-md"
    />

    <!-- Mobile Camera Section -->
    <div class="mobile-camera-section q-mb-md" v-if="showMobileOption">
      <q-card class="q-pa-md">
        <q-card-section>
          <div class="text-h6">
            {{ isHost ? 'WebRTC Camera Connection' : 'Use Mobile Camera' }}
          </div>
          <div class="text-caption">
            {{
              isHost
                ? 'Scan this QR code with your phone to connect its camera directly'
                : 'Choose connection method'
            }}
          </div>
        </q-card-section>

        <q-card-section class="text-center" v-if="isHost">
          <div class="qr-container">
            <canvas
              ref="qrCodeCanvas"
              width="200"
              height="200"
              style="border: 1px solid #ddd; background-color: white"
            ></canvas>
          </div>

          <div class="q-mt-sm">
            <q-chip color="primary" text-color="white"> Connection ID: {{ connectionId }} </q-chip>
          </div>

          <q-btn
            flat
            size="sm"
            icon="content_copy"
            label="Copy URL"
            @click="copyUrlToClipboard"
            class="q-mt-sm"
          />

          <!-- Connection Steps -->
          <div class="q-mt-md q-pa-sm bg-blue-1 rounded-borders">
            <div class="text-caption text-blue-8">
              <strong>Step {{ connectionStep }} of 2:</strong><br />
              <span v-if="connectionStep === 1">
                1. Scan QR code with your phone<br />
                2. Allow camera access on your phone<br />
                3. Copy the answer text from your phone and paste below
              </span>
              <span v-if="connectionStep === 2">
                ✅ Phone connected! Camera should now be active.
              </span>
            </div>
          </div>

          <!-- Answer Input (Step 1) -->
          <div v-if="connectionStep === 1" class="q-mt-md">
            <q-input
              v-model="phoneAnswer"
              type="textarea"
              label="Paste phone answer here"
              filled
              rows="3"
              placeholder="Paste the JSON answer from your phone here..."
              class="q-mb-sm"
            />
            <div class="text-caption text-grey-6 q-mb-sm">
              The answer should start with {"type":"answer"...}
            </div>
            <q-btn
              label="Connect Phone"
              color="primary"
              @click="processPhoneAnswer"
              :disable="!phoneAnswer.trim()"
              class="full-width"
            />
          </div>

          <!-- Connected Status (Step 2) -->
          <div v-if="connectionStatus === 'connected'" class="q-mt-md text-center">
            <q-icon name="check_circle" color="green" size="2em" />
            <div class="text-subtitle1 q-mt-sm text-green-8">
              <strong>Phone Camera Connected!</strong>
            </div>
            <div class="text-caption">You can now use your phone as a camera</div>
          </div>
        </q-card-section>

        <!-- Client interface (phone) -->
        <q-card-section v-if="isClient" class="text-center">
          <div class="text-h6">📱 Phone Camera Mode</div>
          <div class="text-caption q-mb-md">Camera is streaming to laptop</div>

          <div class="q-pa-sm bg-green-1 rounded-borders q-mb-md">
            <div class="text-caption text-green-8">
              ✅ If you see this message, your camera is working!<br />
              The laptop should now be receiving your camera feed.
            </div>
          </div>

          <q-btn color="red" label="Disconnect" @click="disconnectWebRTC" />
        </q-card-section>

        <q-card-actions v-if="!isClient">
          <q-btn flat @click="showMobileOption = false">Use Desktop Camera</q-btn>
          <q-btn flat @click="enableMobileCamera" icon="refresh" label="New Connection" />
        </q-card-actions>
      </q-card>
    </div>

    <!-- Camera & Canvas Area -->
    <div class="q-mt-lg items-center justify-center">
      <video ref="video" autoplay muted playsinline class="camera-preview" style="display: none" />
      <canvas ref="canvas" style="display: none" />
    </div>

    <div class="camera-position">
      <canvas ref="resultCanvas" class="result-canvas" style="display: none" />

      <!-- Buttons -->
      <div class="buttons-row">
        <!-- RETAKE button moves to the left if result canvas is shown -->
        <div class="left-buttons" v-if="showRetake && showSave">
          <q-btn label="RETAKE" class="btn2" @click="handleRetake" />
        </div>

        <!-- Center group: used when resultCanvas is hidden -->
        <div class="center-buttons" v-if="!showSave">
          <q-btn v-if="showTake" label="TAKE PHOTO" class="btn1" @click="handleTakePhoto" />
          <q-btn v-if="showTake" label="CHOOSE IMAGES" class="btn2" @click="openFileInput" />
          <q-btn v-if="showTransform" label="TRANSFORM" class="btn1" @click="transformImage" />
          <q-btn v-if="showRetake" label="RETAKE" class="btn2" @click="handleRetake" />
        </div>

        <!-- Right side is ROTATE & SAVE -->
        <div class="right-buttons" v-if="showSave">
          <q-btn label="ROTATE" flat color="primary" @click="rotateImage" />
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
          <q-btn flat label="Cancel" color="secondary" @click="closeExportDialog" />
          <q-btn label="Save PDF" color="primary" @click="confirmExport(false)" />
          <q-btn label="Upload to Documents" color="deep-purple" @click="confirmExport(true)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { jsPDF } from 'jspdf'
import { useCamera } from '../composables/useCamera'
import { useDocumentScanner } from '../composables/useDocumentScanner'
import { useWebRTC } from '../composables/useWebRTC'

const route = useRoute()
const router = useRouter()

// Composables
const { video, openCamera, stopCamera, requestCameraPermission } = useCamera()

const {
  canvas,
  resultCanvas,
  scannedImages,
  showTake,
  showTransform,
  showRetake,
  showSave,
  takePhoto,
  transformImage,
  saveImage,
  deleteScan,
  resetScan,
} = useDocumentScanner()

const {
  isHost,
  isClient,
  connectionId,
  currentUrl,
  connectionStep,
  phoneAnswer,
  connectionStatus,
  localConnection,
  remoteConnection,
  generateConnectionQR: generateQR,
  processPhoneAnswer: processAnswer,
  disconnectWebRTC: disconnect,
} = useWebRTC()

// Local refs
const fileInput = ref(null)
const qrCodeCanvas = ref(null)
const showMobileOption = ref(false)
const showExportDialog = ref(false)
const pdfFileName = ref('scanned-document')
const isDevelopmentMode = ref(false)

// Computed property for PDF size
const formattedPdfSize = computed(() => {
  if (scannedImages.value.length === 0) return '0 MB'

  // Rough estimate: ~50KB per image in PDF format
  const estimatedSizePerImage = 50 * 1024 // 50KB in bytes
  const totalSize = estimatedSizePerImage * scannedImages.value.length
  const sizeInMB = totalSize / (1024 * 1024)

  return `${sizeInMB.toFixed(2)} MB`
})

// Lifecycle hooks
onMounted(async () => {
  checkClientMode()

  isDevelopmentMode.value =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('192.168.') ||
    window.location.hostname.includes('10.') ||
    window.location.port !== ''

  if (!isClient.value) {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const hasCamera = devices.some((device) => device.kind === 'videoinput')

    if (hasCamera) {
      setupCamera()
    }
  }
})

onUnmounted(() => {
  stopCamera()
  scannedImages.value.forEach((url) => URL.revokeObjectURL(url))
})

// Watchers
watch(
  () => route.path,
  (path) => {
    if (!path.includes('document-scanner')) {
      stopCamera()
    }
  },
)

// Camera setup
async function setupCamera() {
  try {
    await openCamera()

    if (video.value) {
      video.value.onloadedmetadata = () => {
        canvas.value.width = video.value.videoWidth
        canvas.value.height = video.value.videoHeight
        resultCanvas.value.width = video.value.videoWidth
        resultCanvas.value.height = video.value.videoHeight
      }
    }
  } catch (error) {
    console.error('Failed to setup camera:', error)
  }
}

// Photo handling
function handleTakePhoto() {
  if (video.value) {
    takePhoto(video.value)
  }
}

function handleRetake() {
  resetScan()
  if (video.value) {
    video.value.style.display = 'block'
    video.value.play()
  }
}

function rotateImage() {
  const canvasEl = resultCanvas.value
  if (!canvasEl) return

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
}

// File handling
function openFileInput() {
  fileInput.value?.click()
}

async function handleFileSelection(event) {
  const files = Array.from(event.target.files)
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const validImages = files.filter((file) => validTypes.includes(file.type))

  if (validImages.length !== files.length) {
    alert('Some files were filtered out. Only image files are allowed.')
  }

  if (validImages.length === 0) {
    alert('Please select valid image files')
    return
  }

  for (const file of validImages) {
    try {
      const imageUrl = URL.createObjectURL(file)
      scannedImages.value.push(imageUrl)
    } catch (error) {
      console.error('Error processing image:', error)
    }
  }

  event.target.value = ''
}

// PDF Export
function openExportDialog() {
  stopCamera()
  showExportDialog.value = true
}

function closeExportDialog() {
  showExportDialog.value = false
  setupCamera()
}

async function confirmExport(uploadToDocuments) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = 210
  const pageHeight = 297

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })

  const images = await Promise.all(scannedImages.value.map(loadImage))

  images.forEach((image, i) => {
    if (i !== 0) pdf.addPage()

    const ratio = Math.min(pageWidth / image.width, pageHeight / image.height)
    const width = image.width * ratio
    const height = image.height * ratio
    const x = (pageWidth - width) / 2
    const y = (pageHeight - height) / 2

    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    pdf.addImage(dataUrl, 'JPEG', x, y, width, height)
  })

  const pdfBlob = pdf.output('blob')
  const file = new File([pdfBlob], `${pdfFileName.value}.pdf`, { type: 'application/pdf' })

  if (uploadToDocuments) {
    router.push({ name: 'documents', state: { scannedFile: file } })
  } else {
    pdf.save(`${pdfFileName.value || 'scanned-document'}.pdf`)
  }

  showExportDialog.value = false
  resetScan()
}

// WebRTC functions
async function enableMobileCamera() {
  await startAsHost()
  showMobileOption.value = true
}

async function startAsHost() {
  isHost.value = true
  connectionId.value = generateConnectionId()
  connectionStatus.value = 'waiting'
  connectionStep.value = 1

  localConnection.value = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  })

  localConnection.value.ontrack = (event) => {
    console.log('✅ Received remote stream from phone!')
    const remoteStream = event.streams[0]
    connectionStatus.value = 'connected'
    connectionStep.value = 2

    video.value.srcObject = remoteStream
    video.value.style.display = 'block'
    video.value.play()

    video.value.onloadedmetadata = () => {
      canvas.value.width = video.value.videoWidth
      canvas.value.height = video.value.videoHeight
      resultCanvas.value.width = video.value.videoWidth
      resultCanvas.value.height = video.value.videoHeight
    }
  }

  localConnection.value.onconnectionstatechange = () => {
    if (localConnection.value.connectionState === 'connected') {
      connectionStatus.value = 'connected'
      connectionStep.value = 2
    } else if (localConnection.value.connectionState === 'failed') {
      connectionStatus.value = 'error'
    }
  }

  localConnection.value.onicecandidate = (event) => {
    if (!event.candidate) {
      console.log('✅ ICE gathering complete')
    }
  }

  const offer = await localConnection.value.createOffer()
  await localConnection.value.setLocalDescription(offer)

  await nextTick()
  setTimeout(() => {
    generateQR(qrCodeCanvas.value, isDevelopmentMode.value)
  }, 100)
}

async function processPhoneAnswer() {
  await processAnswer()
}

function disconnectWebRTC() {
  disconnect()
  showMobileOption.value = false
  setupCamera()
}

function checkClientMode() {
  const urlParams = new URLSearchParams(window.location.search)
  const mode = urlParams.get('mode')
  const data = urlParams.get('data')

  if (mode === 'client' && data) {
    try {
      const hostData = JSON.parse(decodeURIComponent(data))
      isClient.value = true
      connectAsClient(hostData)
    } catch (error) {
      console.error('Invalid connection data:', error)
    }
  }
}

async function connectAsClient(hostData) {
  const hasPermission = await requestCameraPermission()
  if (!hasPermission) {
    alert('Camera permission is required')
    return
  }

  remoteConnection.value = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  })

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
    })

    stream.getTracks().forEach((track) => {
      remoteConnection.value.addTrack(track, stream)
    })

    await remoteConnection.value.setRemoteDescription(hostData.offer)
    const answer = await remoteConnection.value.createAnswer()
    await remoteConnection.value.setLocalDescription(answer)

    showConnectionAnswer(answer)
  } catch (error) {
    console.error('Error:', error)
    alert('Unable to access camera')
  }
}

function showConnectionAnswer(answer) {
  const answerString = JSON.stringify(answer)
  if (confirm('Connection answer ready! Click OK to copy it.')) {
    navigator.clipboard
      .writeText(answerString)
      .then(() => alert('Answer copied! Paste it on your laptop.'))
      .catch(() => {
        const textArea = document.createElement('textarea')
        textArea.value = answerString
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('Answer copied! Paste it on your laptop.')
      })
  }
}

function generateConnectionId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase()
}

async function copyUrlToClipboard() {
  try {
    await navigator.clipboard.writeText(currentUrl.value)
    console.log('URL copied')
  } catch (error) {
    console.error('Failed to copy URL:', error)
  }
}
</script>

<style scoped>
canvas {
  max-width: 80vw;
  height: auto;
  border-radius: 8px;
  border: 1px solid #ccc;
  cursor: crosshair;
}

.result-canvas {
  width: 30vw;
  height: auto;
  margin-top: 2em;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.camera-preview {
  width: 100%;
  max-width: 80vw;
  height: auto;
  aspect-ratio: 16 / 9;
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
  width: 30vw;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1em;
}

.left-buttons,
.right-buttons {
  display: flex;
  gap: 0.5em;
}

.center-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5em;
  margin: 0 auto;
}

.mobile-camera-section {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.bg-blue-1 {
  background-color: #e3f2fd;
}

.text-blue-8 {
  color: #1565c0;
}
</style>
