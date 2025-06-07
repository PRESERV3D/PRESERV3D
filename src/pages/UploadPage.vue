<template>
  <q-page class="flex flex-center q-pa-md">
    <q-uploader
      ref="uploaderRef"
      url="http://localhost:3000/upload"
      label="Upload GLB Model or PDF"
      accept=".glb, .pdf"
      field-name="file"
      @uploaded="handleUploaded"
    />

    <ConfirmMetadata
      v-model="dialog"
      :metadata="metadata"
      @confirm="saveMetadata"
      @cancel="dialog = false"
    />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import ConfirmMetadata from 'src/components/ConfirmMetadata.vue'

const uploaderRef = ref(null)
const dialog = ref(false)

const metadata = ref({
  file_name: '', // add file_name for identifying record
  file_url: '', // add file_url to send on update
  title: '',
  author: '',
  date: '',
  summary: '',
  keywords: [],
  categories: [],
})

function handleUploaded(info) {
  const response = JSON.parse(info.xhr.response)

  // Populate metadata for editing
  metadata.value = {
    file_name: response.metadata.file_name || '',
    file_url: response.url || '',
    title: response.metadata.title || '',
    author: response.metadata.author || '',
    date: response.metadata.date || '',
    summary: response.metadata.summary || response.summary || '',
    keywords: response.metadata.keywords || [],
    categories: response.metadata.categories || [],
  }

  // Show confirmation dialog
  dialog.value = true
}

async function saveMetadata(updatedMetadata) {
  try {
    console.log('Saving metadata:', updatedMetadata)
    const res = await fetch('http://localhost:3000/save-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_name: metadata.value.file_name,
        file_url: metadata.value.file_url,
        metadata: {
          title: updatedMetadata.title,
          author: updatedMetadata.author,
          date: updatedMetadata.date,
          summary: updatedMetadata.summary,
          keywords: updatedMetadata.keywords,
          categories: updatedMetadata.categories,
        },
      }),
    })

    if (!res.ok) {
      throw new Error(`Error saving metadata: ${res.statusText}`)
    }

    alert('Metadata saved successfully!')
    dialog.value = false
  } catch (error) {
    console.error(error)
    alert('Failed to save metadata. Please try again.')
  }
}
</script>
