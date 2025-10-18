const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Predefined vulnerable code for backtick vulnerability demo
const BACKTICK_VULNERABLE_CODE = `<?php
if (isset($_GET['ns_dig']) && !empty($_GET['ns_dig'])) {
 $ns_dig = explode(',', $_GET['ns_dig']);
} else {
 $ns_dig = ['8.8.8.8', '8.8.4.4'];
}
$domains = ['domain' => 'example.com'];
$first = \`dig @$ns_dig[0] -t ns $domains[domain]\`;
echo "<pre>$first</pre>";
$second = \`dig @$ns_dig[1] -t ns $domains[domain]\`;
echo "<pre>$second</pre>";`;

const AIKIDO_BASE_URL = 'https://app.aikido.dev/api/public/v1';
const AIKIDO_TOKEN_URL = 'https://app.aikido.dev/api/oauth/token';

function isPHPBacktickVulnerability(issue) {
  return issue.rule === 'Using backticks in PHP can lead to remote code execution';
}

// OAuth 2.0 Client Credentials flow
let accessToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  // Check if we have a valid token
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    // Create Basic Auth header with Client ID and Client Secret
    const credentials = Buffer.from(`${process.env.AIKIDO_CLIENT_ID}:${process.env.AIKIDO_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(AIKIDO_TOKEN_URL, {
      grant_type: 'client_credentials'
    }, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    accessToken = response.data.access_token;
    // Set expiry time (subtract 60 seconds for safety margin)
    tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
    
    console.log('Successfully obtained Aikido access token');
    return accessToken;
  } catch (error) {
    console.error('Failed to obtain Aikido access token:', error.response?.data || error.message);
    throw new Error('Authentication failed');
  }
}

const makeAikidoRequest = async (endpoint) => {
  try {
    const token = await getAccessToken();
    const response = await axios.get(`${AIKIDO_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Aikido API Error:', error.response?.data || error.message);
    throw error;
  }
};

app.get('/api/repositories', async (req, res) => {
  try {
    const repositories = await makeAikidoRequest('/repositories/code');
    res.json(repositories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

app.get('/api/repositories/:repoId/issues', async (req, res) => {
  try {
    const { repoId } = req.params;
    const issues = await makeAikidoRequest(`/issues/export?filter_code_repo_id=${repoId}`);
    
    // Add code snippet for PHP backtick vulnerabilities
    const issuesWithCodeSnippets = issues.map(issue => {
      if (isPHPBacktickVulnerability(issue)) {
        issue.code_snippet = BACKTICK_VULNERABLE_CODE;
      }
      return issue;
    });
    
    res.json(issuesWithCodeSnippets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repository issues' });
  }
});


app.post('/api/suggest-fix', async (req, res) => {
  try {
    const { issueId } = req.body;

    if (!issueId) {
      return res.status(400).json({ 
        error: 'Missing required field: issueId' 
      });
    }

    // Fetch issue details from Aikido API
    const issue = await makeAikidoRequest(`/issues/${parseInt(issueId)}`);
    
    // Check if this is a PHP backtick vulnerability
    if (!isPHPBacktickVulnerability(issue)) {
      return res.status(400).json({ 
        error: 'This endpoint only handles PHP backtick vulnerabilities with rule ID: AIK_backticks-use' 
      });
    }

    const prompt = `You are a security expert reviewing PHP code for vulnerabilities. 

The following PHP code contains a backtick vulnerability that can lead to remote code execution:

${BACKTICK_VULNERABLE_CODE}

Please provide a secure fix for this code. The fix should:
1. Remove the backtick execution and replace it with a safer alternative
2. Maintain the same functionality but in a secure way
3. Include proper input validation and sanitization
4. Use PHP's built-in functions instead of shell execution

Respond with ONLY the fixed code, no explanations or markdown formatting.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a security expert specializing in PHP vulnerabilities. Provide clean, secure code fixes without any explanations or formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const fixedCode = completion.choices[0].message.content.trim();

    res.json({
      originalCode: BACKTICK_VULNERABLE_CODE,
      fixedCode: fixedCode,
      issueType: issue.type,
      description: issue.rule
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ error: 'Failed to generate fix suggestion' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
