<template>
  <q-page class="q-pa-md">
    <div v-if="loading">
      <q-spinner color="primary" size="lg" />
    </div>

    <div v-else-if="doc">
      <div class="row q-mt-xs q-gutter-md justify-center items-start">
        <div class="col-auto flex flex-column items-start q-mt-sm">
          <router-link to="/documents" class="back-button-top">
            <q-btn flat icon="arrow_back" label="Back to Documents" />
          </router-link>
        </div>
        <div class="col-auto">
          <q-img
            :src="doc.preview_url"
            class="document-img"
            style="margin-top: 1.5rem; z-index: 1"
          />
        </div>
        <div class="col">
          <h2 class="document-title">{{ doc.metadata.title }}</h2>
          <div class="row items-center">
            <p class="sub-font-3" style="font-size: 16px; margin: 0; max-width: 25rem">
              {{ doc.metadata.author }}
            </p>
            <div v-if="isAdmin" class="edit-delete-btns row q-gutter-sm">
              <q-btn label="Edit" class="actions" no-caps flat @click="handleEdit" />

              <q-btn label="Delete" class="actions" no-caps flat @click="showDialog = true" />
            </div>

            <!-- Confirmation Dialog      -->
            <q-dialog v-model="showDialog" persistent>
              <q-card class="confirmation-delete">
                <q-card-section class="column items-center">
                  <q-img
                    src="src/assets/img/conf-delete.png"
                    alt="question icon"
                    class="question-icon"
                  />
                  <div class="q-mt-md sub-font" style="color: #000000">
                    Are you sure you want to delete this?
                  </div>
                </q-card-section>
                <q-card-actions align="center">
                  <q-btn label="Yes" class="btn-save" flat @click="handleDelete" />
                  <q-btn
                    flat
                    label="No"
                    class="sub-font-2"
                    style="color: #000000"
                    v-close-popup
                    no-caps
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </div>
        </div>
      </div>

      <div class="preview-container">
        <div class="box-view">
          <div class="row-1 justify-between items-center">
            <q-btn :href="doc.file_url" target="_blank" class="start-reading-btn" no-caps>
              Start Reading
              <img
                src="src/assets/img/arrow-tilt.png"
                alt="Start Reading"
                class="q-ml-sm btn-arrow-tilt"
              />
            </q-btn>
            <q-icon
              :name="doc.bookmarked ? 'bookmark' : 'bookmark_border'"
              class="bookmark-icon q-ml-md q-mr-md"
              :class="{ bookmarked: doc.bookmarked }"
              size="sm"
              @click.stop="openBookmarkDialog(doc, 'document')"
            />
          </div>
          <div class="row">
            <div class="q-ml-md sub-font-3" style="font-size: 16px; margin-top: 10rem">Tags:</div>
            <div class="tags">
              <span class="tag-box" v-for="(category, i) in doc.metadata.categories" :key="i">
                {{ category }}
              </span>
            </div>
          </div>

          <div class="row description-row">
            <div class="description-section">
              <div class="q-ml-md sub-font-3" style="font-size: 16px; margin-top: 2rem">
                Description
              </div>
              <div class="q-ml-md summary">
                {{ doc.metadata.summary }}
              </div>
            </div>
            <div class="meta-section">
              <div class="font-label">
                <p><strong>Uploaded At:</strong> {{ formatDate(doc.uploaded_at) }}</p>
                <p><strong>Updated At:</strong> {{ formatDate(doc.updated_at) }}</p>
                <p><strong>Date:</strong> {{ doc.metadata.date }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <q-banner type="negative">Document not found.</q-banner>
    </div>
    <ConfirmMetadata
      v-model="dialog"
      :metadata="metadata"
      @confirm="saveMetadata"
      @cancel="handleCancelMetadata"
    />

    <!-- Collection Dialog -->
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
          <q-btn flat label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Notification Dialog -->
    <q-dialog v-model="notifyDialogOpen">
      <q-card class="sucess-add-to-collection">
        <q-card-section class="sub-font-3" style="font-size: 20px; font-weight: 700">
          {{ notifyDialogTitle }}
        </q-card-section>
        <q-card-section class="sub-font-3" style="font-size: 14px; font-weight: 400">
          {{ notifyDialogMessage }}
        </q-card-section>
        <q-card-actions>
          <q-btn flat label="Close" class="btn-save" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from 'boot/supabase'
import ConfirmMetadata from 'src/components/ConfirmMetadata.vue'
import { useUserStore } from 'stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const doc = ref(null)
const loading = ref(true)
const showDialog = ref(false)
const dialog = ref(false)
const metadata = ref(null)
const userStore = useUserStore()

const userRole = userStore.profile.role
const isAdmin = computed(() => userRole === 'admin')

const dialogOpen = ref(false)
const selectedItemType = ref('document')
const selectedDoc = ref(null)
const userCollections = ref([])
const selectedCollections = ref([])
const existingCollectionIds = ref([])

const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

async function handleEdit() {
  metadata.value = {
    ...doc.value.metadata,
    file_name: doc.value.file_name,
  }

  dialog.value = true
}

async function saveMetadata(newMetadata) {
  try {
    console.log(newMetadata.metadata)
    const { error } = await supabase
      .from('documents_metadata')
      .update({
        metadata: {
          title: newMetadata.title,
          author: newMetadata.author,
          date: newMetadata.date,
          summary: newMetadata.summary,
          keywords: newMetadata.keywords,
          categories: newMetadata.categories,
        },
        updated_at: new Date(),
      })
      .eq('file_name', newMetadata.file_name)

    if (error) {
      console.error('Failed to update metadata:', error)
      alert('Failed to update metadata.')
    } else {
      alert('Metadata saved successfully!')
      dialog.value = false

      location.reload()
    }
  } catch (err) {
    console.error('Error saving metadata:', err)
    alert('Unexpected error occurred.')
  }
}

async function handleDelete() {
  try {
    console.log('Trying to delete ID:', route.params.id)

    const { data, error } = await supabase
      .from('documents_metadata')
      .delete()
      .eq('id', route.params.id)

    console.log(data)

    if (error) {
      console.error('Delete error:', error)
      alert('Failed to delete the document.')
    } else {
      alert('Document deleted successfully.')
      showDialog.value = false
      router.push({ name: 'documents' })
    }
  } catch (err) {
    console.error('Unexpected error during delete:', err)
    alert('An unexpected error occurred.')
  }
}

const openBookmarkDialog = async (docItem, type = 'document') => {
  selectedDoc.value = docItem
  selectedItemType.value = type
  dialogOpen.value = true

  await loadUserCollections()

  // Check existing collections for this item
  const { data: existingItems, error } = await supabase
    .from('collection_items')
    .select('collection_id')
    .eq('item_id', docItem.id)
    .eq('item_type', type)

  if (error) {
    console.error('Error checking collections:', error)
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
  const docItem = selectedDoc.value

  if (!docItem) return

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
        item_id: docItem.id,
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
        .eq('item_id', docItem.id)
        .eq('item_type', selectedItemType.value)

      if (deleteError) {
        console.error('Delete failed:', deleteError)
        showNotifyDialog('Error', 'Failed to remove from collection(s).')
        return
      }

      if (collection) removedCollections.push(collection.collection_name)
    }

    const itemName = docItem.metadata?.title || docItem.file_name

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

const showNotifyDialog = (title, message) => {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

onMounted(async () => {
  const { data, error } = await supabase
    .from('documents_metadata')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (error || !data) {
    console.error('Document not found from Supabase:', error)
    // Optional: fallback to store if you have a docuStore like modelStore
    // const docuStore = useDocuStore()
    // doc.value = docuStore.documents.find((d) => d.id == route.params.id) || null
  } else {
    // Initialize with default bookmark/star states
    doc.value = {
      ...data,
      bookmarked: false,
      starred: false,
    }
  }

  loading.value = false
})
</script>

<style scoped>
.preview-container {
  position: relative;
  display: block;
  flex-direction: column;
}

.box-view {
  position: relative;
  padding: 2rem;
  border-radius: 10px;
  background-color: #ffffff;
  width: auto;
  box-shadow: 0 0 20px rgba(102, 102, 102, 0.3);
  z-index: 0;
  margin-top: 0;
}

.tags {
  margin-top: 10rem;
  font-size: 12px;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag-box {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  background-color: rgba(204, 172, 0, 0.7);
  color: #560505;
  padding: 0.3rem 1.5rem;
  border-radius: 5px;
  margin-left: 0.5rem;
}

.description-row {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.description-section {
  flex: 0 0 60%;
}

.meta-section {
  flex: 0 0 35%;
}

.font-label {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #000000;
  margin-top: 2rem;
  margin-left: 1rem;
}

.document-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 36px;
  line-height: 3rem;
  color: #560505;
}

.document-img {
  width: 300px;
  margin-left: 10rem;
  margin-right: 2rem;
  z-index: 1;
  position: relative;
  margin-bottom: -10rem;
  box-shadow: 0 0 20px rgba(102, 102, 102, 0.3);
}

.row-1 {
  margin-left: 30.5rem;
  display: flex;
}

.start-reading-btn {
  background-color: #363636;
  color: white;
  border-radius: 20px;
  font-weight: 400;
  font-size: 14px;
  font-family: 'Poppins', sans-serif;
  height: 2rem;
  width: 10rem;
  place-content: center;
  align-items: center;
}

.btn-arrow-tilt {
  width: 0.6rem;
  height: 0.6rem;
  object-fit: contain;
}

.edit-delete-btns {
  display: flex;
  gap: 1rem;
  margin-left: auto;
  margin-right: 2rem;
}

.summary {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #000000;
  margin-top: 1rem;
}
</style>
