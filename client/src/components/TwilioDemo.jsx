// components/TwilioDemo.jsx - Twilio Demo Call Component
import { useState } from 'react'
import { Phone, Loader2, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function TwilioDemo() {
  const [pocPhone, setPocPhone] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleMakeCall = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setIsLoading(true)

    try {
      const response = await axios.post(`${API_BASE}/twilio-demo/call`, {
        pocPhone,
        candidateName,
        organizationName,
      })

      setResult(response.data.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to make call')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckConfig = async () => {
    try {
      const response = await axios.get(`${API_BASE}/twilio-demo/config`)
      setResult(response.data.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check configuration')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Phone className="w-6 h-6 text-blue-600" />
        Twilio Demo Call
      </h2>

      {/* Check Config Button */}
      <button
        onClick={handleCheckConfig}
        className="mb-6 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg"
      >
        Check Twilio Configuration
      </button>

      {/* Configuration Status */}
      {result && result.isConfigured !== undefined && (
        <div className={`mb-6 p-4 rounded-lg ${
          result.isConfigured ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {result.isConfigured ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className={`font-medium ${
              result.isConfigured ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.isConfigured ? 'Twilio is configured' : 'Twilio is not configured'}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <p>SID: {result.hasSid ? '✓' : '✗'}</p>
            <p>Token: {result.hasToken ? '✓' : '✗'}</p>
            <p>Phone: {result.hasPhone ? '✓' : '✗'}</p>
          </div>
        </div>
      )}

      {/* Demo Call Form */}
      <form onSubmit={handleMakeCall} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Candidate Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name
          </label>
          <input
            type="text"
            placeholder="Tech Company Inc."
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Making Call...
            </>
          ) : (
            <>
              <Phone className="w-5 h-5" />
              Make Demo Call
            </>
          )}
        </button>
      </form>

      {/* Call Result */}
      {result && result.callSid && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Call Initiated!</h3>
          <p className="text-green-700">Call SID: {result.callSid}</p>
          <p className="text-green-700">Status: {result.status}</p>
          <p className="text-sm text-green-600 mt-2">
            The call will play a demo message about work experience verification.
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Demo Call Features:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Uses Twilio's text-to-speech (no ElevenLabs needed)</li>
          <li>• Speaks candidate and organization names</li>
          <li>• Directs recipient to check email for verification</li>
          <li>• Shows real call status and SID</li>
          <li>• Perfect for demonstration purposes</li>
        </ul>
      </div>
    </div>
  )
}
