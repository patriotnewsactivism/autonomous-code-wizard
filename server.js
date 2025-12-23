import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Enhanced code analysis function with more detailed information
function analyzeCode(code) {
  const issues = [];
  let fixedCode = code;
  
  // Split code into lines for analysis
  const lines = code.split('\n');
  
  // Check for common issues
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Check for console.log statements
    if (line.includes('console.log')) {
      issues.push({
        type: 'warning',
        category: 'logging',
        line: lineNum,
        column: line.indexOf('console.log') + 1,
        message: 'Console.log statement found',
        description: 'Remove console.log in production; prefer a logger.',
        severity: 'medium',
        code: line.trim()
      });
    }
    
    // Check for var usage
    if (line.match(/\bvar\s+/)) {
      const varMatch = line.match(/\bvar\s+(\w+)/);
      const varName = varMatch ? varMatch[1] : 'variable';
      
      issues.push({
        type: 'error',
        category: 'best-practice',
        line: lineNum,
        column: line.indexOf('var') + 1,
        message: `Use 'const' or 'let' instead of 'var'`,
        description: `Replace 'var' on ${varName} to avoid accidental scope leaks.`,
        severity: 'high',
        code: line.trim()
      });
    }
    
    // Check for == instead of ===
    if (line.includes('==') && !line.includes('===') && !line.includes('!=') && !line.includes('!==')) {
      issues.push({
        type: 'warning',
        category: 'best-practice',
        line: lineNum,
        column: line.indexOf('==') + 1,
        message: 'Use strict equality (===) instead of loose equality (==)',
        description: 'Use === to avoid type coercion surprises.',
        severity: 'medium',
        code: line.trim()
      });
    }
    
    // Check for missing semicolons (simple check)
    const trimmedLine = line.trim();
    if (trimmedLine && 
        !trimmedLine.endsWith(';') && 
        !trimmedLine.endsWith('{') && 
        !trimmedLine.endsWith('}') &&
        !trimmedLine.endsWith(',') &&
        !trimmedLine.startsWith('//') &&
        !trimmedLine.startsWith('/*') &&
        !trimmedLine.startsWith('*') &&
        (trimmedLine.includes('let ') || 
         trimmedLine.includes('const ') || 
         trimmedLine.includes('return ') ||
         trimmedLine.match(/^\w+\s*=/))) {
      
      issues.push({
        type: 'suggestion',
        category: 'syntax',
        line: lineNum,
        column: line.length,
        message: 'Missing semicolon',
        description: 'Add a semicolon for consistent termination.',
        severity: 'low',
        code: line.trim()
      });
    }
  }
  
  // Apply fixes to the code
  // Replace var with let
  fixedCode = fixedCode.replace(/\bvar\b/g, 'let');
  
  // Replace == with === (simple replacement)
  fixedCode = fixedCode.replace(/([^=!])==([^=])/g, '$1===$2');
  
  // Add semicolons where missing (simple approach)
  const fixedLines = fixedCode.split('\n');
  for (let i = 0; i < fixedLines.length; i++) {
    const line = fixedLines[i];
    const trimmedLine = line.trim();
    if (trimmedLine && 
        !trimmedLine.endsWith(';') && 
        !trimmedLine.endsWith('{') && 
        !trimmedLine.endsWith('}') &&
        !trimmedLine.endsWith(',') &&
        !trimmedLine.startsWith('//') &&
        !trimmedLine.startsWith('/*') &&
        !trimmedLine.startsWith('*') &&
        (trimmedLine.includes('let ') || 
         trimmedLine.includes('const ') || 
         trimmedLine.includes('return ') ||
         trimmedLine.match(/^\w+\s*=/))) {
      fixedLines[i] = line + ';';
    }
  }
  fixedCode = fixedLines.join('\n');
  
  // Generate summary
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const suggestionCount = issues.filter(i => i.type === 'suggestion').length;
  
  let summary = issues.length === 0
    ? 'No issues found.'
    : `Found ${issues.length} issue${issues.length === 1 ? '' : 's'} (${errorCount} errors, ${warningCount} warnings, ${suggestionCount} suggestions).`;
  
  return {
    issues,
    fixedCode,
    summary,
    stats: {
      total: issues.length,
      errors: errorCount,
      warnings: warningCount,
      suggestions: suggestionCount
    }
  };
}

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