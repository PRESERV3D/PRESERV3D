<template>
  <q-page class="q-pa-md">
    <div class="q-mt-xs title">User Management</div>
    <div class="q-mt-xs q-mb-lg subtitle">Manage all users and administrators</div>

    <!-- Action Buttons -->
    <div class="row q-gutter-md q-mb-lg">
      <q-btn
        label="Create New Admin"
        color="primary"
        icon="person_add"
        @click="showCreateAdminDialog = true"
        no-caps
        class="btn-create-admin"
      />
    </div>

    <!-- Users Management Tabs -->
    <q-tabs
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
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="activeTab" animated class="q-mt-md">
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
          class="user-table"
        >
          <template v-slot:body-cell-is_super_admin="props">
            <q-td :props="props" align="center">
              <q-badge v-if="props.row.is_super_admin" color="orange" label="Super Admin" />
              <q-badge v-else color="blue" label="Admin" />
            </q-td>
          </template>
          <template v-slot:body-cell-email_confirmed_at="props">
            <q-td :props="props" align="center">
              <q-badge v-if="props.row.email_confirmed_at" color="green" label="Verified" />
              <q-badge v-else color="red" label="Pending" />
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" align="center">
              <q-btn
                v-if="!props.row.email_confirmed_at"
                flat
                dense
                round
                icon="email"
                color="primary"
                @click="resendConfirmationEmail(props.row)"
                :loading="resendingEmail === props.row.id"
                class="q-mr-sm"
              >
                <q-tooltip>Resend Confirmation Email</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                icon="delete"
                color="negative"
                @click="confirmDeleteUser(props.row, 'admin')"
                :disable="props.row.is_super_admin && props.row.id === userStore.profile?.id"
              >
                <q-tooltip>Delete Admin</q-tooltip>
              </q-btn>
            </q-td>
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
          class="user-table"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" align="center">
              <q-btn
                flat
                dense
                round
                icon="delete"
                color="negative"
                @click="confirmDeleteUser(props.row, 'student')"
              >
                <q-tooltip>Delete User</q-tooltip>
              </q-btn>
            </q-td>
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
          class="user-table"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" align="center">
              <q-btn
                flat
                dense
                round
                icon="delete"
                color="negative"
                @click="confirmDeleteUser(props.row, 'faculty')"
              >
                <q-tooltip>Delete User</q-tooltip>
              </q-btn>
            </q-td>
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
          class="user-table"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" align="center">
              <q-btn
                flat
                dense
                round
                icon="delete"
                color="negative"
                @click="confirmDeleteUser(props.row, 'visitor')"
              >
                <q-tooltip>Delete User</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>
    </q-tab-panels>

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
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase, supabaseAdmin } from 'boot/supabase'
import { useUserStore } from 'stores/user'

const $q = useQuasar()
const userStore = useUserStore()

const activeTab = ref('admins')
const loading = ref(false)
const creatingAdmin = ref(false)
const deleting = ref(false)
const resendingEmail = ref(null)

const admins = ref([])
const students = ref([])
const faculty = ref([])
const visitors = ref([])

const showCreateAdminDialog = ref(false)
const showDeleteDialog = ref(false)
const showSuccessDialog = ref(false)
const successTitle = ref('')
const successMessage = ref('')

const deleteTarget = ref(null)
const deleteType = ref('')

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
  { name: 'first_name', label: 'First Name', align: 'center', field: 'first_name', sortable: true },
  { name: 'last_name', label: 'Last Name', align: 'center', field: 'last_name', sortable: true },
  { name: 'email', label: 'Email', align: 'center', field: 'email', sortable: true },
  { name: 'contact', label: 'Contact', align: 'center', field: 'contact' },
  { name: 'is_super_admin', label: 'Role', align: 'center', field: 'is_super_admin' },
  {
    name: 'email_confirmed_at',
    label: 'Email Status',
    align: 'center',
    field: 'email_confirmed_at',
  },
  {
    name: 'created_at',
    label: 'Created',
    align: 'center',
    field: (row) => new Date(row.created_at).toLocaleDateString(),
    sortable: true,
  },
  { name: 'actions', label: 'Actions', align: 'center', field: 'actions' },
]

const userColumns = [
  { name: 'first_name', label: 'First Name', align: 'center', field: 'first_name', sortable: true },
  { name: 'last_name', label: 'Last Name', align: 'center', field: 'last_name', sortable: true },
  { name: 'email', label: 'Email', align: 'center', field: 'email', sortable: true },
  { name: 'contact', label: 'Contact', align: 'center', field: 'contact' },
  {
    name: 'created_at',
    label: 'Registered',
    align: 'center',
    field: (row) => new Date(row.created_at).toLocaleDateString(),
    sortable: true,
  },
  { name: 'actions', label: 'Actions', align: 'center', field: 'actions' },
]

const visitorColumns = [
  { name: 'first_name', label: 'First Name', align: 'center', field: 'first_name', sortable: true },
  { name: 'last_name', label: 'Last Name', align: 'center', field: 'last_name', sortable: true },
  { name: 'email', label: 'Email', align: 'center', field: 'email', sortable: true },
  {
    name: 'approved_at',
    label: 'Approved',
    align: 'center',
    field: (row) => new Date(row.approved_at).toLocaleDateString(),
    sortable: true,
  },
  { name: 'approved_by', label: 'Approved By', align: 'center', field: 'approved_by' },
  { name: 'actions', label: 'Actions', align: 'center', field: 'actions' },
]

