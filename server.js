import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Simple code analysis function
function analyzeCode(code) {
  const issues = [];
  const lines = code.split('\n');
  
  // Check for common issues
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Check for console.log statements
    if (line.includes('console.log')) {
      issues.push({
        type: 'suggestion',
        category: 'logging',
        line: lineNum,
        description: 'Consider removing console.log statements in production code',
        severity: 'low'
      });
    }
    
    // Check for var usage
    if (line.includes('var ')) {
      issues.push({
        type: 'suggestion',
        category: 'best-practice',
        line: lineNum,
        description: 'Prefer const or let over var for variable declarations',
        severity: 'medium'
      });
    }
    
    // Check for missing semicolons
    if (line.trim() !== '' && !line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
      // Simple check - not comprehensive
      if (line.includes('let ') || line.includes('const ') || line.includes('return ') || line.includes('throw ')) {
        issues.push({
          type: 'suggestion',
          category: 'syntax',
          line: lineNum,
          description: 'Consider adding semicolons to terminate statements',
          severity: 'low'
        });
      }
    }
  }
  
  // Simple code fixing
  let fixedCode = code;
  
  // Replace var with let
  fixedCode = fixedCode.replace(/\bvar\b/g, 'let');
  
  return {
    issues,
    fixedCode,
    summary: `Analysis complete with ${issues.length} suggestions`
  };
}

// Mock GitHub repository fetching
function fetchRepo(repoUrl) {
  // In a real implementation, this would actually fetch from GitHub
  // For now, we'll return a mock response
  const owner = repoUrl.split('/')[3] || 'unknown';
  const repo = repoUrl.split('/')[4] || 'unknown';
  
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
        path: 'README.md',
        content: '# My Project\n\nThis is a sample project.',
        sha: 'def456'
      }
    ],
    totalFiles: 2
  };
}

// Mock GitHub push functionality
function pushFixes(owner, repo, files) {
  // In a real implementation, this would actually push to GitHub
  // For now, we'll return a mock response
  return {
    pullRequestNumber: 1,
    pullRequestUrl: `https://github.com/${owner}/${repo}/pull/1`
  };
}

// Analyze code endpoint
app.post('/functions/v1/analyze-code', (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    const result = analyzeCode(code);
    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze code' });
  }
});

// Fetch repository endpoint
app.post('/functions/v1/fetch-repo', (req, res) => {
  try {
    const { repoUrl } = req.body;
    
    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }
    
    const result = fetchRepo(repoUrl);
    res.json(result);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch repository' });
  }
});

// Push fixes endpoint
app.post('/functions/v1/push-fixes', (req, res) => {
  try {
    const { owner, repo, files } = req.body;
    
    if (!owner || !repo || !files) {
      return res.status(400).json({ error: 'Owner, repo, and files are required' });
    }
    
    const result = pushFixes(owner, repo, files);
    res.json(result);
  } catch (error) {
    console.error('Push error:', error);
    res.status(500).json({ error: 'Failed to push fixes' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server running at http://localhost:${port}`);
  console.log(`Functions available at:`);
  console.log(`  - http://localhost:${port}/functions/v1/analyze-code`);
  console.log(`  - http://localhost:${port}/functions/v1/fetch-repo`);
  console.log(`  - http://localhost:${port}/functions/v1/push-fixes`);
});