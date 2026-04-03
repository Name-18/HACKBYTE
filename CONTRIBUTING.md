# Contributing to TrustHire

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md) for local setup
3. Create a feature branch: `git checkout -b feature/your-feature`

## Coding Standards

### Frontend (React)

- Use functional components and hooks
- Name files with `.jsx` extension
- Follow camelCase for variable/function names
- Use TailwindCSS for styling, not inline styles
- Keep components focused and reusable

Example:
```jsx
export function MyComponent({ title, onClick }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="p-4 bg-white rounded-lg">
      <h2 className="font-bold">{title}</h2>
    </div>
  )
}
```

### Backend (Node.js)

- Use ES6+ with import/export
- Follow camelCase for variables/functions
- Use PascalCase for classes
- Add JSDoc comments for public functions
- Log important events

Example:
```javascript
/**
 * Analyzes a candidate profile
 * @param {string} resumeText - The resume content
 * @param {string} githubUsername - GitHub username
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzeCandidateProfile(resumeText, githubUsername) {
  try {
    // Implementation
  } catch (error) {
    logger.error('Analysis failed', { error })
    throw error
  }
}
```

## File Organization

### Frontend Components
```
components/
├── MyFeature.jsx        # Main component
├── MyFeature.test.jsx   # Tests
└── index.js             # Export
```

### Backend Services
```
services/
├── myService.js         # Implementation
├── myService.test.js    # Tests
└── index.js             # Export
```

## Testing

### Running Tests
```bash
# Frontend
cd client
npm test

# Backend
cd server
npm test
```

### Writing Tests
```javascript
// Using Jest
describe('TrustEngine', () => {
  it('should calculate score correctly', () => {
    const result = trustEngine.calculateScores({...})
    expect(result.overall).toBeGreaterThan(0)
  })
})
```

## Commit Messages

Follow conventional commits:
```
feat: Add new feature
fix: Fix a bug
docs: Update documentation
style: Format code
refactor: Reorganize code
test: Add tests
chore: Update dependencies
```

Examples:
- `feat: Add LinkedIn integration to analysis`
- `fix: Handle missing GitHub data gracefully`
- `docs: Update API documentation`

## Pull Request Process

1. **Before Submitting**
   - Run `npm run lint` (if available)
   - Run `npm test` 
   - Update documentation
   - Add/update comments

2. **PR Title**
   - Be descriptive: "Add real-time notifications to dashboard"
   - Not: "fix stuff"

3. **PR Description**
   - What does it do?
   - Why is this change needed?
   - Any breaking changes?
   - Screenshots for UI changes

4. **Review**
   - Address feedback promptly
   - Keep commits clean
   - Rebase if needed: `git rebase main`

## Adding New Features

### 1. Backend: New Analysis Rule

**File**: `server/services/trustEngine.js`

```javascript
calculateSuspiciousMetric(data) {
  // Your logic
  return score
}
```

Update the verdict determination:
```javascript
determineVerdict(scores, aiAnalysis) {
  // Include your new metric
}
```

### 2. Frontend: New UI Component

**File**: `client/src/components/NewComponent.jsx`

```jsx
export function NewComponent({ data }) {
  return (
    <div className="...">
      {/* Your component */}
    </div>
  )
}
```

Export from barrel file if applicable.

### 3. New API Endpoint

**File**: `server/routes/trustRoutes.js`

```javascript
router.post('/new-endpoint', newController.handleRequest)
```

**Add Controller**: `server/controllers/newController.js`

**Update Client**: `client/src/services/api.js`

```javascript
newEndpoint: async (params) => {
  const res = await api.post('/path', params)
  return res.data.data
}
```

## Performance Tips

### Frontend
- Lazy load components with React.lazy()
- Memoize expensive calculations with useMemo
- Profile with React DevTools
- Split large components

### Backend
- Add API response caching
- Index database queries
- Use connection pooling
- Profile with Node --prof

## Security Checklist

Before committing:
- [ ] No hardcoded API keys
- [ ] Input validation for all endpoints
- [ ] SQL injection prevention
- [ ] XSS prevention in React
- [ ] Rate limiting considerations
- [ ] Error messages don't leak internals

## Reporting Issues

### Bug Report Template
```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: 
- Node: 
- Browser: 
```

### Feature Request Template
```markdown
## Description
What feature?

## Why
Why is this needed?

## Implementation Ideas
How could it work?

## Examples
Real-world use case?
```

## Getting Help

- Check existing issues
- Read documentation
- Ask in discussions
- Open an issue if stuck

---

## Code Review Checklist

When reviewing PRs:
- ✅ Code follows style guide
- ✅ Comments are clear
- ✅ No unnecessary code
- ✅ Error handling is present
- ✅ Tests are included
- ✅ Documentation updated
- ✅ No breaking changes

---

Thank you for contributing! 🚀
