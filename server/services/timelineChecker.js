// timelineChecker.js - Validates timeline consistency
export class TimelineChecker {
  validateTimeline(resumeData, githubData) {
    const flags = []
    let score = 100

    // Extract dates from resume
    const resumeDates = this.extractDatesFromResume(resumeData)

    console.log('\n⏰ ===== TIMELINE VALIDATION DATA =====')
    console.log(`\nEducation Dates: ${resumeDates.educationDates?.length || 0}`)
    if (resumeDates.educationStart) {
      console.log(`   Started: ${resumeDates.educationStart.toDateString()}`)
    }
    if (resumeDates.educationEnd) {
      console.log(`   Ended: ${resumeDates.educationEnd.toDateString()}`)
    }

    console.log(`\nWork Experience Dates: ${resumeDates.workDates?.length || 0}`)
    if (resumeDates.earliestWorkDate) {
      console.log(`   Earliest: ${resumeDates.earliestWorkDate.toDateString()}`)
    }

    // Check for overlapping employment
    console.log(`\n✓ Employment Overlaps: ${resumeDates.overlaps?.length || 0}`)
    if (resumeDates.overlaps && resumeDates.overlaps.length > 0) {
      resumeDates.overlaps.forEach((overlap, idx) => {
        console.log(`   ${idx + 1}. ${overlap}`)
        flags.push(`Timeline overlap detected: ${overlap}`)
      })
      score -= 20
    } else {
      console.log('   No overlaps detected ✓')
    }

    // Check for gaps
    console.log(`\n✓ Timeline Gaps: ${resumeDates.gaps?.length || 0}`)
    if (resumeDates.gaps && resumeDates.gaps.length > 0) {
      resumeDates.gaps.forEach((gap, idx) => {
        console.log(`   ${idx + 1}. ${gap}`)
        flags.push(`Timeline gap: ${gap}`)
      })
      score -= 5 * resumeDates.gaps.length
    } else {
      console.log('   No significant gaps detected ✓')
    }

    // Check GitHub activity alignment with education/work dates
    console.log(`\n✓ GitHub Account vs Timeline:`)
    if (githubData?.created_at) {
      const githubCreated = new Date(githubData.created_at)
      console.log(`   GitHub Created: ${githubCreated.toDateString()}`)
      
      // Compare with education start date specifically
      if (resumeDates.educationStart) {
        console.log(`   Education Started: ${resumeDates.educationStart.toDateString()}`)
        
        if (resumeDates.educationStart > githubCreated) {
          console.log(`   ✓ Education started AFTER GitHub account (makes sense)`)
        } else {
          const yearsDiff = githubCreated.getFullYear() - resumeDates.educationStart.getFullYear()
          console.log(`   ℹ️  Education started ${yearsDiff} years before GitHub account`)
        }
      }

      // Compare with first work experience
      if (resumeDates.earliestWorkDate) {
        console.log(`   Work Started: ${resumeDates.earliestWorkDate.toDateString()}`)
        
        if (resumeDates.earliestWorkDate < githubCreated) {
          console.log(`   ⚠️  MISMATCH: Claimed work experience before GitHub account`)
          flags.push(
            `Claimed work experience (${resumeDates.earliestWorkDate.toDateString()}) predates GitHub account creation (${githubCreated.toDateString()})`,
          )
          score -= 15
        } else {
          console.log(`   ✓ Work timeline aligns with GitHub account`)
        }
      }
    } else {
      console.log('   GitHub data not available')
    }

    // Check consistency with education timeline
    console.log(`\n✓ Education vs Experience Timeline:`)
    if (resumeDates.educationEnd && resumeDates.earliestWorkDate) {
      if (resumeDates.educationEnd > resumeDates.earliestWorkDate) {
        console.log(`   ⚠️  OVERLAP: Education duration overlaps with work experience`)
        flags.push('Education end date overlaps with employment')
        score -= 10
      } else {
        console.log(`   ✓ Education and work timeline consistent`)
      }
    } else {
      console.log('   Insufficient education/work date data')
    }

    console.log(`\n📊 Timeline Validation Score: ${Math.max(0, score)}/100`)
    console.log(`Timeline Valid: ${score >= 70 ? '✅ YES' : '❌ NO'}`)
    if (flags.length > 0) {
      console.log(`\n⚠️  Red Flags (${flags.length}):`)
      flags.forEach((flag, idx) => {
        console.log(`   ${idx + 1}. ${flag}`)
      })
    } else {
      console.log('\n✅ No red flags detected')
    }
    console.log('=====================================\n')

    return {
      isValid: score >= 70,
      score: Math.max(0, score),
      flags,
      details: resumeDates,
    }
  }

