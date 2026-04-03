# DEPLOYMENT & SCALING GUIDE

## Deployment Options

### Frontend (Vercel - Recommended)
```bash
cd client
npm run build
# Deploy dist/ folder to Vercel
```

### Backend Options

**Option 1: Railway**
```bash
npm install -g railway
railway login
railway init
railway up
```

**Option 2: Render**
```bash
# Connect GitHub repo
# Set build: npm install
# Set start: npm start
# Add env variables
# Deploy!
```

**Option 3: Heroku**
```bash
heroku create trusthire-api
git push heroku main
```

## Environment Variables

**Production Server (.env)**
```
PORT=5000
NODE_ENV=production

GEMINI_API_KEY=sk-...
GITHUB_TOKEN=ghp_...

SPACETIME_URI=https://your-spacetime-instance.com
SPACETIME_TOKEN=st_...

CLIENT_URL=https://trusthire.vercel.app
LOG_LEVEL=info
```

## Performance Optimization

### Caching
```javascript
// Redis cache for GitHub API
import redis from 'redis'
const cache = redis.createClient()

// Cache GitHub data for 1 hour
cache.setex(`github:${username}`, 3600, JSON.stringify(data))
```

### Database Indexing
```javascript
// Add indexes to SpacetimeDB
db.candidates.createIndex('username')
db.candidates.createIndex('timestamp')
```

### API Rate Limiting
```javascript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})

app.use('/api/', limiter)
```

## Monitoring

### Error Tracking (Sentry)
```bash
npm install @sentry/node
```

### Analytics (Vercel Analytics)
```bash
npm install web-vitals
```

### Logging
```bash
npm install winston
```

## Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:5000/api/health

# Using k6
k6 run load-test.js
```

## CI/CD Pipeline

**GitHub Actions (.github/workflows/deploy.yml)**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: npm install --prefix server
      
      - name: Run tests
        run: npm test --prefix server
      
      - name: Deploy to production
        run: npm run deploy --prefix server
```

## Database Migration

When upgrading SpacetimeDB schema:

```bash
# Take backup
spacetime backup

# Run migrations
npm run migrate:up

# Verify
npm run verify:db
```

## Rollback Plan

```bash
# If deployment fails
git revert HEAD
git push origin main

# Restart services
systemctl restart trusthire-api
```

---

See README.md for more info.
