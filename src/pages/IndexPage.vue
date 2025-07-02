<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between">
      <div class="text-h6">Hello, {{ user.first_name }}!</div>
    </div>

    <div class="q-mt-xs title">Collections</div>

    <div class="q-mb-md sub-font-3 row items-baseline justify-between">
      <div class="q-ml-sm">Archival Materials grouped into a collection.</div>
      <q-btn label="Add New" class="btn-add" no-caps @click="showDialog = true" />
    </div>

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="text-center q-my-md">
      <q-spinner color="primary" size="lg" />
    </div>

    <!-- Collection Display -->
    <div v-else>
      <div v-if="collections.length > 0" class="box-collections">
        <!-- Show up to 4 collections -->
        <q-card
          v-for="collection in collections.slice(0, 4)"
          :key="collection.collection_id"
          class="collectionCard"
          @click="goToCollectionDetailsPage(collection.collection_id)"
        >
          <router-link :to="`/collection/${collection.collection_id}`" class="collection-link">
            <img
              :src="collection.cover_url"
              :alt="collection.collection_name"
              class="collection-image"
              style="width: 100%; height: 200px; object-fit: cover"
            />
          </router-link>

          <div class="q-mt-md fade-title-container">
            <div class="q-mt-md sub-font fade-title" style="color: black; font-weight: 800">
              {{ collection.collection_name }}
              <div class="tooltip-box">{{ collection.collection_name }}</div>
            </div>
          </div>
        </q-card>

        <div class="row justify-end q-mt-sm">
          <q-btn label="See All" color="primary" @click="goToCollectionsPage" />
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

        <q-card-section class="row q-col-gutter-md">
          <div class="col-6">
            <div class="upload-box" @click="triggerFilePicker">
              <q-img
                v-if="previewImage"
                :src="previewImage"
                style="width: 100%; height: 14.5rem; object-fit: cover; border-radius: 10px"
              />
              <div v-else class="upload text-center q-pa-md">
                <q-img src="src/assets/img/write.png" alt="Upload" class="upload-icon q-mb-sm" />
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

          <div class="col-5">
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
import { useRouter } from 'vue-router'

const router = useRouter()
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

// Load user and their collections
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

// Load collections sorted from latest to oldest
async function loadCollections(userId) {
  const { data, error } = await supabase
    .from('collections')
    .select('collection_name, cover_url, collection_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading collections:', error)
  } else {
    collections.value = data
  }

  isLoading.value = false
}

function goToCollectionsPage() {
  router.push('/collections')
}

function goToCollectionDetailsPage(collectionId) {
  router.push(`/collection/${collectionId}`)
}

function triggerFilePicker() {
  fileInput.value.click()
}

function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  newCollection.value.coverFile = file

  const reader = new FileReader()
  reader.onload = () => {
    previewImage.value = reader.result
  }
  reader.readAsDataURL(file)
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
