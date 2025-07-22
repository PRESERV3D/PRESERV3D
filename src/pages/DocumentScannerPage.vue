<template>
  <q-page class="q-pa-md column items-center justify-start">
    <!-- Camera & Canvas Area -->
    <div class="relative-position">
      <video ref="video" autoplay muted playsinline class="camera-preview" style="display: none" />
      <canvas ref="canvas" style="display: none" />
      <canvas ref="resultCanvas" class="result-canvas" style="display: none" />
    </div>

    <!-- Buttons -->
    <div class="q-mt-md row q-gutter-sm">
      <q-btn v-if="showTake" label="TAKE PHOTO" color="deep-orange-10" @click="takePhoto" />
      <q-btn v-if="showTransform" label="TRANSFORM" color="amber" @click="transformDocument" />
      <q-btn v-if="showRetake" label="RETAKE" color="warning" @click="resetScan" />
      <q-btn v-if="showSave" label="ROTATE" color="blue" @click="rotateTransformedImage" />
      <q-btn v-if="showSave" label="SAVE" color="positive" @click="saveImage" />
    </div>

    <!-- Scanned Thumbnails Grid -->
    <div v-if="scannedImages.length" class="q-mt-lg row wrap justify-center q-gutter-md">
      <div v-for="(img, index) in scannedImages" :key="index" class="thumbnail-wrapper">
        <img :src="img" class="thumbnail-image" />

        <!-- Delete Button -->
        <q-btn dense round flat icon="close" class="thumbnail-delete" @click="deleteScan(index)" />
      </div>
    </div>
    <q-btn
      v-if="scannedImages.length"
      label="Export as PDF"
      color="primary"
      @click="openExportDialog"
      :disable="scannedImages.length === 0"
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
          <q-btn flat label="Cancel" color="secondary" v-close-popup />
          <q-btn label="Save PDF" color="primary" @click="confirmExport" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { jsPDF } from 'jspdf'

const scannedImages = ref([])
const transformedImage = ref(null)
const video = ref(null)
const canvas = ref(null)
const resultCanvas = ref(null)
const corners = ref([])
let draggingPointIndex = null
let cleanImage = null

// Button visibility states
const showTake = ref(true)
const showTransform = ref(false)
const showRetake = ref(false)
const showSave = ref(false)

// Export dialog
const showExportDialog = ref(false)
const pdfFileName = ref('scanned-document')
const formattedPdfSize = ref('Calculating...')

onMounted(async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  })
  video.value.srcObject = stream
  await new Promise((resolve) => (video.value.onloadedmetadata = resolve))

  // Match canvas size to actual video size
  const { videoWidth, videoHeight } = video.value
  canvas.value.width = videoWidth
  canvas.value.height = videoHeight
  resultCanvas.value.width = videoWidth
  resultCanvas.value.height = videoHeight

  video.value.play()
  video.value.style.display = 'block'
  canvas.value.style.display = 'none'
  resultCanvas.value.style.display = 'none'

  const ctx = canvas.value.getContext('2d')
  requestAnimationFrame(function drawVideo() {
    if (video.value && canvas.value && video.value.style.display === 'block') {
      ctx.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height)
    }
    requestAnimationFrame(drawVideo)
  })

  canvas.value?.addEventListener('mousedown', onMouseDown)
  canvas.value?.addEventListener('mousemove', onMouseMove)
  canvas.value?.addEventListener('mouseup', onMouseUp)
})

watch(scannedImages, () => {
  if (scannedImages.value.length) {
    estimatePdfSize().then((size) => {
      formattedPdfSize.value = size
    })
  } else {
    formattedPdfSize.value = '0 MB'
  }
})

function takePhoto() {
  const ctx = canvas.value.getContext('2d')
  ctx.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height)
  video.value.pause()

  cleanImage = ctx.getImageData(0, 0, canvas.value.width, canvas.value.height)

  video.value.style.display = 'none'
  canvas.value.style.display = 'block'

  detectEdges()
}

async function detectEdges() {
  const ctx = canvas.value.getContext('2d')
  const { width, height } = canvas.value
  const imgData = ctx.getImageData(0, 0, width, height)

  // Create OpenCV Mat
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

    // Fallback: draw centered square (80% size)
    const marginX = width * 0.1
    const marginY = height * 0.1
    corners.value = [
      { x: marginX, y: marginY }, // Top-left
      { x: width - marginX, y: marginY }, // Top-right
      { x: width - marginX, y: height - marginY }, // Bottom-right
      { x: marginX, y: height - marginY }, // Bottom-left
    ]
  }

  drawCorners()

  // Cleanup
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
  // Calculate the center
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
      // Ensure top-left is first
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

  // Create offscreen canvas from cleanImage
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = cleanImage.width
  tempCanvas.height = cleanImage.height
  tempCanvas.getContext('2d').putImageData(cleanImage, 0, 0)

  const src = cv.imread(tempCanvas)
  const [tl, tr, br, bl] = sortCorners(corners.value)

  // Define source and destination points
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

  // Perspective transform
  const M = cv.getPerspectiveTransform(srcTri, dstTri)
  const dst = new cv.Mat()
  const dsize = new cv.Size(maxWidth, maxHeight)

  cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar())

  // Sharpening kernel
  const sharpened = new cv.Mat()
  const kernel = cv.matFromArray(3, 3, cv.CV_32F, [0, -1, 0, -1, 5, -1, 0, -1, 0])
  cv.filter2D(dst, sharpened, cv.CV_8U, kernel)

  // Show the result
  resultCanvas.value.width = maxWidth
  resultCanvas.value.height = maxHeight
  cv.imshow(resultCanvas.value, dst)
  resultCanvas.value.style.display = 'block'

  // Store the result temporarily (not yet saved)
  const imageBlob = await new Promise((resolve) =>
    resultCanvas.value.toBlob(resolve, 'image/png', 1.0),
  )
  transformedImage.value = URL.createObjectURL(imageBlob)

  // Update button visibility
  showTransform.value = false
  showRetake.value = true
  showSave.value = true

  // Clean up
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

  // Create a temporary canvas to hold current image
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = oldWidth
  tempCanvas.height = oldHeight
  const tempCtx = tempCanvas.getContext('2d')
  tempCtx.drawImage(canvasEl, 0, 0)

  // Rotate dimensions
  canvasEl.width = oldHeight
  canvasEl.height = oldWidth

  // Rotate and draw the image
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
  ctx.save()
  ctx.translate(canvasEl.width / 2, canvasEl.height / 2)
  ctx.rotate((90 * Math.PI) / 180)
  ctx.drawImage(tempCanvas, -oldWidth / 2, -oldHeight / 2)
  ctx.restore()

  // Update the image blob for saving/export
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
  showExportDialog.value = true
  pdfFileName.value = 'scanned-document'
}

async function confirmExport() {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210 // A4 width in mm
  const pageHeight = 297 // A4 height in mm

  // Wait for all images to load
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

    const dataUrl = canvas.toDataURL('image/jpeg', 1.0)
    pdf.addImage(dataUrl, 'JPEG', x, y, width, height)
  })

  pdf.save(`${pdfFileName.value || 'scanned-document'}.pdf`)

  // Reset states
  showExportDialog.value = false
  scannedImages.value = []
  formattedPdfSize.value = '0 MB'

  resetScan()
}
</script>

<style scoped>
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
</style>
