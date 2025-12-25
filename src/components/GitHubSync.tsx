import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Github, GitPullRequest, FileCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface AnalysisIssue {
  type: 'error' | 'warning' | 'suggestion';
  category: string;
  line?: number;
  description: string;
  severity: string;
}

interface RepoFile {
  path: string;
  content: string;
  sha: string;
  fixedContent?: string;
  issues?: AnalysisIssue[];
}

interface RepoData {
  owner: string;
  repo: string;
  files: RepoFile[];
  totalFiles: number;
}

export const GitHubSync = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [analyzedFiles, setAnalyzedFiles] = useState<RepoFile[]>([]);
  const [isPushing, setIsPushing] = useState(false);
  const { toast } = useToast();

  const backendUrl = useMemo(
    () => `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/functions/v1`,
    []
  );

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
    setAnalyzedFiles([]);

    try {
      const response = await fetch(`${backendUrl}/fetch-repo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch repository');
      }

      const data = await response.json();
      setRepoData(data);
      
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

  const analyzeFiles = async () => {
    if (!repoData) return;

    setIsLoading(true);

    try {
      const fileAnalyses = await Promise.all(
        repoData.files.map(async (file) => {
          try {
            const response = await fetch(`${backendUrl}/analyze-code`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code: file.content }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Analysis failed');
            }

            const result = await response.json();
            return {
              ...file,
              fixedContent: result.fixedCode,
              issues: result.issues as AnalysisIssue[],
            } satisfies RepoFile;
          } catch (error) {
            console.error(`Failed to analyze ${file.path}:`, error);
            return null;
          }
        })
      );

      const successfulAnalyses = fileAnalyses.filter((file): file is RepoFile => Boolean(file));
      setAnalyzedFiles(successfulAnalyses);

      toast({
        title: 'Analysis complete',
        description: `Analyzed ${successfulAnalyses.length} files`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pushFixes = async () => {
    if (!repoData || analyzedFiles.length === 0) return;

    setIsPushing(true);

    try {
      const filesToUpdate = analyzedFiles
        .filter(f => f.fixedContent && f.fixedContent !== f.content)
        .map(f => ({
          path: f.path,
          content: f.fixedContent!,
          sha: f.sha,
        }));

      if (filesToUpdate.length === 0) {
        toast({
          title: 'No changes to push',
          description: 'All files are already correct',
        });
        setIsPushing(false);
        return;
      }

      const response = await fetch(`${backendUrl}/push-fixes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: repoData.owner,
          repo: repoData.repo,
          files: filesToUpdate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to push fixes');
      }

      const result = await response.json();
      
      toast({
        title: 'Pull request created!',
        description: `View PR #${result.pullRequestNumber}`,
      });

      // Open PR in new tab
      window.open(result.pullRequestUrl, '_blank');
    } catch (error) {
      console.error('Push error:', error);
      toast({
        title: 'Failed to push fixes',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <Github className="h-4 w-4 text-primary" />
            GitHub Repository URL
          </label>
          <div className="flex gap-2">
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="flex-1 bg-secondary/50 border-border transition-all focus:border-primary"
            />
            <Button 
              onClick={fetchRepo} 
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 shadow-[var(--shadow-glow)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Github className="mr-2 h-4 w-4" />
                  Fetch Repo
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {repoData && (
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-[var(--shadow-card)] animate-in fade-in duration-500">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Github className="h-5 w-5 text-primary" />
                  {repoData.owner}/{repoData.repo}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {repoData.files.length} files loaded (showing first 20 of {repoData.totalFiles})
                </p>
              </div>
              <Button 
                onClick={analyzeFiles} 
                disabled={isLoading}
                className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileCode className="mr-2 h-4 w-4" />
                    Analyze All Files
                  </>
                )}
              </Button>
            </div>

            {analyzedFiles.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-success" />
                    Analysis Results
                  </h4>
                  <Button 
                    onClick={pushFixes} 
                    disabled={isPushing}
                    className="bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70"
                  >
                    {isPushing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating PR...
                      </>
                    ) : (
                      <>
                        <GitPullRequest className="mr-2 h-4 w-4" />
                        Create Pull Request
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {analyzedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border/50 transition-all hover:bg-secondary hover:border-primary/20"
                    >
                      <div className="flex-1">
                        <p className="font-mono text-sm text-primary">{file.path}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {file.issues?.length || 0} issues found
                        </p>
                      </div>
                      {file.fixedContent !== file.content && (
                        <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                          Fixed
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
