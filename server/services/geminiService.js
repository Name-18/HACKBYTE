// geminiService.js - Gemini API integration for AI analysis
import { GoogleGenerativeAI } from '@google/generative-ai'

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found in environment')
    }
    this.client = new GoogleGenerativeAI(apiKey)
  }

  async analyzeCandidate(data) {
    try {
      const { resume, github } = data

      const prompt = this.generateAnalysisPrompt(resume, github)

      const model = this.client.getGenerativeModel({
        model: 'gemini-pro',
      })

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      return this.parseAnalysisResponse(responseText, resume, github)
    } catch (error) {
      console.error('❌ Gemini API error:', error)
      // Return default analysis if API fails
      return this.getDefaultAnalysis(data)
    }
  }

  generateAnalysisPrompt(resume, github) {
    return `
You are a professional hiring expert analyzing a candidate's profile for authenticity.

RESUME DATA:
Skills: ${resume.skills?.join(', ') || 'N/A'}
Projects: ${resume.projects?.join(', ') || 'N/A'}
Experience: ${resume.experience || 'N/A'}
Education: ${resume.education || 'N/A'}

GITHUB DATA:
Username: ${github.username || 'N/A'}
Public Repos: ${github.publicRepos || 0}
Followers: ${github.followers || 0}
Total Stars: ${github.stars || 0}
Languages: ${github.languages?.join(', ') || 'N/A'}
Contributions (Last Year): ${github.contributions || 0}
Years Active: ${github.yearsSinceCreated || 0}

Analyze the following:
1. Do the claimed skills match the GitHub profile?
2. Are there any red flags or inconsistencies?
3. Is the project portfolio impressive relative to claims?
4. Does the contribution history support the experience claims?
5. Any signs of exaggeration or misrepresentation?

Provide your analysis in JSON format with these fields:
{
  "skillsConsistency": "high|medium|low",
  "projectsConsistency": "high|medium|low",
  "experienceConsistency": "high|medium|low",
  "suspicionFlags": ["flag1", "flag2"],
  "reasoning": "detailed explanation",
  "overallAssessment": "genuine|questionable|fabricated"
}
`
  }

  parseAnalysisResponse(responseText, resume, github) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed
      }

      // Fallback parsing
      return {
        skillsConsistency: this.detectConsistency(
          responseText,
          'skills',
        ),
        projectsConsistency: this.detectConsistency(
          responseText,
          'project',
        ),
        experienceConsistency: this.detectConsistency(
          responseText,
          'experience',
        ),
        suspicionFlags: this.extractFlags(responseText),
        reasoning: responseText.substring(0, 500),
        overallAssessment: responseText.toLowerCase().includes('genuine')
          ? 'genuine'
          : 'questionable',
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error)
      return this.getDefaultAnalysis({ resume, github })
    }
  }

  detectConsistency(text, keyword) {
    const lowerText = text.toLowerCase()
    if (
      lowerText.includes(`${keyword} inconsistent`) ||
      lowerText.includes(`${keyword} mismatch`)
    ) {
      return 'low'
    }
    if (
      lowerText.includes(`${keyword} partially`) ||
      lowerText.includes(`some ${keyword}`)
    ) {
      return 'medium'
    }
    return 'high'
  }

  extractFlags(text) {
    const flags = []
    const badKeywords = [
      'exaggerat',
      'fabricat',
      'inconsisten',
      'red flag',
      'mislead',
      'dishonest',
      'falsif',
      'gap',
      'inactivit',
    ]

    badKeywords.forEach((keyword) => {
      if (text.toLowerCase().includes(keyword)) {
        flags.push(`Detected: ${keyword}`)
      }
    })

    return flags
  }

  getDefaultAnalysis(data) {
    const { resume, github } = data

    // Create a simple heuristic analysis
    let skillsConsistency = 'medium'
    let projectsConsistency = 'medium'
    let experienceConsistency = 'medium'
    const flags = []

    // Check for skill verification
    if (github.languages && github.languages.length > 0) {
      const verifiedSkills = (resume.skills || []).filter((skill) =>
        github.languages.some((lang) =>
          lang.toLowerCase().includes(skill.toLowerCase()),
        ),
      )
      skillsConsistency =
        verifiedSkills.length / Math.max(resume.skills.length, 1) > 0.5
          ? 'high'
          : 'low'
    } else if (!resume.skills || resume.skills.length === 0) {
      skillsConsistency = 'low'
    }

    // Check for project evidence
    if (github.publicRepos && github.publicRepos > 0) {
      projectsConsistency = github.publicRepos >= 5 ? 'high' : 'medium'
    } else if (resume.projects && resume.projects.length > 0) {
      projectsConsistency = 'medium'
      flags.push('Projects claimed but no GitHub evidence')
    } else {
      projectsConsistency = 'low'
    }

    // Check for activity
    if (github.contributions && github.contributions < 10) {
      flags.push('Low GitHub activity')
      experienceConsistency = 'low'
    } else if (github.yearsSinceCreated && github.yearsSinceCreated < 1) {
      flags.push('New GitHub account')
      experienceConsistency = 'medium'
    }

    return {
      skillsConsistency,
      projectsConsistency,
      experienceConsistency,
      suspicionFlags: flags,
      reasoning:
        'Analysis based on GitHub profile verification and resume claims.',
      overallAssessment:
        flags.length > 2
          ? 'questionable'
          : skillsConsistency === 'high'
            ? 'genuine'
            : 'questionable',
    }
  }
}

export const geminiService = new GeminiService()
