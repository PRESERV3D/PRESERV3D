<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Appointments</h2>
      <div class="subtitle-btn-row">
        <h5 class="q-mt-xs q-mb-lg subtitle">
          Information of scheduled appointments booked by users.
        </h5>
      </div>
    </div>

    <div class="tabs-container">
      <q-tabs
        v-model="activeTab"
        class="appointment-tabs"
        indicator-color="primary"
        active-color="primary"
        align="left"
      >
        <q-tab name="information" label="Information" class="tab-item" />
        <q-tab name="calendar" label="Calendar" class="tab-item" />
      </q-tabs>
    </div>

    <!-- Information Tab - Table View -->
    <div class="q-mt-md" v-if="activeTab === 'information'">
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
    </div>

    <!-- Calendar Tab -->
    <div class="calendar-container" v-if="activeTab === 'calendar'">
      <div class="calendar-layout">
        <!-- Left Side - Selected Date & Appointments -->
        <div class="appointments-sidebar">
          <div class="selected-date-header">
            <div class="date-display">
              <div class="day-number">{{ selectedDay }}</div>
              <div class="day-name">{{ selectedDayName }}</div>
            </div>
          </div>

          <div class="appointments-list">
            <div class="appointments-header">
              <h6>CURRENT EVENT</h6>
            </div>

            <div v-if="filteredAppointments.length === 0" class="no-appointments">
              <q-icon name="event_busy" size="3rem" color="grey-5" />
              <p>No appointments for this day</p>
            </div>

            <div v-else class="appointment-items">
              <div
                v-for="apt in filteredAppointments"
                :key="apt.appointment_id"
                class="appointment-item"
              >
                <div class="appointment-time">
                  {{ apt.time }}
                </div>
                <div class="appointment-details">
                  <div class="appointment-name">{{ apt.name }}</div>
                  <div class="appointment-actions">
                    <q-badge
                      :color="getStatusColor(apt.status)"
                      :label="apt.status"
                      class="appointment-badge"
                    />
                    <div v-if="apt.status === 'Pending'" class="action-buttons-calendar">
                      <q-btn
                        flat
                        dense
                        round
                        icon="check"
                        color="green"
                        size="sm"
                        @click="openConfirmDialog(apt, 'Approved')"
                      >
                        <q-tooltip>Approve</q-tooltip>
                      </q-btn>
                      <q-btn
                        flat
                        dense
                        round
                        icon="close"
                        color="red"
                        size="sm"
                        @click="openConfirmDialog(apt, 'Rejected')"
                      >
                        <q-tooltip>Reject</q-tooltip>
                      </q-btn>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side - Calendar -->
        <div class="calendar-view">
          <div class="calendar-header">
            <q-btn flat dense round icon="chevron_left" @click="previousMonth" class="nav-btn" />
            <div class="calendar-title">{{ currentMonthYear }}</div>
            <div class="year-display">{{ currentYear }}</div>
            <q-btn flat dense round icon="chevron_right" @click="nextMonth" class="nav-btn" />
          </div>

          <div class="calendar-grid">
            <div class="calendar-weekdays">
              <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
            </div>

            <div class="calendar-days">
              <div
                v-for="day in calendarDays"
                :key="day.date"
                class="calendar-day"
                :class="{
                  'other-month': day.isOtherMonth,
                  selected: day.isSelected,
                  today: day.isToday,
                  'has-appointments': day.appointmentCount > 0,
                }"
                @click="selectDate(day)"
              >
                <span class="day-number">{{ day.day }}</span>
                <div v-if="day.appointmentCount > 0" class="appointment-counts">
                  <span v-if="day.approvedCount > 0" class="appointment-count approved">
                    {{ day.approvedCount }}
                  </span>
                  <span v-if="day.pendingCount > 0" class="appointment-count pending">
                    {{ day.pendingCount }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <q-dialog v-model="confirmDialog.show" persistent>
      <q-card class="conf-box">
        <q-card-section class="sub-font" style="color: black">
          Are you sure you want to set this appointment as {{ confirmDialog.action }}?
        </q-card-section>
        <q-card-actions align="center">
          <q-btn flat label="Yes" class="btn-save" @click="confirmAction" />
          <q-btn flat label="No" class="sub-font-2" style="color: #000000" v-close-popup no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'boot/supabase'
import { useUserStore } from 'stores/user'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns'

const activeTab = ref('information')
const appointments = ref([])
const currentDate = ref(new Date())
const selectedDate = ref(new Date())

const $q = useQuasar()

const pagination = {
  page: 1,
  rowsPerPage: 7,
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

const confirmDialog = ref({
  show: false,
  action: '',
  row: null,
})

const weekDays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

const currentMonthYear = computed(() => {
  return format(currentDate.value, 'MMMM').toUpperCase()
})

const currentYear = computed(() => {
  return format(currentDate.value, 'yyyy')
})

const selectedDay = computed(() => {
  return format(selectedDate.value, 'd')
})

const selectedDayName = computed(() => {
  return format(selectedDate.value, 'EEEE').toUpperCase()
})

const filteredAppointments = computed(() => {
  return appointments.value
    .filter((apt) => {
      return (
        apt.appointmentDate === format(selectedDate.value, 'yyyy-MM-dd') &&
        apt.status !== 'Rejected'
      )
    })
    .sort((a, b) => {
      return a.time.localeCompare(b.time)
    })
})

const calendarDays = computed(() => {
  const start = startOfMonth(currentDate.value)
  const end = endOfMonth(currentDate.value)

  const startDate = startOfWeek(start)
  const endDate = endOfWeek(end)

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  return days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayAppointments = appointments.value.filter(
      (apt) => apt.appointmentDate === dateStr && apt.status !== 'Rejected',
    )

    const pendingCount = dayAppointments.filter((apt) => apt.status === 'Pending').length
    const approvedCount = dayAppointments.filter((apt) => apt.status === 'Approved').length
    const appointmentCount = dayAppointments.length

    return {
      date: dateStr,
      day: format(day, 'd'),
      isOtherMonth: day.getMonth() !== currentDate.value.getMonth(),
      isSelected: isSameDay(day, selectedDate.value),
      isToday: isToday(day),
      appointmentCount,
      pendingCount,
      approvedCount,
    }
  })
})

