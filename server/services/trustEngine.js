// trustEngine.js - Core TrustScore calculation engine
import { geminiService } from './geminiService.js'
import { githubService } from './githubService.js'
import { timelineChecker } from './timelineChecker.js'
import { TRUST_SCORE_WEIGHTS, VERDICT_RULES } from '../config/constants.js'

export class TrustEngine {
  constructor() {
    this.weights = TRUST_SCORE_WEIGHTS
  }

  async analyzeCandidateProfile(resumeData, githubUsername) {
    try {
      console.log('🔍 Starting TrustScore analysis...')

      // Step 1: Extract resume information
      const resumeInfo = this.extractResumeInfo(resumeData)
      console.log('📄 Resume parsed:', Object.keys(resumeInfo))

      // Step 2: Fetch GitHub data
      let githubData = {}
      if (githubUsername) {
        githubData = await githubService.fetchUserData(githubUsername)
        console.log('🐙 GitHub data fetched')
      }

      // Step 3: AI-powered comparison
      const aiAnalysis = await geminiService.analyzeCandidate({
        resume: resumeInfo,
        github: githubData,
      })
      console.log('🧠 AI analysis complete')

      // Step 4: Timeline validation
      const timelineValidation = timelineChecker.validateTimeline(
        resumeInfo,
        githubData,
      )
      console.log('⏰ Timeline validation complete')

      // Step 5: Calculate scores
      const scores = this.calculateScores(
        resumeInfo,
        githubData,
        aiAnalysis,
        timelineValidation,
      )

      // Step 6: Determine verdict
      const verdict = this.determineVerdict(scores, aiAnalysis)

      // Step 7: Generate explanation
      const explanation = this.generateExplanation(
        scores,
        aiAnalysis,
        timelineValidation,
      )

      const trustScore = {
        trustScore: scores.overall,
        verdict,
        breakdown: {
          skills: scores.skills,
          projects: scores.projects,
          experience: scores.experience,
        },
        flags: aiAnalysis.flags || [],
        explanation,
        rawAnalysis: aiAnalysis,
        timestamp: new Date().toISOString(),
      }

      return trustScore
    } catch (error) {
      console.error('❌ TrustEngine error:', error)
      throw error
    }
  }

  extractResumeInfo(resumeData) {
    // Basic extraction - in production, use more sophisticated parsing
    return {
      fullText: resumeData,
      skills: this.extractSkills(resumeData),
      projects: this.extractProjects(resumeData),
      experience: this.extractExperience(resumeData),
      education: this.extractEducation(resumeData),
    }
  }

  extractSkills(text) {
    // Simple skill extraction - in production, use ML or Gemini
    const skillKeywords = [
      'javascript',
      'react',
      'node',
      'python',
      'sql',
      'mongodb',
      'typescript',
      'express',
      'next',
      'vue',
      'angular',
      'aws',
      'docker',
      'kubernetes',
      'git',
      'rest api',
      'graphql',
      'microservices',
    ]

    const skills = []
    skillKeywords.forEach((skill) => {
      if (text.toLowerCase().includes(skill)) {
        skills.push(skill)
      }
    })
    return skills
  }

  extractProjects(text) {
    // Simple project extraction
    const projectRegex = /project[s]?[:\s]*([\s\S]*?)(?=education|experience|skills|$)/i
    const match = text.match(projectRegex)
    return match ? [match[1].trim()] : []
  }

  extractExperience(text) {
    // Simple experience extraction
    const expRegex = /experience[:\s]*([\s\S]*?)(?=education|projects|skills|$)/i
    const match = text.match(expRegex)
    return match ? match[1].trim() : ''
  }

  extractEducation(text) {
    // Simple education extraction
    const eduRegex = /education[:\s]*([\s\S]*?)(?=experience|projects|skills|$)/i
    const match = text.match(eduRegex)
    return match ? match[1].trim() : ''
  }

  calculateScores(resumeInfo, githubData, aiAnalysis, timelineValidation) {
    const scores = {
      skills: this.calculateSkillsScore(resumeInfo, githubData, aiAnalysis),
      projects: this.calculateProjectsScore(resumeInfo, githubData, aiAnalysis),
      experience: this.calculateExperienceScore(
        resumeInfo,
        githubData,
        aiAnalysis,
      ),
      timeline: timelineValidation.score || 0,
    }

    // Calculate weighted overall score
    scores.overall =
      scores.skills * this.weights.skills +
      scores.projects * this.weights.projects +
      scores.experience * this.weights.experience +
      scores.timeline * this.weights.timeline

    return scores
  }

