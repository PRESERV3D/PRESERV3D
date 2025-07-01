<template>
  <q-page class="q-pa-md">

    <router-link to="/artifacts" class="back-button-top">
      <q-btn flat icon="arrow_back" label="Back to Artifacts" />
    </router-link>

    <div v-if="model" class="artifact-detail-container">

      <!-- Editable Artifact Name/Title at the top -->
      <div class="title-section q-mb-lg">
        <q-input
          v-model="editableData.title"
          class="title-input"
          borderless
          input-class="a-title"
        />
      </div>

      <div class="main-content">

        <!-- Left Side: 3D Model Viewer Card -->
        <div class="artifact-card">
          <model-viewer
            :src="model.file_url"
            camera-controls
            loading="lazy"
            auto-rotate
            auto-rotate-delay="1500"
            rotation-per-second="10deg"
            shadow-intensity="1"
            class="large-artifacts"
          />
        </div>

        <!-- Right Side: Information Panel -->
        <div class="info-section">

          <!-- Category Tag and Action Icons -->
          <div class="top-actions q-mb-lg">
            <div class="categories-container">
              <!-- Show categories if they exist, otherwise show fallback -->
              <template v-if="editableCategories && editableCategories.length > 0">
                <q-chip
                  v-for="(category, i) in editableCategories"
                  :key="i"
                  class="category-tag"
                  removable
                  @remove="removeCategory(i)"
                >
                  {{ category }}
                </q-chip>
              </template>
              <template v-else>
                <!-- Fallback placeholder category as there are no data yet -->
                <q-chip
                  class="q-mr-sm q-mt-xs category-tag"
                >
                  Uncategorized
                </q-chip>
              </template>

              <!-- Add Category Input -->
              <q-input
                v-model="newCategory"
                dense
                borderless
                placeholder="Add category"
                class="add-category-input"
                @keyup.enter="addCategory"
                :class="{ 'input-hidden': !showCategoryInput }"
                v-show="showCategoryInput"
              >
                <template v-slot:append>
                  <q-btn
                    flat
                    dense
                    icon="check"
                    @click="addCategory"
                    :disable="!newCategory.trim()"
                  />
                </template>
              </q-input>

              <!-- Add category icon -->
              <q-btn
                flat
                dense
                icon="add"
                class="add-category-btn q-mt-xs"
                @click="toggleCategoryInput"
                v-show="!showCategoryInput"
              />
            </div>

            <!-- Action icons  -->
             <!-- FOR UPDATE -->
            <!-- <div class="action-icons">
              <q-btn
                flat
                no-caps
                dense
                label="Edit"
                class="action-btn edit-btn q-mr-md"
                @click.stop="editModel(model.id)"
              />

              <q-btn
                flat
                no-caps
                dense
                label="Delete"
                class="action-btn delete-btn"
                @click.stop="deleteModel(model.id)"
              />
            </div> -->
          </div>

          <!-- Summary Section -->
          <div class="summary-section q-mb-md">
            <h6 class="a-info-title q-mb-sm q-mt-sm">Summary</h6>
            <q-input
              v-model="editableData.summary"
              type="textarea"
              outlined
              dense
              class="summary-input"
              :input-style="{ minHeight: '60px' }"
            />
          </div>

          <!-- Reference Link -->
           <!-- TO FOLLOW: WEBSCRAPE -->
          <!-- <div class="reference-section q-mb-lg">
            <a href="#" class="reference-link text-primary">
              <q-icon name="link" class="q-mr-xs" />
              Show Reference Links
            </a>
          </div> -->

          <!-- Two-Column Section -->
          <div class="two-column-details q-mb-lg">
            <div class="detail-row q-mb-md">
              <div class="detail-label">
                <div class="inline-edit-container">
                  <q-input
                    v-model="editableLabels.presentedTo"
                    borderless
                    dense
                    class="a-info-title2"
                    :input-style="{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: 'black',
                    fontFamily: 'Poppins, sans-serif'
                  }"

                  />
                </div>
                <q-input
                  v-model="editableData.presentedTo"
                  outlined
                  dense
                  class="detail-input"
                />
              </div>
              <div class="detail-value">
                <div class="inline-edit-container">
                  <q-input
                    v-model="editableLabels.awardedBy"
                    borderless
                    dense
                    class="a-info-title2"
                    :input-style="{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: 'black',
                    fontFamily: 'Poppins, sans-serif'
                  }"
                />
              </div>
                <q-input
                  v-model="editableData.awardedBy"
                  outlined
                  dense
                  class="detail-input"
                />
              </div>
            </div>

            <div class="detail-row q-mb-md">
              <div class="detail-label">
                <div class="a-info-title2">Object of Study</div>
                <q-input
                  v-model="editableData.objectOfStudy"
                  outlined
                  dense
                  class="detail-input"
                />
              </div>
              <div class="detail-value">
                <div class="a-info-title2">Date Awarded</div>
                <q-input
                  v-model="editableData.dateAwarded"
                  outlined
                  dense
                  class="detail-input"
                  type="date"
                />
              </div>
            </div>

            <!-- Single Column Section -->
            <div class="detail-item q-mb-md">
              <div class="a-info-title2">Data Source</div>
              <q-input
                v-model="editableData.dataSource"
                outlined
                dense
                class="detail-input full-width"
              />
            </div>

            <!-- ADMIN: Info with side-by-side layout -->
            <div class="side-by-side-details q-mb-lg">
              <div class="detail-row q-mb-md">
                <div class="detail-label">
                  <div class="a-info-title2">Created By:</div>
                </div>
                <div class="detail-value">
                  <q-input
                    v-model="editableData.createdBy"
                    outlined
                    dense
                    class="detail-input"
                  />
                </div>
              </div>

              <div class="detail-row q-mb-md">
                <div class="detail-label">
                  <div class="a-info-title2">Modified By:</div>
                </div>
                <div class="detail-value">
                  <q-input
                    v-model="editableData.modifiedBy"
                    outlined
                    dense
                    class="detail-input"
                  />
                </div>
              </div>

              <div class="detail-row q-mb-md">
                <div class="detail-label">
                  <div class="a-info-title2">Donated/Loaned By:</div>
                </div>
                <div class="detail-value">
                  <q-input
                    v-model="editableData.donatedBy"
                    outlined
                    dense
                    class="detail-input"
                  />
                </div>
              </div>

              <div class="detail-row q-mb-md">
                <div class="detail-label">
                  <div class="a-info-title2">Date Received:</div>
                </div>
                <div class="detail-value">
                  <q-input
                    v-model="editableData.dateReceived"
                    outlined
                    dense
                    class="detail-input"
                    type="datetime-local"
                  />
                </div>
              </div>
            </div>

            <!-- Save/Cancel Actions -->
            <div class="save-cancel-actions q-mt-lg">
              <q-btn
                flat
                no-caps
                dense
                label="Cancel"
                class="cancel-btn"
                @click="cancelChanges"
              />
              <q-btn
                flat
                no-caps
                dense
                label="Save"
                class="save-btn q-ml-auto"
                color="primary"
                @click="saveChanges"
              />
            </div>

          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading-container">
      <q-spinner size="xl" />
    </div>
  </q-page>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed, ref, watch } from 'vue'
