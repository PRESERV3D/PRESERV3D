<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-lg title">Appointments</h2>
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
        <q-tab name="status" label="Status" class="tab-item" />
      </q-tabs>
    </div>

    <div class="booking-form-container" v-if="activeTab === 'information'">
      <div class="form-card">
        <h2 class="form-card-title">Booking Form</h2>

        <q-form @submit.prevent="submitBooking">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Name</label>
              <q-input v-model="form.name" dense outlined class="form-input" readonly />
            </div>

            <div class="form-group">
              <label class="form-label">E-mail</label>
              <q-input
                v-model="form.email"
                dense
                outlined
                type="email"
                class="form-input"
                readonly
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group-split">
              <div class="form-group half-width">
                <label class="form-label">Date</label>
                <q-input
                  v-model="form.date"
                  dense
                  outlined
                  mask="####-##-##"
                  placeholder="Preferred Date"
                  class="form-input"
                  :rules="[(val) => !!val || 'Please select a date']"
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="form.date" mask="YYYY-MM-DD" :options="datePickerOptions">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="form-group half-width">
                <label class="form-label">Time</label>
                <q-input
                  v-model="form.time"
                  dense
                  outlined
                  placeholder="Preferred Time"
                  class="form-input"
                  :rules="[(val) => !!val || 'Please select a time']"
                >
                  <template v-slot:append>
                    <q-icon name="schedule" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time
                          v-model="form.time"
                          mask="h:mm A"
                          :options="hourOptions"
                          :minute-options="[0, 15, 30, 45]"
                        >
                          <div class="row items-center justify-end q-gutter-sm">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-time>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <label class="form-label">Purpose of Visit</label>
              <q-input
                v-model="form.purpose"
                dense
                outlined
                placeholder="Enter Purpose of Visit"
                class="form-input"
                :rules="[(val) => !!val || 'Please enter purpose of visit']"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group notes-group">
              <label class="form-label">Remarks</label>
              <q-input
                v-model="form.user_remarks"
                dense
                outlined
                placeholder="Special Requests"
                class="form-input"
              />
            </div>

            <div class="form-group button-group">
              <label class="form-label invisible-label">Action</label>
              <q-btn type="submit" class="book-btn" push no-caps :loading="loading"> BOOK </q-btn>
            </div>
          </div>
        </q-form>
      </div>
    </div>

    <!-- Status Tab Content with Appointments Table Design -->
    <div class="q-mt-md" v-if="activeTab === 'status'">
      <q-table
        class="my-sticky-header-table"
        flat
        bordered
        :rows="appointments"
        :columns="columns"
        row-key="appointment_id"
        :pagination="pagination"
      >
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="getStatusColor(props.value)"
              :label="props.value"
              class="text-weight-medium"
              style="font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 12px"
            />
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Success Modal -->
    <q-dialog v-model="showSuccessModal" persistent>
      <q-card class="success-modal">
        <div class="success-header">
          <q-icon name="check_circle" size="4rem" color="white" />
        </div>

        <q-card-section class="success-content text-center">
          <h3 class="success-title q-mb-md">SUCCESSFULLY BOOKED!</h3>
          <p class="success-message">
            We've got your booking! Your booking is under review. Please wait for your booking
            confirmation.
          </p>
        </q-card-section>

        <q-card-actions class="success-actions">
          <q-btn @click="viewAppointments" class="return-btn" no-caps flat>
            View Appointment Bookings
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from 'src/stores/user'
import { supabase } from 'boot/supabase'
import { addBusinessDays, addMonths, isWithinInterval, isWeekend } from 'date-fns'

const activeTab = ref('information')
const loading = ref(false)
const showSuccessModal = ref(false)

const userStore = useUserStore()

const form = ref({
  name: `${userStore.profile.first_name || ''} ${userStore.profile.last_name || ''}`.trim(),
  email: userStore.profile?.email || '',
  date: '',
  time: '',
  purpose: '',
  user_remarks: '',
})

const pagination = {
  page: 1,
  rowsPerPage: 8,
}

