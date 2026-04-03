// githubController.js - Handle GitHub data fetching
import { githubService } from '../services/githubService.js'

export const getGitHubData = async (req, res) => {
  try {
    const { username } = req.query

    if (!username) {
      return res
        .status(400)
        .json({ error: 'GitHub username is required' })
    }

    const githubData = await githubService.fetchUserData(username)

    res.json({
      success: true,
      data: githubData,
    })
  } catch (error) {
    console.error('GitHub fetch error:', error)
    res.status(500).json({ error: error.message })
  }
}
