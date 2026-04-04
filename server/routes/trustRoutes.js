// trustRoutes.js - Route definitions for trust analysis
import express from 'express'
import {
  analyzeCandidateProfile,
  getAllCandidates,
  getCandidateById,
  getAvailableSkills,
} from '../controllers/trustController.js'
import {
  uploadResume,
  resumeUploadMiddleware,
} from '../controllers/resumeController.js'
import { getGitHubData, reviewRandomRepositoryCode } from '../controllers/githubController.js'

const router = express.Router()

// Resume endpoints
router.post('/upload-resume', resumeUploadMiddleware, uploadResume)

// GitHub endpoints
router.get('/github', getGitHubData)
router.get('/review-random-repo', reviewRandomRepositoryCode)

// Skills endpoints
router.get('/available-skills', getAvailableSkills)

// Trust analysis endpoints
router.post('/analyze', analyzeCandidateProfile)
router.get('/candidates', getAllCandidates)
router.get('/candidates/:id', getCandidateById)

export default router
