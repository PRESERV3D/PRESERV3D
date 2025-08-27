<template>
  <q-page class="q-pa-md">
    <div class="q-mt-xs title">Appointments</div>
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
        <!-- Approval Status -->
        <template v-slot:body-cell-approvalStatus="props">
          <q-td :props="props" align="center">
            <!-- If pending -->
            <template v-if="props.row.approvalStatus === 'Pending'">
              <q-btn
                flat
                dense
                round
                class="status-btn"
                @click="openConfirmDialog(props.row, 'Approved', 'approvalStatus')"
              >
                <q-icon name="check" color="green" size="18px" />
              </q-btn>
              <q-btn
                flat
                dense
                round
                class="status-btn"
                @click="openConfirmDialog(props.row, 'Rejected', 'approvalStatus')"
              >
                <q-icon name="close" color="red" size="18px" />
              </q-btn>
            </template>

            <!-- If decided -->
            <template v-else>
              <span
                class="status-text"
                :class="{
                  'text-green': props.row.approvalStatus === 'Approved',
                  'text-red': props.row.approvalStatus === 'Rejected',
                }"
              >
                {{ props.row.approvalStatus }}
              </span>
            </template>
          </q-td>
        </template>

        <!-- Actions -->
        <template v-slot:body-cell-actions>
          <q-td align="center">
            <router-link to="/admin/appointments/details" class="view-more-link">
              View More
            </router-link>
          </q-td>
        </template>
      </q-table>

      <!-- Confirmation Dialog -->
      <q-dialog v-model="confirmDialog.show">
        <q-card class="conf-box">
          <q-card-section class="sub-font" style="color: black">
            Are you sure you want to set this appoinment as {{ confirmDialog.action }}?
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

const pagination = {
  page: 1,
  rowsPerPage: 8,
}

const columns = [
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'center',
    field: 'name',
  },
  {
    name: 'userType',
    label: 'User Type',
    align: 'center',
    field: 'userType',
  },
  {
    name: 'purpose',
    label: 'Purpose of Visit',
    align: 'center',
    field: 'purpose',
  },
  {
    name: 'appointmentDate',
    label: 'Appointment Date',
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
    name: 'approvalStatus',
    label: 'Approval Status',
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
    }

    // Update registration_visitors status
    const updateResponse = await supabase
      .from('appointment_booking')
      .update(updateData)
      .eq('appointment_id', row.appointment_id)
      .select('*')

    console.log('Update response data:', updateResponse.data)
    console.log('Update response error:', updateResponse.error)

    if (updateResponse.error) {
      throw updateResponse.error
    }

    confirmDialog.value.show = false

    fetchAppointments()
  } catch (err) {
    console.error('Error updating status:', err)
  }
}

// Fetch appointments from DB
async function fetchAppointments() {
  const { data, error } = await supabase.from('appointment_booking').select('*')

  if (error) {
    console.error('Error fetching appointments:', error.message)
    return
  }

  appointments.value = data.map((a) => ({
    appointment_id: a.appointment_id,
    name: a.name,
    userType: a.user_type,
    purpose: a.purpose,
    appointmentDate: a.date,
    time: a.time,
    approvalStatus: a.status,
  }))
}
</script>

<style scoped>
.my-sticky-header-table {
  border-radius: 10px !important;
  font-family: 'Poppins', sans-serif;
  height: auto; /* Ensure scrollable height */
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

.view-more-link {
  color: #880000;
  text-decoration: underline;
}
</style>