const columns = [
  {
    name: 'purpose',
    required: true,
    label: 'Purpose of Visit',
    align: 'center',
    field: 'purpose',
    // sortable: true,
  },
  {
    name: 'appointmentDate',
    required: true,
    label: 'Appointment Date',
    align: 'center',
    field: 'appointmentDate',
    // sortable: true,
  },
  {
    name: 'time',
    required: true,
    label: 'Time',
    align: 'center',
    field: 'time',
  },
  {
    name: 'user_remarks',
    required: false,
    label: 'User Remarks',
    align: 'center',
    field: 'user_remarks',
  },
  {
    name: 'status',
    required: true,
    label: 'Approval Status',
    align: 'center',
    field: 'status',
  },
  {
    name: 'reviewed_by',
    required: true,
    label: 'Reviewed By',
    align: 'center',
    field: 'reviewed_by',
  },
  {
    name: 'admin_remarks',
    required: false,
    label: 'Admin Remarks',
    align: 'center',
    field: 'admin_remarks',
  },
]

const appointments = ref([])

// Fetch appointments of the logged-in user
const fetchAppointments = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('appointment_booking')
    .select('*')
    .eq('user_id', user.id)

  if (!error && data) {
    appointments.value = data.map((a) => ({
      appointment_id: a.appointment_id,
      purpose: a.purpose,
      appointmentDate: a.date,
      time: formatTimeTo12Hour(a.time),
      status: a.status,
      user_remarks: a.user_remarks,
      admin_remarks: a.admin_remarks,
      reviewed_by: a.reviewed_by,
    }))
  }
}

// Allowed dates: 3 business days from current date and within 3 months only
const datePickerOptions = (date) => {
  const today = new Date()
  const selectedDate = new Date(date)

  const minDate = addBusinessDays(today, 3)
  const maxDate = addMonths(today, 3)

  // Rule 1: must be within interval
  const withinRange = isWithinInterval(selectedDate, { start: minDate, end: maxDate })

  // Rule 2: weekends not allowed
  const notWeekend = !isWeekend(selectedDate)

  return withinRange && notWeekend
}

function formatTimeTo12Hour(timeString) {
  if (!timeString) return ''
  const [hour, minute] = timeString.split(':').map(Number)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const formattedHour = hour % 12 || 12 // 0 -> 12
  return `${formattedHour}:${minute.toString().padStart(2, '0')} ${ampm}`
}

const hourOptions = (hr) => {
  // Allow 8:00 to  11:45 AM
  if (hr >= 8 && hr <= 11) return true
  // Block 12:00 PM hour
  if (hr === 12) return false
  // Allow 1:00 to 7:45 PM
  if (hr >= 13 && hr <= 19) return true
  return false
}