onMounted(fetchAppointments)

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
    // Check if there's already an approved appointment at this date and time
    if (action === 'Approved') {
      const { data: existingAppt, error: checkError } = await supabase
        .from('appointment_booking')
        .select('appointment_id, status')
        .eq('date', row.date)
        .eq('time', row.rawTime)
        .eq('status', 'Approved')
        .neq('appointment_id', row.appointment_id)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing appointments:', checkError)
        $q.dialog({
          title: 'Validation Error',
          message: 'Failed to verify time slot availability. Please try again.',
          color: 'negative',
        })
        confirmDialog.value.show = false
        return
      }

      if (existingAppt) {
        $q.dialog({
          title: 'Time Slot Already Booked',
          message:
            'This time slot already has an approved appointment. Please reject this booking or ask the user to choose a different time.',
          color: 'warning',
        })
        confirmDialog.value.show = false
        return
      }
    }

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
      console.error('Update error:', updateError)
      throw updateError
    }

    console.log('Appointment updated:', updateResponse)

    // Send notification to user about admin review
    const formatAction = action === 'Approved' ? 'approved' : 'rejected'
    const notifMessage = `Your appointment on ${row.appointmentDate} at ${row.time} has been ${formatAction}.`
    await userNotification(updateResponse.user_id, notifMessage)

    // Close dialog first
    confirmDialog.value.show = false

    // Refresh appointments data
    await fetchAppointments()
  } catch (err) {
    console.error('Error updating appointment status:', err)
    // Close dialog even on error
    confirmDialog.value.show = false
  }
}

// Notify user of appointment booking review
async function userNotification(receiverId, notifMessage) {
  try {
    if (!receiverId) {
      console.error('Cannot send notification: receiverId is missing')
      return
    }

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
    console.error('Unexpected error sending notification to user:', err)
  }
}

