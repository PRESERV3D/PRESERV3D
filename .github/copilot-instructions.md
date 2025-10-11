# PRESERV3D Development Guide

## Project Overview

PRESERV3D is a **Quasar + Vue 3 SPA** for managing PUP Library archives. It handles **dual content types**: PDF documents (with NLP-powered metadata extraction) and 3D artifacts (.glb models). The system combines document digitization, 3D visualization, and an appointment booking system for physical visits.

**Repository**: PRESERV3D/PRESERV3D on GitHub  
**Current Branch**: feature/required-fields

## Architecture & Tech Stack

### Frontend: Quasar Framework (Vue 3 + Vite)

- **Entry**: `src/App.vue` initializes session tracking via `useUserStore` and `trackAuthChanges()`
- **Routing**: `src/router/index.js` with Supabase auth guards - checks `requiresAuth` and `allowedRoles` meta
- **Boot Files** (`src/boot/`): Initialize global plugins before app mounts (order matters in `quasar.config.js`)
  - `axios.js` - HTTP client configuration
  - `supabase.js` - Auth client with session persistence
  - `r2.js` - Cloudflare R2 storage uploads (handles .glb + PDF files)
  - `model-viewer.js` - Registers `<model-viewer>` custom element for 3D rendering
- **State**: Pinia stores in `src/stores/` - `user.js` handles multi-table auth (students, faculty, visitors, admins)
- **Quasar Plugins**: Dialog, Loading, Notify (configured in `quasar.config.js` framework.plugins)

### Backend Services (Python + Node.js)

- **NLP Service** (`services/nlp_service.py`): FastAPI server (port 8000) for PDF processing
  - Uses custom spaCy NER model trained on PUP documents (`nlp_training/ner_model/`)
  - Extracts: title, author, date, organization, place, keywords (KeyBERT), summary (BART)
  - OCR fallback via Tesseract.js for scanned documents
  - Metadata quality validation with semantic similarity checks (SentenceTransformer)
- **Web Scraper** (`services/web_scraper.js`): Node.js/Puppeteer for related links discovery

### Storage Architecture

- **Supabase Storage**: Legacy bucket system (being phased out)
- **Cloudflare R2** (Primary): S3-compatible object storage
  - Buckets: `artifacts/`, `documents/`, `collection-covers/`, `pdf-previews/`, `visitor-letters/`
  - Access: `uploadFileToR2()` function from `boot/r2.js`
  - Public URLs: `VITE_R2_PUBLIC_URL` + folder + filename

### Database: Supabase PostgreSQL

- **Auth Tables**: `registered_users`, `registered_faculty`, `approved_visitors`, `registered_admins`
  - All auth tables have `id` UUID that links to `auth.users(id)` 
  - User type determined by which table contains the user's record
  - `registered_admins.is_super_admin` boolean flag for super admin privileges
- **Content**: `documents_metadata`, `artifacts_metadata` (both store JSON metadata + file_url)
  - Both use JSONB `metadata` column for flexible schema
  - `search_text` column for full-text search capabilities
- **Quality Control**: `inconsistencies` table tracks metadata validation issues with status: "Open" / "Resolved"
- **User Profile Resolution**: `useUserStore.fetchProfile()` queries all auth tables **sequentially** (students → faculty → admins → visitors)
  - Sets `profile.user_type` based on which table matches: 'student', 'faculty', 'admin', 'super admin', 'visitor'
  - Always sets `profile.role` to either 'admin' or 'user' (for routing logic)

## Development Workflows

### Running the App

**CRITICAL**: NLP service MUST be running for PDF uploads to work. Start both services:

```powershell
# Terminal 1: Frontend dev server (https://localhost:9000)
npm run dev  # or: quasar dev

# Terminal 2: NLP service (required for PDF uploads)
cd services
.\venv\Scripts\activate
uvicorn nlp_service:app --reload --host 0.0.0.0 --port 8000
```

### Python Virtual Environment Setup

If NLP service fails with module errors, recreate the venv:

```powershell
cd services
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Variables (.env)

Required keys prefixed with `VITE_` for client-side access:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- `VITE_R2_ENDPOINT` / `VITE_R2_ACCESS_KEY_ID` / `VITE_R2_SECRET_ACCESS_KEY` / `VITE_R2_BUCKET_NAME` / `VITE_R2_PUBLIC_URL`

### Key Commands

- `npm run lint` - ESLint with flat config (Vue 3 + Quasar rules)
- `npm run format` - Prettier formatting
- `quasar build` - Production build for Vercel deployment

## Critical Patterns & Conventions

### Quasar Framework Integration

**Global Plugins** (accessed via `$q` in components):

```javascript
// Notify - Toast notifications
$q.notify({ type: 'positive', message: 'Success!', position: 'top' })
$q.notify({ type: 'negative', message: 'Error occurred', position: 'top' })

