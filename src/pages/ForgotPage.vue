<template>
  <q-layout view="lHh Lpr lFf">
    <div
      class="page-background"
      style="background-color: #4d0000; display: flex; justify-content: center; align-items: center"
    >
      <div class="forgot-bigbox">
        <div class="q-my-lg column">
          <label class="reset-title q-mb-md">Forgot password</label>
          <div class="row q-gutter-md items-center justify-center">
            <label class="labelNames">Email: </label>
            <q-input filled dense type="email" class="text-box-2" style="width: 30rem" />
          </div>
          <div class="row justify-center q-mt-lg">
            <q-btn label="Submit" class="btn-submit" @click="resetSent = true" no-caps />
          </div>

          <q-dialog v-model="resetSent" persistent>
            <q-card class="reset-pass-sent">
              <q-card-section class="column items-center">
                <div class="sub-font-2" style="color: #000000">
                  A password reset email has been sent to your registered email address. Please
                  check your inbox.
                </div>
              </q-card-section>
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
.forgot-bigbox {
  width: 38rem;
  height: 13rem;
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
  width: 32rem;
  padding: 1rem;
  text-align: center;
}
</style>
