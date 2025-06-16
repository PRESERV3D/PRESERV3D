<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="q-mt-md box-1 row items-center">
        <div class="col-7 q-gutter-xs">
          <p class="q-ml-lg admin-title">Explore & Manage Cultural Heritage Assets</p>
          <p class="q-ml-lg admin-subtitle">
            Access digital artifacts, document, and research <br />
            tools — all in one place.
          </p>
          <div class="q-ml-xs q-gutter-md">
            <q-btn to="/artifacts" label="Explore Artifacts" class="btn-explore" />
            <q-btn to="/documents" label="Browse Documents" class="btn-document" />
          </div>
        </div>
        <div class="col-5 q-gutter-xs">
          <q-img
            src="src/assets/img/trophy-document.png"
            alt="Trophy and Document"
            class="trophies"
          />
        </div>
      </div>

      <div class="q-mt-md box-2">
        <p class="q-ml-lg admin-title-2">Upload</p>
      </div>
    </div>

    <div class="row q-my-lg">
      <div class="box-3">
        <p class="q-ml-lg admin-title-2">Reports</p>
        <p class="q-ml-lg admin-subtitle">
          Access digital artifacts, document, and research tools — all in one place.
        </p>
        <div class="q-ml-xs q-gutter-md">
          <q-btn to="/artifacts" label="Explore Artifacts" class="btn-explore" />
          <q-btn to="/documents" label="Browse Documents" class="btn-document" />
        </div>
      </div>

      <div class="box-4">
        <p class="q-ml-lg admin-title-2">Recently Uploaded</p>
      </div>
    </div>
  </q-page>
</template>
