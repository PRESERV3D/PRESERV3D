<template>
  <div class="q-pa-md form-container">
    <div class="column items-center">
      <label class="form-title">SIGN UP</label>
      <label class="subtitle-logsign">Let's Get You Set Up</label>
    </div>

    <q-form @submit.prevent="registerUser">
      <div v-if="step === 1">
        <div class="column q-gutter-sm">
          <label class="labelNames">First Name</label>
          <q-input
            dense
            v-model="form.first_name"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your first name.']"
            class="text-box"
          />
          <label class="labelNames">Last Name</label>
          <q-input
            dense
            v-model="form.last_name"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your last name.']"
            class="text-box"
          />
          <label class="labelNames">Email</label>
          <q-input
            dense
            v-model="form.email"
            type="email"
            lazy-rules
            :rules="[
              (val) => !!val || 'Please enter your email.',
              (val) =>
                val.includes('@iskolarngbayan.pup.edu.ph') || 'Please use your PUP email only.',
            ]"
            class="text-box"
          />
          <label class="labelNames">Contact Number</label>
          <q-input
            dense
            v-model="form.contact"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your contact number.']"
            class="text-box"
          />
          <div class="column items-center q-mt-xs">
            <q-btn class="visitor-next-btn" push @click="validateStepOne">
              <img src="/icons/visitor-arrow-next.png" alt="next" class="btn-icon" />
            </q-btn>
          </div>

          <div class="column items-center q-mb-xs">
            <label class="already">
              Already have an account?
              <router-link to="/user/login" name="user-login" class="signup-login-link"
                >Log In</router-link
              >
            </label>
          </div>
        </div>
      </div>

      <div v-if="step === 2">
        <div class="column q-mt-md q-gutter-sm">
          <div class="row q-mt-lg">
            <div class="col q-gutter-sm">
              <label class="labelNames">Institution</label>
              <q-input
                dense
                v-model="form.first_name"
                lazy-rules
                :rules="[(val) => !!val || 'Please enter your institution.']"
                class="text-box-2"
              />
            </div>
            <div class="col q-ml-md q-gutter-sm">
              <label class="labelNames">Purpose</label>
              <q-input filled dense v-model="form.purpose" class="text-box-2" />
            </div>
          </div>

          <div class="row q-my-md items-center justify-between">
            <label class="labelNames">Request/Referral Letter:</label>

            <div class="column q-gutter-sm">
              <q-btn
                @click="showDialog = true"
                label="Choose File"
                class="choose-file"
                no-caps
                unelevated
              />

              <!-- <q-dialog v-model="showDialog" persistent>
                  <q-card class="add-documentarti-card">
                    <q-card-section
                      class="box-upload-docuarti"
                      @dragover.prevent="onDragOver"
                      @dragleave.prevent="onDragLeave"
                      @drop.prevent="onFileDrop"
                      :class="{ 'drag-over': isDragging }"
                    >
                      <q-img
                        src="/img/drag-drop-icon.png"
                        alt="Upload-Document"
                        class="upload-icon-docu"
                      />
                      <div
                        v-if="!selectedFile"
                        class="sub-font-3 text-center"
                        style="font-size: 14px; font-weight: 200"
                      >
                        <div
                          class="sub-font-3 text-center"
                          style="font-size: 18px; font-weight: 200"
                        >
                          DRAG and DROP files
                        </div>
                        or
                        <a href="#" @click.prevent="triggerFileInput"
                          ><strong>Browse Files</strong></a
                        >
                        on your computer
                      </div>
                      <div v-else class="documentarti-preview text-center">
                        <q-img
                          src="/img/document-icon.png"
                          alt="Document"
                          class="document-icon"
                        />
                        <div class="selected-document-name q-mt-md">
                          {{ selectedFile.name }}
                        </div>
                        <q-linear-progress
                          v-if="uploading"
                          :value="uploadProgress / 100"
                          color="primary"
                          class="q-mt-md full-width"
                        />
                      </div>
                      <input
                        type="file"
                        ref="fileInput"
                        accept=".pdf"
                        style="display: none"
                        @change="handleFileChange"
                      />
                    </q-card-section>

                    <q-card-actions class="row q-ml-lg justify-between items-center">
                      <div></div>
                      <q-btn
                        v-if="!uploading"
                        label="Upload"
                        class="q-ml-xl q-mt-sm btn-save"
                        @click="handleUpload"
                        no-caps
                      />

                      <q-spinner v-else color="primary" size="2em" class="q-ml-xl q-mt-sm" />

                      <q-btn
                        flat
                        label="Cancel"
                        class="q-mt-sm sub-font-2"
                        style="color: #000000"
                        v-close-popup
                        no-caps
                        @click="handleCancel"
                      />
                    </q-card-actions>
                  </q-card>
                </q-dialog> -->
            </div>
            <label class="q-mt-md note">File type: .pdf or .docx only</label>
          </div>
          <label class="labelNames">Password</label>
          <q-input
            dense
            v-model="form.password"
            type="password"
            :hint="passwordStrength"
            :color="passwordStrengthColor"
            lazy-rules
            :rules="[
              (val) => !!val || 'Please enter your password.',
              (val) => val.length >= 8 || 'Must be at least 8 characters long.',
              (val) =>
                (/[A-Z]/.test(val) && /[0-9]/.test(val) && /[^a-zA-Z0-9]/.test(val)) ||
                'Must contain an uppercase letter, a number, and a special character.',
            ]"
            class="text-box"
          />
          <label class="labelNames">Confirm Password</label>
          <q-input
            dense
            v-model="form.confirmPassword"
            type="password"
            lazy-rules
            :rules="[
              (val) => !!val || 'Please confirm your password.',
              (val) => val === form.password || 'Passwords do not match.',
            ]"
            class="text-box"
          />
        </div>

        <div class="column items-center">
          <a @click="step--" class="labelNames cursor-pointer q-mb-sm">Back</a>
          <q-btn
            class="visitor-signup-btn"
            push
            text-color="primary"
            label="SIGN UP"
            @click="registerUser"
          />
        </div>

        <div class="column items-center q-mt-sm">
          <label class="already">
            Already have an account?
            <a href="/user/login" class="signup-login-link">Log In</a>
          </label>
        </div>
      </div>
      <!-- STEP 3: Evaluating Profile Creation -->
      <div v-if="step === 3" class="column items-center q-my-md q-gutter-md">
        <q-img src="/img/hourglass.png" alt="Pending" class="trophies" style="max-width: 150px" />

        <div class="q-my-md evaluating-title">EVALUATING PROFILE CREATION</div>

        <div class="subtitle-logsign text-center" style="max-width: 360px; margin: 0 auto">
          Your request has been sent. Please allow 3–5 business days for processing.
          <div class="inquiries">For more inquiries, contact <b>preserv3d@gmail.com</b></div>
          <div class="q-mt-lg">
            <!-- change this route to landing page -->
            <router-link to="/user/login" class="sub-font"> Back to Log In </router-link>
          </div>
        </div>
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Step state for form navigation
const step = ref(1)

