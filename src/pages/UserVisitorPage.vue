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
              (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Please enter a valid email.',
              checkEmailUnique,
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
                v-model="form.institution"
                lazy-rules
                :rules="[(val) => !!val || 'Please enter your institution.']"
                class="text-box-2"
              />
            </div>
            <div class="col q-ml-md q-gutter-sm">
              <label class="labelNames">Purpose</label>
              <q-input
                filled
                dense
                v-model="form.purpose"
                lazy-rules
                :rules="[(val) => !!val || 'Please enter your purpose of registration.']"
                class="text-box-2"
              />
            </div>
          </div>

          <div class="row q-my-md items-center justify-between">
            <label class="labelNames">Request/Referral Letter:</label>

            <div class="column q-gutter-sm">
              <q-btn
                @click="showDialog = true"
                :label="selectedFile ? selectedFile.name : 'Choose File'"
                class="choose-file"
                no-caps
                unelevated
              />

              <!--  Upload Dialog -->
              <UploadDialog
                v-model="showDialog"
                upload-type="documents"
                accept="application/pdf"
                :uploading="uploading"
                :upload-progress="uploadProgress"
                :pre-selected-file="selectedFile"
                @file-selected="onFileSelected"
                @file-dropped="onFileDropped"
                @cancel-click="handleCancel"
                @upload-click="handleUploadClick"
              />
            </div>
          </div>

          <!-- Start Date with Date Validation -->
          <div class="column q-mt-md">
            <label class="labelNames">Start Date</label>
            <q-input
              dense
              v-model="form.start_date"
              mask="####-##-##"
              placeholder="YYYY-MM-DD"
              :rules="[(val) => !!val || 'Please select a start date.']"
              class="text-box-2"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer" @click="$refs.startDatePicker.show()" />
              </template>
              <q-popup-proxy ref="startDatePicker" transition-show="scale" transition-hide="scale">
                <q-date
                  v-model="form.start_date"
                  mask="YYYY-MM-DD"
                  :options="startDateOptions"
                  :min="minDate"
                  :max="maxDate"
                />
              </q-popup-proxy>
            </q-input>
          </div>

          <!-- End Date with Date Validation -->
          <div class="column q-mt-md">
            <label class="labelNames">End Date</label>
            <q-input
              dense
              v-model="form.end_date"
              mask="####-##-##"
              placeholder="YYYY-MM-DD"
              :rules="[(val) => !!val || 'Please select an end date.']"
              class="text-box-2"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer" @click="$refs.endDatePicker.show()" />
              </template>
              <q-popup-proxy ref="endDatePicker" transition-show="scale" transition-hide="scale">
                <q-date
                  v-model="form.end_date"
                  mask="YYYY-MM-DD"
                  :options="endDateOptions"
                  :min="minDate"
                  :max="maxDate"
                />
              </q-popup-proxy>
            </q-input>
          </div>

          <!-- <label class="labelNames">Password</label>
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
          /> -->
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
          Your registration has been sent. Please check your email within 3-5 business days for
          confirmation.
          <div class="inquiries">For more inquiries, contact <b>preserv3d@gmail.com</b></div>
          <div class="q-mt-lg">
            <!-- change this route to landing page -->
            <router-link to="/landing" class="sub-font"> Back to Log In </router-link>
          </div>
        </div>
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from 'boot/supabase'
import { uploadFileToR2 } from 'boot/r2'
import UploadDialog from 'components/UploadDialog.vue'
import { date } from 'quasar'
import { addMonths, differenceInCalendarDays } from 'date-fns'

const step = ref(1)

const showDialog = ref(false)

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  contact: '',
  institution: '',
  purpose: '',
  letter_url: '',
  start_date: '',
  end_date: '',
})

// Allowed dates: 7 days from current date and within 6 months only
const today = new Date()

// Min selectable date: current date
const minDate = ref(date.formatDate(today, 'YYYY-MM-DD'))

// Max selectable date: 6 months from current date
const maxDateObj = addMonths(today, 6)
const maxDate = ref(date.formatDate(maxDateObj, 'YYYY-MM-DD'))

// Allow only dates starting 7 days from today until 6 months later
const startDateOptions = (val) => {
  const date = new Date(val) // convert string to Date
  const diff = differenceInCalendarDays(date, today)

  return diff >= 7 && diff <= differenceInCalendarDays(maxDateObj, today)
}

// Same rule for end date
const endDateOptions = (val) => startDateOptions(val)

// No date restrictions for date options
// const startDateOptions = () => true
// const endDateOptions = () => true

const handleUploadClick = () => {
  alert('File has been added to your registration.')
  showDialog.value = false
}
// Password strength status
// const passwordStrength = computed(() => {
//   const pwd = form.value.password
//   if (!pwd) return ''

//   const hasUpper = /[A-Z]/.test(pwd)
//   const hasNumber = /[0-9]/.test(pwd)
//   const hasSpecial = /[^a-zA-Z0-9]/.test(pwd)
//   const isLongEnough = pwd.length >= 8

//   return hasUpper && hasNumber && hasSpecial && isLongEnough ? 'Strong' : 'Weak'
// })

// const passwordStrengthColor = computed(() =>
//   passwordStrength.value === 'Strong' ? 'green' : 'red',
// )

