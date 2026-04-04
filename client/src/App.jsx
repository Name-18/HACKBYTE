// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Dashboard } from './pages/Dashboard'
import { CandidateProfile } from './pages/CandidateProfile'
import { WorkExperienceAuth } from './pages/WorkExperienceAuth'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/candidate/:id" element={<CandidateProfile />} />
        <Route path="/work-auth" element={<WorkExperienceAuth />} />
      </Routes>
    </Router>
  )
}

export default App
