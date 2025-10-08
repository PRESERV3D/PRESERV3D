<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card class="add-documentarti-card">
      <div class="upload-sections-container">
        <!-- Camera Section (only for documents/images) -->
        <q-card-section
          v-if="showCamera && !selectedFile"
          class="two-box-upload-docuarti camera-section"
          @click="$emit('camera-click')"
        >
          <q-img src="/img/camera.png" alt="Camera" class="upload-icon-docu" />
          <q-btn
            outline
            label="Use Camera"
            class="camera-btn"
            @click="$emit('camera-click')"
            no-caps
          />
        </q-card-section>

        <!-- Upload Section -->
        <q-card-section
          :class="[
            selectedFile
              ? 'box-upload-docuarti'
              : showCamera
                ? 'two-box-upload-docuarti'
                : 'box-upload-docuarti',
            'upload-section',
            { 'drag-over': isDragging },
          ]"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onFileDrop"
        >
          <q-img
            src="/img/drag-drop-icon.png"
            :alt="`Upload-${uploadType}`"
            class="upload-icon-docu"
          />

          <div
            v-if="!selectedFile"
            class="sub-font-3 text-center"
            style="font-size: 14px; font-weight: 200"
          >
            <div class="sub-font-3 text-center" style="font-size: 18px; font-weight: 200">
              DRAG and DROP files
            </div>
            or
            <a href="#" @click.prevent="triggerFileInput">
              <strong>Browse Files</strong>
            </a>
            on your computer
          </div>

          <div v-else class="documentarti-preview text-center">
            <q-btn
              dense
              round
              flat
              icon="close"
              class="thumbnail-delete"
              @click="deleteSelectedFile"
            />
            <q-img src="/img/document-icon.png" :alt="uploadType" class="document-icon" />
            <div class="selected-document-name q-mt-md">
              {{ selectedFile.name }}
            </div>
            <!-- Upload progress bar -->
            <q-linear-progress
              v-if="uploading"
              :value="uploadProgress / 100"
              color="primary"
              class="q-mt-md full-width"
            />
            <!-- Show current process status -->
            <div v-if="uploading && currentProcess" class="q-mt-sm text-caption text-grey">
              {{ currentProcess }}
            </div>
          </div>

          <input
            type="file"
            ref="fileInput"
            accept=".pdf,.glb"
            style="display: none"
            @change="handleFileChange"
          />
        </q-card-section>
      </div>

      <q-card-actions class="row q-ml-lg justify-between items-center">
        <div></div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <q-btn
            v-if="!uploading"
            label="Upload"
            :disabled="selectedFile === null"
            class="q-ml-xl q-mt-sm btn-save"
            @click="handleUpload"
            no-caps
          />

          <q-spinner v-else color="primary" size="2em" class="q-ml-xl q-mt-sm" />
        </div>

        <q-btn
          flat
          label="Cancel"
          class="q-mt-sm sub-font-2"
          style="color: #000000"
          @click="handleCancel"
          no-caps
        />
      </q-card-actions>
    </q-card>

    <!-- Confirmation Dialog for Cancel -->
    <q-dialog v-model="showCancelConfirmation" persistent>
      <q-card class="confirmation-delete">
        <q-card-section class="column items-center">
          <q-img src="/img/conf-delete.png" alt="question icon" class="question-icon" />
          <div class="q-mt-md sub-font" style="color: #000000">
            Upload is in progress. Are you sure you want to cancel?
            <div class="text-body2 text-grey q-mt-sm">
              • File upload will be stopped
              <span v-if="currentProcess"> <br />• {{ currentProcess }} will be terminated </span>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn label="Yes" class="btn-save" flat @click="confirmCancel" />
          <q-btn flat label="No" class="sub-font-2" style="color: #000000" v-close-popup no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  uploadType: {
    type: String,
    required: true,
  },
  showCamera: {
    type: Boolean,
    default: false,
  },
  uploading: {
    type: Boolean,
    default: false,
  },
  uploadProgress: {
    type: Number,
    default: 0,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  preSelectedFile: {
    type: [File, null],
    default: null,
  },
  currentProcess: {
    type: String,
    default: '',
  },
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'file-selected',
  'file-dropped',
  'upload-click',
  'cancel-click',
  'camera-click',
  'force-cancel',
])

// Reactive data
const selectedFile = ref(null)
const fileInput = ref(null)
const isDragging = ref(false)
const showCancelConfirmation = ref(false)

// Computed
const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Watch for pre-selected file changes
watch(
  () => props.preSelectedFile,
  (newFile) => {
    if (newFile) {
      selectedFile.value = newFile
    }
  },
  { immediate: true },
)

// Watch for dialog opening/closing
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      if (props.preSelectedFile) {
        selectedFile.value = props.preSelectedFile
      }
    } else {
      if (!props.preSelectedFile) {
        selectedFile.value = null
      }
      isDragging.value = false
      showCancelConfirmation.value = false
    }
  },
)

// Methods
function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(event) {
  const files = event.target.files

  // Handle single file
  const file = files[0]
  if (file) {
    selectedFile.value = file
    emit('file-selected', file)
  } else {
    selectedFile.value = null
    emit('file-selected', null)
  }
}

function onDragOver() {
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onFileDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files?.[0]

  if (file) {
    selectedFile.value = file
    emit('file-dropped', file)
  }
}

function deleteSelectedFile() {
  selectedFile.value = null
  emit('file-selected', null)
}

function handleUpload() {
  if (selectedFile.value) {
    emit('upload-click', selectedFile.value)
  }
}

function handleCancel() {
  if (props.uploading) {
    showCancelConfirmation.value = true
  } else {
    selectedFile.value = null
    emit('cancel-click')
    dialogModel.value = false
  }
}

function confirmCancel() {
  showCancelConfirmation.value = false
  emit('force-cancel')
}

// Expose methods for parent components if needed
defineExpose({
  selectedFile,
  resetFile: () => {
    selectedFile.value = null
  },
  setFile: (file) => {
    selectedFile.value = file
  },
})
</script>

<style scoped>
.upload-sections-container {
  display: flex;
  gap: 1rem;
  width: 100%;
  justify-content: center;
}

.two-box-upload-docuarti {
  width: 16rem;
  height: 14.5rem;
  background-color: transparent !important;
  border: 2px dashed #afafaf !important;
  border-radius: 15px !important;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
}

.box-upload-docuarti {
  width: 32rem;
  height: 14.5rem;
  background-color: transparent !important;
  border: 2px dashed #afafaf !important;
  border-radius: 15px !important;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
}

.camera-section {
  transition: all 0.3s ease;
}

.camera-section:hover {
  border-color: #560505;
  background-color: rgba(86, 5, 5, 0.05);
}

.upload-section.drag-over {
  border-color: #1976d2;
  background-color: rgba(25, 118, 210, 0.05);
}

.documentarti-preview {
  position: relative;
  width: 100%;
}

.thumbnail-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(244, 67, 54, 0.9);
  color: white;
  z-index: 100;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.document-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
}

.selected-document-name {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  word-break: break-all;
  max-width: 250px;
  margin: 0 auto;
}

.upload-icon-docu {
  width: 60px;
  height: 60px;
  margin-bottom: 1rem;
}

.camera-btn {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
}

.action-buttons {
  display: flex;
  align-items: center;
}

.btn-save {
  background-color: var(--q-primary);
  color: white;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  min-width: 100px;
}

.cancel-confirmation-card {
  min-width: 350px;
  max-width: 500px;
}
</style>