import { useModelStore } from 'stores/modelStore'
import '@google/model-viewer'

const route = useRoute()
const modelStore = useModelStore()

// Reactive references for category management
const newCategory = ref('')
const editableCategories = ref([])
const showCategoryInput = ref(false)

// Reactive reference for editable labels
const editableLabels = ref({
  presentedTo: 'Presented To',
  awardedBy: 'Awarded By',
  objectOfStudy: 'Object of Study',
  dateAwarded: 'Date Awarded',
  dataSource: 'Data Source',
  createdBy: 'Created By:',
  modifiedBy: 'Modified By:',
  donatedBy: 'Donated/Loaned By:',
  dateReceived: 'Date Received:'
})

// Reactive reference for all editable data (including title)
const editableData = ref({
  title: '',
  summary: '',
  presentedTo: '',
  awardedBy: '',
  objectOfStudy: '',
  dateAwarded: '',
  dataSource: '',
  createdBy: '',
  modifiedBy: '',
  donatedBy: '',
  dateReceived: ''
})


function formatDateForInput(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toISOString().slice(0, 16) // Format for datetime-local input
}

const model = computed(() => modelStore.models.find((model) => model.id == route.params.id))

// Initialize editable categories and data when model changes
watch(model, (newModel) => {
  if (newModel) {
    // Initialize categories
    if (newModel.metadata.categories) {
      editableCategories.value = [...newModel.metadata.categories]
    } else {
      editableCategories.value = []
    }

    // Initialize all editable data (including title)
    editableData.value = {
      title: newModel.metadata.title || 'Untitled Artifact',
      summary: newModel.metadata.summary || '',
      presentedTo: newModel.presented_to || '[Recipient\'s Name]',
      awardedBy: newModel.awarded_by || '[Awardee\'s Name]',
      objectOfStudy: newModel.object_of_study || 'Information Technology',
      dateAwarded: newModel.date_awarded || '2024-05-18',
      dataSource: newModel.data_source || 'Student Affairs and Recognition Committee',
      createdBy: newModel.created_by || '[Creator Name]',
      modifiedBy: newModel.modified_by || '[Modifier Name]',
      donatedBy: newModel.donated_by || '[Donor/Lender Name]',
      dateReceived: formatDateForInput(newModel.date_received || newModel.uploaded_at)
    }
  } else {
    editableCategories.value = []
    // Reset editable data
    editableData.value = {
      title: '',
      summary: '',
      presentedTo: '',
      awardedBy: '',
      objectOfStudy: '',
      dateAwarded: '',
      dataSource: '',
      createdBy: '',
      modifiedBy: '',
      donatedBy: '',
      dateReceived: ''
    }
  }
}, { immediate: true })

// Category management functions
const toggleCategoryInput = () => {
  showCategoryInput.value = true
  // Focus on input after it becomes visible
  setTimeout(() => {
    const input = document.querySelector('.add-category-input input')
    if (input) input.focus()
  }, 100)
}

