<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Data Quality</h2>
      <div class="subtitle-btn-row">
        <h5 class="q-mt-xs q-mb-lg subtitle">
          Information about the accuracy and completeness of collected archival materials.
        </h5>
      </div>
    </div>

    <div class="q-mt-md">
      <div class="row items-center justify-between q-ml-sm q-mb-md">
        <!-- Filter buttons -->
        <div class="row q-gutter-md">
          <q-btn
            label="All"
            no-caps
            class="btn-1"
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          />
          <q-btn
            label="Artifacts"
            no-caps
            class="btn-1"
            :class="{ active: activeFilter === 'artifacts' }"
            @click="activeFilter = 'artifacts'"
          />
          <q-btn
            label="Documents"
            no-caps
            class="btn-1"
            :class="{ active: activeFilter === 'documents' }"
            @click="activeFilter = 'documents'"
          />
          <q-btn
            label="Open"
            no-caps
            class="btn-1"
            :class="{ active: activeFilter === 'open' }"
            @click="activeFilter = 'open'"
          />
          <q-btn
            label="Resolved"
            no-caps
            class="btn-1"
            :class="{ active: activeFilter === 'resolved' }"
            @click="activeFilter = 'resolved'"
          />
        </div>

        <!-- Rescan button -->
        <div v-if="!loading">
          <q-btn icon="refresh" no-caps class="btn-1 active q-mr-md" @click="manualRescan">
            <q-tooltip>Rescan all archives</q-tooltip>
          </q-btn>
        </div>
        <div v-else class="q-mr-md">
          <q-spinner color="primary" />
        </div>
      </div>

      <q-table
        class="my-sticky-header-table"
        flat
        bordered
        :rows="filteredInconsistencies"
        :columns="columns"
        row-key="id"
        :pagination="pagination"
      >
        <!-- Expandable row -->
        <template v-slot:body="props">
          <!-- Main row -->
          <q-tr :props="props">
            <q-td v-for="col in props.cols" :key="col.name" :props="props" align="center">
              <template v-if="col.name === 'title'">
                <span :class="{ 'resolved-issue': props.row.status === 'Resolved' }">
                  {{ truncateText(props.row.title, 50) }}
                  <q-tooltip v-if="props.row.title.length > 50">{{ props.row.title }}</q-tooltip>
                </span>
              </template>

              <!-- Issues column -->
              <template v-else-if="col.name === 'issues'">
                <span :class="{ 'resolved-issue': props.row.status === 'Resolved' }">
                  {{ props.row.issues.map((issue) => issue.field).join(', ') }}
                </span>
              </template>

              <!-- Resolution column -->
              <template v-else-if="col.name === 'resolution'">
                <div class="flex items-center justify-center gap-2">
                  <template v-if="props.row.status === 'Resolved' && !props.row.reviewed_at">
                    <q-icon name="priority_high" color="red" size="18px" />
                    <q-tooltip>Document Updated</q-tooltip>
                  </template>

                  <template v-if="!props.row.resolution">
                    <q-btn
                      flat
                      dense
                      round
                      class="status-btn"
                      @click="openConfirmDialog(props.row, 'Confirmed Issue')"
                    >
                      <q-icon name="warning" color="orange" size="18px" />
                      <q-tooltip>Mark as Confirmed Issue</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      dense
                      round
                      class="status-btn"
                      @click="openConfirmDialog(props.row, 'False Positive')"
                    >
                      <q-icon size="18px">
                        <img
                          src="icons/false-positive.png"
                          alt="False Positive"
                          style="width: 100%; height: 100%"
                        />
                        <q-tooltip>Mark as False Positive</q-tooltip>
                      </q-icon>
                    </q-btn>
                  </template>

                  <template v-else>
                    <span
                      class="status-text"
                      :class="{
                        'text-orange': props.row.resolution === 'Confirmed Issue',
                        'text-green': props.row.resolution === 'False Positive',
                      }"
                    >
                      {{ props.row.resolution }}
                    </span>
                  </template>
                </div>
              </template>

              <!-- Status column -->
              <template v-else-if="col.name === 'status'">
                <span
                  :class="{
                    'text-green': props.row.status === 'Resolved',
                    'text-red': props.row.status === 'Open',
                  }"
                >
                  {{ props.row.status }}
                </span>
              </template>

              <!-- Actions column -->
              <template v-else-if="col.name === 'actions'">
                <q-btn
                  flat
                  dense
                  round
                  color="primary"
                  icon="visibility"
                  @click="viewItem(props.row)"
                >
                  <q-tooltip>View Item</q-tooltip>
                </q-btn>

                <q-btn
                  v-if="props.row.status === 'Resolved'"
                  flat
                  dense
                  round
                  color="orange"
                  icon="undo"
                  @click="undoResolution(props.row)"
                >
                  <q-tooltip>Undo Resolution</q-tooltip>
                </q-btn>

                <!-- Delete button -->
                <q-btn
                  v-if="props.row.status === 'Resolved'"
                  flat
                  dense
                  round
                  color="negative"
                  icon="delete"
                  @click="openConfirmDialog(props.row, 'delete')"
                >
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>

                <q-btn flat size="sm" icon="expand_more" @click="props.expand = !props.expand" />
              </template>

              <template v-else>
                {{ props.row[col.field] }}
              </template>
            </q-td>
          </q-tr>

          <!-- Expanded row -->
          <q-tr v-show="props.expand">
            <q-td colspan="100%">
              <div class="q-pa-md bg-grey-2 rounded-borders">
                <p><strong>Title:</strong> {{ props.row.title }}</p>
                <p><strong>File:</strong> {{ props.row.file_name }}</p>
                <p><strong>Issues:</strong></p>
                <ul>
                  <li
                    v-for="(issue, i) in props.row.issues"
                    :key="i"
                    :class="{ 'resolved-issue': props.row.status === 'Resolved' }"
                  >
                    <strong>{{ issue.field }}: </strong>
                    <span>{{ issue.issue }}</span> <br />
                    <i>- {{ issue.suggestion }}</i>
                  </li>
                </ul>

                <p><strong>Reviewed by:</strong> {{ props.row.reviewed_by || 'Unassigned' }}</p>
                <p>
                  <strong>Reviewed at:</strong>
                  {{
                    props.row.reviewed_at
                      ? new Date(props.row.reviewed_at).toLocaleString()
                      : 'Not yet reviewed'
                  }}
                </p>

                <!-- Admin remarks input stays the same -->
                <div style="display: flex; align-items: flex-start; gap: 8px">
                  <p><strong>Admin Remarks:</strong></p>
                  <q-input
                    v-model="props.row.admin_remarks"
                    type="textarea"
                    dense
                    outlined
                    autogrow
                    placeholder="Enter admin remarks"
                    style="max-height: 120px; overflow-y: auto; flex: 1"
                    :readonly="props.row.adminRemarksSaved"
                  >
                    <template v-slot:append>
                      <q-btn
                        flat
                        dense
                        round
                        color="green"
                        icon="check"
                        v-if="!props.row.adminRemarksSaved && props.row.admin_remarks?.trim()"
                        @click="saveRemarks(props.row)"
                      />
                    </template>
                  </q-input>
                </div>
              </div>
            </q-td>
          </q-tr>
        </template>
      </q-table>

      <!-- Confirmation Dialog -->
      <q-dialog v-model="confirmDialog.show">
        <q-card class="conf-box">
          <q-card-section class="sub-font text-center" style="color: black">
            {{ dialogMessage }}
          </q-card-section>
          <q-card-actions align="center">
            <q-btn flat label="Yes" class="btn-save" @click="confirmAction" />
            <q-btn
              flat
              label="No"
              class="sub-font-2"
              style="color: #000000"
              v-close-popup
              no-caps
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from 'boot/supabase'
import { useUserStore } from 'stores/user'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { getNlpEndpoint } from 'src/utils/nlpConfig'

