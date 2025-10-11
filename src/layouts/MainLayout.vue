<template>
  <div class="q-pa-md main-page-bg">
    <q-layout view="lHh Lpr lFf">
      <q-drawer
        v-model="drawer"
        :show-if-above="true"
        :mini="miniState"
        :mini-to-overlay="true"
        :mini-width="120"
        @mouseenter="onDrawerMouseEnter"
        @mouseleave="onDrawerMouseLeave"
        :width="280"
        :breakpoint="0"
        bordered
        :class="'sidebar-drawer'"
        content-class="drawer-content"
      >
        <div class="sidebar-container">
          <!-- Logo Section -->
          <div class="logo-section">
            <!-- Expanded State -->
            <div class="q-pa-md q-mb-md" v-show="!miniState || isHovered">
              <div class="text-center q-py-lg">
                <img
                  src="\img\logo.png"
                  alt="PRESERV3D"
                  class="logo-img q-mb-sm"
                  @click="setActiveItem('home')"
                />
              </div>
            </div>

            <!-- Mini State -->
            <div class="q-pa-lg q-mb-sm text-center" v-show="miniState && !isHovered">
              <img
                src="\img\logo.png"
                alt="Logo"
                style="width: 60px; height: 60px; object-fit: contain"
              />
            </div>
          </div>

          <!-- Navigation Section -->
          <div class="navigation-section" :class="{ 'hovered-lift': isHovered, 'compact-height': isShortScreen, 'very-compact-height': isVeryShortScreen }">
            <q-list padding :class="{ 'text-center': miniState && !isHovered }">
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
                  <span :class="{ 'text-hidden': miniState && !isHovered }" class="nav-text">{{
                    item.label
                  }}</span>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Logout Section - Fixed at bottom -->
          <div class="logout-section">
            <q-separator class="q-mb-md" v-show="!miniState || isHovered" />
            <q-item
              clickable
              v-ripple
              @click="handleLogout"
              class="logout-item"
              :class="{ 'text-center': miniState && !isHovered }"
            >
              <q-item-section avatar>
                <div class="icon-wrapper">
                  <q-icon name="logout" size="20px" class="logout-icon" />
                </div>
              </q-item-section>
              <q-item-section v-show="!miniState || isHovered">
                <span class="logout-text">Logout</span>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </q-drawer>

      <q-page-container>
        <div v-if="noToolBar" class="search-toolbar">
          <div class="responsive-toolbar-container">
            <!-- Search Bar Container - hidden on some pages -->
            <div v-if="hasSearchBar" class="search-container">
              <q-input
                dense
                outlined
                v-model="search"
                placeholder="Search name, work, year, etc."
                clearable
                clear-icon="close"
                @keyup.enter="performSearch"
                class="search-input no-gap"
                style="width: 100%"
              >
                <!-- dropdown select on the far left -->
                <template v-slot:prepend>
                  <q-select
                    dense
                    borderless
                    flat
                    v-model="searchType"
                    :options="searchOptions"
                    emit-value
                    map-options
                    @update:model-value="performSearch"
                    style="width: 140px; text-align: center"
                    popup-content-style="text-align: center; text-transform: capitalize;"
                  >
                    <template v-slot:selected>
                      <div style="width: 100%; text-align: center; text-transform: capitalize">
                        {{ searchType }}
                      </div>
                    </template>
                  </q-select>

                  <!-- search icon appears right after dropdown -->
                  <q-icon
                    name="search"
                    @click="performSearch"
                    class="cursor-pointer"
                    style="margin: 0 8px"
                  />
                </template>

                <!-- Advanced Search Button -->
                <template v-slot:append>
                  <q-btn
                    flat
                    dense
                    round
                    icon="tune"
                    @click="showAdvancedSearch = true"
                    class="advanced-search-btn"
                  >
                    <q-tooltip>Advanced Search</q-tooltip>
                  </q-btn>
                </template>
              </q-input>
            </div>

            <!-- Hidden spacer when search bar is not present -->
            <div v-else class="search-container-hidden"></div>

            <!-- Spacer to push actions to the right -->
            <div class="toolbar-spacer" style="flex: 1;"></div>

            <!-- Notifications and user profile -->
            <div class="toolbar-actions" :class="{ 'no-search': !hasSearchBar }">
              <!-- Notifications Button -->
              <q-btn flat round dense class="notif-btn" :class="{ 'no-search': !hasSearchBar }">
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
                <q-menu class="notifications-menu">
                  <q-card class="notifications-card">
                    <q-card-section class="notifications-header">
                      <div class="text-h6">Notifications</div>
                      <q-btn
                        flat
                        dense
                        round
                        icon="clear_all"
                        @click="clearAllNotifications"
                        class="clear-all-btn"
                        v-if="notifications.length > 0"
                      >
                        <q-tooltip>Clear All</q-tooltip>
                      </q-btn>
                    </q-card-section>

                    <q-scroll-area class="notifications-scroll-area">
                      <q-list class="notifications-list">
                        <q-item v-if="notifications.length === 0" class="no-notifications">
                          <q-item-section avatar>
                            <q-icon name="notifications_off" color="grey-5" />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>No new notifications</q-item-label>
                          </q-item-section>
                        </q-item>

                        <q-item
                          v-for="notif in notifications"
                          :key="notif.id"
                          clickable
                          v-ripple
                          @click="openNotification(notif)"
                          class="notification-item"
                          :class="{ unread: !notif.read }"
                        >
                          <q-item-section avatar>
                            <div class="notification-icon">
                              <q-icon
                                :name="getNotificationIcon(notif.type)"
                                :color="notif.read ? 'grey-5' : 'primary'"
                              />
                            </div>
                          </q-item-section>

                          <q-item-section>
                            <q-item-label
                              class="notification-message"
                              :class="{ 'text-bold': !notif.read }"
                            >
                              {{ notif.message }}
                            </q-item-label>
                            <q-item-label caption class="notification-time">
                              {{ notif.dateTime }}
                            </q-item-label>
                          </q-item-section>

                          <q-item-section side top v-if="!notif.read">
                            <q-badge rounded color="primary" class="unread-dot" />
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-scroll-area>

                    <q-separator v-if="notifications.length > 0" />

                    <q-card-actions class="notifications-actions" v-if="notifications.length > 0">
                      <q-btn
                        flat
                        label="Clear All"
                        color="primary"
                        class="full-width clear-all-bottom-btn"
                        @click="clearAllNotifications"
                        icon="clear_all"
                      />
                    </q-card-actions>
                  </q-card>
                </q-menu>
              </q-btn>
              <!-- User Profile Button -->
              <q-btn
                flat
                dense
                class="user-profile-btn"
                :class="{ compact: isCompactMode }"
                @click="goToProfile"
              >
                <q-avatar size="32px">
                  <img src="\img\UserIcon.jpg" />
                </q-avatar>
                <div class="user-info" v-show="!isCompactMode">
                  <div class="username-bg">{{ userName }}</div>
                  <div class="text-subtitle2 text-grey user-role">{{ userType }}</div>
                </div>
                <q-tooltip v-if="isCompactMode" anchor="bottom middle" self="top middle">
                  {{ userName }} ({{ userType }})
                </q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <!-- Advanced Search Dialog -->
        <q-dialog v-model="showAdvancedSearch" persistent>
          <q-card class="advanced-search-dialog">
            <q-card-section class="row items-center q-pb-none q-mb-lg">
              <div class="text-h6">Advanced Search</div>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="q-pt-none">
              <div class="q-gutter-md">
                <!-- Search Type -->
                <q-select
                  outlined
                  v-model="searchType"
                  :options="searchOptions"
                  label="Search In"
                  placeholder="Select field..."
                  emit-value
                  map-options
                />

                <!-- Search For -->
                <q-select
                  outlined
                  v-model="advancedSearch.field"
                  :options="[
                    { label: 'General', value: 'general' },
                    { label: 'Title', value: 'title' },
                    { label: 'Author(s)', value: 'author' },
                    { label: 'Summary / Abstract', value: 'summary' },
                    { label: 'Keywords', value: 'keywords' },
                  ]"
                  label="Search For"
                  emit-value
                  map-options
                />

                <!-- Search Input -->
                <q-input
                  outlined
                  v-model="advancedSearch.query"
                  label="Search Input"
                  placeholder="Enter search terms..."
                  clearable
                />

                <!-- Match Type -->
                <q-option-group
                  v-model="advancedSearch.matchType"
                  type="radio"
                  color="primary"
                  inline
                  :options="[
                    { label: 'Any of these words', value: 'anyWords' },
                    { label: 'All of these words', value: 'allWords' },
                    { label: 'Exact phrase match', value: 'exactMatch' },
                    { label: 'None of these words', value: 'noneOfWords' },
                  ]"
                />

                <!-- Date Range -->
                <div class="row q-gutter-md q-mx-none">
                  <p>Item Origin Date</p>
                  <!-- Date From -->
                  <div class="col q-px-none q-pr-sm">
                    <q-input
                      outlined
                      v-model="advancedSearch.dateFrom"
                      label="Date From"
                      type="date"
                      :max="advancedSearch.dateTo || today"
                    />
                  </div>

                  <!-- Date To -->
                  <div class="col q-px-none">
                    <q-input
                      outlined
                      v-model="advancedSearch.dateTo"
                      label="Date To"
                      type="date"
                      :min="advancedSearch.dateFrom"
                      :max="today"
                    />
                  </div>
                </div>

                <!-- Categories (only for artifacts/documents) -->
                <q-select
                  outlined
                  v-model="advancedSearch.categories"
                  :options="categoryOptions"
                  label="Categories"
                  emit-value
                  map-options
                  multiple
                  use-chips
                  v-if="advancedSearch.type === 'artifacts' || advancedSearch.type === 'documents'"
                />

                <!-- Sort Options -->
                <div class="row q-gutter-md q-mx-none">
                  <div class="col q-px-none q-pr-sm">
                    <q-select
                      outlined
                      v-model="selectedSort"
                      :options="allSortOptions"
                      label="Sort By"
                      emit-value
                      map-options
                      @update:model-value="onSortChange"
                    />
                  </div>
                  <!-- <div class="col q-px-none">
                    <q-select
                      outlined
                      v-model="advancedSearch.sortOrder"
                      :options="sortOrderOptions"
                      label="Sort Order"
                      emit-value
                      map-options
                    />
                  </div> -->
                </div>
              </div>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-sm q-mb-sm">
              <q-btn flat label="Clear All" @click="clearAdvancedSearch" />
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                unelevated
                label="Search"
                color="primary"
                @click="performAdvancedSearch"
                :loading="searchLoading"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <router-view />
      </q-page-container>
    </q-layout>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/user'
