// Notification service for visitor-related events
import { supabase } from '../src/boot/supabase.js'

/**
 * Create a notification in the database for the user
 * @param {string} userId - User ID
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('appointment_booking' | 'appointment_status' | 'visitor_registration')
 */
export async function createNotification(userId, message, type = 'visitor_registration') {
  try {
    const { error } = await supabase.from('notifications').insert([
      {
        receiver_id: userId,
        message: message,
        type: type,
        receiver_role: 'user',
        read: false,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error('Error creating notification:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in createNotification:', error)
    return { success: false, error }
  }
}
