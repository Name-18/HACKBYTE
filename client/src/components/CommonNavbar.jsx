// components/CommonNavbar.jsx
import { useNavigate, useLocation } from 'react-router-dom'
import { Users } from 'lucide-react'
import logo from '../assets/images.png'

export function CommonNavbar() {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine which button(s) to show based on current path
  const isHomePage = location.pathname === '/'
  const isDashboardPage = location.pathname === '/dashboard'
  const isOtherPage = !isHomePage && !isDashboardPage

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-start">
          <div>
            {/* Logo + Name - Same as Home page */}
            <div className="flex items-center gap-4">
              {/* Logo */}
              <img
                src={logo}
                alt="TrustHire Logo"
                className="w-20 h-20 rounded-full object-contain"
              />

              {/* Text Block */}
              <div className="flex flex-col justify-center h-20">
                <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                  TrustHire
                </h1>
                <p className="text-gray-600 text-sm leading-tight">
                  Real-Time AI Hiring Intelligence & Verification Platform
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            {/* Show "Analyze New Candidate" on Dashboard and Other pages */}
            {(isDashboardPage || isOtherPage) && (
              <button
                onClick={() => navigate('/')}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Analyze New Candidate
              </button>
            )}

            {/* Show "All Candidates" on Home and Other pages */}
            {(isHomePage || isOtherPage) && (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                All Candidates
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
