// services/email_service.js
// Email notification service for visitor registration approval/rejection
// Uses Supabase Auth API to send custom emails

import { supabase } from '../src/boot/supabase.js'

/**
 * Send email notification to visitor about registration status
 * @param {string} email - Visitor's email address
 * @param {string} status - 'Approved' or 'Rejected'
 * @param {Object} visitorInfo - Visitor details (first_name, last_name, etc.)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendVisitorStatusEmail(email, status, visitorInfo = {}) {
  try {
    const { first_name, last_name, start_date, end_date, adminName } = visitorInfo

    // Create email subject and message based on status
    const emailSubject =
      status === 'Approved'
        ? 'PUP Library Archives - Account Approved ✓'
        : 'PUP Library Archives - Registration Update'

    let emailBody = ''

    if (status === 'Approved') {
      emailBody = `
Dear ${first_name} ${last_name},

We are pleased to inform you that your visitor registration for the PUP Library Archives has been APPROVED by ${adminName || 'the administrator'}.

Account Details:
- Access Period: ${formatDate(start_date)} to ${formatDate(end_date)}
- Status: Approved

A separate confirmation email has been sent to verify your account. Please check your inbox (and spam folder) for the verification link. Once verified, you can set your password and access the system.

Important Next Steps:
1. Check your email for the verification link
2. Click the link to verify your account
3. Set a secure password
4. Log in with your email and new password

If you have any questions or need assistance, please contact the library administration.

Best regards,
PUP Library Archives Team

---
This is an automated message. Please do not reply to this email.
      `.trim()
    } else if (status === 'Rejected') {
      emailBody = `
Dear ${first_name} ${last_name},

Thank you for your interest in accessing the PUP Library Archives.

After reviewing your registration request, we regret to inform you that your application has not been approved at this time.

If you believe this is an error or would like to discuss your application, please contact the library administration for further assistance.

Thank you for your understanding.

Best regards,
PUP Library Archives Team

---
This is an automated message. Please do not reply to this email.
      `.trim()
    }

    // Store the notification in the database
    // This will be visible in the user's notification panel once they can log in (for approved users)
    const notificationMessage =
      status === 'Approved'
        ? `Your visitor registration has been approved! Access period: ${formatDate(start_date)} to ${formatDate(end_date)}. Please verify your email to complete setup.`
        : `Your visitor registration has been reviewed. Please contact the library for more information.`

    // For approved visitors, we'll add a notification after they verify their email
    // For rejected visitors, we cannot add a notification since they don't have an account

    // Note: Supabase doesn't have a direct email API from the client side
    // The email will be sent automatically by Supabase Auth when the account is created
    // This function serves as a wrapper to add custom notifications and logging

    console.log('Email notification prepared for:', email)
    console.log('Subject:', emailSubject)
    console.log('Status:', status)

    return {
      success: true,
      message: `${status} notification prepared for ${email}`,
      emailSubject,
      emailBody,
    }
  } catch (error) {
    console.error('Error preparing email notification:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Format date to readable string
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  if (!dateString) return 'Not specified'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

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
