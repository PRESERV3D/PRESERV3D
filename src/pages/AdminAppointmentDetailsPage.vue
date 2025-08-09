<template>
  <q-page class="q-pa-md">
    <div class="items-start q-mt-sm">
      <router-link to="/adminappointments" class="back-button-top">
        <q-btn flat icon="arrow_back" label="Back to Appointments" />
      </router-link>
    </div>

    <div class="q-mt-xl q-mx-md userdetails">
      <div class="row justify-between q-pa-lg">
        <!-- LEFT SIDE: User Details -->
        <div class="column">
          <p class="appoint-font"><strong>Name:</strong> Juan de la Cruz</p>
          <p class="appoint-font"><strong>Email:</strong> juandelacruz@iskolarngbayan.pup.edu.ph</p>
          <p class="appoint-font"><strong>User Type:</strong> PUP Student</p>
          <p class="appoint-font"><strong>Contact Number:</strong> 09XXXXXXXXX</p>
          <p class="appoint-font"><strong>Purpose of Visit: </strong> Lorem ipsum dolor ip set</p>
          <p class="appoint-font"><strong>Date: </strong> 07/25/2025</p>
          <p class="appoint-font"><strong>Time: </strong> 11:00</p>
          <div class="appoint-font">
            <strong>Comments:</strong>
            <ul class="space">
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit</li>
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit</li>
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit</li>
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit</li>
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit</li>
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit</li>
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit</li>
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit</li>
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit</li>
            </ul>
          </div>
        </div>

        <!-- RIGHT SIDE: Action Buttons -->
        <div class="column">
          <!-- Show Accept/Reject buttons if not yet reviewed -->
          <div v-if="status === null" class="row q-gutter-md">
            <q-btn class="action-btns" label="Accept" @click="status = 'accepted'" />
            <q-btn class="action-btns" label="Reject" @click="openRejectDialog" />
          </div>

          <!-- Show Accepted state -->
          <div v-else-if="status === 'accepted'" class="row justify-end q-gutter-md">
            <div
              class="appoint-font cursor-pointer"
              style="line-height: 2.2rem"
              @click="resetStatus"
            >
              Undo
            </div>
            <q-btn class="after-action" style="background-color: #408f4c" label="Accepted" />
          </div>

          <!-- Show Rejected state -->
          <div v-else class="row justify-end q-gutter-md">
            <div
              class="appoint-font cursor-pointer"
              style="line-height: 2.2rem"
              @click="resetStatus"
            >
              Undo
            </div>
            <q-btn class="after-action" style="background-color: #880000" label="Rejected" />
          </div>

          <!-- Common Reviewed Info (for both accepted and rejected) -->
          <div v-if="status !== null" class="q-mt-md text-width">
            <p class="appoint-font space">
              <strong>Reviewed By:</strong><br />
              林一
            </p>
            <p class="appoint-font space">
              <strong>Reviewed On:</strong><br />
              07/28/2025 11:58:24 p.m.
            </p>

            <!-- Show Remarks only when rejected -->
            <div v-if="status === 'rejected'" class="q-mt-xl">
              <p class="appoint-font space">
                <strong>Remarks:</strong><br />
                {{ remarks }}
              </p>
            </div>
          </div>

          <!-- Q-Dialog for entering remarks -->
          <q-dialog v-model="showDialog" persistent>
            <q-card class="remark-card">
              <div>
                <div
                  class="sub-font-3 flex justify-center"
                  style="font-size: 16px; font-weight: 700; margin-top: 0.5rem"
                >
                  Remark
                </div>
              </div>

              <q-card-section class="q-mb-sm">
                <q-input
                  v-model="tempRemarks"
                  type="textarea"
                  outlined
                  dense
                  label="Type your Remarks"
                  class="remark-typearea"
                />
              </q-card-section>

              <div class="remark-btn-position">
                <q-btn flat label="Confirm" class="btn-save" @click="confirmReject" />
                <q-btn
                  flat
                  label="Cancel"
                  class="sub-font-2"
                  style="position: absolute; right: 1rem; color: #000000"
                  v-close-popup
                  @click="tempRemarks = ''"
                />
              </div>
            </q-card>
          </q-dialog>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const status = ref(null)

const remarks = ref('')
const tempRemarks = ref('')
const showDialog = ref(false)

function openRejectDialog() {
  tempRemarks.value = ''
  showDialog.value = true
}

function confirmReject() {
  remarks.value = tempRemarks.value.trim()
  status.value = 'rejected'
  showDialog.value = false
}

function resetStatus() {
  status.value = null
  remarks.value = ''
}
</script>

<style scoped>
.userdetails {
  border-radius: 10px;
  background: white;
  flex: 2;
  min-width: 0;
  height: auto;
  box-shadow: 10px 4px 10px rgba(102, 102, 102, 0.25);
  border-top: 0.5rem solid #560505;
}
.appoint-font {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: black;
}
.action-btns {
  width: 6rem;
  height: 2rem;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: black;
  border-radius: 7px;
  border: 1px solid #560505;
}
.space {
  line-height: 2rem;
}

.after-action {
  width: 6rem;
  height: 2rem;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: white;
  border-radius: 7px;
}

.text-width {
  width: 25rem;
}

.remark-card {
  width: 32rem;
  height: 17rem;
  border-radius: 10px !important;
  background-color: #fbf4d0;
  padding: 1rem;
}

.remark-btn-position {
  position: relative;
  display: flex;
  justify-content: center;
}

.remark-typearea {
  width: 100%;
  height: rem;
  background-color: white;
}

.remark-typearea ::v-deep(textarea) {
  resize: none !important;
}
</style>