const addCategory = () => {
  if (newCategory.value.trim() && !editableCategories.value.includes(newCategory.value.trim())) {
    editableCategories.value.push(newCategory.value.trim())
    newCategory.value = ''
    showCategoryInput.value = false
  }
}

const removeCategory = (index) => {
  editableCategories.value.splice(index, 1)
}

// Save and Cancel functions
const saveChanges = () => {
  if (model.value) {
    // Update the model with all new data (including title)
    const updatedModel = {
      ...model.value,
      metadata: {
        ...model.value.metadata,
        title: editableData.value.title,
        categories: [...editableCategories.value],
        summary: editableData.value.summary
      },
      presented_to: editableData.value.presentedTo,
      awarded_by: editableData.value.awardedBy,
      object_of_study: editableData.value.objectOfStudy,
      date_awarded: editableData.value.dateAwarded,
      data_source: editableData.value.dataSource,
      created_by: editableData.value.createdBy,
      modified_by: editableData.value.modifiedBy,
      donated_by: editableData.value.donatedBy,
      date_received: editableData.value.dateReceived
    }

    // Update in store
    modelStore.updateModel(updatedModel)

    console.log('Changes saved:', updatedModel)

  }
}

const cancelChanges = () => {
  if (model.value) {
    if (model.value.metadata.categories) {
      editableCategories.value = [...model.value.metadata.categories]
    } else {
      editableCategories.value = []
    }

    // Reset all editable data (including title)
    editableData.value = {
      title: model.value.metadata.title || 'Untitled Artifact',
      summary: model.value.metadata.summary || '',
      presentedTo: model.value.presented_to || '[Recipient\'s Name]',
      awardedBy: model.value.awarded_by || '[Awardee\'s Name]',
      objectOfStudy: model.value.object_of_study || 'Information Technology',
      dateAwarded: model.value.date_awarded || '2024-05-18',
      dataSource: model.value.data_source || 'Student Affairs and Recognition Committee',
      createdBy: model.value.created_by || '[Creator Name]',
      modifiedBy: model.value.modified_by || '[Modifier Name]',
      donatedBy: model.value.donated_by || '[Donor/Lender Name]',
      dateReceived: formatDateForInput(model.value.date_received || model.value.uploaded_at)
    }
  }
  newCategory.value = ''
  showCategoryInput.value = false
  console.log('Changes cancelled')
}


// Existing functions

// FOR UPDATE
// const editModel = (id) => {
//   console.log('Edit model:', id);
// };

// const deleteModel = (id) => {
//   console.log('Delete model:', id);
// };
</script>

<style scoped>


/* Title Section - Fixed positioning and sizing */
.title-section {
  width: 100%;
  text-align: center;
  margin-bottom: 2rem;
}

.title-input {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

/* Fix title input styling to prevent cutoff */
.title-input :deep(.q-field__control) {
  padding: 0 !important;
  min-height: auto !important;
  overflow: visible !important;
}

.title-input :deep(.q-field__native) {
  font-family: 'Poppins', sans-serif !important;
  font-weight: 500 !important;
  font-size: clamp(32px, 6vw, 64px) !important;
  color: #560505 !important;
  padding: 16px 0 !important;
  line-height: 1.2 !important;
  text-align: center !important;
  width: 100% !important;
  margin: 0 !important;
  border: none !important;
  outline: none !important;
}


.title-input .a-title {
  margin-left: 0 !important;
  margin-top: 0 !important;
}

/* Category management */
.add-category-input {
  max-width: 200px;
}

.add-category-btn {
  margin-top: 4px;
  color: #666;
}

.add-category-btn:hover {
  color: #333;
  background-color: #f5f5f5;
}

/* Save/Cancel actions */
.save-cancel-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn {
  color: #666;
}

.cancel-btn:hover {
  color: #333;
  background-color: #f5f5f5;
}

.save-btn {
  margin-left: auto;
}

/* Layout and spacing */
.category-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.categories-container {
  flex: 1;
}

.top-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.action-icons {
  display: flex;
  flex-shrink: 0;
}

.detail-input {
  margin-top: 8px;
}

/* Style inputs to match your original design */
.detail-input :deep(.q-field__native),
.summary-input :deep(.q-field__native) {
  font-family: 'Poppins', sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  color: black !important;
  line-height: 1.4 !important;
}

.full-width {
  width: 100%;
}

.summary-input {
  width: 100%;
}

/* Original title styling (kept for reference but not used in input) */
.a-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 64px;
  color: #560505;
}

/* Info titles */
.a-info-title,
.a-info-title2 {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  color: black;
  margin-bottom: 0.5rem;
}

.a-info-title {
  font-size: 18px;
}

.a-info-title2 {
  font-size: 16px;
}

/* Text styling */
.a-info-subtitle,
.a-info-text {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: black;
  line-height: 1.4;
}

/* Responsive design for mobile */
@media (max-width: 768px) {
  .title-input :deep(.q-field__native) {
    font-size: 32px !important;
    padding: 12px 0 !important;
  }

  .title-section {
    margin-bottom: 1rem;
  }
}
</style>
