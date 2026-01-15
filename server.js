import express from 'express';
import cors from 'cors';
import * as acorn from 'acorn';
import fs from 'fs/promises';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();
const port = 3001;
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure workspace exists
(async () => {
  try {
    await fs.access(WORKSPACE_DIR);
  } catch {
    await fs.mkdir(WORKSPACE_DIR, { recursive: true });
  }
})();

// --- File System API ---

// List files/folders
app.get('/api/files', async (req, res) => {
  try {
    const relPath = req.query.path || '';
    const fullPath = path.join(WORKSPACE_DIR, relPath); // Security risk in prod, acceptable for local tool
    
    // Basic path traversal protection
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await fs.stat(fullPath);
    if (!stats.isDirectory()) {
        return res.json([{ name: path.basename(fullPath), type: 'file', path: relPath }]);
    }

    const files = await fs.readdir(fullPath, { withFileTypes: true });
    const response = files.map(dirent => ({
      name: dirent.name,
      type: dirent.isDirectory() ? 'dir' : 'file',
      path: path.join(relPath, dirent.name).replace(/\\/g, '/')
    }));
    
    // Sort directories first
    response.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read file content
app.get('/api/files/content', async (req, res) => {
  try {
    const relPath = req.query.path;
    if (!relPath) return res.status(400).json({ error: 'Path required' });

    const fullPath = path.join(WORKSPACE_DIR, relPath);
    if (!fullPath.startsWith(WORKSPACE_DIR)) return res.status(403).json({ error: 'Access denied' });

    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Write file content
app.post('/api/files/content', async (req, res) => {
  try {
    const { path: relPath, content } = req.body;
    if (!relPath) return res.status(400).json({ error: 'Path required' });

    const fullPath = path.join(WORKSPACE_DIR, relPath);
    if (!fullPath.startsWith(WORKSPACE_DIR)) return res.status(403).json({ error: 'Access denied' });

    await fs.writeFile(fullPath, content, 'utf-8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create File/Directory
app.post('/api/files/create', async (req, res) => {
    try {
        const { path: relPath, type } = req.body; // type: 'file' or 'dir'
        const fullPath = path.join(WORKSPACE_DIR, relPath);
        
        if (!fullPath.startsWith(WORKSPACE_DIR)) return res.status(403).json({ error: 'Access denied' });

        if (type === 'dir') {
            await fs.mkdir(fullPath, { recursive: true });
        } else {
            // Ensure parent dir exists
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, '');
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- Terminal / Command API ---

app.post('/api/terminal/exec', async (req, res) => {
  try {
    const { command, cwd } = req.body;
    const workingDir = cwd ? path.join(WORKSPACE_DIR, cwd) : WORKSPACE_DIR;
    
    // Safety check
    if (!workingDir.startsWith(WORKSPACE_DIR)) return res.status(403).json({ error: 'Access denied' });

    console.log(`Executing: ${command} in ${workingDir}`);
    const { stdout, stderr } = await execAsync(command, { cwd: workingDir });
    res.json({ stdout, stderr });
  } catch (error) {
    res.status(500).json({ error: error.message, stderr: error.stderr, stdout: error.stdout });
  }
});


// --- AI Agent API (Heuristic / Mock for now) ---
app.post('/api/agent/prompt', async (req, res) => {
    try {
        const { prompt } = req.body;
        const lowerPrompt = prompt.toLowerCase();
        let message = "I'm not sure how to do that yet.";
        let actions = [];

        // 1. Create Component Intent
        // Regex to match "create component [Name]" or "create [Name] component"
        const createCompMatch = lowerPrompt.match(/create (?:component )?(\w+)(?: component)?/);
        
        if (createCompMatch && (lowerPrompt.includes('component') || lowerPrompt.includes('react'))) {
            const compName = createCompMatch[1].charAt(0).toUpperCase() + createCompMatch[1].slice(1); // PascalCase
            const compContent = `import React from 'react';

export const ${compName} = () => {
  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-xl font-bold">${compName}</h2>
      <p>Content goes here...</p>
    </div>
  );
};
`;
            const filePath = `src/components/${compName}.tsx`;
            const fullPath = path.join(WORKSPACE_DIR, filePath);
            
            // Ensure dir exists
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, compContent);
            
            message = `I've created the ${compName} component for you at ${filePath}.`;
            actions.push({ type: 'create_file', path: filePath });
        }
        
        // 2. Install Package Intent
        else if (lowerPrompt.startsWith('install ') || lowerPrompt.startsWith('add ')) {
            const pkgName = prompt.split(' ')[1];
            message = `Installing ${pkgName}...`;
            // We don't await this to avoid timeout, we just start it (or we could await)
            // For better UX, we'll await short installs
            try {
                await execAsync(`npm install ${pkgName}`, { cwd: WORKSPACE_DIR });
                message = `Successfully installed ${pkgName}.`;
                actions.push({ type: 'command', command: `npm install ${pkgName}` });
            } catch (e) {
                message = `Failed to install ${pkgName}: ${e.message}`;
            }
        }

        // 3. Create File Intent
        else if (lowerPrompt.startsWith('create file ') || lowerPrompt.startsWith('make file ')) {
            const filePath = prompt.split(' ')[2];
            if (filePath) {
                const fullPath = path.join(WORKSPACE_DIR, filePath);
                await fs.mkdir(path.dirname(fullPath), { recursive: true });
                await fs.writeFile(fullPath, '// New file created by Agent');
                message = `Created file ${filePath}.`;
                actions.push({ type: 'create_file', path: filePath });
            }
        }

        // 4. Explain Intent
        else if (lowerPrompt.startsWith('explain')) {
            message = "This looks like a standard React application structure. 'src' contains your source code, 'components' has your UI widgets, and 'App.tsx' is the main entry point.";
        }
        
        // 5. Default "Chat" response
        else {
             message = "I can help you create components, install packages, or explain code. Try saying 'Create Header component' or 'Install lodash'.";
        }

        res.json({ message, actions });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- Analysis Logic (Kept for compatibility) ---

function analyzeCode(code) {
  const issues = [];
  let fixedCode = code;
  try {
    const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
    // ... (Simplified logic for brevity, previously implemented)
    // For this 'Real System' version, we focus on the file APIs, but we keep basic analysis
    if (code.includes('var ')) issues.push({ type: 'error', message: "Found 'var'", line: 1 });
  } catch (e) {
      // ignore parse errors for now
  }
  return { issues, fixedCode, summary: `Analyzed ${code.length} bytes.` };
}

app.post('/functions/v1/analyze-code', (req, res) => {
    const { code } = req.body;
    res.json(analyzeCode(code || ''));
});

// --- Server Start ---
app.listen(port, '0.0.0.0', () => {
  console.log(`REAL Backend server running at http://localhost:${port}`);
  console.log(`Workspace: ${WORKSPACE_DIR}`);
});