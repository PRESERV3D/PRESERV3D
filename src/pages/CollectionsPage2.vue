<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md q-mb-md">
      <!-- Header -->
      <div class="row items-center justify-between">
        <div class="text-h6">Hello, {{ user.first_name }}!</div>
        <q-btn label="Add New" color="primary" @click="showDialog = true" />
      </div>

      <h5>Collections</h5>

      <!-- Loading Spinner -->
      <div v-if="isLoading" class="text-center q-my-md">
        <q-spinner color="primary" size="lg" />
      </div>

      <!-- Collection Display -->
      <div v-else>
        <div v-if="collections.length > 0" class="row q-col-gutter-md">
          <div v-for="collection in collections" :key="collection.collection_id">
            <q-card
              class="q-ma-sm cursor-pointer"
              @click="goToCollectionDetailsPage(collection.collection_id)"
            >
              <img :src="collection.cover_url" alt="Collection Cover" width="20px" height="200px" />
              <q-card-section class="text-center">
                <div class="text-subtitle1">{{ collection.collection_name }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div v-else class="text-center q-mt-md">
          <p>No collections found.</p>
        </div>

        <div class="q-mt-md flex justify-center">
          <q-btn label="See All" color="primary" @click="goToCollectionsPage" />
        </div>
      </div>
    </q-card>

    <!-- Add New Collection Dialog -->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add New Collection</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="newCollection.name"
            label="Collection Name"
            filled
            :rules="[(val) => !!val || 'Required']"
            lazy-rules
          />
          <q-input v-model="newCollection.description" label="Description" filled class="q-mt-md" />
          <q-uploader
            ref="uploaderRef"
            label="Upload Cover Image"
            accept="image/*"
            :max-files="1"
            auto-upload
            @added="handleFile"
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup @click="resetForm" />
          <q-btn
            label="Save"
            color="primary"
            @click="saveCollection"
            :disable="!newCollection.name"
          />
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
const uploaderRef = ref(null)

const newCollection = ref({
  name: '',
  description: '',
  coverFile: null,
})

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

async function loadCollections(userId) {
  const { data, error } = await supabase
    .from('collections')
    .select('collection_name, cover_url, collection_id')
    .eq('user_id', userId)

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

function handleFile(files) {
  if (files.length) {
    newCollection.value.coverFile = files[0]
  }
}

function resetForm() {
  newCollection.value = { name: '', description: '', coverFile: null }
  uploaderRef.value?.reset()
}

async function saveCollection() {
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
      collection_name: newCollection.value.name,
      description: newCollection.value.description,
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
