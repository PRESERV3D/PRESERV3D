<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Highlights</h2>
      <p class="highlights-description">
        Discover standout documents curated from our digital collection. Each item <br />
        offers a glimpse into the university's rich history and knowledge.
      </p>
      <q-btn
        label="Start Reading"
        color="primary"
        class="start-reading-btn"
        no-caps
        unelevated
        @click="startReading"
      >
        <q-icon name="north_east" class="q-ml-xs" />
      </q-btn>
    </div>

    <q-card
      class="author-info q-px-lg q-pt-lg q-mr-xl"
      :class="{ 'author-info-visible': hoveredBook !== null || selectedBook !== null }"
      flat
      bordered
      @click="toggleAuthorInfo"
    >
      <q-card-section>
        <!-- Show book info when hovering or selected -->
        <div
          v-if="
            (hoveredBook !== null || selectedBook !== null) &&
            topDocuments[hoveredBook !== null ? hoveredBook : selectedBook]
          "
          class="book-info-content"
        >
          <div class="book-info-name">
            {{
              topDocuments[hoveredBook !== null ? hoveredBook : selectedBook].metadata?.title ||
              topDocuments[hoveredBook !== null ? hoveredBook : selectedBook].file_name
            }}
          </div>
          <div class="book-info-author text-grey-6">
            by
            {{
              topDocuments[hoveredBook !== null ? hoveredBook : selectedBook].metadata?.author ||
              'Unknown Author'
            }}
          </div>
          <p class="book-info-description text-grey-7">
            {{
              topDocuments[hoveredBook !== null ? hoveredBook : selectedBook].metadata
                ?.description ||
              'A valuable document from our digital collection that offers insights into academic knowledge and research.'
            }}
          </p>
          <div class="book-stats">
            <div class="stat-item">
              <q-icon name="visibility" size="sm" color="grey-6" />
              <span
                >{{
                  documentsStore?.viewCounts[
                    topDocuments[hoveredBook !== null ? hoveredBook : selectedBook].id
                  ] || 0
                }}
                views</span
              >
              <div class="stat-item q-ml-md">
                <q-icon name="star" size="sm" color="grey-6" />
                <span
                  >{{
                    documentsStore?.starCounts[
                      topDocuments[hoveredBook !== null ? hoveredBook : selectedBook].id
                    ] || 0
                  }}
                  stars</span
                >
              </div>
            </div>
          </div>
          <!--          <q-btn-->
          <!--            label="Read This Document"-->
          <!--            color="primary"-->
          <!--            size="sm"-->
          <!--            class="read-document-btn"-->
          <!--            no-caps-->
          <!--            unelevated-->
          <!--            @click.stop="viewDocument(topDocuments[hoveredBook !== null ? hoveredBook : selectedBook].id)"-->
          <!--          >-->
          <!--          </q-btn>-->
        </div>
      </q-card-section>
    </q-card>

    <!-- Navigation -->
    <div class="back-nav">
      <q-btn
        round
        outline
        color="primary"
        icon="arrow_back"
        size="md"
        alt="Back"
        @click.stop="goBack"
      />
    </div>
    <!-- Books Grid -->
    <div class="books-section q-mt-lg">
      <div class="books-grid">
        <div
          v-for="(doc, index) in topDocuments.slice(0, 4)"
          :key="doc.id || index"
          class="book-item"
          :class="{
            'book-hovered': hoveredBook === index,
            'book-selected': selectedBook === index,
          }"
          @mouseenter="hoveredBook = index"
          @mouseleave="hoveredBook = null"
          @click.stop="selectBook(index)"
        >
          <div class="book-link">
            <div class="book-container">
              <q-card class="book-cover" flat>
                <div class="book-front">
                  <!-- Show document preview image as background -->
                  <div v-if="doc.preview_url" class="book-image-overlay">
                    <q-img
                      :src="doc.preview_url"
                      :alt="doc.metadata?.title || doc.file_name"
                      class="book-background-image"
                      fit="cover"
                    />
                    <div class="book-overlay-gradient"></div>
                    <!-- Only show text overlay on hover -->
                    <div v-if="hoveredBook === index" class="book-overlay-content">
                      <!-- <div
                        class="book-title-overlay clickable-text"
                        @click.stop="navigateToDocument(doc.id)"
                      > -->
                      <div class="book-title clickable-text" @click.stop="handleClickView(doc)">
                        {{ doc.metadata?.title || doc.file_name }}
                      </div>
                      <div
                        class="book-subtitle-overlay clickable-text"
                        @click.stop="navigateToAuthor(doc.metadata?.author)"
                      >
                        {{ doc.metadata?.author || 'Document' }}
                      </div>
                    </div>
                  </div>

                  <!-- Show default design if no preview -->
                  <div v-else class="book-content">
                    <div class="book-title-section">
                      <div class="book-icon">
                        <q-icon name="school" color="white" size="2rem" />
                      </div>
                      <!-- Only show text on hover -->
                      <div v-if="hoveredBook === index">
                        <!-- <div
                          class="book-title clickable-text"
                          @click.stop="navigateToDocument(doc.id)"
                        > -->
                        <div class="book-title clickable-text" @click.stop="handleClickView(doc)">
                          {{ doc.metadata?.title || 'POLYTECHNIC UNIVERSITY' }}
                        </div>
                        <div
                          class="book-subtitle clickable-text"
                          @click.stop="navigateToAuthor(doc.metadata?.author)"
                        >
                          {{ doc.metadata?.author || 'OF THE PHILIPPINES' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="book-spine"></div>
              </q-card>
            </div>

            <div class="document-name">
              {{ doc.metadata?.title || doc.file_name || 'Document Name' }}
            </div>
          </div>
        </div>
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentsStore } from 'stores/documentsStore'
import { useUserStore } from 'stores/user'
import { supabase } from 'boot/supabase'

const router = useRouter()
const documentsStore = useDocumentsStore()
const userStore = useUserStore()

// Data
const topDocuments = ref([])
const dialogOpen = ref(false)
const selectedDocument = ref(null)
const selectedItemType = ref('document')
const userCollections = ref([])
const selectedCollections = ref([])
const existingCollectionIds = ref([])
const hoveredBook = ref(null)
const authorInfoSelected = ref(false)
const selectedBook = ref(null)

const userRole = userStore.profile.role
const isAdmin = computed(() => userRole === 'admin')
const userType = computed(() => userStore.profile.user_type || 'Unknown') // from userstore because some users dont have usertype on auth

const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

// Methods
const goBack = () => {
  router.back()
}

const toggleAuthorInfo = () => {
  authorInfoSelected.value = !authorInfoSelected.value
}

// const viewDocument = (documentId) => {
//   // Just log or handle the document viewing without navigation
//   console.log('Viewing document:', documentId)
//   // You can add any other logic here without navigation
// }

const selectBook = (index) => {
  // Toggle selection: if already selected, deselect; otherwise select
  if (selectedBook.value === index) {
    selectedBook.value = null
  } else {
    selectedBook.value = index
  }
}

async function handleClickView(doc) {
  if (doc) {
    try {
      await logClick(doc.id, 'document', 'view_document')
    } catch (err) {
      console.error('Error logging view click:', err)
    } finally {
      await navigateToDocument(doc.id)
    }
  }
}

const navigateToDocument = (documentId) => {
  // Navigate to document page
  router.push({ name: 'view-document', params: { id: documentId } })
}

const navigateToAuthor = (authorName) => {
  // Navigate to author page or search
  if (authorName && authorName !== 'Unknown Author' && authorName !== 'Document') {
    router.push({ name: 'search', query: { author: authorName } })
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

const startReading = () => {
  if (topDocuments.value.length > 0) {
    router.push({ name: 'view-document', params: { id: topDocuments.value[0].id } })
  }
}

const saveToSelectedCollections = async () => {
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

      doc.bookmarked = true

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

const resetForm = () => {
  selectedCollections.value = []
  existingCollectionIds.value = []
}

const showNotifyDialog = (title, message) => {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

// Load documents on mount
onMounted(async () => {
  // Fetch user profile if not loaded
  if (userStore.profile.role === undefined) {
    await userStore.fetchProfile()
  }

  // Fetch top documents from your database (same as in your documents page)
  const { data: topDocus } = await supabase.from('documents_view').select('*').limit(5)

  // Get user's favorites and bookmarks
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (userId && topDocus) {
    const { data: favoritesCollection, error: favError } = await supabase
      .from('collections')
      .select('collection_id')
      .eq('user_id', userId)
      .eq('collection_name', 'Favorites')
      .maybeSingle()

    let favoriteIds = []
    let bookmarkedIds = []

    if (favoritesCollection && !favError) {
      const { data: favItems } = await supabase
        .from('collection_items')
        .select('item_id')
        .eq('collection_id', favoritesCollection.collection_id)
        .eq('item_type', 'document')

      if (favItems) {
        favoriteIds = favItems.map((i) => i.item_id)
      }
    }

    // Get all user collections for bookmarked check
    const { data: allUserCollections } = await supabase
      .from('collections')
      .select('collection_id, collection_name')
      .eq('user_id', userId)

    if (allUserCollections) {
      const nonFavoritesCollections = allUserCollections.filter(
        (col) => col.collection_name !== 'Favorites',
      )

      if (nonFavoritesCollections.length > 0) {
        const collectionIds = nonFavoritesCollections.map((col) => col.collection_id)

        const { data: bookmarkedItems } = await supabase
          .from('collection_items')
          .select('item_id')
          .in('collection_id', collectionIds)
          .eq('item_type', 'document')

        if (bookmarkedItems) {
          bookmarkedIds = [...new Set(bookmarkedItems.map((i) => i.item_id))]
        }
      }
    }

    // Enhanced documents with starred and bookmarked properties
    const enhancedTopDocs = topDocus.map((doc) => ({
      ...doc,
      starred: favoriteIds.includes(doc.id),
      bookmarked: bookmarkedIds.includes(doc.id),
    }))

    topDocuments.value = enhancedTopDocs
  } else {
    // If no user or no documents, just set without properties
    topDocuments.value = (topDocus || []).map((doc) => ({
      ...doc,
      starred: false,
      bookmarked: false,
    }))
  }

  // Fetch view and star counts
  await documentsStore.fetchViewCounts()
  await documentsStore.fetchStarCounts()
})
</script>

<style lang="scss" scoped>
// Navigation
.back-nav {
  position: absolute;
  top: 2rem;
  right: 2rem;
  display: flex;
  gap: 0.5rem;
  z-index: 10;
}

// Container
.highlights-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  padding-top: 1rem;
}

// Header Section
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 5rem;
  gap: 2rem;
}

.left-content {
  flex: 1;
  max-width: 500px;
}

.highlights-title {
  font-size: 3rem;
  font-weight: 700;
  color: #8b4513;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.highlights-description {
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  margin-bottom: 2rem;
  margin-top: 2rem;
  margin-left: 0.5rem;
}

.start-reading-btn {
  border-radius: 25px !important;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  background: #000000 !important;
}

.author-info-container {
  position: relative;
  max-width: 450px;
  margin: 0 auto;
}

.author-info {
  background: none !important;
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 450px;
  min-width: 450px;

  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-height: 320px;
  cursor: pointer;
  font-family: 'Poppins', sans-serif;
  word-wrap: break-word;
  white-space: normal;

  // Initially completely hidden
  opacity: 0;
  pointer-events: none;

  &.author-info-visible {
    opacity: 1;
    pointer-events: auto;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }

  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  }

  .book-info-content,
  .default-author-content {
    padding: 0.5rem;
  }

  .book-info-avatar,
  .author-avatar {
    margin-bottom: 1rem;
  }

  .book-info-name,
  .author-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: #595959;
    font-size: 16px;
  }

  .book-info-author,
  .author-title {
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .book-info-description,
  .author-description {
    font-size: 12px;
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .book-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.85rem;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
    }
  }

  .interaction-hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    margin-top: 1rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
  }

  .read-document-btn {
    border-radius: 20px !important;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background: #8b4513 !important;
    width: 100%;
  }
}

