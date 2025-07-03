<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <div class="q-mt-xs title">Collections</div>
      <div class="q-mb-md sub-font-3 row items-baseline justify-between">
        <div class="q-ml-sm">Archival Materials grouped into a collection.</div>
        <div class="artifact-btn">
          <span class="showing-text">Showing </span>

          <q-btn-dropdown
            outline
            color="black"
            :label="itemsToShow === 'all' ? 'All' : itemsToShow.toString()"
            size="sm"
            class="q-ml-sm artifact-btn-style"
          >
            <q-list>
              <q-item clickable v-close-popup @click="setItemsToShow('all')">
                <q-item-section>All</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setItemsToShow(9)">
                <q-item-section>9</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setItemsToShow(12)">
                <q-item-section>12</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setItemsToShow(18)">
                <q-item-section>18</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <q-btn-dropdown
            outline
            color="black"
            label="Filter"
            icon="filter_list"
            size="sm"
            class="q-ml-sm artifact-btn-style"
          >
            <q-list class="filter-dropdown">
              <q-item>
                <q-item-section>
                  <q-select
                    v-model="categoryFilter"
                    :options="categoryOptions"
                    outlined
                    label="Select Category"
                    dense
                    clearable
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-select
                    v-model="statusFilter"
                    :options="statusOptions"
                    outlined
                    label="Select Status"
                    dense
                    clearable
                  />
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="clearFilters">
                <q-item-section>
                  <q-item-label>Clear All Filters</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="clear" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <q-btn-dropdown
            outline
            color="black"
            label="Sort"
            icon="sort"
            size="sm"
            class="q-ml-xs artifact-btn-style"
          >
            <q-list>
              <q-item-label header>Sort by</q-item-label>
              <q-item clickable v-close-popup @click="setSortBy('name')">
                <q-item-section>
                  <q-item-label>Name</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="sortBy === 'name'" name="check" color="primary" />
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setSortBy('popularity')">
                <q-item-section>
                  <q-item-label>Popularity</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="sortBy === 'popularity'" name="check" color="primary" />
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item-label header>Order</q-item-label>
              <q-item clickable v-close-popup @click="setSortOrder('asc')">
                <q-item-section>
                  <q-item-label>Ascending</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="sortOrder === 'asc'" name="check" color="primary" />
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setSortOrder('desc')">
                <q-item-section>
                  <q-item-label>Descending</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="sortOrder === 'desc'" name="check" color="primary" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn
            @click="addNewCollection"
            label="Add New"
            icon="add_circle"
            style="min-width: 150px"
            class="add-new-btn"
            no-caps
            unelevated
          />
        </div>
      </div>

      <div class="box-collections">
        <div
          v-for="collection in placeholderCollections"
          :key="collection.id"
          class="collection-item"
        >
          <router-link :to="`/collections/${collection.id}`" class="collection-link">
            <img
              :src="collection.image"
              :alt="collection.title"
              class="book-cover-img"
              style="object-fit: cover"
            />
          </router-link>

          <div class="q-mt-md fade-title-container">
            <div
              class="sub-font fade-title"
              style="color: black; font-weight: 600; margin-left: 3rem"
            >
              {{ collection.title }}
              <div class="tooltip-box">{{ collection.title }}</div>
            </div>
          </div>
        </div>
      </div>

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

function triggerFileInput() {
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