  extractDatesFromResume(resumeData) {
    const text = (resumeData.fullText || '').toLowerCase()

    // Extract education dates (look for dates near education-related keywords)
    const educationDates = this.extractEducationDates(text, resumeData)
    const workDates = this.extractWorkDates(text, resumeData)

    console.log(`\n📅 Detailed Date Extraction:`)
    console.log(`   Education Dates Found: ${educationDates.length}`)
    if (educationDates.length > 0) {
      educationDates.forEach((date, idx) => {
        console.log(`     ${idx + 1}. ${date.toDateString()}`)
      })
    }

    console.log(`   Work Experience Dates Found: ${workDates.length}`)
    if (workDates.length > 0) {
      workDates.forEach((date, idx) => {
        console.log(`     ${idx + 1}. ${date.toDateString()}`)
      })
    }

    const overlaps = this.findOverlaps(text)
    const gaps = this.findGaps([...educationDates, ...workDates])

    const earliestEducationDate = educationDates[0]
    const latestEducationDate = educationDates[educationDates.length - 1]

    return {
      dates: [...educationDates, ...workDates],
      educationDates,
      workDates,
      overlaps,
      gaps,
      earliestDate: earliestEducationDate || workDates[0],
      latestDate: latestEducationDate || workDates[workDates.length - 1],
      educationStart: earliestEducationDate,
      educationEnd: latestEducationDate,
      earliestWorkDate: workDates[0],
    }
  }

  extractEducationDates(text, resumeData) {
    const datePattern = /(\d{1,2}\/\d{4}|\d{4})/g
    const rangePattern = /(\d{4})\s*[-–]\s*(\d{4}|present)/g  // Match "2019 - 2023" or "2019 - present"
    const dates = []
    const currentDate = new Date()

    console.log(`\n🔍 Extracting Education Dates...`)
    
    // Try multiple ways to find education section
    let educationSections = []
    
    // Method 1: Look for "education" section in text
    const educationMatch = text.match(/education[:\s]*([\s\S]*?)(?=experience|skills|projects|certifications|$)/i)
    if (educationMatch) {
      console.log(`   ✓ Found 'education' section in text`)
      educationSections.push(educationMatch[1])
    }
    
    // Method 2: Check resumeData.education if it exists (from parserService)
    if (resumeData?.education) {
      console.log(`   ✓ Found 'education' in resumeData object`)
      educationSections.push(resumeData.education)
    }
    
    // Method 3: Look for university/college/degree keywords
    const universityMatch = text.match(/(university|college|school|degree|graduated|graduation)[:\s]*([\s\S]*?)(?=\n\n|experience|skills|projects|$)/gi)
    if (universityMatch) {
      console.log(`   ✓ Found university/college/degree keywords`)
      universityMatch.forEach(match => educationSections.push(match))
    }

    console.log(`   Found ${educationSections.length} education section(s)`)

    // Extract dates from all found sections
    educationSections.forEach((section, idx) => {
      console.log(`   Section ${idx + 1}:`)
      
      // Try range format first (2019 - 2023 or 2019 - present)
      let match
      while ((match = rangePattern.exec(section)) !== null) {
        const startYear = parseInt(match[1])
        let endYear = match[2]
        
        if (startYear >= 1990 && startYear <= new Date().getFullYear() + 1) {
          if (endYear.toLowerCase() === 'present') {
            console.log(`     Found range: ${startYear} - present (ongoing)`)
            dates.push(new Date(startYear, 0, 1))
            dates.push(currentDate)  // Use current date for "present"
          } else {
            endYear = parseInt(endYear)
            if (endYear >= 1990 && endYear <= new Date().getFullYear() + 1) {
              console.log(`     Found range: ${startYear} - ${endYear}`)
              dates.push(new Date(startYear, 0, 1))
              dates.push(new Date(endYear, 0, 1))
            }
          }
        }
      }

      // Try individual date format (MM/YYYY or YYYY)
      const sectionDates = section.match(datePattern) || []
      sectionDates.forEach((dateStr) => {
        const year = parseInt(dateStr.match(/\d{4}/)[0])
        if (year >= 1990 && year <= new Date().getFullYear() + 1) {
          console.log(`     Found date: ${dateStr}`)
          if (dateStr.includes('/')) {
            const [month, yearStr] = dateStr.split('/')
            dates.push(new Date(yearStr, month - 1, 1))
          } else {
            dates.push(new Date(year, 0, 1))
          }
        }
      })

      // Check for "present" keyword
      if (section.toLowerCase().includes('present')) {
        console.log(`     Found 'present' keyword - treating as ongoing`)
        dates.push(currentDate)
      }
    })

    if (dates.length === 0) {
      console.log(`   ⚠️  No education dates found - check resume format`)
    }

    // Remove duplicates and sort
    const uniqueDates = [...new Set(dates.map(d => d.getTime()))].map(t => new Date(t))
    return uniqueDates.sort((a, b) => a - b)
  }

