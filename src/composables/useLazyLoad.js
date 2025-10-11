/**
 * Lazy loading composable for heavy libraries
 * Defers loading until needed to improve initial load time
 */
import { ref } from 'vue'

const loadedModules = new Map()

export function useLazyLoad() {
  const loading = ref(false)
  const error = ref(null)

  /**
   * Load PDF.js library on demand
   */
  const loadPdfJs = async () => {
    if (loadedModules.has('pdfjs')) {
      return loadedModules.get('pdfjs')
    }

    loading.value = true
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      loadedModules.set('pdfjs', pdfjsLib)
      return pdfjsLib
    } catch (err) {
      error.value = err
      console.error('Failed to load PDF.js:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Load Model Viewer library on demand
   */
  const loadModelViewer = async () => {
    if (loadedModules.has('model-viewer')) {
      return loadedModules.get('model-viewer')
    }

    loading.value = true
    try {
      const modelViewer = await import('@google/model-viewer')
      loadedModules.set('model-viewer', modelViewer)
      return modelViewer
    } catch (err) {
      error.value = err
      console.error('Failed to load Model Viewer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Load Chart.js library on demand
   */
  const loadChartJs = async () => {
    if (loadedModules.has('chartjs')) {
      return loadedModules.get('chartjs')
    }

    loading.value = true
    try {
      const Chart = await import('chart.js')
      loadedModules.set('chartjs', Chart)
      return Chart
    } catch (err) {
      error.value = err
      console.error('Failed to load Chart.js:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Load QRCode library on demand
   */
  const loadQRCode = async () => {
    if (loadedModules.has('qrcode')) {
      return loadedModules.get('qrcode')
    }

    loading.value = true
    try {
      const QRCode = await import('qrcode')
      loadedModules.set('qrcode', QRCode)
      return QRCode
    } catch (err) {
      error.value = err
      console.error('Failed to load QRCode:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Load Tesseract.js for OCR on demand
   */
  const loadTesseract = async () => {
    if (loadedModules.has('tesseract')) {
      return loadedModules.get('tesseract')
    }

    loading.value = true
    try {
      const Tesseract = await import('tesseract.js')
      loadedModules.set('tesseract', Tesseract)
      return Tesseract
    } catch (err) {
      error.value = err
      console.error('Failed to load Tesseract.js:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    loadPdfJs,
    loadModelViewer,
    loadChartJs,
    loadQRCode,
    loadTesseract,
  }
}
