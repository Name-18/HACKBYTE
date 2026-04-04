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

      console.log('\n📊 ===== CANDIDATE PROFILE ANALYSIS =====')
      console.log('\n📋 RESUME DATA EXTRACTED:')
      console.log(`   • Skills Found: ${resume.skills?.length || 0} - ${resume.skills?.join(', ') || 'None'}`)
      console.log(`   • Projects: ${resume.projects?.length || 0}`)
      console.log(`   • Experience: ${resume.experience ? resume.experience.substring(0, 100) + '...' : 'None'}`)
      console.log(`   • Education: ${resume.education ? resume.education.substring(0, 100) + '...' : 'None'}`)

      console.log('\n🐙 GITHUB DATA EXTRACTED:')
      console.log(`   • Username: ${github.username || 'N/A'}`)
      console.log(`   • Public Repos: ${github.publicRepos || 0}`)
      console.log(`   • Followers: ${github.followers || 0}`)
      console.log(`   • Languages: ${github.languages?.length || 0} - ${github.languages?.join(', ') || 'None'}`)
      console.log(`   • Followers: ${github.followers || 0}`)

      console.log('\n🔍 COMPARING PARAMETERS:')
      console.log('   ✓ Skills consistency (resume vs GitHub)')
      console.log('   ✓ Projects consistency (resume vs GitHub profile)')
      console.log('   ✓ Experience authenticity')
      console.log('   ✓ Overall profile coherence')

      const prompt = this.generateAnalysisPrompt(resume, github)

      console.log('\n📤 Sending to Gemini for professional analysis...')
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      })

      console.log('📥 Analysis response received')
      const parsed = this.parseAnalysisResponse(response.text, resume, github)

      console.log('\n📊 ===== ANALYSIS RESULTS =====')
      console.log(`   Skills Consistency: ${parsed.skillsConsistency}`)
      console.log(`   Projects Consistency: ${parsed.projectsConsistency}`)
      console.log(`   Experience Consistency: ${parsed.experienceConsistency}`)
      console.log(`   Suspension Flags: ${parsed.suspicionFlags?.length || 0}`)
      if (parsed.suspicionFlags?.length > 0) {
        console.log('\n   🚨 RED FLAGS DETECTED:')
        parsed.suspicionFlags.forEach((flag, idx) => console.log(`      ${idx + 1}. ${flag}`))
      }
      console.log(`   Overall Assessment: ${parsed.overallAssessment?.toUpperCase()}`)

      return parsed
    } catch (error) {
      console.error('❌ [Gemini] API call failed!')
      console.error('   Status :', error.status ?? 'N/A')
      console.error('   Message:', error.message)
      console.warn('⚠️  [Gemini] Falling back to heuristic analysis')
      return this.getDefaultAnalysis(data)
    }
  }

  generateAnalysisPrompt(resume, github) {
    return `
You are a professional hiring expert analyzing a candidate's profile for authenticity.
Be FAIR and BALANCED - not harsh, but objective. Identify red flags clearly.

RESUME DATA:
Skills: ${resume.skills?.join(', ') || 'N/A'}
Projects: ${resume.projects?.join(', ') || 'N/A'}
Experience: ${resume.experience || 'N/A'}
Education: ${resume.education || 'N/A'}

GITHUB DATA (IF AVAILABLE):
Username: ${github.username || 'N/A'}
Public Repos: ${github.publicRepos || 0}
Followers: ${github.followers || 0}
Languages: ${github.languages?.join(', ') || 'N/A'}

ANALYZE AND IDENTIFY:
1. Do claimed skills match GitHub languages/projects?
2. Are there major inconsistencies between resume and GitHub?
3. Is project portfolio credible and described well?
4. Does experience description sound authentic?
5. Are there any RED FLAGS?

RED FLAGS TO IDENTIFY:
- Skills claimed but no evidence in GitHub (high count of unverified skills)
- Projects mentioned but no GitHub evidence
- Suspicious gaps or timeline issues
- Over-exaggeration of abilities
- Conflicting information between resume and GitHub

FAIR ASSESSMENT RULES:
- It's OK to lack GitHub evidence if candidate is new or transitioning
- Learning and growth are positive signals
- Minor inconsistencies are acceptable
- BUT clearly identify if major discrepancies exist
- If multiple red flags detected, note them explicitly

Provide BALANCED analysis in JSON format:
{
  "skillsConsistency": "high|medium|low",
  "projectsConsistency": "high|medium|low",
  "experienceConsistency": "high|medium|low",
  "suspicionFlags": ["clear flag 1", "clear flag 2"],
  "reasoning": "detailed explanation with specifics",
  "overallAssessment": "genuine|questionable|fabricated"
}

RED FLAGS MUST BE SPECIFIC: Instead of generic flags, provide actual concerns like:
- "7 out of 9 skills have no GitHub verification"
- "Java and C# claimed, but GitHub shows only JavaScript projects"
- "Senior developer experience claimed, but 0 public repositories"
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
      projectsConsistency = 'high'
    } else if (resume.projects && resume.projects.length > 0) {
      projectsConsistency = 'high'
    } else {
      projectsConsistency = 'medium'
    }

    // Do NOT check GitHub contributions or years since created
    // Be more lenient with experience consistency
    experienceConsistency = 'medium'

    const result = {
      skillsConsistency,
      projectsConsistency,
      experienceConsistency,
      suspicionFlags: flags,
      reasoning: 'Analysis based on resume claims and available GitHub profile verification.',
      overallAssessment:
        flags.length > 3
          ? 'questionable'
          : skillsConsistency === 'high'
            ? 'genuine'
            : 'genuine',
    }

    console.log('✅ [Gemini] Heuristic result:', JSON.stringify(result, null, 2))
    return result
  }

  async reviewCodeQuality(codeFiles, repoInfo) {
    try {
      console.log('\n📊 ===== CODE QUALITY REVIEW ANALYSIS =====')
      console.log(`\n📁 Repository: ${repoInfo.owner}/${repoInfo.name}`)
      console.log(`🔤 Language: ${repoInfo.language}`)
      console.log(`📝 Description: ${repoInfo.description}`)

      console.log(`\n📄 Files to Analyze: ${codeFiles.length}`)
      codeFiles.forEach((file, idx) => {
        console.log(`   ${idx + 1}. ${file.path} (${file.language}) - ${file.content.length} characters`)
      })

      console.log('\n🔍 Analyzing Code Quality...')
      console.log('   ✓ Code structure & organization')
      console.log('   ✓ Readability & naming conventions')
      console.log('   ✓ Performance & efficiency')
      console.log('   ✓ Security concerns')
      console.log('   ✓ Best practices adherence')
      console.log('   ✓ Developer skill level')

      const codePreview = codeFiles.map(file =>
        `FILE: ${file.path} (${file.language})\n\`\`\`${file.language.toLowerCase()}\n${file.content.substring(0, 500)}...\n\`\`\``
      ).join('\n\n')

      const prompt = this.generateCodeReviewPrompt(codePreview, repoInfo)

      console.log('\n📤 Sending to Gemini for professional evaluation...')
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      })

      console.log('📥 Review response received')
      const parsed = this.parseCodeReviewResponse(response.text)

      console.log('\n📋 ===== CODE REVIEW RESULTS =====')
      console.log(`Overall Quality: ${parsed.overallQuality?.toUpperCase()}`)
      console.log(`Readability: ${parsed.codeReadability}`)
      console.log(`Performance: ${parsed.performanceRating}`)
      console.log(`Skill Level: ${parsed.skillLevel}`)
      console.log(`Score: ${parsed.score}/100`)

      if (parsed.securityConcerns?.length > 0) {
        console.log(`\n🔒 Security Issues Found:`)
        parsed.securityConcerns.forEach(concern => console.log(`   ⚠️  ${concern}`))
      } else {
        console.log('\n🔒 Security: No concerns identified')
      }

      if (parsed.bestPractices?.length > 0) {
        console.log(`\n✅ Best Practices Found:`)
        parsed.bestPractices.forEach(practice => console.log(`   ✓ ${practice}`))
      }

      if (parsed.improvementAreas?.length > 0) {
        console.log(`\n📈 Areas for Improvement:`)
        parsed.improvementAreas.forEach(area => console.log(`   → ${area}`))
      }

      console.log(`\n💪 Strengths: ${parsed.mainStrengths}`)
      console.log(`⚡ Weaknesses: ${parsed.mainWeaknesses}`)
      console.log(`🎯 Expertise: ${parsed.demonstratedExpertise}`)
      console.log('\n✅ Code quality review complete\n')

      return parsed
    } catch (error) {
      console.error('❌ [Gemini] Code review failed!')
      console.error('   Message:', error.message)
      console.warn('⚠️  [Gemini] Falling back to basic code analysis')
      return this.getDefaultCodeReview()
    }
  }

  generateCodeReviewPrompt(codePreview, repoInfo) {
    return `
You are a PROFESSIONAL code reviewer. Evaluate code FAIRLY and OBJECTIVELY.
Be reasonable but NOT lenient. Identify serious issues clearly and REDUCE SCORE FOR RED FLAGS.

Your task:
1. Evaluate code quality, readability, performance, security
2. Identify RED FLAGS and CRITICAL ISSUES
3. Give HONEST scores reflecting actual code quality
4. PENALIZE severely for security/serious issues
5. Explain each rating with specific examples

-------------------------------------
REPOSITORY: ${repoInfo.name} (${repoInfo.language})
Location: github.com/${repoInfo.owner}/${repoInfo.name}
Description: ${repoInfo.description}

CODE SAMPLES FOR REVIEW:
${codePreview}
-------------------------------------

❌ CRITICAL RED FLAGS (MAJOR SCORE REDUCTIONS):
- Hardcoded credentials, API keys, or secrets → -30 to -40 points
- SQL injection vulnerabilities → -30 to -40 points
- No input validation with user data → -20 to -30 points
- XSS vulnerabilities → -25 to -35 points
- Code with zero error handling → -20 points
- Massive code duplication (DRY violation) → -15 points
- No documentation/comments whatsoever → -10 points
- Performance issues (inefficient algorithms) → -15 points

✅ EVALUATION CRITERIA:

CODE QUALITY:
- Well-structured and organized? ✓/✗
- Functions/methods appropriately sized? ✓/✗
- Proper error handling present? ✓/✗
- Edge cases considered? ✓/✗
→ Rate: excellent → good → average → poor

READABILITY:
- Clear variable/function names? ✓/✗
- Self-documenting or has helpful comments? ✓/✗
- Consistent formatting? ✓/✗
→ Rate: high → medium → low

SECURITY & SAFETY:
- Input validation present? ✓/✗
- No hardcoded secrets? ✓/✗
- Protected against common attacks? ✓/✗
- Proper authentication/authorization? ✓/✗

PERFORMANCE:
- Efficient algorithms? ✓/✗
- No N+1 or wasteful patterns? ✓/✗
- Appropriate data structures? ✓/✗

BEST PRACTICES:
- Follows language conventions? ✓/✗
- SOLID principles? ✓/✗
- Design patterns properly used? ✓/✗
- Tests or test structure? ✓/✗

-------------------------------------

SCORING GUIDE:
85-100: Excellent - Well-written, minimal issues, production-ready
75-84: Good - Solid code, minor improvements needed
65-74: Acceptable - Works but has issues, improvements recommended  
55-64: Below Average - Multiple issues, significant work needed
45-54: Poor - Real issues found, RED FLAGS present (security concerns)
0-44: Very Poor - Critical issues, NOT safe for production

MANDATORY: If RED FLAGS detected, REDUCE score significantly:
- 1-2 minor issues → -5 to -15 points
- 1 major issue → -20 to -30 points
- 2+ major issues → -40+ points, score under 50

DO NOT be lenient with security or critical issues.

Return JSON with "redFlags" field highlighting critical issues:

{
  "overallQuality": "excellent|good|average|poor",
  "codeReadability": "high|medium|low",
  "performanceRating": "excellent|good|acceptable|poor",
  "securityConcerns": ["specific concern 1", "specific concern 2"],
  "redFlags": ["CRITICAL: SQL injection in line X", "MAJOR: No input validation"],
  "bestPractices": ["practice found"],
  "improvementAreas": ["specific improvement"],
  "architecturePatterns": ["pattern"],
  "mainStrengths": "specific strength with example",
  "mainWeaknesses": "specific weakness with example",
  "skillLevel": "expert|advanced|intermediate|beginner",
  "skillsDetected": ["skill1"],
  "demonstratedExpertise": "description of skill level shown",
  "score": 0-100
}
`
  }

  parseCodeReviewResponse(responseText) {
    try {
      console.log('🔍 Parsing Gemini response...')
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        let parsed = JSON.parse(jsonMatch[0])

        // Check for red flags and apply scoring penalties
        let scoreAdjustment = 0
        const redFlags = parsed.redFlags || []

        if (redFlags.length > 0) {
          console.log('\n🚨 RED FLAGS DETECTED:')
          redFlags.forEach((flag, idx) => {
            console.log(`   ${idx + 1}. ${flag}`)

            // Apply scoring penalties based on severity
            if (flag.includes('SQL injection') || flag.includes('hardcoded') || flag.includes('credentials') || flag.includes('XSS')) {
              scoreAdjustment -= 30
            } else if (flag.includes('No input validation') || flag.includes('error handling')) {
              scoreAdjustment -= 20
            } else if (flag.includes('Code duplication') || flag.includes('DRY')) {
              scoreAdjustment -= 15
            } else if (flag.includes('No documentation')) {
              scoreAdjustment -= 10
            } else {
              scoreAdjustment -= 10
            }
          })

          const originalScore = parsed.score
          parsed.score = Math.max(0, parsed.score + scoreAdjustment)
          console.log(`   📉 Score Adjusted: ${originalScore} ${scoreAdjustment > 0 ? '+' : ''}${scoreAdjustment} = ${parsed.score}`)
        }

        console.log('\n📊 DETAILED EVALUATION PARAMETERS:')
        console.log('   Quality Metrics:')
        console.log(`     • Overall Quality: ${parsed.overallQuality?.toUpperCase()}`)
        console.log(`     • Code Readability: ${parsed.codeReadability}`)
        console.log(`     • Performance Rating: ${parsed.performanceRating}`)
        console.log(`   Skill Assessment:`)
        console.log(`     • Skill Level: ${parsed.skillLevel}`)
        console.log(`     • Skills Detected: ${parsed.skillsDetected?.join(', ') || 'None'}`)
        console.log(`   Code Analysis:`)
        console.log(`     • Architecture Patterns: ${parsed.architecturePatterns?.join(', ') || 'None'}`)
        console.log(`     • Security Concerns: ${parsed.securityConcerns?.length > 0 ? parsed.securityConcerns.join(', ') : 'None'}`)
        console.log(`     • Best Practices: ${parsed.bestPractices?.join(', ') || 'None'}`)
        console.log(`   Final Score: ${parsed.score}/100`)

        // Ensure redFlags field exists in response
        if (!parsed.redFlags) {
          parsed.redFlags = []
        }

        return parsed
      }

      console.warn('⚠️  No JSON found in response')
      return this.getDefaultCodeReview()
    } catch (error) {
      console.error('❌ Failed to parse code review:', error.message)
      return this.getDefaultCodeReview()
    }
  }

  getDefaultCodeReview() {
    return {
      overallQuality: 'average',
      codeReadability: 'medium',
      performanceRating: 'acceptable',
      securityConcerns: ['Unable to perform security analysis - Gemini API unavailable'],
      redFlags: [],
      bestPractices: ['Code structure present'],
      improvementAreas: ['Enable Gemini API for detailed analysis'],
      architecturePatterns: ['Standard architecture'],
      mainStrengths: 'Code appears functional',
      mainWeaknesses: 'Cannot evaluate without AI analysis',
      skillLevel: 'unknown',
      skillsDetected: ['Code Implementation'],
      demonstratedExpertise: 'Unable to assess - configure GEMINI_API_KEY',
      score: 45,
    }
  }
}

export const geminiService = new GeminiService()