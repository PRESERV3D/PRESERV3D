# PRESERV3D Development Guide

## Project Overview

PRESERV3D is a **Quasar + Vue 3 SPA** for managing PUP Library archives. It handles **dual content types**: PDF documents (with NLP-powered metadata extraction) and 3D artifacts (.glb models). The system combines document digitization, 3D visualization, and an appointment booking system for physical visits.

## Architecture & Tech Stack

### Frontend: Quasar Framework (Vue 3 + Vite)

- **Entry**: `src/App.vue` initializes session tracking via `useUserStore` and `trackAuthChanges()`
- **Routing**: `src/router/index.js` with Supabase auth guards - checks `requiresAuth` and `allowedRoles` meta
- **Boot Files** (`src/boot/`): Initialize global plugins before app mounts
  - `supabase.js` - Auth client with session persistence
  - `r2.js` - Cloudflare R2 storage uploads (handles .glb + PDF files)
  - `model-viewer.js` - Registers `<model-viewer>` custom element for 3D rendering
- **State**: Pinia stores in `src/stores/` - `user.js` handles multi-table auth (students, faculty, visitors, admins)

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
- **Content**: `documents_metadata`, `artifacts_metadata` (both store JSON metadata + file_url)
- **Quality Control**: `inconsistencies` table tracks metadata validation issues
- **User Profile Resolution**: `useUserStore.fetchProfile()` queries all auth tables sequentially

## Development Workflows

### Running the App

```powershell
# Frontend dev server (https://localhost:9000)
npm run dev  # or: quasar dev

# NLP service (required for PDF uploads)
cd services
.\venv\Scripts\activate
uvicorn nlp_service:app --reload --host 0.0.0.0 --port 8000
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

**Artifacts** (`ArtifactsPage.vue`, `Testing_ArtifactsPage.vue`):

1. Select .glb file (3D model compression commented out - see lines 1088-1157 in ArtifactsPage.vue)
2. Direct upload to R2 → `uploadFileToR2(file, 'artifacts', fileName)` with `contentType: 'model/gltf-binary'`
3. Manual metadata entry via `ConfirmMetadata` component
4. Save to `artifacts_metadata` table

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