// Books Section
.books-section {
  margin-top: 2rem;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem; /* Reduced from 2rem to make books tighter */
  align-items: start;
  min-height: 500px;
}

.book-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.book-hovered,
  &.book-selected {
    transform: scale(1.1);
    z-index: 20;

    .book-cover {
      transform: rotateY(-2deg) rotateX(1deg) translateY(-15px);
      box-shadow:
        0 20px 40px rgba(0, 0, 0, 0.5),
        inset 0 0 20px rgba(0, 0, 0, 0.1),
        0 0 0 3px rgba(139, 69, 19, 0.4),
        25px 5px 50px -5px rgba(0, 0, 0, 0.6),
        /* Enhanced right shadow on hover */ 30px 15px 60px -10px rgba(0, 0, 0, 0.4); /* Additional depth on hover */
    }
  }

  &.book-selected .book-cover {
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.5),
      inset 0 0 20px rgba(0, 0, 0, 0.1),
      0 0 0 3px rgba(139, 69, 19, 0.8),
      25px 5px 50px -5px rgba(0, 0, 0, 0.7),
      /* Enhanced right shadow on selection */ 30px 15px 60px -10px rgba(0, 0, 0, 0.5); /* Additional depth on selection */
  }
}

.book-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.book-container {
  perspective: 1000px;
  height: 420px; /* Increased from 350px to make books bigger */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem; /* Reduced from 1rem to minimize spacing */
  width: 100%;
  max-width: 280px; /* Increased from 220px to make books bigger */
}

