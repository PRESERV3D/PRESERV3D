<template>
  <div class="q-pa-md form-container">
    <div class="column items-center">
      <label class="form-title">VISITOR SIGN UP</label>
      <label class="subtitle-logsign">Let's Get You Set Up</label>
    </div>

    <q-form @submit.prevent="registerUser">
      <div v-if="step === 1">
        <div class="column q-gutter-sm q-mt-md">
          <label class="labelNames">First Name <span class="required">*</span></label>
          <q-input
            dense
            v-model="form.first_name"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your first name.']"
            class="text-box"
          />
          <label class="labelNames">Last Name <span class="required">*</span></label>
          <q-input
            dense
            v-model="form.last_name"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your last name.']"
            class="text-box"
          />
          <label class="labelNames">Email <span class="required">*</span></label>
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
          <label class="labelNames">Contact Number <span class="required">*</span></label>
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
            <div class="q-mt-md">
              <router-link to="/user/register-option" class="signup-options q-mt-sm">
                Back to Sign Up Options
              </router-link>
            </div>
          </div>

          <div class="column items-center">
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
              <label class="labelNames">Institution <span class="required">*</span></label>
              <q-input
                dense
                v-model="form.institution"
                lazy-rules
                :rules="[(val) => !!val || 'Please enter your institution.']"
                class="text-box-2"
              />
            </div>
            <div class="col q-ml-md q-gutter-sm">
              <label class="labelNames">Purpose <span class="required">*</span></label>
              <q-input
                dense
                v-model="form.purpose"
                lazy-rules
                :rules="[(val) => !!val || 'Please enter your purpose of registration.']"
                class="text-box-2"
              />
            </div>
          </div>

          <div class="row q-my-md items-center justify-between">
            <label class="labelNames"
              >Request/Referral Letter: <span class="required">*</span></label
            >

            <div class="column q-gutter-sm">
              <q-btn
                v-if="!$q.screen.lt.sm"
                @click="showDialog = true"
                :label="selectedFile ? selectedFile.name : 'Choose File'"
                class="choose-file"
                no-caps
                unelevated
              />
              <!-- Show icon button on small screens -->
              <q-btn
                v-else
                @click="showDialog = true"
                icon="attach_file"
                class="choose-file"
                round
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

          <!--Date Validation Field-->
          <div class="row q-mt-lg">
            <div class="col q-gutter-sm">
              <label class="labelNames">Start Date <span class="required">*</span></label>
              <q-input
                dense
                v-model="form.start_date"
                mask="####-##-##"
                placeholder="YYYY-MM-DD"
                :rules="[(val) => !!val || 'Please select a start date.']"
                class="text-box-2"
                style="margin-top: 0.5rem"
              >
                <template v-slot:append>
                  <q-icon
                    name="event"
                    class="cursor-pointer"
                    @click="$refs.startDatePicker.show()"
                  />
                </template>
                <q-popup-proxy
                  ref="startDatePicker"
                  transition-show="scale"
                  transition-hide="scale"
                >
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
            <div class="col q-ml-md q-gutter-sm">
              <label class="labelNames">End Date <span class="required">*</span></label>
              <q-input
                dense
                v-model="form.end_date"
                mask="####-##-##"
                placeholder="YYYY-MM-DD"
                :rules="[(val) => !!val || 'Please select an end date.']"
                class="text-box-2"
                style="margin-top: 0.5rem"
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
          </div>

          <div class="row items-center q-mb-md">
            <q-checkbox v-model="acceptedterms" dense label="" class="terms-checkbox" />
            <div class="terms-font q-ml-sm">
              I understand and agree to the PUP Online Services
              <a
                href="https://www.pup.edu.ph/terms/"
                target="_blank"
                class="terms-font"
                style="text-decoration: underline; color: #560505"
              >
                Terms of Use
              </a>
              and
              <a
                href="https://www.pup.edu.ph/privacy/"
                target="_blank"
                class="terms-font"
                style="text-decoration: underline; color: #560505"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>

        <div class="column items-center q-mt-sm">
          <a @click="step--" class="labelNames cursor-pointer q-mb-sm">Back</a>
          <div v-if="!isSignUpLoading">
            <q-btn
              :disable="!acceptedterms"
              class="visitor-signup-btn"
              push
              text-color="primary"
              label="SIGN UP"
              @click="registerUser"
            />
          </div>
          <q-spinner v-else color="primary" size="30px" class="q-mt-sm" />
        </div>

        <div class="column items-center q-mt-sm">
          <label class="already">
            Already have an account?
            <a href="/user/login" class="signup-login-link">Log In</a>
          </label>
        </div>
      </div>
      <!-- Evaluating Profile Creation -->
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

    <!-- Message Dialog -->
    <q-dialog v-model="notifyDialogOpen">
      <q-card class="sucess-add-to-collection">
        <q-card-section class="sub-font-3" style="font-size: 20px; font-weight: 700">{{
          notifyDialogTitle
        }}</q-card-section>
        <q-card-section class="sub-font-3" style="font-size: 14px; font-weight: 400">{{
          notifyDialogMessage
        }}</q-card-section>
        <q-card-actions>
          <q-btn flat label="Close" class="btn-save" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from 'boot/supabase'
