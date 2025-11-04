# PRESERV3D Development Guide

## Project Overview

PRESERV3D is a **Quasar + Vue 3 SPA** for managing PUP Library archives. It handles **dual content types**: PDF documents (with NLP-powered metadata extraction) and 3D artifacts (.glb models). The system combines document digitization, 3D visualization, an appointment booking system, and visitor registration workflow.

**Repository**: PRESERV3D/PRESERV3D on GitHub  
**Tech Stack**: Quasar 2.16 + Vue 3.4 (Options API) + Vite + Supabase PostgreSQL + Cloudflare R2 + Python FastAPI (NLP)

## Architecture & Tech Stack

### Frontend: Quasar Framework (Vue 3 + Vite)

- **Entry**: `src/App.vue` initializes session tracking via `useUserStore` and `trackAuthChanges()`
- **Routing**: `src/router/index.js` with Supabase auth guards - checks `requiresAuth` and `allowedRoles` meta
- **Boot Files** (`src/boot/`): Initialize global plugins before app mounts (order matters in `quasar.config.js`)
  - **Load order**: `['axios', 'supabase', 'r2', 'pdfjs', 'model-viewer']` - dependencies must load before consumers
  - `axios.js` - HTTP client configuration, exposes `$axios` and `$api` globally
  - `supabase.js` - Auth client with session persistence, exposes `$supabase` and `$supabaseAdmin`
  - `r2.js` - Cloudflare R2 storage uploads, exposes `$r2Upload`, `$getR2Url`, `$getPresignedUrl`
  - `pdfjs.js` - Configures PDF.js worker globally for SecurePdfViewer component
  - `model-viewer.js` - Registers `<model-viewer>` custom element, exposes `$loadModelViewer` for lazy loading
- **State**: Pinia stores in `src/stores/` - `user.js` handles multi-table auth (students, faculty, visitors, admins)
- **Quasar Plugins**: Dialog, Loading, Notify (configured in `quasar.config.js` framework.plugins)

### Backend Services (Python + Node.js)

- **NLP Service** (`services/nlp_service.py`): FastAPI server (port 8000) for PDF processing
  - Uses custom spaCy NER model trained on PUP documents (`nlp_training/ner_model/`)
  - Extracts: title, author, date, organization, place, keywords (KeyBERT), summary (BART)
  - OCR fallback via Tesseract.js for scanned documents
  - Metadata quality validation with semantic similarity checks (SentenceTransformer)
- **Web Scraper** (`services/web_scraper.js`): Node.js/Puppeteer for discovering related academic resources
  - **Purpose**: Finds related academic links for documents/artifacts using DuckDuckGo HTML search
  - **Architecture**: Shared browser instance with idle timeout (5 min) to reduce memory usage
  - **Memory Optimizations**:
    - Single-process mode, blocks images/CSS/fonts/media during scraping
    - Controlled concurrency (batch processing: 2 URLs at a time)
    - Forced garbage collection between batches if available
  - **Chrome/Chromium Discovery**: Auto-detects system Chrome or uses `PUPPETEER_EXECUTABLE_PATH` env var
  - **Search Strategy**: Combines title + author + categories + date into DuckDuckGo query
  - **Content Filtering**:
    - Filters out document files (.pdf, .doc, .docx, .xls, .ppt)
    - Language detection via `franc` library (prefers English results)
    - Returns max 3-5 links with title, description, URL, and language code
  - **Error Handling**: Returns structured error messages, continues on individual URL failures
  - **Integration**: Called from `EditViewDocument.vue` and `EditViewArtifacts.vue` via `fetchRelatedLinks()` function
  - **Storage**: Results saved to `related_links` JSONB column in respective metadata tables
- **Additional Services** (utility/support functions):
  - `ocr_service.js` - Tesseract.js integration for scanned document processing
  - `email_service.js` - Email notifications for appointments and visitor approvals
  - `narration_service.js` - Generates descriptive narration for 3D artifacts
  - `report_service.js` & `report_charts.js` - Generate analytics reports and charts
  - `auth_service.js` - Helper functions for authentication tracking

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
  - `account_status` column: 'Active' / 'Inactive' / 'Expired' (visitors only)
