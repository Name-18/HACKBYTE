# Quick Reference - TrustHire Commands

## Setup & Running

```bash
# First time setup
npm install --prefix client
npm install --prefix server

# Copy environment files
cp client/.env.example client/.env
cp server/.env.example server/.env

# Edit .env files with your API keys
# GEMINI_API_KEY: https://makersuite.google.com/app/apikey
# GITHUB_TOKEN: https://github.com/settings/tokens

# Start backend (Terminal 1)
cd server
npm run dev

# Start frontend (Terminal 2)
cd client
npm run dev

# Visit http://localhost:5173
```

## Project Structure

```
root/
├── client/                  # React Frontend
│   ├── src/
│   │   ├── pages/          # Home, Dashboard, CandidateProfile
│   │   ├── components/     # UI Components
│   │   ├── services/       # api.js - API client
│   │   ├── App.jsx         # Router
│   │   └── index.css       # Tailwind
│   └── package.json
│
├── server/                  # Node.js Backend
│   ├── services/           # trustEngine, geminiService, etc
│   ├── controllers/        # resumeController, etc
│   ├── routes/             # trustRoutes.js
│   ├── spacetime/          # spacetimeClient.js
│   ├── app.js              # Express server
│   └── package.json
│
└── Docs/
    ├── README.md           # Overview
    ├── SETUP_GUIDE.md      # Quick start
    ├── API.md              # Endpoints
    ├── ARCHITECTURE.md     # Design
    ├── CONTRIBUTING.md     # Dev guidelines
    └── DEPLOYMENT.md       # Production
```

## Key Components

### Frontend Pages
- `/` - Upload resume & view results
- `/dashboard` - All analyzed candidates
- `/candidate/:id` - Individual candidate details

### Backend Endpoints
- `POST /api/trust/upload-resume` - Parse resume
- `POST /api/trust/analyze` - Run analysis
- `GET /api/trust/github?username=X` - GitHub data
- `GET /api/trust/candidates` - List all
- `GET /api/trust/candidates/:id` - Get one

## Common Tasks

### Adding a Component
1. Create file in `client/src/components/MyComponent.jsx`
2. Export function component
3. Import in page/parent component
4. Use it

### Adding an API Endpoint
1. Create controller: `server/controllers/myController.js`
2. Add route: in `server/routes/trustRoutes.js`
3. Update client API: `client/src/services/api.js`
4. Call from frontend

### Adding a Service
1. Create file: `server/services/myService.js`
2. Export class or object with methods
3. Import in controller: `import { myService } from '../services/myService.js'`
4. Use methods

### Styling Components
Use TailwindCSS classes (no separate CSS files needed):
```jsx
<div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
</div>
```

## Debug Commands

```bash
# Check setup
node setup-check.js

# Install dependencies
npm install --prefix client
npm install --prefix server

# Frontend errors
# Check: http://localhost:5173 console (F12)

# Backend errors
# Check: Terminal where npm run dev is running

# Test API endpoint
curl http://localhost:5000/api/health

# Test with data
curl -X POST http://localhost:5000/api/trust/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "Your text",
    "githubUsername": "torvalds"
  }'
```

## Environment Variables

**Server .env:**
```
PORT=5000
GEMINI_API_KEY=sk_xxx
GITHUB_TOKEN=ghp_xxx
CLIENT_URL=http://localhost:5173
```

**Client .env:**
```
VITE_API_URL=http://localhost:5000/api
```

## File Types

- `.jsx` - React components (frontend)
- `.js` - JavaScript files (both frontend and backend)
- `.css` - Stylesheets (frontend only - use Tailwind instead)
- `.json` - Configuration files

## Important Directories

- `client/src/components/` - React components
- `server/services/` - Business logic
- `server/controllers/` - Request handlers
- `server/routes/` - API route definitions

## Key Files to Know

- `server/services/trustEngine.js` - Core scoring logic
- `server/services/geminiService.js` - AI integration
- `client/src/App.jsx` - Frontend routing
- `server/app.js` - Server setup
- `server/routes/trustRoutes.js` - API endpoints

## Common Dependencies

### Frontend
- `react` - UI library
- `axios` - HTTP client
- `react-router-dom` - Routing
- `tailwindcss` - Styling

### Backend
- `express` - HTTP server
- `axios` - HTTP client
- `multer` - File uploads
- `dotenv` - Environment config

## Port Numbers

- Frontend: `5173` (Vite default)
- Backend: `5000` (configured)
- SpacetimeDB: `8000` (if local)

## Tips & Tricks

### Frontend
- Use `import.meta.env.VITE_*` for env vars
- Components are in `src/components/`
- Pages are in `src/pages/`
- Don't forget `key` prop in lists

### Backend
- Use `import ... from './path.js'` (must have .js)
- Async/await for API calls
- `process.env.VAR_NAME` for env vars
- Always await Promises

### Common Mistakes
- ❌ Forgetting `.js` extension in imports (backend)
- ❌ Forgetting `VITE_` prefix for frontend env vars
- ❌ Circular dependency issues
- ❌ Async without await
- ❌ Wrong API URL in frontend

## Useful Resources

- [React Docs](https://react.dev)
- [Express Docs](https://expressjs.com)
- [TailwindCSS Docs](https://tailwindcss.com)
- [Gemini API Docs](https://ai.google.dev)
- [GitHub API Docs](https://docs.github.com/en/rest)

## Getting Help

1. Check `README.md` for overview
2. Check `SETUP_GUIDE.md` for setup issues
3. Check `API.md` for endpoint issues
4. Check `CONTRIBUTING.md` for code style
5. Run `node setup-check.js` to verify environment
6. Check console for error messages (F12)

---

**Happy coding! 🚀**
