<template>
  <q-page class="q-pa-md">
    <div class="q-mt-xs title">Incomplete Metada</div>
    <div class="q-mt-md">
      <q-table
        class="my-sticky-header-table"
        flat
        bordered
        :rows="incompleteRows"
        :columns="incompleteColumns"
        row-key="id"
        :pagination="{ page: 1, rowsPerPage: 8 }"
      >
        <!-- clickable link cell -->
        <template v-slot:body-cell-materialLink="props">
          <q-td :props="props">
            <a :href="props.row.materialLink" target="_blank">
              <q-icon name="link" color="primary" size="20px" />
            </a>
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
// const pagination = {
//   page: 1,
//   rowsPerPage: 8,
// }

const incompleteColumns = [
  {
    name: 'materialNo',
    label: 'Archival Material No.',
    align: 'center',
    field: 'materialNo',
  },
  {
    name: 'materialType',
    label: 'Archival Material Type',
    align: 'center',
    field: 'materialType',
  },
  {
    name: 'materialName',
    label: 'Archival Material Name',
    align: 'center',
    field: 'materialName',
  },
  {
    name: 'materialIncompleteData',
    label: 'Incomplete Data',
    align: 'center',
    field: 'materialIncompleteData',
  },

  {
    name: 'materialLink',
    label: 'Archival Material Link',
    align: 'center',
    field: 'materialLink',
  },
]

const incompleteRows = ref([
  {
    id: 1,
    materialNo: 'AM-001',
    materialType: 'Document',
    materialName: 'Annual Report',
    materialIncompleteData: 'Author, Date',
    materialLink: 'http://example.com/notes',
  },
  {
    id: 2,
    materialNo: 'AM-002',
    materialType: 'Artifact',
    materialName: 'Cat Toy',
    materialIncompleteData: 'Description',
    materialLink: 'http://example.com/cattoy',
  },
  {
    id: 3,
    materialNo: 'AM-003',
    materialType: 'Artifact',
    materialName: 'Campus Plaque',
    materialIncompleteData: 'Author',
    materialLink: 'http://example.com/campus',
  },
  {
    id: 4,
    materialNo: 'AM-004',
    materialType: 'Photograph',
    materialName: 'Old Library',
    materialIncompleteData: 'Date',
    materialLink: 'http://example.com/library',
  },
  {
    id: 5,
    materialNo: 'AM-005',
    materialType: 'Document',
    materialName: 'Meeting Minutes',
    materialIncompleteData: 'Signature',
    materialLink: 'http://example.com/minutes',
  },
  {
    id: 6,
    materialNo: 'AM-006',
    materialType: 'Artifact',
    materialName: 'Bronze Medal',
    materialIncompleteData: 'Year',
    materialLink: 'http://example.com/medal',
  },
  {
    id: 7,
    materialNo: 'AM-007',
    materialType: 'Document',
    materialName: 'Thesis Draft',
    materialIncompleteData: 'Adviser',
    materialLink: 'http://example.com/thesis',
  },
  {
    id: 8,
    materialNo: 'AM-008',
    materialType: 'Photograph',
    materialName: 'Graduation Day',
    materialIncompleteData: 'Photographer',
    materialLink: 'http://example.com/graduation',
  },
  {
    id: 9,
    materialNo: 'AM-009',
    materialType: 'Artifact',
    materialName: 'Wooden Chair',
    materialIncompleteData: 'Maker',
    materialLink: 'http://example.com/chair',
  },
  {
    id: 10,
    materialNo: 'AM-010',
    materialType: 'Document',
    materialName: 'Old Contract',
    materialIncompleteData: 'Witness',
    materialLink: 'http://example.com/contract',
  },
])
</script>

<style scoped>
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
.view-more-link {
  color: #880000;
  text-decoration: underline;
}
</style>