import { uploadFileToR2, deleteFileFromR2 } from 'boot/r2'
import UploadDialog from 'components/UploadDialog.vue'
import { date } from 'quasar'
import { addMonths, startOfDay } from 'date-fns'

const step = ref(1)

const showDialog = ref(false)
const isSignUpLoading = ref(false)

// Notification dialog state
const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

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
const today = startOfDay(new Date())

// Min selectable date: current date
const minDate = ref(date.formatDate(today, 'YYYY-MM-DD'))

// Max selectable date: 6 months from current date
const maxDateObj = addMonths(today, 6)
const maxDate = ref(date.formatDate(maxDateObj, 'YYYY-MM-DD'))

// Allow only dates starting 7 days from current day until 6 months later
const startDateOptions = (val) => {
  const d = startOfDay(new Date(val))

  if (form.value.end_date) {
    const end = startOfDay(new Date(form.value.end_date))
    return d >= today && d <= maxDateObj && d <= end
  }

  return d >= today && d <= maxDateObj
}

const endDateOptions = (val) => {
  const d = startOfDay(new Date(val))
  // Can not select dates earlier than the chosen start date
  if (form.value.start_date) {
    const start = startOfDay(new Date(form.value.start_date))
    return d >= today && d <= maxDateObj && d >= start
  }
  return d >= today && d <= maxDateObj
}

// Notification dialog helper
const showNotifyDialog = (title, message) => {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

const handleUploadClick = () => {
  showNotifyDialog('File Added', 'File has been added to your registration.')
  showDialog.value = false
}

// Validate step one inputs
async function validateStepOne() {
  const { first_name, last_name, email, contact } = form.value

  if (!first_name || !last_name || !email || !contact) {
    showNotifyDialog('Missing Information', 'Please fill out all required fields.')
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showNotifyDialog('Invalid Email', 'Please enter a valid email address.')
    return
  }

  const emailUnique = await checkEmailUnique(email)
  if (emailUnique !== true) {
    return
  }

  step.value++
}

// Check if email already exists in all_users table, pending registrations, or visitor status
const checkEmailUnique = async (val) => {
  if (!val) return true

  try {
    // Email exists in all_users (any user type)
    const { data: existingUser, error: userError } = await supabase
      .from('all_users')
      .select('id, user_type')
      .eq('email', val)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking all_users:', userError)
      return true
    }

    if (existingUser) {
      // If visitor, check account status via approved_visitors_status view
      if (existingUser.user_type === 'visitor') {
        const { data: visitorStatus, error: statusError } = await supabase
          .from('approved_visitors_status')
          .select('account_status, end_date')
          .eq('user_id', existingUser.id)
          .maybeSingle()

        if (statusError && statusError.code !== 'PGRST116') {
          console.error('Error checking visitor status:', statusError)
          showNotifyDialog(
            'Email Already Exists',
            'An account with this email already exists. Please use a different email or log in instead.',
          )
          return false
        }

        if (visitorStatus) {
          if (visitorStatus.account_status === 'Expired') {
            const endDate = new Date(visitorStatus.end_date).toLocaleDateString()
            showNotifyDialog(
              'Expired Visitor Account',
              `A visitor account with this email has expired (ended on ${endDate}). Please contact the administrator to extend your access or use a different email.`,
            )
            return false
          } else if (
            visitorStatus.account_status === 'Active' ||
            visitorStatus.account_status === 'Inactive'
          ) {
            showNotifyDialog(
              'Account Already Exists',
              'An account with this email already exists. If this is you, please log in instead. Otherwise, please use a different email.',
            )
            return false
          } else if (visitorStatus.account_status === 'Pending Confirmation') {
            showNotifyDialog(
              'Pending Email Confirmation',
              'An account with this email exists. If this is you, please check your email for account authentication. Otherwise, please use a different email.',
            )
            return false
          } else if (visitorStatus.account_status === 'Not Started') {
            showNotifyDialog(
              'Account Already Exists',
              'An account with this email already exists. If this is you, please wait for your access period. Otherwise, please use a different email.',
            )
            return false
          }
        }
      } else {
        // Non-visitor user type (student, faculty, admin)
        showNotifyDialog(
          'Account Already Exists',
          'An account with this email already exists. If this is you, please log in instead. Otherwise, please use a different email.',
        )
        return false
      }
    }

    // Email exists in pending visitor registrations
    const { data: pendingRegistration, error: regError } = await supabase
      .from('registration_visitors')
      .select('status, created_at')
      .eq('email', val)
      .maybeSingle()

    if (regError && regError.code !== 'PGRST116') {
      console.error('Error checking registrations:', regError)
      return true
    }

    if (pendingRegistration) {
      if (pendingRegistration.status === 'Pending') {
        showNotifyDialog(
          'Registration Pending',
          `A visitor registration with this email is already pending approval. If this is you, please wait for admin review. Otherwise, please use a different email.`,
        )
        return false
      }
    }

    // Email is unique and available
    return true
  } catch (error) {
    console.error('Error in checkEmailUnique:', error)
    return true
  }
}

