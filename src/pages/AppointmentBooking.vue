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
              <q-input
                v-model="form.name"
                dense
                outlined
                placeholder="Enter full name"
                class="form-input"
                :rules="[(val) => !!val || 'Please enter your name']"
              />
            </div>

            <div class="form-group">
              <label class="form-label">E-mail</label>
              <q-input
                v-model="form.email"
                dense
                outlined
                type="email"
                placeholder="Enter email"
                class="form-input"
                :rules="[(val) => !!val || 'Please enter your email']"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Contact Number</label>
              <q-input
                v-model="form.contact"
                dense
                outlined
                placeholder="Enter contact number"
                class="form-input"
                :rules="[(val) => !!val || 'Please enter your contact number']"
              />
            </div>

            <div class="form-group-split">
              <div class="form-group half-width">
                <label class="form-label">Date</label>
                <q-input
                  v-model="form.date"
                  dense
                  outlined
                  placeholder="Preferred Date"
                  class="form-input"
                  :rules="[(val) => !!val || 'Please select a date']"

                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date
                          v-model="form.date"
                          mask="MMMM DD, YYYY"
                          :options="datePickerOptions"
                        >
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
                          format24h="false"
                          :options="timeOptions"
                          hour-options="[7,8,9,10,11,12,1,2,3,4,5,6]"
                          minute-options="[0,15,30,45]"
                        >
                          <div class="row items-center justify-end q-gutter-sm">
                            <q-btn
                              @click="setTime('9:00 AM')"
                              label="9:00 AM"
                              color="primary"
                              flat
                              size="sm"
                            />
                            <q-btn
                              @click="setTime('1:00 PM')"
                              label="1:00 PM"
                              color="primary"
                              flat
                              size="sm"
                            />
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
              <label class="form-label">Notes</label>
              <q-input
                v-model="form.notes"
                dense
                outlined
                placeholder="Special Requests"
                class="form-input"
              />
            </div>

            <div class="form-group button-group">
              <label class="form-label invisible-label">Action</label>
              <q-btn
                type="submit"
                class="book-btn"
                push
                no-caps
                :loading="loading"
              >
                BOOK
              </q-btn>
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
        row-key="id"
        :pagination="pagination"
      >
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="getStatusColor(props.value)"
              :label="props.value"
              class="text-weight-medium"
              style="font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 12px;"
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
            We've got your booking! Your booking is under review. Please wait for a
            confirmation email and SMS before you visit.
          </p>
        </q-card-section>

        <q-card-actions class="success-actions">
          <q-btn
            @click="returnToDashboard"
            class="return-btn"
            no-caps
            flat
          >
            Return to Dashboard
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('information')
const loading = ref(false)
const showSuccessModal = ref(false)

const form = ref({
  name: '',
  email: '',
  contact: '',
  date: '',
  time: '',
  purpose: '',
  notes: ''
})

const pagination = {
  page: 1,
  rowsPerPage: 8,
}

const columns = [
  {
    name: 'id',
    required: true,
    label: 'Appointment ID',
    align: 'center',
    field: 'id',
    sortable: true
  },
  {
    name: 'description',
    required: true,
    label: 'Description',
    align: 'center',
    field: 'description',
    sortable: true
  },
  {
    name: 'dateFiled',
    required: true,
    label: 'Date Filed',
    align: 'center',
    field: 'dateFiled',
    sortable: true
  },
  {
    name: 'status',
    required: true,
    label: 'Status',
    align: 'center',
    field: 'status',
    sortable: true
  },
  {
    name: 'remarks',
    required: true,
    label: 'Remarks',
    align: 'center',
    field: 'remarks',
    sortable: true
  }
]

