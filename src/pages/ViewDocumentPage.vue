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
          <h2 class="document-title">
            {{
              doc.metadata.title && doc.metadata.title.trim() !== ''
                ? doc.metadata.title
                : doc.file_name
            }}
          </h2>
          <div class="row items-center">
            <p class="sub-font-3" style="font-size: 16px; margin-bottom: 1rem; max-width: 25rem">
              {{
                doc.metadata.author && doc.metadata.author.trim() !== ''
                  ? doc.metadata.author
                  : 'Unknown'
              }}
            </p>
            <div v-if="isAdmin" class="edit-delete-btns row q-gutter-sm q-mb-md">
              <q-btn label="Edit" class="actions" no-caps flat @click="handleEdit" />

              <q-btn label="Delete" class="actions" no-caps flat @click="showDialog = true" />
            </div>

            <!-- Confirmation Dialog      -->
            <q-dialog v-model="showDialog" persistent>
              <q-card class="confirmation-delete">
                <q-card-section class="column items-center">
                  <q-img src="/img/conf-delete.png" alt="question icon" class="question-icon" />
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
          <div class="row-1 items-center justify-between">
            <!-- <q-btn
              :href="doc.file_url"
              target="_blank"
              class="start-reading-btn"
              no-caps
              @click="logClick(doc.id, 'document', 'read')"
            > -->
            <q-btn
              v-if="$q.screen.width > 570"
              class="start-reading-btn"
              no-caps
              @click="handleClickRead(doc)"
            >
              Start Reading
              <img src="/img/arrow-tilt.png" alt="Start Reading" class="q-ml-sm btn-arrow-tilt" />
            </q-btn>

            <q-btn
              v-else
              class="start-reading-btn"
              no-caps
              round
              dense
              flat
              @click="handleClickRead(doc)"
            >
              <q-icon name="menu_book" size="xs" />
            </q-btn>

            <!-- Action icons -->
            <div class="row items-center q-gutter-sm">
              <q-icon name="visibility" color="grey" size="xs" class="action-icon" />
              <span class="count-text">{{ documentsStore.viewCounts[doc.id] || 0 }}</span>

              <q-icon
                :name="doc.starred ? 'star' : 'star_border'"
                :class="{ starred: doc.starred }"
                class="action-icon star-icon"
                size="xs"
                @click.stop="isAdmin ? null : toggleFavorite(doc, 'document')"
              />
              <span class="count-text">{{ documentsStore.starCounts[doc.id] || 0 }}</span>

              <q-icon
                v-if="!isAdmin"
                :name="doc.bookmarked ? 'bookmark' : 'bookmark_border'"
                class="bookmark-icon q-ml-md q-mr-md"
                :class="{ bookmarked: doc.bookmarked }"
                size="xs"
                @click.stop="openBookmarkDialog(doc, 'document')"
              />
            </div>
          </div>
          <div class="row">
            <div class="q-ml-md sub-font-3 space" style="font-size: 16px">Tags:</div>
            <div class="tags">
              <template v-if="doc.metadata.categories && doc.metadata.categories.length">
                <span class="tag-box" v-for="(category, i) in doc.metadata.categories" :key="i">
                  {{ category }}
                </span>
              </template>
              <template v-else>
                <span class="tag-box">Uncategorized</span>
              </template>
            </div>
          </div>

          <div class="row description-row">
            <div class="description-section">
              <div class="q-ml-md sub-font-3" style="font-size: 16px; margin-top: 2rem">
                Description
              </div>
              <div class="q-ml-md summary">
                {{
                  doc.metadata.summary && doc.metadata.summary.trim() !== ''
                    ? doc.metadata.summary
                    : 'No Summary Available.'
                }}
              </div>
              <div class="q-ma-md link" @click="showRelatedDialog = true">Show Related Links</div>
              <!-- q-dialog for related links -->
              <!-- to be edited -->
              <q-dialog v-model="showRelatedDialog" persistent>
                <q-card class="related-box">
                  <q-card-section
                    class="column sub-font-3 items-start"
                    style="font-size: 16px; font-weight: 700"
                  >
                    Show Related Links
                  </q-card-section>
                  <q-separator />
                  <q-card-section class="column items-start">
                    <!-- here are the links -->
                    <div
                      v-for="link in links"
                      :key="link.id"
                      class="row items-center q-mb-xs full-width"
                      @click="openLink(link.url)"
                    >
                      <div class="link-style" @click="openLink(link.url)">
                        {{ link.title || link.url }}
                      </div>
                    </div>
                  </q-card-section>
                  <q-card-actions align="right">
                    <q-btn label="Close" class="btn-save" flat v-close-popup />
                  </q-card-actions>
                </q-card>
              </q-dialog>
            </div>
            <div class="meta-section">
              <div class="font-label">
                <p><strong>Uploaded On:</strong> {{ formatDate(doc.uploaded_at) }}</p>
                <p><strong>Updated On:</strong> {{ formatDate(doc.updated_at) }}</p>
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

    <!-- Collection Dialog -->
    <q-dialog v-model="dialogOpen">
      <q-card class="add-to-collections">
        <q-card-section class="collection-header">
          <div class="sub-font-3" style="font-size: 18px; font-weight: 700">
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

    <!-- Secure PDF Viewer -->
    <SecurePdfViewer
      v-model="showPdfViewer"
      :pdf-url="currentPdfUrl"
      :document-id="currentDocumentId"
      :document-title="doc?.metadata?.title"
      :document-author="doc?.metadata?.author"
      :user-name="user"
      :user-email="userStore.session?.user?.email"
      :viewed-at="new Date().toLocaleString()"
      watermark-text="PRESERV3D - PUP Library"
      @close="showPdfViewer = false"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from 'boot/supabase'
