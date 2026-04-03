// server/config/constants.js - Server constants

export const TRUST_SCORE_WEIGHTS = {
  SKILLS: 0.35,
  PROJECTS: 0.35,
  EXPERIENCE: 0.20,
  TIMELINE: 0.10,
}

export const VERDICT_RULES = {
  TRUSTED: {
    minScore: 75,
    maxFlags: 1,
    description: 'Candidate appears genuine and consistent',
  },
  SUSPICIOUS: {
    minScore: 50,
    maxFlags: 3,
    description: 'Some inconsistencies detected - verify before proceeding',
  },
  HIGH_RISK: {
    minScore: 0,
    maxFlags: Infinity,
    description: 'Multiple red flags - do not proceed without investigation',
  },
}

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['application/pdf', 'text/plain'],
  UPLOAD_DIR: './uploads',
}

export const API_CONFIG = {
  REQUEST_TIMEOUT: 30000,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: 100,
}

export const CACHE_TTL = {
  GITHUB_DATA: 3600, // 1 hour
  ANALYSIS_RESULT: 7200, // 2 hours
}

