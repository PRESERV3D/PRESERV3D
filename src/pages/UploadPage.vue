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
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const uploaderRef = ref(null)

function handleUploaded(info) {
  const response = JSON.parse(info.xhr.response)
  console.log('File URL:', response.url)
  console.log('Summary:', response.metadata.summary)
  console.log('Metadata:', response.metadata)
  console.log('Tags:', response.metadata.tags)
  console.log('Categories:', response.metadata.categories)
}
</script>
