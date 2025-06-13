<template>
  <div class="page-background">
    <div class="page-header q-pa-md">
      <q-toolbar class="toolbar">
        <q-space />

        <div class="flex flex-center">
          <q-img
            src="src/assets/img/logo.png"
            alt="Logo"
            style="width: 70px; height: 70px; flex-shrink: 0; aspect-ratio: 1/1; left: 100%"
            class="q-px-auto q-mt-sm"
          />
        </div>
        <q-space />
        <!-- Buttons -->
        <q-btn
          flat
          label="Sign Up"
          style="color: #fbf4d0"
          class="btn"
          @click="$router.push('/signup')"
        />
        <q-btn
          flat
          label="Log In"
          style="color: #fbf4d0"
          class="btn"
          @click="$router.push('/login')"
        />
      </q-toolbar>
      <!-- Text -->
      <div class="main-content" style="position: relative">
        <div class="q-ma-xl" style="padding-left: 30px">
          <h4 class="text-secondary text-weight-bold q-mb-none" style="letter-spacing: 0.75px">
            Preserving History.<br />
            Empower Discovery.
          </h4>
          <p
            style="color: #fff6c1; letter-spacing: 0.75px; font-size: 14px; font-weight: 300"
            class="q-mt-md"
          >
            Step into PUP's past through 3D-modeled artifacts and<br />
            scanned documents built to stand the test of time.
          </p>
        </div>
        <!-- Images -->
        <q-img
          src="src/assets/img/c-trophy.png"
          alt="C Trophy"
          style="
            width: 670px;
            height: auto;
            position: absolute;
            bottom: -300px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1;
            object-fit: contain;
          "
          class="q-px-auto"
        />

        <q-img
          src="src/assets/img/l-trophy.png"
          alt="L Trophy"
          style="
            width: 325px;
            height: auto;
            position: absolute;
            bottom: -310px;
            right: 1000px;
            z-index: 1;
            object-fit: contain;
          "
          class="q-px-auto"
        />

        <q-img
          src="src/assets/img/r-trophy.png"
          alt="R Trophy"
          style="
            width: 380px; /* Adjust width as needed */
            height: auto; /* Let height adjust proportionally */
            position: absolute;
            bottom: -300px; /* Adjust this value to move it up or down */
            left: 1000px; /* Adjust this value to move it left or right */
            z-index: 1; /* Ensure it overlaps text if needed */
            object-fit: contain;
          "
          class="q-px-auto"
        />
        <div class="q-pa-md"></div>
      </div>
    </div>
    <div class="bottom-shadow-overlay"></div>

    <div class="main-tile">
      <div class="q-pa-md">
        <h1 class="font-benne text-tertiary text-center" style="letter-spacing: 5px">
          PRESERV<span class="text-secondary">3D</span>
        </h1>
      </div>
    </div>
  </div>
</template>

<script setup>
// import TrophySelector from 'pages/TrophySelector.vue'
// //
</script>
