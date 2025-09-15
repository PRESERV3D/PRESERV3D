<template>
  <q-page class="q-pa-md">
    <div class="q-mt-xs title">Appointments</div>
    <div class="q-mt-xs q-mb-lg subtitle">
      Information of scheduled appointments booked by users.
    </div>
    <div class="q-mt-md">
      <q-table
        class="my-sticky-header-table"
        flat
        bordered
        :rows="appointments"
        :columns="columns"
        row-key="appointment_id"
        :pagination="pagination"
      >
        <!-- Expandable row -->
        <template v-slot:body="props">
          <!-- Main row -->
          <q-tr :props="props">
            <q-td v-for="col in props.cols" :key="col.name" :props="props" align="center">
              <!-- Actions column for expand button -->
              <template v-if="col.name === 'actions'">
                <q-btn flat size="sm" icon="expand_more" @click="props.expand = !props.expand" />
              </template>
              <template v-else-if="col.name === 'status'">
                <template v-if="props.row.status === 'Pending'">
                  <q-btn
                    flat
                    dense
                    round
                    class="status-btn"
                    @click="openConfirmDialog(props.row, 'Approved')"
                  >
                    <q-icon name="check" color="green" size="18px" />
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    round
                    class="status-btn"
                    @click="openConfirmDialog(props.row, 'Rejected')"
                  >
                    <q-icon name="close" color="red" size="18px" />
                  </q-btn>
                </template>
                <template v-else>
                  <span
                    class="status-text"
                    :class="{
                      'text-green': props.row.status === 'Approved',
                      'text-red': props.row.status === 'Rejected',
                    }"
                  >
                    {{ props.row.status }}
                  </span>
                </template>
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
                <p><strong>User Type:</strong> {{ props.row.user_type }}</p>
                <p><strong>Email:</strong> {{ props.row.email }}</p>
                <p><strong>User Remarks:</strong> {{ props.row.user_remarks }}</p>
                <p><strong>Reviewed by:</strong> {{ props.row.reviewed_by }}</p>
                <p><strong>Reviewed at:</strong> {{ props.row.reviewed_at }}</p>
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
                        v-if="!props.row.adminRemarksSaved && props.row.admin_remarks.trim() !== ''"
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
            Are you sure you want to set this appointment as {{ confirmDialog.action }}?
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

// const pagination = {
//   page: 1,
//   rowsPerPage: 8,
// }

const columns = [
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'center',
    field: 'name',
  },
  {
    name: 'purpose',
    label: 'Purpose of Visit',
    align: 'center',
    field: 'purpose',
  },
  {
    name: 'appointmentDate',
    label: 'Date',
    align: 'center',
    field: 'appointmentDate',
  },
  {
    name: 'time',
    label: 'Time',
    align: 'center',
    field: 'time',
  },
  {
    name: 'status',
    label: 'Status',
    align: 'center',
    field: 'status',
  },
  {
    name: 'actions',
    align: 'center',
    field: (row) => row.appointment_id,
    sortable: false,
  },
]

const appointments = ref([])

onMounted(fetchAppointments)

const confirmDialog = ref({
  show: false,
  action: '',
  row: null,
})

function openConfirmDialog(row, action) {
  confirmDialog.value.show = true
  confirmDialog.value.action = action
  confirmDialog.value.row = row
}

async function confirmAction() {
  if (!confirmDialog.value.row) return

  const row = confirmDialog.value.row
  const action = confirmDialog.value.action
  const userStore = useUserStore()

  const adminName =
    `${userStore.profile?.first_name || ''} ${userStore.profile?.last_name || ''}`.trim()

  try {
    // Data to update
    const updateData = {
      status: action,
      reviewed_by: adminName,
      reviewed_at: new Date().toISOString(),
      admin_remarks: row.admin_remarks || '',
    }

    // Update appointment booking table
    const { data: updateResponse, error: updateError } = await supabase
      .from('appointment_booking')
      .update(updateData)
      .eq('appointment_id', row.appointment_id)
      .select('user_id, appointment_id, status')
      .single()

    if (updateError) {
      console.log('Update error:', updateError)
      throw updateError
    }

    console.log('Appointment updated: ', updateResponse)

    // Send notification to user about admin review
    const formatAction = action === 'Approved' ? 'approved' : 'rejected'
    const notifMessage = `Your appointment on ${row.appointmentDate} at ${row.time} has been ${formatAction}.`
    await userNotification(updateResponse.user_id, notifMessage)

    confirmDialog.value.show = false
    fetchAppointments()
  } catch (err) {
    console.error('Error updating status:', err)
  }
}

// Notify user of appointment booking review
async function userNotification(receiverId, notifMessage) {
  try {
    const { error: notifError } = await supabase.from('notifications').insert([
      {
        receiver_id: receiverId,
        message: notifMessage,
        type: 'appointment_status',
        receiver_role: 'user',
        read: false,
        created_at: new Date().toISOString(),
      },
    ])

    if (notifError) {
      console.error('Error sending notification to user:', notifError)
    } else {
      console.log('Notification sent to user:', receiverId)
    }
  } catch (err) {
    console.error('Error sending notification to user:', err)
  }
}

// Fetch appointments from DB
async function fetchAppointments() {
  const { data, error } = await supabase
    .from('appointment_booking')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching appointments:', error.message)
    return
  }

  appointments.value = data.map((a) => ({
    appointment_id: a.appointment_id,
    name: a.name,
    email: a.email,
    user_type: a.user_type,
    purpose: a.purpose,
    appointmentDate: a.date,
    time: formatTimeTo12Hour(a.time),
    status: a.status,
    user_remarks: a.user_remarks,
    admin_remarks: a.admin_remarks || '',
    reviewed_by: a.reviewed_by,
    reviewed_at: a.reviewed_at,
    adminRemarksSaved: !!a.admin_remarks,
  }))
}

async function saveRemarks(row) {
  try {
    const { error } = await supabase
      .from('appointment_booking')
      .update({ admin_remarks: row.admin_remarks })
      .eq('appointment_id', row.appointment_id)

    if (error) throw error

    console.log('Remarks saved successfully.')

    // Mark as saved so input becomes read-only
    row.adminRemarksSaved = true
  } catch (err) {
    console.error('Error saving remarks:', err)
  }
}

function formatTimeTo12Hour(timeString) {
  if (!timeString) return ''
  const [hour, minute] = timeString.split(':').map(Number)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const formattedHour = hour % 12 || 12 // 0 -> 12
  return `${formattedHour}:${minute.toString().padStart(2, '0')} ${ampm}`
}
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

.view-more-link {
  color: #880000;
  text-decoration: underline;
}
</style>
