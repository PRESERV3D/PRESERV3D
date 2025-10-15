<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">User Management</h2>
      <div class="subtitle-btn-row">
        <h5 class="q-mt-xs q-mb-lg subtitle">
          {{
            isSuperAdmin ? 'Manage all users and administrators' : 'Manage visitor registrations'
          }}
        </h5>
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="isSuperAdmin" class="row q-gutter-md q-mb-md">
      <q-btn
        label="Create New Admin"
        icon="person_add"
        @click="showCreateAdminDialog = true"
        no-caps
        class="btn-1 active"
      />
    </div>

    <!-- Tabs - Conditional based on admin type -->
    <q-tabs
      v-if="isSuperAdmin"
      v-model="activeTab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab name="admins" label="Administrators" />
      <q-tab name="students" label="Students" />
      <q-tab name="faculty" label="Faculty" />
      <q-tab name="visitors" label="Visitors" />
      <q-tab name="registrations" label="Visitor Registrations" />
      <q-tab name="extensions" label="Extension Requests" />
    </q-tabs>

    <!-- Tabs for Regular Admin -->
    <q-tabs
      v-if="!isSuperAdmin"
      v-model="activeTab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab name="registrations" label="Visitor Registrations" />
      <q-tab name="visitors" label="Approved Visitors" />
      <q-tab name="extensions" label="Extension Requests" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-if="isSuperAdmin" v-model="activeTab" animated class="q-mt-md">
      <!-- Administrators Tab -->
      <q-tab-panel name="admins">
        <q-table
          title="Administrators"
          :rows="admins"
          :columns="adminColumns"
          row-key="id"
          :loading="loading"
          :pagination="pagination"
          flat
          bordered
          class="my-sticky-header-table"
        >
          <template v-slot:top-right>
            <q-btn icon="refresh" flat round dense @click="fetchAllUsers" :loading="loading">
              <q-tooltip>Reload Data</q-tooltip>
            </q-btn>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                :style="col.style"
                :align="col.align"
              >
                <template v-if="col.name === 'name'">
                  <span>{{ props.row.first_name }} {{ props.row.last_name }}</span>
                </template>

                <template v-else-if="col.name === 'email'">
                  <div style="max-width: 150px; overflow: hidden; text-overflow: ellipsis">
                    {{ props.row.email }}
                  </div>
                </template>

                <template v-else-if="col.name === 'is_super_admin'">
                  <q-badge v-if="props.row.is_super_admin" color="orange" label="Super Admin" />
                  <q-badge v-else color="blue" label="Admin" />
                </template>

                <template v-else-if="col.name === 'account_status'">
                  <q-badge
                    :color="
                      props.row.account_status === 'Active'
                        ? 'green'
                        : props.row.account_status === 'Inactive'
                          ? 'orange'
                          : 'grey'
                    "
                    :label="props.row.account_status || 'Active'"
                  />
                </template>

                <template v-else-if="col.name === 'email_confirmed_at'">
                  <q-badge v-if="props.row.email_confirmed_at" color="green" label="Verified" />
                  <q-badge v-else color="red" label="Pending" />
                </template>

                <template v-else-if="col.name === 'actions'">
                  <q-btn
                    v-if="!props.row.email_confirmed_at"
                    flat
                    dense
                    round
                    icon="email"
                    color="primary"
                    size="sm"
                    @click="resendConfirmationEmail(props.row)"
                    :loading="resendingEmail === props.row.id"
                    class="q-mr-xs"
                  >
                    <q-tooltip>Resend Email</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="confirmDeleteUser(props.row, 'admin')"
                    :disable="props.row.is_super_admin && props.row.id === userStore.profile?.id"
                  >
                    <q-tooltip>Delete</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    :icon="props.expand ? 'expand_less' : 'expand_more'"
                    @click="props.expand = !props.expand"
                    class="q-mr-xs"
                  >
                    <q-tooltip>{{ props.expand ? 'Collapse' : 'Expand' }}</q-tooltip>
                  </q-btn>
                </template>

                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>

            <!-- Expandable Row -->
            <q-tr v-show="props.expand" :props="props">
              <q-td colspan="100%">
                <div class="q-pa-md" style="background-color: #f5f5f5">
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <div class="text-weight-bold">Full Name:</div>
                      <div>{{ props.row.first_name }} {{ props.row.last_name }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Email:</div>
                      <div>{{ props.row.email }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Contact:</div>
                      <div>{{ props.row.contact }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Last Login:</div>
                      <div>
                        {{
                          props.row.last_login
                            ? new Date(props.row.last_login).toLocaleString()
                            : 'Never'
                        }}
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Created:</div>
                      <div>{{ new Date(props.row.created_at).toLocaleString() }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Email Verified:</div>
                      <div>
                        {{
                          props.row.email_confirmed_at
                            ? new Date(props.row.email_confirmed_at).toLocaleString()
                            : 'Not verified'
                        }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-tab-panel>

      <!-- Students Tab -->
      <q-tab-panel name="students">
        <q-table
          title="Students"
          :rows="students"
          :columns="userColumns"
          row-key="id"
          :loading="loading"
          :pagination="pagination"
          flat
          bordered
          class="my-sticky-header-table"
        >
          <template v-slot:top-right>
            <q-btn icon="refresh" flat round dense @click="fetchAllUsers" :loading="loading">
              <q-tooltip>Reload Data</q-tooltip>
            </q-btn>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                :style="col.style"
                :align="col.align"
              >
                <template v-if="col.name === 'name'">
                  <span>{{ props.row.first_name }} {{ props.row.last_name }}</span>
                </template>

                <template v-else-if="col.name === 'email'">
                  <div style="max-width: 150px; overflow: hidden; text-overflow: ellipsis">
                    {{ props.row.email }}
                  </div>
                </template>

                <template v-else-if="col.name === 'account_status'">
                  <q-badge
                    :color="
                      props.row.account_status === 'Active'
                        ? 'green'
                        : props.row.account_status === 'Inactive'
                          ? 'orange'
                          : 'grey'
                    "
                    :label="props.row.account_status || 'Active'"
                  />
                </template>

                <template v-else-if="col.name === 'actions'">
                  <q-btn
                    flat
                    dense
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="confirmDeleteUser(props.row, 'student')"
                  >
                    <q-tooltip>Delete</q-tooltip>
                  </q-btn>

                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    :icon="props.expand ? 'expand_less' : 'expand_more'"
                    @click="props.expand = !props.expand"
                    class="q-mr-xs"
                  >
                    <q-tooltip>{{ props.expand ? 'Collapse' : 'Expand' }}</q-tooltip>
                  </q-btn>
                </template>

                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>

            <!-- Expandable Row -->
            <q-tr v-show="props.expand" :props="props">
              <q-td colspan="100%">
                <div class="q-pa-md" style="background-color: #f5f5f5">
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <div class="text-weight-bold">Full Name:</div>
                      <div>{{ props.row.first_name }} {{ props.row.last_name }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Email:</div>
                      <div>{{ props.row.email }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Contact:</div>
                      <div>{{ props.row.contact }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Last Login:</div>
                      <div>
                        {{
                          props.row.last_login
                            ? new Date(props.row.last_login).toLocaleString()
                            : 'Never'
                        }}
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Registered:</div>
                      <div>{{ new Date(props.row.created_at).toLocaleString() }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Student Number:</div>
                      <div>{{ props.row.student_number || 'N/A' }}</div>
                    </div>
                  </div>
                </div>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-tab-panel>

      <!-- Faculty Tab -->
      <q-tab-panel name="faculty">
        <q-table
          title="Faculty Members"
          :rows="faculty"
          :columns="userColumns"
          row-key="id"
          :loading="loading"
          :pagination="pagination"
          flat
          bordered
          class="my-sticky-header-table"
        >
          <template v-slot:top-right>
            <q-btn icon="refresh" flat round dense @click="fetchAllUsers" :loading="loading">
              <q-tooltip>Reload Data</q-tooltip>
            </q-btn>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                :style="col.style"
                :align="col.align"
              >
                <template v-if="col.name === 'name'">
                  <span>{{ props.row.first_name }} {{ props.row.last_name }}</span>
                </template>

                <template v-else-if="col.name === 'email'">
                  <div style="max-width: 150px; overflow: hidden; text-overflow: ellipsis">
                    {{ props.row.email }}
                  </div>
                </template>

                <template v-else-if="col.name === 'account_status'">
                  <q-badge
                    :color="
                      props.row.account_status === 'Active'
                        ? 'green'
                        : props.row.account_status === 'Inactive'
                          ? 'orange'
                          : 'grey'
                    "
                    :label="props.row.account_status || 'Active'"
                  />
                </template>

                <template v-else-if="col.name === 'actions'">
                  <q-btn
                    flat
                    dense
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="confirmDeleteUser(props.row, 'faculty')"
                  >
                    <q-tooltip>Delete</q-tooltip>
                  </q-btn>

                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    :icon="props.expand ? 'expand_less' : 'expand_more'"
                    @click="props.expand = !props.expand"
                    class="q-mr-xs"
                  >
                    <q-tooltip>{{ props.expand ? 'Collapse' : 'Expand' }}</q-tooltip>
                  </q-btn>
                </template>

                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>

            <!-- Expandable Row -->
            <q-tr v-show="props.expand" :props="props">
              <q-td colspan="100%">
                <div class="q-pa-md" style="background-color: #f5f5f5">
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <div class="text-weight-bold">Full Name:</div>
                      <div>{{ props.row.first_name }} {{ props.row.last_name }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Email:</div>
                      <div>{{ props.row.email }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Contact:</div>
                      <div>{{ props.row.contact }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Last Login:</div>
                      <div>
                        {{
                          props.row.last_login
                            ? new Date(props.row.last_login).toLocaleString()
                            : 'Never'
                        }}
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Registered:</div>
                      <div>{{ new Date(props.row.created_at).toLocaleString() }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Employee Number:</div>
                      <div>{{ props.row.employee_number || 'N/A' }}</div>
                    </div>
                  </div>
                </div>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-tab-panel>

      <!-- Visitors Tab -->
      <q-tab-panel name="visitors">
        <q-table
          title="Approved Visitors"
          :rows="visitors"
          :columns="visitorColumns"
          row-key="id"
          :loading="loading"
          :pagination="pagination"
          flat
          bordered
          class="my-sticky-header-table"
        >
          <template v-slot:top-right>
            <q-btn icon="refresh" flat round dense @click="fetchAllUsers" :loading="loading">
              <q-tooltip>Reload Data</q-tooltip>
            </q-btn>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                :style="col.style"
                :align="col.align"
              >
                <template v-if="col.name === 'name'">
                  <span>{{ props.row.first_name }} {{ props.row.last_name }}</span>
                </template>

                <template v-else-if="col.name === 'email'">
                  <div style="max-width: 150px; overflow: hidden; text-overflow: ellipsis">
                    {{ props.row.email }}
                  </div>
                </template>

                <template v-else-if="col.name === 'account_status'">
                  <q-badge
                    :color="
                      props.row.account_status === 'Active'
                        ? 'green'
                        : props.row.account_status === 'Expired'
                          ? 'red'
                          : props.row.account_status === 'Inactive'
                            ? 'orange'
                            : 'grey'
                    "
                    :label="props.row.account_status || 'Active'"
                  />
                </template>

                <template v-else-if="col.name === 'end_date'">
                  {{
                    props.row.end_date ? new Date(props.row.end_date).toLocaleDateString() : 'N/A'
                  }}
                </template>

                <template v-else-if="col.name === 'actions'">
                  <q-btn
                    flat
                    dense
                    round
                    icon="event"
                    color="primary"
                    size="sm"
                    @click="openExtendDateDialog(props.row)"
                    class="q-mr-xs"
                  >
                    <q-tooltip>Extend Access</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="confirmDeleteUser(props.row, 'visitor')"
                  >
                    <q-tooltip>Delete</q-tooltip>
                  </q-btn>

                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    :icon="props.expand ? 'expand_less' : 'expand_more'"
                    @click="props.expand = !props.expand"
                    class="q-mr-xs"
                  >
                    <q-tooltip>{{ props.expand ? 'Collapse' : 'Expand' }}</q-tooltip>
                  </q-btn>
                </template>

                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>

            <!-- Expandable Row -->
            <q-tr v-show="props.expand" :props="props">
              <q-td colspan="100%">
                <div class="q-pa-md" style="background-color: #f5f5f5">
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <div class="text-weight-bold">Full Name:</div>
                      <div>{{ props.row.first_name }} {{ props.row.last_name }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Email:</div>
                      <div>{{ props.row.email }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Institution:</div>
                      <div>{{ props.row.institution || 'N/A' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Purpose:</div>
                      <div>{{ props.row.purpose || 'N/A' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Access Period:</div>
                      <div>
                        {{
                          props.row.start_date
                            ? new Date(props.row.start_date).toLocaleDateString()
                            : 'N/A'
                        }}
                        to
                        {{
                          props.row.end_date
                            ? new Date(props.row.end_date).toLocaleDateString()
                            : 'N/A'
                        }}
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Last Login:</div>
                      <div>
                        {{
                          props.row.last_login
                            ? new Date(props.row.last_login).toLocaleString()
                            : 'Never'
                        }}
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Approved By:</div>
                      <div>{{ props.row.approved_by }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Approved At:</div>
                      <div>{{ new Date(props.row.approved_at).toLocaleString() }}</div>
                    </div>
                  </div>
                </div>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-tab-panel>

      <!-- Visitor Registrations Tab (For Super Admin) -->
      <q-tab-panel name="registrations">
        <q-table
          title="Visitor Registrations"
          :rows="registrations"
          :columns="registrationColumns"
          row-key="id"
          :loading="loading"
          :pagination="pagination"
          flat
          bordered
          class="my-sticky-header-table"
        >
          <template v-slot:top-right>
            <q-btn icon="refresh" flat round dense @click="fetchAllUsers" :loading="loading">
              <q-tooltip>Reload Data</q-tooltip>
            </q-btn>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                :style="col.style"
                :align="col.align"
              >
                <template v-if="col.name === 'name'">
                  <span>{{ props.row.first_name }} {{ props.row.last_name }}</span>
                </template>

                <template v-else-if="col.name === 'letter_url'">
                  <a
                    v-if="props.row.letter_url"
                    :href="props.row.letter_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="view-more-link"
                  >
                    Letter
                  </a>
                  <span v-else>N/A</span>
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
                      <q-tooltip>Approve</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      dense
                      round
                      class="status-btn"
                      @click="openConfirmDialog(props.row, 'Rejected')"
                    >
                      <q-icon name="close" color="red" size="18px" />
                      <q-tooltip>Reject</q-tooltip>
                    </q-btn>
                  </template>

                  <template v-else>
                    <q-badge
                      :color="props.row.status === 'Approved' ? 'green' : 'red'"
                      :label="props.row.status"
                    />
                  </template>
                </template>

                <template v-else-if="col.name === 'actions'">
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    :icon="props.expand ? 'expand_less' : 'expand_more'"
                    @click="props.expand = !props.expand"
                  >
                    <q-tooltip>{{ props.expand ? 'Collapse' : 'Expand' }}</q-tooltip>
                  </q-btn>
                </template>

                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>

            <!-- Expandable Row -->
            <q-tr v-show="props.expand" :props="props">
              <q-td colspan="100%">
                <div class="q-pa-md" style="background-color: #f5f5f5">
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <div class="text-weight-bold">Full Name:</div>
                      <div>{{ props.row.first_name }} {{ props.row.last_name }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Email:</div>
                      <div>{{ props.row.email }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Institution:</div>
                      <div>{{ props.row.institution || 'N/A' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Purpose:</div>
                      <div>{{ props.row.purpose || 'N/A' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Date Filed:</div>
                      <div>{{ new Date(props.row.created_at).toLocaleDateString() }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Requested Period:</div>
                      <div>
                        {{ props.row.start_date || 'N/A' }} to {{ props.row.end_date || 'N/A' }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-tab-panel>

      <!-- Extension Requests Tab (For Super Admin) -->
      <q-tab-panel name="extensions">
        <q-table
          title="Visitor Extension Requests"
          :rows="extensionRequests"
          :columns="extensionColumns"
          row-key="id"
          :loading="loading"
          :pagination="pagination"
          flat
          bordered
          class="my-sticky-header-table"
        >
          <template v-slot:top-right>
            <q-btn icon="refresh" flat round dense @click="fetchAllUsers" :loading="loading">
              <q-tooltip>Reload Data</q-tooltip>
            </q-btn>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                :style="col.style"
                :align="col.align"
              >
                <template v-if="col.name === 'visitor_name'">
                  <span>{{ props.row.visitor_name }}</span>
                </template>

                <template v-else-if="col.name === 'old_end_date'">
                  {{
                    props.row.old_end_date
                      ? new Date(props.row.old_end_date).toLocaleDateString()
                      : 'N/A'
                  }}
                </template>

                <template v-else-if="col.name === 'extended_end_date'">
                  {{
                    props.row.extended_end_date
                      ? new Date(props.row.extended_end_date).toLocaleDateString()
                      : 'N/A'
                  }}
                </template>

                <template v-else-if="col.name === 'letter'">
                  <a
                    v-if="props.row.letter"
                    :href="props.row.letter"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="view-more-link"
                  >
                    View Letter
                  </a>
                  <span v-else>Not Required</span>
                </template>

                <template v-else-if="col.name === 'extension_status'">
                  <template v-if="props.row.extension_status === 'Pending'">
                    <q-btn
                      flat
                      dense
                      round
                      class="status-btn"
                      @click="openExtensionDialog(props.row, 'Approved')"
                    >
                      <q-icon name="check" color="green" size="18px" />
                      <q-tooltip>Approve</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      dense
                      round
                      class="status-btn"
                      @click="openExtensionDialog(props.row, 'Rejected')"
                    >
                      <q-icon name="close" color="red" size="18px" />
                      <q-tooltip>Reject</q-tooltip>
                    </q-btn>
                  </template>

                  <template v-else>
                    <q-badge
                      :color="
                        props.row.extension_status === 'Approved'
                          ? 'green'
                          : props.row.extension_status === 'Rejected'
                            ? 'red'
                            : 'grey'
                      "
                      :label="props.row.extension_status"
                    />
                  </template>
                </template>

                <template v-else-if="col.name === 'actions'">
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    :icon="props.expand ? 'expand_less' : 'expand_more'"
                    @click="props.expand = !props.expand"
                  >
                    <q-tooltip>{{ props.expand ? 'Collapse' : 'Expand' }}</q-tooltip>
                  </q-btn>
                </template>

                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>

            <!-- Expandable Row -->
            <q-tr v-show="props.expand" :props="props">
              <q-td colspan="100%">
                <div class="q-pa-md" style="background-color: #f5f5f5">
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <div class="text-weight-bold">Email:</div>
                      <div>{{ props.row.visitor_email || '' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Date Submitted:</div>
                      <div>
                        {{
                          props.row.created_at
                            ? new Date(props.row.created_at).toLocaleString()
                            : ''
                        }}
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Reviewed By:</div>
                      <div>{{ props.row.reviewed_by || '' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Reviewed At:</div>
                      <div>
                        {{
                          props.row.reviewed_at
                            ? new Date(props.row.reviewed_at).toLocaleString()
                            : ''
                        }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Regular Admin View - Approved Visitors and Registrations -->
    <q-tab-panels v-if="!isSuperAdmin" v-model="activeTab" animated class="q-mt-md">
      <!-- Visitor Registrations Tab -->
      <q-tab-panel name="registrations">
        <q-table
          title="Visitor Registrations"
          :rows="registrations"
          :columns="registrationColumns"
          row-key="id"
          :loading="loading"
          :pagination="pagination"
          flat
          bordered
          class="my-sticky-header-table"
        >
          <template v-slot:top-right>
            <q-btn icon="refresh" flat round dense @click="fetchAllUsers" :loading="loading">
              <q-tooltip>Reload Data</q-tooltip>
            </q-btn>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                :style="col.style"
                :align="col.align"
              >
                <template v-if="col.name === 'name'">
                  <span>{{ props.row.first_name }} {{ props.row.last_name }}</span>
                </template>

                <template v-else-if="col.name === 'letter_url'">
                  <a
                    v-if="props.row.letter_url"
                    :href="props.row.letter_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="view-more-link"
                  >
                    Letter
                  </a>
                  <span v-else>N/A</span>
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
                      <q-tooltip>Approve</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      dense
                      round
                      class="status-btn"
                      @click="openConfirmDialog(props.row, 'Rejected')"
                    >
                      <q-icon name="close" color="red" size="18px" />
                      <q-tooltip>Reject</q-tooltip>
                    </q-btn>
                  </template>

                  <template v-else>
                    <q-badge
                      :color="props.row.status === 'Approved' ? 'green' : 'red'"
                      :label="props.row.status"
                    />
                  </template>
                </template>

                <template v-else-if="col.name === 'actions'">
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    :icon="props.expand ? 'expand_less' : 'expand_more'"
                    @click="props.expand = !props.expand"
                  >
                    <q-tooltip>{{ props.expand ? 'Collapse' : 'Expand' }}</q-tooltip>
                  </q-btn>
                </template>

                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>

            <!-- Expandable Row -->
            <q-tr v-show="props.expand" :props="props">
              <q-td colspan="100%">
                <div class="q-pa-md" style="background-color: #f5f5f5">
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <div class="text-weight-bold">Full Name:</div>
                      <div>{{ props.row.first_name }} {{ props.row.last_name }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Email:</div>
                      <div>{{ props.row.email }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Institution:</div>
                      <div>{{ props.row.institution || 'N/A' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Purpose:</div>
                      <div>{{ props.row.purpose || 'N/A' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Date Filed:</div>
                      <div>{{ new Date(props.row.created_at).toLocaleDateString() }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Requested Period:</div>
                      <div>
                        {{ props.row.start_date || 'N/A' }} to {{ props.row.end_date || 'N/A' }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-tab-panel>

      <!-- Approved Visitors Tab -->
      <q-tab-panel name="visitors">
        <q-table
          title="Approved Visitors"
          :rows="visitors"
          :columns="visitorColumns"
          row-key="id"
          :loading="loading"
          :pagination="pagination"
          flat
          bordered
          class="my-sticky-header-table"
        >
          <template v-slot:top-right>
            <q-btn icon="refresh" flat round dense @click="fetchAllUsers" :loading="loading">
              <q-tooltip>Reload Data</q-tooltip>
            </q-btn>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                :style="col.style"
                :align="col.align"
              >
                <template v-if="col.name === 'name'">
                  <span>{{ props.row.first_name }} {{ props.row.last_name }}</span>
                </template>

                <template v-else-if="col.name === 'email'">
                  <div style="max-width: 150px; overflow: hidden; text-overflow: ellipsis">
                    {{ props.row.email }}
                  </div>
                </template>

                <template v-else-if="col.name === 'account_status'">
                  <q-badge
                    :color="
                      props.row.account_status === 'Active'
                        ? 'green'
                        : props.row.account_status === 'Expired'
                          ? 'red'
                          : props.row.account_status === 'Inactive'
                            ? 'orange'
                            : 'grey'
                    "
                    :label="props.row.account_status || 'Active'"
                  />
                </template>

                <template v-else-if="col.name === 'end_date'">
                  {{
                    props.row.end_date ? new Date(props.row.end_date).toLocaleDateString() : 'N/A'
                  }}
                </template>

                <template v-else-if="col.name === 'actions'">
                  <q-btn
                    flat
                    dense
                    round
                    icon="event"
                    color="primary"
                    size="sm"
                    @click="openExtendDateDialog(props.row)"
                    class="q-mr-xs"
                  >
                    <q-tooltip>Extend Access</q-tooltip>
                  </q-btn>

                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    :icon="props.expand ? 'expand_less' : 'expand_more'"
                    @click="props.expand = !props.expand"
                    class="q-mr-xs"
                  >
                    <q-tooltip>{{ props.expand ? 'Collapse' : 'Expand' }}</q-tooltip>
                  </q-btn>
                </template>

                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>

            <!-- Expandable Row -->
            <q-tr v-show="props.expand" :props="props">
              <q-td colspan="100%">
                <div class="q-pa-md" style="background-color: #f5f5f5">
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <div class="text-weight-bold">Full Name:</div>
                      <div>{{ props.row.first_name }} {{ props.row.last_name }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Email:</div>
                      <div>{{ props.row.email }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Institution:</div>
                      <div>{{ props.row.institution || 'N/A' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Purpose:</div>
                      <div>{{ props.row.purpose || 'N/A' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Access Period:</div>
                      <div>
                        {{
                          props.row.start_date
                            ? new Date(props.row.start_date).toLocaleDateString()
                            : 'N/A'
                        }}
                        to
                        {{
                          props.row.end_date
                            ? new Date(props.row.end_date).toLocaleDateString()
                            : 'N/A'
                        }}
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Last Login:</div>
                      <div>
                        {{
                          props.row.last_login
                            ? new Date(props.row.last_login).toLocaleString()
                            : 'Never'
                        }}
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Approved By:</div>
                      <div>{{ props.row.approved_by }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Approved At:</div>
                      <div>{{ new Date(props.row.approved_at).toLocaleString() }}</div>
                    </div>
                  </div>
                </div>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-tab-panel>

      <!-- Extension Requests Tab (For Regular Admin) -->
      <q-tab-panel name="extensions">
        <q-table
          title="Visitor Extension Requests"
          :rows="extensionRequests"
          :columns="extensionColumns"
          row-key="id"
          :loading="loading"
          :pagination="pagination"
          flat
          bordered
          class="my-sticky-header-table"
        >
          <template v-slot:top-right>
            <q-btn icon="refresh" flat round dense @click="fetchAllUsers" :loading="loading">
              <q-tooltip>Reload Data</q-tooltip>
            </q-btn>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                :style="col.style"
                :align="col.align"
              >
                <template v-if="col.name === 'visitor_name'">
                  <span>{{ props.row.visitor_name }}</span>
                </template>

                <template v-else-if="col.name === 'old_end_date'">
                  {{
                    props.row.old_end_date
                      ? new Date(props.row.old_end_date).toLocaleDateString()
                      : 'N/A'
                  }}
                </template>

                <template v-else-if="col.name === 'extended_end_date'">
                  {{
                    props.row.extended_end_date
                      ? new Date(props.row.extended_end_date).toLocaleDateString()
                      : 'N/A'
                  }}
                </template>

                <template v-else-if="col.name === 'letter'">
                  <a
                    v-if="props.row.letter"
                    :href="props.row.letter"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="view-more-link"
                  >
                    View Letter
                  </a>
                  <span v-else>Not Required</span>
                </template>

                <template v-else-if="col.name === 'extension_status'">
                  <template v-if="props.row.extension_status === 'Pending'">
                    <q-btn
                      flat
                      dense
                      round
                      class="status-btn"
                      @click="openExtensionDialog(props.row, 'Approved')"
                    >
                      <q-icon name="check" color="green" size="18px" />
                      <q-tooltip>Approve</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      dense
                      round
                      class="status-btn"
                      @click="openExtensionDialog(props.row, 'Rejected')"
                    >
                      <q-icon name="close" color="red" size="18px" />
                      <q-tooltip>Reject</q-tooltip>
                    </q-btn>
                  </template>

                  <template v-else>
                    <q-badge
                      :color="
                        props.row.extension_status === 'Approved'
                          ? 'green'
                          : props.row.extension_status === 'Rejected'
                            ? 'red'
                            : 'grey'
                      "
                      :label="props.row.extension_status"
                    />
                  </template>
                </template>

                <template v-else-if="col.name === 'actions'">
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    :icon="props.expand ? 'expand_less' : 'expand_more'"
                    @click="props.expand = !props.expand"
                  >
                    <q-tooltip>{{ props.expand ? 'Collapse' : 'Expand' }}</q-tooltip>
                  </q-btn>
                </template>

                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>

            <!-- Expandable Row -->
            <q-tr v-show="props.expand" :props="props">
              <q-td colspan="100%">
                <div class="q-pa-md" style="background-color: #f5f5f5">
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <div class="text-weight-bold">Email:</div>
                      <div>{{ props.row.visitor_email || '' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Date Submitted:</div>
                      <div>
                        {{
                          props.row.created_at
                            ? new Date(props.row.created_at).toLocaleString()
                            : ''
                        }}
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Reviewed By:</div>
                      <div>{{ props.row.reviewed_by || '' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-weight-bold">Reviewed At:</div>
                      <div>
                        {{
                          props.row.reviewed_at
                            ? new Date(props.row.reviewed_at).toLocaleString()
                            : ''
                        }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Confirmation Dialog for Approve/Reject -->
    <q-dialog v-model="showConfirmDialog" persistent>
      <q-card class="conf-box">
        <q-card-section v-if="!isProcessingRegistration" class="sub-font" style="color: black">
          Are you sure you want to set this referral letter as {{ confirmAction }}?
        </q-card-section>
        <q-card-section v-else class="column items-center q-gutter-md" style="min-height: 100px">
          <q-spinner-dots color="primary" size="50px" />
          <div class="sub-font-2" style="color: #560505">
            {{ confirmAction === 'Approved' ? 'Approving visitor...' : 'Rejecting visitor...' }}
          </div>
          <div class="sub-font-2" style="color: #666; font-size: 12px">
            {{
              confirmAction === 'Approved'
                ? 'Creating account and sending emails...'
                : 'Sending notification...'
            }}
          </div>
        </q-card-section>
        <q-card-actions v-if="!isProcessingRegistration" align="center">
          <q-btn flat label="Yes" class="btn-save" @click="confirmRegistrationAction" />
          <q-btn flat label="No" class="sub-font-2" style="color: #000000" v-close-popup no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Create Admin Dialog -->
    <q-dialog v-model="showCreateAdminDialog">
      <q-card class="create-admin-card">
        <q-card-section class="row items-center">
          <div class="text-h6">Create New Admin Account</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="createAdmin">
            <q-input
              filled
              v-model="newAdmin.first_name"
              label="First Name"
              :rules="[(val) => !!val || 'First name is required']"
              class="q-mb-md"
            />
            <q-input
              filled
              v-model="newAdmin.last_name"
              label="Last Name"
              :rules="[(val) => !!val || 'Last name is required']"
              class="q-mb-md"
            />
            <q-input
              filled
              v-model="newAdmin.email"
              label="Email"
              type="email"
              :rules="[
                (val) => !!val || 'Email is required',
                (val) => val.includes('@') || 'Must use a valid email',
              ]"
              class="q-mb-md"
            />
            <q-input
              filled
              v-model="newAdmin.contact"
              label="Contact Number"
              :rules="[(val) => !!val || 'Contact number is required']"
              class="q-mb-md"
            />

            <q-checkbox
              v-model="newAdmin.is_super_admin"
              label="Grant Super Admin privileges"
              class="q-mb-md"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" v-close-popup no-caps />
              <q-btn
                type="submit"
                label="Create Admin"
                color="primary"
                :loading="creatingAdmin"
                no-caps
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card class="conf-box">
        <q-card-section class="sub-font" style="color: black">
          Are you sure you want to delete this user account?<br />
          <strong>{{ deleteTarget?.first_name }} {{ deleteTarget?.last_name }}</strong
          ><br />
          <span style="color: red; font-size: 12px">This action cannot be undone.</span>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn
            flat
            label="Delete"
            class="btn-delete"
            style="background-color: #d32f2f; color: white"
            @click="deleteUser"
            :loading="deleting"
          />
          <q-btn
            flat
            label="Cancel"
            class="sub-font-2"
            style="color: #000000"
            v-close-popup
            no-caps
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Success Dialog -->
    <q-dialog v-model="showSuccessDialog">
      <q-card class="sucess-add-to-collection">
        <q-card-section class="sub-font-3" style="font-size: 20px; font-weight: 700">{{
          successTitle
        }}</q-card-section>
        <q-card-section class="sub-font-3" style="font-size: 14px; font-weight: 400">{{
          successMessage
        }}</q-card-section>
        <q-card-actions>
          <q-btn flat label="Okay" class="btn-save" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Extend Date Dialog -->
    <q-dialog v-model="showExtendDateDialog">
      <q-card class="create-admin-card">
        <q-card-section class="row items-center">
          <div class="text-h6">Extend Visitor Access Period</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedVisitor">
          <div class="q-mb-md">
            <strong>Visitor:</strong> {{ selectedVisitor.first_name }}
            {{ selectedVisitor.last_name }}
          </div>
          <div class="q-mb-md"><strong>Email:</strong> {{ selectedVisitor.email }}</div>
          <div class="q-mb-md">
            <strong>Current Period:</strong>
            {{
              selectedVisitor.start_date
                ? new Date(selectedVisitor.start_date).toLocaleDateString()
                : 'N/A'
            }}
            to
            {{
              selectedVisitor.end_date
                ? new Date(selectedVisitor.end_date).toLocaleDateString()
                : 'N/A'
            }}
          </div>

          <q-form @submit.prevent="updateVisitorDates">
            <q-input
              filled
              v-model="visitorDates.start_date"
              label="Start Date"
              type="date"
              :rules="[(val) => !!val || 'Start date is required']"
              class="q-mb-md"
            />
            <q-input
              filled
              v-model="visitorDates.end_date"
              label="End Date"
              type="date"
              :rules="[
                (val) => !!val || 'End date is required',
                (val) => val >= visitorDates.start_date || 'End date must be after start date',
              ]"
              class="q-mb-md"
            />

            <q-card-actions align="right">
              <q-btn flat label="Cancel" v-close-popup no-caps />
              <q-btn
                type="submit"
                label="Update Dates"
                color="primary"
                :loading="updatingDates"
                no-caps
              />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Extension Request Dialog -->
    <q-dialog v-model="showExtensionDialog" persistent>
      <q-card class="conf-box">
        <q-card-section v-if="!isProcessingExtension" class="sub-font" style="color: black">
          Are you sure you want to {{ extensionAction.toLowerCase() }} this extension request?
        </q-card-section>
        <q-card-section v-else class="column items-center q-gutter-md" style="min-height: 100px">
          <q-spinner-dots color="primary" size="50px" />
          <q-card-section class="sub-font-2" style="color: #560505">
            {{
              extensionAction === 'Approved' ? 'Approving extension...' : 'Rejecting extension...'
            }}
          </q-card-section>
        </q-card-section>
        <q-card-actions v-if="!isProcessingExtension" align="center">
          <q-btn flat label="Yes" class="btn-save" @click="processExtensionRequest" />
          <q-btn flat label="No" class="sub-font-2" style="color: #000000" v-close-popup no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { supabase, supabaseAdmin } from 'boot/supabase'
import { useUserStore } from 'stores/user'
import { useRoute } from 'vue-router'
import { createNotification } from '/services/email_service.js'

const $q = useQuasar()
const userStore = useUserStore()
const route = useRoute()

// Helper: get the most recent login timestamp from `logins` table for a user
async function getLastLogin(userId) {
  if (!userId) return null
  try {
    const { data, error } = await supabaseAdmin
      .from('logins')
      .select('login_at')
      .eq('user_id', userId)
      .order('login_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching last login from logins table:', error)
      return null
    }

    return data?.login_at || null
  } catch (err) {
    console.error('Unexpected error in getLastLogin:', err)
    return null
  }
}

// Computed property to check if user is super admin
const isSuperAdmin = computed(() => {
  return userStore.profile?.is_super_admin === true
})

const activeTab = ref('admins')
const loading = ref(false)
const creatingAdmin = ref(false)
const deleting = ref(false)
const resendingEmail = ref(null)
const updatingDates = ref(false)

const admins = ref([])
const students = ref([])
const faculty = ref([])
const visitors = ref([])
const registrations = ref([])
const extensionRequests = ref([])

const showCreateAdminDialog = ref(false)
const showDeleteDialog = ref(false)
const showSuccessDialog = ref(false)
const showExtendDateDialog = ref(false)
const showConfirmDialog = ref(false)
const showExtensionDialog = ref(false)
const isProcessingRegistration = ref(false)
const isProcessingExtension = ref(false)
const successTitle = ref('')
const successMessage = ref('')

const deleteTarget = ref(null)
const deleteType = ref('')
const selectedVisitor = ref(null)
const confirmTarget = ref(null)
const confirmAction = ref('')
const extensionTarget = ref(null)
const extensionAction = ref('')

const visitorDates = ref({
  start_date: '',
  end_date: '',
})

const newAdmin = ref({
  first_name: '',
  last_name: '',
  email: '',
  contact: '',
  is_super_admin: false,
})

const pagination = {
  page: 1,
  rowsPerPage: 10,
}

const adminColumns = [
  { name: 'name', label: 'Name', align: 'left', field: 'first_name', sortable: true },
  {
    name: 'email',
    label: 'Email',
    align: 'left',
    field: 'email',
    sortable: true,
    style: 'max-width: 150px; overflow: hidden; text-overflow: ellipsis;',
  },
  { name: 'is_super_admin', label: 'Role', align: 'center', field: 'is_super_admin' },
  {
    name: 'account_status',
    label: 'Status',
    align: 'center',
    field: 'account_status',
    sortable: true,
  },
  {
    name: 'email_confirmed_at',
    label: 'Email',
    align: 'center',
    field: 'email_confirmed_at',
  },
  { name: 'actions', label: 'Actions', align: 'center', field: 'actions' },
]

const userColumns = [
  { name: 'name', label: 'Name', align: 'left', field: 'first_name', sortable: true },
  {
    name: 'email',
    label: 'Email',
    align: 'left',
    field: 'email',
    sortable: true,
    style: 'max-width: 150px; overflow: hidden; text-overflow: ellipsis;',
  },
  {
    name: 'account_status',
    label: 'Status',
    align: 'center',
    field: 'account_status',
    sortable: true,
  },
  { name: 'actions', label: 'Actions', align: 'center', field: 'actions' },
]

const visitorColumns = [
  { name: 'name', label: 'Name', align: 'left', field: 'first_name', sortable: true },
  {
    name: 'email',
    label: 'Email',
    align: 'left',
    field: 'email',
    sortable: true,
    style: 'max-width: 150px; overflow: hidden; text-overflow: ellipsis;',
  },
  {
    name: 'account_status',
    label: 'Status',
    align: 'center',
    field: 'account_status',
    sortable: true,
  },
  {
    name: 'end_date',
    label: 'End Date',
    align: 'center',
    field: (row) => (row.end_date ? new Date(row.end_date).toLocaleDateString() : 'N/A'),
    sortable: true,
  },
  { name: 'actions', label: 'Actions', align: 'center', field: 'actions' },
]

const registrationColumns = [
  { name: 'name', label: 'Name', align: 'center', field: 'first_name', sortable: true },
  { name: 'institution', label: 'Institution', align: 'center', field: 'institution' },
  { name: 'purpose', label: 'Purpose', align: 'center', field: 'purpose' },
  { name: 'letter_url', label: 'Letter', align: 'center', field: 'letter_url' },
  {
    name: 'created_at',
    label: 'Date Filed',
    align: 'center',
    field: (row) => new Date(row.created_at).toLocaleDateString('en-CA'),
  },
  { name: 'start_date', label: 'Start Date', align: 'center', field: 'start_date' },
  { name: 'end_date', label: 'End Date', align: 'center', field: 'end_date' },
  { name: 'status', label: 'Status', align: 'center', field: 'status' },
  { name: 'actions', label: '', align: 'center', field: 'actions' },
]

const extensionColumns = [
  { name: 'visitor_name', label: 'Name', align: 'left', field: 'visitor_name', sortable: true },
  {
    name: 'old_end_date',
    label: 'Current End Date',
    align: 'center',
    field: 'old_end_date',
    sortable: true,
  },
  {
    name: 'extended_end_date',
    label: 'Requested End Date',
    align: 'center',
    field: 'extended_end_date',
    sortable: true,
  },
  { name: 'purpose', label: 'Reason', align: 'center', field: 'purpose' },
  { name: 'letter', label: 'Letter', align: 'center', field: 'letter' },
  {
    name: 'extension_status',
    label: 'Status',
    align: 'center',
    field: 'extension_status',
    sortable: true,
  },
  { name: 'actions', label: '', align: 'center', field: 'actions' },
]

onMounted(async () => {
  await fetchAllUsers()

  // Check if there's a tab query parameter
  const tabParam = route.query.tab
  if (tabParam) {
    activeTab.value = tabParam
  } else {
    // Set default tab for regular admins
    if (!isSuperAdmin.value) {
      activeTab.value = 'registrations'
    }
  }
})

async function fetchAllUsers() {
  loading.value = true
  try {
    // Fetch admins with email confirmation status from auth.users
    const { data: adminData, error: adminError } = await supabase
      .from('registered_admins')
      .select('*')
      .order('created_at', { ascending: false })

    if (adminError) throw adminError

    // Fetch email confirmation status for each admin
    if (adminData && adminData.length > 0) {
      const adminsWithStatus = await Promise.all(
        adminData.map(async (admin) => {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(admin.id)
          const loginTime = await getLastLogin(admin.id)
          return {
            ...admin,
            email_confirmed_at: authUser?.user?.email_confirmed_at || null,
            // Prefer logins table timestamp; fall back to auth.users.last_sign_in_at
            last_login: loginTime || null,
          }
        }),
      )
      admins.value = adminsWithStatus
    } else {
      admins.value = []
    }

    // Fetch students with last_sign_in_at from auth.users
    const { data: studentData, error: studentError } = await supabase
      .from('registered_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (studentError) throw studentError

    // Add last_sign_in_at to students
    if (studentData && studentData.length > 0) {
      const studentsWithLogin = await Promise.all(
        studentData.map(async (student) => {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(student.id)
          const loginTime = await getLastLogin(student.id)
          return {
            ...student,
            last_login: loginTime || authUser?.user?.last_sign_in_at || null,
          }
        }),
      )
      students.value = studentsWithLogin
    } else {
      students.value = []
    }

    // Fetch faculty with last_sign_in_at from auth.users
    const { data: facultyData, error: facultyError } = await supabase
      .from('registered_faculty')
      .select('*')
      .order('created_at', { ascending: false })

    if (facultyError) throw facultyError

    // Add last_sign_in_at to faculty
    if (facultyData && facultyData.length > 0) {
      const facultyWithLogin = await Promise.all(
        facultyData.map(async (faculty) => {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(faculty.id)
          const loginTime = await getLastLogin(faculty.id)
          return {
            ...faculty,
            last_login: loginTime || authUser?.user?.last_sign_in_at || null,
          }
        }),
      )
      faculty.value = facultyWithLogin
    } else {
      faculty.value = []
    }

    // Fetch visitors using the approved_visitors_status view (includes account_status calculation)
    const { data: visitorData, error: visitorError } = await supabase
      .from('approved_visitors_status')
      .select(
        `
        *,
        registration:registration_visitors(
          first_name,
          last_name,
          contact,
          institution,
          purpose
        )
      `,
      )
      .order('start_date', { ascending: false })

    if (visitorError) throw visitorError

    // Add last_sign_in_at and flatten registration data
    if (visitorData && visitorData.length > 0) {
      const visitorsWithLogin = await Promise.all(
        visitorData.map(async (visitor) => {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(visitor.user_id)
          const loginTime = await getLastLogin(visitor.user_id)

          return {
            ...visitor,
            id: visitor.user_id, // For compatibility with existing code
            first_name: visitor.registration?.first_name,
            last_name: visitor.registration?.last_name,
            contact: visitor.registration?.contact,
            institution: visitor.registration?.institution,
            purpose: visitor.registration?.purpose,
            last_login: loginTime || authUser?.user?.last_sign_in_at || null,
          }
        }),
      )
      visitors.value = visitorsWithLogin
    } else {
      visitors.value = []
    }

    // Fetch visitor registrations
    const { data: registrationData, error: registrationError } = await supabase
      .from('registration_visitors')
      .select('*')
      .order('created_at', { ascending: false })

    if (registrationError) throw registrationError

    // Sort registrations - pending first, then by date
    registrations.value = sortRegistrations(registrationData || [])

    // Fetch extension requests with visitor information
    const { data: extensionData, error: extensionError } = await supabase
      .from('account_extensions')
      .select(
        `
        *,
        visitor:approved_visitors!account_extensions_approval_id_fkey(
          user_id,
          email,
          registration:registration_visitors(
            first_name,
            last_name
          )
        )
      `,
      )
      .order('created_at', { ascending: false })

    if (extensionError) {
      console.error('Error fetching extensions:', extensionError)
    } else {
      // Format extension data with visitor names
      extensionRequests.value =
        extensionData?.map((ext) => ({
          ...ext,
          visitor_name: ext.visitor?.registration
            ? `${ext.visitor.registration.first_name} ${ext.visitor.registration.last_name}`
            : 'Unknown',
          visitor_email: ext.visitor?.email || 'N/A',
        })) || []
      console.log('Loaded extension requests:', extensionRequests.value.length)
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load users',
    })
  } finally {
    loading.value = false
  }
}

// Sort registrations - Pending first, then by created_at
function sortRegistrations(data) {
  return data.sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1
    if (a.status !== 'Pending' && b.status === 'Pending') return 1
    return new Date(b.created_at) - new Date(a.created_at)
  })
}

async function createAdmin() {
  if (
    !newAdmin.value.first_name ||
    !newAdmin.value.last_name ||
    !newAdmin.value.email ||
    !newAdmin.value.contact
  ) {
    $q.notify({
      type: 'warning',
      message: 'Please fill out all required fields',
    })
    return
  }

  // if (!newAdmin.value.email.includes('@iskolarngbayan.pup.edu.ph')) {
  //   $q.notify({
  //     type: 'warning',
  //     message: 'Must use PUP email address',
  //   })
  //   return
  // }

  creatingAdmin.value = true

  try {
    // Generate a temporary password
    const tempPassword = generateTempPassword()

    // Create user in Supabase Auth with email confirmation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newAdmin.value.email,
      password: tempPassword,
      options: {
        data: {
          role: 'admin',
          type: 'admin',
          is_super_admin: newAdmin.value.is_super_admin,
        },
        emailRedirectTo: `${window.location.origin}/resetpassword`,
      },
    })

    if (authError) throw authError

    // Insert into registered_admins table
    const { error: insertError } = await supabase.from('registered_admins').insert([
      {
        id: authData.user.id,
        first_name: newAdmin.value.first_name,
        last_name: newAdmin.value.last_name,
        email: newAdmin.value.email,
        contact: newAdmin.value.contact,
        is_super_admin: newAdmin.value.is_super_admin,
        created_at: new Date(),
      },
    ])

    if (insertError) throw insertError

    // Insert into all_users table
    const { error: allUserError } = await supabase.from('all_users').insert([
      {
        id: authData.user.id,
        email: newAdmin.value.email,
        created_at: new Date(),
        user_type: 'admin',
      },
    ])

    if (allUserError) throw allUserError

    successTitle.value = 'Admin Created Successfully'
    successMessage.value = `An email has been sent to ${newAdmin.value.email} with instructions to set their password.`
    showSuccessDialog.value = true
    showCreateAdminDialog.value = false

    // Reset form
    newAdmin.value = {
      first_name: '',
      last_name: '',
      email: '',
      contact: '',
      is_super_admin: false,
    }

    // Refresh the admins list
    await fetchAllUsers()
  } catch (error) {
    console.error('Error creating admin:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to create admin account',
    })
  } finally {
    creatingAdmin.value = false
  }
}

function generateTempPassword(length = 16) {
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{};\'":|<>?,./`~'

  let password = ''
  password += lower[Math.floor(Math.random() * lower.length)]
  password += upper[Math.floor(Math.random() * upper.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  const allChars = lower + upper + numbers + symbols
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  password = password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('')
  return password
}

function confirmDeleteUser(user, type) {
  deleteTarget.value = user
  deleteType.value = type
  showDeleteDialog.value = true
}

async function deleteUser() {
  if (!deleteTarget.value) return

  deleting.value = true

  try {
    const userId = deleteTarget.value.id

    // Determine which table to delete from
    let tableName = ''
    switch (deleteType.value) {
      case 'admin':
        tableName = 'registered_admins'
        break
      case 'student':
        tableName = 'registered_users'
        break
      case 'faculty':
        tableName = 'registered_faculty'
        break
      case 'visitor':
        tableName = 'approved_visitors'
        break
    }

    // Delete all related records with FK constraints
    await supabaseAdmin.from('collections').delete().eq('user_id', userId)
    await supabaseAdmin.from('appointment_booking').delete().eq('user_id', userId)
    await supabaseAdmin.from('notifications').delete().eq('receiver_id', userId)
    await supabaseAdmin.from('logins').delete().eq('user_id', userId)

    // Anonymize logs for audit trail
    await supabaseAdmin
      .from('user_activity_log')
      .update({ user_type: 'deleted_user' })
      .eq('user_id', userId)

    await supabaseAdmin
      .from('security_logs')
      .update({ user_email: '[deleted]', user_name: '[deleted]' })
      .eq('user_id', userId)

    // Delete collection items
    const { data: userCollections } = await supabaseAdmin
      .from('collections')
      .select('collection_id')
      .eq('user_id', userId)

    if (userCollections?.length > 0) {
      const collectionIds = userCollections.map((c) => c.collection_id)
      await supabaseAdmin.from('collection_items').delete().in('collection_id', collectionIds)
    }

    // Delete from specific user table
    if (deleteType.value === 'visitor') {
      const { error: deleteError } = await supabase.from(tableName).delete().eq('user_id', userId)
      if (deleteError) throw deleteError
    } else {
      const { error: deleteError } = await supabase.from(tableName).delete().eq('id', userId)
      if (deleteError) throw deleteError
    }

    // Delete from all_users table
    await supabase.from('all_users').delete().eq('id', userId)

    // Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      $q.notify({
        type: 'warning',
        message: 'User deleted from system',
        caption: 'Auth cleanup incomplete but user cannot access the system.',
      })
    } else {
      $q.notify({
        type: 'positive',
        message: 'User deleted successfully',
      })
    }

    showDeleteDialog.value = false
    deleteTarget.value = null
    deleteType.value = ''

    loading.value = true

    // Clear the arrays first to ensure fresh data
    admins.value = []
    students.value = []
    faculty.value = []
    visitors.value = []

    await fetchAllUsers()
    loading.value = false
  } catch (error) {
    console.error('Error deleting user:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to delete user',
    })
  } finally {
    deleting.value = false
  }
}

async function resendConfirmationEmail(admin) {
  resendingEmail.value = admin.id

  try {
    // Use the admin API to resend confirmation email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: admin.email,
      options: {
        emailRedirectTo: `${window.location.origin}/resetpassword`,
      },
    })

    if (error) throw error

    $q.notify({
      type: 'positive',
      message: `Confirmation email resent to ${admin.email}`,
      caption: 'The admin will receive a new verification link',
    })
  } catch (error) {
    console.error('Error resending confirmation email:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to resend confirmation email',
      caption: error.message,
    })
  } finally {
    resendingEmail.value = null
  }
}

function openExtendDateDialog(visitor) {
  selectedVisitor.value = visitor
  // Pre-fill with current dates or set defaults
  visitorDates.value = {
    start_date: visitor.start_date || new Date().toISOString().split('T')[0],
    end_date: visitor.end_date || new Date().toISOString().split('T')[0],
  }
  showExtendDateDialog.value = true
}

async function updateVisitorDates() {
  if (!selectedVisitor.value) return

  updatingDates.value = true

  try {
    // Update the approved_visitors table (account_status is calculated by the view)
    const { error: updateError } = await supabase
      .from('approved_visitors')
      .update({
        start_date: visitorDates.value.start_date,
        end_date: visitorDates.value.end_date,
      })
      .eq('user_id', selectedVisitor.value.id)

    if (updateError) throw updateError

    // Also update the registration_visitors table if registration_id exists
    if (selectedVisitor.value.registration_id) {
      await supabase
        .from('registration_visitors')
        .update({
          start_date: visitorDates.value.start_date,
          end_date: visitorDates.value.end_date,
        })
        .eq('id', selectedVisitor.value.registration_id)
    }

    // Account status is automatically updated by the approved_visitors_status view

    $q.notify({
      type: 'positive',
      message: 'Visitor access period updated successfully',
      caption: `New period: ${new Date(visitorDates.value.start_date).toLocaleDateString()} to ${new Date(visitorDates.value.end_date).toLocaleDateString()}`,
    })

    showExtendDateDialog.value = false
    selectedVisitor.value = null

    // Refresh the visitors list
    await fetchAllUsers()
  } catch (error) {
    console.error('Error updating visitor dates:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to update visitor dates',
      caption: error.message,
    })
  } finally {
    updatingDates.value = false
  }
}

// Functions for visitor registration approval
function openConfirmDialog(row, action) {
  confirmTarget.value = row
  confirmAction.value = action
  showConfirmDialog.value = true
}

async function confirmRegistrationAction() {
  if (!confirmTarget.value) return

  const row = confirmTarget.value
  const action = confirmAction.value

  const adminName =
    `${userStore.profile?.first_name || ''} ${userStore.profile?.last_name || ''}`.trim()

  isProcessingRegistration.value = true

  try {
    // Update registration_visitors status
    const { error: updateError } = await supabase
      .from('registration_visitors')
      .update({ status: action })
      .eq('id', row.id)

    if (updateError) throw updateError

    // If Approved, create user account
    if (action === 'Approved') {
      // Generate temporary password
      const tempPassword = generateTempPassword()

      // Sign up the user in Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: row.email,
        password: tempPassword,
        options: {
          data: {
            role: 'user',
            type: 'visitor',
          },
          emailRedirectTo: `${window.location.origin}/resetpassword`,
        },
      })

      if (signUpError) {
        console.error('Supabase Auth signup error:', signUpError)
        throw new Error(
          `Failed to create user account: ${signUpError.message}. Please check Supabase SMTP settings in the dashboard.`,
        )
      }

      // Check if user was created successfully
      if (!authData?.user?.id) {
        throw new Error('User account created but no user ID returned')
      }

      const now = new Date()

      // Insert into approved_visitors table (simplified schema)
      const { error: insertError } = await supabase.from('approved_visitors').insert([
        {
          user_id: authData.user.id,
          registration_id: row.id,
          approved_at: now,
          approved_by: adminName,
          email: row.email,
          start_date: row.start_date,
          end_date: row.end_date,
          is_temp_password: true,
        },
      ])

      if (insertError) throw insertError

      // Insert into all_users table
      const { error: allUserError } = await supabase.from('all_users').insert([
        {
          id: authData.user.id,
          email: row.email,
          created_at: now,
          user_type: 'visitor',
        },
      ])

      if (allUserError) throw allUserError

      // Create in-app notification for the approved visitor
      const formatDate = (dateString) => {
        if (!dateString) return 'Not specified'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      }

      const notificationMessage = `Welcome to PRESERV3D! Your visitor registration has been approved by ${adminName || 'the administrator'}. Access period: ${formatDate(row.start_date)} to ${formatDate(row.end_date)}. Please verify your email to complete your account setup.`

      try {
        await createNotification(authData.user.id, notificationMessage, 'visitor_registration')
        console.log('In-app notification created for visitor')
      } catch (notifErr) {
        console.error('Failed to create notification:', notifErr)
        // Non-critical, continue
      }

      // Send approval email via Edge Function
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          'send-visitor-email',
          {
            body: {
              email: row.email,
              status: 'Approved',
              visitorInfo: {
                first_name: row.first_name,
                last_name: row.last_name,
                start_date: row.start_date,
                end_date: row.end_date,
                adminName: adminName,
                institution: row.institution,
                purpose: row.purpose,
              },
            },
          },
        )

        if (emailError) {
          console.error('Error sending approval email:', emailError)
          // Don't throw - account is already created, email is secondary
          $q.notify({
            type: 'warning',
            message: 'Visitor approved but custom email failed to send',
            caption: 'Supabase verification email was sent successfully',
          })
        } else {
          console.log('Approval email sent:', emailData)
        }
      } catch (emailErr) {
        console.error('Email function error:', emailErr)
        // Continue - account creation is more important than custom email
      }

      $q.notify({
        type: 'positive',
        message: `Visitor registration approved`,
        caption: `Verification email sent to ${row.email}`,
      })
    } else {
      // Send rejection email via Edge Function
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          'send-visitor-email',
          {
            body: {
              email: row.email,
              status: 'Rejected',
              visitorInfo: {
                first_name: row.first_name,
                last_name: row.last_name,
                adminName: adminName,
                institution: row.institution,
                purpose: row.purpose,
              },
            },
          },
        )

        if (emailError) {
          console.error('Error sending rejection email:', emailError)
          $q.notify({
            type: 'warning',
            message: 'Registration rejected but notification email failed',
            caption: 'Please inform the visitor manually',
          })
        } else {
          console.log('Rejection email sent:', emailData)
        }
      } catch (emailErr) {
        console.error('Email function error:', emailErr)
      }

      $q.notify({
        type: 'info',
        message: 'Visitor registration rejected',
        caption: 'Notification email sent to applicant',
      })
    }

    showConfirmDialog.value = false
    confirmTarget.value = null
    confirmAction.value = ''

    // Refresh the data
    await fetchAllUsers()
  } catch (error) {
    console.error('Error processing registration:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to process registration',
      caption: error.message,
    })
  } finally {
    isProcessingRegistration.value = false
  }
}

// Extension request functions
function openExtensionDialog(row, action) {
  extensionTarget.value = row
  extensionAction.value = action
  showExtensionDialog.value = true
}

async function processExtensionRequest() {
  if (!extensionTarget.value) return

  const row = extensionTarget.value
  const action = extensionAction.value

  const adminName =
    `${userStore.profile?.first_name || ''} ${userStore.profile?.last_name || ''}`.trim()

  isProcessingExtension.value = true

  try {
    const isApproved = action === 'Approved'
    const timestamp = new Date().toISOString()

    // Fetch visitor data once upfront (we need it for both approval and rejection)
    const { data: visitorData, error: visitorFetchError } = await supabase
      .from('approved_visitors')
      .select('user_id, end_date')
      .eq('approval_id', row.approval_id)
      .single()

    if (visitorFetchError) throw visitorFetchError

    // Build parallel operations array
    const operations = [
      // 1. Update extension status
      supabase
        .from('account_extensions')
        .update({
          extension_status: action,
          reviewed_by: adminName,
          reviewed_at: timestamp,
        })
        .eq('id', row.id),
    ]

    // 2. If approved, update visitor's end_date
    if (isApproved) {
      operations.push(
        supabase
          .from('approved_visitors')
          .update({ end_date: row.extended_end_date })
          .eq('approval_id', row.approval_id),
      )
    }

    // Execute database operations in parallel
    const results = await Promise.all(operations)

    // Check for errors
    const dbError = results.find((r) => r.error)?.error
    if (dbError) throw dbError

    // Create notification (fire and forget - don't wait for it)
    if (visitorData?.user_id) {
      const notificationMessage = isApproved
        ? `Your extension request has been approved by ${adminName || 'the administrator'}. Your new access period ends on ${new Date(row.extended_end_date).toLocaleDateString()}.`
        : `Your extension request has been rejected by ${adminName || 'the administrator'}.`

      // Fire and forget - no await
      createNotification(visitorData.user_id, notificationMessage, 'visitor_registration').catch(
        (err) => console.error('Failed to create notification:', err),
      )
    }

    // Show notification
    $q.notify({
      type: isApproved ? 'positive' : 'info',
      message: isApproved ? 'Extension request approved' : 'Extension request rejected',
      caption: isApproved
        ? `Visitor access extended to ${new Date(row.extended_end_date).toLocaleDateString()}`
        : 'Visitor has been notified',
    })

    // Reset state
    showExtensionDialog.value = false
    extensionTarget.value = null
    extensionAction.value = ''

    // Refresh data in background
    fetchAllUsers().catch((err) => console.error('Failed to refresh users:', err))
  } catch (error) {
    console.error('Error processing extension request:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to process extension request',
      caption: error.message,
    })
  } finally {
    isProcessingExtension.value = false
  }
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

::v-deep(.my-sticky-header-table .q-table__title) {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: #560505;
}

.create-admin-card {
  min-width: 500px;
  border-radius: 10px;
  font-family: 'Poppins', sans-serif;
}

.conf-box {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  border-radius: 10px;
  background-color: #fbf4d0;
  padding: 1rem;
  text-align: center;
  min-width: 400px;
}

.btn-save {
  border-radius: 7px;
  background-color: rgba(204, 172, 0, 0.7);
  color: #121212;
  font-size: 14px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
}

.sucess-add-to-collection {
  font-family: 'Poppins', sans-serif;
  border-radius: 10px;
  background-color: #fbf4d0;
  padding: 1rem;
  text-align: center;
  min-width: 400px;
}

.sub-font {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 16px;
}

.sub-font-2 {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
}

.sub-font-3 {
  font-family: 'Poppins', sans-serif;
}

.view-more-link {
  color: #880000;
  text-decoration: underline;
}

.status-btn {
  margin: 0 0.25rem;
}

@media (max-width: 768px) {
  .create-admin-card {
    min-width: 90vw;
  }
}
</style>
