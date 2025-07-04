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
                    @update:model-value="applyFilters"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-select
                    v-model="authorFilter"
                    :options="authorOptions"
                    outlined
                    label="Select Author"
                    dense
                    clearable
                    @update:model-value="applyFilters"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-select
                    v-model="dateFilter"
                    :options="dateOptions"
                    outlined
                    label="Select Year"
                    dense
                    clearable
                    @update:model-value="applyFilters"
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
              <q-item clickable v-close-popup @click="setSortOption('Newest')">
                <q-item-section>
                  <q-item-label>Newest</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="sortOption === 'Newest'" name="check" color="primary" />
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setSortOption('Oldest')">
                <q-item-section>
                  <q-item-label>Oldest</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="sortOption === 'Oldest'" name="check" color="primary" />
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setSortOption('Title A-Z')">
                <q-item-section>
                  <q-item-label>Title A-Z</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="sortOption === 'Title A-Z'" name="check" color="primary" />
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setSortOption('Title Z-A')">
                <q-item-section>
                  <q-item-label>Title Z-A</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="sortOption === 'Title Z-A'" name="check" color="primary" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>
    </div>

    <!-- Three Artifacts per Row Grid -->
    <div class="artifacts-grid">
      <div v-for="(model, i) in displayedModels" :key="i" class="artifact-card-wrapper">
        <q-card class="my-card" rounded bordered>
          <div class="card">
            <model-viewer
              :src="model.file_url"
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
                @click="logClick(model.id, 'artifact')"
              >
                <div class="text-subtitle2 artifact-title">
                  {{ model.metadata?.title || model.file_name }}
                </div>
              </router-link>
              <div class="action-icons">
                <!-- View Icon with Count -->
                <div class="icon-with-count">
                  <q-icon name="visibility" class="action-icon view-icon" size="18px" />
                  <span class="count-text">{{ modelStore.viewCounts[model.id] || 0 }}</span>
                </div>

                <!-- Star Icon with Count -->
                <!--                <div class="icon-with-count">-->
                <!--                  <q-icon-->
                <!--                    :name="model.starred ? 'star' : 'star_border'"-->
                <!--                    class="action-icon star-icon"-->
                <!--                    :class="{ 'starred': model.starred }"-->
                <!--                    size="18px"-->
                <!--                    @click.stop="toggleStar(model.id)"-->
                <!--                  />-->
                <!--                  <span class="count-text">{{ model.star_count || 0 }}</span>-->
                <!--                </div>-->

                <!-- Bookmark Icon -->
                <q-icon
                  name="bookmark_border"
                  class="action-icon bookmark-icon"
                  size="18px"
                  @click.stop="openBookmarkDialog(model, 'artifact')"
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

    <!-- Bookmark Dialog -->
    <q-dialog v-model="dialogOpen">
      <q-card class="add-to-collections">
        <q-card-section class="collection-header">
          <div class="sub-font-3" style="font-size: 18px; font-weight: 800">
            Choose a Collection
          </div>
        </q-card-section>
        <q-card-section class="collections-scroll-container">
          <div v-if="userCollections.length > 0">
            <div
              v-for="collection in userCollections"
              :key="collection.collection_id"
              class="q-py-sm flex items-center justify-between"
              style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 500"
            >
              <span>{{ collection.collection_name }}</span>
              <q-checkbox
                v-model="selectedCollections"
                :val="collection.collection_id"
                dense
                color="primary"
              />
            </div>
          </div>

          <div v-else class="text-caption text-grey text-center">
            You don't have any collections yet.
          </div>
        </q-card-section>

        <q-card-actions class="collection-footer" align="center">
          <q-btn label="Save" color="primary" @click="saveToSelectedCollections" />
          <q-btn flat label="Cancel" v-close-popup @click="resetForm" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Message Dialog -->
    <q-dialog v-model="notifyDialogOpen">
      <q-card class="sucess-add-to-collection">
        <q-card-section class="sub-font-3" style="font-size: 20px; font-weight: 700">{{
          notifyDialogTitle
        }}</q-card-section>
        <q-card-section class="sub-font-3" style="font-size: 14px; font-weight: 400">{{
          notifyDialogMessage
        }}</q-card-section>
        <q-card-actions>
          <q-btn flat label="Close" class="btn-save" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useModelStore } from 'stores/modelStore'
import { useSearchStore } from 'stores/searchStore'
import { useUserStore } from 'stores/user'
import { supabase } from 'boot/supabase'
import '@google/model-viewer'

const modelStore = useModelStore()
const searchStore = useSearchStore()
const userStore = useUserStore()

