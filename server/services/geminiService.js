// geminiService.js - Gemini API integration for AI analysis
import { GoogleGenAI } from '@google/genai'

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn('⚠️  [Gemini] GEMINI_API_KEY not found in environment')
    } else {
      console.log('✅ [Gemini] API key loaded:', apiKey.slice(0, 6) + '...' + apiKey.slice(-4))
    }
    this.client = new GoogleGenAI({ apiKey })
  }

  async analyzeCandidate(data) {
    try {
      const { resume, github } = data
      const prompt = this.generateAnalysisPrompt(resume, github)

      console.log('📤 [Gemini] Sending request to gemini-2.5-flash...')
      console.log('📋 [Gemini] Prompt preview:', prompt.slice(0, 200).trim(), '...')

      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      })

      console.log('📥 [Gemini] Raw response received')
      console.log('📝 [Gemini] Response text preview:', response.text?.slice(0, 300))

      const parsed = this.parseAnalysisResponse(response.text, resume, github)
      console.log('✅ [Gemini] Parsed analysis:', JSON.stringify(parsed, null, 2))

      return parsed
    } catch (error) {
      console.error('❌ [Gemini] API call failed!')
      console.error('   Status :', error.status ?? 'N/A')
      console.error('   Message:', error.message)
      console.error('   Stack  :', error.stack)
      console.warn('⚠️  [Gemini] Falling back to heuristic analysis')
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
      console.log('🔍 [Gemini] Attempting JSON parse from response...')
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        console.log('✅ [Gemini] JSON parsed successfully')
        console.log('   skillsConsistency    :', parsed.skillsConsistency)
        console.log('   projectsConsistency  :', parsed.projectsConsistency)
        console.log('   experienceConsistency:', parsed.experienceConsistency)
        console.log('   suspicionFlags       :', parsed.suspicionFlags)
        console.log('   overallAssessment    :', parsed.overallAssessment)
        return parsed
      }

      console.warn('⚠️  [Gemini] No JSON block found in response, using fallback text parser')
      return {
        skillsConsistency: this.detectConsistency(responseText, 'skills'),
        projectsConsistency: this.detectConsistency(responseText, 'project'),
        experienceConsistency: this.detectConsistency(responseText, 'experience'),
        suspicionFlags: this.extractFlags(responseText),
        reasoning: responseText.substring(0, 500),
        overallAssessment: responseText.toLowerCase().includes('genuine')
          ? 'genuine'
          : 'questionable',
      }
    } catch (error) {
      console.error('❌ [Gemini] Failed to parse response JSON:', error.message)
      console.warn('⚠️  [Gemini] Using heuristic fallback after parse failure')
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
      'exaggerat', 'fabricat', 'inconsisten', 'red flag',
      'mislead', 'dishonest', 'falsif', 'gap', 'inactivit',
    ]
    badKeywords.forEach((keyword) => {
      if (text.toLowerCase().includes(keyword)) {
        flags.push(`Detected: ${keyword}`)
      }
    })
    return flags
  }

  getDefaultAnalysis(data) {
    console.log('🔄 [Gemini] Running heuristic (offline) analysis...')
    const { resume, github } = data

    let skillsConsistency = 'medium'
    let projectsConsistency = 'medium'
    let experienceConsistency = 'medium'
    const flags = []

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

    if (github.publicRepos && github.publicRepos > 0) {
      projectsConsistency = github.publicRepos >= 5 ? 'high' : 'medium'
    } else if (resume.projects && resume.projects.length > 0) {
      projectsConsistency = 'medium'
      flags.push('Projects claimed but no GitHub evidence')
    } else {
      projectsConsistency = 'low'
    }

    if (github.contributions && github.contributions < 10) {
      flags.push('Low GitHub activity')
      experienceConsistency = 'low'
    } else if (github.yearsSinceCreated && github.yearsSinceCreated < 1) {
      flags.push('New GitHub account')
      experienceConsistency = 'medium'
    }

    const result = {
      skillsConsistency,
      projectsConsistency,
      experienceConsistency,
      suspicionFlags: flags,
      reasoning: 'Analysis based on GitHub profile verification and resume claims.',
      overallAssessment:
        flags.length > 2
          ? 'questionable'
          : skillsConsistency === 'high'
            ? 'genuine'
            : 'questionable',
    }

    console.log('✅ [Gemini] Heuristic result:', JSON.stringify(result, null, 2))
    return result
  }
}

export const geminiService = new GeminiService()