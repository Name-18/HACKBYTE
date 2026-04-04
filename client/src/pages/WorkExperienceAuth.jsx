// pages/WorkExperienceAuth.jsx - Work Experience Authentication Page
import { useState, useEffect } from 'react'
import { Loader2, Phone, Mail, CheckCircle, XCircle, Clock } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function WorkExperienceAuth() {
  // Form state
  const [pocPhone, setPocPhone] = useState('')
  const [pocEmail, setPocEmail] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [organizationName, setOrganizationName] = useState('')

  // Verification state
  const [recordId, setRecordId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Status state
  const [status, setStatus] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

  // Polling for status updates
  useEffect(() => {
    if (!recordId) return

    // Poll status every 2 seconds
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE}/work-auth/status`, {
          params: { id: recordId },
        })
        setStatus(response.data.data)
      } catch (err) {
        console.error('Status poll error:', err)
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [recordId])

  // Handle form submission
  const handleStartVerification = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      const response = await axios.post(`${API_BASE}/work-auth/start`, {
        pocPhone,
        pocEmail,
        candidateName,
        organizationName,
      })

      if (response.data.success) {
        setRecordId(response.data.data.recordId)
        setSuccessMessage(response.data.data.message)
        setStatus({
          callStatus: 'pending',
          mailStatus: 'pending',
          finalStatus: 'pending',
        })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start verification')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle re-authenticate
  const handleReAuthenticate = () => {
    setRecordId(null)
    setStatus(null)
    setPocPhone('')
    setPocEmail('')
    setCandidateName('')
    setOrganizationName('')
    setError(null)
    setSuccessMessage(null)
  }

  // Status badge component
  const StatusBadge = ({ label, status }) => {
    const getIcon = (s) => {
      switch (s) {
        case 'accepted':
        case 'correct':
          return <CheckCircle className="w-5 h-5 text-green-500" />
        case 'failed':
        case 'rejected':
          return <XCircle className="w-5 h-5 text-red-500" />
        default:
          return <Clock className="w-5 h-5 text-yellow-500" />
      }
    }

    const getColor = (s) => {
      switch (s) {
        case 'accepted':
        case 'correct':
          return 'bg-green-50 border-green-200'
        case 'failed':
        case 'rejected':
          return 'bg-red-50 border-red-200'
        default:
          return 'bg-yellow-50 border-yellow-200'
      }
    }

    return (
      <div
        className={`p-3 border rounded-lg flex items-center gap-3 ${getColor(
          status
        )}`}
      >
        {getIcon(status)}
        <div>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-600 capitalize">{status}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-gray-900">
            📞 Work Experience Authentication
          </h1>
          <p className="text-gray-600 mt-2">
            Verify candidate work experience through phone call and email
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {!recordId ? (
          // Form Section
          <div className="bg-white rounded-lg shadow p-8">
            <form onSubmit={handleStartVerification} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* POC Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    POC Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={pocPhone}
                    onChange={(e) => setPocPhone(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* POC Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    POC Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={pocEmail}
                    onChange={(e) => setPocEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Candidate Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Organization Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    placeholder="Tech Company Inc."
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting Verification...
                  </>
                ) : (
                  <>
                    📞 Authenticate
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          // Status Section
          <div className="space-y-6">
            {successMessage && (
              <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg">
                ✅ {successMessage}
              </div>
            )}

            {/* Status Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <StatusBadge label="Call Status" status={status?.callStatus} />
              <StatusBadge label="Email Status" status={status?.mailStatus} />
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">
                Verification Details
              </h3>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-gray-600">Phone:</span>{' '}
                  <span className="font-medium">{pocPhone}</span>
                </p>
                <p>
                  <span className="text-gray-600">Email:</span>{' '}
                  <span className="font-medium">{pocEmail}</span>
                </p>
                {candidateName && (
                  <p>
                    <span className="text-gray-600">Candidate:</span>{' '}
                    <span className="font-medium">{candidateName}</span>
                  </p>
                )}
                {organizationName && (
                  <p>
                    <span className="text-gray-600">Organization:</span>{' '}
                    <span className="font-medium">{organizationName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Final Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">
                Final Status
              </h3>
              <StatusBadge
                label="Verification Result"
                status={status?.finalStatus}
              />
              {status?.finalStatus === 'pending' && (
                <p className="text-sm text-gray-600 mt-4">
                  ⏳ Waiting for POC response via phone and email...
                </p>
              )}
              {status?.finalStatus === 'correct' && (
                <p className="text-sm text-green-700 mt-4 font-medium">
                  ✅ Work experience verified as correct!
                </p>
              )}
              {status?.finalStatus === 'rejected' && (
                <p className="text-sm text-red-700 mt-4 font-medium">
                  ❌ Work experience verification rejected.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              {status?.finalStatus !== 'pending' && (
                <button
                  onClick={handleReAuthenticate}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  ← Verify Another
                </button>
              )}
              <button
                onClick={() => window.history.back()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
