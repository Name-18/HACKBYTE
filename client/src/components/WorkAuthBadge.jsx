// components/WorkAuthBadge.jsx
// Fetches and displays work experience verification status for a candidate
import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldOff, Shield } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function WorkAuthBadge({ resumeId, showDetail = false }) {
  const [status, setStatus] = useState(null) // 'verified' | 'rejected' | 'not_verified'
  const [record, setRecord] = useState(null)

  useEffect(() => {
    if (!resumeId) {
      setStatus('not_verified')
      return
    }

    axios
      .get(`${API_BASE}/work-auth/check-verification`, { params: { resumeId } })
      .then((res) => {
        setStatus(res.data.status)
        setRecord(res.data.record)
      })
      .catch(() => setStatus('not_verified'))
  }, [resumeId])

  if (!status) {
    return (
      <div className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50 border-gray-200 text-gray-400 text-sm animate-pulse">
        <Shield className="w-4 h-4" />
        <span>Checking verification...</span>
      </div>
    )
  }

  const configs = {
    verified: {
      icon: <ShieldCheck className="w-4 h-4" />,
      label: 'Work Experience Verified',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dot: 'bg-emerald-500',
    },
    rejected: {
      icon: <ShieldOff className="w-4 h-4" />,
      label: 'Verification Rejected',
      bg: 'bg-red-50 border-red-200 text-red-700',
      dot: 'bg-red-500',
    },
    not_verified: {
      icon: <Shield className="w-4 h-4" />,
      label: 'Work Experience Not Yet Verified',
      bg: 'bg-gray-50 border-gray-200 text-gray-500',
      dot: 'bg-gray-400',
    },
  }

  const cfg = configs[status]

  return (
    <div className={`inline-flex flex-col gap-1 border rounded-lg px-3 py-2 ${cfg.bg}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        {cfg.icon}
        <span>{cfg.label}</span>
        <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
      </div>
      {showDetail && status === 'verified' && record && (
        <div className="text-xs mt-1 space-y-0.5 pl-6 opacity-80">
          {record.organizationName && <p>📍 {record.organizationName}</p>}
          {record.verifiedAt && (
            <p>✅ Verified on {new Date(record.verifiedAt).toLocaleDateString()}</p>
          )}
        </div>
      )}
    </div>
  )
}
