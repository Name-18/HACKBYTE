// workAuthService.js - WorkExperience Auth Business Logic
// Integrates: Twilio (calls), ElevenLabs (voice), Nodemailer (email)

import twilio from 'twilio'
import nodemailer from 'nodemailer'

const logger = {
  info: (msg) => console.log(`📞 ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
}

// ========== CONFIGURATION ==========

const TWILIO_SID = process.env.TWILIO_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE = process.env.TWILIO_PHONE
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS

// Debug logging for SMS
console.log('🔍 SMS Configuration Debug:')
console.log('TWILIO_PHONE being used:', TWILIO_PHONE)

// Initialize Twilio
const twilioClient = TWILIO_SID
  ? twilio(TWILIO_SID, TWILIO_AUTH_TOKEN)
  : null

// Initialize Nodemailer
const emailTransporter = EMAIL_USER
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    })
  : null

export const workAuthService = {
  // ========== STEP 1: Generate Voice with ElevenLabs ==========
  generateVoiceMessage: async (pocEmail) => {
    try {
      if (!ELEVENLABS_API_KEY) {
        logger.error('ElevenLabs API key not configured')
        return null
      }

      // Spell out email character by character
      const emailSpelled = pocEmail.split('').join(' ')
      const voiceText = `Hi, we are from TrustHire. A verification email has been sent to you at ${emailSpelled}. Kindly respond as soon as possible. Thank you.`

      logger.info(`Generating voice message for: ${pocEmail}`)

      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: voiceText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`)
      }

      const audioBuffer = await response.arrayBuffer()
      logger.info('✅ Voice message generated successfully')
      return audioBuffer
    } catch (error) {
      logger.error(`Voice generation failed: ${error.message}`)
      return null
    }
  },

  // ========== STEP 2: Send SMS with Twilio (Skip ElevenLabs) ==========
  makeVerificationCall: async (pocPhone, candidateName, organizationName) => {
    try {
      if (!twilioClient) {
        logger.error('Twilio not configured')
        return { status: 'failed', reason: 'Twilio not configured' }
      }

      if (!TWILIO_PHONE) {
        logger.error('TWILIO_PHONE not set in environment')
        return { status: 'failed', reason: 'TWILIO_PHONE not configured' }
      }

      logger.info(`Sending verification SMS to: ${pocPhone}`)

      // Create SMS message
      const smsMessage = `Hi, this is TrustHire. We are verifying the work experience of ${candidateName} at ${organizationName}. Please check your email for verification link. Thank you.`

      const message = await twilioClient.messages.create({
        body: smsMessage,
        from: TWILIO_PHONE,
        to: pocPhone,
      })

      logger.info(`✅ Verification SMS sent: ${message.sid}`)

      return {
        status: 'pending',
        callSid: message.sid, // Keep as callSid for compatibility
        message: 'Verification SMS sent',
      }
    } catch (error) {
      logger.error(`SMS failed: ${error.message}`)
      return { status: 'failed', reason: error.message }
    }
  },

  // ========== STEP 3: Send Email with Nodemailer ==========
  sendVerificationEmail: async (
    pocEmail,
    candidateName,
    organizationName,
    verificationId
  ) => {
    try {
      if (!emailTransporter) {
        logger.error('Email not configured')
        return { status: 'failed', reason: 'Email not configured' }
      }

      const verifyYesLink = `http://localhost:5000/api/work-auth/verify?status=yes&id=${verificationId}`
      const verifyNoLink = `http://localhost:5000/api/work-auth/verify?status=no&id=${verificationId}`

      const mailOptions = {
        from: EMAIL_USER,
        to: pocEmail,
        subject: 'Work Experience Verification - TrustHire',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Work Experience Verification</h2>
            <p>Hi,</p>
            <p>We are from <strong>TrustHire</strong>.</p>
            <p>We want to verify the work experience of <strong>${candidateName}</strong> at <strong>${organizationName}</strong>.</p>
            <p><strong>Please confirm:</strong></p>
            <div style="margin: 20px 0;">
              <a href="${verifyYesLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px;">✓ YES</a>
              <a href="${verifyNoLink}" style="display: inline-block; background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">✗ NO</a>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">This link expires in 24 hours.</p>
            <p style="color: #999; font-size: 11px;">TrustHire - AI Hiring Intelligence Platform</p>
          </div>
        `,
      }

      logger.info(`Sending verification email to: ${pocEmail}`)

      const result = await emailTransporter.sendMail(mailOptions)
      logger.info(`✅ Email sent: ${result.messageId}`)

      return {
        status: 'pending',
        messageId: result.messageId,
        message: 'Verification email sent',
      }
    } catch (error) {
      logger.error(`Email failed: ${error.message}`)
      return { status: 'failed', reason: error.message }
    }
  },

  // ========== Get Call Status ==========
  getCallStatus: async (callSid) => {
    try {
      if (!twilioClient) return null

      const call = await twilioClient.calls(callSid).fetch()
      logger.info(`Call status for ${callSid}: ${call.status}`)

      return {
        sid: call.sid,
        status: call.status, // queued, ringing, in-progress, completed, failed, busy, no-answer
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
      }
    } catch (error) {
      logger.error(`Failed to get call status: ${error.message}`)
      return null
    }
  },
}

export default workAuthService
