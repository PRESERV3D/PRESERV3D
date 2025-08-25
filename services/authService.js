// services/authService.js
import { supabase } from 'boot/supabase.js' // adjust path to your supabase boot file

export function trackAuthChanges() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      await supabase.from('logins').insert([
        {
          user_id: session.user.id,
          ip_address: window.location.hostname, // optional, can fetch real IP via server
          user_agent: navigator.userAgent,
        },
      ])
    }
  })
}
