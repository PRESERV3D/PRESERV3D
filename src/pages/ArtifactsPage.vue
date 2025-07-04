<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Artifacts</h2>
      <h5 class="q-mt-xs q-mb-lg">Lorem ipsum dolor sit, amet consectetur adipisicing elit.</h5>
    </div>

    <div class="row q-col-gutter-sm items-center q-mb-md">
      <q-select
        filled
        v-model="category"
        :options="categoryOptions"
        label="Category"
        @update:model-value="applyFilters"
        clearable
        class="col-2"
      />

      <q-select
        filled
        v-model="author"
        :options="authorOptions"
        label="Author"
        @update:model-value="applyFilters"
        clearable
        class="col-2"
      />

      <q-select
        filled
        v-model="date"
        :options="dateOptions"
        label="Year"
        @update:model-value="applyFilters"
        clearable
        class="col-2"
      />

      <q-select
        v-model="sortOption"
        :options="sortOptions"
        label="Sort by"
        filled
        @update:model-value="onSort"
        class="col-3"
      />
    </div>
    <div class="row q-gutter-md q-mt-md">
      <div
        v-for="(model, i) in searchStore.query ? searchStore.results : modelStore.filteredModels"
        :key="i"
        class="card-wrapper"
      >
        <q-card class="my-card" rounded bordered>
          <div class="card">
            <model-viewer
              :src="model.file_url"
              camera-controls
              loading="lazy"
              auto-rotate
              auto-rotate-delay="1500"
              rotation-per-second="10deg"
              shadow-intensity="1"
              class="artifacts"
              style="width: 300px; height: 300px"
            />
          </div>
          <q-card-section class="q-pa-sm">
            <div class="text-subtitle1">{{ model.metadata?.title || model.file_name }}</div>
            <div class="row items-center q-gutter-sm">
              <router-link
                :to="{ name: 'view-artifact', params: { id: model.id } }"
                class="text-primary"
                @click="logClick(model.id, 'artifact')"
              >
                View Artifact
              </router-link>
              <q-btn
                icon="bookmark_border"
                flat
                dense
                size="sm"
                color="primary"
                @click="openBookmarkDialog(model, 'artifact')"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
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
            You don’t have any collections yet.
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
        <q-card-section class="sub-font-3" style="font-weight: 400">{{
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
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useModelStore } from 'stores/modelStore'
import { useSearchStore } from 'stores/searchStore'
import { useUserStore } from 'stores/user'
import { supabase } from 'boot/supabase'
import '@google/model-viewer'

const modelStore = useModelStore()
const searchStore = useSearchStore()
const userStore = useUserStore()

const category = ref('')
const author = ref('')
const date = ref('')
const sortOption = ref('Newest')
const sortOptions = ['Newest', 'Oldest', 'Title A-Z', 'Title Z-A']
const categoryOptions = ref([])
const authorOptions = ref([])
const dateOptions = ref([])

const dialogOpen = ref(false)
const selectedModel = ref(null)
const selectedItemType = ref('artifact')
const userCollections = ref([])
const selectedCollections = ref([])
const existingCollectionIds = ref([])

const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

if (userStore.profile.role === undefined) {
  userStore.fetchProfile()
}

const userRole = userStore.profile.role
const isAdmin = computed(() => userRole === 'admin')

function showNotifyDialog(title, message) {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

function onSort() {
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

function applyFilters() {
  modelStore.filterBy({
    category: category.value,
    author: author.value,
    date: date.value,
  })
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
      modelStore.setModels(data)

      // Extract unique author and date values for filters
      const authors = new Set()
      const years = new Set()
      const categories = new Set()

      data.forEach((model) => {
        if (model.metadata?.author) {
          // Support multiple authors split by comma
          const authorList = model.metadata.author.split(',').map((a) => a.trim())
          authorList.forEach((a) => authors.add(a))
        }

        if (model.metadata?.date) years.add(model.metadata.date?.slice(0, 4)) // get year part

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

// for populating filter options
watch(
  () => modelStore.filteredModels,
  (mods) => {
    const authors = new Set()
    const years = new Set()
    const categories = new Set()

    mods.forEach((mod) => {
      const meta = mod.metadata || {}

      // Author
      if (meta.author) {
        meta.author.split(',').forEach((a) => authors.add(a.trim()))
      }

      // Date
      if (meta.date) {
        const year = meta.date.slice(0, 4)
        years.add(year)
      }

      // Categories
      if (Array.isArray(meta.categories)) {
        meta.categories.forEach((cat) => categories.add(cat))
      }
    })

    authorOptions.value = [...authors].sort()
    categoryOptions.value = [...categories].sort()
    dateOptions.value = [...years].sort((a, b) => b - a) // descending
  },
  { immediate: true },
)

const openBookmarkDialog = async (model, type = 'artifact') => {
  selectedModel.value = model
  selectedItemType.value = type
  dialogOpen.value = true

  await loadUserCollections()

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

async function loadUserCollections() {
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

async function saveToSelectedCollections() {
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

function resetForm() {
  selectedCollections.value = []
  existingCollectionIds.value = []
}

// Initial load
onMounted(async () => {
  if (!searchStore.query) {
    await fetchAllArtifacts()
  }
})

onUnmounted(() => {
  searchStore.clear()
})
</script>
