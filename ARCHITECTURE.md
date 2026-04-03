# TrustHire Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                            │
│                    http://localhost:5173                         │
├─────────────────────────────────────────────────────────────────┤
│  Pages:                Components:                               │
│  • Home              • UploadResume                             │
│  • Dashboard         • TrustScoreCard                           │
│  • CandidateProfile  • BreakdownBar                             │
│                      • FlagsPanel                               │
│                      • ExplanationPanel                         │
│                      • CandidateCard                            │
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTP/REST API
               │ (Axios)
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVER (Node.js + Express)                     │
│                    http://localhost:5000                         │
├─────────────────────────────────────────────────────────────────┤
│ Routes: /api/trust/*                                            │
│                                                                 │
│ Controllers:                                                    │
│ ├─ resumeController.js    (File parsing)                       │
│ ├─ githubController.js    (GitHub API)                         │
│ └─ trustController.js     (Analysis + Storage)                 │
│                                                                 │
│ Services:                                                       │
│ ├─ trustEngine.js         (Core scoring logic)                 │
│ ├─ geminiService.js       (AI analysis)                        │
│ ├─ githubService.js       (GitHub API client)                  │
│ ├─ parserService.js       (Resume parsing)                     │
│ └─ timelineChecker.js     (Timeline validation)                │
│                                                                 │
│ Real-Time:                                                      │
│ └─ spacetimeClient.js     (Data persistence & sync)            │
└──────────────┬────────────────┬──────────────┬──────────────────┘
               │                │              │
          (PDF/TXT)        (HTTP API)    (Cache/Storage)
               │                │              │
               ▼                ▼              ▼
        ┌─────────┐      ┌─────────┐    ┌──────────────┐
        │ Multer  │      │ GitHub  │    │ SpacetimeDB  │
        │ Parser  │      │ API     │    │ (Real-time)  │
        └─────────┘      └─────────┘    └──────────────┘
                              │
                              ▼
                         ┌─────────┐
                         │ Gemini  │
                         │ API     │
                         │ (AI)    │
                         └─────────┘
```

## Data Flow

### 1. Resume Upload & Analysis

```
User Upload Resume
    ↓
Frontend: UploadResume Component
    ↓
API: POST /api/trust/upload-resume
    ↓
Backend: resumeController.uploadResume()
    ↓
parserService.parseResume() → PDF/TXT parsing
    ↓
Store: resumeText, contactInfo, sections
    ↓
API: POST /api/trust/analyze
    ↓
trustController.analyzeCandidateProfile()
    ↓
trustEngine.analyzeCandidateProfile()
    ├─ extractResumeInfo()
    ├─ githubService.fetchUserData() → GitHub API
    ├─ geminiService.analyzeCandidate() → Gemini AI
    ├─ timelineChecker.validateTimeline()
    ├─ calculateScores()
    ├─ determineVerdict()
    └─ generateExplanation()
    ↓
spacetimeClient.storeCandidateAnalysis()
    ↓
Return: TrustScore Result
    ↓
Frontend: Display TrustScoreCard + Breakdown + Flags
```

### 2. Candidate Lookup

```
Dashboard Page Load
    ↓
API: GET /api/trust/candidates
    ↓
trustController.getAllCandidates()
    ↓
spacetimeClient.getCandidates()
    ↓
Return: [candidate1, candidate2, ...]
    ↓
Frontend: Render CandidateCard List
    ↓
User Click Card
    ↓
Navigate to /candidate/:id
    ↓
API: GET /api/trust/candidates/:id
    ↓
CandidateProfile Page Loads Result
```

## Component Hierarchy

```
App.jsx (Router)
├── Home (/)
│   ├── UploadResume
│   └── Results View
│       ├── TrustScoreCard
│       ├── BreakdownBar (3x)
│       ├── FlagsPanel
│       └── ExplanationPanel
│
├── Dashboard (/dashboard)
│   └── CandidateCard[] (repeated)
│
└── CandidateProfile (/candidate/:id)
    ├── TrustScoreCard
    ├── BreakdownBar (3x)
    ├── FlagsPanel
    └── ExplanationPanel
```

## State Management

### Frontend (React Hooks)
```javascript
// Home.jsx
const [result, setResult] = useState(null)
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState(null)

// Dashboard.jsx
const [candidates, setCandidates] = useState([])
const [isLoading, setIsLoading] = useState(true)

// CandidateProfile.jsx - useParams() + useEffect() for fetching
```

### Backend (SpacetimeDB)
```javascript
// In-memory storage (can be replaced with real DB)
this.candidates = new Map()
// Key: candidateId
// Value: { id, timestamp, trustScore, verdict, breakdown, flags, explanation }
```

## TrustScore Calculation Formula

```
TrustScore = (Skills_Score × 0.35) + 
             (Projects_Score × 0.35) + 
             (Experience_Score × 0.20) + 
             (Timeline_Score × 0.10)

Skills_Score:
  = BASE_70
  + (verified_skills × 5)
  - consistency_penalty
  - unverified_penalty

Projects_Score:
  = BASE_60
  + (public_repos × 3)
  + stars_bonus
  - consistency_penalty

Experience_Score:
  = BASE_65
  + years_active_bonus
  + contributions_bonus
  - consistency_penalty

Timeline_Score:
  = 100 - (gaps × 5) - (overlaps × 20)
```

## Database Schema (SpacetimeDB)

```sql
-- Candidates Table
CREATE TABLE candidates (
  id VARCHAR PRIMARY KEY,
  username VARCHAR,
  trustScore INT,
  verdict VARCHAR,           -- "Trusted", "Suspicious", "High Risk"
  breakdown JSON,            -- {skills, projects, experience}
  flags ARRAY<VARCHAR>,
  explanation TEXT,
  rawAnalysis JSON,
  timestamp TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
)

-- Indexes
CREATE INDEX idx_candidates_username ON candidates(username)
CREATE INDEX idx_candidates_timestamp ON candidates(timestamp)
CREATE INDEX idx_candidates_verdict ON candidates(verdict)
```

## API Contract Examples

### TrustScore Response
```json
{
  "trustScore": 82,                    // 0-100
  "verdict": "Trusted",                // "Trusted", "Suspicious", "High Risk"
  "breakdown": {
    "skills": 85,                      // 0-100
    "projects": 80,                    // 0-100
    "experience": 78                   // 0-100
  },
  "flags": [
    "New GitHub account",
    "Skills unverified"                // Red flags
  ],
  "explanation": "Multi-line text...",
  "rawAnalysis": {
    "skillsConsistency": "high",
    "projectsConsistency": "high",
    "suspicionFlags": [],
    "reasoning": "AI analysis reasoning..."
  }
}
```

## Error Handling

### Frontend
```javascript
try {
  const analysis = await trustAPI.analyze(...)
  setResult(analysis)
} catch (error) {
  setError(error.message)
  // Show error UI
}
```

### Backend
```javascript
try {
  const result = await trustEngine.analyzeCandidateProfile(...)
  res.json({ success: true, data: result })
} catch (error) {
  logger.error('Analysis failed', { error })
  res.status(500).json({ error: error.message })
}
```

## Caching Strategy

### GitHub API
- Cache for 1 hour
- Key: `github:${username}`
- Reduces API calls and rate limiting

### Analysis Results
- Cache for 2 hours
- Key: `analysis:${resumeHash}:${username}`
- Retrieved from SpacetimeDB

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ Input Validation                                         │
│ ├─ File type/size checks                               │
│ ├─ Username validation                                 │
│ └─ Resume text sanitization                            │
├─────────────────────────────────────────────────────────┤
│ API Security                                             │
│ ├─ CORS configuration                                  │
│ ├─ Rate limiting (planned)                             │
│ └─ Request timeouts                                    │
├─────────────────────────────────────────────────────────┤
│ Data Protection                                          │
│ ├─ Environment variables for secrets                   │
│ ├─ API key protection                                  │
│ └─ HTTPS in production                                 │
└─────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Current Limitations
- Single server instance
- In-memory candidates storage
- No session management
- No authentication

### Future Improvements
```
Load Balancer
    ↓
  ┌─────────────────────────┐
  │  Multiple API Instances │
  │  (Horizontal Scaling)   │
  └──────────┬──────────────┘
             ↓
  ┌──────────────────────┐
  │  Redis Cache Layer   │
  │  (GitHub data cache) │
  └──────────┬───────────┘
             ↓
  ┌──────────────────────┐
  │  Database Cluster    │
  │  (SpacetimeDB)       │
  └──────────────────────┘
```

## Deployment Architecture

### Development
```
Localhost:
  Frontend: http://localhost:5173
  Backend:  http://localhost:5000
```

### Production (Recommended)
```
Frontend:
  ├─ Provider: Vercel
  ├─ CDN: CloudFlare
  └─ Domain: trusthire.app

Backend:
  ├─ Provider: Railway or Render
  ├─ Database: SpacetimeDB Cloud
  ├─ Cache: Redis Cloud
  └─ Logging: Datadog/Sentry
```

## Performance Metrics

### Frontend Targets
- Initial Load: < 3s
- Analysis Display: < 500ms
- Dashboard Load: < 2s

### Backend Targets
- Resume Parse: < 2s
- GitHub Fetch: < 1s (with cache: < 100ms)
- AI Analysis: < 5s
- End-to-End: < 15s

---

See [README.md](./README.md) for more information.
