-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.all_users (
  id uuid NOT NULL,
  email character varying,
  created_at timestamp with time zone,
  user_type text,
  CONSTRAINT all_users_pkey PRIMARY KEY (id),
  CONSTRAINT all_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.appointment_booking (
  appointment_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  user_type text NOT NULL,
  date date NOT NULL,
  time time without time zone NOT NULL,
  purpose text NOT NULL,
  user_remarks text,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  status text NOT NULL,
  reviewed_by text,
  reviewed_at timestamp with time zone,
  admin_remarks text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointment_booking_pkey PRIMARY KEY (appointment_id),
  CONSTRAINT appointment_booking_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.approved_visitors (
  id uuid NOT NULL DEFAULT auth.uid(),
  registration_id uuid NOT NULL,
  approved_at timestamp with time zone DEFAULT now(),
  approved_by text,
  email text,
  first_name text,
  last_name text,
  start_date date,
  end_date date,
  account_status text DEFAULT 'Active'::text CHECK (account_status = ANY (ARRAY['Active'::text, 'Inactive'::text, 'Expired'::text])),
  institution text,
  purpose text,
  CONSTRAINT approved_visitors_pkey PRIMARY KEY (id),
  CONSTRAINT approved_visitors_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.registration_visitors(id),
  CONSTRAINT approved_visitors_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.artifacts_metadata (
  file_name text,
  file_url text,
  metadata jsonb,
  uploaded_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  search_text text,
  data_source text,
  donated_by text,
  date_received timestamp with time zone,
  related_links jsonb,
  CONSTRAINT artifacts_metadata_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categories (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  type text,
  category text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.collection_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL,
  item_id uuid NOT NULL,
  item_type text NOT NULL,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT collection_items_pkey PRIMARY KEY (id),
  CONSTRAINT collection_items_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(collection_id)
);
CREATE TABLE public.collections (
  collection_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL,
  collection_name text NOT NULL,
  description text,
  cover_url text,
  updated_at timestamp with time zone,
  user_id uuid NOT NULL,
  is_default boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  CONSTRAINT collections_pkey PRIMARY KEY (collection_id),
  CONSTRAINT collections_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.deleted_artifacts (
  file_name text,
  file_url text,
  metadata jsonb,
  uploaded_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  search_text text,
  data_source text,
  donated_by text,
  date_received timestamp with time zone,
  deleted_by text,
  deleted_at timestamp with time zone,
  related_links jsonb,
  CONSTRAINT deleted_artifacts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.deleted_documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  file_name text NOT NULL,
  file_url text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  uploaded_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT now(),
  search_text text,
  preview_url text,
  uploaded_by text,
  deleted_at timestamp with time zone DEFAULT now(),
  deleted_by text,
  related_links jsonb,
  CONSTRAINT deleted_documents_pkey PRIMARY KEY (id)
);
CREATE TABLE public.documents_metadata (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  file_name text NOT NULL,
  file_url text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  uploaded_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone,
  search_text text,
  preview_url text,
  uploaded_by text,
  related_links jsonb,
  CONSTRAINT documents_metadata_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inconsistencies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL,
  source_type text NOT NULL CHECK (source_type = ANY (ARRAY['document'::text, 'artifact'::text])),
  file_name text,
  file_url text,
  title text,
  issues jsonb NOT NULL,
  status text NOT NULL DEFAULT 'Open'::text CHECK (status = ANY (ARRAY['Open'::text, 'Resolved'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  last_scanned_at timestamp with time zone,
  resolved_at timestamp with time zone,
  admin_remarks text,
  reviewed_at timestamp with time zone,
  reviewed_by text,
  resolution text,
  CONSTRAINT inconsistencies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.item_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type = ANY (ARRAY['artifact'::text, 'document'::text])),
  action text NOT NULL,
  performed_by text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  performed_at timestamp with time zone DEFAULT now(),
  changes jsonb,
  CONSTRAINT item_history_pkey PRIMARY KEY (id)
);
CREATE TABLE public.logins (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  login_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  ip_address text,
  user_agent text,
  CONSTRAINT logins_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  receiver_id uuid,
  message text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['appointment_booking'::text, 'appointment_status'::text, 'visitor_registration'::text])),
  read boolean DEFAULT false,
  created_at timestamp with time zone,
  receiver_role text,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES auth.users(id)
);
CREATE TABLE public.registered_admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  contact text NOT NULL,
  is_super_admin boolean DEFAULT false,
  account_status text DEFAULT 'Active'::text CHECK (account_status = ANY (ARRAY['Active'::text, 'Inactive'::text])),
  CONSTRAINT registered_admins_pkey PRIMARY KEY (id),
  CONSTRAINT registered_admins_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.registered_faculty (
  id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  first_name text,
  last_name text,
  contact text,
  college text,
  department text,
  email character varying UNIQUE,
  account_status text DEFAULT 'Active'::text CHECK (account_status = ANY (ARRAY['Active'::text, 'Inactive'::text])),
  CONSTRAINT registered_faculty_pkey PRIMARY KEY (id),
  CONSTRAINT registered_faculty_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.registered_users (
  id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  first_name text,
  last_name text,
  contact text,
  college text,
  department text,
  year_section text,
  is_alumni boolean DEFAULT false,
  email character varying UNIQUE,
  account_status text DEFAULT 'Active'::text CHECK (account_status = ANY (ARRAY['Active'::text, 'Inactive'::text])),
  CONSTRAINT registered_users_pkey PRIMARY KEY (id),
  CONSTRAINT registered_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.registration_visitors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  first_name text,
  last_name text,
  contact text,
  institution text,
  email character varying,
  purpose text,
  letter_url text,
  status text,
  start_date date,
  end_date date,
  CONSTRAINT registration_visitors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.security_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['restricted_action'::text, 'screenshot_attempt'::text, 'copy_attempt'::text, 'print_attempt'::text, 'dev_tools_detected'::text, 'document_viewed'::text, 'document_closed'::text])),
  document_id uuid,
  user_id uuid NOT NULL,
  user_email text,
  user_name text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_agent text,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT security_logs_pkey PRIMARY KEY (id),
  CONSTRAINT security_logs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents_metadata(id)
);
CREATE TABLE public.user_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid,
  item_type text,
  clicked_at timestamp with time zone DEFAULT now(),
  title text,
  user_type text,
  action text,
  CONSTRAINT user_activity_log_pkey PRIMARY KEY (id)
);
CREATE TABLE public.webrtc_signaling (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  connection_code text NOT NULL UNIQUE,
  offer_data jsonb,
  answer_data jsonb,
  status text DEFAULT 'waiting'::text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + '00:10:00'::interval),
  CONSTRAINT webrtc_signaling_pkey PRIMARY KEY (id)
);