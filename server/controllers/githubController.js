// githubController.js - Handle GitHub data fetching
import { githubService } from '../services/githubService.js'
import { geminiService } from '../services/geminiService.js'

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

export const reviewRandomRepositoryCode = async (req, res) => {
  try {
    console.log('🔍 Starting random repository code review...')

    // Step 1: Fetch a random repository
    console.log('📦 Fetching random repository...')
    const repoInfo = await githubService.getRandomRepository()
    console.log(`✅ Found repository: ${repoInfo.owner}/${repoInfo.name}`)

    // Step 2: Extract code from the repository
    console.log('📂 Extracting code files from repository...')
    const codeFiles = await githubService.extractRepositoryCode(
      repoInfo.owner,
      repoInfo.name
    )
    
    if (codeFiles.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No code files could be extracted from the repository',
        repository: repoInfo,
      })
    }

    console.log(`✅ Extracted ${codeFiles.length} code files`)

    // Step 3: Review code quality with Gemini
    console.log('🤖 Reviewing code quality with Gemini...')
    const codeReview = await geminiService.reviewCodeQuality(codeFiles, repoInfo)
    console.log('✅ Code review completed')

    res.json({
      success: true,
      data: {
        repository: repoInfo,
        filesAnalyzed: codeFiles.length,
        fileNames: codeFiles.map(f => ({ name: f.name, language: f.language })),
        codeReview,
      },
    })
  } catch (error) {
    console.error('Code review error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
