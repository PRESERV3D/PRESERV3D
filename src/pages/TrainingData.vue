<template>
  <q-page class="q-pa-md column items-center">
    <div class="text-h5 q-mb-md">NER Training Data Inline Editor</div>
    <div v-if="parsedData" style="width: 100%; max-width: 800px">
      <!-- Entity Legend -->
      <div class="q-mb-md row items-center">
        <div v-for="(color, label) in entityColors" :key="label" class="q-mr-md row items-center">
          <div
            :style="{
              backgroundColor: color,
              width: '20px',
              height: '20px',
              marginRight: '5px',
              borderRadius: '3px',
            }"
          ></div>
          <div>{{ label }}</div>
        </div>
        <!-- Caret / Selection position display -->
        <q-input v-model="caretInfo" filled readonly label="Caret" class="q-mb-md" />
      </div>
    </div>

    <!-- Paste JSON -->
    <q-input
      v-model="jsonLine"
      filled
      type="textarea"
      autogrow
      label="Paste a JSON line"
      style="width: 100%; max-width: 800px; min-height: 100px"
      class="q-mb-md"
      @blur="parseJSON"
    />

    <div v-if="parsedData" style="width: 100%; max-width: 800px">
      <div class="q-mb-md">
        <div><strong>Text (click entities to edit inline):</strong></div>
        <div
          class="text-editor q-pa-sm"
          contenteditable="true"
          @input="updateFromEditor"
          @keyup="updateCaretAndSelection"
          @mouseup="updateCaretAndSelection"
          style="border: 1px solid #ccc; min-height: 150px; padding: 8px; border-radius: 4px"
          v-html="highlightedText"
        ></div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const jsonLine = ref('')
const parsedData = ref(null)
const caretInfo = ref('0')

// Assign colors per entity label
const entityColors = {
  TITLE: '#FFA07A',
  AUTHOR: '#FFB6C1',
  ORG: '#7FFFD4',
  DATE: '#FFD700',
  PLACE: '#90EE90',
}

// Parse JSON line
function parseJSON() {
  try {
    parsedData.value = JSON.parse(jsonLine.value)
  } catch {
    parsedData.value = null
    $q.notify({ type: 'negative', message: 'Invalid JSON line' })
  }
}

// Watch jsonLine for automatic parsing
watchEffect(() => {
  if (jsonLine.value.trim() === '') parsedData.value = null
  else {
    try {
      parsedData.value = JSON.parse(jsonLine.value)
    } catch {
      console.log('Invalid JSON')
    }
  }
})

// Highlight entities with colors per label
const highlightedText = computed(() => {
  if (!parsedData.value) return ''
  let text = parsedData.value.text
  const entities = [...parsedData.value.entities].sort((a, b) => b.start_offset - a.start_offset)
  entities.forEach((ent) => {
    const color = entityColors[ent.label] || '#87CEFA'
    const entityText = text.slice(ent.start_offset, ent.end_offset)
    const span = `<span contenteditable="true" style="background-color:${color};" data-idx="${parsedData.value.entities.indexOf(ent)}">${entityText}</span>`
    text = text.slice(0, ent.start_offset) + span + text.slice(ent.end_offset)
  })
  return text
})

// Update text and offsets from editor
function updateFromEditor(event) {
  const editor = event.target
  const spans = editor.querySelectorAll('span[data-idx]')
  let lastIndex = 0
  spans.forEach((span) => {
    const idx = Number(span.dataset.idx)
    const start = editor.innerText.indexOf(span.innerText, lastIndex)
    const end = start + span.innerText.length
    parsedData.value.entities[idx].start_offset = start
    parsedData.value.entities[idx].end_offset = end
    lastIndex = end
  })
  parsedData.value.text = editor.innerText
  updateCaretAndSelection()
}

// Compute caret / selection info
function updateCaretAndSelection() {
  const sel = window.getSelection()
  if (!sel || !sel.focusNode) {
    caretInfo.value = '0'
    return
  }
  const editor = document.querySelector('.text-editor')
  const range = sel.getRangeAt(0)
  const preRange = range.cloneRange()
  preRange.selectNodeContents(editor)
  preRange.setEnd(range.startContainer, range.startOffset)
  const start = preRange.toString().length
  const end = start + range.toString().length
  caretInfo.value = range.toString() ? `[${start}, ${end}]` : `${start}`
}
</script>

<style>
.text-editor span {
  padding: 0 2px;
  border-radius: 2px;
  cursor: text;
}
</style>
s