// Example form object (add your actual form fields as needed)
const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  contact: '',
  password: '',
  confirmPassword: '',
})

// Example password strength logic (replace with your actual logic)
const passwordStrength = computed(() => {
  if (form.value.password.length >= 8) return 'Strong'
  if (form.value.password.length > 0) return 'Weak'
  return ''
})
const passwordStrengthColor = computed(() => {
  if (form.value.password.length >= 8) return 'green'
  if (form.value.password.length > 0) return 'red'
  return ''
})

// Example validateStepOne function (implement your actual validation logic)
function validateStepOne() {
  // Add your validation logic here
  step.value = 2
}

// Example registerUser function (implement your actual registration logic)
function registerUser() {
  step.value = 3
  // Add your registration logic here
}

const showDialog = ref(false)
</script>

<style scoped>
.visitor-next-btn {
  width: 58px;
  height: 42px;
  border-radius: 17px;
  box-shadow: 0 2px 6px rgba(86, 5, 5, 0.22);
  background-color: rgba(204, 172, 0, 0.7);
}

.visitor-signup-btn {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 18px;
  width: 15rem;
  border-radius: 25px;
  box-shadow: 0 5px 15px rgba(128, 128, 128, 0.8);
  background-color: rgba(204, 172, 0, 0.7);
}

.choose-file {
  background-color: rgba(204, 172, 0, 0.7);
  width: 10rem;
  color: #560505;
  border-radius: 8px;
  font-weight: 400;
  transition: all 0.2s ease;
}

.note {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 10px;
  font-style: italic;
  color: #560505;
}
.evaluating-title {
  font-family: 'Poppins', sans-serif;
  color: #560505;
  font-size: 32px;
  font-weight: 700;
  max-width: 25rem;
  text-align: center;
}

.evaluating-sub {
  font-family: 'Poppins', sans-serif;
  color: #616161;
  font-size: 14px;
  font-weight: 500;
}

.sub-font {
  text-decoration: none;
}

.inquiries {
  margin-top: 2rem;
  font-size: 14px;
  font-weight: 500;
}
</style>
