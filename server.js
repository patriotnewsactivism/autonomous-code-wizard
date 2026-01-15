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