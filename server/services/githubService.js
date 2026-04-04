// githubService.js - GitHub API integration
import axios from 'axios'

class GitHubService {
  constructor() {
    this.baseURL = 'https://api.github.com'
    this.token = process.env.GITHUB_TOKEN
    this.headers = {
      Authorization: `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  }

  async fetchUserData(username) {
    try {
      if (!this.token) {
        console.warn('⚠️ GITHUB_TOKEN not configured')
        return this.getMockGitHubData(username)
      }

      // Fetch user profile
      const userResponse = await axios.get(
        `${this.baseURL}/users/${username}`,
        { headers: this.headers },
      )

      const userData = userResponse.data

      // Fetch user repos
      const reposResponse = await axios.get(
        `${this.baseURL}/users/${username}/repos`,
        {
          headers: this.headers,
          params: { per_page: 100, sort: 'stars' },
        },
      )

      const repos = reposResponse.data

      // Analyze languages and contributions
      const languages = await this.getLanguages(repos)
      const contributions = await this.getContributions(username)

      return {
        username: userData.login,
        name: userData.name,
        bio: userData.bio,
        location: userData.location,
        publicRepos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        languages,
        repos: repos.map((repo) => ({
          name: repo.name,
          url: repo.html_url,
          description: repo.description,
          language: repo.language,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
        })),
        yearsSinceCreated:
          new Date().getFullYear() - new Date(userData.created_at).getFullYear(),
        contributions,
      }
    } catch (error) {
      console.error('GitHub API error:', error.message)
      return this.getMockGitHubData(username)
    }
  }

  async getLanguages(repos) {
    const languageMap = {}

    for (const repo of repos) {
      if (!repo.language) continue

      if (!languageMap[repo.language]) {
        languageMap[repo.language] = 0
      }
      languageMap[repo.language] += 1
    }

    return Object.keys(languageMap)
      .sort((a, b) => languageMap[b] - languageMap[a])
      .slice(0, 10)
  }

  async getContributions(username) {
    try {
      if (!this.token) {
        console.warn('⚠️ GITHUB_TOKEN not configured, cannot fetch contributions')
        return 0
      }

      // Use GraphQL API to get contribution statistics for the last year
      const graphqlQuery = `
        query {
          user(login: "${username}") {
            contributionsCollection {
              contributionCalendar {
                totalContributions
              }
            }
          }
        }
      `

      const response = await axios.post(
        'https://api.github.com/graphql',
        { query: graphqlQuery },
        { headers: this.headers },
      )

      if (response.data?.data?.user?.contributionsCollection?.contributionCalendar) {
        return response.data.data.user.contributionsCollection.contributionCalendar.totalContributions
      }

      return 0
    } catch (error) {
      console.warn('Failed to fetch contributions:', error.message)
      return 0
    }
  }

  async getRandomRepository() {
    try {
      if (!this.token) {
        console.warn('⚠️ GITHUB_TOKEN not configured, using mock data')
        return this.getMockRandomRepository()
      }

      // Search for random repositories by using different search queries
      const keywords = ['language:javascript', 'language:python', 'language:typescript', 'stars:>100', 'is:public']
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)]
      const sortOptions = ['stars', 'forks', 'updated']
      const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)]

      const searchResponse = await axios.get(
        `${this.baseURL}/search/repositories`,
        {
          headers: this.headers,
          params: {
            q: randomKeyword,
            sort: randomSort,
            order: 'desc',
            per_page: 100,
          },
        },
      )

      const repositories = searchResponse.data.items
      if (repositories.length === 0) {
        return this.getMockRandomRepository()
      }

      const randomRepo = repositories[Math.floor(Math.random() * repositories.length)]

      return {
        name: randomRepo.name,
        owner: randomRepo.owner.login,
        url: randomRepo.html_url,
        description: randomRepo.description,
        language: randomRepo.language,
        cloneUrl: randomRepo.clone_url,
      }
    } catch (error) {
      console.error('Error fetching random repo:', error.message)
      return this.getMockRandomRepository()
    }
  }

  async getRepositoryFiles(owner, repo, path = '') {
    try {
      if (!this.token) {
        console.warn('⚠️ GITHUB_TOKEN not configured')
        return []
      }

      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/contents/${path}`,
        { headers: this.headers },
      )

      let files = []
      const items = Array.isArray(response.data) ? response.data : [response.data]

      for (const item of items) {
        if (item.type === 'file' && this.isCodeFile(item.name)) {
          files.push({
            name: item.name,
            path: item.path,
            size: item.size,
            url: item.download_url,
          })
        } else if (item.type === 'dir' && files.length < 10) {
          // Recursively get files from subdirectories (limit depth)
          const subFiles = await this.getRepositoryFiles(owner, repo, item.path)
          files = files.concat(subFiles)
        }

        if (files.length >= 15) break // Limit total files
      }

      return files.slice(0, 15)
    } catch (error) {
      console.error('Error fetching repo files:', error.message)
      return []
    }
  }

  async extractRepositoryCode(owner, repo) {
    try {
      const files = await this.getRepositoryFiles(owner, repo)

      const codeFiles = []
      for (const file of files) {
        try {
          const fileContent = await axios.get(file.url)
          codeFiles.push({
            name: file.name,
            path: file.path,
            content: fileContent.data,
            language: this.detectLanguage(file.name),
          })
        } catch (error) {
          console.warn(`Failed to fetch ${file.name}:`, error.message)
        }
      }

      return codeFiles
    } catch (error) {
      console.error('Error extracting repo code:', error.message)
      return []
    }
  }

  isCodeFile(filename) {
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.go',
      '.rb', '.php', '.cs', '.swift', '.kotlin', '.rs', '.vue'
    ]
    return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext))
  }

  detectLanguage(filename) {
    const ext = filename.split('.').pop().toLowerCase()
    const languageMap = {
      'js': 'JavaScript',
      'jsx': 'JSX',
      'ts': 'TypeScript',
      'tsx': 'TSX',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'go': 'Go',
      'rb': 'Ruby',
      'php': 'PHP',
      'cs': 'C#',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'rs': 'Rust',
      'vue': 'Vue',
    }
    return languageMap[ext] || 'Unknown'
  }

  getMockRandomRepository() {
    return {
      name: 'awesome-project',
      owner: 'demo-user',
      url: 'https://github.com/demo-user/awesome-project',
      description: 'A sample project for code review',
      language: 'JavaScript',
      cloneUrl: 'https://github.com/demo-user/awesome-project.git',
    }
  }

  getMockGitHubData(username) {
    // Mock data for demonstration when GitHub API is not available
    return {
      username,
      name: `${username} (Mock)`,
      bio: 'Software Developer',
      location: 'Earth',
      publicRepos: 15,
      followers: 42,
      following: 30,
      created_at: new Date(2015, 0, 1).toISOString(),
      updated_at: new Date().toISOString(),
      languages: ['JavaScript', 'Python', 'TypeScript', 'React'],
      repos: [
        {
          name: 'awesome-project',
          url: `https://github.com/${username}/awesome-project`,
          description: 'An awesome project',
          language: 'JavaScript',
          created_at: new Date(2020, 0, 1).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      yearsSinceCreated: 9,
      contributions: 1200,
    }
  }
}

export const githubService = new GitHubService()