// Fetch appointments
async function fetchAppointments() {
  try {
    const { data, error } = await supabase
      .from('appointment_booking')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching appointments:', error.message)
      appointments.value = []
      return
    }

    if (!data || data.length === 0) {
      appointments.value = []
      return
    }

    appointments.value = data.map((a) => ({
      appointment_id: a.appointment_id,
      name: a.name,
      email: a.email,
      user_type: a.user_type,
      purpose: a.purpose,
      appointmentDate: a.date,
      date: a.date,
      time: formatTimeTo12Hour(a.time),
      rawTime: a.time,
      status: a.status,
      user_remarks: a.user_remarks,
      admin_remarks: a.admin_remarks || '',
      reviewed_by: a.reviewed_by,
      reviewed_at: a.reviewed_at,
      adminRemarksSaved: !!a.admin_remarks,
    }))
  } catch (err) {
    console.error('Unexpected error fetching appointments:', err)
    appointments.value = []
  }
}

async function saveRemarks(row) {
  try {
    if (!row.admin_remarks?.trim()) {
      console.warn('Cannot save empty remarks')
      return
    }

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
  const formattedHour = hour % 12 || 12
  return `${formattedHour}:${minute.toString().padStart(2, '0')} ${ampm}`
}

function getStatusColor(status) {
  switch (status) {
    case 'Approved':
      return 'green'
    case 'Rejected':
      return 'red'
    default:
      return 'grey'
  }
}

function selectDate(day) {
  if (!day.isOtherMonth) {
    selectedDate.value = new Date(day.date)
  }
}

function previousMonth() {
  currentDate.value = subMonths(currentDate.value, 1)
}

function nextMonth() {
  currentDate.value = addMonths(currentDate.value, 1)
}
</script>

<style scoped>
@font-face {
  font-family: 'Raleway';
  src: url('src/assets/fonts/Raleway.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

/* Tabs */
.tabs-container {
  margin-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
}

.appointment-tabs {
  background: transparent;
  width: 100%;
}

.appointment-tabs :deep(.q-tabs__content) {
  justify-content: flex-start;
  padding-left: 4rem;
  gap: 3rem;
}

.appointment-tabs :deep(.q-tab) {
  text-transform: none;
  font:
    500 16px 'Poppins',
    sans-serif;
  color: #666;
  padding: 0.75rem 2rem;
  min-height: 48px;
}

.appointment-tabs :deep(.q-tab--active) {
  color: #4d0000 !important;
}

.appointment-tabs :deep(.q-tabs__indicator) {
  background-color: #4d0000;
  height: 3px;
}

/* Table Styles */
.my-sticky-header-table {
  border-radius: 10px !important;
  font-family: 'Poppins', sans-serif;
  height: auto;
}

::v-deep(.my-sticky-header-table .q-table__bottom) {
  font-size: 14px;
  background-color: #560505 !important;
  color: white;
}

::v-deep(.my-sticky-header-table thead tr th) {
  padding: 1rem;
  font-size: 14px;
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: #560505 !important;
  color: white;
}

::v-deep(.my-sticky-header-table.q-table--loading thead tr:last-child th) {
  top: 48px;
}

::v-deep(.my-sticky-header-table tbody) {
  scroll-margin-top: 48px;
}

::v-deep(.my-sticky-header-table .q-table__bottom .q-btn__content),
::v-deep(.my-sticky-header-table .q-table__bottom .q-select__dropdown-icon),
::v-deep(.my-sticky-header-table .q-table__bottom .q-field__native) {
  color: white !important;
}

/* Calendar Layout */
.calendar-container {
  margin-top: 2rem;
}

.calendar-layout {
  display: flex;
  gap: 2rem;
  height: 700px;
}

/* Left Sidebar */
.appointments-sidebar {
  flex: 0 0 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.selected-date-header {
  background: white;
  padding: 2rem 1.5rem 1.5rem;
  text-align: left;
  border-bottom: 2px solid #000;
}

.date-display .day-number {
  font:
    700 5rem 'Poppins',
    sans-serif;
  color: #000;
  line-height: 0.9;
  margin-bottom: 0.25rem;
}

.date-display .day-name {
  font:
    600 14px 'Poppins',
    sans-serif;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.appointments-list {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.appointments-header h6 {
  font:
    700 11px 'Poppins',
    sans-serif;
  color: #000;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.no-appointments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.no-appointments p {
  font:
    400 14px 'Poppins',
    sans-serif;
  color: #999;
  margin-top: 1rem;
}

.appointment-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.appointment-item {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.appointment-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.appointment-time {
  display: flex;
  align-items: center;
  font:
    400 13px 'Poppins',
    sans-serif;
  color: #666;
  margin-bottom: 0.5rem;
}

.appointment-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.appointment-name {
  font:
    600 15px 'Poppins',
    sans-serif;
  color: #000;
}

.appointment-purpose {
  font:
    400 13px 'Poppins',
    sans-serif;
  color: #666;
}

.appointment-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.25rem;
}

.appointment-badge {
  font-size: 0.7rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.action-buttons-calendar {
  display: flex;
  gap: 0.25rem;
}

/* Calendar View */
.calendar-view {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.calendar-header {
  background: #560505;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  position: relative;
}

.calendar-header .nav-btn {
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  position: absolute;
  z-index: 10;
}

.calendar-header .nav-btn:first-of-type {
  left: 1rem;
}

.calendar-header .nav-btn:last-of-type {
  right: 1rem;
}

.calendar-header:hover .nav-btn {
  opacity: 1;
}

.calendar-title {
  font:
    700 28px 'Poppins',
    sans-serif;
  color: white;
  text-transform: uppercase;
  letter-spacing: 3px;
  flex: 1;
  text-align: left;
  padding-left: 1.5rem;
}

.year-display {
  font:
    700 28px 'Poppins',
    sans-serif;
  color: white;
  text-align: right;
  flex: 1;
  padding-right: 1.5rem;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  padding: 2rem;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  background: transparent;
  margin-bottom: 0.5rem;
}

.weekday {
  text-align: center;
  font:
    600 10px 'Poppins',
    sans-serif;
  color: #666;
  padding: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  flex: 1;
}

.calendar-day {
  min-height: 80px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  border: 1px solid #e0e0e0;
  padding: 0.75rem;
  margin: -1px 0 0 -1px;
}

.calendar-day:hover {
  background: #f5f5f5;
  z-index: 1;
}

.calendar-day.other-month {
  background: #fafafa;
  opacity: 0.4;
}

.calendar-day.other-month .day-number {
  color: #ccc;
}

.calendar-day.today .day-number {
  background: #560505;
  color: white;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 700;
}

.calendar-day.selected {
  background: #fff5f5;
  z-index: 2;
}

.calendar-day.selected:not(.today) {
  border: 2px solid #560505;
}

.calendar-day.selected:hover {
  background: #ffebeb;
}

.calendar-day .day-number {
  font:
    500 16px 'Poppins',
    sans-serif;
  color: #000;
  z-index: 1;
}

.calendar-day .appointment-counts {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
}

.calendar-day .appointment-count {
  color: white;
  font:
    700 10px 'Poppins',
    sans-serif;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

.calendar-day .appointment-count.approved {
  background: #4caf50;
}

.calendar-day .appointment-count.pending {
  background: #9e9e9e;
}

.calendar-day.selected .appointment-count.approved {
  background: #4caf50;
}

.calendar-day.selected .appointment-count.pending {
  background: #9e9e9e;
}

/* Responsive */
@media (max-width: 1200px) {
  .calendar-layout {
    flex-direction: column;
    height: auto;
  }

  .appointments-sidebar {
    flex: 0 0 auto;
    max-height: 500px;
  }
}

@media (max-width: 768px) {
  .appointment-tabs :deep(.q-tabs__content) {
    padding-left: 1rem;
    gap: 1rem;
  }

  .calendar-view {
    padding: 1rem;
  }

  .appointments-sidebar {
    max-height: 400px;
  }
}
</style>
