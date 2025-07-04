<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Artifacts</h2>
      <div class="subtitle-btn-row">
        <h5 class="q-mt-xs q-mb-lg subtitle">Discover preserved treasures in immersive 3D.</h5>
        <div class="artifact-btn">
          <span class="showing-text">Showing </span>

          <q-btn-dropdown
            outline
            color="black"
            :label="itemsToShow === 'all' ? 'All' : itemsToShow.toString()"
            size="sm"
            class="q-ml-sm artifact-btn-style"
          >
            <q-list>
              <q-item clickable v-close-popup @click="setItemsToShow('all')">
                <q-item-section>All</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setItemsToShow(9)">
                <q-item-section>9</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setItemsToShow(12)">
                <q-item-section>12</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setItemsToShow(18)">
                <q-item-section>18</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <q-btn-dropdown
            outline
            color="black"
            label="Filter"
            icon="filter_list"
            size="sm"
            class="q-ml-sm artifact-btn-style"
          >
            <q-list class="filter-dropdown">
              <q-item>
                <q-item-section>
                  <q-select
                    v-model="categoryFilter"
                    :options="categoryOptions"
                    outlined
                    label="Select Category"
                    dense
                    clearable
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-select
                    v-model="statusFilter"
                    :options="statusOptions"
                    outlined
                    label="Select Status"
                    dense
                    clearable
                  />
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="clearFilters">
                <q-item-section>
                  <q-item-label>Clear All Filters</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="clear" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <q-btn-dropdown
            outline
            color="black"
            label="Sort"
            icon="sort"
            size="sm"
            class="q-ml-xs artifact-btn-style"
          >
            <q-list>
              <q-item-label header>Sort by</q-item-label>
              <q-item clickable v-close-popup @click="setSortBy('name')">
                <q-item-section>
                  <q-item-label>Name</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="sortBy === 'name'" name="check" color="primary" />
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setSortBy('popularity')">
                <q-item-section>
                  <q-item-label>Popularity</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="sortBy === 'popularity'" name="check" color="primary" />
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item-label header>Order</q-item-label>
              <q-item clickable v-close-popup @click="setSortOrder('asc')">
                <q-item-section>
                  <q-item-label>Ascending</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="sortOrder === 'asc'" name="check" color="primary" />
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setSortOrder('desc')">
                <q-item-section>
                  <q-item-label>Descending</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="sortOrder === 'desc'" name="check" color="primary" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn
            @click="addNewCollection"
            label="Add New"
            icon="add_circle"
            style="min-width: 150px"
            class="add-new-btn"
            no-caps
            unelevated
          />
        </div>
      </div>
    </div>



    <!-- Three Artifacts per Row Grid -->
    <div class="artifacts-grid">
      <div
        v-for="(model, i) in displayedModels"
        :key="i"
        class="artifact-card-wrapper"
      >
        <q-card class="my-card" rounded bordered>
          <div class="card">
            <!-- Information icon positioned in upper left -->
            <q-btn
              flat
              round
              icon="info_outline"
              class="info-icon-overlay"
              size="md"
              @click.stop="showModelInfo(model.id)"
            />
            <model-viewer
              :src="model.file_url"
              camera-controls
              loading="lazy"
              auto-rotate
              auto-rotate-delay="1500"
              rotation-per-second="10deg"
              shadow-intensity="1"
              class="artifacts"
              style="width: 100%; height: 400px"
            />
          </div>

          <q-card-section class="q-pa-sm artifact-card-section">
            <div class="artifact-title-icon-row">
              <router-link
                :to="{ name: 'view-artifact', params: { id: model.id } }"
                class="artifact-title-link"
              >
                <div class="text-subtitle2 artifact-title">{{ model.metadata?.title || model.file_name }}</div>
              </router-link>
              <div class="action-icons">
                <!-- View Icon with Count -->
                <div class="icon-with-count">
                  <q-icon
                    name="visibility"
                    class="action-icon view-icon"
                    size="18px"
                  />
                  <span class="count-text">{{ model.view_count || 0 }}</span>
                </div>

                <!-- Star Icon with Count -->
                <div class="icon-with-count">
                  <q-icon
                    :name="model.starred ? 'star' : 'star_border'"
                    class="action-icon star-icon"
                    :class="{ 'starred': model.starred }"
                    size="18px"
                    @click.stop="toggleStar(model.id)"
                  />
                  <span class="count-text">{{ model.star_count || 0 }}</span>
                </div>

                <!-- Bookmark Icon -->
                <q-icon
                  :name="model.bookmarked ? 'bookmark' : 'bookmark_border'"
                  class="action-icon bookmark-icon"
                  :class="{ 'bookmarked': model.bookmarked }"
                  size="18px"
                  @click.stop="toggleBookmark(model.id)"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Show All -->
    <div v-if="hasMoreItems" class="text-center q-mt-lg">
      <q-btn
        outline
        color="primary"
        :label="`Show All ${sortedModels.length} Items`"
        @click="setItemsToShow('all')"
      />
    </div>

    <!-- Empty State -->
    <div v-if="displayedModels.length === 0 && !loading" class="text-center q-mt-xl">
      <q-icon name="inventory_2" size="4rem" color="grey-5" />
      <div class="text-h6 q-mt-md text-grey-6">No artifacts found</div>
      <div class="text-body2 text-grey-5">Try adjusting your filters or search terms</div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useModelStore } from 'stores/modelStore'
