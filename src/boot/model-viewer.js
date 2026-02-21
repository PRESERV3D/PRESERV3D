export default ({ app, router }) => {
  // Mark model-viewer as custom element (still needed for Vue compiler)
  app.config.compilerOptions.isCustomElement = (tag) => tag === 'model-viewer'

  // Track if library is loaded
  let modelViewerLoaded = false

  const loadModelViewer = async () => {
    if (modelViewerLoaded) return

    try {
      await import('@google/model-viewer')
      modelViewerLoaded = true
    } catch (error) {
      console.error('Failed to load Model Viewer:', error)
      throw error
    }
  }

  // Routes that need model-viewer
  const MODEL_VIEWER_ROUTES = [
    'admindash',
    'artifacts',
    'collection',
    'gallery',
    'home',
    'view-artifact',
    'admin-view-artifact',
    'testing-artifacts',
  ]

  router.beforeEach(async (to, from, next) => {
    const needsModelViewer = MODEL_VIEWER_ROUTES.includes(to.name)

    if (needsModelViewer && !modelViewerLoaded) {
      try {
        await loadModelViewer()
        next()
      } catch (error) {
        console.error('Failed to load Model Viewer, redirecting to home: ', error)
        next('/home')
      }
    } else {
      next()
    }
  })

  // Make loadModelViewer available globally (optional)
  app.config.globalProperties.$loadModelViewer = loadModelViewer
}

// Export for use in components
export const loadModelViewer = async () => {
  if (!window.customElements.get('model-viewer')) {
    await import('@google/model-viewer')
  }
}
