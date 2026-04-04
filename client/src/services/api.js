// services/api.js - Frontend API client
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const trustAPI = {
  // Upload and analyze resume
  uploadAndAnalyze: async (resumeFile, githubUsername, selectedSkills = []) => {
    try {
      const formData = new FormData()
      formData.append('resume', resumeFile)

      // Upload resume - use axios directly without the api instance to avoid Content-Type conflicts
      const uploadRes = await axios.post(
        `${API_BASE}/trust/upload-resume`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      const resumeText = uploadRes.data.data.text

      // Analyze
      const analysisRes = await api.post('/trust/analyze', {
        resumeText,
        githubUsername,
        selectedSkills,
      })

      return analysisRes.data.data
    } catch (error) {
      console.error('Upload and analyze error:', error)
      throw error
    }
  },

  // Fetch GitHub data
  getGitHubData: async (username) => {
    try {
      const res = await api.get('/trust/github', {
        params: { username },
      })
      return res.data.data
    } catch (error) {
      console.error('GitHub fetch error:', error)
      throw error
    }
  },

  // Get all analyzed candidates
  getAllCandidates: async () => {
    try {
      const res = await api.get('/trust/candidates')
      return res.data.data
    } catch (error) {
      console.error('Fetch candidates error:', error)
      throw error
    }
  },

  // Get single candidate
  getCandidateById: async (id) => {
    try {
      const res = await api.get(`/trust/candidates/${id}`)
      return res.data.data
    } catch (error) {
      console.error('Fetch candidate error:', error)
      throw error
    }
  },

  // Get available skills
  getAvailableSkills: async () => {
    try {
      const res = await api.get('/trust/available-skills')
      return res.data.data
    } catch (error) {
      console.error('Fetch skills error:', error)
      throw error
    }
  },

  // Direct analyze with resume text
  analyze: async (resumeText, githubUsername, selectedSkills = []) => {
    try {
      const res = await api.post('/trust/analyze', {
        resumeText,
        githubUsername,
        selectedSkills,
      })
      return res.data.data
    } catch (error) {
      console.error('Analyze error:', error)
      throw error
    }
  },
}

export default api
