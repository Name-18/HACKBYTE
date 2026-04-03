# 🧠 TrustHire – Real-Time AI Hiring Intelligence Platform

A full-stack web application that verifies whether candidates are genuinely skilled or exaggerating by analyzing their resume and comparing it with real-world signals like GitHub activity.

## 🎯 Core Features

- **AI-Powered Resume Analysis** using Gemini API
- **GitHub Profile Integration** for real-world skill verification
- **TrustScore Engine** - Multi-dimensional scoring system
- **Timeline Validation** - Detect employment history inconsistencies
- **Real-Time Sync** - SpacetimeDB integration for live dashboard updates
- **Explainable AI** - Clear reasoning behind trust scores
- **Red Flag Detection** - Identify potential fraud signals

## 🏗️ Architecture

### Frontend (Client)
- **Framework**: React with Vite
- **UI**: TailwindCSS + ShadCN UI components
- **State**: React hooks with Axios for API calls
- **Pages**: Home (Analysis), Dashboard (Results), Candidate Profile

### Backend (Server)
- **Framework**: Node.js + Express
- **AI Engine**: Gemini API for intelligent analysis
- **External APIs**: GitHub API for profile data
- **Real-Time**: SpacetimeDB for data persistence
- **File Parsing**: PDF + TXT resume support

## 📋 Project Structure

```
root/
├── client/                    (React Frontend)
│   ├── src/
│   │   ├── components/       (Reusable UI components)
│   │   │   ├── UploadResume.jsx
│   │   │   ├── TrustScoreCard.jsx
│   │   │   ├── BreakdownBar.jsx
│   │   │   ├── FlagsPanel.jsx
│   │   │   ├── ExplanationPanel.jsx
│   │   │   ├── CandidateCard.jsx
│   │   │   └── ui/
│   │   │       └── Badge.jsx
│   │   ├── pages/            (Page components)
│   │   │   ├── Home.jsx      (Analysis page)
│   │   │   ├── Dashboard.jsx (Results listing)
│   │   │   └── CandidateProfile.jsx (Individual candidate)
│   │   ├── services/
│   │   │   └── api.js        (API client wrapper)
│   │   ├── App.jsx           (Router & layout)
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── package.json
│   └── .env.example
│
├── server/                   (Node.js + Express Backend)
│   ├── controllers/
│   │   ├── resumeController.js    (Resume upload/parsing)
│   │   ├── githubController.js    (GitHub data fetching)
│   │   └── trustController.js     (Trust analysis & scoring)
│   ├── services/
│   │   ├── trustEngine.js         (Core scoring engine)
│   │   ├── geminiService.js       (Gemini API integration)
│   │   ├── githubService.js       (GitHub API integration)
│   │   ├── parserService.js       (Resume file parsing)
│   │   └── timelineChecker.js     (Employment timeline validation)
│   ├── routes/
│   │   └── trustRoutes.js         (API endpoint definitions)
│   ├── spacetime/
│   │   └── spacetimeClient.js     (Real-time DB integration)
│   ├── app.js                     (Express server setup)
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- GitHub Personal Access Token (for API access)
- Gemini API Key

### Environment Setup

1. **Clone and Setup**
```bash
cd client
npm install

cd ../server
npm install
```

2. **Configure Environment Variables**

**Client (.env)**
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_TITLE=TrustHire
```

**Server (.env)**
```
PORT=5000
NODE_ENV=development

# Gemini API
GEMINI_API_KEY=your_gemini_key_here

# GitHub API
GITHUB_TOKEN=your_github_token_here

# SpacetimeDB
SPACETIME_URI=http://localhost:8000
SPACETIME_TOKEN=your_spacetime_token_here

# CORS
CLIENT_URL=http://localhost:5173
```

### Running the Application

**Terminal 1 - Start Backend**
```bash
cd server
npm run dev
```

The server will start on `http://localhost:5000`