import '@google/model-viewer'

// PAAYOS ME HERE
const modelStore = useModelStore()

// Reactive data
const loading = ref(false)
const searchQuery = ref('')
const categoryFilter = ref(null)
const statusFilter = ref(null)
const sortBy = ref('name')
const sortOrder = ref('asc')
const itemsToShow = ref('all')

// Options for filters
const categoryOptions = ['Trophies', 'Paintings', 'Materials', 'Plaques']
const statusOptions = ['Published', 'Draft', 'Archived']


const filteredModels = computed(() => {
  let filtered = [...modelStore.models]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(model =>
      (model.metadata?.title || model.file_name).toLowerCase().includes(query)
    )
  }

  // Category filter
  if (categoryFilter.value) {
    filtered = filtered.filter(model =>
      model.category === categoryFilter.value
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(model =>
      model.status === statusFilter.value
    )
  }

  return filtered
})

const sortedModels = computed(() => {
  const sorted = [...filteredModels.value]

  sorted.sort((a, b) => {
    let aValue, bValue

    switch (sortBy.value) {
      case 'name':
        aValue = (a.metadata?.title || a.file_name).toLowerCase()
        bValue = (b.metadata?.title || b.file_name).toLowerCase()
        break
      case 'date':
        aValue = new Date(a.created_at || 0)
        bValue = new Date(b.created_at || 0)
        break
      case 'popularity':
        aValue = a.views || 0
        bValue = b.views || 0
        break
      default:
        return 0
    }

    if (sortOrder.value === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  return sorted
})

const displayedModels = computed(() => {
  if (itemsToShow.value === 'all') {
    return sortedModels.value
  }
  return sortedModels.value.slice(0, itemsToShow.value)
})

const hasMoreItems = computed(() => {
  return itemsToShow.value !== 'all' && sortedModels.value.length > itemsToShow.value
})

// Methods
const setItemsToShow = (value) => {
  itemsToShow.value = value
}

const setSortBy = (value) => {
  sortBy.value = value
}

const setSortOrder = (value) => {
  sortOrder.value = value
}

const clearFilters = () => {
  searchQuery.value = ''
  categoryFilter.value = null
  statusFilter.value = null
}

const showModelInfo = (modelId) => {
  console.log('Show info for model:', modelId)

}

const toggleBookmark = (modelId) => {
  const model = modelStore.models.find(m => m.id === modelId)
  if (model) {
    model.bookmarked = !model.bookmarked
  }
}

const toggleStar = (modelId) => {
  const model = modelStore.models.find(m => m.id === modelId)
  if (model) {
    model.starred = !model.starred
  }
}

// Watch Count
watch([searchQuery, categoryFilter, statusFilter], () => {
  // Reset to show all when filters change
  if (itemsToShow.value !== 'all') {
    itemsToShow.value = 'all'
  }
})


onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('http://localhost:3000/models')
    const models = await res.json()

    // Add some mock data for demonstration
    const enhancedModels = models.map(model => ({
      ...model,
      bookmarked: false,
      starred: false,
      category: ['Trophies', 'Paintings', 'Materials', 'Plaques'][Math.floor(Math.random() * 3)],
      status: ['Published', 'Draft', 'Archived'][Math.floor(Math.random() * 2)],
      views: Math.floor(Math.random() * 1000)
    }))

    modelStore.setModels(enhancedModels)
  } catch (err) {
    console.error('Failed to load models:', err)
  } finally {
    loading.value = false
  }
})
</script>

