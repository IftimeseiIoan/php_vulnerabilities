<template>
  <div class="repository-issues">
    <div class="repo-header">
      <h2>{{ repository.name }}</h2>
      <div class="repo-stats">
        <span class="stat">
          <strong>{{ issues.length }}</strong> total issues
        </span>
        <span class="stat">
          <strong>{{ criticalIssues }}</strong> critical
        </span>
        <span class="stat">
          <strong>{{ highIssues }}</strong> high
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading issues...</p>
    </div>

    <div v-else-if="error" class="error">
      <h3>Error</h3>
      <p>{{ error }}</p>
      <button @click="loadIssues" class="retry-btn">Retry</button>
    </div>

    <div v-else-if="issues.length === 0" class="empty-state">
      <div class="success-icon">✓</div>
      <h3>No Issues Found</h3>
      <p>This repository appears to be clean! No security vulnerabilities detected.</p>
    </div>

    <div v-else class="issues-list">
      <div class="filters">
        <select v-model="selectedSeverity" @change="filterIssues" class="filter-select">
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
      </div>

      <div class="issues-grid">
        <div 
          v-for="issue in filteredIssues" 
          :key="issue.id"
          class="issue-card"
          :class="getSeverityClass(issue.severity)"
        >
          <div class="issue-header">
            <div class="issue-title">
              <h4>{{ issue.rule }}</h4>
              <span class="issue-type">{{ issue.type }}</span>
            </div>
            <div class="issue-severity">
              <span class="severity-badge" :class="getSeverityClass(issue.severity)">
                {{ issue.severity }} ({{ issue.severity_score }})
              </span>
            </div>
          </div>

          <div class="issue-description">
            <p>{{ issue.rule }}</p>
          </div>

          <div class="file-path-header">
            <span class="file-path-text">{{ issue.affected_file || 'Unknown' }}</span>
          </div>

          <div class="issue-details">
            <div class="detail-item" v-if="issue.start_line">
              <strong>Lines:</strong> {{ issue.start_line }}{{ issue.end_line ? '-' + issue.end_line : '' }}
            </div>
            <div class="detail-item">
              <strong>Detected:</strong> {{ formatDate(issue.first_detected_at) }}
            </div>
            <div class="detail-item" v-if="issue.affected_package">
              <strong>Package:</strong> {{ issue.affected_package }}
            </div>
            <div class="detail-item" v-if="issue.attack_surface">
              <strong>Attack Surface:</strong> {{ issue.attack_surface }}
            </div>
          </div>

          <div v-if="isPHPBacktickVulnerability(issue)" class="code-snippet">
            <h5>Vulnerable Code:</h5>
            <pre><code>{{ getCodeSnippet(issue) }}</code></pre>
          </div>

          <div class="issue-actions">
            <button class="btn btn-outline" @click="viewDetails(issue)">View Details</button>
            <button 
              class="btn btn-primary" 
              v-if="isPHPBacktickVulnerability(issue)"
              @click="suggestFix(issue)"
              :disabled="suggestingFix"
            >
              {{ suggestingFix ? 'Generating...' : 'Suggest Fix' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Issue Details</h3>
          <button class="modal-close" @click="closeDetailsModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedIssue">
          <div class="issue-detail-section">
            <h4>{{ selectedIssue.rule }}</h4>
            <p class="issue-description">{{ selectedIssue.rule }}</p>
          </div>
          
          <div class="issue-detail-section">
            <h5>Vulnerability Information</h5>
            <div class="detail-grid">
              <div class="detail-item">
                <strong>Type:</strong> {{ selectedIssue.type }}
              </div>
              <div class="detail-item">
                <strong>Severity:</strong> 
                <span class="severity-badge" :class="getSeverityClass(selectedIssue.severity)">
                  {{ selectedIssue.severity }} ({{ selectedIssue.severity_score }})
                </span>
              </div>
              <div class="detail-item">
                <strong>Status:</strong> {{ selectedIssue.status }}
              </div>
              <div class="detail-item" v-if="selectedIssue.rule_id">
                <strong>Rule ID:</strong> {{ selectedIssue.rule_id }}
              </div>
              <div class="detail-item" v-if="selectedIssue.cwe_classes">
                <strong>CWE Classes:</strong> {{ selectedIssue.cwe_classes.join(', ') }}
              </div>
              <div class="detail-item" v-if="selectedIssue.attack_surface">
                <strong>Attack Surface:</strong> {{ selectedIssue.attack_surface }}
              </div>
            </div>
          </div>

          <div class="issue-detail-section">
            <h5>Location</h5>
            <div class="detail-grid">
              <div class="detail-item">
                <strong>File:</strong> {{ selectedIssue.affected_file || 'Unknown' }}
              </div>
              <div class="detail-item" v-if="selectedIssue.start_line">
                <strong>Lines:</strong> {{ selectedIssue.start_line }}{{ selectedIssue.end_line ? '-' + selectedIssue.end_line : '' }}
              </div>
              <div class="detail-item" v-if="selectedIssue.programming_language">
                <strong>Language:</strong> {{ selectedIssue.programming_language }}
              </div>
            </div>
          </div>

          <div class="issue-detail-section" v-if="selectedIssue.affected_package">
            <h5>Package Information</h5>
            <div class="detail-grid">
              <div class="detail-item">
                <strong>Package:</strong> {{ selectedIssue.affected_package }}
              </div>
              <div class="detail-item" v-if="selectedIssue.installed_version">
                <strong>Installed Version:</strong> {{ selectedIssue.installed_version }}
              </div>
              <div class="detail-item" v-if="selectedIssue.patched_versions && selectedIssue.patched_versions.length > 0">
                <strong>Patched Versions:</strong> {{ selectedIssue.patched_versions.join(', ') }}
              </div>
              <div class="detail-item" v-if="selectedIssue.license">
                <strong>License:</strong> {{ selectedIssue.license }}
              </div>
            </div>
          </div>

          <div class="issue-detail-section">
            <h5>Timeline & SLA</h5>
            <div class="detail-grid">
              <div class="detail-item">
                <strong>First Detected:</strong> {{ formatDate(selectedIssue.first_detected_at) }}
              </div>
              <div class="detail-item" v-if="selectedIssue.sla_days">
                <strong>SLA Days:</strong> {{ selectedIssue.sla_days }}
              </div>
              <div class="detail-item" v-if="selectedIssue.sla_remediate_by">
                <strong>Remediate By:</strong> {{ formatDate(selectedIssue.sla_remediate_by) }}
              </div>
              <div class="detail-item" v-if="selectedIssue.closed_at">
                <strong>Closed:</strong> {{ formatDate(selectedIssue.closed_at) }}
              </div>
            </div>
          </div>

          <div v-if="isPHPBacktickVulnerability(selectedIssue)" class="issue-detail-section">
            <h5>Vulnerable Code</h5>
            <div class="code-snippet">
              <pre><code>{{ getCodeSnippet(selectedIssue) }}</code></pre>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeDetailsModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { aikidoService } from '../services/aikidoService.js'

export default {
  name: 'RepositoryIssues',
  props: {
    repository: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      issues: [],
      filteredIssues: [],
      loading: true,
      error: null,
      selectedSeverity: '',
      suggestingFix: false,
      showDetailsModal: false,
      selectedIssue: null
    }
  },
  computed: {
    criticalIssues() {
      return this.issues.filter(issue => issue.severity === 'critical').length
    },
    highIssues() {
      return this.issues.filter(issue => issue.severity === 'high').length
    }
  },
  async mounted() {
    await this.loadIssues()
  },
  methods: {
    isPHPBacktickVulnerability(issue) {
      return issue.rule === 'Using backticks in PHP can lead to remote code execution';
    },

    async loadIssues() {
      this.loading = true
      this.error = null
      
      try {
        this.issues = await aikidoService.getRepositoryIssues(this.repository.id)
        this.filteredIssues = [...this.issues]
      } catch (error) {
        this.error = 'Failed to load issues. Please try again.'
        console.error('Error loading issues:', error)
      } finally {
        this.loading = false
      }
    },


    filterIssues() {
      this.filteredIssues = this.issues.filter(issue => {
        const severityMatch = !this.selectedSeverity || issue.severity === this.selectedSeverity
        return severityMatch
      })
    },

    getSeverityClass(severity) {
      const severityMap = {
        'critical': 'severity-critical',
        'high': 'severity-high',
        'medium': 'severity-medium',
        'low': 'severity-low'
      }
      return severityMap[severity] || 'severity-unknown'
    },


    formatDate(timestamp) {
      if (typeof timestamp === 'number') {
        return new Date(timestamp * 1000).toLocaleDateString()
      }
      return new Date(timestamp).toLocaleDateString()
    },

    getCodeSnippet(issue) {
      return issue.code_snippet || ''
    },

    async suggestFix(issue) {
      this.suggestingFix = true
      
      try {
        const issueData = {
          issueId: issue.id
        }
        
        this.$emit('suggest-fix', issueData)
      } catch (error) {
        console.error('Error suggesting fix:', error)
        alert('Failed to generate fix suggestion. Please try again.')
      } finally {
        this.suggestingFix = false
      }
    },

    viewDetails(issue) {
      this.selectedIssue = issue
      this.showDetailsModal = true
    },

    closeDetailsModal() {
      this.showDetailsModal = false
      this.selectedIssue = null
    },

  }
}
</script>

<style scoped>
.repository-issues {
  max-width: 1000px;
  margin: 0 auto;
}

.repo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e1e5e9;
}

