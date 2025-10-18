<template>
  <div id="app">
    <header class="header">
      <div class="container">
        <h1 class="title">
          Aikido Security Dashboard
        </h1>
        <p class="subtitle">Monitor and fix security vulnerabilities in your repositories</p>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>Loading repositories...</p>
        </div>

        <div v-else-if="error" class="error">
          <h3>Error</h3>
          <p>{{ error }}</p>
          <button @click="loadRepositories" class="retry-btn">Retry</button>
        </div>

        <div v-else-if="selectedRepository" class="repository-details">
          <div class="back-button">
            <button @click="selectedRepository = null" class="btn btn-secondary">
              ← Back to Repositories
            </button>
          </div>
          
          <RepositoryIssues 
            :repository="selectedRepository"
            @suggest-fix="handleSuggestFix"
          />
        </div>

        <div v-else class="repositories">
          <h2>Your Repositories</h2>
          <div v-if="repositories.length === 0" class="empty-state">
            <p>No repositories found.</p>
          </div>
          <div v-else class="repository-grid">
            <div 
              v-for="repo in repositories" 
              :key="repo.id"
              @click="selectRepository(repo)"
              class="repository-card"
            >
              <div class="repo-header">
                <h3>{{ repo.name }}</h3>
                <span class="repo-status status-active">
                  Active
                </span>
              </div>
              <p class="repo-description">{{ repo.provider || 'No provider info' }}</p>
              <div class="repo-meta">
                <span class="repo-language">{{ repo.branch || 'Unknown branch' }}</span>
                <span class="repo-issues" v-if="repo.last_scanned_at">
                  Last scanned: {{ formatDate(repo.last_scanned_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <FixSuggestionModal 
      v-if="showFixModal"
      :original-code="fixData.originalCode"
      :fixed-code="fixData.fixedCode"
      :issue-type="fixData.issueType"
      :description="fixData.description"
      :loading="fixLoading"
      @close="showFixModal = false"
    />
  </div>
</template>

<script>
import RepositoryIssues from './components/RepositoryIssues.vue'
import FixSuggestionModal from './components/FixSuggestionModal.vue'
import { aikidoService } from './services/aikidoService.js'

export default {
  name: 'App',
  components: {
    RepositoryIssues,
    FixSuggestionModal
  },
  data() {
    return {
      repositories: [],
      selectedRepository: null,
      loading: true,
      error: null,
      showFixModal: false,
      fixLoading: false,
      fixData: {
        originalCode: '',
        fixedCode: '',
        issueType: '',
        description: ''
      }
    }
  },
  async mounted() {
    await this.loadRepositories()
  },
  methods: {
    async loadRepositories() {
      this.loading = true
      this.error = null
      
      try {
        this.repositories = await aikidoService.getRepositories()
      } catch (error) {
        this.error = 'Failed to load repositories. Please check your API configuration.'
        console.error('Error loading repositories:', error)
      } finally {
        this.loading = false
      }
    },
    
    selectRepository(repo) {
      this.selectedRepository = repo
    },
    

    formatDate(timestamp) {
      if (typeof timestamp === 'number') {
        return new Date(timestamp * 1000).toLocaleDateString()
      }
      return new Date(timestamp).toLocaleDateString()
    },
    
    async handleSuggestFix(issueData) {
      try {
        this.fixData = {
          originalCode: '',
          fixedCode: '',
          issueType: '',
          description: ''
        }
        this.fixLoading = true
        this.showFixModal = true
        
        const response = await aikidoService.suggestFix(issueData)
        
        this.fixData = response
        this.fixLoading = false
      } catch (error) {
        console.error('Error suggesting fix:', error)
        this.fixLoading = false
        alert('Failed to generate fix suggestion. Please try again.')
      }
    }
  }
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 0;
  text-align: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.title {
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}


.subtitle {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.9;
}

.main {
  padding: 2rem 0;
  min-height: calc(100vh - 200px);
}

.loading {
  text-align: center;
  padding: 4rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 2rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
}

.retry-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

.retry-btn:hover {
  background: #5a6fd8;
}

.repositories h2 {
  margin-bottom: 2rem;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.repository-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.repository-card {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.repository-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-color: #667eea;
}

.repo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.repo-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.repo-status {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-active {
  background: #d4edda;
  color: #155724;
}


.status-scanning {
  background: #fff3cd;
  color: #856404;
}

.status-unknown {
  background: #e2e3e5;
  color: #383d41;
}

.repo-description {
  color: #666;
  margin: 0.5rem 0;
  line-height: 1.4;
}

.repo-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #888;
}

.repo-language {
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.repo-issues {
  font-weight: 500;
}

.repository-details {
  max-width: 1000px;
  margin: 0 auto;
}

.back-button {
  margin-bottom: 2rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}
</style>
