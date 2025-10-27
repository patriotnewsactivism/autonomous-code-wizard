import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Github, GitPullRequest, FileCode } from 'lucide-react';
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
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [analyzedFiles, setAnalyzedFiles] = useState<RepoFile[]>([]);
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
    setAnalyzedFiles([]);

    try {
      const response = await fetch(
        'https://uxgmziujgesdswtjdasu.supabase.co/functions/v1/fetch-repo',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ repoUrl }),
        }
      );

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
    const analyzed: RepoFile[] = [];

    for (const file of repoData.files) {
      try {
        const response = await fetch(
          'https://uxgmziujgesdswtjdasu.supabase.co/functions/v1/analyze-code',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: file.content }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          analyzed.push({
            ...file,
            fixedContent: result.fixedCode,
            issues: result.issues,
          });
        }
      } catch (error) {
        console.error(`Failed to analyze ${file.path}:`, error);
      }
    }

    setAnalyzedFiles(analyzed);
    setIsLoading(false);
    
    toast({
      title: 'Analysis complete',
      description: `Analyzed ${analyzed.length} files`,
    });
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

      const response = await fetch(
        'https://uxgmziujgesdswtjdasu.supabase.co/functions/v1/push-fixes',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner: repoData.owner,
            repo: repoData.repo,
            files: filesToUpdate,
          }),
        }
      );

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
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">GitHub Repository URL</label>
            <div className="flex gap-2">
              <Input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="flex-1"
              />
              <Button 
                onClick={fetchRepo} 
                disabled={isLoading}
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
      </Card>

      {repoData && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{repoData.owner}/{repoData.repo}</h3>
                <p className="text-sm text-muted-foreground">
                  {repoData.files.length} files loaded (showing first 20 of {repoData.totalFiles})
                </p>
              </div>
              <Button 
                onClick={analyzeFiles} 
                disabled={isLoading}
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Analysis Results</h4>
                  <Button 
                    onClick={pushFixes} 
                    disabled={isPushing}
                    variant="default"
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

                <div className="space-y-2">
                  {analyzedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="font-mono text-sm">{file.path}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {file.issues?.length || 0} issues found
                        </p>
                      </div>
                      {file.fixedContent !== file.content && (
                        <Badge variant="outline">Fixed</Badge>
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
