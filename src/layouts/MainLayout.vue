<template>
  <div class="q-pa-md main-page-bg">
    <q-layout view="lHh Lpr lFf">
      <!-- Mobile Menu Button -->
      <q-header elevated class="mobile-header" v-if="$q.screen.lt.md">
        <q-toolbar>
          <q-btn
            flat
            dense
            round
            icon="menu"
            aria-label="Menu"
            @click="drawer = !drawer"
          />
          <q-toolbar-title class="mobile-logo">
            <img
              src="\img\logo.png"
              alt="Logo"
              class="mobile-logo-img"
            />
          </q-toolbar-title>
          <!-- Mobile notifications -->
          <q-btn flat round dense class="mobile-notif-btn">
            <img src="/icons/notif-icon.png" alt="notifications" class="notif-image" />
            <q-badge
              floating
              rounded
              class="custom-badge"
              style="background-color: #ff5722; color: white"
              v-if="notificationCount > 0"
            >
              {{ notificationCount }}
            </q-badge>
          </q-btn>
        </q-toolbar>
      </q-header>

      <q-drawer
        v-model="drawer"
        :show-if-above="$q.screen.gt.sm"
        :mini="miniState && $q.screen.gt.sm"
        :mini-to-overlay="$q.screen.gt.sm"
        :mini-width="120"
        @mouseenter="onDrawerMouseEnter"
        @mouseleave="onDrawerMouseLeave"
        :width="$q.screen.lt.md ? '100%' : 280"
        :breakpoint="0"
        :overlay="$q.screen.lt.md"
        bordered
        :class="'sidebar-drawer'"
        content-class="drawer-content"
      >
        <div class="sidebar-container">
          <!-- Close button for mobile -->
          <div class="mobile-close-btn" v-if="$q.screen.lt.md">
            <q-btn
              flat
              round
              dense
              icon="close"
              @click="drawer = false"
              class="absolute-top-right q-ma-md"
            />
          </div>

          <!-- Logo Section -->
          <div class="logo-section">
            <!-- Expanded State -->
            <div class="q-pa-md q-mb-md" v-show="!miniState || $q.screen.lt.md">
              <div class="text-center q-py-lg">
                <img
                  src="\img\logo.png"
                  alt="Your Logo"
                  class="logo-img q-mb-sm"
                  @click="setActiveItem('home')"
                />
              </div>
            </div>

            <!-- Mini State (desktop only) -->
            <div class="q-pa-lg q-mb-sm text-center" v-show="miniState && $q.screen.gt.sm">
              <img
                src="\img\logo.png"
                alt="Logo"
                style="width: 60px; height: 60px; object-fit: contain"
              />
            </div>
          </div>

          <!-- Navigation Section -->
          <div class="navigation-section">
            <q-list padding :class="{ 'text-center': miniState && $q.screen.gt.sm }">
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
                      style="width: 24px; height: 24px; object-fit: contain"
                      class="nav-icon"
                    />
                  </div>
                </q-item-section>
                <q-item-section>
                  <span :class="{ 'text-hidden': miniState && $q.screen.gt.sm }" class="nav-text">{{ item.label }}</span>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Logout Section - Fixed at bottom -->
          <div class="logout-section">
            <q-separator class="q-mb-md" v-show="(!miniState && $q.screen.gt.sm) || $q.screen.lt.md" />
            <q-item
              clickable
              v-ripple
              @click="handleLogout"
              class="logout-item"
              :class="{ 'text-center': miniState && $q.screen.gt.sm }"
            >
              <q-item-section avatar>
                <div class="icon-wrapper">
                  <q-icon name="logout" size="20px" class="logout-icon" />
                </div>
              </q-item-section>
              <q-item-section v-show="(!miniState && $q.screen.gt.sm) || $q.screen.lt.md">
                <span class="logout-text">Logout</span>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </q-drawer>

      <q-page-container>
        <div class="search-toolbar q-py-md q-px-md">
          <q-toolbar class="bg-transparent responsive-toolbar">
            <!-- Search Bar Container -->
            <div class="search-container">
              <q-input
                dense
                outlined
                v-model="search"
                placeholder="Search name, work, year, etc."
                class="search-input"
                input-class="text-left"
                clearable
                clear-icon="close"
                @keyup.enter="performSearch"
              >
                <template v-slot:prepend>
                  <q-icon name="search" @click="performSearch" class="cursor-pointer" />
                </template>
              </q-input>
            </div>

            <!-- Desktop notifications and user profile -->
            <div class="desktop-actions" v-if="$q.screen.gt.sm">
              <!-- Notifications Button -->
              <q-btn flat round dense class="notif-btn">
                <img src="/icons/notif-icon.png" alt="notifications" class="notif-image" />
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

              <q-space/>

              <!-- User Profile Button -->
              <q-btn flat dense class="user-profile-btn">
                <q-avatar size="32px">
                  <img src="\img\UserIcon.jpg" />
                </q-avatar>
                <div class="q-ml-sm user-info" v-if="$q.screen.gt.md">
                  <div class="username-bg">{{ userName }}</div>
                  <div class="text-subtitle2 text-grey user-role">{{ userRole }}</div>
                </div>
              </q-btn>
            </div>
          </q-toolbar>
        </div>

        <router-view />
      </q-page-container>
    </q-layout>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/user'
