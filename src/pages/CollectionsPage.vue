<template>
  <q-page class="q-pa-md">
    <div class="q-mt-xs title">Collections</div>

    <div class="q-mb-md subtitle row items-baseline justify-between">
      <div class="q-ml-sm">Archival Materials grouped into a collection.</div>
      <div class="artifact-btn">
        <q-btn-dropdown
          outline
          color="black"
          :label="`Sort by: ${sortOption}`"
          icon="sort"
          size="sm"
          class="q-ml-xs artifact-btn-style"
          dense
        >
          <q-list>
            <q-item
              v-for="option in sortOptions"
              :key="option"
              clickable
              v-close-popup
              class="collection-sort-menu"
              @click="setSortOption(option)"
            >
              <q-item-section>
                <q-item-label>{{ option }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-btn
          @click="showDialog = true"
          label="Add New"
          icon="add_circle"
          style="min-width: 9.375rem"
          class="add-new-btn"
          no-caps
          unelevated
        />
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="text-center q-my-md">
      <q-spinner color="primary" size="lg" />
    </div>

    <!-- Collection Display -->
    <div v-else>
      <div v-if="collections.length > 0" class="box-collections">
        <div
          v-for="collection in collections"
          :key="collection.collection_id"
          class="collection-item"
        >
          <router-link :to="`/collection/${collection.collection_id}`" class="collection-link">
            <img
              :src="collection?.cover_url"
              :alt="collection?.collection_name"
              class="book-cover-img"
              style="object-fit: cover"
            />
          </router-link>

          <div class="q-mt-md fade-title-container">
            <div
              class="sub-font fade-title row items-center"
              style="color: black; font-weight: 600; margin-left: 3rem"
            >
              {{ collection.collection_name }}
              <!-- ADDED: Pinned icon for Favorites -->
              <q-icon
                v-if="collection.collection_name === 'Favorites'"
                name="push_pin"
                class="q-ml-xs text-primary"
                size="18px"
              >
              </q-icon>
              <div class="tooltip-box">{{ collection.collection_name }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center q-mt-md">
        <p>No collections found.</p>
      </div>
    </div>

    <!-- Add New Collection Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="add-collection-card">
        <q-card-section class="row justify-center items-center">
          <div class="sub-font-3 text-center" style="font-size: 16px; font-weight: 700">
            Add New Collection
          </div>
        </q-card-section>

        <q-card-section class="row q-gutter-md" style="gap: 0.5rem">
          <div class="col-auto q-ml-md">
            <div class="upload-box" @click="triggerFileInput">
              <q-img
                v-if="previewImage"
                :src="previewImage"
                style="width: 100%; height: 14.5rem; object-fit: contain; border-radius: 10px"
              />
              <div v-else class="upload">
                <q-img src="src/assets/img/write.png" alt="Upload" class="upload-icon" />
                <div>Upload Photo</div>
              </div>
              <input
                type="file"
                ref="fileInput"
                accept="image/*"
                @change="handleImageUpload"
                style="display: none"
              />
            </div>
          </div>

          <div class="col-5 q-ml-lg">
            <div class="sub-font-3" style="font-size: 16px; font-weight: 500">COLLECTION NAME</div>
            <q-input
              v-model="newCollectionTitle"
              class="field-collection q-mb-md"
              label="Enter Collection Name"
              dense
              outlined
            />

            <div class="sub-font-3" style="font-size: 16px; font-weight: 500">
              SHORT DESCRIPTION
            </div>
            <q-input
              v-model="newCollectionDesc"
              type="textarea"
              class="field-collection"
              label="Enter Short Description"
              dense
              outlined
              style="min-height: 8rem"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            class="sub-font-2"
            style="color: #000000"
            v-close-popup
            @click="resetForm"
            no-caps
          />
          <q-btn label="Save" class="q-mr-sm btn-save" @click="addCollection" no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'boot/supabase'

const user = ref({ first_name: '' })
const collections = ref([])
const isLoading = ref(true)
const showDialog = ref(false)
const fileInput = ref(null)
const previewImage = ref(null)
const newCollectionTitle = ref('')
const newCollectionDesc = ref('')
const newCollection = ref({
  coverFile: null,
})
const sortOption = ref('Newest to Oldest')
const sortOptions = ['Alphabetical', 'Oldest to Newest', 'Newest to Oldest', 'Recently Updated']

// Load user and collections
onMounted(async () => {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    console.error('Auth error:', authError)
    isLoading.value = false
    return
  }

  const { data: userData, error: userError } = await supabase
    .from('registered_users')
    .select('first_name')
    .eq('id', authUser.id)
    .single()

  if (userError) {
    console.error('Error fetching user data:', userError)
  } else {
    user.value = userData
  }

  await loadCollections(authUser.id)
})

// FIXED: Sorting
function applySorting() {
  if (!Array.isArray(collections.value)) return

  // Clone the array to prevent mutation issues
  const allCollections = [...collections.value]

  // Separate "Favorites" collection first
  const favorites = allCollections.find((c) => c.collection_name === 'Favorites')
  const others = allCollections.filter((c) => c.collection_name !== 'Favorites')

  switch (sortOption.value) {
    case 'Recently Updated': {
      const updated = others.filter((c) => c.updated_at)
      const neverUpdated = others.filter((c) => !c.updated_at)

      updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      neverUpdated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      collections.value = favorites
        ? [favorites, ...updated, ...neverUpdated]
        : [...updated, ...neverUpdated]
      break
    }

    case 'Newest to Oldest':
      others.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      collections.value = favorites ? [favorites, ...others] : others
      break

    case 'Oldest to Newest':
      others.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      collections.value = favorites ? [favorites, ...others] : others
      break

    case 'Alphabetical':
      others.sort((a, b) => a.collection_name.localeCompare(b.collection_name))
      collections.value = favorites ? [favorites, ...others] : others
      break
  }
}

function setSortOption(option) {
  sortOption.value = option
  applySorting()
}

// FIXED: Load collections from Supabase
async function loadCollections(userId) {
  const { data, error } = await supabase
    .from('collections')
    .select('collection_name, cover_url, collection_id, created_at, updated_at')
    .eq('user_id', userId)

  if (error) {
    console.error('Error loading collections:', error)
  } else {
    // Separate and pin the "Favorites" collection
    const favorites = data.find((c) => c.collection_name === 'Favorites')
    const others = data.filter((c) => c.collection_name !== 'Favorites')

    // Combine and assign to collections
    collections.value = favorites ? [favorites, ...others] : others

    // Apply sorting
    applySorting()
  }

  isLoading.value = false
}

function resetForm() {
  newCollectionTitle.value = ''
  newCollectionDesc.value = ''
  previewImage.value = null
  newCollection.value.coverFile = null
}

async function addCollection() {
  const title = newCollectionTitle.value.trim()
  const description = newCollectionDesc.value.trim()

  if (!title) {
    console.warn('Collection title is required')
    return
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let coverUrl = ''

  if (newCollection.value.coverFile) {
    const file = newCollection.value.coverFile
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`

    const { error: uploadError } = await supabase.storage
      .from('collection-covers')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
    } else {
      const { data: publicUrlData } = supabase.storage
        .from('collection-covers')
        .getPublicUrl(fileName)

      coverUrl = publicUrlData?.publicUrl ?? ''
    }
  }

  const defaultCover =
    'https://jruqvzpclhwjkttxhhtt.supabase.co/storage/v1/object/public/collection-covers/preservedcover.png'

  const { error: insertError } = await supabase.from('collections').insert([
    {
      created_at: new Date().toISOString(),
      collection_name: title,
      description: description,
      user_id: authUser.id,
      cover_url: coverUrl || defaultCover,
    },
  ])

  if (insertError) {
    console.error('Insert error:', insertError)
  } else {
    showDialog.value = false
    resetForm()
    await loadCollections(authUser.id)
  }
}
</script>

<style scoped>
.box-collections {
  border-radius: 10px;
  background-color: #ffffff;
  width: 100%;
  height: auto;
  display: flex;
  flex-wrap: wrap;
  padding-top: 4rem;
  padding-bottom: 3.5rem;
  padding-left: 1.5rem;
  gap: 3rem;
  box-shadow: 0 0 20px rgba(102, 102, 102, 0.3);
}

.collection-item {
  display: flex;
  flex-direction: column;
}

.collection-image {
  width: 15rem;
  height: 14.5rem;
  object-fit: cover;
  border-radius: 10px;
}

.book-cover-img {
  width: 14rem;
  height: 18rem;
  margin-left: 3rem;
  border: 3px solid #381c08;
  border-left: 10px solid #381c08 !important;
  border-radius: 0 15px 15px 0;
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.3),
    inset 0 0 20px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(8, 3, 0, 0.3);
}
</style>
