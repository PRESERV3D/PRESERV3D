/**
 * Reusable pagination composable for optimized data loading
 * Reduces initial load time by fetching data in chunks
 */
import { ref, computed } from 'vue'

export function usePagination(fetchFunction, options = {}) {
  const { pageSize = 20, initialPage = 1, sortField = 'uploaded_at', sortOrder = 'desc' } = options

  const currentPage = ref(initialPage)
  const totalItems = ref(0)
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  const totalPages = computed(() => Math.ceil(totalItems.value / pageSize))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPreviousPage = computed(() => currentPage.value > 1)

  const fetchPage = async (page = currentPage.value) => {
    loading.value = true
    error.value = null

    try {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const result = await fetchFunction({
        from,
        to,
        sortField,
        sortOrder,
      })

      if (result.error) {
        throw result.error
      }

      items.value = result.data
      totalItems.value = result.count
      currentPage.value = page
    } catch (err) {
      error.value = err
      console.error('Pagination fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  const nextPage = async () => {
    if (hasNextPage.value) {
      await fetchPage(currentPage.value + 1)
    }
  }

  const previousPage = async () => {
    if (hasPreviousPage.value) {
      await fetchPage(currentPage.value - 1)
    }
  }

  const goToPage = async (page) => {
    if (page >= 1 && page <= totalPages.value) {
      await fetchPage(page)
    }
  }

  const refresh = async () => {
    await fetchPage(currentPage.value)
  }

  return {
    items,
    currentPage,
    totalPages,
    totalItems,
    loading,
    error,
    hasNextPage,
    hasPreviousPage,
    fetchPage,
    nextPage,
    previousPage,
    goToPage,
    refresh,
    pageSize,
  }
}
