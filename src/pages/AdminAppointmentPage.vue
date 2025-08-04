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
      />
    </div>
  </q-page>
</template>

<script>
const columns = [
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'center',
    field: (row) => row.name,
    format: (val) => `${val}`,
  },
  { name: 'calories', align: 'center', label: 'Email ', field: 'calories' },
  { name: 'fat', align: 'center', label: 'Contact Number', field: 'fat' },
  { name: 'carbs', align: 'center', label: 'Date', field: 'carbs' },
  { name: 'protein', align: 'center', label: 'Time', field: 'protein' },
  {},
]

const rows = [
  {
    name: 'Lorem ipsum dolor',
    calories: 159,
    fat: 6.0,
    carbs: 24,
    protein: 4.0,
    sodium: 87,
    calcium: '14%',
    iron: '1%',
  },
  {
    name: 'Lorem ipsum dolor',
    calories: 237,
    fat: 9.0,
    carbs: 37,
    protein: 4.3,
    sodium: 129,
    calcium: '8%',
    iron: '1%',
  },
  {
    name: 'Lorem ipsum dolor',
    calories: 262,
    fat: 16.0,
    carbs: 23,
    protein: 6.0,
    sodium: 337,
    calcium: '6%',
    iron: '7%',
  },
  {
    name: 'Lorem ipsum dolor',
    calories: 305,
    fat: 3.7,
    carbs: 67,
    protein: 4.3,
    sodium: 413,
    calcium: '3%',
    iron: '8%',
  },
  {
    name: 'Gingerbread',
    calories: 356,
    fat: 16.0,
    carbs: 49,
    protein: 3.9,
    sodium: 327,
    calcium: '7%',
    iron: '16%',
  },
  {
    name: 'Jelly bean',
    calories: 375,
    fat: 0.0,
    carbs: 94,
    protein: 0.0,
    sodium: 50,
    calcium: '0%',
    iron: '0%',
  },
  {
    name: 'Lollipop',
    calories: 392,
    fat: 0.2,
    carbs: 98,
    protein: 0,
    sodium: 38,
    calcium: '0%',
    iron: '2%',
  },
  {
    name: 'Honeycomb',
    calories: 408,
    fat: 3.2,
    carbs: 87,
    protein: 6.5,
    sodium: 562,
    calcium: '0%',
    iron: '45%',
  },
  {
    name: 'Donut',
    calories: 452,
    fat: 25.0,
    carbs: 51,
    protein: 4.9,
    sodium: 326,
    calcium: '2%',
    iron: '22%',
  },
  {
    name: 'KitKat',
    calories: 518,
    fat: 26.0,
    carbs: 65,
    protein: 7,
    sodium: 54,
    calcium: '12%',
    iron: '6%',
  },
]

export default {
  setup() {
    return {
      columns,
      rows,
    }
  },
}
</script>

<style scoped>
.my-sticky-header-table {
  height: 30rem; /* Ensure scrollable height */
}

/* Color top and bottom toolbars inside table */
::v-deep(.my-sticky-header-table .q-table__top),
::v-deep(.my-sticky-header-table .q-table__bottom) {
  background-color: #560505 !important;
  color: white;
}

/* Sticky header cells */
::v-deep(.my-sticky-header-table thead tr th) {
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
</style>