import { useSearchStore } from 'src/stores/searchStore'
import { supabase } from 'boot/supabase'
import { useDocumentsStore } from 'src/stores/documentsStore'
import { useDocumentsFilter } from 'src/utils/useFiltering'
import { allSortOptions } from 'src/stores/searchStore'

const { clearFilters } = useDocumentsFilter()

const $q = useQuasar()
const userStore = useUserStore()
const searchStore = useSearchStore()
const documentsStore = useDocumentsStore()
const router = useRouter()
const route = useRoute()
const session = userStore.session

const drawer = ref(true)
const miniState = ref(true)
const isHovered = ref(false)
const search = ref('')

// Responsive state
// Responsive state
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)
const isCompactMode = computed(() => windowWidth.value < 1030)
const isShortScreen = computed(() => windowHeight.value < 768)
const isVeryShortScreen = computed(() => windowHeight.value < 600)

// Advanced Search State
const showAdvancedSearch = ref(false)
const searchLoading = ref(false)

const searchType = ref('documents')

// Advanced Search Form Data
const advancedSearch = ref({
  field: '',
  matchType: 'anyWords',
  query: '',
  dateFrom: null,
  dateTo: null,
  fileType: [],
  categories: [],
  sortBy: 'uploaded',
  // sortOrder: 'desc',
})

