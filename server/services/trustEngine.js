// trustEngine.js - Core TrustScore calculation engine
import { geminiService } from './geminiService.js'
import { githubService } from './githubService.js'
import { getDefaultSkills } from '../config/skillsConfig.js'

export class TrustEngine {
  constructor() {
    this.weights = {
      skills: 0.35,
      projects: 0.35,
      experience: 0.30,
    }
  }

  async analyzeCandidateProfile(resumeData, githubUsername, selectedSkills = []) {
    try {
      console.log('🔍 Starting TrustScore analysis...')
      console.log('   Received selectedSkills:', selectedSkills)
      console.log('   Type:', Array.isArray(selectedSkills) ? 'array' : typeof selectedSkills)

      // Use selected skills, or default if none provided
      const skillsToAnalyze = selectedSkills && selectedSkills.length > 0 ? selectedSkills : getDefaultSkills()
      
      console.log('🎯 Skills to analyze:')
      console.log('   Count:', skillsToAnalyze.length)
      console.log('   List:', skillsToAnalyze)

      const resumeInfo = this.extractResumeInfo(resumeData, skillsToAnalyze)
      console.log('📄 Resume parsed:', Object.keys(resumeInfo))
      console.log('   Found skills in resume:', resumeInfo.skills)

      let githubData = {}
      if (githubUsername) {
        githubData = await githubService.fetchUserData(githubUsername)
        console.log('🐙 GitHub data fetched')
      }

      const aiAnalysis = await geminiService.analyzeCandidate({
        resume: resumeInfo,
        github: githubData,
      })
      console.log('🧠 AI analysis complete')

      // CODE FILE VALIDATOR — commented out for now
      // let randomRepoAnalysis = null
      // if (githubData && githubData.repos && githubData.repos.length > 0) {
      //   console.log('📦 Analyzing random GitHub repository from user profile...')
      //   try {
      //     randomRepoAnalysis = await this.analyzeRandomRepository(githubData)
      //   } catch (repoErr) {
      //     console.warn('⚠️ Repo analysis skipped (Gemini rate limit or error):', repoErr.message)
      //     randomRepoAnalysis = { status: 'skipped', message: 'Code review skipped to avoid API exhaustion.' }
      //   }
      // } else {
      //   console.log('⏭️ Skipping repository analysis (no GitHub profile provided)')
      // }
      const randomRepoAnalysis = null

      const scores = this.calculateScores(
        resumeInfo,
        githubData,
        aiAnalysis,
      )

      const verdict = this.determineVerdict(scores, aiAnalysis)

      const explanation = this.generateExplanation(
        scores,
        aiAnalysis,
      )

      const trustScore = {
        trustScore: scores.overall,
        verdict,
        breakdown: {
          skills: scores.skills,
          projects: scores.projects,
          experience: scores.experience,
        },
        // FIX 2: was aiAnalysis.flags (always undefined) → correct key
        flags: aiAnalysis.suspicionFlags || [],
        explanation,
        rawAnalysis: aiAnalysis,
        timestamp: new Date().toISOString(),
        selectedSkills: skillsToAnalyze,
        randomRepoAnalysis,
      }

      return trustScore
    } catch (error) {
      console.error('❌ TrustEngine error:', error)
      throw error
    }
  }

