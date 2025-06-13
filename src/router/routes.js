const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'home', component: () => import('pages/IndexPage.vue') },
      { path: 'artifacts', component: () => import('pages/ArtifactsPage.vue') },
      { path: 'documents', component: () => import('pages/DocumentsPage.vue') },
      { path: 'gallery', component: () => import('pages/GalleryPage.vue') },
      { path: 'upload', component: () => import('pages/UploadPage.vue') },
      {
        path: 'documents/:id',
        name: 'view-document',
        component: () => import('pages/ViewDocumentPage.vue'),
      },
      {
        path: 'artifacts/:id',
        name: 'view-artifact',
        component: () => import('pages/ViewArtifactPage.vue'),
      },
>>>>>>> 9384d4a614d1cfc12e977a64c5dbeba0bd8d7d35
    ],
  },
  {
    path: '/user',
    component: () => import('layouts/LogInSignUpLayout.vue'),
    children: [
      { path: 'login', name: 'user-login', component: () => import('pages/UserLoginPage.vue') },
      {
        path: 'register',
        name: 'user-register',
        component: () => import('pages/UserRegisterPage.vue'),
      },
    ],
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