// Dialog - Confirmation dialogs
$q.dialog({ title: 'Confirm', message: 'Are you sure?' }).onOk(() => {})

// Loading - Global loading overlay
$q.loading.show()
$q.loading.hide()
```

**Form Validation Pattern** (Quasar's built-in system):

```vue
<q-input
  v-model="form.field"
  lazy-rules
  :rules="[
    (val) => !!val || 'Field is required',
    (val) => /regex/.test(val) || 'Invalid format',
    asyncValidationFunction  // Can use async functions
  ]"
/>
```

**Custom Element Registration** (`quasar.config.js`):

```javascript
viteVuePluginOptions: {
  template: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'model-viewer'  // Required for 3D viewer
    }
  }
}
```

### Role-Based Access Control

Router guards check `session.user.user_metadata.role` against route `meta.allowedRoles`:

- **Super Admin routes**: `/superadmin` (requires `is_super_admin: true` flag)
- **Admin routes**: `/admindash`, `/admin/appointments`, `/data-quality`, `/edit/*`
- **User routes**: `/home`, `/collections`, `/appointment`
- **Public**: `/landing`, `/admin/landing`, `/user/*`, `/phone-camera` (no auth)

**Super Admin Feature**:

- Super admins can manage all users (students, faculty, visitors, admins)
- Can create new admin accounts with email verification
- New admins receive password reset link via Supabase Auth email
- Access via dedicated `/superadmin` dashboard
- Database: `registered_admins.is_super_admin` boolean column

### Dual Upload Flow (Documents vs Artifacts)

**Documents** (`DocumentsPage.vue`, `UploadPage.vue`):

1. Upload PDF → `axios.post('http://localhost:8000/process-text')` with FormData
2. NLP returns metadata or `{status: "ocr_required", pages: [...]}` for scanned PDFs
3. Upload to R2 → `uploadFileToR2(file, 'documents', fileName)`
4. Save to `documents_metadata` table with `metadata` JSONB column

**Key Pattern**: Always check NLP service health before PDF upload workflows

**Artifacts** (`ArtifactsPage.vue`, `Testing_ArtifactsPage.vue`):

1. Select .glb file (3D model compression commented out - see lines 1088-1157 in ArtifactsPage.vue)
2. Direct upload to R2 → `uploadFileToR2(file, 'artifacts', fileName)` with `contentType: 'model/gltf-binary'`
3. Manual metadata entry via `ConfirmMetadata` component
4. Save to `artifacts_metadata` table

**uploadFileToR2 Signature** (`src/boot/r2.js`):

```javascript
async function uploadFileToR2(file, folder, fileName) {
  // Auto-detects MIME type based on extension
  // For .glb/.gltf: sets contentType to 'model/gltf-binary'
  // Returns: { error, publicUrl }
}
```

### 3D Model Rendering

- **Component**: `<model-viewer>` from `@google/model-viewer` (registered as custom element)
- **Gallery**: Godot Engine integration (`public/godot_gallery/Gallery.html`) loads models via query params
- **Props**: Common attributes in `modelViewerProps()` - `auto-rotate`, `camera-orbit`, `shadow-intensity`
- **Note**: GLB compression code exists but is commented out (Draco, meshoptimizer, gltf-transform dependencies installed)

### Secure PDF Viewing

- **Component**: `SecurePdfViewer.vue` - Protected PDF viewer with security restrictions
- **Features**:
  - Prevents right-click context menu and text selection
  - Blocks screenshot keyboard shortcuts (PrintScreen, Ctrl+P, Ctrl+S, F12)
  - Disables copying, cutting, printing, and drag-and-drop
  - Detects developer tools opening
  - Applies watermark overlay for content protection
  - Built-in zoom controls and page navigation
  - Uses PDF.js for client-side rendering
- **Usage**: `<SecurePdfViewer v-model="show" :pdf-url="url" :document-title="title" :document-author="author" />`
- **Implementation**: ViewDocumentPage.vue uses this instead of opening PDFs in new tabs
- **Worker Configuration**: PDF.js worker loaded from `public/pdf.worker.min.mjs` with CDN fallback

### NLP Pipeline Details

**Text Extraction** (`extract_text()` in nlp_service.py):

- Reads up to 5000 chars from PDF using PyMuPDF (fitz)
- Falls back to OCR if no searchable text → returns base64 images for Tesseract.js
- Returns `{status: "success", text: "..."}` or `{status: "ocr_required", pages: [...]}`

**NER Metadata Extraction** (`extract_metadata_ner()`):

- Custom entities: `TITLE`, `AUTHOR`, `DATE`, `ORG`, `PLACE`
- Validation helpers: `validate_title()`, `validate_author()`, etc. filter noise
- Date parsing handles ranges ("2019-2020"), academic years, and returns most specific format available

**Quality Validation** (`detect_inconsistencies()`):

- Checks for missing/unknown fields, future dates, invalid formats
- Summary relevance via SentenceTransformer cosine similarity (threshold: 0.55)
- Results saved to `inconsistencies` table with status: "Open" / "Resolved"

### Appointment System

- Users book via `/appointment` → creates record in `appointments` table
- Admins manage via `/admin/appointments` → update status, send email notifications
- Faculty/visitors have separate registration flows (`UserFacultyPage.vue`, `UserVisitorPage.vue`)

## File Organization Patterns

- **Pages**: Route-level components in `src/pages/` (40+ files)
  - Naming: `[Feature]Page.vue` or `[Role][Feature]Page.vue`
  - Admin pages prefixed with `Admin*` (e.g., `AdminDashboard.vue`)
- **Components**: Reusable UI in `src/components/` (e.g., `ConfirmMetadata.vue`, `UploadDialog.vue`)
- **Services**: Backend logic in root `/services/` directory (Python + Node.js)
- **Public Assets**: Static files in `/public/` - icons, images, Godot gallery, Draco decoders

## Code Style & Conventions

### Vue Component Patterns

- Use `<script setup>` syntax is NOT used - this project uses Options API
- Reactive data defined in `data()` function returning object
- Methods in `methods` object, lifecycle hooks at component level
- Async validation functions can be used directly in `:rules` arrays

### Variable Naming

- **camelCase**: JavaScript variables, functions, component data properties
- **PascalCase**: Vue component names (both file names and in templates)
- **kebab-case**: CSS classes, HTML attributes, route paths
- **SCREAMING_SNAKE_CASE**: Environment variables (all prefixed with `VITE_`)

### Import Organization

```javascript
// 1. Vue/Quasar core imports
import { defineComponent } from 'vue'
import { useQuasar } from 'quasar'

// 2. External libraries
import axios from 'axios'

// 3. Local modules (stores, composables, utils)
import { useUserStore } from 'src/stores/user'
import { uploadFileToR2 } from 'boot/r2'

// 4. Components (if used)
import MyComponent from 'src/components/MyComponent.vue'
```

## Common Pitfalls & Solutions

### PDF.js Worker Not Loading

**Symptom**: SecurePdfViewer shows blank or fails to load PDFs
**Fix**: Ensure PDF.js worker is configured correctly in SecurePdfViewer.vue - uses CDN fallback

### NLP Service Not Running

**Symptom**: PDF uploads fail with connection error
**Fix**: Ensure `uvicorn nlp_service:app --reload --host 0.0.0.0 --port 8000` is running in `services/` directory

### R2 Upload Failures

**Symptom**: File uploads succeed but URLs return 403
**Fix**: Verify `VITE_R2_PUBLIC_URL` matches bucket public URL in Cloudflare R2 dashboard

### Auth Redirect Loops

**Symptom**: User stuck on landing page after login
**Fix**: Check `session.user.user_metadata.role` exists - set during registration in respective `registered_*` tables

### Model Viewer Not Rendering

**Symptom**: `<model-viewer>` shows blank
**Fix**: Ensure `model-viewer.js` boot file loaded + `quasar.config.js` has `isCustomElement: (tag) => tag === 'model-viewer'`

### Python Virtual Environment Issues

**Symptom**: Module not found errors in NLP service
**Fix**: Re-create venv: `cd services; python -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt`

### Boot File Order Issues

**Symptom**: Global functions not available in components
**Fix**: Check `quasar.config.js` boot array order - dependencies must load before consumers (e.g., `supabase` before `r2`)

## Testing Approach

- **No formal test suite** (package.json has placeholder test script)
- Manual testing via dev server + database inspection in Supabase dashboard
- NER model training data in `services/nlp_training/training_data.jsonl`

## Deployment

- **Platform**: Vercel (configured via `vercel-build` script)
- **Build**: `quasar build` outputs to `dist/spa/`
- **Python Service**: Deploy separately (not included in Vercel build)
- **Environment**: All `VITE_*` vars must be set in Vercel dashboard

---

**When adding features**: Follow the dual-content pattern (documents vs artifacts), respect role-based routing, and integrate NLP for text-based metadata extraction where applicable.
