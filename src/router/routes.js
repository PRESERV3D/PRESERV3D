const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue'), meta: { requiresAuth: true } },
      {
        path: 'home',
        name: 'dashboard',
        component: () => import('pages/IndexPage.vue'),
        meta: { requiresAuth: true, allowedRoles: ['user'] },
      },
      {
        path: 'artifacts',
        name: 'artifacts',
        component: () => import('src/pages/ArtifactsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'documents',
        name: 'documents',
        component: () => import('src/pages/DocumentsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'gallery',
        name: 'gallery',
        component: () => import('pages/GalleryPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'upload',
        component: () => import('pages/UploadPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admindash',
        name: 'admin-home',
        component: () => import('pages/AdminDashboard.vue'),
        meta: { requiresAuth: true, allowedRoles: ['admin'] },
      },
      //admin appointments
      {
        path: 'adminappointments',
        name: 'admin-appointments',
        component: () => import('pages/AdminAppointmentPage.vue'),
        meta: { requiresAuth: true, allowedRoles: ['admin'] },
      },
      {
        path: 'appointmentdetails', // to be changed to 'appointmentdetails/:id'
        name: 'apointment-details',
        component: () => import('pages/AdminAppointmentDetailsPage.vue'),
        meta: { requiresAuth: true, allowedRoles: ['admin'] },
      },

      {
        path: 'documents/:id',
        name: 'view-document',
        component: () => import('pages/ViewDocumentPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'artifacts/:id',
        name: 'view-artifact',
        component: () => import('pages/ViewArtifactPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'collections',
        name: 'collections',
        component: () => import('src/pages/CollectionsPage.vue'),
        meta: { requiresAuth: true, allowedRoles: ['user'] },
      },
      {
        path: 'collection/:id',
        component: () => import('pages/CollectionDetailsPage.vue'),
        meta: { requiresAuth: true, allowedRoles: ['user'] },
      },

      {
        path: 'edit/artifacts/:id',
        name: 'admin-view-artifact',
        component: () => import('pages/EditViewArtifacts.vue'),
        meta: { requiresAuth: true, allowedRoles: ['admin'] },
      },

      {
        path: 'edit/documents/:id',
        name: 'admin-view-artifact',
        component: () => import('pages/EditViewDocument.vue'),
        meta: { requiresAuth: true, allowedRoles: ['admin'] },
      },

      {
        path: 'document-scanner',
        name: 'document-scanner',
        component: () => import('pages/DocumentScannerPage.vue'),
        // meta: { requiresAuth: true, allowedRoles: ['admin'] },
      },
    ],
  },
  {
    path: '/user',
    component: () => import('layouts/LogInSignUpLayout.vue'),
    children: [
      { path: 'login', name: 'user-login', component: () => import('pages/UserLoginPage.vue') },
      {
        path: 'register-option',
        name: 'user-options',
        component: () => import('pages/UserSignUpOptions.vue'),
      },
      {
        path: 'register',
        name: 'user-register',
        component: () => import('pages/UserRegisterPage.vue'),
      },
      {
        path: 'faculty',
        name: 'faculty-register',
        component: () => import('pages/UserFacultyPage.vue'),
      },
      {
        path: 'visitor',
        name: 'visitor-register',
        component: () => import('pages/UserVisitorPage.vue'),
      },
    ],
  },

  {
    path: '/LandingPage',
    component: () => import('pages/LandingPage.vue'), // Landing Page
  },

  {
    path: '/AdminLandingPage',
    component: () => import('pages/AdminLandingPage.vue'), // Landing Page
  },

  {
    path: '/admin',
    component: () => import('layouts/LogInSignUpLayout.vue'),
    children: [
      {
        path: 'register',
        name: 'admin-register',
        component: () => import('pages/AdminRegisterPage.vue'),
      },
      {
        path: 'login',
        name: 'admin-login',
        component: () => import('pages/AdminLoginPage.vue'),
      },
    ],
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
