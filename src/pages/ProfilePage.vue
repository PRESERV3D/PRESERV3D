<template>
  <q-page class="profile-page">
    <div class="page-container">
      <div class="profile-content">
        <q-card class="profile-card">
          <!-- Profile Picture Section -->
          <div class="profile-picture-section">
            <div class="avatar-wrapper">
              <q-avatar size="150px">
                <img :src="profileImage || 'https://cdn.quasar.dev/img/avatar.png'" />
              </q-avatar>
              <q-btn
                round
                color="primary"
                icon="camera_alt"
                size="sm"
                class="camera-btn"
                @click="changeProfilePicture"
              />
            </div>
            <!-- Extension Request Button for Visitors -->
            <div v-if="userType === 'visitor'" class="extension-section q-mt-md">
              <q-btn
                outline
                color="primary"
                label="Request Extension"
                icon="event"
                @click="showExtensionDialog = true"
                :disable="hasActiveExtension"
              />
              <div v-if="hasActiveExtension" class="q-mt-sm text-caption text-grey-7">
                Extension request pending approval
              </div>
            </div>
          </div>

          <!-- Profile Information -->
          <div class="profile-info-section">
            <!-- Student -->
            <template v-if="userType === 'student'">
              <div class="info-row">
                <label>First Name:</label>
                <div class="info-content">
                  <span>{{ studentData.firstName }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Last Name:</label>
                <div class="info-content">
                  <span>{{ studentData.lastName }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Email:</label>
                <div class="info-content">
                  <span>{{ studentData.email }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>College:</label>
                <div class="info-content">
                  <span>{{ studentData.college }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Department:</label>
                <div class="info-content">
                  <span>{{ studentData.department }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Year and Section:</label>
                <div class="info-content">
                  <span>{{ studentData.yearSection }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Alumni:</label>
                <div class="info-content">
                  <span>{{ studentData.isAlumni ? 'Yes' : 'No' }}</span>
                </div>
              </div>
            </template>
            <!-- Faculty -->
            <template v-else-if="userType === 'faculty'">
              <div class="info-row">
                <label>First Name:</label>
                <div class="info-content">
                  <span>{{ facultyData.firstName }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Last Name:</label>
                <div class="info-content">
                  <span>{{ facultyData.lastName }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Email:</label>
                <div class="info-content">
                  <span>{{ facultyData.email }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>College:</label>
                <div class="info-content">
                  <span>{{ facultyData.college }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Department:</label>
                <div class="info-content">
                  <span>{{ facultyData.department }}</span>
                </div>
              </div>
            </template>
            <!-- Admin -->
            <template v-else-if="userType === 'admin' || isSuperAdmin">
              <div class="info-row">
                <label>First Name:</label>
                <div class="info-content">
                  <span>{{ adminData.firstName }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Last Name:</label>
                <div class="info-content">
                  <span>{{ adminData.lastName }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Email:</label>
                <div class="info-content">
                  <span>{{ adminData.email }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Super Admin:</label>
                <div class="info-content">
                  <span>{{ adminData.isSuperAdmin ? 'Yes' : 'No' }}</span>
                </div>
              </div>
            </template>
            <!-- Visitor -->
            <template v-else-if="userType === 'visitor'">
              <div class="info-row">
                <label>First Name:</label>
                <div class="info-content">
                  <span>{{ visitorData.firstName }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Last Name:</label>
                <div class="info-content">
                  <span>{{ visitorData.lastName }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Contact:</label>
                <div class="info-content">
                  <span>{{ visitorData.contactNumber }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Email:</label>
                <div class="info-content">
                  <span>{{ visitorData.email }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Institution:</label>
                <div class="info-content">
                  <span>{{ visitorData.institution }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Purpose:</label>
                <div class="info-content">
                  <span>{{ visitorData.purpose }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>Start Date:</label>
                <div class="info-content">
                  <span>{{ formatDate(visitorData.startDate) }}</span>
                </div>
              </div>
              <div class="info-row">
                <label>End Date:</label>
                <div class="info-content">
                  <span>{{ formatDate(visitorData.endDate) }}</span>
                </div>
              </div>
            </template>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Extension Request Dialog (Visitor Only) -->
    <q-dialog v-model="showExtensionDialog">
      <q-card class="extension-dialog">
        <q-card-section class="dialog-header">
          <div class="dialog-title">Request Account Extension</div>
          <div class="text-caption text-grey-7">
            Please provide the details for your extension request
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="dialog-content">
          <div class="form-group">
            <label class="form-label">New End Date <span class="required">*</span></label>
            <q-input
              v-model="extensionRequest.newEndDate"
              outlined
              dense
              type="date"
              :min="visitorData.endDate"
              class="edit-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Reason for Extension <span class="required">*</span></label>
            <q-input
              v-model="extensionRequest.reason"
              outlined
              dense
              type="textarea"
              rows="4"
              autogrow
              placeholder="Please provide a detailed reason for your extension request..."
              class="edit-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Supporting Document (Optional)</label>
            <div class="file-upload-section">
              <input
                type="file"
                ref="fileInput"
                @change="handleFileSelect"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style="display: none"
              />
              <q-btn
                outline
                color="primary"
                label="Choose File"
                icon="attach_file"
                size="md"
                @click="$refs.fileInput.click()"
              />
              <div v-if="extensionRequest.supportingDocument" class="file-selected">
                <q-icon name="description" size="18px" color="primary" />
                <span>{{ extensionRequest.supportingDocument.name }}</span>
              </div>
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">
              Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
            </div>
          </div>
          <div class="certification-section">
            <q-checkbox v-model="extensionRequest.certificationAccepted" color="primary">
              <template v-slot:default>
                <div class="certification-text">
                  I hereby certify that all the information provided are true and correct to the
                  best of my knowledge.
                </div>
              </template>
            </q-checkbox>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            label="Submit Request"
            color="primary"
            @click="submitExtensionRequest"
            :disable="
              !extensionRequest.certificationAccepted ||
              !extensionRequest.newEndDate ||
              !extensionRequest.reason
            "
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'boot/supabase'
import { useUserStore } from 'src/stores/user'

const userStore = useUserStore()
const userProfile = computed(() => userStore.profile || {})
const userType = computed(() => userProfile.value.user_type || 'Unknown')
const isSuperAdmin = computed(() => userProfile.value.is_super_admin || false)

const $q = useQuasar()
const profileImage = ref(null)
const showExtensionDialog = ref(false)
const hasActiveExtension = ref(false)
const fileInput = ref(null)

// Student data
const studentData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  college: '',
  department: '',
  yearSection: '',
  isAlumni: false,
})

// Faculty data
const facultyData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  college: '',
  department: '',
})

// Admin data
const adminData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  isSuperAdmin: false,
})

// Visitor data
const visitorData = reactive({
  firstName: '',
  lastName: '',
  contactNumber: '',
  institution: '',
  purpose: '',
  startDate: '',
  endDate: '',
  email: '',
})

onMounted(async () => {
  try {
    await userStore.fetchProfile()
    console.log('UserType:', userType.value)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) {
      console.error('Auth error:', userError)
      return
    }
    if (!user || !user.email) {
      console.warn('No authenticated user found')
      return
    }

    let data, error

    if (userType.value === 'student') {
      ;({ data, error } = await supabase
        .from('registered_users')
        .select('*')
        .eq('email', user.email)
        .single())

      if (error) throw error
      if (data) {
        studentData.firstName = data.first_name
        studentData.lastName = data.last_name
        studentData.email = data.email
        studentData.college = data.college
        studentData.department = data.department
        studentData.yearSection = data.year_section
        studentData.isAlumni = !!data.is_alumni
      }
    } else if (userType.value === 'faculty') {
      ;({ data, error } = await supabase
        .from('registered_faculty')
        .select('*')
        .eq('email', user.email)
        .single())

      if (error) throw error
      if (data) {
        facultyData.firstName = data.first_name
        facultyData.lastName = data.last_name
        facultyData.email = data.email
        facultyData.college = data.college
        facultyData.department = data.department
      }
    } else if (userType.value === 'admin') {
      ;({ data, error } = await supabase
        .from('registered_admins')
        .select('*')
        .eq('email', user.email)
        .single())

      if (error && error.code !== 'PGRST116') {
        console.error('Admin fetch error:', error)
        throw error
      }
      if (data) {
        adminData.firstName = data.first_name
        adminData.lastName = data.last_name
        adminData.email = data.email
        adminData.isSuperAdmin = !!data.is_super_admin
        console.log('Admin data loaded:', data) // Debug log
      }
    } else if (userType.value === 'visitor') {
      ;({ data, error } = await supabase
        .from('approved_visitors')
        .select('*')
        .eq('email', user.email)
        .single())

      if (error) throw error
      if (data) {
        visitorData.firstName = data.first_name
        visitorData.lastName = data.last_name
        visitorData.contactNumber = data.contact
        visitorData.email = data.email
        visitorData.institution = data.institution
        visitorData.purpose = data.purpose
        visitorData.startDate = data.start_date
        visitorData.endDate = data.end_date
      }
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load profile information',
      position: 'top',
    })
  }
})

const extensionRequest = reactive({
  newEndDate: '',
  reason: '',
  supportingDocument: null,
  certificationAccepted: false,
})

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 5242880) {
      $q.notify({
        type: 'negative',
        message: 'File size must be less than 5MB',
        position: 'top',
      })
      event.target.value = ''
      return
    }
    extensionRequest.supportingDocument = file
  }
}

const submitExtensionRequest = () => {
  hasActiveExtension.value = true
  showExtensionDialog.value = false
  $q.notify({
    type: 'positive',
    message: 'Extension request submitted successfully. Pending approval.',
    position: 'top',
  })
  extensionRequest.newEndDate = ''
  extensionRequest.reason = ''
  extensionRequest.supportingDocument = null
  extensionRequest.certificationAccepted = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const changeProfilePicture = () => {
  $q.notify({
    type: 'info',
    message: 'Profile picture upload functionality',
    position: 'top',
  })
}
</script>

<style scoped>
.profile-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20px;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-content {
  display: flex;
  justify-content: center;
}

.profile-card {
  width: 100%;
  max-width: 900px;
  padding: 40px;
  display: flex;
  gap: 60px;
}

.profile-picture-section {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
}

.camera-btn {
  position: absolute;
  bottom: 0;
  right: 0;
}

.extension-section {
  text-align: center;
}

.profile-info-section {
  flex: 1;
  min-width: 0;
}

.info-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 20px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.info-row label {
  font-weight: 600;
  color: #666;
  padding-top: 0;
  line-height: 40px;
}

.info-content {
  width: 100%;
}

.info-content span {
  display: block;
  padding: 12px 0;
  color: #333;
  line-height: 1.5;
}

.edit-input {
  width: 100%;
}

.edit-input >>> .q-field__control {
  background-color: #ffffff !important;
  border: 2px solid #e0e0e0 !important;
  border-radius: 4px !important;
  min-height: 44px !important;
}

.edit-input >>> .q-field__control:hover {
  border-color: #1976d2 !important;
}

.edit-input >>> .q-field__control:focus-within {
  border-color: #1976d2 !important;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1) !important;
}

.edit-input >>> .q-field__native {
  padding: 4px !important;
  color: #333 !important;
  font-size: 14px !important;
}

.edit-input >>> textarea.q-field__native {
  min-height: 80px !important;
  padding: 4px !important;
  resize: none !important;
  line-height: 1.5 !important;
}

.certification-section {
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #1976d2;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.block {
  display: block;
}

/* Extension Dialog Styles */
.extension-dialog {
  min-width: 500px;
  max-width: 600px;
}

.dialog-header {
  padding: 28px 32px 16px 32px;
}

.dialog-title {
  font-size: 22px;
  font-weight: 600;
  color: #212121;
  margin-bottom: 4px;
}

.dialog-content {
  padding: 24px 32px;
}

.dialog-actions {
  padding: 16px 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #424242;
  margin-bottom: 8px;
  font-size: 14px;
}

.required {
  color: #d32f2f;
  font-weight: 600;
}

.file-upload-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-selected {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background-color: #e3f2fd;
  border-radius: 4px;
  color: #1976d2;
  font-size: 14px;
}

.certification-text {
  font-size: 13px;
  line-height: 1.5;
  color: #424242;
}

@media (max-width: 768px) {
  .profile-card {
    flex-direction: column;
    padding: 20px;
    gap: 30px;
  }

  .info-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .info-row label {
    padding-top: 0;
  }

  .extension-dialog {
    min-width: unset;
    max-width: 95vw;
  }
}
</style>
