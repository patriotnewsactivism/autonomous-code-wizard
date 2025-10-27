import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Code2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Issue {
  type: 'error' | 'warning' | 'suggestion';
  category: string;
  line?: number;
  description: string;
  severity: string;
}

interface AnalysisResult {
  issues: Issue[];
  fixedCode: string;
  summary: string;
}

export const CodeEditor = () => {
  const [code, setCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const analyzeCode = async () => {
    if (!code.trim()) {
      toast({
        title: 'No code provided',
        description: 'Please paste some code to analyze',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch(
        'https://uxgmziujgesdswtjdasu.supabase.co/functions/v1/analyze-code',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze code');
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: 'Analysis complete',
        description: `Found ${data.issues?.length || 0} issues`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyFix = () => {
    if (result?.fixedCode) {
      setCode(result.fixedCode);
      toast({
        title: 'Code updated',
        description: 'Fixed code has been applied',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            Your Code
          </label>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here..."
            className="font-mono min-h-[300px] bg-secondary/50 border-border transition-all focus:border-primary"
          />
        </div>
        
        <Button 
          onClick={analyzeCode} 
          disabled={isAnalyzing}
          className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 shadow-[var(--shadow-glow)]"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Code2 className="mr-2 h-4 w-4" />
              Analyze & Fix Code
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-4 animate-in fade-in duration-500">
          {result.summary && (
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-[var(--shadow-card)]">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Summary
              </h3>
              <p className="text-muted-foreground">{result.summary}</p>
            </Card>
          )}

          {result.issues && result.issues.length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border shadow-[var(--shadow-card)]">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Issues Found ({result.issues.length})
              </h3>
              <div className="space-y-3">
                {result.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 p-4 rounded-lg bg-secondary/50 border border-border/50 transition-all hover:bg-secondary hover:border-primary/20"
                  >
                    {issue.type === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm capitalize px-2 py-0.5 rounded bg-primary/20 text-primary">
                          {issue.type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {issue.category}
                        </span>
                        {issue.line && (
                          <span className="text-xs text-muted-foreground font-mono">
                            Line {issue.line}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{issue.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.fixedCode && (
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-success/20 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Fixed Code
                </h3>
                <Button 
                  onClick={applyFix} 
                  variant="outline" 
                  size="sm"
                  className="border-success/30 text-success hover:bg-success/10"
                >
                  Apply Fix
                </Button>
              </div>
              <Textarea
                value={result.fixedCode}
                readOnly
                className="font-mono min-h-[300px] bg-secondary/50 border-border"
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