// Add clear all notifications function
const clearAllNotifications = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // Mark all notifications as read in database
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('receiver_id', user.id)
      .eq('read', false)

    if (error) {
      console.error('Error clearing notifications:', error)
      return
    }

    // Update local state
    notifications.value = notifications.value.map((notif) => ({
      ...notif,
      read: true,
    }))
    notificationCount.value = 0

    $q.notify({
      type: 'positive',
      message: 'All notifications cleared',
      timeout: 2000,
    })
  } catch (error) {
    console.error('Error clearing notifications:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to clear notifications',
      timeout: 2000,
    })
  }
}

// Add notification icon mapping
const getNotificationIcon = (type) => {
  const typeMap = {
    appointment_booking: 'event',
    appointment_status: 'schedule',
    visitor_registration: 'person_add',
    default: 'notifications',
  }
  return typeMap[type] || typeMap.default
}

// Search dropdown options (for main search bar)
const searchOptions = [
  { label: 'Artifacts', value: 'artifacts' },
  { label: 'Documents', value: 'documents' },
]

function goToProfile() {
  router.push('/profile')
}

const categoryOptions = ref([])
watch(
  () => advancedSearch.value.type,
  async (newType) => {
    if (newType === 'documents' || newType === 'artifacts') {
      categoryOptions.value = await searchStore.fetchCategories(newType)
    } else {
      categoryOptions.value = []
    }
  },
  { immediate: true },
)

// const sortOrderOptions = [
//   { label: 'Descending', value: 'desc' },
//   { label: 'Ascending', value: 'asc' },
// ]

const selectedSort = ref({
  sortBy: searchStore.sortBy,
  sortOrder: searchStore.sortOrder,
})

function onSortChange(option) {
  searchStore.setSort(option)
}

// User and notifications data
const notifications = ref([])
const notificationCount = ref(0)
let channel = null

