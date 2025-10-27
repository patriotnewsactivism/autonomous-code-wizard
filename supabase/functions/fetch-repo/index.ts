import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repoUrl } = await req.json();
    
    if (!repoUrl) {
      return new Response(
        JSON.stringify({ error: 'Repository URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
    if (!GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'GitHub integration not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse GitHub URL to extract owner and repo
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid GitHub repository URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const owner = repoMatch[1];
    const repo = repoMatch[2].replace('.git', '');

    // Fetch repository tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Lovable-Code-Fixer',
        },
      }
    );

    if (!treeResponse.ok) {
      const errorData = await treeResponse.json();
      console.error('GitHub API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch repository', details: errorData.message }),
        { status: treeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const treeData = await treeResponse.json();
    
    // Filter for code files only
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.rb'];
    const codeFiles = treeData.tree.filter((file: any) => 
      file.type === 'blob' && 
      codeExtensions.some(ext => file.path.endsWith(ext)) &&
      file.size < 100000 // Limit to files under 100KB
    );

    // Fetch content of code files
    const files = await Promise.all(
      codeFiles.slice(0, 20).map(async (file: any) => { // Limit to first 20 files
        try {
          const contentResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`,
            {
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3.raw',
                'User-Agent': 'Lovable-Code-Fixer',
              },
            }
          );

          if (contentResponse.ok) {
            const content = await contentResponse.text();
            return {
              path: file.path,
              content,
              sha: file.sha,
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching ${file.path}:`, error);
          return null;
        }
      })
    );

    const validFiles = files.filter(f => f !== null);

    return new Response(
      JSON.stringify({
        owner,
        repo,
        files: validFiles,
        totalFiles: codeFiles.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-repo function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
