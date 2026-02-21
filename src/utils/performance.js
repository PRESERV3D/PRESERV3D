export function measurePageLoad() {
  if (!window.performance || !window.performance.timing) {
    console.warn('Performance API not supported')
    return null
  }

  const timing = window.performance.timing
  const metrics = {
    // Page load times
    redirectTime: timing.redirectEnd - timing.redirectStart,
    dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
    tcpTime: timing.connectEnd - timing.connectStart,
    requestTime: timing.responseStart - timing.requestStart,
    responseTime: timing.responseEnd - timing.responseStart,
    domProcessing: timing.domComplete - timing.domLoading,
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    totalLoadTime: timing.loadEventEnd - timing.navigationStart,

    // First paint metrics
    firstPaint: 0,
    firstContentfulPaint: 0,
  }

  // Get paint timing
  const paintEntries = performance.getEntriesByType('paint')
  paintEntries.forEach((entry) => {
    if (entry.name === 'first-paint') {
      metrics.firstPaint = entry.startTime
    } else if (entry.name === 'first-contentful-paint') {
      metrics.firstContentfulPaint = entry.startTime
    }
  })

  return metrics
}

function formatMetrics(metrics) {
  console.group('📊 PRESERV3D Performance Metrics')
  console.log('🔄 DNS Lookup:', `${metrics.dnsTime.toFixed(0)}ms`)
  console.log('🔌 TCP Connection:', `${metrics.tcpTime.toFixed(0)}ms`)
  console.log('📨 Request:', `${metrics.requestTime.toFixed(0)}ms`)
  console.log('📦 Response:', `${metrics.responseTime.toFixed(0)}ms`)
  console.log('🎨 First Paint:', `${metrics.firstPaint.toFixed(0)}ms`)
  console.log('🖼️ First Contentful Paint:', `${metrics.firstContentfulPaint.toFixed(0)}ms`)
  console.log('🏗️ DOM Content Loaded:', `${metrics.domContentLoaded.toFixed(0)}ms`)
  console.log('✅ Total Load Time:', `${metrics.totalLoadTime.toFixed(0)}ms`)
  console.groupEnd()

  // Performance rating
  const loadTime = metrics.totalLoadTime
  if (loadTime < 1000) {
    console.log('🚀 Excellent performance!')
  } else if (loadTime < 2000) {
    console.log('✅ Good performance')
  } else if (loadTime < 3000) {
    console.log('⚠️ Moderate performance - consider optimization')
  } else {
    console.log('❌ Poor performance - optimization needed')
  }
}

export function measureBundleSize() {
  if (!window.performance || !window.performance.getEntriesByType) {
    return null
  }

  const resources = performance.getEntriesByType('resource')
  const bundles = {
    js: 0,
    css: 0,
    images: 0,
    fonts: 0,
    other: 0,
    total: 0,
  }

  resources.forEach((resource) => {
    const size = resource.transferSize || 0
    const name = resource.name.toLowerCase()

    if (name.endsWith('.js')) {
      bundles.js += size
    } else if (name.endsWith('.css')) {
      bundles.css += size
    } else if (name.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
      bundles.images += size
    } else if (name.match(/\.(woff|woff2|ttf|eot)$/)) {
      bundles.fonts += size
    } else {
      bundles.other += size
    }
  })

  bundles.total = bundles.js + bundles.css + bundles.images + bundles.fonts + bundles.other

  return bundles
}

function formatBundleSize(bundles) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  console.group('📦 Bundle Size Analysis')
  console.log('📜 JavaScript:', formatBytes(bundles.js))
  console.log('🎨 CSS:', formatBytes(bundles.css))
  console.log('🖼️ Images:', formatBytes(bundles.images))
  console.log('🔤 Fonts:', formatBytes(bundles.fonts))
  console.log('📁 Other:', formatBytes(bundles.other))
  console.log('💾 Total:', formatBytes(bundles.total))
  console.groupEnd()

  // Size rating
  const totalMB = bundles.total / (1024 * 1024)
  if (totalMB < 1) {
    console.log('🚀 Excellent bundle size!')
  } else if (totalMB < 3) {
    console.log('✅ Good bundle size')
  } else if (totalMB < 5) {
    console.log('⚠️ Large bundle - consider code splitting')
  } else {
    console.log('❌ Very large bundle - optimization strongly recommended')
  }
}

export function measureApiCall(name, promise) {
  const start = performance.now()

  return promise
    .then((result) => {
      const duration = performance.now() - start
      console.log(`⚡ API Call [${name}]:`, `${duration.toFixed(0)}ms`)
      return result
    })
    .catch((error) => {
      const duration = performance.now() - start
      console.error(`❌ API Call [${name}] failed after ${duration.toFixed(0)}ms:`, error)
      throw error
    })
}

export function measureComponentRender(componentName) {
  const start = performance.now()

  return () => {
    const duration = performance.now() - start
    console.log(`🎨 Component [${componentName}] rendered in:`, `${duration.toFixed(2)}ms`)
  }
}

export function startMonitoring() {
  // Only run in browser environment (not SSR)
  if (typeof window === 'undefined') {
    return
  }

  // Wait for page to fully load
  window.addEventListener('load', () => {
    setTimeout(() => {
      console.log('\n')
      console.log('═══════════════════════════════════════════')
      console.log('   PRESERV3D Performance Report')
      console.log('═══════════════════════════════════════════')

      const metrics = measurePageLoad()
      if (metrics) {
        formatMetrics(metrics)
      }

      console.log('\n')

      const bundles = measureBundleSize()
      if (bundles) {
        formatBundleSize(bundles)
      }

      console.log('\n')
      console.log('💡 Tip: Run Lighthouse for detailed analysis')
      console.log('═══════════════════════════════════════════')
      console.log('\n')
    }, 1000)
  })
}

export function observePerformance(callback) {
  if (!window.PerformanceObserver) {
    console.warn('PerformanceObserver not supported')
    return null
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      callback(entry)
    }
  })

  observer.observe({ entryTypes: ['measure', 'navigation', 'resource', 'paint'] })

  return observer
}

export function markMilestone(name) {
  if (window.performance && window.performance.mark) {
    performance.mark(name)
    console.log(`📍 Milestone: ${name}`)
  }
}

export function measureBetween(startMark, endMark, measureName) {
  if (window.performance && window.performance.measure) {
    try {
      performance.measure(measureName, startMark, endMark)
      const measures = performance.getEntriesByName(measureName)
      if (measures.length > 0) {
        const duration = measures[0].duration
        console.log(`⏱️ ${measureName}:`, `${duration.toFixed(2)}ms`)
        return duration
      }
    } catch (error) {
      console.warn('Error measuring performance:', error)
    }
  }
  return null
}
