<template>
  <q-page class="q-pa-md">
    <div class="q-mt-xs title">Visitor Profile</div>
    <div class="q-mt-xs q-mb-xl subtitle">Manage your account information and preferences.</div>

    <!-- Centered Profile Card -->
    <div class="card-container">
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

          <!-- Extension Request Section -->
          <div v-if="!isEditing" class="extension-section q-mt-md">
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
          <div class="info-row">
            <label>Name:</label>
            <div class="info-content">
              <span v-if="!isEditing">{{ visitorData.name }}</span>
              <q-input v-else v-model="visitorData.name" outlined dense class="edit-input" />
            </div>
          </div>

          <div class="info-row">
            <label>Email:</label>
            <div class="info-content">
              <span v-if="!isEditing">{{ visitorData.email }}</span>
              <q-input
                v-else
                v-model="visitorData.email"
                outlined
                dense
                type="email"
                class="edit-input"
              />
            </div>
          </div>

          <div class="info-row">
            <label>Contact Number:</label>
            <div class="info-content">
              <span v-if="!isEditing">{{ visitorData.contactNumber }}</span>
              <q-input
                v-else
                v-model="visitorData.contactNumber"
                outlined
                dense
                class="edit-input"
              />
            </div>
          </div>

          <div class="info-row">
            <label>Institution:</label>
            <div class="info-content">
              <span v-if="!isEditing">{{ visitorData.institution }}</span>
              <q-input v-else v-model="visitorData.institution" outlined dense class="edit-input" />
            </div>
          </div>

          <div class="info-row">
            <label>Purpose:</label>
            <div class="info-content">
              <span v-if="!isEditing">{{ visitorData.purpose }}</span>
              <q-input
                v-else
                v-model="visitorData.purpose"
                outlined
                type="textarea"
                rows="3"
                class="edit-input"
              />
            </div>
          </div>

          <div class="info-row">
            <label>Start Date:</label>
            <div class="info-content">
              <span v-if="!isEditing">{{ formatDate(visitorData.startDate) }}</span>
              <q-input
                v-else
                v-model="visitorData.startDate"
                outlined
                dense
                type="date"
                class="edit-input"
              />
            </div>
          </div>

          <div class="info-row">
            <label>End Date:</label>
            <div class="info-content">
              <span v-if="!isEditing">{{ formatDate(visitorData.endDate) }}</span>
              <q-input
                v-else
                v-model="visitorData.endDate"
                outlined
                dense
                type="date"
                class="edit-input"
              />
            </div>
          </div>

          <div class="info-row">
            <label>Password:</label>
            <div class="info-content">
              <span v-if="!isEditing">••••••••</span>
              <q-input
                v-else
                v-model="visitorData.password"
                outlined
                dense
                placeholder="Enter new password (leave blank to keep current)"
                :type="showPassword ? 'text' : 'password'"
                class="edit-input"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>
            </div>
          </div>

          <div v-if="isEditing && visitorData.password" class="info-row">
            <label>Confirm Password:</label>
            <div class="info-content">
              <q-input
                v-model="visitorData.confirmPassword"
                outlined
                dense
                placeholder="Confirm new password"
                :type="showPassword ? 'text' : 'password'"
                :error="
                  visitorData.password !== visitorData.confirmPassword &&
                  visitorData.confirmPassword !== ''
                "
                error-message="Passwords do not match"
                class="edit-input"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>
            </div>
          </div>

          <!-- Certification Checkbox -->
          <div v-if="isEditing" class="certification-section q-mt-lg">
            <q-checkbox
              v-model="certificationAccepted"
              label="I hereby certify that all the information provided are true and correct to the best of my knowledge."
              color="primary"
            />
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons q-mt-lg">
            <q-btn
              v-if="!isEditing"
              color="primary"
              label="Edit Profile"
              icon="edit"
              @click="startEditing"
            />
            <template v-else>
              <q-btn
                color="primary"
                label="Save"
                icon="save"
                @click="saveProfile"
                :disable="!certificationAccepted || !passwordsMatch"
              />
              <q-btn flat color="grey-7" label="Cancel" @click="cancelEditing" />
            </template>
          </div>
        </div>
      </q-card>

      <!-- Extension Request Dialog -->
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
    </div>
  </q-page>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useQuasar } from 'quasar'

export default {
  name: 'VisitorProfile',
  setup() {
    const $q = useQuasar()

    const isEditing = ref(false)
    const showPassword = ref(false)
    const certificationAccepted = ref(false)
    const profileImage = ref(null)
    const showExtensionDialog = ref(false)
    const hasActiveExtension = ref(false)
    const fileInput = ref(null)

    // Visitor data
    const visitorData = reactive({
      name: 'Michael Johnson',
      email: 'michael.johnson@institution.com',
      contactNumber: '+1-234-567-8900',
      institution: 'Research Institute of Technology',
      purpose: 'Collaborative research on AI and Machine Learning',
      startDate: '2025-10-01',
      endDate: '2025-12-31',
      password: '',
      confirmPassword: '',
    })

    const originalVisitorData = { ...visitorData }

    // Extension request
    const extensionRequest = reactive({
      newEndDate: '',
      reason: '',
      supportingDocument: null,
      certificationAccepted: false,
    })

    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file) {
        // Check file size (5MB max)
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

    const startEditing = () => {
      isEditing.value = true
      certificationAccepted.value = false
    }

    const cancelEditing = () => {
      Object.assign(visitorData, originalVisitorData)
      visitorData.password = ''
      visitorData.confirmPassword = ''
      isEditing.value = false
      certificationAccepted.value = false
      showPassword.value = false
    }

    const saveProfile = () => {
      Object.assign(originalVisitorData, visitorData)
      visitorData.password = ''
      visitorData.confirmPassword = ''

      $q.notify({
        type: 'positive',
        message: 'Profile updated successfully',
        position: 'top',
      })

      isEditing.value = false
      certificationAccepted.value = false
      showPassword.value = false
    }

    const changeProfilePicture = () => {
      $q.notify({
        type: 'info',
        message: 'Profile picture upload functionality',
        position: 'top',
      })
    }

    const submitExtensionRequest = () => {
      hasActiveExtension.value = true
      showExtensionDialog.value = false

      $q.notify({
        type: 'positive',
        message: 'Extension request submitted successfully. Pending approval.',
        position: 'top',
      })

      // Reset extension request
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

    const passwordsMatch = computed(() => {
      return !visitorData.password || visitorData.password === visitorData.confirmPassword
    })

    return {
      isEditing,
      showPassword,
      certificationAccepted,
      profileImage,
      showExtensionDialog,
      hasActiveExtension,
      visitorData,
      extensionRequest,
      fileInput,
      startEditing,
      cancelEditing,
      saveProfile,
      changeProfilePicture,
      submitExtensionRequest,
      formatDate,
      passwordsMatch,
      handleFileSelect,
    }
  },
}
</script>

<style scoped>
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