// Base navigation items
const baseNavItems = [
  { name: 'home', label: 'Home', icon: '\\icons\\home.png' },
  { name: 'user-management', label: 'User Management', icon: '\\icons\\users-m.png' },
  { name: 'data-quality', label: 'Data Quality', icon: '\\icons\\data_quality.png' },
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
const userType = computed(() => userProfile.value.user_type || 'Unknown')

// Add computed property to check roles
const isUser = computed(() => userRole.value === 'user')
const isAdmin = computed(() => userRole.value === 'admin')

// Filtered navigation items based on user role
const navItems = computed(() => {
  return baseNavItems.filter((item) => {
    // Show collections only for users
    if (item.name === 'collections') {
      return isUser.value
    }

    // Show pages only for admins
    if (item.name === 'data-quality' || item.name === 'user-management') {
      return isAdmin.value
    }

    // Show all other items
    return true
  })
})

// Window resize handler
const handleResize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

// Add a timeout to prevent rapid state changes
let hoverTimeout = null

// const onDrawerMouseEnter = () => {
//   if (hoverTimeout) clearTimeout(hoverTimeout)
//   isHovered.value = true
//   // Only expand if currently in mini state
//   if (miniState.value) {
//     miniState.value = false
//   }
// }

const onDrawerMouseLeave = () => {
  if (hoverTimeout) clearTimeout(hoverTimeout)

  // Add a small delay to prevent flickering
  hoverTimeout = setTimeout(() => {
    isHovered.value = false
    miniState.value = true
  }, 100) // 100ms delay
}

const activeItem = ref('home')
const hasSearchBar = ref(false)
const noToolBar = ref(false)

const setActiveItem = (itemName) => {
  console.log('Setting active item to:', itemName)
  activeItem.value = itemName

  // Close mobile drawer when navigating
  // if ($q.screen.lt.md) {
  //   drawer.value = false
  // }

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

// Date from and to - up to current date only
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const today = formatDate(new Date())

// Basic Search functionality
const performSearch = async () => {
  documentsStore.resetFilters()
  clearFilters()

  const query = search.value
  if (!query.trim()) {
    searchStore.clear()
    return
  }

  // Redirect based on dropdown selection
  let targetRoute = ''
  if (searchType.value === 'artifacts') {
    targetRoute = '/artifacts'
  } else if (searchType.value === 'documents') {
    targetRoute = '/documents'
  }

  if (route.path !== targetRoute) {
    await router.push(targetRoute) // Wait for navigation to complete
  }

  // Set store search type based on dropdown selection
  await searchStore.search(query, searchType.value)
  console.log('Search performed:', query, searchType.value)

  search.value = ''
}

// Advanced Search functionality
const performAdvancedSearch = async () => {
  try {
    searchStore.searchedDocuments = []
    searchStore.searchedModels = []

    const params = {
      type: searchType.value,
      field: advancedSearch.value.field,
      query: advancedSearch.value.query,
      matchType: advancedSearch.value.matchType,
      dateRange: {
        from: advancedSearch.value.dateFrom || null,
        to: advancedSearch.value.dateTo || null,
      },
      categories: advancedSearch.value.categories || [],
      sortBy: advancedSearch.value.sortBy,
    }

    console.log('[Search] Starting advanced search with params:', params)

    const targetRoute = params.type === 'documents' ? '/documents' : '/artifacts'
    if (route.path !== targetRoute) {
      router.push(targetRoute)
    }

    await searchStore.advancedSearch(params)
    showAdvancedSearch.value = false
  } catch (err) {
    console.error('[Search] Error during performAdvancedSearch:', err)
  }
}

const clearAdvancedSearch = () => {
  advancedSearch.value = {
    type: 'artifacts',
    field: '',
    matchType: 'anyWords',
    query: '',
    dateFrom: null,
    dateTo: null,
    categories: [],
    sortBy: 'uploaded',
  }
}

// const filterTags = (val, update) => {
//   update(() => {
//     if (val === '') {
//       categoryOptions.value = [
//         { label: 'Important', value: 'important' },
//         { label: 'Archive', value: 'archive' },
//         { label: 'Personal', value: 'personal' },
//         { label: 'Work', value: 'work' },
//         { label: 'Research', value: 'research' },
//         { label: 'Draft', value: 'draft' },
//         { label: 'Final', value: 'final' },
//       ]
//     } else {
//       const needle = val.toLowerCase()
//       categoryOptions.value = [
//         { label: 'Important', value: 'important' },
//         { label: 'Archive', value: 'archive' },
//         { label: 'Personal', value: 'personal' },
//         { label: 'Work', value: 'work' },
//         { label: 'Research', value: 'research' },
//         { label: 'Draft', value: 'draft' },
//         { label: 'Final', value: 'final' },
//       ].filter((tag) => tag.label.toLowerCase().includes(needle))
//     }
//   })
// }

const handleLogout = async () => {
  try {
    if (confirm('Are you sure you want to logout?')) {
      // Sign out and wait for completion
      await userStore.signOut()

      // Force navigation after successful logout
      await router.push('/user/login')

      // Force page reload to clear any cached state
      window.location.reload()
    }
  } catch (error) {
    console.error('Error signing out:', error)
    // Even on error, try to navigate to login
    router.push('/user/login')
    window.location.reload()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)

  if (searchType.value) {
    if (route.name === 'documents') {
      searchType.value = 'documents'
    } else if (route.name === 'artifacts') {
      searchType.value = 'artifacts'
    }
  }

  // Perform search if there's existing search value
  if (search.value || searchType.value) {
    performSearch()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (hoverTimeout) clearTimeout(hoverTimeout)
})

// Watch search bar input and run query
// do this according to route
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
      searchType.value = 'artifacts'
    } else if (newPath.includes('documents') || newPath.includes('document-scanner')) {
      activeItem.value = 'documents'
      searchType.value = 'documents'
    } else if (newPath.includes('collections')) {
      activeItem.value = 'collections'
    } else if (newPath.includes('gallery')) {
      activeItem.value = 'gallery'
    } else if (newPath.includes('data-quality')) {
      activeItem.value = 'data-quality'
    } else if (newPath.includes('user-management')) {
      activeItem.value = 'user-management'
    } else {
      activeItem.value = ''
    }

    // Search bar visibility
    if (
      newPath.includes('admindash') ||
      newPath.includes('home') ||
      newPath.includes('artifacts') ||
      newPath.includes('documents')
    ) {
      hasSearchBar.value = true
    } else {
      hasSearchBar.value = false
    }

    // Tool bar visibility
    if (newPath.includes('gallery')) {
      noToolBar.value = false
    } else {
      noToolBar.value = true
    }

    // Update advanced search type based on current page
    if (newPath.includes('documents')) {
      advancedSearch.value.type = 'documents'
    } else if (newPath.includes('artifacts')) {
      advancedSearch.value.type = 'artifacts'
    } else {
      advancedSearch.value.type = 'artifacts' // default
    }
  },
  { immediate: true },
)

// Sync advanced search query with main search
watch(
  () => advancedSearch.value.query,
  (newQuery) => {
    if (newQuery !== search.value) {
      search.value = newQuery
    }
  },
)

// Sync main search with advanced search query
watch(search, (newSearch) => {
  if (newSearch !== advancedSearch.value.query) {
    advancedSearch.value.query = newSearch
  }
})

// Watch for search type changes to clear inappropriate fields
// watch(
//   () => advancedSearch.value.type,
//   (newType) => {
//     // Clear file type when not in "All Items"
//     // if (newType !== 'all') {
//     //   advancedSearch.value.fileType = []
//     // }

//     // Clear tags when not in "Artifacts" or "Documents"
//     if (newType !== 'artifacts' && newType !== 'documents') {
//       advancedSearch.value.tags = []
//     }