- **Content**: `documents_metadata`, `artifacts_metadata` (both store JSON metadata + file_url)
  - Both use JSONB `metadata` column for flexible schema
  - `search_text` column for full-text search capabilities
  - `related_links` JSONB column for web scraper results
- **Visitor Registration Flow**: `registration_visitors` → `approved_visitors` (admin approval required)
  - Registration includes: letter upload (R2), start/end dates, institution, purpose
  - Admins can approve/reject via `UserManagementPage.vue`
  - Notifications sent to all admins on new registration (`notifications` table)
- **Quality Control**: `inconsistencies` table tracks metadata validation issues with status: "Open" / "Resolved"
- **Collections**: `collections` + `collection_items` for organizing documents/artifacts by user
  - `is_default` and `is_locked` flags for system collections
- **User Profile Resolution**: `useUserStore.fetchProfile()` queries all auth tables **in parallel** (Promise.all)
  - Priority order: students → faculty → admins → visitors
  - Sets `profile.user_type` based on which table matches: 'student', 'faculty', 'admin', 'super admin', 'visitor'
  - Always sets `profile.role` to either 'admin' or 'user' (for routing logic)
- **Audit Trail**: `item_history` table tracks all changes to documents/artifacts (who, when, what changed)
- **Activity Tracking**: `user_activity_log` and `logins` tables for analytics

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

**Web Scraper Service** (optional but recommended for related links feature):

- Runs on-demand via command-line invocation from frontend
- No persistent server needed - invoked as Node.js subprocess
- Uses Puppeteer with shared browser instance for efficiency
- Requires Chrome/Chromium installed or set via `PUPPETEER_EXECUTABLE_PATH` env var
- Test manually: `node services/web_scraper.js "document title" "author" "categories" "date"`

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
    asyncValidationFunction, // Can use async functions
  ]"
