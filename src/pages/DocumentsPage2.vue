<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Documents</h2>
      <h5 class="q-mt-xs q-mb-lg">Lorem ipsum dolor sit, amet consectetur adipisicing elit.</h5>
    </div>

    <div class="row q-gutter-md q-mt-md">
      <div v-for="(doc, index) in documentsStore.documents" :key="index" class="card-wrapper">
        <q-card class="my-card documentCard" rounded bordered>
          <PdfPreview :pdfUrl="doc.file_url" class="document" />
          <div class="metadata q-px-sm">
            <h6>{{ doc.metadata?.title || 'Untitled' }}</h6>
            <p class="q-mb-sm">Author: {{ doc.metadata?.author || 'Unknown' }}</p>
          </div>
          <div class="row items-center q-px-sm q-mb-sm q-gutter-sm">
            <router-link
              :to="{ name: 'view-document', params: { id: doc.id } }"
              class="text-primary"
            >
              View Document
            </router-link>
            <q-btn
              icon="bookmark_border"
              flat
              dense
              size="sm"
              color="primary"
              @click="openBookmarkDialog(doc, 'document')"
            />
          </div>
        </q-card>
      </div>
    </div>

    <!-- Bookmark Dialog -->
    <q-dialog v-model="dialogOpen">
      <q-card style="min-width: 300px; max-width: 400px">
        <q-card-section>
          <div class="text-h6">Add to Collections</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div v-if="userCollections.length > 0">
            <q-checkbox
              v-for="collection in userCollections"
              :key="collection.collection_id"
              v-model="selectedCollections"
              :val="collection.collection_id"
              :label="collection.collection_name"
              dense
              class="q-mb-sm"
            />
          </div>
          <div v-else class="text-caption text-grey text-center">
            You don’t have any collections yet.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup @click="resetForm" />
          <q-btn label="Save" color="primary" @click="saveToSelectedCollections" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Message Dialog -->
    <q-dialog v-model="notifyDialogOpen">
      <q-card>
        <q-card-section class="text-h6">{{ notifyDialogTitle }}</q-card-section>
        <q-card-section>{{ notifyDialogMessage }}</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'boot/supabase'
import { useDocumentsStore } from 'stores/documentsStore'
import PdfPreview from 'components/PdfPreview.vue'

const documentsStore = useDocumentsStore()

const dialogOpen = ref(false)
const selectedDocument = ref(null)
const selectedItemType = ref('document')
const userCollections = ref([])
const selectedCollections = ref([])
const existingCollectionIds = ref([])

const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

function showNotifyDialog(title, message) {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

onMounted(async () => {
  try {
    const { data, error } = await supabase
      .from('documents_metadata')
      .select('id, file_name, file_url, metadata, uploaded_at, updated_at')
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching documents:', error)
      return
    }

    documentsStore.setDocuments(data)
  } catch (err) {
    console.error('Unexpected error while loading documents:', err)
  }
})

const openBookmarkDialog = async (doc, type = 'document') => {
  selectedDocument.value = doc
  selectedItemType.value = type
  dialogOpen.value = true

  await loadUserCollections()

  const { data: existingItems, error } = await supabase
    .from('collection_items')
    .select('collection_id')
    .eq('item_id', doc.id)
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
  const doc = selectedDocument.value
  if (!doc) return

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
        item_id: doc.id,
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
        .eq('item_id', doc.id)
        .eq('item_type', selectedItemType.value)

      if (deleteError) {
        console.error('Delete failed:', deleteError)
        showNotifyDialog('Error', 'Failed to remove from collection(s).')
        return
      }

      if (collection) removedCollections.push(collection.collection_name)
    }

    const itemName = doc.metadata?.title || doc.file_name
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
</script>
