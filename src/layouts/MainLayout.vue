<template>
  <div class="q-pa-md main-page-bg">
    <q-layout view="lHh Lpr lFf">
      <q-drawer
        v-model="drawer"
        show-if-above
        :mini="miniState"
        mini-to-overlay
        :mini-width="120"
        @mouseenter="onDrawerMouseEnter"
        @mouseleave="onDrawerMouseLeave"
        :width="280"
        :breakpoint="500"
        bordered
        :class="'sidebar-drawer'"
        content-class="drawer-content"
      >
        <div class="absolute-full flex column">
          <!-- Expanded State -->
          <div class="q-pa-md q-mb-md" v-show="!miniState">
            <div class="text-center q-py-lg">
              <img
                src="\src\assets\img\logo.png"
                alt="Your Logo"
                style="max-width: 200px; max-height: 80px; object-fit: contain"
                class="q-mb-sm"
              />
            </div>
          </div>

          <!-- Mini State -->
          <div class="q-pa-lg q-mb-sm text-center" v-show="miniState">
            <img
              src="\src\assets\img\logo.png"
              alt="Logo"
              style="width: 60px; height: 60px; object-fit: contain"
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
                    style="width: 30px; height: 30px; object-fit: contain"
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
        <div class="search-toolbar q-py-md q-px-md">
          <q-toolbar class="bg-transparent">
            <!-- Search Bar -->
            <q-input
              dense
              outlined
              v-model="search"
              placeholder="Search name, work, year, etc."
              class="q-mr-md search-input"
              input-class="text-left"
              clearable
              clear-icon="close"
              @keyup.enter="performSearch"
              style="width: 100%; max-width: 750px"
            >
              <template v-slot:prepend>
                <q-icon name="search" @click="performSearch" class="cursor-pointer" />
              </template>
            </q-input>

            <!-- Notifications Button -->
            <q-btn flat round dense class="q-ml-md custom-spacing notif-btn">
              <img src="/src/assets/icon/notif-icon.png" alt="notifications" class="notif-image" />
              <q-badge
                floating
                rounded
                class="custom-badge"
                style="background-color: #ff5722; color: white"
                v-if="notificationCount > 0"
              >
                {{ notificationCount }}
              </q-badge>
              <q-menu>
                <q-list style="min-width: 150px">
                  <q-item-label header>Notifications</q-item-label>
                  <q-item v-if="notifications.length === 0">
                    <q-item-section>No new notifications</q-item-section>
                  </q-item>
                  <q-item v-for="notif in notifications" :key="notif.id" clickable v-ripple>
                    <q-item-section>{{ notif.message }}</q-item-section>
                    <q-item-section side>{{ notif.time }}</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable class="text-center text-primary">
                    <q-item-section>View All</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>

            <q-space />

            <!-- User Profile Button -->
            <q-btn flat round dense class="custom-spacing user-profile-btn">
              <q-avatar size="32px">
                <img src="https://cdn.quasar.dev/img/avatar.png" />
              </q-avatar>
              <span class="q-ml-lg gt-sm username-bg">{{ userName }}</span>
              <q-menu>
                <q-list style="min-width: 150px">
                  <q-item-label header>{{ userName }}</q-item-label>
                  <q-item clickable v-ripple @click="goToProfile">
                    <q-item-section avatar><q-icon name="person" /></q-item-section>
                    <q-item-section>Profile</q-item-section>
                  </q-item>
                  <q-item clickable v-ripple @click="goToSettings">
                    <q-item-section avatar><q-icon name="settings" /></q-item-section>
                    <q-item-section>Settings</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-ripple @click="handleLogout">
                    <q-item-section avatar><q-icon name="logout" /></q-item-section>
                    <q-item-section>Logout</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-toolbar>
        </div>

        <router-view />
      </q-page-container>
    </q-layout>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUserStore } from 'stores/user'

const userStore = useUserStore()
const session = userStore.session
const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const drawer = ref(false)
const miniState = ref(true)
const search = ref('')

// User and notifications data
const userName = ref('ADMIN')
const notifications = ref([
  { id: 1, message: 'New message from Mrs. Beth', time: '5m ago' },
  { id: 2, message: '⚠️ Notice: The file you uploaded appears incomplete.', time: '1h ago' },
])

const notificationCount = computed(() => notifications.value.length)
const navItems = [
  { name: 'home', label: 'Home', icon: '\\src\\assets\\icon\\home.png' },
  { name: 'artifacts', label: 'Artifacts', icon: '\\src\\assets\\icon\\artifacts.png' },
  { name: 'documents', label: 'Documents', icon: '\\src\\assets\\icon\\book.png' },
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

  if (itemName === 'home') {
    const role = session.user.user_metadata?.role

    if (role === 'admin') {
      activeItem.value = 'home'
      router.push('/admindash')
      return
    } else if (role === 'user') {
      activeItem.value = 'home'
      router.push('/home')
      return
    }
    return
  } else {
    // Navigate to the corresponding route
    const targetRoute = `/${itemName}`
    router.push(targetRoute)
  }
}

// Search functionality
const performSearch = () => {
  console.log('Searching for:', search.value)
  $q.notify({
    message: `Performing search for: "${search.value}"`,
    color: 'positive',
    icon: 'search',
    position: 'top',
  })
}

// Profile and user actions
const goToProfile = () => {
  console.log('Going to profile...')
  router.push('/profile')
}

const goToSettings = () => {
  console.log('Going to settings...')
  router.push('/settings')
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