const $q = useQuasar()
const router = useRouter()
const props = defineProps({
  recordId: { type: String, required: false },
})

const activeFilter = ref('all')
const inconsistencies = ref([])
const pagination = ref({ rowsPerPage: 10 })
const loading = ref(false)

const columns = [
  { name: 'title', label: 'Title', field: 'title', align: 'left' },
  { name: 'issues', label: 'Issues', field: 'issues', align: 'left' },
  { name: 'resolution', label: 'Resolution', field: 'resolution', align: 'center' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

const userStore = useUserStore()
const user = `${userStore.profile?.first_name || ''} ${userStore.profile?.last_name || ''}`.trim()
const confirmDialog = ref({ show: false, action: '', row: null })
const dialogMessage = computed(() => {
  if (confirmDialog.value.action === 'delete') {
    return `Are you sure you want to delete "${confirmDialog.value.row.title}"? This action cannot be undone.`
  }
  return `Are you sure you want to mark this issue as "${confirmDialog.value.action}"?`
})

const filteredInconsistencies = computed(() => {
  if (activeFilter.value === 'all') {
    return inconsistencies.value
  }
  if (activeFilter.value === 'artifacts') {
    return inconsistencies.value.filter((i) => i.source_type === 'artifact')
  }
  if (activeFilter.value === 'documents') {
    return inconsistencies.value.filter((i) => i.source_type === 'document')
  }
  if (activeFilter.value === 'open') {
    return inconsistencies.value.filter((i) => i.status === 'Open')
  }
  if (activeFilter.value === 'resolved') {
    return inconsistencies.value.filter((i) => i.status === 'Resolved')
  }
  return inconsistencies.value
})

// Helper function to truncate text
const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Load inconsistencies from Supabase
const loadInconsistencies = async () => {
  let query = supabase.from('inconsistencies').select('*').order('created_at', { ascending: false })

  if (props.recordId) {
    query = query.eq('record_id', props.recordId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching inconsistencies:', error)
  } else {
    inconsistencies.value = sortInconsistencies(data)
  }
}

const sortInconsistencies = (data) => {
  return data.sort((a, b) => {
    const aPriority = getRowPriority(a)
    const bPriority = getRowPriority(b)
    return aPriority - bPriority
  })
}

const getRowPriority = (row) => {
  if (row.status === 'Resolved' && !row.reviewed_at) return 0
  if (row.status === 'Open') return 1
  if (row.status === 'Resolved' && row.reviewed_at) return 2
  return 3 // fallback
}

const openConfirmDialog = (row, action) => {
  confirmDialog.value = { show: true, action, row }
}

const confirmAction = async () => {
  const row = confirmDialog.value.row
  const action = confirmDialog.value.action

  if (action === 'delete') {
    await deleteInconsistency(row)
    confirmDialog.value.show = false
    return
  }

  const { error } = await supabase
    .from('inconsistencies')
    .update({
      resolution: action,
      status: 'Resolved',
      reviewed_by: user,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', row.id)

  if (error) {
    console.error('Error updating resolution:', error)
    $q.notify({ type: 'negative', message: 'Failed to update resolution' })
  } else {
    await loadInconsistencies()
    $q.notify({ type: 'positive', message: 'Resolution updated successfully' })
  }

  confirmDialog.value.show = false
  await loadInconsistencies()
}

// Save admin remarks
const saveRemarks = async (row) => {
  const { error } = await supabase
    .from('inconsistencies')
    .update({
      admin_remarks: row.admin_remarks,
      reviewed_by: user,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', row.id)

  if (error) {
    console.error('Error saving remarks:', error)
  } else {
    row.adminRemarksSaved = true
  }
}

const manualRescan = async () => {
  try {
    loading.value = true
    const response = await fetch(getNlpEndpoint('/rescan-metadata'), {
      method: 'POST',
    })

    const result = await response.json()
    if (result.success) {
      await loadInconsistencies()
    } else {
      console.log('Scan failed: ' + result.error)
      $q.notify({ type: 'negative', message: 'Scan failed: ' + result.error })
    }
  } catch (err) {
    console.error('Error during manual rescan:', err)
  } finally {
    loading.value = false
  }
}

const viewItem = (row) => {
  if (row.source_type === 'artifact') router.push(`/artifacts/${row.record_id}`)
  else if (row.source_type === 'document') router.push(`/documents/${row.record_id}`)
}

const undoResolution = async (row) => {
  const { error } = await supabase
    .from('inconsistencies')
    .update({
      resolution: null,
      status: 'Open',
      reviewed_by: null,
      reviewed_at: null,
    })
    .eq('id', row.id)

  if (error) {
    console.error('Error undoing resolution:', error)
    $q.notify({ type: 'negative', message: 'Failed to undo resolution' })
  } else {
    await loadInconsistencies()
    $q.notify({ type: 'positive', message: 'Resolution undone' })
  }
}

const deleteInconsistency = async (row) => {
  try {
    const { error } = await supabase.from('inconsistencies').delete().eq('id', row.id)

    if (error) throw error

    await loadInconsistencies()

    $q.notify({
      type: 'positive',
      message: 'Inconsistency deleted successfully',
    })
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Failed to delete inconsistency',
    })
  }
}

onMounted(() => {
  manualRescan()
  loadInconsistencies()
})
</script>

<style scoped>
.resolved-issue {
  color: gray;
  text-decoration: line-through;
}

/* Color bottom toolbars inside table */
::v-deep(.my-sticky-header-table .q-table__bottom) {
  font-size: 14px;
  background-color: #560505 !important;
  color: white;
}

/* Sticky header cells */
::v-deep(.my-sticky-header-table thead tr th) {
  padding: 1rem;
  font-size: 14px;
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: #560505 !important;
  color: white;
}

/* When loading (adjust top offset for loading animation if needed) */
::v-deep(.my-sticky-header-table.q-table--loading thead tr:last-child th) {
  top: 48px;
}

/* Prevent content hiding under sticky header on scroll/focus */
::v-deep(.my-sticky-header-table tbody) {
  scroll-margin-top: 48px;
}

::v-deep(.my-sticky-header-table .q-table__bottom .q-btn__content),
::v-deep(.my-sticky-header-table .q-table__bottom .q-select__dropdown-icon),
::v-deep(.my-sticky-header-table .q-table__bottom .q-field__native) {
  color: white !important;
}
</style>
