<template>
  <q-uploader
    ref="uploaderRef"
    url="http://localhost:3000/upload"
    label="Upload GLB Model"
    accept=".glb"
    field-name="file"
    @uploaded="handleUploaded"
  />
</template>

<script setup>
import { ref } from 'vue'

const uploaderRef = ref(null)

function handleUploaded(info) {
  console.log('Upload completed:', info.xhr.response)
  const response = JSON.parse(info.xhr.response)
  alert(`Model uploaded! URL: ${response.url}`)
}
</script>
