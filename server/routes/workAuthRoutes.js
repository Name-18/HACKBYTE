// workAuthRoutes.js - WorkExperience Auth API Routes
import express from 'express'
import {
  startVerification,
  getVerificationStatus,
  handleVerification,
  getAllRecords,
} from '../controllers/workAuthController.js'

const router = express.Router()

// POST /api/work-auth/start - Start verification flow
router.post('/start', startVerification)

// GET /api/work-auth/status - Get verification status
router.get('/status', getVerificationStatus)

// GET /api/work-auth/verify - Handle email verification link
router.get('/verify', handleVerification)

// GET /api/work-auth/records - Get all records (admin)
router.get('/records', getAllRecords)

export default router
