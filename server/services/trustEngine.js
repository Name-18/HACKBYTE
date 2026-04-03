// trustEngine.js - Core TrustScore calculation engine
import { geminiService } from './geminiService.js'
import { githubService } from './githubService.js'
import { timelineChecker } from './timelineChecker.js'

export class TrustEngine {
  constructor() {
    this.weights = {
      skills: 0.35,
      projects: 0.35,
      experience: 0.20,
      timeline: 0.10,
    }
  }

  async analyzeCandidateProfile(resumeData, githubUsername) {
    try {
      console.log('🔍 Starting TrustScore analysis...')

      const resumeInfo = this.extractResumeInfo(resumeData)
      console.log('📄 Resume parsed:', Object.keys(resumeInfo))

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

      const timelineValidation = timelineChecker.validateTimeline(
        resumeInfo,
        githubData,
      )
      console.log('⏰ Timeline validation complete')

      const scores = this.calculateScores(
        resumeInfo,
        githubData,
        aiAnalysis,
        timelineValidation,
      )

      const verdict = this.determineVerdict(scores, aiAnalysis)

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
        // FIX 2: was aiAnalysis.flags (always undefined) → correct key
        flags: aiAnalysis.suspicionFlags || [],
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
    return {
      fullText: resumeData,
      skills: this.extractSkills(resumeData),
      projects: this.extractProjects(resumeData),
      experience: this.extractExperience(resumeData),
      education: this.extractEducation(resumeData),
    }
  }

  extractSkills(text) {
    const skillKeywords = [
      'javascript', 'react', 'node', 'python', 'sql', 'mongodb',
      'typescript', 'express', 'next', 'vue', 'angular', 'aws',
      'docker', 'kubernetes', 'git', 'rest api', 'graphql', 'microservices',
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

  calculateScores(resumeInfo, githubData, aiAnalysis, timelineValidation) {
    const scores = {
      skills: this.calculateSkillsScore(resumeInfo, githubData, aiAnalysis),
      projects: this.calculateProjectsScore(resumeInfo, githubData, aiAnalysis),
      experience: this.calculateExperienceScore(resumeInfo, githubData, aiAnalysis),
      timeline: timelineValidation.score || 0,
    }

    // FIX 1: weights are decimals (0.35 etc.), sub-scores are 0–100
    // so the weighted sum is already 0–100. Just round it.
    scores.overall = Math.round(
      scores.skills   * this.weights.skills   +
      scores.projects  * this.weights.projects  +
      scores.experience * this.weights.experience +
      scores.timeline  * this.weights.timeline
    )

    return scores
  }

  calculateSkillsScore(resumeInfo, githubData, aiAnalysis) {
    let score = 70 // Base score

    if (githubData.languages) {
      const verifiedSkills = resumeInfo.skills.filter((skill) =>
        githubData.languages.some((lang) =>
          lang.toLowerCase().includes(skill.toLowerCase()),
        ),
      )
      score += verifiedSkills.length * 5
    }

    if (aiAnalysis.skillsConsistency === 'low') {
      score -= 30
    } else if (aiAnalysis.skillsConsistency === 'medium') {
      score -= 10
    }

    const unverifiedSkills =
      resumeInfo.skills.length - (githubData.languages?.length || 0)
    if (unverifiedSkills > resumeInfo.skills.length * 0.5) {
      score -= 15
    }

    return Math.max(0, Math.min(100, score))
  }

  calculateProjectsScore(resumeInfo, githubData, aiAnalysis) {
    let score = 60 // Base score

    if (githubData.publicRepos) {
      score += Math.min(githubData.publicRepos * 3, 25)
    }

    if (githubData.stars && githubData.stars > 10) {
      score += 20
    }

    if (aiAnalysis.projectsConsistency === 'low') {
      score -= 35
    } else if (aiAnalysis.projectsConsistency === 'medium') {
      score -= 15
    }

    return Math.max(0, Math.min(100, score))
  }

  calculateExperienceScore(resumeInfo, githubData, aiAnalysis) {
    let score = 65 // Base score

    if (githubData.yearsSinceCreated && githubData.yearsSinceCreated > 3) {
      score += 15
    }

    if (githubData.contributions > 100) {
      score += 15
    }

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
      explanation += `✅ Experience timeline is consistent and verifiable. `
    } else if (scores.experience >= 50) {
      explanation += `⚠️ Some experience claims need verification. `
    } else {
      explanation += `❌ Experience shows potential red flags. `
    }

    if (timelineValidation.isValid) {
      explanation += `✅ Timeline validation passed. `
    } else {
      explanation += `⚠️ Timeline shows potential gaps or overlaps. `
    }

    if (aiAnalysis.reasoning) {
      explanation += `\n\n🧠 AI Analysis: ${aiAnalysis.reasoning}`
    }

    return explanation
  }
}

export const trustEngine = new TrustEngine()