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
              @update:model-value="checkExtensionDuration"
            />
            <!-- Extension duration info -->
            <div v-if="extensionRequest.newEndDate" class="q-mt-sm">
              <div v-if="isExtensionWithinWeek" class="text-caption text-positive">
                <q-icon name="check_circle" size="16px" />
                Extension within 7 days - No letter required
              </div>
              <div v-else class="text-caption text-warning">
                <q-icon name="warning" size="16px" />
                Extension exceeds 7 days - Letter upload required
              </div>
            </div>
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
              placeholder="Please state your reason for your extension request."
              class="edit-input"
            />
          </div>
          <!-- Conditional Letter Upload -->
          <div v-if="requiresLetterUpload" class="form-group">
            <label class="form-label">
              Supporting Letter
              <span class="required">*</span>
              <span class="text-caption text-grey-7"> (Required for extensions over 7 days) </span>
            </label>
            <div class="file-upload-section">
              <input
                type="file"
                ref="letterInput"
                @change="handleLetterSelect"
                accept=".pdf"
                style="display: none"
              />
              <q-btn
                outline
                color="primary"
                label="Upload Letter (PDF)"
                icon="picture_as_pdf"
                size="md"
                @click="$refs.letterInput.click()"
              />
              <div v-if="extensionRequest.letter" class="file-selected">
                <q-icon name="picture_as_pdf" size="18px" color="primary" />
                <span>{{ extensionRequest.letter.name }}</span>
                <q-btn
                  flat
                  dense
                  round
                  icon="close"
                  size="xs"
                  color="negative"
                  @click="removeLetterFile"
                />
              </div>
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">PDF only - Max 5MB</div>
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
          <q-btn flat label="Cancel" color="grey-7" v-close-popup @click="resetExtensionForm" />
          <q-btn
            unelevated
            label="Submit Request"
            color="primary"
            @click="submitExtensionRequest"
            :disable="!isExtensionFormValid"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/user'
import { supabase } from 'boot/supabase'
import { uploadFileToR2, deleteFileFromR2 } from 'boot/r2'

const userStore = useUserStore()
const userProfile = computed(() => userStore.profile || {})
const userType = computed(() => userProfile.value.user_type || 'Unknown')
const isSuperAdmin = computed(() => userProfile.value.is_super_admin || false)

const $q = useQuasar()
const profileImage = ref(null)
const showExtensionDialog = ref(false)
const hasActiveExtension = ref(false)
const letterInput = ref(null)

// Computed properties for extension validation
const extensionDurationDays = computed(() => {
  if (!extensionRequest.newEndDate || !visitorData.endDate) return 0

  const currentEndDate = new Date(visitorData.endDate)
  const newEndDate = new Date(extensionRequest.newEndDate)
  const diffTime = newEndDate - currentEndDate
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
})

const isExtensionWithinWeek = computed(() => {
  return extensionDurationDays.value > 0 && extensionDurationDays.value <= 7
})

const requiresLetterUpload = computed(() => {
  return extensionDurationDays.value > 7
})

const isExtensionFormValid = computed(() => {
  const basicFieldsValid =
    extensionRequest.certificationAccepted &&
    extensionRequest.newEndDate &&
    extensionRequest.reason.trim().length > 0

  // If letter is required (extension > 7 days), check if letter is uploaded
  if (requiresLetterUpload.value) {
    return basicFieldsValid && extensionRequest.letter !== null
  }

  return basicFieldsValid
})

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
    // Ensure profile is loaded (if not already)
    if (!userStore.profile) {
      await userStore.fetchProfile()
    }

    const profile = userStore.profile
    console.log('UserType:', userType.value)

    if (!profile) {
      console.warn('No profile data found')
      return
    }

    // Use data already loaded in the store - no additional queries needed!
    if (userType.value === 'student') {
      studentData.firstName = profile.first_name || ''
      studentData.lastName = profile.last_name || ''
      studentData.email = profile.email || ''
      studentData.college = profile.college || ''
      studentData.department = profile.department || ''
      studentData.yearSection = profile.year_section || ''
      studentData.isAlumni = !!profile.is_alumni
    } else if (userType.value === 'faculty') {
      facultyData.firstName = profile.first_name || ''
      facultyData.lastName = profile.last_name || ''
      facultyData.email = profile.email || ''
      facultyData.college = profile.college || ''
      facultyData.department = profile.department || ''
    } else if (userType.value === 'admin' || userType.value === 'super admin') {
      adminData.firstName = profile.first_name || ''
      adminData.lastName = profile.last_name || ''
      adminData.email = profile.email || ''
      adminData.isSuperAdmin = !!profile.is_super_admin
    } else if (userType.value === 'visitor') {
      visitorData.firstName = profile.first_name || ''
      visitorData.lastName = profile.last_name || ''
      visitorData.contactNumber = profile.contact || ''
      visitorData.email = profile.email || ''
      visitorData.institution = profile.institution || ''
      visitorData.purpose = profile.purpose || ''
      visitorData.startDate = profile.start_date || ''
      visitorData.endDate = profile.end_date || ''

      // Check for pending extension requests
      await checkPendingExtension(profile.approval_id)
    }
  } catch (error) {
    console.error('Error loading profile:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load profile information',
      position: 'top',
    })
  }
})

// Check if visitor has a pending extension request
const checkPendingExtension = async (approvalId) => {
  if (!approvalId) return

  const { data, error } = await supabase
    .from('account_extensions')
    .select('*')
    .eq('approval_id', approvalId)
    .eq('extension_status', 'Pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error checking extension status:', error)
    return
  }

  if (data) {
    hasActiveExtension.value = true
    console.log('Pending extension found:', data)
  }
}