  calculateSkillsScore(resumeInfo, githubData, aiAnalysis) {
    let score = 70 // Base score

    // Bonus: verified skills in GitHub
    if (githubData.languages) {
      const verifiedSkills = resumeInfo.skills.filter((skill) =>
        githubData.languages.some((lang) =>
          lang.toLowerCase().includes(skill.toLowerCase()),
        ),
      )
      score += verifiedSkills.length * 5
    }

    // Penalty: AI detected inconsistencies
    if (aiAnalysis.skillsConsistency === 'low') {
      score -= 30
    } else if (aiAnalysis.skillsConsistency === 'medium') {
      score -= 10
    }

    // Penalty: Claimed skills with no GitHub evidence
    const unverifiedSkills = resumeInfo.skills.length - (githubData.languages?.length || 0)
    if (unverifiedSkills > resumeInfo.skills.length * 0.5) {
      score -= 15
    }

    return Math.max(0, Math.min(100, score))
  }

  calculateProjectsScore(resumeInfo, githubData, aiAnalysis) {
    let score = 60 // Base score

    // Bonus: GitHub repos
    if (githubData.publicRepos) {
      score += Math.min(githubData.publicRepos * 3, 25)
    }

    // Bonus: High quality projects
    if (githubData.stars && githubData.stars > 10) {
      score += 20
    }

    // Penalty: AI detected project inconsistencies
    if (aiAnalysis.projectsConsistency === 'low') {
      score -= 35
    } else if (aiAnalysis.projectsConsistency === 'medium') {
      score -= 15
    }

    return Math.max(0, Math.min(100, score))
  }

  calculateExperienceScore(resumeInfo, githubData, aiAnalysis) {
    let score = 65 // Base score

    // Bonus: GitHub activity shows consistency
    if (githubData.yearsSinceCreated && githubData.yearsSinceCreated > 3) {
      score += 15
    }

    // Bonus: Regular contributions
    if (githubData.contributions > 100) {
      score += 15
    }

    // Penalty: AI detected experience inconsistencies
    if (aiAnalysis.experienceConsistency === 'low') {
      score -= 30
    } else if (aiAnalysis.experienceConsistency === 'medium') {
      score -= 12
    }

    return Math.max(0, Math.min(100, score))
  }

  determineVerdict(scores, aiAnalysis) {
    const overallScore = scores.overall

    if (aiAnalysis.suspicionFlags && aiAnalysis.suspicionFlags.length > 3) {
      return 'High Risk'
    }

    if (overallScore >= 75 && aiAnalysis.skillsConsistency !== 'low') {
      return 'Trusted'
    }

    if (overallScore >= 50 && overallScore < 75) {
      return 'Suspicious'
    }

    return 'High Risk'
  }

  generateExplanation(scores, aiAnalysis, timelineValidation) {
    let explanation = ''

    // Skills analysis
    if (scores.skills >= 75) {
      explanation += `✅ Skills are well-verified on GitHub. `
    } else if (scores.skills >= 50) {
      explanation += `⚠️ Some claimed skills lack GitHub verification. `
    } else {
      explanation += `❌ Skills show significant inconsistencies. `
    }

    // Projects analysis
    if (scores.projects >= 75) {
      explanation += `✅ Project portfolio demonstrates strong capability. `
    } else if (scores.projects >= 50) {
      explanation += `⚠️ Limited project evidence or activity. `
    } else {
      explanation += `❌ Projects show major discrepancies. `
    }

    // Experience analysis
    if (scores.experience >= 75) {
      explanation += `✅ Experience timeline is consistent and verifiable. `
    } else if (scores.experience >= 50) {
      explanation += `⚠️ Some experience claims need verification. `
    } else {
      explanation += `❌ Experience shows potential red flags. `
    }

    // Timeline analysis
    if (timelineValidation.isValid) {
      explanation += `✅ Timeline validation passed. `
    } else {
      explanation += `⚠️ Timeline shows potential gaps or overlaps. `
    }

    // AI insights
    if (aiAnalysis.reasoning) {
      explanation += `\n\n🧠 AI Analysis: ${aiAnalysis.reasoning}`
    }

    return explanation
  }
}

export const trustEngine = new TrustEngine()