import SecurePdfViewer from 'src/components/SecurePdfViewer.vue'
import { useUserStore } from 'stores/user'
import { useRouter } from 'vue-router'
import { useDocumentsStore } from 'stores/documentsStore'
import { convertToWorkingUrl } from 'src/composables/useR2Url'
import { preloadPreviews } from 'src/utils/urlCache'

const documentsStore = useDocumentsStore()

const router = useRouter()
const route = useRoute()
const doc = ref(null)
const loading = ref(true)
const showDialog = ref(false)
const userStore = useUserStore()
// Safe accessors for profile fields to avoid runtime errors when profile is not yet loaded
const user = `${userStore.profile?.first_name || ''} ${userStore.profile?.last_name || ''}`.trim()

const userRole = computed(() => userStore.profile?.role ?? null)
const isAdmin = computed(() => userRole.value === 'admin')
const userType = computed(() => userStore.profile?.user_type || 'Unknown')

const dialogOpen = ref(false)
const selectedItemType = ref('document')
const selectedDoc = ref(null)
const userCollections = ref([])
const selectedCollections = ref([])
const existingCollectionIds = ref([])

const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

//added for related links
const showRelatedDialog = ref(false)
const links = ref([])

// Secure PDF Viewer
const showPdfViewer = ref(false)
const currentPdfUrl = ref('')
const currentDocumentId = route.params.id

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

async function handleEdit() {
  // metadata.value = {
  //   ...doc.value.metadata,
  //   file_name: doc.value.file_name,
  // }

  // dialog.value = true
  router.push({ name: 'edit-document', params: { id: doc.value.id } })
}

async function handleDelete() {
  try {
    console.log('Trying to soft-delete ID:', route.params.id)

    // Fetch the original record
    const { data: originalData, error: fetchError } = await supabase
      .from('documents_metadata')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (fetchError) {
      console.error('Error fetching original document:', fetchError)
      alert('Failed to fetch the document.')
      return
    }

    // Insert into deleted table
    const { error: deleteError } = await supabase.from('deleted_documents').insert({
      ...originalData,
      deleted_at: new Date().toISOString(),
      deleted_by: user,
    })

    if (deleteError) {
      console.error('Error deleting document:', deleteError)
      alert('Failed to delete the document.')
      return
    }

    // Delete the original record
    const { error: delError } = await supabase
      .from('documents_metadata')
      .delete()
      .eq('id', route.params.id)

    if (delError) {
      console.error('Error deleting document:', delError)
      alert('Failed to delete the document.')
      return
    }

    await logItemHistory({
      itemId: route.params.id,
      itemType: 'document',
      action: 'delete',
      oldData: originalData,
      changes: { new: null, old: originalData },
    })

    console.log('Document soft-deleted successfully: ', route.params.id)
    router.push('/documents')
  } catch (err) {
    console.error('Unexpected error during soft delete:', err)
    alert('An unexpected error occurred.')
  }
}