async function submitBooking() {
  const { name, email, date, time, purpose, user_remarks } = form.value

  if (!date || !time || !purpose) {
    alert('Please fill out all required fields.')
    return
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    const { error } = await supabase.from('appointment_booking').insert([
      {
        name,
        email,
        date,
        time,
        purpose,
        user_remarks,
        user_type: userStore.profile?.user_type || 'User',
        user_id: user.id,
        status: 'Pending',
        // reviewed_by: null,
        // reviewed_at: null,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      alert('Failed to save appointment booking.')
      console.error('Insert error:', error)
      return
    }

    console.log('Appointment booking successfully saved.')
    showSuccessModal.value = true
    resetForm()
  } catch (err) {
    console.log('Error during appointment booking:', err)
    alert('An error occurred during booking. Please try again later.')
  }
}

function resetForm() {
  form.value.date = ''
  form.value.time = ''
  form.value.purpose = ''
  form.value.user_remarks = ''
}

onMounted(fetchAppointments)

watch(activeTab, (newTab) => {
  if (newTab === 'status') {
    fetchAppointments()
  }
})

function viewAppointments() {
  showSuccessModal.value = false
  console.log('Going to Status tab...')
  activeTab.value = 'status'
  fetchAppointments()
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
</script>

<style scoped>
@font-face {
  font-family: 'Raleway';
  src: url('src/assets/fonts/Raleway.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

/* Layout Components */
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

/* Form Card */
.booking-form-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.form-card {
  background: #fffdf9;
  border-radius: 37.5px;
  padding: 3.5rem;
  box-shadow: 0 15px 52.5px 0 rgba(86, 89, 146, 0.25);
  width: 1050px;
  max-width: 100%;
  min-height: 543px;
}

.form-card-title {
  font:
    600 22px 'Poppins',
    sans-serif;
  color: #000;
  margin: 0 0 1.5rem 0;
}

/* Form Layout */
.form-row {
  display: flex;
  gap: 2rem;
  margin-bottom: 0.5rem;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  width: 100%;
}

.form-group-split {
  flex: 1;
  display: flex;
  gap: 2rem;
}

.form-group.half-width {
  flex: 1;
}

.form-group.notes-group {
  flex: 3;
}

.form-group.button-group {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* Form Elements */
.form-label {
  font:
    600 14px 'Poppins',
    sans-serif;
  color: #560505;
  margin-bottom: 0.4rem;
}

.invisible-label {
  visibility: hidden;
}

.form-input :deep(.q-field__control) {
  border-radius: 13.5px;
  border: 2.25px solid #000;
  background: #fff;
  min-height: 35px;
}

.form-input :deep(.q-field__native) {
  font:
    400 13px 'Poppins',
    sans-serif;
  color: #000 !important;
  letter-spacing: 0.5px;
  padding: 8px 12px;
}

.form-input :deep(.q-field__input::placeholder) {
  font:
    500 13px 'Poppins',
    sans-serif;
  color: #a3a3a3;
  letter-spacing: 0.5px;
}

.form-input :deep(.q-input .q-field__label) {
  font:
    400 13px 'Poppins',
    sans-serif;
  color: #a3a3a3;
  letter-spacing: 0.96px;
  position: absolute !important;
  top: 50% !important;
  left: 12px !important;
  transform: translateY(-50%) !important;
  transition: none !important;
  pointer-events: none;
}

.form-input :deep(.q-field__control):hover {
  border-color: #4d0000;
}

.form-input :deep(.q-field--focused .q-field__control) {
  border-color: #4d0000;
  box-shadow: 0 0 0 2px rgba(77, 0, 0, 0.1);
}

.form-input :deep(.q-field__messages) {
  color: #c10015;
  font-size: 12px;
  margin-top: 4px;
}

.book-btn {
  background: #660000;
  color: white;
  font:
    600 1rem 'Poppins',
    sans-serif;
  border-radius: 13.5px;
  height: 30px;
  min-width: 120px;
  padding: 8px 24px;
}

.book-btn:hover {
  background: #660000;
}

/* Table Styles */
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

/* Success Modal */
.success-modal {
  width: 100%;
  max-width: 550px;
  border-radius: 25px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.success-modal :deep(.q-card__section) {
  padding: 0;
}

.success-header {
  background: linear-gradient(
    90deg,
    #000 0%,
    #320606 0.01%,
    #640c0c 20.19%,
    #b69f9f 50.48%,
    #8d5656 66.59%,
    #640c0c 82.69%,
    #320606 99.99%,
    #000 100%
  );
  padding: 3rem 2rem;
  text-align: center;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.success-content {
  padding: 2.5rem 3.5rem;
  background: white;
}

.success-title {
  font:
    600 26px 'Poppins',
    sans-serif;
  color: #560505;
  text-transform: uppercase;
  margin: 1rem 0 0 0;
}

.success-message {
  font:
    400 12px 'Poppins',
    sans-serif;
  color: #560505;
  line-height: 1.5;
  margin: 0 2rem;
}

.success-actions {
  padding: 0.75rem 2rem 2rem;
  background: white;
  display: flex;
  justify-content: center;
}

.return-btn {
  font:
    500 12px 'Poppins',
    sans-serif;
  color: #b33022;
  text-decoration: underline;
  padding: 0.5rem 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .form-card {
    padding: 1.5rem;
  }

  .form-row,
  .form-group-split {
    flex-direction: column;
    gap: 0.75rem;
  }

  .appointment-tabs :deep(.q-tab) {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.75rem;
  }

  .form-card {
    padding: 1rem;
  }

  .form-card-title {
    font-size: 1.25rem;
  }
}
</style>
