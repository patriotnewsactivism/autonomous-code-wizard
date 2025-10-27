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
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Your Code</label>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="font-mono min-h-[300px]"
            />
          </div>
          
          <Button 
            onClick={analyzeCode} 
            disabled={isAnalyzing}
            className="w-full"
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
      </Card>

      {result && (
        <div className="space-y-4">
          {result.summary && (
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-muted-foreground">{result.summary}</p>
            </Card>
          )}

          {result.issues && result.issues.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Issues Found ({result.issues.length})</h3>
              <div className="space-y-3">
                {result.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    {issue.type === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm capitalize">{issue.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {issue.category}
                        </span>
                        {issue.line && (
                          <span className="text-xs text-muted-foreground">
                            Line {issue.line}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground">{issue.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.fixedCode && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Fixed Code</h3>
                <Button onClick={applyFix} variant="outline" size="sm">
                  Apply Fix
                </Button>
              </div>
              <Textarea
                value={result.fixedCode}
                readOnly
                className="font-mono min-h-[300px]"
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
