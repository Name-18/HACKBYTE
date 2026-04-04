// pages/Home.jsx
import { useState } from 'react'
import { CommonNavbar } from '../components/CommonNavbar'
import { UploadResume } from '../components/UploadResume'
import { TrustScoreCard } from '../components/TrustScoreCard'
import { BreakdownBar } from '../components/BreakdownBar'
import { FlagsPanel } from '../components/FlagsPanel'
import { ExplanationPanel } from '../components/ExplanationPanel'
import { trustAPI } from '../services/api'
import { Loader2 } from 'lucide-react'

export function Home() {
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAnalyze = async (resumeFile, githubUsername, selectedSkills) => {
    setIsLoading(true)
    setError(null)

    try {
      const analysis = await trustAPI.uploadAndAnalyze(
        resumeFile,
        githubUsername,
        selectedSkills,
      )
      setResult(analysis)
    } catch (err) {
      console.error('Analysis error:', err)
      setError('Failed to analyze profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <CommonNavbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {!result ? (
          <>
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto">
                {error}
              </div>
            )}

            <UploadResume onAnalyze={handleAnalyze} />
          </>
        ) : (
          <div className="space-y-8">
            <button
              onClick={() => setResult(null)}
              className="text-blue-600 hover:underline font-medium"
            >
              ← Analyze Another Candidate
            </button>

            {/* Results Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Trust Score Card */}
              <div className="md:col-span-1">
                <TrustScoreCard
                  score={result.trustScore}
                  verdict={result.verdict}
                />
              </div>

              {/* Breakdown Scores */}
              <div className="md:col-span-2 bg-white rounded-lg shadow p-6 space-y-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-4">
                  Score Breakdown
                </h3>
                <BreakdownBar
                  label="Skills Verification"
                  score={result.breakdown.skills}
                />
                <BreakdownBar
                  label="Projects & Portfolio"
                  score={result.breakdown.projects}
                />
                <BreakdownBar
                  label="Experience Consistency"
                  score={result.breakdown.experience}
                />
              </div>
            </div>

            {/* Red Flags */}
            <div className="bg-white rounded-lg shadow p-6">
              <FlagsPanel flags={result.flags} />
            </div>

            {/* Explanation */}
            <ExplanationPanel explanation={result.explanation} />
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="font-semibold text-gray-700">
                Analyzing candidate profile...
              </p>
              <p className="text-sm text-gray-500">
                This may take a moment...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}