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
              style="width: 100%; max-width: 830px"
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
                <img src="\src\assets\img\UserIcon.jpg" />
              </q-avatar>
              <div class="q-ml-lg gt-sm">
                <div class="username-bg">{{ userName }}</div>
                <div class="text-subtitle2 text-grey">{{ userRole }}</div>
              </div>
              <!-- <q-menu>
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
              </q-menu> -->
            </q-btn>
          </q-toolbar>
        </div>

        <router-view />
      </q-page-container>
    </q-layout>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from 'src/stores/user'
import { useSearchStore } from 'src/stores/searchStore'

const userStore = useUserStore()
const searchStore = useSearchStore()
const router = useRouter()
const route = useRoute()
const session = userStore.session

const drawer = ref(false)
const miniState = ref(true)
const search = ref('')

// User and notifications data
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

// Get profile data from userStore
const userProfile = computed(() => userStore.profile || {})
const userName = computed(() => userProfile.value.first_name || 'User')
const userRole = computed(() => userProfile.value.role || 'Unknown')

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
const performSearch = async () => {
  const query = search.value
  const currentPath = route.path
  const isDocumentsPage = currentPath.includes('/documents')

  const type = isDocumentsPage ? 'documents' : 'artifacts'

  if (!query.trim()) {
    searchStore.clear()
  } else {
    await searchStore.search(query, type)
    console.log('Search performed:', search.value, type)
  }
}

// Profile and user actions
// const goToProfile = () => {
//   console.log('Going to profile...')
//   router.push('/profile')
// }

// const goToSettings = () => {
//   console.log('Going to settings...')
//   router.push('/settings')
// }

const handleLogout = async () => {
  try {
    if (confirm('Are you sure you want to logout?')) {
      await userStore.signOut()
      router.push('user/login')
    }
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

// Watch search bar input and run query
watch(search, async (query) => {
  if (query === null || query === undefined) {
    searchStore.clear()
    return
  }
})

onMounted(() => {
  // Extract the route path
  const currentPath = route.path.substring(1)

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
/* STYLE FOR SIDEBAR (NASA MAIN LAYOUT) */
.sidebar-drawer.q-drawer {
  overflow: hidden;
}

.text-hidden {
  opacity: 0 !important;
  transform: translateX(-10px) !important;
  transition:
    opacity 0.25s ease,
    transform 0.25s ease !important;
  overflow: hidden !important;
}

.nav-text,
.logout-text {
  opacity: 1;
  transform: translateX(0) !important;
  transition:
    opacity 0.25s ease 0.1s,
    transform 0.25s ease 0.1s !important;
}

/* styles for navigation and logout */
.nav-item,
.logout-item {
  margin-bottom: 16px !important;
  border-radius: 12px;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.nav-item:hover {
  background-color: rgba(136, 0, 0, 0.08);
}

.logout-item:hover {
  background-color: rgba(220, 53, 69, 0.08);
}

.icon-wrapper {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
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
  transform: scale(1.05);
}

.nav-item.q-item--active .nav-icon {
  filter: brightness(0) invert(1);
}

.nav-item.q-item--active .nav-text {
  color: #880000;
  font-weight: 600;
}

/* Text styling */
.nav-text,
.logout-text {
  font-weight: 500;
  font-size: 16px;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.nav-text {
  color: #2c3e50;
  text-transform: capitalize;
}

.logout-text,
.logout-icon {
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

/* Search styling */
.search-toolbar {
  background: transparent !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.search-input {
  background: rgba(255, 255, 255, 0.7) !important;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.search-input .q-field__control {
  background: rgba(255, 255, 255, 0.9) !important;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.search-input .q-field__native {
  color: #333 !important;
}

.search-input .q-placeholder {
  color: #666 !important;
}

/* Notification button styling */
.notif-btn {
  background-color: #f8f8ff !important;
  width: 40px;
  backdrop-filter: blur(10px);
}

.notif-btn:hover {
  background-color: #e0e0e0 !important;
}

.notif-image {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.custom-badge {
  font-size: 11px !important;
  font-weight: bold !important;
  min-width: 18px !important;
  height: 18px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
}

/* User profile button styling */
.user-profile-btn {
  background-color: #f8f9fa !important;
  border-radius: 10px;
  width: 282px;
  padding: 4px 12px !important;
}

.user-profile-btn:hover {
  background-color: #e9ecef !important;
}
</style>
