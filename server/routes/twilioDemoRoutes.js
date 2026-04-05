// twilioDemoRoutes.js - Twilio Demo Routes
import express from 'express'
import { makeDemoCall, getCallStatus, checkTwilioConfig } from '../controllers/twilioDemoController.js'

const router = express.Router()

// Make demo call
router.post('/call', makeDemoCall)

// Get call status
router.get('/status', getCallStatus)

// Check Twilio configuration
router.get('/config', checkTwilioConfig)

export default router
