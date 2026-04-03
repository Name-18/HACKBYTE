# SETUP GUIDE - TrustHire

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 2. Get API Keys

- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **GitHub Token**: Create at [GitHub Settings > Developer tokens](https://github.com/settings/tokens)

### 3. Configure Environment

**Create `server/.env`:**
```
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here
SPACETIME_URI=http://localhost:8000
SPACETIME_TOKEN=demo
CLIENT_URL=http://localhost:5173
```

**Create `client/.env`:**
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_TITLE=TrustHire
```

### 4. Run Both Services

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
➡️ Server on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
➡️ App on `http://localhost:5173`

### 5. Test It!
- Go to `http://localhost:5173`
- Upload a resume (try creating a simple text file)
- Enter a GitHub username (e.g., "torvalds")
- Click "Analyze Profile"
- View results on dashboard!

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill it
kill -9 <PID>
```

### Module Not Found
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Keys Not Working
- Check `.env` file exists in `server/`
- Verify keys are correct
- Check for quotes around values

### CORS Errors
- Ensure `CLIENT_URL` in `server/.env` matches frontend URL
- Frontend should be http://localhost:5173
- Backend should be http://localhost:5000

---

## Testing Without API Keys

The system has fallbacks:
- **No Gemini Key**: Uses heuristic analysis instead
- **No GitHub Token**: Uses mock data for testing
- Use these to test UI before configuring real keys

---

## File Upload Testing

Create a test resume file:

**test_resume.txt:**
```
JOHN DOE
john@example.com | (555) 123-4567
LinkedIn: linkedin.com/in/johndoe

SKILLS
JavaScript, React, Node.js, Python, TypeScript, MongoDB

EXPERIENCE
Senior Developer, Tech Corp (2019-2024)
- Built React applications, led team of 5

PROJECTS
- GitHub Portfolio Website (JavaScript, React)
- Open-source npm package (2k+ downloads)

EDUCATION
BS Computer Science, State University (2019)
```

Upload this and try analyzing with GitHub username "torvalds"

---

## Production Checklist

Before deploying:
- [ ] All API keys configured
- [ ] Environment variables in production secrets manager
- [ ] CORS origins updated
- [ ] Rate limiting enabled
- [ ] File upload size limits set
- [ ] Error logging configured
- [ ] Database backup strategy
- [ ] Security headers added

---

## Next Steps

1. **Customize**: Modify components in `client/src/components/`
2. **Extend**: Add new services in `server/services/`
3. **Integrate**: Connect to your real database (replace SpacetimeDB mock)
4. **Deploy**: Use Vercel (frontend) + Railway (backend)

Enjoy! 🚀