/>
```

**Custom Element Registration** (`quasar.config.js`):

```javascript
viteVuePluginOptions: {
  template: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'model-viewer' // Required for 3D viewer
    }
  }
}
```

### Role-Based Access Control

Router guards check `session.user.user_metadata.role` against route `meta.allowedRoles`:

- **Super Admin routes**: `/superadmin`, `/user-management` (requires `is_super_admin: true` flag)
- **Admin routes**: `/admindash`, `/admin/appointments`, `/data-quality`, `/edit/*`
- **User routes**: `/home`, `/collections`, `/appointment`
- **Public**: `/landing`, `/admin/landing`, `/user/*`, `/phone-camera` (no auth)

**Super Admin vs Regular Admin**:

- **Super Admins**: Full user management (students, faculty, visitors, admins), can create new admin accounts
  - Access `UserManagementPage.vue` with all tabs visible
  - Database: `registered_admins.is_super_admin = true`
  - Can manage admin accounts with email verification workflow
- **Regular Admins**: Limited to visitor registration approval and approved visitor management
  - Access `UserManagementPage.vue` with only visitor-related tabs
  - Cannot create admin accounts or manage other user types

**Visitor Account Lifecycle**:

1. Visitor fills out `UserVisitorPage.vue` (multi-step form + letter upload to R2)
2. Record saved to `registration_visitors` table
3. All admins notified via `notifications` table
4. Admin approves → moved to `approved_visitors` with auth account created
5. System calculates `account_status` based on start/end dates: Active/Expired
6. Profile page shows "Request Extension" button for visitors near expiration

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
- **Implementation**: `ViewDocumentPage.vue` uses this instead of opening PDFs in new tabs
- **Worker Configuration**: PDF.js worker loaded from `public/pdf.worker.min.mjs` with CDN fallback
- **Boot File**: `pdfjs.js` configures worker path globally before app mounts

### Web Scraper Integration

- **Purpose**: Discover related academic resources for documents and artifacts
- **UI Components**: Integrated into `EditViewDocument.vue` and `EditViewArtifacts.vue`
- **User Flow**:
  1. Admin/editor clicks "Fetch Related Links" button
  2. Frontend invokes Node.js subprocess: `node services/web_scraper.js <params>`
  3. Scraper searches DuckDuckGo with metadata (title, author, categories, date)
  4. Returns 3-5 filtered links (English preferred, no document files)
  5. User reviews and saves selected links to `related_links` JSONB column
- **Functions**:
  - `fetchRelatedLinks(title, author, categories, date)` - Initiates search via child_process spawn
  - `saveRelatedLinks()` - Persists selected links to database with audit trail
- **Performance**: Shared browser instance reduces memory, batch scraping with concurrency control
- **Error Handling**: Graceful degradation - continues on individual URL failures, returns partial results

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

- Users book via `/appointment` (`AppointmentBooking.vue`) → creates record in `appointment_booking` table
- Admins manage via `/admin/appointments` (`AdminAppointmentPage.vue`) → update status, send email notifications
- Faculty/visitors have separate registration flows:
  - `UserFacultyPage.vue` - Faculty registration with institution validation
  - `UserVisitorPage.vue` - Multi-step visitor registration with letter upload (R2: `visitor-letters/`)
- Notification system (`notifications` table) alerts admins of new registrations/appointments
  - Types: 'appointment_booking', 'appointment_status', 'visitor_registration', 'visitor_extension'
  - Admins see notifications in real-time via `receiver_role = 'admin'` query

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

### Web Scraper Chrome/Chromium Not Found

**Symptom**: Web scraper fails with "No Chrome/Chromium browser found" error
**Fix**:

- Set `PUPPETEER_EXECUTABLE_PATH` environment variable to Chrome executable path
- Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- Or run: `cd services; npm run install-chrome` (if script exists)
- Check system paths: `/usr/bin/chromium`, `/usr/bin/google-chrome`, etc. (Linux)

### Web Scraper Timeout or Memory Issues

**Symptom**: Scraper times out or crashes during batch processing
**Fix**:

- Reduce concurrency in `scrapeAllContent()` (default: 2 URLs at a time)
- Increase navigation timeout if network is slow (default: 15s)
- Verify shared browser instance isn't being closed prematurely
- Check memory usage with `logMemoryUsage()` calls in script

### Related Links Not Saving

**Symptom**: Fetched links don't persist to database
**Fix**:

- Verify `related_links` JSONB column exists in `documents_metadata` and `artifacts_metadata` tables
- Check audit trail in `item_history` table for error messages
- Ensure user has edit permissions for the document/artifact

### Visitor Extension Requests

**Current Implementation**: "Request Extension" button exists in `ProfilePage.vue` but functionality not yet connected
**Future Work**: Implement extension request workflow (new table + admin approval process similar to initial registration)

## Performance Optimizations Applied

### Code Splitting (`quasar.config.js`)

Manual chunks configured for efficient caching:

- `vendor-vue`: Vue core (vue, vue-router, pinia)
- `vendor-quasar`: Quasar framework
- `vendor-supabase`: Supabase client
- `vendor-aws`: AWS SDK for R2
- `vendor-3d`: 3D model libraries (model-viewer, three.js)
- `vendor-pdf`: PDF processing (pdfjs-dist, pdf-lib)

### Parallel Data Loading (`src/stores/user.js`)

Profile resolution uses `Promise.all()` for 4x faster auth checks - queries all auth tables simultaneously instead of sequentially.

### Pagination Composable (`src/composables/usePagination.js`)

Reusable pagination logic limits initial data loads to 20-50 items. Returns: `items`, `currentPage`, `totalPages`, `nextPage`, `previousPage`, `goToPage`, `refresh`.

**Usage Pattern**:

```javascript
import { usePagination } from 'src/composables/usePagination'

const { items, loading, fetchPage } = usePagination(fetchFunction, { pageSize: 20 })
await fetchPage(1) // Load first page
```

### Database Indexes (`database/optimization_indexes_safe.sql`)

Critical indexes for query performance - must be applied manually via Supabase SQL Editor:

**Content Tables** (frequently fetched for listings, search, filtering):

- `documents_metadata`: uploaded_at, updated_at, metadata GIN index, file_name, search_text (tsvector)
- `artifacts_metadata`: uploaded_at, updated_at, metadata GIN index, file_name, search_text (tsvector)
- Both tables indexed on `id` (primary key) for single-item lookups

**Collections System** (heavily used in view/edit pages):

- `collections`: user_id (for user's collections), composite (user_id + collection_name)
- `collection_items`: composite (collection_id + item_type + item_id), reverse (item_id + item_type)
- Enables fast lookups: "which collections contain this item?" and "what items in this collection?"

**User Authentication** (parallel queries in `useUserStore.fetchProfile()`):

- `registered_users`: email, created_at, account_status
- `registered_faculty`: email, created_at, account_status
- `registered_admins`: email, is_super_admin (partial index for super admins only), account_status
- `approved_visitors`: email, user_id, registration_id, composite (start_date + end_date)
- Speeds up login, profile resolution, and user management queries

**Activity Tracking** (analytics, recent activity widgets):

- `user_activity_log`: composite (user_id + clicked_at DESC), (item_id + user_id + clicked_at)
- `logins`: composite (user_id + login_at DESC) for "last seen" queries
- Enables fast "recent activity" and "last login" lookups

**Audit & Quality Control** (admin features):

- `item_history`: composite (item_id + item_type + performed_at DESC) for change tracking
- `inconsistencies`: composite (status + source_type), record_id for resolution workflow
- Speeds up data quality dashboard and edit history views

**Notifications System** (real-time admin alerts):

- `notifications`: composite (receiver_id + read + created_at DESC)
- `notifications`: receiver_role for admin broadcast queries, type for notification filtering
- Enables fast unread count and notification feed queries

**Appointments** (visitor/user booking system):

- `appointment_booking`: user_id, status, email, composite (date + status)
- Speeds up "my appointments" and admin appointment management

**Related Links** (web scraper integration):

- `documents_metadata.related_links`: GIN index for JSONB queries
- `artifacts_metadata.related_links`: GIN index for JSONB queries
- Enables fast filtering/searching within related links

**Account Extensions** (visitor extension requests):

- `account_extensions`: approval_id, extension_status, reviewed_at indexes
- Enables fast lookup of pending extension requests and approval history

**Security & Audit** (compliance and monitoring):

- `security_logs`: user_id, document_id, event_type, timestamp indexes
- `all_users`: unified user view with email, user_type, created_at indexes
- Enables fast security event tracking and cross-user-type queries

**Email & Communication** (tracking and debugging):

- `email_logs`: recipient, status, sent_at indexes for email delivery tracking

**WebRTC Signaling** (peer connections):

- `webrtc_signaling`: connection_code (unique), status, expires_at indexes
- Enables fast peer connection lookup and cleanup of expired sessions

**Expected improvement: 30-50% faster queries overall, 70%+ for filtered/sorted lists**

**Index Maintenance**:

- Indexes auto-update on INSERT/UPDATE/DELETE
- Monitor index usage: `SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public'`
- Rebuild if fragmented: `REINDEX INDEX CONCURRENTLY index_name`

**Query Best Practices for Indexed Tables**:

- **Use indexed columns in WHERE clauses**: Filter on `uploaded_at`, `user_id`, `status`, `email`
- **Order by indexed columns**: Use `ORDER BY uploaded_at DESC` or `ORDER BY clicked_at DESC`
- **Composite index order matters**: For `(user_id, clicked_at)`, query should filter user_id first
- **JSONB queries**: Use `@>`, `?`, `?|` operators on `metadata` and `related_links` columns
- **Full-text search**: Use `to_tsvector` and `@@` operators on `search_text` column
- **Avoid LIKE patterns starting with %**: `LIKE '%text'` doesn't use index, but `LIKE 'text%'` does
- **Limit large result sets**: Use pagination with `LIMIT` and `OFFSET` for better performance

**Example Optimized Queries**:

```javascript
// ✅ Good: Uses idx_documents_uploaded_at
const { data } = await supabase
  .from('documents_metadata')
  .select('*')
  .order('uploaded_at', { ascending: false })
  .limit(20)

// ✅ Good: Uses idx_user_activity_recent composite index
const { data } = await supabase
  .from('user_activity_log')
  .select('*')
  .eq('user_id', userId)
  .order('clicked_at', { ascending: false })
  .limit(10)

// ✅ Good: Uses idx_notifications_receiver composite index
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('receiver_id', userId)
  .eq('read', false)
  .order('created_at', { ascending: false })

// ✅ Good: Uses GIN index on metadata JSONB
const { data } = await supabase
  .from('documents_metadata')
  .select('*')
  .contains('metadata', { category: 'Research' })

// ❌ Avoid: Fetching all records without limit
const { data } = await supabase.from('documents_metadata').select('*') // Can return thousands of records

// ❌ Avoid: Ordering by non-indexed column
const { data } = await supabase
  .from('documents_metadata')
  .select('*')
  .order('some_unindexed_field', { ascending: false })
```

### Adding New Indexes - Decision Guide

**When to add an index**:

1. **Slow queries**: Query takes >500ms consistently
2. **Frequent queries**: Same query pattern executed >100x per day
3. **WHERE clauses**: Filtering on columns not yet indexed
4. **ORDER BY**: Sorting on columns not yet indexed
5. **JOIN conditions**: Joining on foreign key columns
6. **JSONB queries**: Frequently querying into JSONB columns

**Index types to choose**:

- **B-Tree (default)**: For equality (`=`) and range (`<`, `>`, `BETWEEN`) queries
- **GIN**: For JSONB (`@>`, `?`), arrays, and full-text search (`@@`)
- **Composite**: For multi-column filters (e.g., `WHERE user_id = X AND status = Y`)
- **Partial**: For filtered queries (e.g., `WHERE deleted = false`)

**Step-by-step process**:

1. **Identify slow query**: Check Supabase logs or use `EXPLAIN ANALYZE`
2. **Analyze query pattern**: What columns are in WHERE/ORDER BY/JOIN?
3. **Check existing indexes**: `\d+ table_name` in psql or Supabase dashboard
4. **Create index in SQL file**: Add to `database/optimization_indexes_safe.sql`
5. **Test locally**: Run query before/after, measure improvement
6. **Apply to production**: Run SQL in Supabase dashboard
7. **Monitor**: Check `pg_stat_user_indexes` for index usage

**Example: Adding index for new feature**:

```sql
-- Feature: Filter documents by category
-- Query pattern: WHERE metadata->>'category' = 'Research'
-- Solution: Expression index on JSONB field

CREATE INDEX IF NOT EXISTS idx_documents_category
ON documents_metadata((metadata->>'category'));

-- Feature: Recent uploads by specific user
-- Query pattern: WHERE uploaded_by = X ORDER BY uploaded_at DESC
-- Solution: Composite index

CREATE INDEX IF NOT EXISTS idx_documents_user_recent
ON documents_metadata(uploaded_by, uploaded_at DESC);
```

**Common pitfalls to avoid**:

- **Over-indexing**: Too many indexes slow down INSERT/UPDATE
- **Duplicate indexes**: Check for overlapping index coverage
- **Wrong column order**: In composite indexes, most selective column first
- **Missing DESC**: For timestamp sorts, include DESC in index definition

## Testing Approach

- **No formal test suite** (package.json has placeholder test script)
- Manual testing via dev server + database inspection in Supabase dashboard
- NER model training data in `services/nlp_training/training_data.jsonl`
- **Test Files**:
  - `services/test_scraper.js` - Manual testing script for web scraper functionality
  - `services/tests/` - Additional test scripts for backend services
- **Testing Workflow**:
  - Frontend: Run `npm run dev`, manually test features in browser
  - Backend: Test NLP service with curl/Postman, web scraper with command-line invocation
  - Database: Verify data integrity through Supabase dashboard SQL editor

## Deployment

- **Platform**: Vercel (configured via `vercel-build` script)
- **Build**: `quasar build` outputs to `dist/spa/`
- **Python Service**: Deploy separately (not included in Vercel build)
- **Environment**: All `VITE_*` vars must be set in Vercel dashboard

---

**When adding features**: Follow the dual-content pattern (documents vs artifacts), respect role-based routing, and integrate NLP for text-based metadata extraction where applicable.