//     // Clear search in content when not in "Documents"
//     if (newType !== 'documents') {
//       advancedSearch.value.searchInContent = false
//     }
//   },
// )

async function fetchNotifications() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('receiver_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notifications:', error)
    return
  }

  notifications.value = data.map((notif) => ({
    ...notif,
    dateTime: new Date(notif.created_at).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    }),
    message: notif.message,
  }))

  notificationCount.value = data.filter((notif) => !notif.read).length
}

async function setupRealtimeNotifications() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  channel = supabase
    .channel('notifications-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => {
        const notif = payload.new
        console.log('Incoming notification:', notif)

        if (
          notif.user_id === user.id ||
          (notif.role?.trim().toLowerCase() === 'admin' && userRole.value.toLowerCase() === 'admin')
        ) {
          console.log('Admin notification matched:', notif)
          notifications.value.unshift({
            ...notif,
            dateTime: new Date(notif.created_at).toLocaleString('en-PH', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Manila',
            }),
          })
          notificationCount.value++
        } else {
          console.log('Notification skipped:', notif, 'for role:', userRole.value) // show skipped for non-receivers of the notifs
        }
      },
    )
    .subscribe((status) => {
      console.log('Real-time subscription status:', status)
    })
}

const notificationRoutes = {
  appointment_booking: '/admin/appointments',
  appointment_status: '/appointment?tab=status',
  visitor_registration: '/user-management?tab=registrations',
}
// Mark as read and navigate to corresponding page based on type
async function openNotification(notif) {
  await markAsRead(notif.id)

  // console.log('Opening notification:', notif)

  const type = notif.type ? notif.type.trim().toLowerCase() : ''
  const targetRoute = notificationRoutes[type] || '/'

  if (targetRoute) {
    console.log('Navigating to ', targetRoute)
    router.push(targetRoute)
  } else {
    console.warn('No route defined for notification type:', type)
  }
}

async function markAsRead(notifId) {
  const notif = notifications.value.find((n) => n.id === notifId)
  if (!notif || notif.read) return // Not found or skip if already read

  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notifId)

  if (error) {
    console.error('Error marking notification as read:', error)
    return
  }

  notif.read = true
  notificationCount.value = Math.max(0, notificationCount.value - 1)
}

onMounted(() => {
  fetchNotifications()
})

onBeforeUnmount(() => {
  if (channel) {
    supabase.removeChannel(channel)
  }
})

const hasBeenHovered = ref(false)
const onDrawerMouseEnter = () => {
  if (hoverTimeout) clearTimeout(hoverTimeout)
  isHovered.value = true
  hasBeenHovered.value = true
  // Only expand if currently in mini state
  if (miniState.value) {
    miniState.value = false
  }
}

