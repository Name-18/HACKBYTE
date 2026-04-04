// pages/CandidateProfile.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CommonNavbar } from '../components/CommonNavbar'
import { trustAPI } from '../services/api'
import { TrustScoreCard } from '../components/TrustScoreCard'
import { BreakdownBar } from '../components/BreakdownBar'
import { FlagsPanel } from '../components/FlagsPanel'
import { ExplanationPanel } from '../components/ExplanationPanel'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function CandidateProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const data = await trustAPI.getCandidateById(id)
        setCandidate(data)
      } catch (err) {
        setError('Failed to load candidate profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCandidate()
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:underline font-medium flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="bg-red-50 border border-red-300 text-red-700 px-6 py-4 rounded-lg">
            {error || 'Candidate not found'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <CommonNavbar />
      
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:underline font-medium flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Candidate Profile
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Results Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Trust Score Card */}
          <div className="md:col-span-1">
            <TrustScoreCard
          score={candidate.trust_score}
          verdict={candidate.verdict}
/>
          </div>

          {/* Breakdown Scores */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">
              Score Breakdown
            </h3>
            <BreakdownBar
              label="Skills Verification"
              score={candidate.breakdown.skills}
            />
            <BreakdownBar
              label="Projects & Portfolio"
              score={candidate.breakdown.projects}
            />
            <BreakdownBar
              label="Experience Consistency"
              score={candidate.breakdown.experience}
            />
          </div>
        </div>

        {/* Red Flags */}
        <div className="bg-white rounded-lg shadow p-6">
          <FlagsPanel flags={candidate.flags} />
        </div>

        {/* Explanation */}
        <ExplanationPanel explanation={candidate.explanation} />

        {/* Metadata */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-3">
            Analysis Information
          </h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Analyzed On</dt>
              <dd className="font-medium text-gray-700">
                {new Date(candidate.timestamp).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Analysis ID</dt>
              <dd className="font-medium text-gray-700 font-mono text-xs">
                {candidate.id}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
