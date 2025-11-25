import { boot } from 'quasar/wrappers'
import { createClient } from '@supabase/supabase-js'

// Load from .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Create the client with a unique storage key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'preserv3d-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'preserv3d-web',
    },
  },
})

// Create admin client with service role key (for admin operations only)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: 'preserv3d-admin-auth',
      },
    })
  : supabase
export default boot(({ app }) => {
  app.config.globalProperties.$supabase = supabase
  app.config.globalProperties.$supabaseAdmin = supabaseAdmin
})
