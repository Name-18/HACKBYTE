// pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trustAPI } from '../services/api'
import { CandidateCard } from '../components/CandidateCard'
import { Loader2, Plus, Phone } from 'lucide-react'

export function Dashboard() {
  const [candidates, setCandidates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const data = await trustAPI.getAllCandidates()
        setCandidates(data || [])
      } catch (error) {
        console.error('Error fetching candidates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCandidates()
    // Refresh every 10 seconds
    const interval = setInterval(fetchCandidates, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                📊 Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time candidate analysis results
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/work-auth')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                WorkExperience Auth
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
              Analyze New Candidate
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg font-medium mb-3">
              No candidates analyzed yet
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg inline-block"
            >
              Analyze Your First Candidate
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-6">
              Total candidates: <span className="font-semibold">{candidates.length}</span>
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onClick={() => navigate(`/candidate/${candidate.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
