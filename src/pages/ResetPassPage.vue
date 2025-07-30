<template>
  <q-layout view="lHh Lpr lFf">
    <div
      class="page-background"
      style="background-color: #4d0000; display: flex; justify-content: center; align-items: center"
    >
      <div class="reset-bigbox">
        <div class="q-my-lg column">
          <label class="reset-title q-mb-md">Reset password</label>
          <div class="q-ml-xl">
            <div class="row q-gutter-md items-center">
              <label class="labelNames">New Password: </label>
              <q-input
                filled
                dense
                type="password"
                class="text-box-2"
                style="width: 23rem; margin-left: 2.6rem"
              />
              <label class="labelNames">Confirm Password: </label>
              <q-input filled dense type="password" class="text-box-2" style="width: 23rem" />
            </div>
          </div>
          <div class="row justify-center q-mt-lg">
            <q-btn label="Submit" class="btn-submit" @click="resetSent = true" no-caps />
          </div>

          <q-dialog v-model="resetSent" persistent>
            <q-card class="reset-pass-sent">
              <q-card-section class="column items-center">
                <div class="q-mt-md sub-font-2" style="color: #000000">
                  Password has been reset.
                </div>
              </q-card-section>
              <q-card-actions align="center">
                <q-btn label="Back" class="btn-save" flat />
                <!-- add logic that must go back to log in (respective log in page: admin/user)-->
              </q-card-actions>
            </q-card>
          </q-dialog>
        </div>
      </div>
    </div>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
const resetSent = ref(false)
</script>

<style scoped>
.reset-bigbox {
  width: 38rem;
  height: 16.5rem;
  border-radius: 10px;
  background: linear-gradient(
    334deg,
    #fffce9 6.65%,
    #fffefa 29.43%,
    #fff 7.69%,
    #fffef6 90.7%,
    #fffced 105.52%
  );
  box-shadow: -20px 15px 4px 0px rgba(0, 0, 0, 0.45);
}

.reset-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 26px;
  color: #4d0000;
  text-align: center;
}

.btn-submit {
  width: 5rem;
  height: 2rem;
  border-radius: 5px;
  background-color: #880000;
  color: #ffffff;
  font-size: 14px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
}

.reset-pass-sent {
  border-radius: 10px !important;
  background-color: #fbf4d0;
  width: 17rem;
  padding: 1rem;
  text-align: center;
}
</style>
