<template>
  <q-page class="q-pa-md">
    <div class="q-mt-xs title">Data Quality</div>
    <div class="q-mt-md">
      <div class="q-mt-md flex justify-end">
        <q-btn dense flat round color="primary" icon="refresh" @click="manualRescan">
          <q-tooltip>Rescan all uploaded documents</q-tooltip>
        </q-btn>
      </div>

      <q-table
        class="my-sticky-header-table"
        flat
        bordered
        :rows="inconsistencies"
        :columns="columns"
        row-key="id"
        :pagination="pagination"
      >
        <!-- Expandable row -->
        <template v-slot:body="props">
          <!-- Main row -->
          <q-tr :props="props">
            <q-td v-for="col in props.cols" :key="col.name" :props="props" align="center">
              <template v-if="col.name === 'issues'">
                <span>
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
                      <q-icon name="check" color="green" size="18px" />
                      <q-tooltip>Mark as False Positive</q-tooltip>
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
                  @click="viewDocument(props.row)"
                >
                  <q-tooltip>View Document</q-tooltip>
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
                  <li v-for="(issue, i) in props.row.issues" :key="i">
                    <strong>{{ issue.field }}:</strong> {{ issue.issue }} <br />
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
          <q-card-section class="sub-font" style="color: black">
            Are you sure you want to mark this issue as "{{ confirmDialog.action }}"?
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
import { ref, onMounted } from 'vue'
import { supabase } from 'boot/supabase'
import { useUserStore } from 'stores/user'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const router = useRouter()
const props = defineProps({
  documentId: { type: String, required: false },
})

const inconsistencies = ref([])
const pagination = ref({ rowsPerPage: 10 })

const columns = [
  { name: 'title', label: 'Title', field: 'title', align: 'center' },
  { name: 'issues', label: 'Issues', field: 'issues', align: 'center' },
  { name: 'resolution', label: 'Resolution', field: 'resolution', align: 'center' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

const userStore = useUserStore()
const confirmDialog = ref({ show: false, action: '', row: null })
const user = `${userStore.profile?.first_name || ''} ${userStore.profile?.last_name || ''}`.trim()

// Load inconsistencies from Supabase
const loadInconsistencies = async () => {
  let query = supabase.from('inconsistencies').select('*').order('created_at', { ascending: false })

  if (props.documentId) {
    query = query.eq('document_id', props.documentId)
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
  } else {
    row.resolution = action
    row.reviewed_by = user
    row.reviewed_at = new Date().toISOString()
    inconsistencies.value = sortInconsistencies(inconsistencies.value)
  }

  confirmDialog.value.show = false
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
    const response = await fetch('http://localhost:8000/rescan-documents', {
      method: 'POST',
    })

    const result = await response.json()
    if (result.success) {
      $q.notify({ type: 'positive', message: 'Rescan Successful!' })
      await loadInconsistencies()
    } else {
      console.log('Rescan failed: ' + result.error)
      $q.notify({ type: 'negative', message: 'Rescan failed: ' + result.error })
    }
  } catch (err) {
    console.error('Error during manual rescan:', err)
  }
}

const viewDocument = (row) => {
  router.push(`/documents/${row.document_id}`)
}

onMounted(() => {
  loadInconsistencies()
})
</script>

<style scoped>
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
