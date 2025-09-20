<template>
  <q-page class="q-pa-md column items-center">
    <div class="text-h5 q-mb-md">PDF Text Extractor</div>

    <!-- Dropdown of Uploaded Documents -->
    <q-select
      v-model="selected"
      :options="docOptions"
      option-label="label"
      option-value="value"
      label="Select an Uploaded Document"
      filled
      style="width: 100%; max-width: 800px"
      class="q-mb-md"
      @update:model-value="loadSelectedDoc"
    />

    <q-uploader
      v-model="files"
      label="Upload PDF"
      accept=".pdf"
      :auto-upload="false"
      @added="uploadPDF"
      class="q-mb-md"
    />

    <!-- Editable File Name -->
    <q-input
      v-model="fileName"
      filled
      label="File Name"
      style="width: 100%; max-width: 800px"
      class="q-mb-md"
    />

    <!-- Extracted Text -->
    <q-input
      v-model="extractedText"
      filled
      type="textarea"
      autogrow
      label="Extracted Text"
      style="width: 100%; max-width: 800px; min-height: 300px"
    />

    <div class="q-mt-md row q-gutter-sm">
      <q-btn color="primary" label="Download .txt" @click="downloadTxt" />
      <!-- Conditionally show Extract or Save button -->
      <q-btn
        v-if="selectedDoc && !hasExtractedText"
        color="secondary"
        label="Extract Text"
        @click="extractDocText"
      />
      <q-btn
        v-else
        color="secondary"
        label="Save Text"
        @click="updateText"
        :disable="!selectedDoc"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'boot/supabase'
import axios from 'axios'

const $q = useQuasar()
const files = ref([])
const fileName = ref('')
const extractedText = ref('')
const hasExtractedText = ref(false)

// Dropdown state
const docOptions = ref([])
const selectedDoc = ref(null)
const selected = ref(null)

onMounted(fetchDocuments)

// Fetch uploaded documents from DB
async function fetchDocuments() {
  try {
    const { data, error } = await supabase
      .from('documents_metadata')
      .select('id, file_name, file_url, metadata')
    if (error) throw error

    console.log('Fetched documents:', data)

    docOptions.value = data.map((doc) => ({
      label: doc.metadata?.title || doc.file_name,
      value: doc,
    }))
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Failed to fetch documents.' })
  }
}

function loadSelectedDoc(option) {
  const doc = option.value || option
  if (!doc) return

  let meta = doc.metadata
  if (typeof meta === 'string') {
    meta = JSON.parse(meta)
  }

  extractedText.value = meta?.extracted_text || ''
  fileName.value = doc.file_name.replace(/\.pdf$/i, '')
  hasExtractedText.value = !!meta?.extracted_text
  selectedDoc.value = doc
}

async function extractDocText() {
  if (!selectedDoc.value) return

  try {
    $q.loading.show()

    const form = new FormData()
    form.append('file_name', selectedDoc.value.file_name)
    form.append('file_url', selectedDoc.value.file_url)

    const { data } = await axios.post('http://localhost:8000/extract-text', form)

    if (data.status === 'error') {
      $q.notify({ type: 'negative', message: data.error })
      return
    }

    extractedText.value = data.extracted_text || ''
    hasExtractedText.value = true
    $q.notify({ type: 'positive', message: 'Text extracted successfully! Now you can save it.' })
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    $q.loading.hide()
  }
}

async function uploadPDF(addedFiles) {
  if (!addedFiles.length) return
  const form = new FormData()
  form.append('file', addedFiles[0])

  try {
    $q.loading.show()
    const { data } = await axios.post('http://localhost:8000/extract-text', form)

    if (data.status === 'error') {
      $q.notify({ type: 'negative', message: data.error })
      return
    }

    if (data.status === 'ocr_required') {
      $q.notify({
        type: 'warning',
        message: 'No text detected. OCR may be needed.',
      })
      return
    }

    extractedText.value = data.extracted_text || ''

    if (data.filename) {
      const rawName = data.filename || (addedFiles[0]?.name ?? 'output.txt')
      fileName.value = rawName.replace(/\.pdf$/i, '')
    }

    // Newly uploaded files should NOT be saved to metadata
    selectedDoc.value = null
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    $q.loading.hide()
  }
}

function downloadTxt() {
  const name = fileName.value.trim() || 'extracted_text'
  const blob = new Blob([extractedText.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

async function updateText() {
  if (!selectedDoc.value) {
    $q.notify({ type: 'warning', message: 'Cannot save a newly uploaded file.' })
    return
  }

  try {
    const updatedMetadata = {
      ...selectedDoc.value.metadata,
      extracted_text: extractedText.value,
    }

    const { error } = await supabase
      .from('documents_metadata')
      .update({ metadata: updatedMetadata })
      .eq('file_name', selectedDoc.value.file_name)

    if (error) throw error

    $q.notify({ type: 'positive', message: 'Metadata updated successfully!' })

    // Optionally update local docOptions
    selectedDoc.value.metadata = updatedMetadata
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Failed to save metadata.' })
  }
}
</script>