onMounted(async () => {
  await fetchAllUsers()
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
          return {
            ...admin,
            email_confirmed_at: authUser?.user?.email_confirmed_at || null,
          }
        }),
      )
      admins.value = adminsWithStatus
    } else {
      admins.value = []
    }

    // Fetch students
    const { data: studentData, error: studentError } = await supabase
      .from('registered_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (studentError) throw studentError
    students.value = studentData || []

    // Fetch faculty
    const { data: facultyData, error: facultyError } = await supabase
      .from('registered_faculty')
      .select('*')
      .order('created_at', { ascending: false })

    if (facultyError) throw facultyError
    faculty.value = facultyData || []

    // Fetch visitors
    const { data: visitorData, error: visitorError } = await supabase
      .from('approved_visitors')
      .select('*')
      .order('approved_at', { ascending: false })

    if (visitorError) throw visitorError
    visitors.value = visitorData || []
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

    console.log('Starting deletion for user:', userId, 'from table:', tableName)

    // Step 1: Handle all tables with FK constraints to auth.users
    // Must be done BEFORE attempting to delete from auth

    // Delete collections (has FK to auth.users)
    await supabase.from('collections').delete().eq('user_id', userId)

    // Delete appointments (has FK to auth.users)
    await supabase.from('appointment_booking').delete().eq('user_id', userId)

    // Delete notifications (has FK to auth.users)
    await supabase.from('notifications').delete().eq('receiver_id', userId)

    // Keep logs but set user_id to NULL for tracking (if FK allows NULL)
    // Note: These tables have FK constraints but we anonymize instead of delete
    try {
      await supabase
        .from('user_activity_log')
        .update({ user_type: 'deleted_user' })
        .eq('user_id', userId)
    } catch (e) {
      console.warn('Could not anonymize activity log:', e)
    }

    try {
      await supabase
        .from('security_logs')
        .update({
          user_email: '[deleted]',
          user_name: '[deleted]',
        })
        .eq('user_id', userId)
    } catch (e) {
      console.warn('Could not anonymize security logs:', e)
    }

    // Delete logins (no FK shown in schema but may exist)
    await supabase.from('logins').delete().eq('user_id', userId)

    // Delete collection items (if user owns collections)
    const { data: userCollections } = await supabase
      .from('collections')
      .select('collection_id')
      .eq('user_id', userId)

    if (userCollections && userCollections.length > 0) {
      const collectionIds = userCollections.map((c) => c.collection_id)
      await supabase.from('collection_items').delete().in('collection_id', collectionIds)
    }

    console.log('Related records processed')

    // Step 2: Delete from specific user table
    console.log(`Deleting from ${tableName} where id = ${userId}`)
    const { data: deleteData, error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('id', userId)
      .select()

    if (deleteError) {
      console.error('Error deleting from user table:', deleteError)
      throw deleteError
    }

    console.log('Deleted from user table:', deleteData)

    // Step 3: Delete from all_users table
    console.log(`Deleting from all_users where id = ${userId}`)
    const { data: allUserDeleteData, error: allUserDeleteError } = await supabase
      .from('all_users')
      .delete()
      .eq('id', userId)
      .select()

    if (allUserDeleteError) {
      console.warn('Error deleting from all_users:', allUserDeleteError)
    } else {
      console.log('Deleted from all_users:', allUserDeleteData)
    }

    console.log('Database tables cleaned, attempting auth deletion...')

    // Step 4: Delete from Supabase Auth
    // This may fail due to FK constraints in auth schema that we can't access
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Auth deletion failed (this is expected if FK constraints exist):', authError)

      // User is deleted from all application tables - they can't login or use the system
      // The auth record remains but is orphaned and harmless
      console.log('✅ User removed from application (auth record orphaned but harmless)')

      $q.notify({
        type: 'positive',
        message: 'User deleted successfully',
        caption: 'User removed from system and cannot access the application.',
        timeout: 4000,
      })
    } else {
      console.log('✅ User completely deleted from all systems including auth')

      $q.notify({
        type: 'positive',
        message: 'User completely deleted',
        caption: 'User removed from all systems.',
        timeout: 3000,
      })
    }

    showDeleteDialog.value = false
    deleteTarget.value = null
    deleteType.value = ''

    // Force refresh the users list
    console.log('Force refreshing user list...')
    loading.value = true

    // Clear the arrays first to ensure fresh data
    admins.value = []
    students.value = []
    faculty.value = []
    visitors.value = []

    await fetchAllUsers()
    loading.value = false
    console.log('User list refreshed, admins count:', admins.value.length)
    console.log(
      'Current admin IDs:',
      admins.value.map((a) => a.id),
    )
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
</script>

<style scoped>
.btn-create-admin {
  border-radius: 7px;
  background-color: rgba(204, 172, 0, 0.7);
  color: #121212;
  font-size: 14px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
}

.create-admin-card {
  min-width: 500px;
  border-radius: 10px;
  font-family: 'Poppins', sans-serif;
}

.user-table {
  font-family: 'Poppins', sans-serif;
  border-radius: 10px;
  background: linear-gradient(127deg, #fff 0.9%, #fffce9 88.33%);
  box-shadow: 10px 4px 10px rgba(102, 102, 102, 0.25);
}

::v-deep(.user-table .q-table__title) {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: #560505;
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

@media (max-width: 768px) {
  .create-admin-card {
    min-width: 90vw;
  }
}
</style>
