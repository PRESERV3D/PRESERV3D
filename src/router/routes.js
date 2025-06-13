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
    ],
  },
  {
    path: '/user',
    component: () => import('layouts/LogInSignUpLayout.vue'),
    children: [
      { path: 'login', component: () => import('pages/UserLoginPage.vue') },
      { path: 'register', component: () => import('pages/UserRegisterPage.vue') },
      { path: 'register-page-2', component: () => import('pages/UserRegisterPage2.vue') },
    ],
  },

  {
    path: '/admin',
    component: () => import('layouts/LogInSignUpLayout.vue'),
    children: [
      { path: 'admin-register', component: () => import('pages/AdminRegisterPage.vue') },
      { path: 'admin-login', component: () => import('pages/AdminLoginPage.vue') },
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