  async analyzeRandomRepository(githubData) {
    try {
      // Check if GitHub data exists and has repositories
      if (!githubData || !githubData.repos || githubData.repos.length === 0) {
        console.warn('⚠️ No repositories found in user GitHub profile')
        return {
          status: 'no_repos',
          message: 'User has no public repositories to analyze',
        }
      }

      // Select a random repository from the user's repos
      const randomIndex = Math.floor(Math.random() * githubData.repos.length)
      const randomRepo = githubData.repos[randomIndex]

      console.log(`🔍 Selected random repo from user profile: ${githubData.username}/${randomRepo.name}`)
      
      // Extract code from the selected repository
      console.log('📂 Extracting code from user repository...')
      const allFiles = await githubService.extractRepositoryCode(
        githubData.username,
        randomRepo.name
      )
      const codeFiles = allFiles
        .filter(file => file.content && file.content.length < 500)
        .slice(0, 3)
        .map(file => ({
          ...file,
          content: file.content.slice(0, 200)
        }))

      if (codeFiles.length === 0) {
        console.warn('⚠️ No code files extracted from repository')
        return {
          repository: {
            name: randomRepo.name,
            owner: githubData.username,
            url: randomRepo.url,
            description: randomRepo.description,
            language: randomRepo.language,
          },
          status: 'no_code_found',
          filesAnalyzed: 0,
        }
      }

      console.log(`✅ Extracted ${codeFiles.length} code files`)

      // Review code quality with Gemini
      console.log('🤖 Reviewing code quality with Gemini...')
      const codeReview = await geminiService.reviewCodeQuality(codeFiles, {
        name: randomRepo.name,
        owner: githubData.username,
        url: randomRepo.url,
        description: randomRepo.description,
        language: randomRepo.language,
      })
      
      console.log('✅ Code review completed')

      const result = {
        repository: {
          name: randomRepo.name,
          owner: githubData.username,
          url: randomRepo.url,
          description: randomRepo.description,
          language: randomRepo.language,
          createdAt: randomRepo.created_at,
          updatedAt: randomRepo.updated_at,
        },
        filesAnalyzed: codeFiles.length,
        fileNames: codeFiles.map(f => ({ name: f.name, language: f.language })),
        codeReview,
        timestamp: new Date().toISOString(),
      }

      console.log('\n' + '='.repeat(60))
      console.log('📊 USER REPOSITORY ANALYSIS:')
      console.log('='.repeat(60))
      console.log(`Repository: ${githubData.username}/${randomRepo.name}`)
      console.log(`Language: ${randomRepo.language || 'N/A'}`)
      console.log(`URL: ${randomRepo.url}`)
      console.log(`Files Analyzed: ${codeFiles.length}`)
      console.log('Code Review Summary:')
      console.log(JSON.stringify(codeReview, null, 2))
      console.log('='.repeat(60) + '\n')

      return result
    } catch (error) {
      console.error('❌ User repository analysis error:', error.message)
      return {
        status: 'error',
        error: error.message,
      }
    }
  }

  extractResumeInfo(resumeData, skillKeywords = []) {
    return {
      fullText: resumeData,
      skills: this.extractSkills(resumeData, skillKeywords),
      projects: this.extractProjects(resumeData),
      experience: this.extractExperience(resumeData),
      education: this.extractEducation(resumeData),
    }
  }

