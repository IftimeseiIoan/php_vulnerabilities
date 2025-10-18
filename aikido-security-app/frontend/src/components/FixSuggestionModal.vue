<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>AI-Generated Fix Suggestion</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <h4>AI is analyzing your code...</h4>
          <p>Generating a secure fix for the vulnerability</p>
        </div>

        <div v-else>
          <div class="fix-info">
            <div class="info-item">
              <strong>Issue Type:</strong> {{ issueType }}
            </div>
            <div class="info-item">
              <strong>Description:</strong> {{ description }}
            </div>
          </div>

        <div class="code-comparison">
          <h4>Code Diff: Vulnerable → Secure</h4>
          <div class="diff-container">
            <Diff
              :prev="originalCode"
              :current="fixedCode"
              mode="split"
              theme="light"
              language="html"
            />
            <div v-if="!originalCode || !fixedCode" style="padding: 20px; text-align: center; color: #666;">
              <p>No code data available</p>
              <p>Original: {{ originalCode ? 'Available' : 'Missing' }}</p>
              <p>Fixed: {{ fixedCode ? 'Available' : 'Missing' }}</p>
            </div>
          </div>
        </div>

        </div>
      </div>

      <div class="modal-footer">
        <button @click="copyFixedCode" class="btn btn-secondary">
          📋 Copy Fixed Code
        </button>
        <button @click="$emit('close')" class="btn btn-primary">
          Got it, thanks!
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FixSuggestionModal',
  props: {
    originalCode: {
      type: String,
      required: true
    },
    fixedCode: {
      type: String,
      required: true
    },
    issueType: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },


    async copyFixedCode() {
      try {
        await navigator.clipboard.writeText(this.fixedCode)
        alert('Fixed code copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy code:', error)
        const textArea = document.createElement('textarea')
        textArea.value = this.fixedCode
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('Fixed code copied to clipboard!')
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 1000px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e1e5e9;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 1.5rem;
}

.fix-info {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  margin-bottom: 0.5rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.code-comparison {
  margin-bottom: 1.5rem;
}

.code-comparison h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
  text-align: center;
}

.diff-container {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
  min-height: 300px;
}

.diff-container .vue-diff {
  height: 100%;
  min-height: 300px;
  font-size: 0.75rem;
}

.diff-container div,
.diff-container div * {
  font-size: 0.65rem !important;
  line-height: 1.2 !important;
}



.loading-state {
  text-align: center;
  padding: 3rem 2rem;
}

.loading-state .spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

.loading-state h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
}

.loading-state p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.diff-container .vue-diff {
  border: none;
  border-radius: 0;
}

.diff-container .vue-diff .diff-header {
  background: #f8f9fa;
  border-bottom: 1px solid #e1e5e9;
  padding: 0.5rem 1rem;
  font-weight: 600;
  color: #495057;
}

.diff-container .vue-diff .diff-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.4;
}





.tip {
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid #ff9800;
  font-size: 0.9rem;
  line-height: 1.4;
}

.tip strong {
  color: #e65100;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e1e5e9;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd8;
}

@media (max-width: 768px) {
  .diff-container {
    font-size: 0.8rem;
  }
  
  .diff-container .vue-diff .diff-content {
    font-size: 0.8rem;
  }
  
  .tips-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}
</style>
