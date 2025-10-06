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
      clearable
      @clear="clearSelection"
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

    <!-- Processing Status -->
    <div v-if="processingStatus" class="q-mb-md text-center">
      <q-spinner-dots size="2em" color="primary" />
      <div class="text-body2 q-mt-sm">{{ processingStatus }}</div>
    </div>

    <!-- Extracted Text -->
    <q-input
      v-model="extractedText"
      filled
      type="textarea"
      autogrow
      label="Extracted Text"
      style="width: 100%; max-width: 800px; min-height: 300px"
    />

    <!-- OCR Results Summary -->
    <div v-if="ocrResults" class="q-mt-md text-caption text-grey-7">
      OCR Results: {{ ocrResults.pagesSuccessful }}/{{ ocrResults.pagesProcessed }} pages processed,
      {{ ocrResults.totalCharacters }} characters extracted ({{ ocrResults.averageConfidence }}%
      confidence)
    </div>

    <div class="q-mt-md row q-gutter-sm">
      <q-btn color="primary" label="Download .txt" @click="downloadTxt" />
      <!-- Conditionally show Extract or Save button -->
      <q-btn
        v-if="selectedDoc"
        color="secondary"
        label="Extract Text"
        @click="extractDocText"
        :loading="isProcessing"
      />
      <q-btn
        v-if="hasExtractedText"
        color="positive"
        label="Save Text"
        @click="updateText"
        :disable="!selectedDoc"
      />
      <!-- Cancel button for OCR processing -->
      <q-btn
        v-if="isProcessing && ocrController"
        color="negative"
        label="Cancel OCR"
        @click="cancelOCR"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'boot/supabase'
import axios from 'axios'
import { processOCRPages } from '/services/ocr_service'

const $q = useQuasar()
const files = ref([])
const fileName = ref('')
const extractedText = ref('')
const hasExtractedText = ref(false)
const isProcessing = ref(false)
const processingStatus = ref('')
const ocrResults = ref(null)
const ocrController = ref(null)

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
  if (!option) {
    selectedDoc.value = null
    extractedText.value = ''
    fileName.value = ''
    hasExtractedText.value = false
    ocrResults.value = null
    return
  }

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
  ocrResults.value = null // Reset OCR results when switching documents
}

async function extractDocText() {
  if (!selectedDoc.value) return

  try {
    isProcessing.value = true
    processingStatus.value = 'Extracting text from PDF...'
    ocrResults.value = null

    const form = new FormData()
    form.append('file_name', selectedDoc.value.file_name)
    form.append('file_url', selectedDoc.value.file_url)

    const { data } = await axios.post('http://localhost:8000/extract-text', form)

    if (data.status === 'error') {
      $q.notify({ type: 'negative', message: data.error })
      return
    }

    // Check if OCR is required
    if (data.status === 'ocr_required') {
      $q.notify({
        type: 'info',
        message: 'No text detected in PDF. Starting OCR processing...',
        timeout: 3000,
      })
      await performOCR(data)
      return
    }

    // Regular text extraction successful
    extractedText.value = data.extracted_text || ''
    hasExtractedText.value = true
    processingStatus.value = ''
    $q.notify({ type: 'positive', message: 'Text extracted successfully! Now you can save it.' })
  } catch (err) {
    console.error('Extract text error:', err)
    $q.notify({ type: 'negative', message: err.message || 'Failed to extract text' })
  } finally {
    isProcessing.value = false
    processingStatus.value = ''
  }
}

async function uploadPDF(addedFiles) {
  if (!addedFiles.length) return
  const form = new FormData()
  form.append('file', addedFiles[0])

  try {
    isProcessing.value = true
    processingStatus.value = 'Processing uploaded PDF...'
    ocrResults.value = null

    const { data } = await axios.post('http://localhost:8000/extract-text', form)

    if (data.status === 'error') {
      $q.notify({ type: 'negative', message: data.error })
      return
    }

    // Check if OCR is required
    if (data.status === 'ocr_required') {
      $q.notify({
        type: 'info',
        message: 'No text detected in PDF. Starting OCR processing...',
        timeout: 3000,
      })
      await performOCR(data)
      return
    }

    // Regular text extraction successful
    extractedText.value = data.extracted_text || ''

    if (data.filename) {
      const rawName = data.filename || (addedFiles[0]?.name ?? 'output.txt')
      fileName.value = rawName.replace(/\.pdf$/i, '')
    }

    // Newly uploaded files should NOT be saved to metadata
    selectedDoc.value = null
    processingStatus.value = ''
  } catch (err) {
    console.error('Upload PDF error:', err)
    $q.notify({ type: 'negative', message: err.message || 'Failed to process PDF' })
  } finally {
    isProcessing.value = false
    processingStatus.value = ''
  }
}

async function performOCR(ocrResponse) {
  try {
    processingStatus.value = 'Running OCR on document pages...'

    // Create an AbortController for cancellation
    ocrController.value = new AbortController()

    const ocrOptions = {
      minPages: 3,
      minCharacters: 2000,
      maxConcurrent: 2,
      language: 'eng',
      signal: ocrController.value.signal,
    }

    // Update status periodically
    const statusInterval = setInterval(() => {
      if (processingStatus.value.includes('OCR')) {
        const dots = (processingStatus.value.match(/\./g) || []).length
        const newDots = dots >= 3 ? '' : '.'.repeat(dots + 1)
        processingStatus.value = `Running OCR on document pages${newDots}`
      }
    }, 1000)

    const result = await processOCRPages(ocrResponse, ocrOptions)

    clearInterval(statusInterval)
    ocrController.value = null

    if (result.canceled) {
      processingStatus.value = ''
      $q.notify({ type: 'info', message: 'OCR processing was cancelled' })
      return
    }

    if (result.success && result.nlpResponse) {
      extractedText.value = result.nlpResponse.extracted_text || ''
      ocrResults.value = result.summary
      hasExtractedText.value = true
      processingStatus.value = ''

      $q.notify({
        type: 'positive',
        message: `OCR completed! Extracted ${result.summary.totalCharacters} characters from ${result.summary.pagesSuccessful} pages.`,
        timeout: 5000,
      })
    } else {
      throw new Error(result.error || 'OCR processing failed')
    }
  } catch (err) {
    console.error('OCR error:', err)
    ocrController.value = null

    if (err.name === 'CanceledError' || err.message.includes('cancelled')) {
      $q.notify({ type: 'info', message: 'OCR processing was cancelled' })
    } else {
      $q.notify({
        type: 'negative',
        message: `OCR failed: ${err.message}`,
        timeout: 5000,
      })
    }
  } finally {
    processingStatus.value = ''
  }
}

function cancelOCR() {
  if (ocrController.value) {
    ocrController.value.abort()
    ocrController.value = null
    processingStatus.value = ''
    isProcessing.value = false
    $q.notify({ type: 'info', message: 'OCR processing cancelled' })
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
      // Store OCR results if available
      ...(ocrResults.value && { ocr_results: ocrResults.value }),
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

function clearSelection() {
  extractedText.value = ''
  fileName.value = ''
  hasExtractedText.value = false
  ocrResults.value = null
  selected.value = null
  selectedDoc.value = null
}
</script>