.book-cover {
  width: 100%;
  height: 400px; /* Increased from 320px to make books bigger */
  position: relative;
  background: radial-gradient(circle, #b59f9f 0%, #640c0c 90%, #121212 100%);
  border-radius: 0 20px 20px 0;
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.3),
    inset 0 0 20px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(8, 3, 0, 0.3),
    15px 0 30px -5px rgba(0, 0, 0, 0.4),
    /* Right side shadow */ 20px 8px 40px -8px rgba(0, 0, 0, 0.3); /* Additional right shadow depth */
  transform: rotateY(-5deg) rotateX(2deg);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.book-front {
  width: 100%;
  height: 100%;
  border-radius: 0 20px 20px 0;
  position: relative;
  overflow: hidden;
}

.book-spine {
  position: absolute;
  left: -8px;
  top: 0;
  bottom: 0;
  width: 15px;
  background: linear-gradient(to right, #523518 0%, #381c08 100%);
  border-radius: 0 0 0 15px;
  box-shadow: inset 2px 0 4px rgba(0, 0, 0, 0.3);
}

.book-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  color: white;
}

.book-title-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.book-image-overlay {
  position: relative;
  width: 100%;
  height: 100%;

  .book-background-image {
    width: 100%;
    height: 100%;
    border-radius: 0 20px 20px 0;
  }

  .book-overlay-gradient {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    z-index: 1;
    border-radius: 0 0 20px 0;
  }

  .book-overlay-content {
    position: absolute;
    bottom: 2rem;
    left: 1.5rem;
    right: 1.5rem;
    color: white;
    z-index: 2;
    text-align: center;
  }
}

.book-title,
.book-title-overlay {
  font-size: 1.1rem; /* Increased from 1rem for bigger books */
  font-weight: 600;
  text-align: center;
  margin-bottom: 0.5rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
}

.book-subtitle,
.book-subtitle-overlay {
  font-size: 0.95rem; /* Increased from 0.85rem for bigger books */
  text-align: center;
  opacity: 0.9;
  margin-bottom: auto;
}

.clickable-text {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.25rem;
  border-radius: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
  }
}