import { useSearchStore } from 'src/stores/searchStore'

const $q = useQuasar()
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

// Base navigation items
const baseNavItems = [
  { name: 'home', label: 'Home', icon: '\\icons\\home.png' },
  { name: 'appointment', label: 'Appointment', icon: '\\icons\\appointment.png' },
  { name: 'artifacts', label: 'Artifacts', icon: '\\icons\\artifacts.png' },
  { name: 'documents', label: 'Documents', icon: '\\icons\\book.png' },
  { name: 'collections', label: 'Collections', icon: '\\icons\\collections.png' },
  { name: 'gallery', label: 'Gallery', icon: '\\icons\\gallery.png' },
]

// Get profile data from userStore
const userProfile = computed(() => userStore.profile || {})
const userName = computed(() => userProfile.value.first_name || 'User')
const userRole = computed(() => userProfile.value.role || 'Unknown')

// Add computed property to check if user role is 'user'
const isUser = computed(() => userRole.value === 'user')

// Filtered navigation items based on user role
const navItems = computed(() => {
  return baseNavItems.filter(item => {
    // Show collections only for users with 'user' role
    if (item.name === 'collections') {
      return isUser.value
    }
    // Show all other items for everyone
    return true
  })
})

// Add a timeout to prevent rapid state changes
let hoverTimeout = null

const onDrawerMouseEnter = () => {
  if ($q.screen.lt.md) return // Don't change mini state on mobile
  if (hoverTimeout) clearTimeout(hoverTimeout)
  miniState.value = false
}

const onDrawerMouseLeave = () => {
  if ($q.screen.lt.md) return // Don't change mini state on mobile
  if (hoverTimeout) clearTimeout(hoverTimeout)
  miniState.value = true
}

const activeItem = ref('home')

