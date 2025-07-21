<template>
  <q-page class="q-pa-md column items-center justify-center">
    <video ref="video" autoplay playsinline style="display: none" />
    <canvas ref="canvas" width="640" height="480" />
    <canvas ref="resultCanvas" class="q-mt-md" width="640" height="480" style="display: none" />

    <div class="q-mt-md row q-gutter-sm">
      <q-btn label="Take Photo" color="primary" @click="takePhoto" />
      <q-btn
        label="Transform"
        color="secondary"
        @click="transformDocument"
        :disable="!corners.length"
      />
      <q-btn label="Retake" color="orange" @click="resetScan" />
      <q-btn label="Save Scanned Copy" color="green" @click="saveScannedImage" />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const video = ref(null)
const canvas = ref(null)
const resultCanvas = ref(null)
const corners = ref([])
let draggingPointIndex = null

onMounted(async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true })
  video.value.srcObject = stream
  await new Promise((resolve) => (video.value.onloadedmetadata = resolve))
  video.value.play()
  video.value.style.display = 'block'
  canvas.value.style.display = 'none'
  resultCanvas.value.style.display = 'none'

  const ctx = canvas.value.getContext('2d')
  requestAnimationFrame(function drawVideo() {
    if (video.value.style.display == 'block') {
      ctx.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height)
    }
    requestAnimationFrame(drawVideo)
  })

  canvas.value?.addEventListener('mousedown', onMouseDown)
  canvas.value?.addEventListener('mousemove', onMouseMove)
  canvas.value?.addEventListener('mouseup', onMouseUp)
})

function takePhoto() {
  const ctx = canvas.value.getContext('2d')
  ctx.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height)
  video.value.pause()
  video.value.style.display = 'none'
  canvas.value.style.display = 'block'

  detectEdges()
}

function detectEdges() {
  const ctx = canvas.value.getContext('2d')
  const imageData = ctx.getImageData(0, 0, canvas.value.width, canvas.value.height)

  const gray = new Uint8ClampedArray(imageData.width * imageData.height)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
    gray[i / 4] = avg
  }

  // Very basic threshold to find document-like area
  const threshold = 200
  const margin = 20

  let top = imageData.height,
    bottom = 0,
    left = imageData.width,
    right = 0
  for (let y = margin; y < imageData.height - margin; y++) {
    for (let x = margin; x < imageData.width - margin; x++) {
      const value = gray[y * imageData.width + x]
      if (value < threshold) {
        if (y < top) top = y
        if (y > bottom) bottom = y
        if (x < left) left = x
        if (x > right) right = x
      }
    }
  }

  corners.value = [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ]

  drawCorners()
}

canvas.value?.addEventListener('mousedown', onMouseDown)
canvas.value?.addEventListener('mousemove', onMouseMove)
canvas.value?.addEventListener('mouseup', onMouseUp)

function onMouseDown(e) {
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  corners.value.forEach((pt, i) => {
    if (Math.hypot(pt.x - x, pt.y - y) < 10) draggingPointIndex = i
  })
}
function onMouseMove(e) {
  if (draggingPointIndex !== null) {
    const rect = canvas.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    corners.value[draggingPointIndex] = { x, y }
    drawCorners()
  }
}
function onMouseUp() {
  draggingPointIndex = null
}

function drawCorners() {
  const ctx = canvas.value.getContext('2d')
  ctx.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height)
  ctx.strokeStyle = 'red'
  ctx.lineWidth = 2
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
}

function transformDocument() {
  if (corners.value.length !== 4 || !cv) return

  const [tl, tr, br, bl] = corners.value

  const src = cv.imread(canvas.value)

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

  // Show the result
  cv.imshow(resultCanvas.value, dst)
  resultCanvas.value.style.display = 'block'

  // Clean up
  src.delete()
  dst.delete()
  srcTri.delete()
  dstTri.delete()
  M.delete()
}

function resetScan() {
  video.value.play()
  video.value.style.display = 'block'
  canvas.value.style.display = 'none'
  resultCanvas.value.style.display = 'none'
  corners.value = []
}

function saveScannedImage() {
  const dataUrl = resultCanvas.value.toDataURL('image/png')
  fetch(dataUrl)
    .then((res) => res.blob())
    .then((blob) => {
      const file = new File([blob], `scanned-${Date.now()}.png`, { type: 'image/png' })
      uploadScannedFile(file)
    })
}

async function uploadScannedFile(file) {
  // Placeholder upload - replace with Supabase or Cloudflare logic
  console.log('Uploading:', file.name)
}
</script>

<style scoped>
canvas {
  border: 1px solid #ccc;
  cursor: crosshair;
}
</style>
