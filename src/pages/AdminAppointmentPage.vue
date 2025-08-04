<template>
  <q-page class="q-pa-md">
    <div class="q-mt-xs title">Appointments</div>
    <div class="q-mt-md">
      <q-table
        class="my-sticky-header-table"
        flat
        bordered
        :rows="rows"
        :columns="columns"
        row-key="name"
        :pagination="pagination"
      >
        <template v-slot:body-cell-actions>
          <q-td align="center">
            <router-link
              to="/appointmentdetails"
              class="text-primary"
              style="text-decoration: underline; cursor: pointer"
            >
              View More Details
            </router-link>
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
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
    field: (row) => row.name,
    format: (val) => `${val}`,
  },
  {
    name: 'email',
    label: 'Email',
    align: 'center',
    field: (row) => row.email,
  },
  {
    name: 'contact',
    label: 'Contact Number',
    align: 'center',
    field: (row) => row.contact,
  },
  {
    name: 'date',
    label: 'Date',
    align: 'center',
    field: (row) => row.date,
  },
  {
    name: 'time',
    label: 'Time',
    align: 'center',
    field: (row) => row.time,
  },
  {
    name: 'status',
    label: 'Status',
    align: 'center',
    field: (row) => row.status || 'Pending', // Default to 'Pending' if status is not defined
  },
  {
    name: 'actions',
    align: 'center',
    field: (row) => row.id,
    sortable: false,
  },
]

//FOR EXAMPLE ONLY
const rows = [
  {
    id: 1,
    name: 'Juan Dela Cruz',
    email: ' juandelacruz@iskolarngbayan.pup.edu.ph',
    contact: '09171234567',
    date: '2025-08-10',
    time: '10:00 AM',
  },
  {
    id: 2,
    name: 'Maria Clara',
    email: 'maria@example.com',
    contact: '09180001122',
    date: '2025-08-11',
    time: '11:30 AM',
  },
  {
    id: 3,
    name: 'Jose Rizal',
    email: 'rizal@example.com',
    contact: '09998887766',
    date: '2025-08-12',
    time: '01:00 PM',
  },
  {
    id: 4,
    name: 'Andres Bonifacio',
    email: 'andresb@example.com',
    contact: '09175551234',
    date: '2025-08-13',
    time: '02:00 PM',
  },
  {
    id: 5,
    name: 'Gregoria de Jesus',
    email: 'oriang@example.com',
    contact: '09172223344',
    date: '2025-08-14',
    time: '09:30 AM',
  },
  {
    id: 6,
    name: 'Emilio Aguinaldo',
    email: 'emilio@example.com',
    contact: '09223334455',
    date: '2025-08-15',
    time: '03:00 PM',
  },
  {
    id: 7,
    name: 'Melchora Aquino',
    email: 'melchora@example.com',
    contact: '09176667788',
    date: '2025-08-16',
    time: '10:45 AM',
  },
  {
    id: 8,
    name: 'Antonio Luna',
    email: 'luna@example.com',
    contact: '09178889900',
    date: '2025-08-17',
    time: '01:15 PM',
  },
  {
    id: 9,
    name: 'Apolinario Mabini',
    email: 'mabini@example.com',
    contact: '09227778899',
    date: '2025-08-18',
    time: '11:00 AM',
  },
  {
    id: 10,
    name: 'Trinidad Tecson',
    email: 'trinidad@example.com',
    contact: '09331112233',
    date: '2025-08-19',
    time: '02:30 PM',
  },
  {
    id: 11,
    name: 'Manuel Quezon',
    email: 'quezon@example.com',
    contact: '09170005566',
    date: '2025-08-20',
    time: '09:00 AM',
  },
  {
    id: 12,
    name: 'Sergio Osmeña',
    email: 'osmena@example.com',
    contact: '09221114455',
    date: '2025-08-21',
    time: '04:00 PM',
  },
]
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
</style>