watch(
  () => userProfile.value?.role,
  (role) => {
    if (role) {
      console.log('Setting up real-time notifications for role:', role)
      setupRealtimeNotifications()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
/* ========================
   GENERAL FIXES
======================== */

.no-gap :deep(.q-field__prepend) {
  margin-left: 0 !important;
  padding-left: 0 !important;
  min-width: 0 !important;
}

.no-gap :deep(.q-field__control) {
  padding-left: 0 !important;
}

/* ========================
   MAIN LAYOUT FIXES
======================== */
.main-page-bg {
  overflow-x: hidden !important;
  max-width: 100vw;
}

.q-layout {
  overflow-x: hidden !important;
}

.q-page-container {
  overflow-x: hidden !important;
  margin-left: 0 !important; /* No margin - content stays in place */
  transition: none !important;
}

/* ========================
   SIDEBAR OVERLAY BEHAVIOR
======================== */
.sidebar-drawer.q-drawer {
  overflow: hidden;
  transition: width 0.3s ease !important;
  z-index: 2000 !important; /* Ensure sidebar is above content */
}

/* Mini sidebar should not affect content positioning */
.q-drawer--mini {
  z-index: 2000 !important;
}

/* When expanded (on hover), sidebar overlays content */
.sidebar-drawer:hover {
  z-index: 2001 !important; /* Higher z-index when expanded */
}

/* ========================
   SIDEBAR HOVER LIFT EFFECT
======================== */
.navigation-section.hovered-lift {
  transform: translateY(-40px) !important;
}

/* Reduce lift on short screens to prevent overflow */
@media (max-height: 768px) {
  .navigation-section.hovered-lift {
    transform: translateY(-90px) !important;
  }
}

@media (max-height: 650px) {
  .navigation-section.hovered-lift {
    transform: translateY(-10px) !important;
  }
}

/* ========================
   LOGO
======================== */
.logo-img {
  max-width: 200px;
  max-height: 80px;
  object-fit: contain;
  cursor: pointer;
}

/* ========================
   SIDEBAR
======================== */
.sidebar-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo-section {
  flex-shrink: 0;
}

.navigation-section {
  flex: 1;
  min-height: 0;
  padding: 0 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.logout-section {
  flex-shrink: 0;
  padding: 10px;
  margin-top: auto;
}

/* ========================
   TEXT VISIBILITY IMPROVEMENTS
======================== */
.nav-text,
.logout-text {
  opacity: 1;
  transition:
    opacity 0.2s ease,
    width 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
}

.text-hidden {
  opacity: 0 !important;
  width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.sidebar-drawer:hover .text-hidden {
  opacity: 1 !important;
  width: auto !important;
}

/* ========================
   RESPONSIVE TOOLBAR - NORMAL POSITIONING
======================== */
.search-toolbar {
  background: transparent !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 8px 16px !important;
  width: 100% !important; /* Full width - no sidebar offset */
  box-sizing: border-box;
  position: relative !important; /* Normal positioning */
  z-index: 1000 !important;
}

/* No special toolbar positioning for sidebar states */

.responsive-toolbar-container {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 44px;
  justify-content: space-between;
}

.search-container {
  width: 705px;
  max-width: 100%;
  margin-right: 2px; /* spacing before notifications */
}

.toolbar-spacer {
  flex: 1 1 auto;
  min-width: 30px;
}

.toolbar-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: fit-content;
  width: auto;
  margin-left: auto;
}

/* ========================
   SEARCH INPUT
======================== */
.search-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.9) !important;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.search-input :deep(.q-field__control) {
  min-height: 40px;
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.search-input :deep(.q-field__native) {
  color: #333 !important;
}

.search-input :deep(.q-placeholder) {
  color: #666 !important;
}

/* Advanced Search Button */
.advanced-search-btn {
  color: #666 !important;
  transition: all 0.2s ease;
}

.advanced-search-btn:hover {
  color: #880000 !important;
  background-color: rgba(136, 0, 0, 0.1) !important;
}

/* ========================
   ADVANCED SEARCH DIALOG
======================== */
.advanced-search-dialog {
  min-width: 600px;
  max-width: 800px;
  width: 90vw;
}

.advanced-options {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  margin-top: 16px;
}



/* ========================
   HEIGHT-BASED RESPONSIVE ADJUSTMENTS
======================== */

/* Only for short screens - reduce spacing to fit everything */
@media (max-height: 700px) {
  .navigation-section {
    justify-content: flex-start !important;
  }

  .nav-item,
  .logout-item {
    margin-bottom: 6px !important;
  }

  .logo-section .q-pa-md.q-mb-md {
    padding: 12px !important;
    margin-bottom: 12px !important;
  }

  .logo-section .q-py-lg {
    padding-top: 12px !important;
    padding-bottom: 12px !important;
  }

  .logo-img {
    max-width: 170px !important;
    max-height: 68px !important;
  }

  .icon-wrapper {
    width: 40px !important;
    height: 40px !important;
  }

  .nav-icon {
    width: 22px !important;
    height: 22px !important;
  }

  .nav-text,
  .logout-text {
    font-size: 15px !important;
  }

  .logout-section {
    padding: 8px !important;
  }

  .logout-icon {
    font-size: 18px !important;
  }
}

/* Only for very short screens - more compact spacing */
@media (max-height: 600px) {
  .navigation-section {
    justify-content: flex-start !important;
  }

  .nav-item,
  .logout-item {
    margin-bottom: 4px !important;
    padding: 8px 12px !important;
  }

  .logo-section .q-pa-md.q-mb-md {
    padding: 8px !important;
    margin-bottom: 8px !important;
  }

  .logo-section .q-py-lg {
    padding-top: 8px !important;
    padding-bottom: 8px !important;
  }

  .logo-img {
    max-width: 140px !important;
    max-height: 56px !important;
  }

  .icon-wrapper {
    width: 36px !important;
    height: 36px !important;
  }

  .nav-icon {
    width: 20px !important;
    height: 20px !important;
  }

  .nav-text,
  .logout-text {
    font-size: 14px !important;
  }

  .logout-section {
    padding: 6px !important;
  }

  .logout-icon {
    font-size: 16px !important;
  }
}

/* ========================
   RESPONSIVE BREAKPOINTS
======================== */

/* Ultra-wide screens */
@media (min-width: 1920px) {
  .search-container {
    width: 1060px !important;
    min-width: 1060px !important;
    max-width: 1060px !important;
  }
  /*  .toolbar-actions {
     gap: 100px;
   } */
  .user-profile-btn:not(.compact) {
    width: 282px !important;
    min-width: 282px !important;
    max-width: 282px !important;
  }
}

/* Large screens  */
@media (min-width: 1440px) and (max-width: 1919px) {
  .search-container {
    width: 850px !important;
    min-width: 850px !important;
    max-width: 850px !important;
  }
  /*  .toolbar-actions {
     gap: 120px;
   } */
   .user-profile-btn:not(.compact) {
     width: 210px !important;
     min-width: 210px !important;
     max-width: 210px !important;
   }
 }

 /* Medium-large screens */
@media (min-width: 1300px) and (max-width: 1439px) {
  .search-container {
    width: 750px !important;
    min-width: 610px !important;
    max-width: 750px !important;
  }
  /* .toolbar-actions {
     gap: 110px;
   } */
  .user-profile-btn:not(.compact) {
    width: 180px !important;
    min-width: 180px !important;
    max-width: 180px !important;
  }
}

/* my screen size */
@media (min-width: 1200px) and (max-width: 1300px) {
  .search-container {
    width: 700px !important;
    min-width: 550px !important;
    max-width: 700px !important;
    flex: none !important;
  }

  /* .toolbar-actions {
     gap: 60px;
     width: auto;
   } */

   .user-profile-btn:not(.compact) {
     width: 180px !important;
     min-width: 180px !important;
     max-width: 180px !important;
   }
 }

 /* Compact screens  */
@media (min-width: 1050px) and (max-width: 1199px) {
  .search-container {
    width: 640px !important;
    min-width: 490px !important;
    max-width: 640px !important;
  }
  /*  .toolbar-actions {
     gap: 45px;
   } */
  .user-profile-btn:not(.compact) {
    width: 210px !important;
    min-width: 210px !important;
    max-width: 210px !important;
  }
}

/* Small screens */
@media (min-width: 600px) and (max-width: 1049px) {
  .search-container {
    width: 600px !important;
    min-width: 300px !important;
    max-width: 600px !important;
  }
  /* .toolbar-actions {
    gap: 30px;
  } */
  .user-profile-btn.compact {
    width: 48px !important;
    min-width: 48px !important;
    max-width: 48px !important;
  }

  .advanced-search-dialog {
    min-width: 320px;
    width: 95vw;
  }
}

/* Hide sidebar on tablets - sidebar still overlays */
@media (min-width: 600px) and (max-width: 1024px) {
  .q-drawer {
    min-width: 120px !important;
    /* z-index: 2000 !important; */
  }

  .sidebar-drawer .q-drawer__content {
    min-width: 120px !important;
  }

  /* Keep consistent alignment in both states */
  .navigation-section {
    text-align: left;
  }

  /* Center only the icons in mini state */
  .q-drawer--mini .nav-item,
  .q-drawer--mini .logout-item {
    justify-content: center !important;
    padding: 8px !important;
  }

  /* Normal padding when expanded */
  .q-drawer:hover .nav-item,
  .q-drawer:hover .logout-item {
    justify-content: flex-start !important;
    padding: 8px 16px !important;
  }

  /* Adjust drawer width on hover */
  .q-drawer:hover {
    width: 280px !important;
  }

  .q-drawer:hover .q-drawer__content {
    width: 280px !important;
  }

  /* Content stays in normal position */
  .q-page-container {
    margin-left: 0 !important;
  }

  .search-toolbar {
    width: 100% !important;
  }
}
/* Mobile screens - content needs space for sidebar */
@media (max-width: 599px) {
  .search-toolbar {
    padding: 12px 8px !important;
    width: calc(100% - 40px) !important;
    margin-left: 10px !important;
    position: relative !important;
    top: auto !important;
    right: auto !important;
  }
  .search-input {
    width: 100% !important;
  }

  /* Hide only the dropdown select, keep search icon visible */
  .search-input :deep(.q-select) {
    display: none !important;
  }

  /* Ensure search icon stays visible */  =
.search-input :deep(.q-icon[name="search"]) {
  display: block !important;
  margin: 0 8px !important;
}

  .search-input :deep(.q-field__prepend) {
    padding-left: 8px !important;
  }

  .search-input :deep(.q-field__control) {
    padding-left: 4px !important;
  }

  .responsive-toolbar-container {
    flex-direction: row;
    gap: 15px;
    align-items: center;
    justify-content: space-between;
  }

  .search-container {
    flex: 1 1 auto !important;
    width: auto !important;
    min-width: 150px !important;
    max-width: calc(100% - 110px) !important;
    order: 1;
  }

  .toolbar-spacer {
    display: none;
  }

  .toolbar-actions {
    flex: 0 0 auto;
    order: 2;
    gap: 4px;
    min-width: 100px;
    justify-content: flex-end;
  }

  .notif-btn {
    width: 36px !important;
    height: 36px !important;
  }

  .notif-image {
    width: 18px !important;
    height: 18px !important;
  }

  .user-profile-btn.compact {
    width: 40px !important;
    min-width: 40px !important;
    max-width: 40px !important;
    padding: 6px !important;
  }

  .user-profile-btn.compact .q-avatar {
    width: 28px !important;
    height: 28px !important;
  }

  .search-input :deep(.q-icon) {
    font-size: 21px !important;
  }

  .search-input :deep(.q-icon[name="search"]) {
    margin: 0 4px !important;
  }

  /* Keep sidebar visible on mobile but in mini state */
  .q-drawer {
    min-width: 120px !important;
    z-index: 2000 !important;
  }

  .sidebar-drawer .q-drawer__content {
    min-width: 120px !important;
  }

  /* Keep left alignment */
  .navigation-section {
    text-align: left;
  }

  /* Center only icons, not text */
  .q-drawer--mini .nav-item,
  .q-drawer--mini .logout-item {
    justify-content: center !important;
  }

  .q-drawer:hover .nav-item,
  .q-drawer:hover .logout-item {
    justify-content: flex-start !important;
  }

  /* Expand on hover */
  .q-drawer:hover {
    width: 280px !important;
  }

  .q-drawer:hover .q-drawer__content {
    width: 280px !important;
  }
}
/* ========================
   NAVIGATION ITEMS
======================== */
.nav-item,
.logout-item {
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
  border: 2px solid transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.nav-item .q-item__section--avatar,
.logout-item .q-item__section--avatar {
  min-width: 60px !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.text-center .nav-item,
.text-center .logout-item {
  justify-content: center !important;
  padding: 8px !important;
  margin-bottom: 10px !important;
}
.text-center .q-item__section--main {
  display: none !important;
}

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

/* ========================
   TEXT STYLING
======================== */
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

/* ========================
   NOTIFICATIONS MENU
======================== */
.notifications-menu {
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.notifications-card {
  width: 380px;
  max-width: 90vw;
  border-radius: 12px;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 12px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.notifications-header .text-h6 {
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.78);
  margin: 0;
}

.clear-all-btn {
  color: #6c757d !important;
  padding: 4px !important;
}

.clear-all-btn:hover {
  color: #dc3545 !important;
  background: rgba(220, 53, 69, 0.1) !important;
}

.notifications-scroll-area {
  height: 300px;
  max-height: 50vh;
}

.notifications-list {
  padding: 4px 0;
}

.notification-item {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.notification-item:hover {
  background-color: rgba(136, 0, 0, 0.05) !important;
}

.notification-item.unread {
  background-color: rgba(33, 150, 243, 0.04);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(136, 0, 0, 0.1);
}

.notification-item.unread .notification-icon {
  background: rgba(33, 150, 243, 0.1);
}

.notification-message {
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 4px;
  word-wrap: break-word;
}

.notification-time {
  font-size: 0.75rem !important;
  color: #6c757d !important;
}

.unread-dot {
  width: 8px;
  height: 8px;
  min-width: 8px;
  min-height: 8px;
}

.no-notifications {
  padding: 20px 16px;
  text-align: center;
  color: #6c757d;
}

.no-notifications .q-item__section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.notifications-actions {
  padding: 8px 16px 12px 16px;
}

.clear-all-bottom-btn {
  border-radius: 8px;
  font-weight: 500;
  color: #dc3545 !important;
}

.clear-all-bottom-btn:hover {
  background: rgba(220, 53, 69, 0.1) !important;
}

/* ========================
   NOTIFICATIONS BADGE
======================== */
.notif-btn {
  background-color: #f8f8ff !important;
  width: 40px;
  height: 40px;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
  position: relative;
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

/* Responsive adjustments */
@media (max-width: 599px) {
  .notifications-card {
    width: 320px;
  }

  .notification-item {
    padding: 10px 12px;
  }

  .notifications-header {
    padding: 12px 12px 8px 12px;
  }
}

/* ========================
   USER PROFILE
======================== */
.user-profile-btn {
  background-color: #f8f9fa !important;
  border-radius: 10px;
  min-height: 44px;
  display: flex;
  align-items: center;
  /*  transition: all 0.3s ease; */
    flex-shrink: 0;
    padding: 4px 12px 4px 8px;
  }

  /* Full profile display */
.user-profile-btn:not(.compact) {
  width: 180px;
  min-width: 180px;
  max-width: 180px;
}

/* Compact profile (avatar only) */
.user-profile-btn.compact {
  width: 48px;
  min-width: 48px;
  max-width: 48px;
  padding: 8px;
  justify-content: center;
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
  margin-left: 8px;
  flex: 1;
}

.username-bg {
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  width: 100%;
}

.user-role {
  font-size: 12px !important;
  line-height: 1 !important;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  width: 100%;
}

/* Avatar adjustments */
.user-profile-btn .q-avatar {
  flex-shrink: 0;
}

/* Tooltip styling */
.q-tooltip {
  background-color: rgba(0, 0, 0, 0.87) !important;
  font-size: 12px !important;
  padding: 4px 8px !important;
}



/* ========================
   SEARCH BAR VISIBILITY HANDLING
======================== */

/* Hidden search container that maintains space */
.search-container-hidden {
  width: 720px !important;
  max-width: 100%;
  margin-right: 2px;
  visibility: hidden;
  pointer-events: none;
  flex-shrink: 0;
}

.toolbar-actions.no-search {
  margin-left: 120px; /* profile icon */
}

/* Reduce gap between notification and profile when search bar is hidden
.toolbar-actions.no-search {
  gap: 0px;
}  */

.toolbar-actions.no-search .user-profile-btn {
  margin-left: -18px; /* This makes them overlap/closer */
}

/* ========================
   RESPONSIVE ADJUSTMENTS FOR HIDDEN SEARCH
======================== */

/* Ultra-wide screens */
@media (min-width: 1920px) {
  .search-container-hidden {
    width: 1060px !important;
    min-width: 1060px !important;
    max-width: 1060px !important;
  }
  .notif-btn.no-search {
    margin-right: 20px;
  }
}

/* Large screens  */
@media (min-width: 1440px) and (max-width: 1919px) {
  .search-container-hidden {
    width: 790px !important;
    min-width: 790px !important;
    max-width: 790px !important;
  }
  .notif-btn.no-search {
    margin-right: 18px;
  }
}

/* Medium-large screens */
@media (min-width: 1300px) and (max-width: 1439px) {
  .search-container-hidden {
    width: 710px !important;
    min-width: 610px !important;
    max-width: 710px !important;
  }
  .notif-btn.no-search {
    margin-right: 16px;
  }
}

@media (min-width: 1200px) and (max-width: 1300px) {
  .search-container-hidden {
    width: 650px !important;
    min-width: 550px !important;
    max-width: 650px !important;
    flex: none !important;
  }
  .notif-btn.no-search {
    margin-right: 14px;
  }
}

/* Compact screens  */
@media (min-width: 1050px) and (max-width: 1199px) {
  .search-container-hidden {
    width: 590px !important;
    min-width: 490px !important;
    max-width: 590px !important;
  }
  .notif-btn.no-search {
    margin-right: 12px;
  }
}

/* Small screens */
@media (min-width: 600px) and (max-width: 1049px) {
  .search-container-hidden {
    width: 550px !important;
    min-width: 300px !important;
    max-width: 550px !important;
  }
  .notif-btn.no-search {
    margin-right: 10px;
  }
}

/* Mobile screens */
@media (max-width: 599px) {
  .search-container-hidden {
    display: none;
  }
  .toolbar-actions.no-search {
    margin-left: 0;
  }
}
</style>
