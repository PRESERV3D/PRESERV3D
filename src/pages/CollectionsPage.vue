<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <div class="q-mt-xs title">Collections</div>

      <div class="q-mb-md sub-font-3 row items-baseline justify-between">
        <div class="q-ml-sm">Archival Materials grouped into a collection.</div>
        <q-btn label="Add New" class="btn-add" no-caps @click="showDialog = true" />
      </div>

      <div class="box-collections">
        <q-card
          v-for="collection in placeholderCollections"
          :key="collection.id"
          class="collectionCard"
        >
          <router-link :to="`/collections/${collection.id}`" class="collection-link">
            <img :src="collection.image" :alt="collection.title" class="collection-image" />
          </router-link>

          <div class="q-mt-md fade-title-container">
            <div class="q-mt-md sub-font fade-title" style="color: black; font-weight: 800">
              {{ collection.title }}
              <div class="tooltip-box">{{ collection.title }}</div>
            </div>
          </div>
        </q-card>
      </div>

      <!-- Add Collection Dialog -->
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

            <div class="col-5">
              <div class="sub-font-3" style="font-size: 16px; font-weight: 500">
                COLLECTION NAME
              </div>
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
              no-caps
            />
            <q-btn label="Save" class="q-mr-sm btn-save" @click="addCollection" no-caps />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const showDialog = ref(false)
const newCollectionTitle = ref('')
const newCollectionDesc = ref('')
const fileInput = ref(null)
const previewImage = ref(null)
const placeholderCollections = ref([
  {
    id: 1,
    title: 'Favorites',
    image: '/src/assets/img/favorites.png',
  },
])

function addCollection() {
  if (!newCollectionTitle.value.trim()) return

  const newId = placeholderCollections.value.length + 1
  placeholderCollections.value.push({
    id: newId,
    title: newCollectionTitle.value,
    image:
      previewImage.value ||
      `https://via.placeholder.com/300x200?text=${encodeURIComponent(newCollectionTitle.value)}`,
  })

  // Clear form
  newCollectionTitle.value = ''
  newCollectionDesc.value = ''
  previewImage.value = null
  showDialog.value = false
}

function triggerFilePicker() {
  fileInput.value.click()
}

function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    previewImage.value = reader.result
  }
  reader.readAsDataURL(file)
}
</script>
