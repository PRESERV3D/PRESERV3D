// Centralized PDF.js worker configuration boot file
// Ensures the app uses the local worker bundled in /public/pdf.worker.min.mjs

export default (/* { app, router, store, ssrContext } */) => {
  try {
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      // Set the worker to the local copy in /public
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    } else {
      // pdfjsLib not loaded yet; attempt to set it when available
      window.addEventListener('pdfjsLoaded', () => {
        try {
          if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        } catch (e) {
          console.warn('pdfjsLoaded handler error:', e)
        }
      })
    }
  } catch (err) {
    // Non-fatal: leave it to components to set worker if necessary
    console.warn('Failed to configure pdf.js worker in boot:', err)
  }
}