// Validate step one inputs
async function validateStepOne() {
  const { first_name, last_name, email, contact } = form.value

  if (!first_name || !last_name || !email || !contact) {
    alert('Please fill out all required fields.')
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address.')
    return
  }

  const emailUnique = await checkEmailUnique(email)
  if (emailUnique !== true) {
    alert(emailUnique)
    return
  }

  step.value++
}

// Check if email already exists in all_users table
const checkEmailUnique = async (val) => {
  if (!val) return true

  const { data, error } = await supabase
    .from('all_users')
    .select('id')
    .eq('email', val)
    .maybeSingle()

  if (error) {
    console.error(error)
    return true
  }

  return !data || 'An account with this email already exists. Please use a different email.'
}

// Register user
async function registerUser() {
  const {
    first_name,
    last_name,
    email,
    contact,
    institution,
    purpose,
    start_date,
    end_date,
    // letter_url,
    // password,
    // confirmPassword,
  } = form.value

  // const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/
  // if (!passwordRegex.test(password)) {
  //   alert(
  //     'Password must be at least 8 characters long and contain an uppercase letter, a number, and a special character.',
  //   )
  //   return
  // }

  // if (password !== confirmPassword) {
  //   alert('Passwords do not match!')
  //   return
  // }

  if (!institution || !purpose) {
    alert('Please fill out all required fields.')
    return
  }

  if (!selectedFile.value) {
    alert('Please upload your request/referral letter.')
    return
  }

  if (!start_date) {
    alert('Please select a start date.')
    return
  }

  if (!end_date) {
    alert('Please select an end date.')
    return
  }

  if (end_date < start_date) {
    alert('End date must be after the start date.')
    return
  }

  try {
    const fileUrl = await handleUpload()
    form.value.letter_url = fileUrl

    const { error } = await supabase.from('registration_visitors').insert([
      {
        first_name,
        last_name,
        email,
        contact,
        institution,
        purpose,
        letter_url: fileUrl,
        status: 'Pending',
        start_date,
        end_date,
      },
    ])

    if (error) {
      alert('Failed to save registration.')
      console.error('Insert error:', error)
      return
    }

    console.log('Registration successfully saved.')

    step.value = 3
  } catch (err) {
    console.log('Error during registration:', err)
    alert('An error occurred during registration. Please try again later.')
  }
}

const selectedFile = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)

const onFileSelected = async (file) => {
  selectedFile.value = file
  await prepareFile()
}

function onFileDropped(file) {
  if (file?.type === 'application/pdf') {
    onFileSelected(file)
  } else {
    alert('Only PDF files are allowed.')
    selectedFile.value = null
  }
}

function sanitizeFileName(name) {
  return name.replace(/[^\w.-]/g, '_')
}

async function uploadFileToStorage(file, fileName) {
  const { error } = await uploadFileToR2(file, 'visitor-letters', fileName)
  return error
}

function handleCancel() {
  selectedFile.value = null
  showDialog.value = false
  uploading.value = false
  uploadProgress.value = 0
}

const prepareFile = async () => {
  if (!selectedFile.value || selectedFile.value.type !== 'application/pdf') {
    alert('Only .pdf files are allowed.')
    return
  }

  const compressedFile = await compressPdf(selectedFile.value)
  if (!compressedFile) {
    alert('Compression failed. Please try again.')
    return
  }

  const fileName = sanitizeFileName(compressedFile.name)
  form.value.pendingLetterFile = { file: compressedFile, name: fileName }
}

// Upload handler
const handleUpload = async () => {
  if (!form.value.pendingLetterFile) {
    throw new Error('No file prepared for upload.')
  }

  uploading.value = true
  uploadProgress.value = 0

  const progressInterval = setInterval(() => {
    if (uploadProgress.value < 90) uploadProgress.value += 1
  }, 200)

  // Upload file
  try {
    const { file, name } = form.value.pendingLetterFile
    const uploadError = await uploadFileToStorage(file, name)

    if (uploadError) throw uploadError

    clearInterval(progressInterval)
    uploadProgress.value = 100

    return `${import.meta.env.VITE_R2_PUBLIC_URL}/visitor-letters/${encodeURIComponent(name)}`
  } finally {
    clearInterval(progressInterval)
    uploading.value = false
    uploadProgress.value = 0
  }
}

// Compress pdf on upload
import { PDFDocument } from 'pdf-lib'

async function compressPdf(file) {
  console.log(`Starting PDF compression for: ${file.name}`)
  const originalSize = file.size

  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })

  const compressedBytes = await pdfDoc.save()
  const compressedFile = new File([compressedBytes], file.name, { type: 'application/pdf' })

  const originalKB = originalSize / 1024
  const compressedKB = compressedFile.size / 1024
  const savedKB = originalKB - compressedKB

  console.log(`PDF Compression success: ${file.name}`)
  console.log(`Original size: ${originalKB.toFixed(2)} KB`)
  console.log(`Compressed size: ${compressedKB.toFixed(2)} KB`)
  console.log(
    `PDF Compression Saved: ${
      savedKB > 0 ? savedKB.toFixed(2) + ' KB' : 'no space (already optimized)'
    }`,
  )

  return compressedFile
}
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