.book-icon {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 70px; /* Increased from 60px for bigger books */
  height: 70px; /* Increased from 60px for bigger books */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.document-name {
  font-size: 0.95rem; /* Increased from 0.9rem for bigger books */
  font-weight: 500;
  text-align: center;
  color: #333;
  margin-bottom: 0; /* Removed margin to eliminate spacing */
  max-width: 260px; /* Increased from 200px for bigger books */
  line-height: 1.2;
}

// Action Icons
.action-icons {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  margin-top: 0.5rem;
}

.icon-with-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
}

.count-text {
  font-size: 0.75rem;
  color: #666;
}

.starred {
  color: #ffc107 !important;
}

.bookmarked {
  color: #2196f3 !important;
}

// Dialog Styles
.add-to-collections {
  min-width: 400px;
}

.collection-header {
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.collections-scroll-container {
  max-height: 300px;
  overflow-y: auto;
}

.collection-footer {
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
}

.sucess-add-to-collection {
  min-width: 350px;
  text-align: center;
}

.btn-save {
  background: #8b4513;
  color: white;
}

// Responsive Design
@media (max-width: 1400px) {
  .author-info {
    width: 400px;
    min-width: 400px;
  }
}

@media (max-width: 1200px) {
  .books-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .author-info {
    width: 350px;
    min-width: 350px;
  }
}

@media (max-width: 900px) {
  .books-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .book-container {
    max-width: 250px; /* Adjusted for medium screens */
    height: 380px; /* Adjusted for medium screens */
  }

  .book-cover {
    height: 360px; /* Adjusted for medium screens */
  }
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .author-info {
    position: relative;
    width: 100%;
    min-width: auto;
    max-width: 100%;
    transform: none;
    opacity: 1;
    pointer-events: auto;
    margin-bottom: 2rem;

    &.author-info-visible {
      transform: none;
    }
  }

  .author-info-container {
    max-width: 100%;
  }

  .highlights-title {
    font-size: 2.5rem;
  }

  .books-grid {
    grid-template-columns: 1fr;
    gap: 1rem; /* Kept tighter spacing */
  }

  .book-container {
    height: 350px; /* Slightly smaller for mobile but still bigger than original */
    max-width: 240px; /* Adjusted for mobile */
  }

  .book-cover {
    height: 330px; /* Adjusted for mobile */
  }

  .back-forward-nav {
    position: static;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .highlights-container {
    padding: 1rem;
  }

  .books-section {
    margin-top: 2rem;
  }
}

@media (max-width: 600px) {
  .book-item.book-hovered,
  .book-item.book-selected {
    transform: scale(1.05);
  }

  .book-container {
    max-width: 200px;
    height: 320px;
  }

  .book-cover {
    height: 300px;
  }
}
</style>
