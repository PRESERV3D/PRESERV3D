<template>
  <q-dialog v-model="dialogVisible">
    <q-card class="q-pa-md meta-box">
      <q-card-section>
        <div class="sub-font-3" style="font-size: 20px; font-weight: 600">
          Review and Edit Metadata
        </div>
      </q-card-section>

      <q-card-section>
        <q-input outlined v-model="localMetadata.title" label="Title" />
        <q-input outlined v-model="localMetadata.author" label="Author(s)" class="meta-info" />
        <q-input outlined v-model="localMetadata.date" type="date" label="Date" class="q-mt-sm" />
        <q-input
          v-model="localMetadata.summary"
          type="textarea"
          label="Summary"
          outlined
          class="meta-summary q-mt-sm"
          placeholder="Enter summary here..."
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="cancel" />
        <q-btn flat label="Save" color="primary" :loading="saving" @click="confirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { supabase } from 'boot/supabase'

const props = defineProps({
  modelValue: Boolean,
  metadata: Object,
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const dialogVisible = ref(props.modelValue)
const saving = ref(false)

const localMetadata = reactive({
  file_name: '',
  file_url: '',
  title: '',
  author: '',
  date: '',
  summary: '',
  keywords: [],
  categories: [],
})

// Watch for incoming metadata prop
watch(
  () => props.metadata,
  (newVal) => {
    Object.assign(localMetadata, newVal || {})
  },
  { immediate: true },
)

watch(
  () => props.modelValue,
  (val) => {
    dialogVisible.value = val
  },
)
watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const cancel = () => {
  emit('cancel', { ...localMetadata }) // emit metadata info for deletion
  dialogVisible.value = false
}

const confirm = async () => {
  saving.value = true

  try {
    const { file_name, ...meta } = localMetadata
    const isPDF = file_name?.toLowerCase().endsWith('.pdf')
    const isGLB = file_name?.toLowerCase().endsWith('.glb')

    const table = isPDF ? 'documents_metadata' : isGLB ? 'artifacts_metadata' : null

    if (!file_name || !table) {
      alert('Missing file name or unsupported file type.')
      return
    }

    const { error } = await supabase
      .from(table)
      .update({
        metadata: {
          title: meta.title,
          author: meta.author,
          date: meta.date,
          summary: meta.summary,
          keywords: meta.keywords || [],
          categories: meta.categories || [],
        },
        updated_at: new Date().toISOString(),
      })
      .eq('file_name', file_name)

    if (error) {
      console.error('Supabase update error:', error)
      alert('Failed to save metadata.')
    } else {
      emit('confirm', { ...localMetadata })
      dialogVisible.value = false
    }
  } catch (err) {
    console.error(err)
    alert('Unexpected error while saving metadata.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.meta-box {
  width: 60rem !important;
  font-family: Poppins, sans-serif;
  border-radius: 10px !important;
  background-color: #fbf4d0;
}

.meta-info {
  margin-top: 0.5rem;
}

.meta-summary ::v-deep(textarea) {
  resize: none !important;
}
</style>
