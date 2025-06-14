<template>
  <div class="q-pa-md">
    <q-layout view="lHh Lpr lFf">
      <q-drawer
        v-model="drawer"
        show-if-above
        @mouseenter="onDrawerMouseEnter"
        @mouseleave="onDrawerMouseLeave"
        :width="miniState ? 120 : 280"
        :breakpoint="500"
        bordered
        :class="'bg-transparent sidebar-drawer'"
        content-class="drawer-content"
      >
        <div class="absolute-full flex column">
          <!-- Expanded State -->
          <div class="q-pa-md q-mb-md" v-show="!miniState">
            <div class="text-center q-py-lg">
              <img
                src="\src\assets\img\logo.png"
                alt="Your Logo"
                style="max-width: 200px; max-height: 80px; object-fit: contain;"
                class="q-mb-sm"
              />
            </div>
          </div>

          <!-- Mini State -->
          <div class="q-pa-lg q-mb-sm text-center" v-show="miniState">
            <img
              src="\src\assets\img\logo.png"
              alt="Logo"
              style="width: 60px; height: 60px; object-fit: contain;"
            />
          </div>

          <div class="col" />

          <!-- Navigation -->
          <q-list padding :class="{ 'text-center': miniState }">
            <q-item
              v-for="item in navItems"
              :key="item.name"
              clickable
              v-ripple
              :active="activeItem === item.name"
              @click="setActiveItem(item.name)"
              class="nav-item"
            >
              <q-item-section avatar>
                <div class="icon-wrapper">
                  <img
                    :src="item.icon"
                    :alt="item.label"
                    style="width: 30px; height: 30px; object-fit: contain;"
                    class="nav-icon"
                  />
                </div>
              </q-item-section>
              <q-item-section>
                <span :class="{ 'text-hidden': miniState }" class="nav-text">{{ item.label }}</span>
              </q-item-section>
            </q-item>
          </q-list>

          <div class="col" />

          <!-- Logout -->
          <div class="q-pa-md">
            <q-separator class="q-mb-md" v-show="!miniState" />
            <q-item
              clickable
              v-ripple
              @click="handleLogout"
              class="logout-item"
              :class="{ 'text-center': miniState }"
            >
              <q-item-section avatar>
                <div class="icon-wrapper">
                  <q-icon name="logout" size="24px" class="logout-icon" />
                </div>
              </q-item-section>
              <q-item-section v-show="!miniState">
                <span class="logout-text">Logout</span>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </q-drawer>

      <q-page-container>
        <router-view />
      </q-page-container>
    </q-layout>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const drawer = ref(false)
const miniState = ref(true)

const navItems = [
  { name: 'home', label: 'Home', icon: '\\src\\assets\\icon\\home.png' },
  { name: 'artifacts', label: 'Artifacts', icon: '\\src\\assets\\icon\\artifacts.png' },
  { name: 'documents', label: 'Documents', icon: '\\src\\assets\\icon\\book.png' }
]

// Add a timeout to prevent rapid state changes
let hoverTimeout = null

const onDrawerMouseEnter = () => {
  if (hoverTimeout) clearTimeout(hoverTimeout)
  miniState.value = false
}

const onDrawerMouseLeave = () => {
  if (hoverTimeout) clearTimeout(hoverTimeout)
  // Immediate collapse without animation delay
  miniState.value = true
}

const activeItem = ref('home')
const setActiveItem = (itemName) => {
  activeItem.value = itemName

  // Navigate to the corresponding route
  const targetRoute = `/${itemName}`
  router.push(targetRoute)
}

const handleLogout = () => {
  // Add logout logic here
  console.log('Logging out...')

  if (confirm('Are you sure you want to logout?')) {
    router.push('/login')
  }
}

onMounted(() => {
  // Extract the route path without leading slash
  const currentPath = route.path.substring(1)

  // If we're on the root path, set active to 'home'
  if (route.path === '/') {
    activeItem.value = 'home'
  }
  // Otherwise set active to the current path if it matches a sidebar item
  else if (['artifacts', 'documents'].includes(currentPath)) {
    activeItem.value = currentPath
  }
})
</script>

<style scoped>
.sidebar-drawer.q-drawer {
  transition: width 0.3s ease !important;
  overflow: hidden;
}

.text-hidden {
  opacity: 0 !important;
  width: 0 !important;
  overflow: hidden !important;
}

/* Common styles for navigation and logout */
.nav-item, .logout-item {
  margin-bottom: 16px !important;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background-color: rgba(136, 0, 0, 0.08);
}

.logout-item:hover {
  background-color: rgba(220, 53, 69, 0.08);
}

/* Icon wrapper - shared styling */
.icon-wrapper {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  flex-shrink: 0;
}

.nav-item .q-item__section--avatar,
.logout-item .q-item__section--avatar {
  min-width: 60px !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

/* Mini state centering */
.text-center .nav-item {
  justify-content: center !important;
}

.text-center .nav-item .q-item__section--avatar {
  min-width: 60px !important;
  justify-content: center !important;
}

.text-center .q-item__section--main {
  display: none !important;
}

/* mini state */
.nav-item.q-item--active .icon-wrapper {
  background-color: #880000;
  box-shadow: 0 4px 12px rgba(136, 0, 0, 0.3);
}

.nav-item.q-item--active .nav-icon {
  filter: brightness(0) invert(1);
}

.nav-item.q-item--active .nav-text {
  color: #880000;
  font-weight: 600;
}

/* Text styling */
.nav-text, .logout-text {
  font-weight: 500;
  font-size: 16px;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.nav-text {
  color: #2c3e50;
  text-transform: capitalize;
}

.logout-text, .logout-icon {
  color: #7c7c7c;
}

.logout-item:hover .logout-text,
.logout-item:hover .logout-icon {
  color: #c82333;
  font-weight: 600;
}

.logout-item:hover .logout-icon {
  transform: scale(1.1);
}

.sidebar-drawer .q-separator {
  background-color: rgba(0, 0, 0, 0.1);
  height: 1px;
}
</style>