  extractWorkDates(text, resumeData) {
    // Look for dates near work/experience keywords
    const datePattern = /(\d{1,2}\/\d{4}|\d{4})/g
    const rangePattern = /(\d{4})\s*[-–]\s*(\d{4}|present)/g  // Match "2019 - 2023" or "2019 - present"
    const dates = []
    const currentDate = new Date()

    console.log(`\n🔍 Extracting Work/Experience Dates...`)

    let workSections = []

    // Method 1: Look for "experience" section in text
    const experienceMatch = text.match(/experience[:\s]*([\s\S]*?)(?=education|skills|projects|certifications|$)/i)
    if (experienceMatch) {
      console.log(`   ✓ Found 'experience' section in text`)
      workSections.push(experienceMatch[1])
    }

    // Method 2: Check resumeData.experience if it exists
    if (resumeData?.experience) {
      console.log(`   ✓ Found 'experience' in resumeData object`)
      workSections.push(resumeData.experience)
    }

    // Method 3: Look for work-related keywords
    const workMatch = text.match(/(worked|worked at|employed|job|position|role|developer|engineer|manager)[:\s]*([\s\S]*?)(?=\n\n|education|skills|$)/gi)
    if (workMatch) {
      console.log(`   ✓ Found work-related keywords`)
      workMatch.forEach(match => workSections.push(match))
    }

    console.log(`   Found ${workSections.length} work section(s)`)

    // Extract dates from all found sections
    workSections.forEach((section, idx) => {
      console.log(`   Section ${idx + 1}:`)
      
      // Try range format first (2019 - 2023 or 2019 - present)
      let match
      while ((match = rangePattern.exec(section)) !== null) {
        const startYear = parseInt(match[1])
        let endYear = match[2]
        
        if (startYear >= 1990 && startYear <= new Date().getFullYear() + 1) {
          if (endYear.toLowerCase() === 'present') {
            console.log(`     Found range: ${startYear} - present (ongoing)`)
            dates.push(new Date(startYear, 0, 1))
            dates.push(currentDate)  // Use current date for "present"
          } else {
            endYear = parseInt(endYear)
            if (endYear >= 1990 && endYear <= new Date().getFullYear() + 1) {
              console.log(`     Found range: ${startYear} - ${endYear}`)
              dates.push(new Date(startYear, 0, 1))
              dates.push(new Date(endYear, 0, 1))
            }
          }
        }
      }

      // Try individual date format (MM/YYYY or YYYY)
      const sectionDates = section.match(datePattern) || []
      sectionDates.forEach((dateStr) => {
        const year = parseInt(dateStr.match(/\d{4}/)[0])
        if (year >= 1990 && year <= new Date().getFullYear() + 1) {
          console.log(`     Found date: ${dateStr}`)
          if (dateStr.includes('/')) {
            const [month, yearStr] = dateStr.split('/')
            dates.push(new Date(yearStr, month - 1, 1))
          } else {
            dates.push(new Date(year, 0, 1))
          }
        }
      })

      // Check for "present" keyword
      if (section.toLowerCase().includes('present')) {
        console.log(`     Found 'present' keyword - treating as ongoing`)
        dates.push(currentDate)
      }
    })

    if (dates.length === 0) {
      console.log(`   ⚠️  No work dates found - check resume format`)
    }

    // Remove duplicates and sort
    const uniqueDates = [...new Set(dates.map(d => d.getTime()))].map(t => new Date(t))
    return uniqueDates.sort((a, b) => a - b)
  }

  findOverlaps(text) {
    // Look for phrases that suggest simultaneous employment
    const overlapIndicators = [
      /present.*and.*present/gi,
      /concurrent/gi,
      /simultaneous/gi,
      /both.*and/gi,
    ]

    const overlaps = []
    overlapIndicators.forEach((pattern) => {
      if (pattern.test(text)) {
        overlaps.push('Potential simultaneous roles detected')
      }
    })

    return overlaps
  }

  findGaps(dates) {
    if (dates.length < 2) return []

    const gaps = []
    const gapThreshold = 90 * 24 * 60 * 60 * 1000 // 3 months in ms

    for (let i = 0; i < dates.length - 1; i++) {
      const gap = dates[i + 1] - dates[i]
      if (gap > gapThreshold) {
        gaps.push(
          `Gap between ${dates[i].toDateString()} and ${dates[i + 1].toDateString()}`,
        )
      }
    }

    return gaps
  }
}

export const timelineChecker = new TimelineChecker()
