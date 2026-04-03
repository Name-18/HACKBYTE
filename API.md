# API DOCUMENTATION - TrustHire

Base URL: `http://localhost:5000/api`

## Authentication
Currently uses no authentication. (Consider adding JWT in production)

## Response Format

All responses follow this format:

```json
{
  "success": boolean,
  "data": {},
  "error": "error message if failed"
}
```

---

## Endpoints

### 1. Upload Resume

**POST** `/trust/upload-resume`

Upload a resume file for parsing.

**Request:**
```
Headers:
  Content-Type: multipart/form-data

Body:
  - resume (file): PDF or TXT file
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "text": "Full resume text...",
    "contactInfo": {
      "email": "john@example.com",
      "phone": "+1234567890",
      "linkedin": "linkedin.com/in/john"
    },
    "sections": {
      "skills": "JavaScript, React, Node.js...",
      "experience": "Senior Developer at TechCorp...",
      "education": "BS Computer Science...",
      "projects": "Built...",
      "certifications": ""
    }
  }
}
```

**Errors:**
- 400: No file uploaded
- 400: Unsupported file format

---

### 2. Analyze Candidate Profile

**POST** `/trust/analyze`

Run comprehensive TrustScore analysis on a candidate.

**Request:**
```json
{
  "resumeText": "Full resume text string",
  "githubUsername": "octocat"  // Optional
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trustScore": 82,
    "verdict": "Trusted",
    "breakdown": {
      "skills": 85,
      "projects": 80,
      "experience": 78
    },
    "flags": [
      "New GitHub account",
      "Some skills unverified"
    ],
    "explanation": "✅ Skills are well-verified...",
    "rawAnalysis": {
      "skillsConsistency": "high",
      "projectsConsistency": "high",
      "experienceConsistency": "medium",
      "suspicionFlags": [],
      "reasoning": "AI analysis text..."
    },
    "timestamp": "2024-04-03T10:30:00Z"
  },
  "storageId": "candidate_123456_1234567890"
}
```

**Errors:**
- 400: Resume text is required
- 500: Analysis failed

---

### 3. Get GitHub Data

**GET** `/trust/github?username=octocat`

Fetch GitHub profile data for a user.

**Query Parameters:**
- `username` (required): GitHub username

**Response (200):**
```json
{
  "success": true,
  "data": {
    "username": "octocat",
    "name": "The Octocat",
    "bio": "Github's mascot",
    "location": "San Francisco",
    "publicRepos": 42,
    "followers": 5000,
    "following": 123,
    "created_at": "2011-01-25T18:44:36Z",
    "updated_at": "2024-04-03T10:00:00Z",
    "languages": ["JavaScript", "Python", "Ruby"],
    "stars": 500,
    "repos": [
      {
        "name": "Hello-World",
        "url": "https://github.com/octocat/Hello-World",
        "description": "My first repository",
        "stars": 80,
        "language": "JavaScript",
        "created_at": "2011-01-26T19:01:12Z",
        "updated_at": "2024-03-15T08:32:12Z"
      }
    ],
    "yearsSinceCreated": 13,
    "contributions": 1500
  }
}
```

**Errors:**
- 400: GitHub username is required
- 500: GitHub API error (returns mock data as backup)

---

### 4. Get All Candidates

**GET** `/trust/candidates`

Retrieve all analyzed candidates for dashboard.

**Query Parameters:**
- `limit` (optional): Results per page (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "candidate_123456_1234567890",
      "timestamp": "2024-04-03T10:30:00Z",
      "trustScore": 82,
      "verdict": "Trusted",
      "breakdown": {
        "skills": 85,
        "projects": 80,
        "experience": 78
      },
      "flags": [],
      "explanation": "..."
    }
  ]
}
```

---

### 5. Get Single Candidate

**GET** `/trust/candidates/:id`

Get detailed analysis for a specific candidate.

**Path Parameters:**
- `id` (required): Candidate analysis ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "candidate_123456_1234567890",
    "timestamp": "2024-04-03T10:30:00Z",
    "trustScore": 82,
    "verdict": "Trusted",
    "breakdown": { ... },
    "flags": [ ... ],
    "explanation": "..."
  }
}
```

**Errors:**
- 404: Candidate not found

---

### 6. Health Check

**GET** `/health`

Server and service status.

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2024-04-03T10:30:00Z",
  "spacetimeConnected": true
}
```

---

## Error Responses

Standard error format:

```json
{
  "success": false,
  "error": "Description of what went wrong",
  "message": "Details (only in development mode)"
}
```

Common HTTP Status Codes:
- 200: Success
- 400: Bad Request (validation error)
- 404: Not Found
- 500: Server Error

---

## Rate Limiting

Currently: No rate limiting (add in production)

Recommended:
- 100 requests per 15 minutes per IP
- 1000 requests per hour per IP

---

## Request Examples

### cURL

**Upload Resume:**
```bash
curl -X POST http://localhost:5000/api/trust/upload-resume \
  -F "resume=@resume.pdf"
```

**Analyze:**
```bash
curl -X POST http://localhost:5000/api/trust/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "Your resume text here",
    "githubUsername": "octocat"
  }'
```

**Get GitHub Data:**
```bash
curl http://localhost:5000/api/trust/github?username=octocat
```

### JavaScript/Fetch

```javascript
// Analyze candidate
const response = await fetch('http://localhost:5000/api/trust/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resumeText: resumeText,
    githubUsername: 'octocat'
  })
})

const result = await response.json()
console.log(result.data)
```

### Python/Requests

```python
import requests

response = requests.post(
    'http://localhost:5000/api/trust/analyze',
    json={
        'resumeText': resume_text,
        'githubUsername': 'octocat'
    }
)

result = response.json()
print(result['data'])
```

---

## WebSocket (Planned)

Real-time updates not yet implemented. Plan is to add WebSocket support for live dashboard updates when SpacetimeDB integration is complete.

---

## Versioning

Current API Version: v1 (no version prefix needed yet)

Future: Versioning will use `/api/v2/...` pattern

---

Last Updated: 2024-04-03
