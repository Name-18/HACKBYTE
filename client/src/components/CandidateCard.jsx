// components/CandidateCard.jsx
import { Badge } from './ui/Badge'
import { ExternalLink, Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function CandidateCard({ candidate, onClick }) {
  const navigate = useNavigate()
  
  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'Trusted':
        return 'bg-green-100 text-green-800'
      case 'Suspicious':
        return 'bg-yellow-100 text-yellow-800'
      case 'High Risk':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // ✅ Fix mapping once
const rawScore =
  candidate.trustScore > 0
    ? candidate.trustScore
    : candidate.trust_score

const trustScore = Number(rawScore) || 0
// console.log("FULL candidate object:", candidate)

  const handleWorkExpAuth = () => {
    // Store the candidate ID in session storage for Work Experience Auth
    sessionStorage.setItem('analyzedResumeId', candidate.id)
    sessionStorage.setItem('resumeAnalyzed', 'true')
    console.log('WorkExperience Auth clicked for candidate ID:', candidate.id)
    
    // Navigate to Work Experience Auth page
    navigate('/work-auth')
  }
  return (
    <div
      onClick={onClick}
      className="border border-gray-300 rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">
            {candidate.username || 'Unknown Candidate'}
          </h3>
          <p className="text-sm text-gray-500">
            {new Date(candidate.timestamp).toLocaleDateString()}
          </p>
        </div>
        <Badge className={getVerdictColor(candidate.verdict)}>
          {candidate.verdict}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Trust Score
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {Math.round(trustScore)}/100
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Red Flags
          </p>
          <p className="text-2xl font-bold text-red-600">
            {candidate.flags?.length || 0}
          </p>
        </div>
      </div>

      <div className="text-sm text-gray-600 line-clamp-2 mb-3">
        {candidate.explanation}
      </div>

      <div className="flex gap-2">
        <button className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
          View Details
          <ExternalLink className="w-4 h-4" />
        </button>
        
        <button 
          onClick={(e) => {
            e.stopPropagation() // Prevent card click
            handleWorkExpAuth()
          }}
          className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition"
        >
          <Phone className="w-4 h-4" />
          Work Experience Auth
        </button>
      </div>
    </div>
  )
}
