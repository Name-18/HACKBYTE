// workAuthRoutes.js - WorkExperience Auth API Routes
import express from 'express'
import {
  startVerification,
  getVerificationStatus,
  handleVerification,
  getAllRecords,
  getVerifiedRecords,
  checkVerification,
} from '../controllers/workAuthController.js'

const router = express.Router()

// POST /api/work-auth/start - Start verification flow
router.post('/start', startVerification)

// GET /api/work-auth/status - Get verification status
router.get('/status', getVerificationStatus)

// GET /api/work-auth/verify - Handle email verification link
router.get('/verify', handleVerification)

// GET /api/work-auth/records - Get all in-memory records (admin)
router.get('/records', getAllRecords)

// GET /api/work-auth/verified - Get all authenticated records from MongoDB
router.get('/verified', getVerifiedRecords)

// GET /api/work-auth/check-verification?resumeId=xxx - Check verification status
router.get('/check-verification', checkVerification)

export default router
