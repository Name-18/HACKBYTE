// trustController.js - Analyze candidates and generate TrustScore
import { trustEngine } from '../services/trustEngine.js'
import { spacetimeClient } from '../spacetime/spacetimeClient.js'

export const analyzeCandidateProfile = async (req, res) => {
  try {
    const { resumeText, githubUsername } = req.body

    if (!resumeText) {
      return res
        .status(400)
        .json({ error: 'Resume text is required' })
    }

    // Perform analysis
    const trustScore = await trustEngine.analyzeCandidateProfile(
      resumeText,
      githubUsername,
    )

    // Store result in SpacetimeDB
    const storedResult = await spacetimeClient.storeCandidateAnalysis({
      ...trustScore,
      username: githubUsername,
    })

    res.json({
      success: true,
      data: trustScore,
      storageId: storedResult.id,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    res.status(500).json({ error: error.message })
  }
}

export const getAllCandidates = async (req, res) => {
  try {
    const candidates = await spacetimeClient.getCandidates()

    res.json({
      success: true,
      data: candidates,
    })
  } catch (error) {
    console.error('Error fetching candidates:', error)
    res.status(500).json({ error: error.message })
  }
}

export const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params

    const candidate = await spacetimeClient.getCandidateById(id)

    if (!candidate) {
      return res
        .status(404)
        .json({ error: 'Candidate not found' })
    }

    res.json({
      success: true,
      data: candidate,
    })
  } catch (error) {
    console.error('Error fetching candidate:', error)
    res.status(500).json({ error: error.message })
  }
}
