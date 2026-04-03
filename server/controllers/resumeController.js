// resumeController.js - Handle resume upload and parsing
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parserService } from '../services/parserService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '../uploads/')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadsDir, { recursive: true })
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    // Keep original filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (['.pdf', '.txt'].includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF and TXT files are allowed'))
    }
  }
})

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    console.log('📄 File received:', {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      path: req.file.path,
      size: req.file.size
    })

    const resumeText = await parserService.parseResume(req.file.path)
    
    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ error: 'Resume file is empty' })
    }

    const contactInfo = parserService.extractContactInfo(resumeText)
    const sections = parserService.extractSections(resumeText)

    res.json({
      success: true,
      data: {
        text: resumeText,
        contactInfo,
        sections,
      },
    })
  } catch (error) {
    console.error('❌ Resume upload error:', error.message)
    res.status(400).json({ error: error.message })
  }
}

export const resumeUploadMiddleware = upload.single('resume')
