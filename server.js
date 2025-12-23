import express from 'express';
import cors from 'cors';
import { analyzeCode } from './lib/analyzer.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mock GitHub repository fetching
function fetchRepo(repoUrl) {
  // In a real implementation, this would actually fetch from GitHub
  // For now, we'll return a mock response
  const urlParts = repoUrl.replace('https://github.com/', '').split('/');
  const owner = urlParts[0] || 'unknown';
  const repo = urlParts[1] || 'unknown';
  
  return {
    owner,
    repo,
    files: [
      {
        path: 'src/index.js',
        content: 'var greeting = "Hello World";\nconsole.log(greeting);',
        sha: 'abc123'
      },
      {
        path: 'src/utils.js',
        content: 'function add(a,b){\nreturn a+b\n}\nvar result = add(1, 2)\nconsole.log(result)',
        sha: 'def456'
      },
      {
        path: 'README.md',
        content: '# My Project\n\nThis is a sample project.',
        sha: 'ghi789'
      }
    ],
    totalFiles: 3
  };
}

// Mock GitHub push functionality
function pushFixes(owner, repo, files) {
  // In a real implementation, this would actually push to GitHub
  // For now, we'll return a mock response
  return {
    pullRequestNumber: Math.floor(Math.random() * 1000) + 1,
    pullRequestUrl: `https://github.com/${owner}/${repo}/pull/${Math.floor(Math.random() * 1000) + 1}`
  };
}

// Analyze code endpoint
app.post('/functions/v1/analyze-code', (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    console.log('Analyzing code...');
    const result = analyzeCode(code);
    console.log(`Found ${result.issues.length} issues`);
    
    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze code', details: error.message });
  }
});

// Fetch repository endpoint
app.post('/functions/v1/fetch-repo', (req, res) => {
  try {
    const { repoUrl } = req.body;
    
    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }
    
    console.log('Fetching repository:', repoUrl);
    
    const result = fetchRepo(repoUrl);
    console.log(`Fetched ${result.files.length} files from ${result.owner}/${result.repo}`);
    
    res.json(result);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch repository', details: error.message });
  }
});

// Push fixes endpoint
app.post('/functions/v1/push-fixes', (req, res) => {
  try {
    const { owner, repo, files } = req.body;
    
    if (!owner || !repo || !files) {
      return res.status(400).json({ error: 'Owner, repo, and files are required' });
    }
    
    console.log(`Creating PR for ${owner}/${repo} with ${files.length} files`);
    
    const result = pushFixes(owner, repo, files);
    console.log(`Created PR: ${result.pullRequestUrl}`);
    
    res.json(result);
  } catch (error) {
    console.error('Push error:', error);
    res.status(500).json({ error: 'Failed to push fixes', details: error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server running at http://localhost:${port}`);
  console.log(`Functions available at:`);
  console.log(`  - http://localhost:${port}/functions/v1/analyze-code`);
  console.log(`  - http://localhost:${port}/functions/v1/fetch-repo`);
  console.log(`  - http://localhost:${port}/functions/v1/push-fixes`);
});