const setActiveItem = (itemName) => {
  activeItem.value = itemName

  // Close mobile drawer when navigating
  if ($q.screen.lt.md) {
    drawer.value = false
  }

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

const handleLogout = async () => {
  try {
    if (confirm('Are you sure you want to logout?')) {
      await userStore.signOut()
      router.replace('/user/login')
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

// Watch for route changes to update active item
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/') {
      activeItem.value = 'home'
    } else if (
      newPath.includes('home') ||
      newPath.includes('admindash') ||
      newPath.includes('collection')
    ) {
      activeItem.value = 'home'
    } else if (newPath.includes('appointment')) {
      activeItem.value = 'appointment'
    } else if (newPath.includes('artifacts')) {
      activeItem.value = 'artifacts'
    } else if (newPath.includes('documents') || newPath.includes('document-scanner')) {
      activeItem.value = 'documents'
    } else if (newPath.includes('collections')) {
      activeItem.value = 'collections'
    } else if (newPath.includes('gallery')) {
      activeItem.value = 'gallery'
    } else {
      activeItem.value = ''
    }
  },
  { immediate: true },
)



</script>

<style scoped>
/* Mobile Header */
.mobile-header {
  background: linear-gradient(135deg, #880000 0%, #660000 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.mobile-logo-img {
  max-height: 40px;
  max-width: 120px;
  object-fit: contain;
}

.mobile-notif-btn {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-radius: 50%;
}

.mobile-close-btn {
  position: relative;
  height: 60px;
}

/* Logo responsive sizing */
.logo-img {
  max-width: 200px;
  max-height: 80px;
  object-fit: contain;
  cursor: pointer;
}

@media (max-width: 599px) {
  .logo-img {
    max-width: 150px;
    max-height: 60px;
  }
}

/* SIDEBAR LAYOUT FIX */
.sidebar-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.logo-section {
  flex-shrink: 0;
}

.navigation-section {
  flex: 1;
  min-height: 0;
  padding: 0 8px;
  /* Only enable scrolling when in mini state or on mobile */
  overflow-y: visible;
}

/* Enable scrolling only in mini state on desktop */
.q-drawer--mini .navigation-section {
  overflow-y: auto;
}

/* Enable scrolling on mobile */
@media (max-width: 1023px) {
  .navigation-section {
    overflow-y: auto;
  }
}

.logout-section {
  flex-shrink: 0;
  padding: 10px;
  margin-top: auto;
  background: inherit;
}

/* SIDEBAR STYLES */
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

/* Navigation and logout items */
.nav-item {
  border-radius: 12px;
  border-radius: 12px;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

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
  width: 44px;
  height: 44px;
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

/* Mini state specific styles */
.text-center .nav-item,
.text-center .logout-item {
  justify-content: center !important;
  padding: 8px !important; /* Reduced padding for mini state */
  margin-bottom: 16px !important; /* Consistent margin for mini state */
}

.text-center .nav-item .q-item__section--avatar,
.text-center .logout-item .q-item__section--avatar {
  min-width: 60px !important;
  justify-content: center !important;
  padding-right: 0 !important;
}

.text-center .q-item__section--main {
  display: none !important;
}

/* Active states */
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

/* Search toolbar completely responsive */
.search-toolbar {
  background: transparent !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 8px 16px !important;
}

.responsive-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-height: 56px;
}

.search-container {
  flex: 1;
  min-width: 200px;
  max-width: 830px;
}

.search-input {
  background: rgba(255, 255, 255, 0.9) !important;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  width: 100%;
}

.search-input .q-field__control {
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.search-input .q-field__native {
  color: #333 !important;
}

.search-input .q-placeholder {
  color: #666 !important;
}

.desktop-actions {
  display: flex;
  align-items: center;
  gap: 65px;
  flex-shrink: 0;
}

/* Notification button styling */
.notif-btn {
  background-color: #f8f8ff !important;
  width: 40px;
  height: 40px;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
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

/* User profile button responsive */
.user-profile-btn {
  background-color: #f8f9fa !important;
  border-radius: 10px;

  min-height: 44px;
  width: 282px;
  display: flex;

  align-items: center;

}

.user-profile-btn:hover {
  background-color: #e9ecef !important;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  line-height: 1.2;
}

.username-bg {
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.user-role {
  font-size: 12px !important;
  line-height: 1 !important;
  margin-top: 2px;
}

/* Mobile-specific responsive styles */
@media (max-width: 1439px) {
  .search-container {
    max-width: 400px;
  }

  .username-bg {
    max-width: 100px;
  }
}

@media (max-width: 1199px) {
  .search-container {
    max-width: 300px;
  }
}

@media (max-width: 1023px) {
  .search-toolbar {
    padding: 12px 16px !important;
  }

  .responsive-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    min-height: auto;
  }

  .search-container {
    max-width: none;
    width: 100%;
  }

  .desktop-actions {
    justify-content: center;
    width: 100%;
  }

  .user-profile-btn {
    justify-content: center;
    min-width: 140px;
  }
}

@media (max-width: 599px) {
  .search-toolbar {
    padding: 8px 12px !important;
  }

  .responsive-toolbar {
    gap: 8px;
  }

  .user-profile-btn {
    min-width: 120px;
    padding: 6px 8px !important;
  }

  .username-bg {
    font-size: 13px;
    max-width: 80px;
  }

  .user-role {
    font-size: 11px !important;
  }
}

/* Ensure drawer content is scrollable on mobile */
@media (max-width: 1023px) {
  .drawer-content {
    height: 100vh;
    overflow-y: auto;
  }
}
</style>