const extensionRequest = reactive({
  newEndDate: '',
  reason: '',
  letter: null, // Required for extensions > 7 days
  certificationAccepted: false,
})

const handleLetterSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Validate file type (PDF only)
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      $q.notify({
        type: 'negative',
        message: 'Only PDF files are accepted',
        position: 'top',
      })
      event.target.value = ''
      return
    }

    // Validate file size
    if (file.size > 5242880) {
      $q.notify({
        type: 'negative',
        message: 'File size must be less than 5MB',
        position: 'top',
      })
      event.target.value = ''
      return
    }

    extensionRequest.letter = file
  }
}

const removeLetterFile = () => {
  extensionRequest.letter = null
  if (letterInput.value) {
    letterInput.value.value = ''
  }
}

const checkExtensionDuration = () => {
  // This is called when newEndDate changes
  // The computed properties will automatically update
  console.log('Extension duration:', extensionDurationDays.value, 'days')
  console.log('Requires letter:', requiresLetterUpload.value)
}

const resetExtensionForm = () => {
  extensionRequest.newEndDate = ''
  extensionRequest.reason = ''
  extensionRequest.letter = null
  extensionRequest.certificationAccepted = false

  if (letterInput.value) {
    letterInput.value.value = ''
  }
}

const submitExtensionRequest = async () => {
  // Validate required fields
  if (!isExtensionFormValid.value) {
    $q.notify({
      type: 'negative',
      message: 'Please fill in all required fields',
      position: 'top',
    })
    return
  }

  const profile = userStore.profile
  if (!profile || !profile.approval_id) {
    $q.notify({
      type: 'negative',
      message: 'Unable to identify your account. Please try logging in again.',
      position: 'top',
    })
    return
  }

  try {
    $q.loading.show({ message: 'Submitting extension request...' })

    let letterUrl = null
    let uploadedFileName = null

    // Upload letter to R2 first (if required)
    if (requiresLetterUpload.value && extensionRequest.letter) {
      const fileName = extensionRequest.letter.name
      uploadedFileName = fileName

      const { error: uploadError, publicUrl } = await uploadFileToR2(
        extensionRequest.letter,
        'visitor-letters',
        fileName,
      )

      if (uploadError) {
        throw new Error(`Failed to upload letter: ${uploadError.message}`)
      }

      letterUrl = publicUrl
      console.log('Letter uploaded successfully:', letterUrl)
    }

    // Insert extension request into database with letter URL
    const { data: extensionData, error: insertError } = await supabase
      .from('account_extensions')
      .insert([
        {
          approval_id: profile.approval_id,
          old_end_date: visitorData.endDate,
          extended_end_date: extensionRequest.newEndDate,
          letter: letterUrl,
          purpose: extensionRequest.reason,
          extension_status: 'Pending',
        },
      ])
      .select()

    if (insertError) {
      // If database insert fails and we uploaded a file, delete it from R2
      if (uploadedFileName) {
        console.log('Database insert failed. Deleting uploaded file from R2:', uploadedFileName)
        const { error: deleteError } = await deleteFileFromR2('visitor-letters', uploadedFileName)
        if (deleteError) {
          console.error('Failed to delete file from R2:', deleteError)
        } else {
          console.log('Successfully deleted file from R2:', uploadedFileName)
        }
      }
      throw insertError
    }

    console.log('Extension request created:', extensionData)

    // Create notification for all admins
    const { error: notificationError } = await supabase.from('notifications').insert([
      {
        receiver_role: 'admin',
        message: `${visitorData.firstName} ${visitorData.lastName} has requested an account extension from ${formatDate(visitorData.endDate)} to ${formatDate(extensionRequest.newEndDate)}.`,
        type: 'visitor_registration',
        created_at: new Date().toISOString(),
        read: false,
      },
    ])

    if (notificationError) {
      console.error('Failed to create notification:', notificationError)
      // Don't fail the request if notification fails
    }

    hasActiveExtension.value = true
    showExtensionDialog.value = false

    const message = requiresLetterUpload.value
      ? 'Extension request submitted successfully with supporting letter. Pending admin approval.'
      : 'Extension request submitted successfully. Pending admin approval.'

    $q.notify({
      type: 'positive',
      message: message,
      position: 'top',
      timeout: 3000,
    })

    // Reset form
    resetExtensionForm()
  } catch (error) {
    console.error('Error submitting extension request:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to submit extension request. Please try again.',
      position: 'top',
      timeout: 3000,
    })
  } finally {
    $q.loading.hide()
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

.edit-input :deep(.q-field__control) {
  background-color: #ffffff !important;
  border: 2px solid #e0e0e0 !important;
  border-radius: 4px !important;
  min-height: 44px !important;
}

.edit-input :deep(.q-field__control:hover) {
  border-color: #1976d2 !important;
}

.edit-input :deep(.q-field__control:focus-within) {
  border-color: #1976d2 !important;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1) !important;
}

.edit-input :deep(.q-field__native) {
  padding: 4px !important;
  color: #333 !important;
  font-size: 14px !important;
}

.edit-input :deep(textarea.q-field__native) {
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

.text-positive {
  color: #4caf50;
  display: flex;
  align-items: center;
  gap: 4px;
}

.text-warning {
  color: #ff9800;
  display: flex;
  align-items: center;
  gap: 4px;
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
  justify-content: space-between;
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
