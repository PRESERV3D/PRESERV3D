<!--USER LANDING PAGE-->
<template>
  <div class="page-background">
    <div class="page-header q-pa-md">
      <div class="logo-container">
        <q-img
          src="/img/logo.png"
          alt="Logo"
          style="width: 70px; height: 70px"
          class="logo"
        />
      </div>

      <!-- Trophy Images with Professional Positioning -->
<!--      <div class="trophy-container">-->
<!--        <q-img-->
<!--          src="/img/L-trophy.png"-->
<!--          alt="L Trophy"-->
<!--          class="trophy trophy-left"-->
<!--        />-->

<!--        <q-img-->
<!--          src="/img/R-trophy.png"-->
<!--          alt="R Trophy"-->
<!--          class="trophy trophy-right"-->
<!--        />-->
<!--      </div>-->

      <!-- Text -->
      <div class="main-content" style="position: relative">
        <div class="text-content">
          <div class="title-description-group">
            <h1 class="font-benne text-tertiary text-center title-spacing main-title">
              PRESERV<span class="text-secondary title-3d">3D</span>
            </h1>
            <p
              style="color: #fff6c1; letter-spacing: 0.75px; font-size: 14px; font-weight: 300"
              class="description-text"
            >
              Step into PUP's past through 3D-modeled artifacts and<br />
              scanned documents built to stand the test of time.
            </p>
          </div>
        </div>

        <!-- Centered Auth Buttons in Middle -->
        <div class="auth-buttons-container">
          <div class="auth-buttons">
            <q-btn
              unelevated
              label="Log In"
              class="auth-btn login-btn"
              @click="$router.push('/admin/login')"
            />
            <q-btn
              flat
              label="Sign Up"
              class="auth-btn signup-btn"
              @click="$router.push('/admin/register')"
            />
          </div>
        </div>

        <div class="q-pa-md"></div>
      </div>
    </div>
    <div class="bottom-shadow-overlay"></div>
  </div>
</template>

<script setup>
//
</script>

<style scoped>
.page-background {
  background:
    linear-gradient(0deg, rgba(63, 4, 4, 0.8) 70%, rgba(0, 0, 0, 0.9) 99%),
    url('/img/bg-img.png');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.page-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 80px 80px;
  background-position: center center;
  z-index: 2;
  pointer-events: none;
}

.page-background::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(251, 244, 208, 0.03) 2px, transparent 2px),
    linear-gradient(90deg, rgba(251, 244, 208, 0.05) 2px, transparent 2px);
  background-size: 240px 240px;
  background-position: center center;
  z-index: 3;
  pointer-events: none;
}

.bottom-shadow-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 150px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 20%, transparent 100%);
  z-index: 50;
  pointer-events: none;
}

/* Trophy Container for Professional Layout */
.trophy-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 4;
}

/* Professional Trophy Positioning */
.trophy {
  position: absolute;
  object-fit: contain;
  opacity: 0.9;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.trophy-left {
  width: 280px;
  height: auto;
  bottom: 10%;
  left: 5%;
  transform: rotate(-5deg);
}

.trophy-right {
  width: 320px;
  height: auto;
  bottom: 8%;
  right: 5%;
  transform: rotate(3deg);
}

/* Logo Styling */
.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  position: relative;
  z-index: 15;
}

.logo {
  flex-shrink: 0;
  aspect-ratio: 1/1;
}

/* Text Content Styling */
.text-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
  position: relative;
  z-index: 15;
}

/* Main title positioning */
.main-title {
  margin-top: 50px;
}

/* Title and description grouping */
.title-description-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Remove margin from description text and overlap with title */
.description-text {
  margin: 0 !important;
  margin-top: -60px !important;
}

/* Auth Buttons Styling */
.auth-buttons-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 60px;
  margin-bottom: 40px;
  position: relative;
  z-index: 15;
}

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  border-radius: 12px;
  padding: 24px 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  min-width: 200px;
}

.auth-btn {
  width: 100%;
  height: 48px;
  font-weight: 500;
  font-size: 15px;
  letter-spacing: 0.3px;
  border-radius: 8px;
  transition: all 0.2s ease;
  text-transform: none;
}

.signup-btn {
  color: #fbf4d0;
  background: transparent;
  border: 1px solid rgba(251, 244, 208, 0.3);
}

.signup-btn:hover {
  background: rgba(251, 244, 208, 0.08);
  border-color: rgba(251, 244, 208, 0.5);
}

.login-btn {
  color: #1a1611;
  background: linear-gradient(135deg, #fbf4d0 0%, #f0e49a 100%);
  border: none;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(251, 244, 208, 0.25);
}

.login-btn:hover {
  background: linear-gradient(135deg, #fff8dc 0%, #f4e8a6 100%);
  box-shadow: 0 4px 12px rgba(251, 244, 208, 0.35);
}

/* Responsive Design for Trophies */
@media (max-width: 1200px) {
  .trophy-left {
    width: 220px;
    left: 2%;
  }

  .trophy-right {
    width: 260px;
    right: 2%;
  }
}

@media (max-width: 768px) {
  .trophy-left {
    width: 160px;
    bottom: 15%;
    left: -5%;
    opacity: 0.6;
  }

  .trophy-right {
    width: 180px;
    bottom: 12%;
    right: -5%;
    opacity: 0.6;
  }
}

@media (max-width: 480px) {
  .trophy-left,
  .trophy-right {
    display: none;
  }
}

@font-face {
  font-family: 'Benne';
  src: url(src/assets/fonts/Benne.ttf) format('truetype');
}

.font-benne {
  font-family: 'Benne', sans-serif;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
}

.main-tile {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 15px;
  z-index: 100;
  width: 100%;
  text-align: center;
}
</style>
