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
import { supabase } from 'boot/supabase'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { getNlpEndpoint } from 'src/utils/nlpConfig'

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
  const bucket = folder
  try {
    const alreadyExists = await fileExists(fileName)
    let nlpMetadata = {}

    if (alreadyExists) {
      alert(`A file named "${fileName}" already exists. Please rename or choose another file.`)
      return
    }

    // NLP processing for PDFs
    if (isPdf) {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(getNlpEndpoint('/process-text'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      nlpMetadata = response.data
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.from(bucket).upload(`${fileName}`, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: isPdf ? 'application/pdf' : 'model/gltf-binary',
    })

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(`${fileName}`)
    const fileUrl = urlData.publicUrl

    if (uploadError) {
      console.error('Upload error:', uploadError)
      alert('Upload failed.')
      return
    }

    // Save metadata
    const supabaseTable = isPdf ? 'documents_metadata' : 'artifacts_metadata'

    const insertData = {
      file_name: fileName,
      file_url: fileUrl,
      uploaded_at: new Date(),
      updated_at: new Date(),
      ...(isPdf && { metadata: nlpMetadata }),
    }

    const { error: dbError } = await supabase.from(supabaseTable).insert([insertData])
    if (dbError) {
      console.error('Supabase insert error:', dbError)
      alert('Upload succeeded but metadata failed to save.')
      return
    }

    // Open metadata confirmation dialog
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

  if (!data || data.length === 0) return false

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
