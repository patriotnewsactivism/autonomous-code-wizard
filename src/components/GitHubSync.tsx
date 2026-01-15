import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Github, GitPullRequest, FileCode, CheckCircle2, AlertTriangle, File, ChevronRight, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface RepoFile {
  path: string;
  content: string;
  sha: string;
  fixedContent?: string;
  issues?: any[];
}

interface RepoData {
  owner: string;
  repo: string;
  files: RepoFile[];
  totalFiles: number;
}

export const GitHubSync = () => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/facebook/react');
  const [isLoading, setIsLoading] = useState(false);
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [selectedFile, setSelectedFile] = useState<RepoFile | null>(null);
  const [analyzedFiles, setAnalyzedFiles] = useState<Map<string, RepoFile>>(new Map());
  const [isPushing, setIsPushing] = useState(false);
  const { toast } = useToast();

  const fetchRepo = async () => {
    if (!repoUrl.trim()) {
      toast({
        title: 'No repository URL',
        description: 'Please enter a GitHub repository URL',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setRepoData(null);
    setSelectedFile(null);
    setAnalyzedFiles(new Map());

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/functions/v1/fetch-repo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl }),
        }
      );

      if (!response.ok) throw new Error('Failed to fetch repository');

      const data = await response.json();
      setRepoData(data);
      if (data.files.length > 0) {
        setSelectedFile(data.files[0]);
      }
      
      toast({
        title: 'Repository loaded',
        description: `Fetched ${data.files.length} code files`,
      });
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: 'Failed to fetch repository',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeSingleFile = async (file: RepoFile) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/functions/v1/analyze-code`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: file.content }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const updatedFile = {
          ...file,
          fixedContent: result.fixedCode,
          issues: result.issues,
        };
        
        setAnalyzedFiles(prev => new Map(prev).set(file.path, updatedFile));
        
        if (selectedFile?.path === file.path) {
            setSelectedFile(updatedFile);
        }

        return updatedFile;
      }
    } catch (error) {
      console.error(`Failed to analyze ${file.path}:`, error);
    }
    return null;
  };

  const analyzeAll = async () => {
    if (!repoData) return;
    setIsLoading(true);
    let count = 0;
    
    // Process in parallel roughly
    const promises = repoData.files.map(f => analyzeSingleFile(f));
    await Promise.all(promises);
    
    setIsLoading(false);
    toast({ title: 'Analysis complete', description: `Analyzed all files` });
  };

  const pushFixes = async () => {
    if (!repoData || analyzedFiles.size === 0) return;
    setIsPushing(true);

    try {
      const filesToUpdate = Array.from(analyzedFiles.values())
        .filter(f => f.fixedContent && f.fixedContent !== f.content)
        .map(f => ({
          path: f.path,
          content: f.fixedContent!,
          sha: f.sha,
        }));

      if (filesToUpdate.length === 0) {
        toast({ title: 'No changes', description: 'No fixes to push.' });
        setIsPushing(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/functions/v1/push-fixes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: repoData.owner,
            repo: repoData.repo,
            files: filesToUpdate,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to push fixes');
      const result = await response.json();
      
      toast({ title: 'PR Created!', description: `PR #${result.pullRequestNumber}` });
      window.open(result.pullRequestUrl, '_blank');
    } catch (error) {
      toast({ title: 'Push failed', variant: 'destructive' });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px] flex flex-col gap-4">
      {/* Top Bar */}
      <div className="flex gap-2">
        <Input
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="flex-1 bg-slate-950 border-slate-800"
        />
        <Button onClick={fetchRepo} disabled={isLoading} className="bg-primary/20 text-primary hover:bg-primary/30">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4 mr-2" />}
          Load Repo
        </Button>
      </div>

      {repoData ? (
        <div className="grid grid-cols-[300px_1fr] gap-4 flex-1 overflow-hidden">
            {/* Sidebar: File List */}
            <Card className="bg-slate-950 border-slate-800 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Explorer</span>
                    <Button variant="ghost" size="icon" onClick={analyzeAll} title="Analyze All">
                        <Play className="h-3 w-3" />
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {repoData.files.map((file) => {
                            const analysis = analyzedFiles.get(file.path);
                            const issueCount = analysis?.issues?.length || 0;
                            const isSelected = selectedFile?.path === file.path;

                            return (
                                <button
                                    key={file.path}
                                    onClick={() => setSelectedFile(analysis || file)}
                                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                                        isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-slate-900 text-slate-400'
                                    }`}
                                >
                                    <File className="h-4 w-4 shrink-0" />
                                    <span className="truncate flex-1">{file.path}</span>
                                    {issueCount > 0 && (
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 border-yellow-500/50 text-yellow-500">
                                            {issueCount}
                                        </Badge>
                                    )}
                                    {analysis && issueCount === 0 && (
                                         <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
                 <div className="p-3 border-t border-slate-800">
                     <Button 
                        onClick={pushFixes} 
                        disabled={isPushing || analyzedFiles.size === 0} 
                        className="w-full bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30"
                    >
                         {isPushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitPullRequest className="h-4 w-4 mr-2" />}
                         Push Fixes
                     </Button>
                 </div>
            </Card>

            {/* Main: Content Preview */}
            <Card className="bg-slate-950 border-slate-800 flex flex-col overflow-hidden">
                {selectedFile ? (
                    <>
                        <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-200">{selectedFile.path}</span>
                            <Button 
                                size="sm" 
                                variant="secondary" 
                                onClick={() => analyzeSingleFile(selectedFile)}
                                className="h-7 text-xs"
                            >
                                <FileCode className="h-3 w-3 mr-2" />
                                Analyze File
                            </Button>
                        </div>
                        <div className="grid grid-rows-[1fr_auto] h-full overflow-hidden">
                            <ScrollArea className="flex-1 bg-slate-950 p-4 font-mono text-sm text-slate-300">
                                <pre>{selectedFile.content}</pre>
                            </ScrollArea>
                            
                            {/* Issues Panel */}
                            {selectedFile.issues && selectedFile.issues.length > 0 && (
                                <div className="h-[200px] border-t border-slate-800 bg-slate-900/30 overflow-hidden flex flex-col">
                                    <div className="p-2 bg-slate-900/50 border-b border-slate-800 text-xs font-semibold text-muted-foreground uppercase">
                                        Problems
                                    </div>
                                    <ScrollArea className="flex-1 p-2">
                                        <div className="space-y-2">
                                            {selectedFile.issues.map((issue: any, i: number) => (
                                                <div key={i} className="flex gap-2 text-xs p-2 rounded bg-slate-900 border border-slate-800">
                                                    <AlertTriangle className={`h-4 w-4 ${issue.type === 'error' ? 'text-red-500' : 'text-yellow-500'}`} />
                                                    <div className="flex-1">
                                                        <div className="font-medium text-slate-200">
                                                            Line {issue.line}: {issue.message}
                                                        </div>
                                                        <div className="text-slate-500 mt-1">{issue.description}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        Select a file to view
                    </div>
                )}
            </Card>
        </div>
      ) : (
        <Card className="flex-1 flex items-center justify-center bg-slate-950/50 border-dashed border-slate-800">
            <div className="text-center space-y-2 text-muted-foreground">
                <Github className="h-10 w-10 mx-auto opacity-50" />
                <p>Enter a repository URL to start</p>
            </div>
        </Card>
      )}
    </div>
  );
};