// Register user
async function registerUser() {
  isSignUpLoading.value = true
  const { first_name, last_name, email, contact, institution, purpose, start_date, end_date } =
    form.value

  if (!institution || !purpose) {
    showNotifyDialog('Missing Information', 'Please fill out all required fields.')
    isSignUpLoading.value = false
    return
  }

  if (!selectedFile.value) {
    showNotifyDialog('Missing Document', 'Please upload your request/referral letter.')
    isSignUpLoading.value = false
    return
  }

  if (!start_date) {
    showNotifyDialog('Missing Date', 'Please select a start date.')
    isSignUpLoading.value = false
    return
  }

  if (!end_date) {
    showNotifyDialog('Missing Date', 'Please select an end date.')
    isSignUpLoading.value = false
    return
  }

  if (end_date < start_date) {
    showNotifyDialog('Invalid Date Range', 'End date must be after the start date.')
    isSignUpLoading.value = false
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
      // If database insert fails and file is uploaded, delete it from R2
      if (fileUrl) {
        const fileName = decodeURIComponent(fileUrl.split('/').pop())
        console.log('Database insert failed. Deleting uploaded file from R2:', fileName)
        const { error: deleteError } = await deleteFileFromR2('visitor-letters', fileName)
        if (deleteError) {
          console.error('Failed to delete file from R2:', deleteError)
        } else {
          console.log('Successfully deleted file from R2:', fileName)
        }
      }
      showNotifyDialog('Registration Failed', 'Failed to save registration. Please try again.')
      console.error('Insert error:', error)
      isSignUpLoading.value = false
      return
    }

    // Notify all admins of new visitor registration
    const name = `${first_name} ${last_name}`
    const notifMessage = `${name} submitted a visitor account request.`
    await adminNotifications(notifMessage)

    console.log('Registration successfully submitted.')
    isSignUpLoading.value = false
    step.value = 3
  } catch (err) {
    console.log('Error during registration:', err)
    showNotifyDialog('Error', 'An error occurred during registration. Please try again later.')
    isSignUpLoading.value = false
  }
}

async function adminNotifications(notifMessage) {
  try {
    const { data: admins, error: adminError } = await supabase
      .from('registered_admins')
      .select('id')

    if (adminError) {
      console.error('Error fetching admins:', adminError)
      return
    }

    if (!admins || admins.length === 0) {
      console.warn('No existing admins to notify.')
      return
    }

    const notifications = admins.map((admin) => ({
      receiver_id: admin.id,
      message: notifMessage,
      type: 'visitor_registration',
      receiver_role: 'admin',
      read: false,
      created_at: new Date().toISOString(),
    }))

    const { error: notifError } = await supabase.from('notifications').insert(notifications)

    if (notifError) {
      console.log('Error sending notification to all admins:', notifError)
    } else {
      console.log('Notification sent to all admins.')
    }
  } catch (err) {
    console.log('Error in notifying admins:', err)
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
    showNotifyDialog('Invalid File Type', 'Only PDF files are allowed.')
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
const prepareFile = async () => {
  if (!selectedFile.value || selectedFile.value.type !== 'application/pdf') {
    showNotifyDialog('Invalid File Type', 'Only .pdf files are allowed.')
    return
  }

  const compressedFile = await compressPdf(selectedFile.value)
  if (!compressedFile) {
    showNotifyDialog('Compression Failed', 'Compression failed. Please try again.')
    return
  }

  const fileName = sanitizeFileName(compressedFile.name)
  form.value.pendingLetterFile = { file: compressedFile, name: fileName }
}

// Handle upload of files
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
// Terms and Conditions checkbox state
const acceptedterms = ref(false)
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
  min-width: 10rem;
  max-width: 15.5rem;
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

/*Responsiveness for Pupose and Institution*/
@media screen and (max-width: 600px) {
  .row.q-mt-lg {
    flex-direction: column;
  }

  .row.q-mt-lg .col {
    width: 100%;
    margin-left: 0 !important;
  }

  .choose-file {
    min-width: 3rem;
    height: 2rem;
  }
}

:deep(.text-box .q-field__control::before),
:deep(.text-box .q-field__control::after),
:deep(.text-box-2 .q-field__control::before),
:deep(.text-box-2 .q-field__control::after) {
  display: none !important;
}
</style>