async function logItemHistory({ itemId, itemType, action, oldData, changes }) {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      console.error('Auth error:', authError)
      return
    }

    const adminName =
      `${userStore.profile?.first_name || ''} ${userStore.profile?.last_name || ''}`.trim()

    const { error } = await supabase.from('item_history').insert({
      item_id: itemId,
      item_type: itemType,
      action: action,
      performed_by: adminName || 'Admin',
      old_data: oldData,
      changes: changes,
    })

    if (error) {
      console.error('Error logging history:', error)
    } else {
      console.log('History logged successfully')
    }
  } catch (err) {
    console.error('Unexpected error logging history:', err)
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
    // ADDED: Exclude "Favorites" from the list
    userCollections.value = data.filter((c) => c.collection_name !== 'Favorites')
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

// FIXED: Toggle favorite
const toggleFavorite = async (doc, itemType = 'document') => {
  if (!doc) return

  const { data: authData, error: authError } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (authError || !userId) {
    console.error('Auth error:', authError)
    return
  }

  try {
    // Find or create Favorites collection
    let { data: favoritesCollection } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .eq('collection_name', 'Favorites')
      .maybeSingle()

    if (!favoritesCollection) {
      const { data: newCollection, error: insertError } = await supabase
        .from('collections')
        .insert([
          {
            collection_name: 'Favorites',
            description: 'Items you marked as favorite will appear here.',
            user_id: userId,
            is_default: true,
            is_locked: true,
            created_at: new Date(),
            updated_at: new Date(),
            cover_url:
              'https://jruqvzpclhwjkttxhhtt.supabase.co/storage/v1/object/public/collection-covers//favoritescover.png',
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error('Insert collection failed:', insertError)
      } else {
        favoritesCollection = newCollection
      }
    }

    const collectionId = favoritesCollection.collection_id
    const itemName = doc.metadata?.title || doc.file_name

    // Check if item already exists
    const { data: existing } = await supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('item_id', doc.id)
      .eq('item_type', itemType)

    if (existing.length > 0) {
      // Remove from favorites
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('item_id', doc.id)
        .eq('item_type', itemType)

      doc.starred = false
      showNotifyDialog('Notice', `"${itemName}" was removed from Favorites.`)
    } else {
      // Add to favorites
      await supabase.from('collection_items').insert({
        collection_id: collectionId,
        item_id: doc.id,
        item_type: itemType,
      })

      doc.starred = true
      showNotifyDialog('Notice', `"${itemName}" was added to Favorites.`)
    }

    // Get star count
    const { data: metaCheck, error: metaError } = await supabase
      .from('documents_metadata')
      .select('id')
      .eq('id', doc.id)
      .single()

    // FIXED: Star count
    if (!metaError && metaCheck) {
      const { data: starData } = await supabase
        .from('documents_star_count')
        .select('star_count')
        .eq('item_id', doc.id)
        .maybeSingle()

      if (starData && starData.star_count !== undefined) {
        documentsStore.updateStarCount(doc.id, starData.star_count)
      } else {
        // If no row exists, star count is 0
        documentsStore.updateStarCount(doc.id, 0)
      }
    } else {
      console.error('Model ID not found in artifacts_metadata:', metaError)
    }
  } catch (err) {
    console.error('Error toggling favorite:', err)
  }
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
    doc.value = documentsStore.documents.find((d) => d.id == route.params.id) || null
    console.log('Fallback Document from Store:', doc.value)
  } else {
    // Initialize with default bookmark/star states
    doc.value = {
      ...data,
      bookmarked: false,
      starred: false,
    }

    // Convert URLs to working presigned URLs with caching
    try {
      if (data.file_url) {
        doc.value.file_url = await convertToWorkingUrl(data.file_url)
      }
      if (data.preview_url) {
        doc.value.preview_url = await convertToWorkingUrl(data.preview_url)
        // Preload preview image for instant display
        preloadPreviews([doc.value.preview_url])
      }
    } catch (urlError) {
      console.warn('Error converting URLs, using original:', urlError)
      // Keep original URLs as fallback
    }

    if (data.related_links && Array.isArray(data.related_links)) {
      links.value = data.related_links.map((link, idx) => ({
        id: link.id || Date.now() + idx,
        title: link.title,
        url: link.url,
      }))
    }
  }

  loading.value = false

  // ADDED: Check if the document is in user's Favorites collection
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (userId) {
    const { data: favoritesCollection } = await supabase
      .from('collections')
      .select('collection_id')
      .eq('user_id', userId)
      .eq('collection_name', 'Favorites')
      .maybeSingle()

    if (favoritesCollection) {
      const { data: favItems } = await supabase
        .from('collection_items')
        .select('item_id')
        .eq('collection_id', favoritesCollection.collection_id)
        .eq('item_type', 'document')
        .eq('item_id', route.params.id)

      if (favItems?.length > 0) {
        doc.value.starred = true
      }
    }
  }

  await documentsStore.fetchStarCounts()
  await documentsStore.fetchViewCounts()
})

function openLink(url) {
  window.open(url, '_blank')
}

async function handleClickRead(doc) {
  console.log('handleClickRead called with doc:', doc)

  if (doc && doc.file_url) {
    console.log('Document file_url:', doc.file_url)

    try {
      await logClick(doc.id, 'document', 'read_document')
      console.log('Click logged successfully')
    } catch (err) {
      console.error('Error logging view click:', err)
    }

    // Convert to working presigned URL before opening viewer
    try {
      console.log('Converting URL...')
      currentPdfUrl.value = await convertToWorkingUrl(doc.file_url)
      console.log('✅ Converted PDF URL:', currentPdfUrl.value)
    } catch (urlErr) {
      console.warn('Could not convert URL, using stored URL:', urlErr)
      currentPdfUrl.value = doc.file_url
    }

    console.log('Opening PDF viewer with URL:', currentPdfUrl.value)
    showPdfViewer.value = true
    console.log('showPdfViewer set to:', showPdfViewer.value)
  } else {
    console.error('No document or file_url found:', doc)
  }
}

async function logClick(itemId, itemType, action) {
  if (!isAdmin.value) {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    const docu = await documentsStore.getDocById(itemId)

    if (authError || !userId) {
      console.error('Auth error logging click:', authError)
      return
    }

    try {
      const { error } = await supabase.from('user_activity_log').insert({
        user_id: userId,
        item_id: itemId,
        title: docu.title || 'Untitled',
        item_type: itemType,
        user_type: userType.value,
        action: action,
        clicked_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      } else {
        console.log(`Click logged by ${userType.value} for ${action} action`)
      }
    } catch (err) {
      console.error('Error logging click:', err)
    }
  }
}
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

.actions {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #880000;
}

.row-1 {
  margin-left: 30.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.summary {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #000000;
  margin-top: 1rem;
  text-align: justify;
}

.space {
  margin-top: 10rem;
}

/* Responsivesness */
@media (max-width: 1200px) {
  .document-img {
    display: none;
  }

  .space {
    margin-top: 2rem;
  }

  .tags {
    margin-top: 2rem;
  }

  .row-1 {
    margin-left: 0;
  }
}

@media (max-width: 900px) {
  .description-section,
  .meta-section {
    flex: 0 0 100%;
  }
}

@media (max-width: 570px) {
  .start-reading-btn {
    width: 3rem;
    height: 2rem;
    margin-left: 0.5rem;
  }
}
</style>
