// skillsConfig.js - Available skills for selection
export const AVAILABLE_SKILLS = {
  frontend: {
    label: 'Frontend',
    skills: ['react', 'vue', 'angular', 'typescript', 'javascript', 'css', 'html']
  },
  backend: {
    label: 'Backend',
    skills: ['node', 'express', 'python', 'java', 'go', 'rust', 'php']
  },
  database: {
    label: 'Database',
    skills: ['sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch']
  },
  tools: {
    label: 'Tools & Platforms',
    skills: ['git', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'jenkins']
  },
  apis: {
    label: 'APIs & Architectures',
    skills: ['rest api', 'graphql', 'microservices', 'grpc', 'websocket']
  },
  testing: {
    label: 'Testing',
    skills: ['jest', 'mocha', 'pytest', 'unittest', 'selenium', 'cypress']
  }
}

// Get all flat skills
export const getAllSkills = () => {
  const allSkills = []
  Object.values(AVAILABLE_SKILLS).forEach(category => {
    allSkills.push(...category.skills)
  })
  return allSkills
}

// Get default skills if none are provided
export const getDefaultSkills = () => {
  return [
    'javascript', 'react', 'node', 'python', 'sql', 'mongodb',
    'typescript', 'express', 'next', 'vue', 'angular', 'aws',
    'docker', 'kubernetes', 'git', 'rest api', 'graphql', 'microservices',
  ]
}