  extractSkills(text, skillKeywords = []) {
    // Use provided skills or default
    const keywords = skillKeywords.length > 0 ? skillKeywords : getDefaultSkills()
    const skills = []
    keywords.forEach((skill) => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill)
      }
    })
    return skills
  }

  extractProjects(text) {
    const projectRegex = /project[s]?[:\s]*([\s\S]*?)(?=education|experience|skills|$)/i
    const match = text.match(projectRegex)
    return match ? [match[1].trim()] : []
  }

  extractExperience(text) {
    const expRegex = /experience[:\s]*([\s\S]*?)(?=education|projects|skills|$)/i
    const match = text.match(expRegex)
    return match ? match[1].trim() : ''
  }

  extractEducation(text) {
    const eduRegex = /education[:\s]*([\s\S]*?)(?=experience|projects|skills|$)/i
    const match = text.match(eduRegex)
    return match ? match[1].trim() : ''
  }

  calculateScores(resumeInfo, githubData, aiAnalysis) {
    const scores = {
      skills: this.calculateSkillsScore(resumeInfo, githubData, aiAnalysis),
      projects: this.calculateProjectsScore(resumeInfo, githubData, aiAnalysis),
      experience: this.calculateExperienceScore(resumeInfo, githubData, aiAnalysis),
    }

    // FIX 1: weights are decimals (0.35 etc.), sub-scores are 0–100
    // so the weighted sum is already 0–100. Just round it.
    scores.overall = Math.round(
      scores.skills   * this.weights.skills   +
      scores.projects  * this.weights.projects  +
      scores.experience * this.weights.experience
    )

    return scores
  }

  calculateSkillsScore(resumeInfo, githubData, aiAnalysis) {
    let score = 80 // Base score

    if (githubData.languages && githubData.languages.length > 0) {
      const verifiedSkills = resumeInfo.skills.filter((skill) =>
        githubData.languages.some((lang) =>
          lang.toLowerCase().includes(skill.toLowerCase()),
        ),
      )
      score += verifiedSkills.length * 3 // Bonus for verified skills
    }

    // Apply consistency penalties
    if (aiAnalysis.skillsConsistency === 'low') {
      score -= 10 // Penalty for low consistency
    } else if (aiAnalysis.skillsConsistency === 'medium') {
      score -= 3 // Small penalty for medium consistency
    }

    // Apply red flag penalties
    if (aiAnalysis.suspicionFlags) {
      const skillFlags = aiAnalysis.suspicionFlags.filter(flag => 
        flag.toLowerCase().includes('skill') || 
        flag.toLowerCase().includes('unverified') ||
        flag.toLowerCase().includes('mismatch')
      )
      score -= skillFlags.length * 8 // -8 per skill-related flag
    }

    return Math.max(0, Math.min(100, score))
  }

  calculateProjectsScore(resumeInfo, githubData, aiAnalysis) {
    let score = 80 // Base score

    if (githubData.publicRepos && githubData.publicRepos > 0) {
      score += Math.min(githubData.publicRepos, 15) // Bonus for public repos
    }

    // Apply consistency penalties
    if (aiAnalysis.projectsConsistency === 'low') {
      score -= 10 // Penalty for low consistency
    } else if (aiAnalysis.projectsConsistency === 'medium') {
      score -= 5 // Penalty for medium consistency
    }

    // Apply red flag penalties
    if (aiAnalysis.suspicionFlags) {
      const projectFlags = aiAnalysis.suspicionFlags.filter(flag => 
        flag.toLowerCase().includes('project') || 
        flag.toLowerCase().includes('repository') ||
        flag.toLowerCase().includes('github evidence')
      )
      score -= projectFlags.length * 8 // -8 per project-related flag
    }

    return Math.max(0, Math.min(100, score))
  }

  calculateExperienceScore(resumeInfo, githubData, aiAnalysis) {
    let score = 80 // Base score

    // Bonus if experience is mentioned in resume
    if (resumeInfo.experience && resumeInfo.experience.length > 0) {
      score += 10
    }

    // Apply consistency penalties
    if (aiAnalysis.experienceConsistency === 'low') {
      score -= 10 // Penalty for low consistency
    } else if (aiAnalysis.experienceConsistency === 'medium') {
      score -= 5 // Penalty for medium consistency
    }

    // Apply red flag penalties
    if (aiAnalysis.suspicionFlags) {
      const experienceFlags = aiAnalysis.suspicionFlags.filter(flag => 
        flag.toLowerCase().includes('experience') || 
        flag.toLowerCase().includes('gap')
      )
      score -= experienceFlags.length * 8 // -8 per experience-related flag
    }

    return Math.max(0, Math.min(100, score))
  }

  determineVerdict(scores, aiAnalysis) {
    const overallScore = scores.overall
    const flagCount = (aiAnalysis.suspicionFlags || []).length

    // Apply verdict based on flags and score
    if (flagCount >= 3) {
      return 'Needs Verification'
    }

    if (overallScore >= 70) {
      return 'Trusted'
    }

    if (overallScore >= 50 && overallScore < 70) {
      return 'Acceptable'
    }

    return 'Needs Review'
  }

  generateExplanation(scores, aiAnalysis) {
    let explanation = ''

    if (scores.skills >= 75) {
      explanation += `✅ Skills are well-verified on GitHub. `
    } else if (scores.skills >= 50) {
      explanation += `⚠️ Some claimed skills lack GitHub verification. `
    } else {
      explanation += `❌ Skills show significant inconsistencies. `
    }

    if (scores.projects >= 75) {
      explanation += `✅ Project portfolio demonstrates strong capability. `
    } else if (scores.projects >= 50) {
      explanation += `⚠️ Limited project evidence or activity. `
    } else {
      explanation += `❌ Projects show major discrepancies. `
    }

    if (scores.experience >= 75) {
      explanation += `✅ Experience is well-documented and verified. `
    } else if (scores.experience >= 50) {
      explanation += `⚠️ Some experience claims need verification. `
    } else {
      explanation += `❌ Experience shows potential red flags. `
    }

    if (aiAnalysis.reasoning) {
      explanation += `\n\n🧠 AI Analysis: ${aiAnalysis.reasoning}`
    }

    return explanation
  }
}

export const trustEngine = new TrustEngine()