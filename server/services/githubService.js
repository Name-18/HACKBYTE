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
        stars: repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0),
        repos: repos.map((repo) => ({
          name: repo.name,
          url: repo.html_url,
          description: repo.description,
          stars: repo.stargazers_count,
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
      // Note: This requires the user to be authenticated and have public contribution data
      // For a more accurate count, you might need to use GraphQL API
      // For now, we'll return 0 and could be enhanced
      return 0
    } catch (error) {
      return 0
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
      stars: 185,
      repos: [
        {
          name: 'awesome-project',
          url: `https://github.com/${username}/awesome-project`,
          description: 'An awesome project',
          stars: 50,
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
