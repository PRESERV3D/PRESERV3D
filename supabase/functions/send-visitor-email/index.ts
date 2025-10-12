// Supabase Edge Function to send visitor approval/rejection emails via Gmail SMTP
// Deploy with: supabase functions deploy send-visitor-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Gmail SMTP credentials
const GMAIL_USER = Deno.env.get('GMAIL_USER') || 'pup.preserv3D@gmail.com'
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface EmailRequest {
  email: string
  status: 'Approved' | 'Rejected'
  visitorInfo: {
    first_name: string
    last_name: string
    start_date?: string
    end_date?: string
    adminName?: string
    institution?: string
    purpose?: string
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting: Track last email send time (in-memory, resets on cold start)
let lastEmailTime = 0
const MIN_EMAIL_INTERVAL_MS = 3000 // 3 seconds between emails

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Rate limiting check
  const now = Date.now()
  const timeSinceLastEmail = now - lastEmailTime
  if (timeSinceLastEmail < MIN_EMAIL_INTERVAL_MS) {
    const waitTime = MIN_EMAIL_INTERVAL_MS - timeSinceLastEmail
    console.log(`Rate limit: waiting ${waitTime}ms before sending email`)
    await new Promise((resolve) => setTimeout(resolve, waitTime))
  }

  try {
    const { email, status, visitorInfo }: EmailRequest = await req.json()

    // Validate required fields
    if (!email || !status || !visitorInfo) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, status, visitorInfo' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { first_name, last_name, start_date, end_date, adminName, institution, purpose } =
      visitorInfo

    // Format dates
    const formatDate = (dateString?: string) => {
      if (!dateString) return 'Not specified'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    // Create email content based on status
    let subject = ''
    let htmlContent = ''
    let textContent = ''

    if (status === 'Approved') {
      subject = 'PRESERV3D - PUP Library - Account Approved ✓'

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #800000; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .details { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #800000; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #800000; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .success { color: #28a745; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PRESERV3D - PUP Library</h1>
              <p>Visitor Registration System</p>
            </div>
            <div class="content">
              <h2 class="success">✓ Registration Approved</h2>
              <p>Dear ${first_name} ${last_name},</p>
              <p>We are pleased to inform you that your visitor registration for the <strong>PRESERV3D - PUP Library</strong> has been <strong>APPROVED</strong> by ${adminName || 'the administrator'}.</p>

              <div class="details">
                <h3>Account Details</h3>
                <p><strong>Access Period:</strong> ${formatDate(start_date)} to ${formatDate(end_date)}</p>
                <p><strong>Institution:</strong> ${institution || 'N/A'}</p>
                <p><strong>Purpose:</strong> ${purpose || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="success">Approved</span></p>
              </div>

              <h3>Next Steps:</h3>
              <ol>
                <li>Check your inbox for a separate <strong>account verification email</strong> from Supabase</li>
                <li>Click the verification link to confirm your email address</li>
                <li>Set a secure password for your account</li>
                <li>Log in to access the PRESERV3D - PUP Library</li>
              </ol>

              <p><em>Note: Please check your spam/junk folder if you don't see the verification email within a few minutes.</em></p>

              <p>If you have any questions or need assistance, please contact the library administration.</p>
            </div>
            <div class="footer">
              <p>PRESERV3D - PUP Library Team<br>
              Polytechnic University of the Philippines<br>
              <em>This is an automated message. Please do not reply to this email.</em></p>
            </div>
          </div>
        </body>
        </html>
      `

      textContent = `
PRESERV3D - PUP Library: Account Approved

Dear ${first_name} ${last_name},

We are pleased to inform you that your visitor registration for the PRESERV3D - PUP Library has been APPROVED by ${adminName || 'the administrator'}.

Account Details:
- Access Period: ${formatDate(start_date)} to ${formatDate(end_date)}
- Institution: ${institution || 'N/A'}
- Purpose: ${purpose || 'N/A'}
- Status: Approved

Next Steps:
1. Check your inbox for a separate account verification email from Supabase
2. Click the verification link to confirm your email address
3. Set a secure password for your account
4. Log in to access the PRESERV3D - PUP Library

Note: Please check your spam/junk folder if you don't see the verification email within a few minutes.

If you have any questions or need assistance, please contact the library administration.

Best regards,
PRESERV3D - PUP Library Team
Polytechnic University of the Philippines

---
This is an automated message. Please do not reply to this email.
      `.trim()
    } else if (status === 'Rejected') {
      subject = 'PRESERV3D - PUP Library: Registration Update'

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #800000; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .info { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #dc3545; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PRESERV3D - PUP Library</h1>
              <p>Visitor Registration System</p>
            </div>
            <div class="content">
              <h2>Registration Status Update</h2>
              <p>Dear ${first_name} ${last_name},</p>
              <p>Thank you for your interest in accessing the PRESERV3D - PUP Library.</p>

              <div class="info">
                <p>After reviewing your registration request, we regret to inform you that your application has not been approved at this time.</p>
              </div>

              <p>If you believe this is an error or would like to discuss your application, please contact the library administration for further assistance.</p>

              <p>You may submit a new registration request with additional information if needed.</p>

              <p>Thank you for your understanding.</p>
            </div>
            <div class="footer">
              <p>PRESERV3D - PUP Library Team<br>
              Polytechnic University of the Philippines<br>
              <em>This is an automated message. Please do not reply to this email.</em></p>
            </div>
          </div>
        </body>
        </html>
      `

      textContent = `
PRESERV3D - PUP Library - Registration Update

Dear ${first_name} ${last_name},

Thank you for your interest in accessing the PRESERV3D - PUP Library.

After reviewing your registration request, we regret to inform you that your application has not been approved at this time.

If you believe this is an error or would like to discuss your application, please contact the library administration for further assistance.

You may submit a new registration request with additional information if needed.

Thank you for your understanding.

Best regards,
PRESERV3D - PUP Library Team
Polytechnic University of the Philippines

---
This is an automated message. Please do not reply to this email.
      `.trim()
    }

    // Send email using Gmail SMTP with raw socket connection
    if (!GMAIL_APP_PASSWORD) {
      console.error('Gmail app password not configured')
      return new Response(
        JSON.stringify({
          error: 'Email service not configured. Please set GMAIL_APP_PASSWORD secret.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    try {
      console.log(`Attempting to send email to ${email} via Gmail SMTP...`)

      // Connect to Gmail SMTP server
      const conn = await Deno.connect({
        hostname: 'smtp.gmail.com',
        port: 587,
      })
      console.log('Connected to smtp.gmail.com:587')

      // Helper to read response
      const readResponse = async () => {
        const buffer = new Uint8Array(2048)
        const n = await conn.read(buffer)
        if (n === null) return ''
        const response = new TextDecoder().decode(buffer.subarray(0, n))
        console.log('< ' + response.trim())
        return response
      }

      // Helper to send command
      const sendCommand = async (command: string, hideInLog = false) => {
        console.log('> ' + (hideInLog ? '[HIDDEN]' : command))
        await conn.write(new TextEncoder().encode(command + '\r\n'))
        return await readResponse()
      }

      // SMTP conversation
      const greeting = await readResponse()
      if (!greeting.includes('220')) {
        throw new Error('Invalid SMTP greeting: ' + greeting)
      }

      let resp = await sendCommand('EHLO localhost')
      resp = await sendCommand('STARTTLS')

      if (!resp.includes('220')) {
        throw new Error('STARTTLS failed: ' + resp)
      }

      // Upgrade to TLS
      console.log('Upgrading to TLS...')
      const tlsConn = await Deno.startTls(conn, { hostname: 'smtp.gmail.com' })
      console.log('TLS connection established')

      const tlsReadResponse = async () => {
        const buffer = new Uint8Array(2048)
        const n = await tlsConn.read(buffer)
        if (n === null) return ''
        const response = new TextDecoder().decode(buffer.subarray(0, n))
        console.log('< ' + response.trim())
        return response
      }

      const tlsSendCommand = async (command: string, hideInLog = false) => {
        console.log('> ' + (hideInLog ? '[HIDDEN]' : command))
        await tlsConn.write(new TextEncoder().encode(command + '\r\n'))
        return await tlsReadResponse()
      }

      resp = await tlsSendCommand('EHLO localhost')
      resp = await tlsSendCommand('AUTH LOGIN')
      resp = await tlsSendCommand(btoa(GMAIL_USER), true)
      resp = await tlsSendCommand(btoa(GMAIL_APP_PASSWORD), true)

      if (!resp.includes('235')) {
        throw new Error('Authentication failed: ' + resp)
      }
      console.log('✓ Authentication successful')

      resp = await tlsSendCommand(`MAIL FROM:<${GMAIL_USER}>`)
      if (!resp.includes('250')) {
        throw new Error('MAIL FROM failed: ' + resp)
      }

      resp = await tlsSendCommand(`RCPT TO:<${email}>`)
      if (!resp.includes('250')) {
        throw new Error('RCPT TO failed: ' + resp)
      }

      resp = await tlsSendCommand('DATA')
      if (!resp.includes('354')) {
        throw new Error('DATA command failed: ' + resp)
      }

      // Build email message
      const boundary = '----=_Part_0_' + Date.now()
      const emailMessage = [
        `From: PRESERV3D - PUP Library <${GMAIL_USER}>`,
        `To: ${email}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        textContent,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        htmlContent,
        '',
        `--${boundary}--`,
      ].join('\r\n')

      // Send email body followed by end of data marker
      await tlsConn.write(new TextEncoder().encode(emailMessage + '\r\n.\r\n'))
      resp = await tlsReadResponse()

      if (!resp.includes('250')) {
        throw new Error('Email send failed: ' + resp)
      }
      console.log('✓ Email content sent successfully')

      await tlsSendCommand('QUIT')
      tlsConn.close()

      console.log(`✓✓✓ Email sent successfully to ${email} ✓✓✓`)

      // Update last email time for rate limiting
      lastEmailTime = Date.now()
    } catch (smtpError) {
      console.error('Gmail SMTP error:', smtpError)
      return new Response(
        JSON.stringify({
          error: 'Failed to send email via Gmail SMTP',
          details: smtpError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Log the email sent (optional - you can store this in a table)
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
      const emailId = `gmail-${Date.now()}-${Math.random().toString(36).substring(7)}`

      const { error: logError } = await supabase.from('email_logs').insert({
        recipient: email,
        subject: subject,
        status: status,
        sent_at: new Date().toISOString(),
        email_id: emailId,
      })

      if (logError) {
        console.log('Email log insert failed (table may not exist):', logError.message)
      }
    } catch (logErr) {
      console.log('Email logging error (non-critical):', logErr)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${status} email sent successfully to ${email} via Gmail SMTP`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in send-visitor-email function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
