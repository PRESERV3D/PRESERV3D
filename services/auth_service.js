// services/auth_service.js
import { supabase } from 'boot/supabase.js' // adjust path to your supabase boot file

export function trackAuthChanges() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const userId = session.user.id

      // Insert login record to logins table
      // This will automatically trigger update_last_login_from_logins function
      // which updates last_login in the respective user table
      await supabase.from('logins').insert([
        {
          user_id: userId,
          ip_address: window.location.hostname, // optional, can fetch real IP via server
          user_agent: navigator.userAgent,
        },
      ])
    }
  })
}
