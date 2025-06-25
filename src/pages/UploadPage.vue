<template>
  <q-page class="q-pa-md column items-center justify-center">
    <q-file filled v-model="selectedFile" label="Select .glb or .pdf file" accept=".pdf, .glb" />

    <q-btn
      label="Upload"
      color="primary"
      class="q-mt-md"
      :disable="!selectedFile"
      @click="handleUpload"
    />

    <q-spinner v-if="loading" class="q-mt-md" color="primary" size="2em" />

    <ConfirmMetadata
      v-model="dialog"
      :metadata="metadata"
      @confirm="saveMetadata"
      @cancel="handleCancelMetadata"
    />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import ConfirmMetadata from 'src/components/ConfirmMetadata.vue'
import { r2, r2Bucket, r2PublicUrl } from 'boot/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { supabase } from 'boot/supabase'
import axios from 'axios'
import { useRouter } from 'vue-router'

const selectedFile = ref(null)
const dialog = ref(false)
const loading = ref(false)
const router = useRouter()

const metadata = ref({
  file_name: '',
  file_url: '',
  title: '',
  author: '',
  date: '',
  summary: '',
  keywords: [],
  categories: [],
})

const DOCUMENTS_PUBLIC_URL = `${r2PublicUrl}/documents/`
const ARTIFACTS_PUBLIC_URL = `${r2PublicUrl}/artifacts/`

const handleUpload = async () => {
  const file = selectedFile.value
  const fileName = file.name
  if (!file || (!fileName.endsWith('.pdf') && !fileName.endsWith('.glb'))) {
    alert('Only .pdf and .glb files are allowed.')
    return
  }

  loading.value = true
  const isPdf = fileName.endsWith('.pdf')
  const folder = isPdf ? 'documents' : 'artifacts'
  const publicUrl = isPdf ? DOCUMENTS_PUBLIC_URL : ARTIFACTS_PUBLIC_URL
  const contentType = isPdf ? 'application/pdf' : 'model/gltf-binary'

  try {
    const alreadyExists = await fileExists(fileName)
    let nlpMetadata = {}

    if (alreadyExists) {
      alert(`A file named "${fileName}" already exists. Please rename or choose another file.`)
      return
    }

    // If PDF, send to FastAPI for NLP
    if (isPdf) {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('http://localhost:8000/process-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      nlpMetadata = response.data
    }

    const buffer = await file.arrayBuffer()
    const key = `${folder}/${fileName}`

    const putCommand = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentDisposition: isPdf ? 'inline' : undefined,
    })

    await r2.send(putCommand)

    const fileUrl = `${publicUrl}${fileName}`
    const supabaseTable = isPdf ? 'documents_metadata' : 'artifacts_metadata'

    const insertData = {
      file_name: fileName,
      file_url: fileUrl,
      uploaded_at: new Date(),
      updated_at: new Date(),
      ...(isPdf && { metadata: nlpMetadata }),
    }

    const { error } = await supabase.from(supabaseTable).insert([insertData])
    if (error) {
      console.error('Supabase insert error:', error)
      alert('Upload succeeded but metadata failed to save.')
      return
    }

    // Populate metadata for editing
    metadata.value = {
      file_name: fileName,
      file_url: fileUrl,
      title: nlpMetadata.title || '',
      author: nlpMetadata.author || '',
      date: nlpMetadata.date || '',
      summary: nlpMetadata.summary || '',
      keywords: nlpMetadata.keywords || [],
      categories: nlpMetadata.categories || [],
    }

    dialog.value = true
  } catch (err) {
    console.error('Upload failed:', err)
    alert('Upload failed. See console for details.')
  } finally {
    loading.value = false
  }
}

async function fileExists(fileName) {
  const isPDF = fileName.toLowerCase().endsWith('.pdf')
  const isGLB = fileName.toLowerCase().endsWith('.glb')
  const table = isPDF ? 'documents_metadata' : isGLB ? 'artifacts_metadata' : null

  if (!table) return false

  const { data, error } = await supabase.from(table).select('file_name').eq('file_name', fileName)
  if (data.length === 0) return false

  if (error) {
    console.error('Error checking file existence:', error)
    return false
  }

  return !!data
}

async function saveMetadata(updatedMetadata) {
  const isPdf = metadata.value.file_name.endsWith('.pdf')
  const table = isPdf ? 'documents_metadata' : 'artifacts_metadata'

  try {
    const { error } = await supabase
      .from(table)
      .update({
        metadata: {
          title: updatedMetadata.title,
          author: updatedMetadata.author,
          date: updatedMetadata.date,
          summary: updatedMetadata.summary,
          keywords: updatedMetadata.keywords,
          categories: updatedMetadata.categories,
        },
        updated_at: new Date(),
      })
      .eq('file_name', metadata.value.file_name)

    if (error) {
      console.error('Failed to update metadata:', error)
      alert('Failed to update metadata.')
    } else {
      alert('Metadata saved successfully!')
      dialog.value = false
      router.push({ name: 'dashboard' })
    }
  } catch (err) {
    console.error('Error saving metadata:', err)
    alert('Unexpected error occurred.')
  }
}

async function handleCancelMetadata(cancelledData) {
  try {
    const fileName = cancelledData.file_name
    const isPDF = fileName.toLowerCase().endsWith('.pdf')
    const isGLB = fileName.toLowerCase().endsWith('.glb')

    const table = isPDF ? 'documents_metadata' : isGLB ? 'artifacts_metadata' : null

    if (!table || !fileName) return

    const { error } = await supabase.from(table).delete().eq('file_name', fileName)

    if (error) {
      console.error('Error deleting cancelled metadata:', error)
    } else {
      console.log('Cancelled metadata removed successfully.')
    }
  } catch (err) {
    console.error('Failed to cancel and delete metadata:', err)
  } finally {
    dialog.value = false
  }
}
</script>
