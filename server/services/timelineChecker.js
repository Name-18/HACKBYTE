// timelineChecker.js - Validates timeline consistency
export class TimelineChecker {
  validateTimeline(resumeData, githubData) {
    const flags = []
    let score = 100

    // Extract dates from resume
    const resumeDates = this.extractDatesFromResume(resumeData)

    // Check for overlapping employment
    if (resumeDates.overlaps && resumeDates.overlaps.length > 0) {
      flags.push(
        `Timeline overlap detected: ${resumeDates.overlaps.join(', ')}`,
      )
      score -= 20
    }

    // Check for gaps
    if (resumeDates.gaps && resumeDates.gaps.length > 0) {
      // Gaps are not necessarily bad, but worth noting
      flags.push(`Timeline gaps: ${resumeDates.gaps.join(', ')}`)
      // Smaller penalty for gaps
      score -= 5 * resumeDates.gaps.length
    }

    // Check GitHub activity alignment with experience dates
    if (githubData.created_at && resumeDates.earliestDate) {
      const githubCreated = new Date(githubData.created_at)
      const resumeEarliest = resumeDates.earliestDate

      if (resumeEarliest < githubCreated) {
        // Claimed experience before GitHub account creation
        flags.push(
          `Claimed experience (${resumeEarliest.toDateString()}) predates GitHub account creation (${githubCreated.toDateString()})`,
        )
        score -= 15
      }
    }

    // Check consistency with education timeline
    if (resumeDates.educationEnd && resumeDates.earliestWorkDate) {
      if (resumeDates.educationEnd > resumeDates.earliestWorkDate) {
        flags.push('Education end date overlaps with employment')
        score -= 10
      }
    }

    return {
      isValid: score >= 70,
      score: Math.max(0, score),
      flags,
      details: resumeDates,
    }
  }

  extractDatesFromResume(resumeData) {
    const text = (resumeData.fullText || '').toLowerCase()

    // Simple date extraction (MM/YYYY or YYYY format)
    const datePattern = /(\d{1,2}\/\d{4}|\d{4})/g
    const dates = text.match(datePattern) || []

    // Parse dates
    const parsedDates = dates
      .map((date) => {
        if (date.includes('/')) {
          const [month, year] = date.split('/')
          return new Date(year, month - 1, 1)
        }
        return new Date(date, 0, 1)
      })
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a - b)

    const overlaps = this.findOverlaps(text)
    const gaps = this.findGaps(parsedDates)

    return {
      dates: parsedDates,
      overlaps,
      gaps,
      earliestDate: parsedDates[0],
      latestDate: parsedDates[parsedDates.length - 1],
      educationEnd: resumeData.education ? new Date() : null,
      earliestWorkDate: parsedDates[0],
    }
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
