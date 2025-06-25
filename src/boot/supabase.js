import { boot } from 'quasar/wrappers'
import { createClient } from '@supabase/supabase-js'

// Load from .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create the client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default boot(({ app }) => {
  app.config.globalProperties.$supabase = supabase
})
