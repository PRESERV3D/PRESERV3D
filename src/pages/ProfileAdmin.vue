<template>
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
              :error="facultyData.password !== facultyData.confirmPassword"
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
      email: 'john.smith@university.edu',
      college: 'College of Engineering',
      department: 'Computer Science',
      password: '',
      confirmPassword: ''
    })

    const originalFacultyData = JSON.parse(JSON.stringify(facultyData))

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
      // Update original data
      Object.assign(originalFacultyData, facultyData)

      // Save to localStorage (optional)
      const userData = {
        userType: 'faculty',
        ...facultyData
      }
      localStorage.setItem('facultyProfile', JSON.stringify(userData))

      // Clear passwords
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
