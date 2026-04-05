// twilioDemoService.js - Simple Twilio Demo Call Service
// Skip ElevenLabs, just make a demo call with TwiML

import twilio from 'twilio'

const logger = {
  info: (msg) => console.log(`📞 ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
}

// ========== CONFIGURATION ==========
const TWILIO_SID = process.env.TWILIO_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE = process.env.TWILIO_PHONE

// Initialize Twilio
const twilioClient = TWILIO_SID
  ? twilio(TWILIO_SID, TWILIO_AUTH_TOKEN)
  : null

export const twilioDemoService = {
  // ========== MAKE DEMO CALL ==========
  makeDemoCall: async (pocPhone, candidateName, organizationName) => {
    try {
      if (!twilioClient) {
        logger.error('Twilio not configured')
        return { status: 'failed', reason: 'Twilio not configured' }
      }

      if (!TWILIO_PHONE) {
        logger.error('TWILIO_PHONE not set in environment')
        return { status: 'failed', reason: 'TWILIO_PHONE not configured' }
      }

      logger.info(`Making demo call to: ${pocPhone}`)

      // Create TwiML for demo call
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hi, this is a demo call from TrustHire.</Say>
    <Say voice="alice">We are verifying the work experience of ${candidateName} at ${organizationName}.</Say>
    <Say voice="alice">Please check your email for verification link.</Say>
    <Say voice="alice">Thank you for your time.</Say>
    <Pause length="2"/>
    <Say voice="alice">Goodbye.</Say>
</Response>`

      const call = await twilioClient.calls.create({
        from: TWILIO_PHONE,
        to: pocPhone,
        twiml: twiml,
      })

      logger.info(`✅ Demo call initiated: ${call.sid}`)

      return {
        status: 'pending',
        callSid: call.sid,
        message: 'Demo call initiated successfully',
      }
    } catch (error) {
      logger.error(`Demo call failed: ${error.message}`)
      return { status: 'failed', reason: error.message }
    }
  },

  // ========== GET CALL STATUS ==========
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

  // ========== CHECK TWILIO CONFIGURATION ==========
  checkConfig: () => {
    return {
      hasSid: !!TWILIO_SID,
      hasToken: !!TWILIO_AUTH_TOKEN,
      hasPhone: !!TWILIO_PHONE,
      isConfigured: !!(TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE),
    }
  },
}

export default twilioDemoService
