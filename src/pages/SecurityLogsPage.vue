<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Security Logs</h2>
      <h5 class="q-mt-xs q-mb-lg subtitle">Monitor security events and potential threats</h5>
    </div>

    <!-- Filter Buttons and Actions -->
    <div class="q-mt-md">
      <!-- Event Type Filters -->
      <div class="row items-center justify-between q-ml-sm q-mb-md">
        <div class="row q-gutter-md">
          <q-btn
            label="All Events"
            no-caps
            class="btn-1"
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          />
          <q-btn
            label="Screenshots"
            no-caps
            class="btn-1"
            :class="{ active: activeFilter === 'screenshot_attempt' }"
            @click="activeFilter = 'screenshot_attempt'"
          />
          <q-btn
            label="Print Attempts"
            no-caps
            class="btn-1"
            :class="{ active: activeFilter === 'print_attempt' }"
            @click="activeFilter = 'print_attempt'"
          />
          <q-btn
            label="Copy/Cut"
            no-caps
            class="btn-1"
            :class="{ active: activeFilter === 'copy_attempt' }"
            @click="activeFilter = 'copy_attempt'"
          />
          <q-btn
            label="Dev Tools"
            no-caps
            class="btn-1"
            :class="{ active: activeFilter === 'dev_tools_detected' }"
            @click="activeFilter = 'dev_tools_detected'"
          />
          <q-btn
            label="Other"
            no-caps
            class="btn-1"
            :class="{ active: activeFilter === 'restricted_action' }"
            @click="activeFilter = 'restricted_action'"
          />
        </div>

        <!-- Export and Refresh buttons -->
        <div class="row q-gutter-sm">
          <q-btn
            icon="download"
            label="Export"
            no-caps
            class="btn-1 active"
            @click="exportLogs"
            :disable="filteredLogs.length === 0"
          >
            <q-tooltip>Export to CSV</q-tooltip>
          </q-btn>
          <q-btn icon="refresh" no-caps class="btn-1 active" @click="fetchLogs" :loading="loading">
            <q-tooltip>Reload Data</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Additional Filters -->
      <div class="row q-col-gutter-md q-ml-sm q-mb-md items-end">
        <!-- Date Range Filter -->
        <div class="col-12 col-md-3">
          <q-select
            v-model="dateRangeFilter"
            :options="dateRangeOptions"
            label="Date Range"
            outlined
            dense
            class="filter-select"
          >
            <template v-slot:prepend>
              <q-icon name="calendar_today" />
            </template>
          </q-select>
        </div>

        <!-- User Email Filter -->
        <div class="col-12 col-md-4">
          <q-select
            v-model="userFilter"
            :options="userOptions"
            label="Filter by User"
            outlined
            dense
            clearable
            use-input
            input-debounce="300"
            @filter="filterUsers"
            class="filter-select"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">No users found</q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <!-- Clear Filters Button -->
        <div class="col-12 col-md-2">
          <q-btn
            flat
            label="Clear Filters"
            color="primary"
            icon="clear_all"
            @click="clearAllFilters"
            class="full-width"
            no-caps
          >
            <q-tooltip>Reset all filters</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">{{ stats.total }}</div>
            <div class="text-caption text-grey">Total Events</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 text-orange">{{ stats.screenshots }}</div>
            <div class="text-caption text-grey">Screenshot Attempts</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 text-red">{{ stats.devTools }}</div>
            <div class="text-caption text-grey">Dev Tools Detected</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 text-blue">{{ stats.prints }}</div>
            <div class="text-caption text-grey">Print Attempts</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Logs Table -->
    <q-table
      class="my-sticky-header-table"
      flat
      bordered
      :rows="filteredLogs"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :pagination="pagination"
    >
      <!-- Expandable row -->
      <template v-slot:body="props">
        <!-- Main row -->
        <q-tr :props="props">
          <q-td v-for="col in props.cols" :key="col.name" :props="props" align="center">
            <template v-if="col.name === 'timestamp'">
              {{ formatDate(props.row.timestamp) }}
            </template>

            <template v-else-if="col.name === 'event_type'">
              <q-badge :color="getEventColor(props.row.event_type)" :label="props.row.event_type" />
            </template>

            <template v-else-if="col.name === 'user_info'">
              <div>
                <div class="text-weight-medium">{{ props.row.user_name || 'Unknown' }}</div>
                <div class="text-caption text-grey">{{ props.row.user_email || 'N/A' }}</div>
              </div>
            </template>

            <template v-else-if="col.name === 'document_info'">
              <div v-if="props.row.metadata?.document_title">
                <div class="text-weight-medium">
                  {{ props.row.metadata.document_title }}
                </div>
                <div class="text-caption text-grey">
                  {{ props.row.metadata.document_author || 'Unknown Author' }}
                </div>
              </div>
              <span v-else class="text-grey">N/A</span>
            </template>

            <template v-else-if="col.name === 'description'">
              {{ props.row.description }}
            </template>

            <template v-else-if="col.name === 'actions'">
              <q-btn
                flat
                dense
                round
                icon="info"
                color="primary"
                size="sm"
                @click.stop="viewLogDetails(props.row)"
              >
                <q-tooltip>View Details</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" icon="expand_more" @click="props.expand = !props.expand" />
            </template>

            <template v-else>
              {{ props.row[col.field] }}
            </template>
          </q-td>
        </q-tr>

        <!-- Expandable row with detailed information -->
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <div class="q-pa-md" style="background-color: #f5f5f5">
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <div class="text-h6 q-mb-md">Event Details</div>
                </div>
                <div class="col-6">
                  <div class="text-weight-bold">Event Type:</div>
                  <div>
                    <q-badge
                      :color="getEventColor(props.row.event_type)"
                      :label="props.row.event_type"
                    />
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-weight-bold">Timestamp:</div>
                  <div>{{ formatDate(props.row.timestamp) }}</div>
                </div>
                <div class="col-6">
                  <div class="text-weight-bold">User Name:</div>
                  <div>{{ props.row.user_name || 'Unknown' }}</div>
                </div>
                <div class="col-6">
                  <div class="text-weight-bold">User Email:</div>
                  <div>{{ props.row.user_email || 'N/A' }}</div>
                </div>
                <div class="col-12" v-if="props.row.metadata?.document_title">
                  <div class="text-weight-bold">Document Title:</div>
                  <div>{{ props.row.metadata.document_title }}</div>
                </div>
                <div class="col-6" v-if="props.row.metadata?.document_author">
                  <div class="text-weight-bold">Document Author:</div>
                  <div>{{ props.row.metadata.document_author }}</div>
                </div>
                <div class="col-6" v-if="props.row.metadata?.page_number">
                  <div class="text-weight-bold">Page Number:</div>
                  <div>{{ props.row.metadata.page_number }}</div>
                </div>
                <div class="col-12">
                  <div class="text-weight-bold">Description:</div>
                  <div>{{ props.row.description }}</div>
                </div>
                <div class="col-12" v-if="props.row.user_agent">
                  <div class="text-weight-bold">User Agent:</div>
                  <div class="text-caption" style="word-break: break-all">
                    {{ props.row.user_agent }}
                  </div>
                </div>
              </div>
            </div>
          </q-td>
        </q-tr>
      </template>
    </q-table>
    <!-- Log Details Dialog -->
    <q-dialog v-model="showDetailsDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Security Event Details</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedLog">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle2 q-mb-md">Event Information</div>
                  <q-list dense>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Event Type</q-item-label>
                        <q-item-label>
                          <q-badge
                            :color="getEventColor(selectedLog.event_type)"
                            :label="selectedLog.event_type"
                          />
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Timestamp</q-item-label>
                        <q-item-label>{{ formatDate(selectedLog.timestamp) }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Description</q-item-label>
                        <q-item-label>{{ selectedLog.description }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle2 q-mb-md">User Information</div>
                  <q-list dense>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Name</q-item-label>
                        <q-item-label>{{ selectedLog.user_name || 'Unknown' }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Email</q-item-label>
                        <q-item-label>{{ selectedLog.user_email || 'N/A' }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>User ID</q-item-label>
                        <q-item-label class="text-caption">{{
                          selectedLog.user_id || 'N/A'
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12" v-if="selectedLog.metadata">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle2 q-mb-md">Document Information</div>
                  <q-list dense>
                    <q-item v-if="selectedLog.metadata.document_title">
                      <q-item-section>
                        <q-item-label caption>Document Title</q-item-label>
                        <q-item-label>{{ selectedLog.metadata.document_title }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="selectedLog.metadata.document_author">
                      <q-item-section>
                        <q-item-label caption>Author</q-item-label>
                        <q-item-label>{{ selectedLog.metadata.document_author }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="selectedLog.document_id">
                      <q-item-section>
                        <q-item-label caption>Document ID</q-item-label>
                        <q-item-label class="text-caption">{{
                          selectedLog.document_id
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="selectedLog.metadata.page_number">
                      <q-item-section>
                        <q-item-label caption>Page Number</q-item-label>
                        <q-item-label>{{ selectedLog.metadata.page_number }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="selectedLog.metadata.zoom_level">
                      <q-item-section>
                        <q-item-label caption>Zoom Level</q-item-label>
                        <q-item-label
                          >{{ Math.round(selectedLog.metadata.zoom_level * 100) }}%</q-item-label
                        >
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle2 q-mb-md">Technical Details</div>
                  <q-list dense>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>User Agent</q-item-label>
                        <q-item-label class="text-caption" style="word-break: break-all">{{
                          selectedLog.user_agent || 'N/A'
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="selectedLog.ip_address">
                      <q-item-section>
                        <q-item-label caption>IP Address</q-item-label>
                        <q-item-label>{{ selectedLog.ip_address }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { supabase } from 'boot/supabase'
import { useQuasar, date } from 'quasar'

export default defineComponent({
  name: 'SecurityLogsPage',

  data() {
    return {
      logs: [],
      loading: false,
      showDetailsDialog: false,
      selectedLog: null,
      activeFilter: 'all',
      dateRangeFilter: 'All Time',
      userFilter: null,
      userOptions: [],
      allUsers: [], // Store all unique users
      dateRangeOptions: ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'],
      pagination: {
        rowsPerPage: 10,
      },
      columns: [
        {
          name: 'timestamp',
          label: 'Timestamp',
          field: 'timestamp',
          sortable: true,
          align: 'left',
        },
        {
          name: 'event_type',
          label: 'Event Type',
          field: 'event_type',
          sortable: true,
          align: 'left',
        },
        {
          name: 'user_info',
          label: 'User',
          field: 'user_name',
          sortable: true,
          align: 'left',
        },
        {
          name: 'document_info',
          label: 'Document',
          field: (row) => row.metadata?.document_title,
          sortable: false,
          align: 'left',
        },
      ],
    }
  },

  computed: {
    filteredLogs() {
      let filtered = [...this.logs]

      // Filter by event type
      if (this.activeFilter !== 'all') {
        filtered = filtered.filter((log) => log.event_type === this.activeFilter)
      }

      // Filter by date range
      if (this.dateRangeFilter !== 'All Time') {
        const now = new Date()
        let cutoffDate

        switch (this.dateRangeFilter) {
          case 'Last 7 Days':
            cutoffDate = date.subtractFromDate(now, { days: 7 })
            break
          case 'Last 30 Days':
            cutoffDate = date.subtractFromDate(now, { days: 30 })
            break
          case 'Last 90 Days':
            cutoffDate = date.subtractFromDate(now, { days: 90 })
            break
        }

        if (cutoffDate) {
          filtered = filtered.filter((log) => new Date(log.timestamp) >= cutoffDate)
        }
      }

      // Filter by user
      if (this.userFilter) {
        filtered = filtered.filter((log) => log.user_email === this.userFilter)
      }

      return filtered
    },

    stats() {
      // Calculate stats based on filtered logs instead of all logs
      const filtered = this.filteredLogs
      return {
        total: filtered.length,
        screenshots: filtered.filter((log) => log.event_type === 'screenshot_attempt').length,
        devTools: filtered.filter((log) => log.event_type === 'dev_tools_detected').length,
        prints: filtered.filter((log) => log.event_type === 'print_attempt').length,
      }
    },
  },

  setup() {
    const $q = useQuasar()
    return { $q }
  },

  mounted() {
    this.fetchLogs()
  },

  methods: {
    async fetchLogs() {
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('security_logs')
          .select('*')
          .order('timestamp', { ascending: false })

        if (error) throw error

        this.logs = data || []

        // Extract unique users for filter dropdown
        const uniqueEmails = [...new Set(this.logs.map((log) => log.user_email).filter(Boolean))]
        this.allUsers = uniqueEmails.sort()
        this.userOptions = [...this.allUsers]
      } catch (error) {
        console.error('Error fetching security logs:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Failed to fetch security logs',
          position: 'top',
        })
      } finally {
        this.loading = false
      }
    },

    viewLogDetails(log) {
      this.selectedLog = log
      this.showDetailsDialog = true
    },

    formatDate(timestamp) {
      if (!timestamp) return 'N/A'
      return date.formatDate(timestamp, 'YYYY-MM-DD HH:mm:ss')
    },

    getEventColor(eventType) {
      const colors = {
        screenshot_attempt: 'orange',
        print_attempt: 'red',
        copy_attempt: 'deep-orange',
        dev_tools_detected: 'red-10',
        restricted_action: 'warning',
      }
      return colors[eventType] || 'grey'
    },

    filterUsers(val, update) {
      if (val === '') {
        update(() => {
          this.userOptions = [...this.allUsers]
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.userOptions = this.allUsers.filter((email) => email.toLowerCase().includes(needle))
      })
    },

    clearAllFilters() {
      this.activeFilter = 'all'
      this.dateRangeFilter = 'All Time'
      this.userFilter = null
      this.$q.notify({
        type: 'info',
        message: 'All filters cleared',
        position: 'top',
      })
    },

    async exportLogs() {
      try {
        this.$q.loading.show({ message: 'Exporting logs...' })

        // Export filtered logs
        const logsToExport = this.filteredLogs

        // Convert to CSV
        const headers = [
          'Timestamp',
          'Event Type',
          'User Name',
          'User Email',
          'Document Title',
          'Description',
          'User Agent',
        ]
        const csvRows = [headers.join(',')]

        logsToExport.forEach((log) => {
          const row = [
            this.formatDate(log.timestamp),
            log.event_type,
            log.user_name || '',
            log.user_email || '',
            log.metadata?.document_title || '',
            log.description,
            log.user_agent || '',
          ]
          csvRows.push(row.map((field) => `"${field}"`).join(','))
        })

        const csvContent = csvRows.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `security-logs-${date.formatDate(new Date(), 'YYYY-MM-DD')}.csv`
        link.click()
        window.URL.revokeObjectURL(url)

        this.$q.notify({
          type: 'positive',
          message: 'Logs exported successfully',
          position: 'top',
        })
      } catch (error) {
        console.error('Error exporting logs:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Failed to export logs',
          position: 'top',
        })
      } finally {
        this.$q.loading.hide()
      }
    },
  },
})
</script>

<style scoped>
.page-header {
  font-family: 'Poppins', sans-serif;
}

.title {
  font-weight: 600;
}

.subtitle {
  font-weight: 400;
  color: #666;
}

.btn-1 {
  background-color: #f5f5f5;
  color: #666;
  border-radius: 8px;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.btn-1:hover {
  background-color: #e0e0e0;
  color: #333;
}

.btn-1.active {
  background-color: #800000;
  color: white;
}

.filter-select {
  font-family: 'Poppins', sans-serif;
}

.filter-select :deep(.q-field__control) {
  border-radius: 8px;
}

.stat-card {
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>