**Terminal 2 - Start Frontend**
```bash
cd client
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🧠 TrustScore Engine Explained

### Scoring Pipeline

1. **Resume Parsing**
   - Extract skills, projects, experience, education
   - Parse and clean text data

2. **GitHub Data Collection**
   - Fetch public profile, repos, languages
   - Analyze contribution patterns
   - Calculate activity metrics

3. **AI-Powered Comparison** (Gemini)
   - Compare claimed skills vs GitHub profile
   - Detect inconsistencies and red flags
   - Generate reasoning and assessment

4. **Timeline Validation**
   - Check for overlapping employment
   - Detect suspicious gaps
   - Validate against GitHub account creation

5. **Score Calculation**
   - Skills Score: 35% weight
   - Projects Score: 35% weight
   - Experience Score: 20% weight
   - Timeline Score: 10% weight

### Verdicts

- **Trusted** (75+): Candidate appears genuine and consistent
- **Suspicious** (50-74): Some inconsistencies detected
- **High Risk** (<50): Multiple red flags present

## 📊 API Endpoints

### Resume & Analysis
- `POST /api/trust/upload-resume` - Upload and parse resume
- `POST /api/trust/analyze` - Run TrustScore analysis
- `GET /api/trust/candidates` - Get all analyzed candidates
- `GET /api/trust/candidates/:id` - Get candidate details

### GitHub
- `GET /api/trust/github?username=<username>` - Fetch GitHub data

### Health
- `GET /api/health` - Server health check

## 🔍 Example Usage

### 1. Upload Resume & Analyze
```javascript
const formData = new FormData()
formData.append('resume', resumeFile)

const result = await fetch('/api/trust/upload-resume', {
  method: 'POST',
  body: formData,
})

// Then analyze
await fetch('/api/trust/analyze', {
  method: 'POST',
  body: JSON.stringify({
    resumeText: result.data.text,
    githubUsername: 'torvalds'
  })
})
```

### 2. View Dashboard
Navigate to `/dashboard` to see all analyzed candidates with real-time updates.

### 3. Inspect Individual Profile
Click on any candidate card to view detailed analysis, breakdown scores, and red flags.

## 🔧 Key Technologies

### Frontend
- React 18 with Hooks
- Vite for fast development
- TailwindCSS for styling
- React Router for navigation
- Axios for HTTP requests
- Lucide React icons

### Backend
- Express.js server
- Gemini API (generative AI)
- GitHub API (profile data)
- pdf-parse (PDF handling)
- SpacetimeDB (real-time sync)
- Multer (file uploads)

## 🎨 UI Components

### UploadResume
- File drag-and-drop
- GitHub username input
- Form validation

### TrustScoreCard
- Large score display
- Color-coded verdict
- Quick summary text

### BreakdownBar
- Skill verification score
- Project portfolio score
- Experience consistency score

### FlagsPanel
- Red flag listing
- Risk indicators
- Detailed explanations

### CandidateCard
- Quick candidate overview
- Score badge
- Preview of findings

## 📈 Demo Scenarios

### Scenario 1: Genuine Candidate
- Consistent skills across resume and GitHub
- Active contribution history
- Align timeline
- **Expected**: Trusted (80+)

### Scenario 2: Exaggerator
- Claims 10+ years experience but GitHub created 2 years ago
- Lists skills with no GitHub projects in those languages
- Large employment gaps
- **Expected**: High Risk (30-40)

### Scenario 3: Questionable Profile
- Some skills verified, some not
- Moderate activity
- Potential timeline inconsistencies
- **Expected**: Suspicious (50-70)

## 🚦 Development Tips

### Adding New Features
1. Frontend: Add new component in `client/src/components/`
2. Backend: Add new service in `server/services/`
3. Wire endpoints in `server/routes/trustRoutes.js`
4. Update API client in `client/src/services/api.js`

### Debugging
- Frontend: Use React DevTools browser extension
- Backend: Check console logs and use `NODE_ENV=development`
- API: Test endpoints with curl or Postman

### Performance
- Caching: Implement Redis for GitHub API responses
- Pagination: Add pagination for candidate dashboard
- Lazy loading: Implement code splitting for components

## 🔐 Security Considerations

- Validate all file uploads (type, size)
- Rate limit API endpoints
- Store sensitive keys in .env
- Validate GitHub usernames
- Sanitize resume text input
- Use CORS appropriately

## 📝 Future Enhancements

- [ ] Advanced ML-based resume parsing
- [ ] LinkedIn profile integration
- [ ] Interview scheduling system
- [ ] Bulk candidate analysis
- [ ] Export reports (PDF/CSV)
- [ ] Admin dashboard
- [ ] Real-time notifications
- [ ] Advanced filtering and sorting

## 🤝 Contributing

Pull requests welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a PR with description

## 📄 License

MIT License - feel free to use this project

## 💬 Support

For issues or questions:
1. Check the logs
2. Verify API keys are set
3. Ensure backend is running
4. Review CORS settings

---

**Built with ❤️ for honest hiring**

🚀 Power your hiring decisions with AI-backed trust scores!