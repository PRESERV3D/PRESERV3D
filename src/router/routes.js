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
        path: 'admindash',
        name: 'admin-home',
        component: () => import('pages/AdminDashboard.vue'),
      },
      {
        path: 'userdash',
        name: 'user-home',
        component: () => import('pages/UserDashboard.vue'),
      },
      {
        path: 'collectionview',
        name: 'collection-view',
        component: () => import('pages/CollectionView.vue'),
      },
      {
        path: 'documents/:id',
        name: 'view-document',
        component: () => import('pages/ViewDocumentPage.vue'),
      },
      {
        path: 'artifacts/:id',
        name: 'view-artifact',
        component: () => import('pages/UserViewArtifactPage.vue'),  // USER
      },

      {
        path: 'admin/artifacts/:id',
        name: 'admin-view-artifact',
        component: () => import('pages/AdminViewArtifactPage.vue'),  // ADMIN
      },

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