.repo-header h2 {
  margin: 0;
  color: #333;
}

.repo-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.loading, .error {
  text-align: center;
  padding: 3rem 0;
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

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.issues-grid {
  display: grid;
  gap: 1.5rem;
}

.issue-card {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.issue-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.issue-card.severity-critical {
  border-left: 4px solid #dc3545;
}

.issue-card.severity-high {
  border-left: 4px solid #fd7e14;
}

.issue-card.severity-medium {
  border-left: 4px solid #ffc107;
}

.issue-card.severity-low {
  border-left: 4px solid #28a745;
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.issue-title h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.issue-type {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.severity-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-critical {
  background: #f8d7da;
  color: #721c24;
}

.severity-high {
  background: #fff3cd;
  color: #856404;
}

.severity-medium {
  background: #d1ecf1;
  color: #0c5460;
}

.severity-low {
  background: #d4edda;
  color: #155724;
}

.issue-description {
  margin-bottom: 1rem;
}

.issue-description p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.issue-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.detail-item {
  color: #666;
}

.code-snippet {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
}

.code-snippet h5 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 0.9rem;
}

.code-snippet pre {
  background: #2d3748;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0 0 1rem 0;
  font-size: 0.85rem;
  line-height: 1.4;
}

.suggest-fix-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.suggest-fix-btn:hover:not(:disabled) {
  background: #5a6fd8;
}

.suggest-fix-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.issue-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-outline {
  background: white;
  color: #667eea;
  border-color: #667eea;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
}

.btn-primary {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.btn-primary:hover {
  background: #5a6fd8;
  border-color: #5a6fd8;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e1e5e9;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e1e5e9;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.issue-detail-section {
  margin-bottom: 2rem;
}

.issue-detail-section h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
}

.issue-detail-section h5 {
  margin: 0 0 1rem 0;
  color: #555;
  font-size: 1rem;
  border-bottom: 1px solid #e1e5e9;
  padding-bottom: 0.5rem;
}

.issue-detail-section .issue-description {
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item strong {
  color: #333;
  font-size: 0.9rem;
}

.detail-item .severity-badge {
  align-self: flex-start;
}

.file-path-header {
  margin: 0.75rem 0;
  padding: 0.5rem;
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  border-radius: 0 4px 4px 0;
}

.file-path-text {
  word-break: break-all;
  font-family: monospace;
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}
</style>
