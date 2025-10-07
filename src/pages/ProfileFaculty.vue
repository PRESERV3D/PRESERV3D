<template>
  <q-page class="q-pa-md">
    <div class="q-mt-xs title">Faculty Profile</div>
    <div class="q-mt-xs q-mb-xl subtitle">
      Manage your account information and preferences.
    </div>

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
        </div>

        <!-- Profile Information -->
        <div class="profile-info-section">
          <div class="info-row">
            <label>Name:</label>
            <div class="info-content">
              <span v-if="!isEditing">{{ facultyData.name }}</span>
              <q-input
                v-else
                v-model="facultyData.name"
                outlined
                dense
                class="edit-input"
              />
            </div>
          </div>

          <div class="info-row">
            <label>Email:</label>
            <div class="info-content">
              <span v-if="!isEditing">{{ facultyData.email }}</span>
              <q-input
                v-else
                v-model="facultyData.email"
                outlined
                dense
                type="email"
                class="edit-input"
              />
            </div>
          </div>

          <div class="info-row">
            <label>College:</label>
            <div class="info-content">
              <span v-if="!isEditing">{{ facultyData.college }}</span>
              <q-input
                v-else
                v-model="facultyData.college"
                outlined
                dense
                class="edit-input"
              />
            </div>
          </div>

          <div class="info-row">
            <label>Department:</label>
            <div class="info-content">
              <span v-if="!isEditing">{{ facultyData.department }}</span>
              <q-input
                v-else
                v-model="facultyData.department"
                outlined
                dense
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
                v-model="facultyData.password"
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

          <div v-if="isEditing && facultyData.password" class="info-row">
            <label>Confirm Password:</label>
            <div class="info-content">
              <q-input
                v-model="facultyData.confirmPassword"
                outlined
                dense
                placeholder="Confirm new password"
                :type="showPassword ? 'text' : 'password'"
                :error="facultyData.password !== facultyData.confirmPassword && facultyData.confirmPassword !== ''"
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
              <q-btn
                flat
                color="grey-7"
                label="Cancel"
                @click="cancelEditing"
              />
            </template>
          </div>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useQuasar } from 'quasar'

export default {
  name: 'FacultyProfile',
  setup() {
    const $q = useQuasar()

    const isEditing = ref(false)
    const showPassword = ref(false)
    const certificationAccepted = ref(false)
    const profileImage = ref(null)

    // Faculty data
    const facultyData = reactive({
      name: 'Dr. John Smith',
      email: 'john.smith@pup.edu.ph',
      college: 'College of Engineering',
      department: 'Computer Science',
      password: '',
      confirmPassword: ''
    })

    const originalFacultyData = { ...facultyData }

    const startEditing = () => {
      isEditing.value = true
      certificationAccepted.value = false
    }

    const cancelEditing = () => {
      Object.assign(facultyData, originalFacultyData)
      facultyData.password = ''
      facultyData.confirmPassword = ''
      isEditing.value = false
      certificationAccepted.value = false
      showPassword.value = false
    }

    const saveProfile = () => {
      Object.assign(originalFacultyData, facultyData)
      facultyData.password = ''
      facultyData.confirmPassword = ''

      $q.notify({
        type: 'positive',
        message: 'Profile updated successfully',
        position: 'top'
      })

      isEditing.value = false
      certificationAccepted.value = false
      showPassword.value = false
    }

    const changeProfilePicture = () => {
      $q.notify({
        type: 'info',
        message: 'Profile picture upload functionality',
        position: 'top'
      })
    }

    const passwordsMatch = computed(() => {
      return !facultyData.password || facultyData.password === facultyData.confirmPassword
    })

    return {
      isEditing,
      showPassword,
      certificationAccepted,
      profileImage,
      facultyData,
      startEditing,
      cancelEditing,
      saveProfile,
      changeProfilePicture,
      passwordsMatch
    }
  }
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
}
</style>
