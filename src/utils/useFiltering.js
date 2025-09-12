import { ref } from 'vue'
import { useSearchStore } from 'src/stores/searchStore'
import { useDocumentsStore } from 'src/stores/documentsStore'
import { useModelStore } from 'src/stores/modelStore'

const documentsStore = useDocumentsStore()
const searchStore = useSearchStore()
const modelStore = useModelStore()

export function useFiltering() {
  const selectedAuthors = ref(new Set())
  const selectedDates = ref(new Set())
  const selectedCategories = ref(new Set(['All']))

  const applyFiltersDocuments = () => {
    searchStore.clear()

    const filterData = {
      categories: Array.from(selectedCategories.value),
      authors: Array.from(selectedAuthors.value),
      dates: Array.from(selectedDates.value),
    }
    console.log('Applying filters:', filterData)

    documentsStore.filterBy(filterData)
  }

  const applyFiltersModels = () => {
    searchStore.clear()

    const filterData = {
      categories: Array.from(selectedCategories.value),
      authors: Array.from(selectedAuthors.value),
      dates: Array.from(selectedDates.value),
    }
    console.log('Applying filters:', filterData)

    modelStore.filterBy(filterData)
  }

  const clearFilters = () => {
    selectedAuthors.value = new Set()
    selectedDates.value = new Set()
    selectedCategories.value = new Set(['All'])
    applyFiltersDocuments()
    applyFiltersModels()
  }

  return {
    selectedAuthors,
    selectedDates,
    selectedCategories,
    applyFiltersDocuments,
    applyFiltersModels,
    clearFilters,
  }
}
