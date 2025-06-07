<template>
  <q-dialog v-model="dialogVisible">
    <q-card class="q-pa-md" style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Review and Edit Metadata</div>
      </q-card-section>

      <q-card-section>
        <q-input filled v-model="localMetadata.title" label="Title" />
        <q-input filled v-model="localMetadata.author" label="Author(s)" class="q-mt-sm" />
        <q-input filled v-model="localMetadata.date" label="Date" class="q-mt-sm" />
        <q-editor v-model="localMetadata.summary" label="Summary" height="150px" class="q-mt-sm" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="grey" @click="cancel" />
        <q-btn flat label="Save" color="primary" @click="confirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { defineProps, defineEmits, ref, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  metadata: Object,
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const dialogVisible = ref(props.modelValue)

// Clone prop into local editable object
const localMetadata = reactive({
  title: '',
  author: '',
  date: '',
  summary: '',
})

// Keep local metadata in sync when dialog opens or prop changes
watch(
  () => props.metadata,
  (newVal) => {
    Object.assign(localMetadata, newVal || {})
  },
  { immediate: true },
)

// Sync v-model for dialog
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
  dialogVisible.value = false
}

const confirm = () => {
  emit('confirm', { ...localMetadata })
  dialogVisible.value = false
}
</script>
