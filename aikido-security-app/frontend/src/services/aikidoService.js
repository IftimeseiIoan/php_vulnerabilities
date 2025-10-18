import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const aikidoService = {
  async getRepositories() {
    try {
      const repositories = await api.get('/repositories')
      return repositories
    } catch (error) {
      throw new Error('Failed to fetch repositories')
    }
  },


  async getRepositoryIssues(repoId) {
    try {
      const issues = await api.get(`/repositories/${repoId}/issues`)
      return issues
    } catch (error) {
      throw new Error('Failed to fetch repository issues')
    }
  },


  async suggestFix(issueData) {
    try {
      const response = await api.post('/suggest-fix', issueData)
      return response
    } catch (error) {
      throw new Error('Failed to generate fix suggestion')
    }
  },

}
