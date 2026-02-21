<template>
  <q-dialog v-model="dialogVisible">
    <q-card class="q-pa-md meta-box">
      <q-card-section>
        <div class="sub-font-3" style="font-size: 20px; font-weight: 600">
          Review and Edit Metadata
        </div>
      </q-card-section>

      <q-card-section>
        <q-input
          outlined
          v-model="localMetadata.title"
          label="Title"
          lazy-rules
          :rules="[(val) => !!val || 'Please enter a title.']"
        />
        <q-input outlined v-model="localMetadata.author" label="Author(s)" class="meta-info" />

        <q-input
          outlined
          v-model="localMetadata.date"
          label="Date"
          class="q-mt-sm"
          @blur="normalizeDate"
        />

        <q-input
          v-model="localMetadata.summary"
          type="textarea"
          label="Summary"
          outlined
          class="meta-summary q-mt-sm"
          placeholder="Enter summary here..."
        />

        <!-- Categories Section -->
        <div class="q-mt-md">
          <div class="sub-font-3" style="font-size: 16px; margin-bottom: 0.5rem">Tags:</div>
          <div class="tags">
            <template v-if="localMetadata.categories?.length">
              <q-chip
                v-for="(category, i) in localMetadata.categories"
                :key="i"
                color="red-8"
                text-color="white"
                removable
                @remove="removeCategory(i)"
                class="tag-chip"
              >
                {{ category }}
              </q-chip>
            </template>
            <template v-else>
              <q-chip color="grey-7" text-color="white">Uncategorized</q-chip>
            </template>

            <q-btn
              dense
              round
              flat
              color="primary"
              icon="add"
              @click="promptAddCategory"
              class="add-btn"
            />
          </div>

          <div v-if="addingCategory" class="q-mt-sm">
            <q-input
              dense
              outlined
              v-model="newCategory"
              label="New Tag"
              @keyup.enter="addCategory"
              @blur="cancelAddCategory"
            >
              <template #append>
                <q-btn flat icon="check" color="positive" @click="addCategory" />
              </template>
            </q-input>
          </div>
        </div>
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

const addingCategory = ref(false)
const newCategory = ref('')

// Month map for conversions
const monthMap = {
  january: '01',
  jan: '01',
  february: '02',
  feb: '02',
  march: '03',
  mar: '03',
  april: '04',
  apr: '04',
  may: '05',
  june: '06',
  jun: '06',
  july: '07',
  jul: '07',
  august: '08',
  aug: '08',
  september: '09',
  sept: '09',
  sep: '09',
  october: '10',
  oct: '10',
  november: '11',
  nov: '11',
  december: '12',
  dec: '12',
}

const localMetadata = reactive({
  file_name: '',
  file_url: '',
  title: '',
  author: '',
  date: '',
  summary: '',
  keywords: [],
  categories: [],
  extracted_text: '',
})

watch(
  () => props.metadata,
  (newVal) => {
    if (!newVal) return
    Object.assign(localMetadata, newVal)

    localMetadata.categories = Array.isArray(newVal.categories)
      ? [...newVal.categories]
      : newVal.categories
        ? [newVal.categories]
        : []

    localMetadata.keywords = Array.isArray(newVal.keywords)
      ? [...newVal.keywords]
      : newVal.keywords
        ? [newVal.keywords]
        : []
  },
  { immediate: true },
)

watch(
  () => props.modelValue,
  (val) => (dialogVisible.value = val),
)
watch(dialogVisible, (val) => emit('update:modelValue', val))

function removeCategory(index) {
  localMetadata.categories.splice(index, 1)
}

function promptAddCategory() {
  addingCategory.value = true
  newCategory.value = ''
}

function cancelAddCategory() {
  addingCategory.value = false
  newCategory.value = ''
}

function addCategory() {
  const value = newCategory.value.trim()
  if (value && !localMetadata.categories.includes(value)) {
    localMetadata.categories.push(value)
  }
  cancelAddCategory()
}

// Normalize/convert month names to numbers on blur
function normalizeDate() {
  let input = localMetadata.date.trim()
  if (!input) return

  const lower = input.toLowerCase()

  // Pure year (e.g., "2024")
  if (/^\d{4}$/.test(lower)) {
    localMetadata.date = lower
    return
  }

  // Month + Year (e.g., "March 2024", "Sept 1998")
  const monthYearMatch = lower.match(/([a-z]+)\s+(\d{4})/)
  if (monthYearMatch) {
    const month = monthMap[monthYearMatch[1]]
    if (month) {
      localMetadata.date = `${monthYearMatch[2]}-${month}`
      return
    }
  }

  // Month only (e.g., "March", "Sep")
  const singleMonth = Object.keys(monthMap).find((m) => lower === m)
  if (singleMonth) {
    localMetadata.date = monthMap[singleMonth]
    return
  }

  // Already in YYYY-MM-DD or similar → leave as is
}

const cancel = () => {
  emit('cancel', { ...localMetadata })
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

    const keywords = Array.isArray(meta.keywords)
      ? meta.keywords
      : meta.keywords
        ? [meta.keywords]
        : []
    const categories = Array.isArray(meta.categories)
      ? meta.categories
      : meta.categories
        ? [meta.categories]
        : ['Document']

    const { error } = await supabase
      .from(table)
      .update({
        metadata: {
          title: meta.title || '',
          author: meta.author || '',
          date: meta.date || '',
          summary: meta.summary || '',
          keywords,
          categories,
          extracted_text: meta.extracted_text || '',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('file_name', file_name)
      .select()

    if (error) {
      console.error('Supabase update error:', error)
      alert(`Failed to save metadata: ${error.message}`)
    } else {
      emit('confirm', { ...localMetadata })
      dialogVisible.value = false
    }
  } catch (err) {
    console.error('Unexpected error while saving metadata:', err)
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

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
  align-items: center;
}

.tag-chip {
  font-size: 12px;
  font-weight: 500;
}

.add-btn {
  border: 1px dashed #ccc;
  min-width: 32px;
  min-height: 32px;
}
</style>
