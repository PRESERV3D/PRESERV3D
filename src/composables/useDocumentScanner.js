import { ref } from 'vue'
import cv from 'opencv.js'

export function useDocumentScanner() {
  const canvas = ref(null)
  const resultCanvas = ref(null)
  const corners = ref([])
  const scannedImages = ref([])
  const transformedImage = ref(null)

  let cleanImage = null

  // Button states
  const showTake = ref(true)
  const showTransform = ref(false)
  const showRetake = ref(false)
  const showSave = ref(false)

  function takePhoto(video) {
    const ctx = canvas.value.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.value.width, canvas.value.height)

    cleanImage = ctx.getImageData(0, 0, canvas.value.width, canvas.value.height)

    video.pause()
    video.style.display = 'none'
    canvas.value.style.display = 'block'

    detectEdges()
  }

  function detectEdges() {
    const ctx = canvas.value.getContext('2d')
    const { width, height } = canvas.value
    const imgData = ctx.getImageData(0, 0, width, height)

    let src = cv.matFromImageData(imgData)
    let gray = new cv.Mat()
    let blurred = new cv.Mat()
    let edges = new cv.Mat()

    try {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0)
      cv.Canny(blurred, edges, 50, 150, 3, false)

      // Simplified edge detection - just use default corners for now
      const margin = Math.min(width, height) * 0.1
      corners.value = [
        { x: margin, y: margin },
        { x: width - margin, y: margin },
        { x: width - margin, y: height - margin },
        { x: margin, y: height - margin },
      ]

      drawCorners()
    } catch (error) {
      console.error('Edge detection error:', error)
    } finally {
      src.delete()
      gray.delete()
      blurred.delete()
      edges.delete()
    }
  }

  function drawCorners() {
    const ctx = canvas.value.getContext('2d')

    if (corners.value.length === 4) {
      ctx.strokeStyle = '#FF0000'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(corners.value[0].x, corners.value[0].y)
      corners.value.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      ctx.stroke()

      corners.value.forEach(({ x, y }) => {
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, 2 * Math.PI)
        ctx.fillStyle = '#FF0000'
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.stroke()
      })
    }

    showTake.value = false
    showTransform.value = true
    showRetake.value = true
  }

  function transformImage() {
    if (corners.value.length !== 4 || !cleanImage) return

    let src = cv.matFromImageData(cleanImage)
    let dst = new cv.Mat()
    let rgbaResult = new cv.Mat()

    try {
      // Calculate output dimensions based on corner distances
      const topWidth = Math.sqrt(
        Math.pow(corners.value[1].x - corners.value[0].x, 2) +
          Math.pow(corners.value[1].y - corners.value[0].y, 2),
      )
      const bottomWidth = Math.sqrt(
        Math.pow(corners.value[2].x - corners.value[3].x, 2) +
          Math.pow(corners.value[2].y - corners.value[3].y, 2),
      )
      const leftHeight = Math.sqrt(
        Math.pow(corners.value[3].x - corners.value[0].x, 2) +
          Math.pow(corners.value[3].y - corners.value[0].y, 2),
      )
      const rightHeight = Math.sqrt(
        Math.pow(corners.value[2].x - corners.value[1].x, 2) +
          Math.pow(corners.value[2].y - corners.value[1].y, 2),
      )

      const outputWidth = Math.max(topWidth, bottomWidth)
      const outputHeight = Math.max(leftHeight, rightHeight)

      // Source points (detected corners)
      const srcCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
        corners.value[0].x,
        corners.value[0].y,
        corners.value[1].x,
        corners.value[1].y,
        corners.value[2].x,
        corners.value[2].y,
        corners.value[3].x,
        corners.value[3].y,
      ])

      // Destination points (rectangle)
      const dstCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0,
        0,
        outputWidth,
        0,
        outputWidth,
        outputHeight,
        0,
        outputHeight,
      ])

      // Get perspective transform matrix and apply transformation
      const transformMatrix = cv.getPerspectiveTransform(srcCorners, dstCorners)
      cv.warpPerspective(src, dst, transformMatrix, new cv.Size(outputWidth, outputHeight))

      // Convert to RGBA for canvas display
      cv.cvtColor(dst, rgbaResult, cv.COLOR_RGB2RGBA)

      // Set result canvas size and draw transformed image
      resultCanvas.value.width = outputWidth
      resultCanvas.value.height = outputHeight
      const resultCtx = resultCanvas.value.getContext('2d')

      // Create ImageData from the transformed matrix
      const imageData = new ImageData(
        new Uint8ClampedArray(rgbaResult.data),
        rgbaResult.cols,
        rgbaResult.rows,
      )
      resultCtx.putImageData(imageData, 0, 0)

      // Create blob URL for the transformed image
      resultCanvas.value.toBlob((blob) => {
        if (blob) {
          transformedImage.value = URL.createObjectURL(blob)
        }
      }, 'image/png')

      // Show result canvas and update button states
      canvas.value.style.display = 'none'
      resultCanvas.value.style.display = 'block'
      showTransform.value = false
      showSave.value = true

      // Cleanup OpenCV objects
      srcCorners.delete()
      dstCorners.delete()
      transformMatrix.delete()
    } catch (error) {
      console.error('Transform error:', error)
    } finally {
      src.delete()
      dst.delete()
      rgbaResult.delete()
    }
  }

  function saveImage() {
    if (transformedImage.value) {
      scannedImages.value.push(transformedImage.value)
      transformedImage.value = null
    }
    resetScan()
  }

  function deleteScan(index) {
    const imgUrl = scannedImages.value[index]
    URL.revokeObjectURL(imgUrl)
    scannedImages.value.splice(index, 1)
  }

  function resetScan() {
    canvas.value.style.display = 'none'
    resultCanvas.value.style.display = 'none'
    corners.value = []

    showTake.value = true
    showTransform.value = false
    showRetake.value = false
    showSave.value = false
  }

  return {
    canvas,
    resultCanvas,
    corners,
    scannedImages,
    transformedImage,
    showTake,
    showTransform,
    showRetake,
    showSave,
    takePhoto,
    detectEdges,
    transformImage,
    saveImage,
    deleteScan,
    resetScan,
  }
}