const appointments = [
  {
    id: 18,
    description: 'Lorem ipsum dolor sit...',
    dateFiled: '07/25/2025',
    status: 'ON GOING',
    remarks: ''
  },
  {
    id: 17,
    description: 'Lorem ipsum dolor sit...',
    dateFiled: '07/22/2025',
    status: 'ON GOING',
    remarks: ''
  },
  {
    id: 16,
    description: 'Lorem ipsum dolor sit...',
    dateFiled: '07/13/2025',
    status: 'ON GOING',
    remarks: ''
  },
  {
    id: 15,
    description: 'Lorem ipsum dolor sit...',
    dateFiled: '06/16/2025',
    status: 'ON GOING',
    remarks: ''
  },
  {
    id: 14,
    description: 'Lorem ipsum dolor sit...',
    dateFiled: '05/17/2025',
    status: 'REJECTED',
    remarks: ''
  },
  {
    id: 13,
    description: 'Lorem ipsum dolor sit...',
    dateFiled: '04/8/2025',
    status: 'ACCEPTED',
    remarks: 'August 20, 2025 at 03:00 PM'
  },
  {
    id: 12,
    description: 'Lorem ipsum dolor sit...',
    dateFiled: '04/7/2025',
    status: 'REJECTED',
    remarks: ''
  },
  {
    id: 11,
    description: 'Lorem ipsum dolor sit...',
    dateFiled: '02/20/2025',
    status: 'REJECTED',
    remarks: ''
  }
]

const datePickerOptions = (date) => {
  const today = new Date()
  const selectedDate = new Date(date)
  return selectedDate >= today
}

const timeOptions = (hr, min) => {
  if (hr < 7 || hr > 18) return false
  return min % 15 === 0
}

function setTime(time) {
  form.value.time = time
}

async function submitBooking() {
  loading.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('Booking submitted:', form.value)

    activeTab.value = 'status'
    showSuccessModal.value = true

    form.value = {
      name: '',
      email: '',
      contact: '',
      date: '',
      time: '',
      purpose: '',
      notes: ''
    }
  } catch (error) {
    console.error('Booking error:', error)
    alert('Failed to book appointment. Please try again.')
  } finally {
    loading.value = false
  }
}

function returnToDashboard() {
  showSuccessModal.value = false
  console.log('Returning to dashboard...')
}

function getStatusColor(status) {
  switch (status) {
    case 'ON GOING':
      return 'orange'
    case 'ACCEPTED':
      return 'green'
    case 'REJECTED':
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
  font: 500 16px 'Poppins', sans-serif;
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
  background: #FFFDF9;
  border-radius: 37.5px;
  padding: 3.5rem;
  box-shadow: 0 15px 52.5px 0 rgba(86, 89, 146, 0.25);
  width: 1050px;
  max-width: 100%;
  min-height: 543px;
}

.form-card-title {
  font: 600 22px 'Poppins', sans-serif;
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
  font: 600 14px 'Poppins', sans-serif;
  color: #560505;
  margin-bottom: 0.4rem;
}

.invisible-label {
  visibility: hidden;
}

.form-input :deep(.q-field__control) {
  border-radius: 13.5px;
  border: 2.25px solid #000;
  background: #FFF;
  min-height: 35px;
}

.form-input :deep(.q-field__native) {
  font: 400 13px 'Poppins', sans-serif;
  color: #000 !important;
  letter-spacing: 0.5px;
  padding: 8px 12px;
}

.form-input :deep(.q-field__input::placeholder) {
  font: 500 13px 'Poppins', sans-serif;
  color: #a3a3a3;
  letter-spacing: 0.5px;
}

.form-input :deep(.q-input .q-field__label) {
  font: 400 13px 'Poppins', sans-serif;
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
  font: 600 1rem 'Poppins', sans-serif;
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
  background: linear-gradient(90deg, #000 0%, #320606 0.01%, #640C0C 20.19%, #B69F9F 50.48%, #8D5656 66.59%, #640C0C 82.69%, #320606 99.99%, #000 100%);
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
  font: 600 26px 'Poppins', sans-serif;
  color: #560505;
  text-transform: uppercase;
  margin: 1rem 0 0 0;
}

.success-message {
  font: 400 12px 'Poppins', sans-serif;
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
  font: 500 12px 'Poppins', sans-serif;
  color: #B33022;
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
