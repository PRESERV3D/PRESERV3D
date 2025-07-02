<template>
  <q-page class="q-pa-md">
    <!-- HEADER: Collection Info -->
    <div class="row q-col-gutter-xl">
      <div class="col-12 col-md-4">
        <q-card class="q-pa-sm">
          <img
            :src="collection.cover_url"
            alt="Collection Cover"
            style="width: 100%; aspect-ratio: 3/4; object-fit: cover"
          />
          <q-card-section>
            <div class="text-h6">{{ collection.collection_name }}</div>
            <div class="text-subtitle2">{{ collection.description }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Edit" icon="edit" color="primary" @click="openEditDialog" />
            <q-btn flat label="Delete" icon="delete" color="negative" @click="confirmDelete" />
          </q-card-actions>
        </q-card>
      </div>

      <div class="col-12 col-md-8">
        <!-- DOCUMENTS SECTION -->
        <div class="q-mb-xl">
          <div class="row items-center q-mb-sm">
            <h5 class="text-h5 col">Documents</h5>
            <q-btn
              label="Add Document"
              icon="add"
              color="primary"
              flat
              @click="goToAddDocument"
              class="q-ml-auto"
            />
          </div>

          <div v-if="documents.length" class="row q-gutter-md q-mt-md">
            <div v-for="(doc, i) in documents" :key="i" class="card-wrapper">
              <q-card class="my-card documentCard" rounded bordered>
                <PdfPreview :pdfUrl="doc.file_url" class="document" />
                <div class="metadata q-px-sm">
                  <h6>{{ doc.metadata?.title || 'Untitled' }}</h6>
                  <p class="q-mb-sm">Author: {{ doc.metadata?.author || 'Unknown' }}</p>
                </div>
                <router-link
                  :to="{ name: 'view-document', params: { id: doc.id } }"
                  class="text-primary q-px-sm"
                >
                  View Document
                </router-link>
                <q-card-actions align="right">
                  <q-btn
                    flat
                    :icon="'bookmark'"
                    color="primary"
                    @click="toggleBookmark(doc.id, 'document')"
                  />
                </q-card-actions>
              </q-card>
            </div>
          </div>
          <p v-else class="text-grey">No documents in this collection.</p>
        </div>

        <!-- ARTIFACTS SECTION -->
        <div>
          <div class="row items-center q-mb-sm">
            <h5 class="text-h5 col">Artifacts</h5>
            <q-btn
              label="Add Artifact"
              icon="add"
              color="primary"
              flat
              @click="goToAddArtifact"
              class="q-ml-auto"
            />
          </div>

          <div v-if="artifacts.length" class="row q-gutter-md q-mt-md">
            <div v-for="(model, i) in artifacts" :key="i" class="card-wrapper">
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
                  <router-link
                    :to="{ name: 'view-artifact', params: { id: model.id } }"
                    class="text-primary"
                  >
                    View Artifact
                  </router-link>
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn
                    flat
                    :icon="'bookmark'"
                    color="primary"
                    @click="toggleBookmark(model.id, 'artifact')"
                  />
                </q-card-actions>
              </q-card>
            </div>
          </div>
          <p v-else class="text-grey">No artifacts in this collection.</p>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <q-dialog v-model="editDialogOpen">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Edit Collection</div>
        </q-card-section>

        <q-card-section class="q-gutter-md column">
          <q-input v-model="editData.collection_name" label="Collection Name" filled />
          <q-input v-model="editData.description" label="Description" type="textarea" filled />

          <q-uploader
            label="Upload Cover Image"
            accept="image/*"
            :max-files="1"
            auto-upload
            @added="handleCoverUpload"
            class="q-mt-sm"
          />

          <img
            v-if="editData.cover_url"
            :src="editData.cover_url"
            alt="Cover Preview"
            style="width: 100%; max-height: 250px; object-fit: contain"
            class="q-mt-sm"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn label="Save" color="primary" @click="updateCollection" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirm Dialog -->
    <q-dialog v-model="confirmDeleteOpen">
      <q-card>
        <q-card-section class="text-h6">Delete Collection</q-card-section>
        <q-card-section>
          Are you sure you want to delete the collection "{{ collection.collection_name }}"?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn label="Delete" color="negative" @click="deleteCollection" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Message Dialog -->
    <q-dialog v-model="messageDialogOpen">
      <q-card>
        <q-card-section class="text-h6">{{ messageDialogTitle }}</q-card-section>
        <q-card-section>{{ messageDialogContent }}</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" @click="handleMessageDialogClose" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { uid } from 'quasar'
import PdfPreview from 'components/PdfPreview.vue'
import '@google/model-viewer'

const route = useRoute()
const router = useRouter()

const collectionId = route.params.id
const collection = ref({})
const documents = ref([])
const artifacts = ref([])

const editDialogOpen = ref(false)
const confirmDeleteOpen = ref(false)
const messageDialogOpen = ref(false)
const messageDialogTitle = ref('')
const messageDialogContent = ref('')

const editData = ref({
  collection_name: '',
  description: '',
  cover_url: '',
})

function showMessageDialog(title, content) {
  messageDialogTitle.value = title
  messageDialogContent.value = content
  messageDialogOpen.value = true
}

onMounted(async () => {
  await fetchCollectionInfo()
  await fetchCollectionItems()
})

async function fetchCollectionInfo() {
  const { data, error } = await supabase
    .from('collections')
    .select('collection_name, description, cover_url')
    .eq('collection_id', collectionId)
    .single()

  if (error) {
    console.error('Failed to load collection info:', error)
  } else {
    collection.value = data
  }
}

async function fetchCollectionItems() {
  const { data: items, error } = await supabase
    .from('collection_items')
    .select('item_id, item_type')
    .eq('collection_id', collectionId)

  if (error) {
    console.error('Failed to load collection items:', error)
    return
  }

  const docIds = items.filter((i) => i.item_type === 'document').map((i) => i.item_id)
  const artIds = items.filter((i) => i.item_type === 'artifact').map((i) => i.item_id)

  if (docIds.length) {
    const { data: docs } = await supabase
      .from('documents_metadata')
      .select('id, file_name, file_url, metadata')
      .in('id', docIds)

    documents.value = (docs || []).map((doc) => ({ ...doc, bookmarked: true }))
  }

  if (artIds.length) {
    const { data: arts } = await supabase
      .from('artifacts_metadata')
      .select('id, file_name, file_url, metadata')
      .in('id', artIds)

    artifacts.value = (arts || []).map((art) => ({ ...art, bookmarked: true }))
  }
}

function openEditDialog() {
  editData.value = { ...collection.value }
  editDialogOpen.value = true
}

async function handleCoverUpload(files) {
  if (!files.length) return

  const file = files[0]
  const fileExt = file.name.split('.').pop()
  const filePath = `collection-covers/${uid()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('collection-covers')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error(uploadError)
    showMessageDialog('Upload Failed', 'Cover image upload failed.')
    return
  }

  const { data: publicData } = supabase.storage.from('collection-covers').getPublicUrl(filePath)
  editData.value.cover_url = publicData.publicUrl
}

async function updateCollection() {
  const { error } = await supabase
    .from('collections')
    .update({
      collection_name: editData.value.collection_name,
      description: editData.value.description,
      cover_url: editData.value.cover_url,
      updated_at: new Date(),
    })
    .eq('collection_id', collectionId)

  if (error) {
    console.error('Update failed:', error)
    showMessageDialog('Update Failed', 'Failed to update collection.')
  } else {
    showMessageDialog('Success', 'Collection updated.')
    await fetchCollectionInfo()
    editDialogOpen.value = false
  }
}

function confirmDelete() {
  confirmDeleteOpen.value = true
}

async function deleteCollection() {
  const { error: itemsError } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)

  if (itemsError) {
    console.error('Failed to delete related items:', itemsError)
    showMessageDialog('Delete Failed', 'Failed to remove related collection items.')
    return
  }

  const { error: collectionError } = await supabase
    .from('collections')
    .delete()
    .eq('collection_id', collectionId)

  if (collectionError) {
    console.error('Delete failed:', collectionError)
    showMessageDialog('Delete Failed', 'Failed to delete collection.')
  } else {
    confirmDeleteOpen.value = false
    showMessageDialog('Deleted', 'Collection deleted.')
    router.push({ name: 'collections' })
  }
}

async function toggleBookmark(itemId, itemType) {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .match({ collection_id: collectionId, item_id: itemId, item_type: itemType })

  if (error) {
    console.error('Unbookmark failed:', error)
    showMessageDialog('Delete Failed', `Failed to remove ${itemType} from collection.`)
    return
  }

  // Immediately remove item from display
  if (itemType === 'document') {
    documents.value = documents.value.filter((doc) => doc.id !== itemId)
  } else if (itemType === 'artifact') {
    artifacts.value = artifacts.value.filter((art) => art.id !== itemId)
  }

  showMessageDialog(
    'Removed',
    `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} removed from collection.`,
  )
}

async function handleMessageDialogClose() {
  messageDialogOpen.value = false

  if (messageDialogTitle.value === 'Deleted' || messageDialogTitle.value === 'Removed') {
    if (!documents.value.length && !artifacts.value.length && !collection.value.collection_name) {
      router.push({ name: 'collections' })
    } else {
      await fetchCollectionItems()
    }
  }
}

function goToAddDocument() {
  router.push({ name: 'documents', query: { addToCollection: collectionId } })
}

function goToAddArtifact() {
  router.push({ name: 'artifacts', query: { addToCollection: collectionId } })
}
</script>