// Reactive data
const loading = ref(false)
const searchQuery = ref('')
const categoryFilter = ref(null)
const authorFilter = ref(null)
const dateFilter = ref(null)
const sortOption = ref('Newest')
const itemsToShow = ref('all')

// Filter options - will be populated from data
const categoryOptions = ref([])
const authorOptions = ref([])
const dateOptions = ref([])

// Collection dialog state
const dialogOpen = ref(false)
const selectedModel = ref(null)
const selectedItemType = ref('artifact')
const userCollections = ref([])
const selectedCollections = ref([])
const existingCollectionIds = ref([])

// Notification dialog state
const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

// Computed properties
const filteredModels = computed(() => {
  return searchStore.query ? searchStore.results : modelStore.filteredModels
})

if (userStore.profile.role === undefined) {
  userStore.fetchProfile()
}

const userRole = userStore.profile.role
const isAdmin = computed(() => userRole === 'admin')

const sortedModels = computed(() => {
  const models = [...filteredModels.value]

  return models.sort((a, b) => {
    let aValue, bValue

    switch (sortOption.value) {
      case 'Newest':
        aValue = new Date(a.uploaded_at || a.created_at || 0)
        bValue = new Date(b.uploaded_at || b.created_at || 0)
        return bValue - aValue
      case 'Oldest':
        aValue = new Date(a.uploaded_at || a.created_at || 0)
        bValue = new Date(b.uploaded_at || b.created_at || 0)
        return aValue - bValue
      case 'Title A-Z':
        aValue = (a.metadata?.title || a.file_name).toLowerCase()
        bValue = (b.metadata?.title || b.file_name).toLowerCase()
        return aValue.localeCompare(bValue)
      case 'Title Z-A':
        aValue = (a.metadata?.title || a.file_name).toLowerCase()
        bValue = (b.metadata?.title || b.file_name).toLowerCase()
        return bValue.localeCompare(aValue)
      default:
        return 0
    }
  })
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

const setSortOption = (value) => {
  sortOption.value = value
  onSort()
}

const onSort = () => {
  switch (sortOption.value) {
    case 'Newest':
      modelStore.sortBy('uploaded_at', 'desc')
      break
    case 'Oldest':
      modelStore.sortBy('uploaded_at', 'asc')
      break
    case 'Title A-Z':
      modelStore.sortBy('title', 'asc')
      break
    case 'Title Z-A':
      modelStore.sortBy('title', 'desc')
      break
  }
}

const applyFilters = () => {
  modelStore.filterBy({
    category: categoryFilter.value,
    author: authorFilter.value,
    date: dateFilter.value,
  })
}

const clearFilters = () => {
  searchQuery.value = ''
  categoryFilter.value = null
  authorFilter.value = null
  dateFilter.value = null
  applyFilters()
}

// const toggleStar = (modelId) => {
//   const model = modelStore.models.find(m => m.id === modelId)
//   if (model) {
//     model.starred = !model.starred
//     // You can add API call here to persist the change
//   }
// }

// Collection dialog methods
const openBookmarkDialog = async (model, type = 'artifact') => {
  selectedModel.value = model
  selectedItemType.value = type
  dialogOpen.value = true

  await loadUserCollections()

  // Check existing collections for this item
  const { data: existingItems, error } = await supabase
    .from('collection_items')
    .select('collection_id')
    .eq('item_id', model.id)
    .eq('item_type', type)

  if (error) {
    console.error('Error checking existing collections:', error)
    selectedCollections.value = []
    existingCollectionIds.value = []
    return
  }

  const existingIds = existingItems.map((item) => item.collection_id)
  selectedCollections.value = [...existingIds]
  existingCollectionIds.value = [...existingIds]
}

const loadUserCollections = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (authError || !userId) {
    console.error('Auth error loading collections:', authError)
    return
  }

  const { data, error } = await supabase
    .from('collections')
    .select('collection_id, collection_name')
    .eq('user_id', userId)

  if (!error) {
    userCollections.value = data
  } else {
    console.error('Failed to load collections:', error)
  }
}

const saveToSelectedCollections = async () => {
  const model = selectedModel.value

  if (!model) return

  try {
    const insertedCollections = []
    const removedCollections = []

    const toAdd = selectedCollections.value.filter(
      (id) => !existingCollectionIds.value.includes(id),
    )
    const toRemove = existingCollectionIds.value.filter(
      (id) => !selectedCollections.value.includes(id),
    )

    for (const collectionId of toAdd) {
      const collection = userCollections.value.find((c) => c.collection_id === collectionId)

      const { error: insertError } = await supabase.from('collection_items').insert({
        collection_id: collectionId,
        item_id: model.id,
        item_type: selectedItemType.value,
      })

      if (insertError) {
        console.error('Insert failed:', insertError)
        showNotifyDialog('Error', 'Failed to save to collection(s).')
        return
      }

      if (collection) insertedCollections.push(collection.collection_name)
    }

    for (const collectionId of toRemove) {
      const collection = userCollections.value.find((c) => c.collection_id === collectionId)

      const { error: deleteError } = await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('item_id', model.id)
        .eq('item_type', selectedItemType.value)

      if (deleteError) {
        console.error('Delete failed:', deleteError)
        showNotifyDialog('Error', 'Failed to remove from collection(s).')
        return
      }

      if (collection) removedCollections.push(collection.collection_name)
    }

    const itemName = model.metadata?.title || model.file_name
    let message = ''

    if (insertedCollections.length > 0) {
      message += `"${itemName}" was added to: ${insertedCollections.join(', ')}.\n`
    }

    if (removedCollections.length > 0) {
      message += `"${itemName}" was removed from: ${removedCollections.join(', ')}.`
    }

    if (message) {
      showNotifyDialog('Notice', message.trim())
    }

    dialogOpen.value = false
  } catch (err) {
    console.error('Unexpected error:', err)
    showNotifyDialog('Error', 'An unexpected error occurred.')
  }
}

const resetForm = () => {
  selectedCollections.value = []
  existingCollectionIds.value = []
}

const showNotifyDialog = (title, message) => {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

async function logClick(itemId, itemType) {
  if (!isAdmin.value) {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    const model = await modelStore.getModelById(itemId)

    if (authError || !userId) {
      console.error('Auth error logging click:', authError)
      return
    }

    try {
      const { error } = await supabase.from('user_activity_log').insert({
        user_id: userId,
        item_id: itemId,
        title: model.title || 'Untitled',
        item_type: itemType,
        clicked_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      }

      if (error) {
        console.error('Error logging click:', error)
      } else {
        console.log('Click Logged')
      }
    } catch (err) {
      console.error('Error logging click:', err)
    }
  }
}

// Fetch all artifacts from Supabase
const fetchAllArtifacts = async () => {
  try {
    const { data, error } = await supabase
      .from('artifacts_metadata')
      .select('id, file_name, file_url, metadata, uploaded_at, updated_at')
      .order('uploaded_at', { ascending: false })

    if (!error) {
      // Add some mock data for demonstration compatibility
      const enhancedModels = data.map((model) => ({
        ...model,
        bookmarked: false,
        // starred: false,
        // star_count: Math.floor(Math.random() * 100)
      }))

      modelStore.setModels(enhancedModels)

      // Extract unique values for filters
      const authors = new Set()
      const years = new Set()
      const categories = new Set()

      data.forEach((model) => {
        if (model.metadata?.author) {
          const authorList = model.metadata.author.split(',').map((a) => a.trim())
          authorList.forEach((a) => authors.add(a))
        }

        if (model.metadata?.date) years.add(model.metadata.date?.slice(0, 4))

        if (Array.isArray(model.metadata?.categories)) {
          model.metadata.categories.forEach((cat) => categories.add(cat))
        }
      })

      authorOptions.value = Array.from(authors)
      categoryOptions.value = Array.from(categories)
      dateOptions.value = Array.from(years).sort((a, b) => b - a)
    }
  } catch (error) {
    console.error('Error loading artifacts:', error)
  }
}

// Watch for filter changes
watch(
  () => modelStore.filteredModels,
  (mods) => {
    const authors = new Set()
    const years = new Set()
    const categories = new Set()

    mods.forEach((mod) => {
      const meta = mod.metadata || {}

      if (meta.author) {
        meta.author.split(',').forEach((a) => authors.add(a.trim()))
      }

      if (meta.date) {
        const year = meta.date.slice(0, 4)
        years.add(year)
      }

      if (Array.isArray(meta.categories)) {
        meta.categories.forEach((cat) => categories.add(cat))
      }
    })

    authorOptions.value = [...authors].sort()
    categoryOptions.value = [...categories].sort()
    dateOptions.value = [...years].sort((a, b) => b - a)
  },
  { immediate: true },
)

// Watch for filter changes and reset items to show
watch([categoryFilter, authorFilter, dateFilter], () => {
  if (itemsToShow.value !== 'all') {
    itemsToShow.value = 'all'
  }
})

// Initialize
onMounted(async () => {
  loading.value = true
  try {
    if (!searchStore.query) {
      await fetchAllArtifacts()
    }

    await modelStore.fetchViewCounts()
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  searchStore.clear()
})
</script>
