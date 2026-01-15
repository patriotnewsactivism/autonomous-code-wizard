import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Code2, Save, Play, Terminal, Trash2, Sparkles, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CodeEditorProps {
  initialCode?: string;
  fileName?: string;
  onSave?: (content: string) => void;
}

export const CodeEditor = ({ initialCode = '', fileName = 'Untitled', onSave }: CodeEditorProps) => {
  const [code, setCode] = useState(initialCode);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleSave = () => {
    if (onSave) {
        onSave(code);
    }
  };

  const analyzeCode = async () => {
    setIsAnalyzing(true);
    setIssues([]);
    try {
        const res = await fetch('http://localhost:3001/functions/v1/analyze-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        if (!res.ok) throw new Error('Analysis failed');

        const data = await res.json();
        if (data.issues) setIssues(data.issues);
        
        if (data.fixedCode && data.fixedCode !== code) {
            toast({ 
                title: "Fixes Available", 
                description: "Auto-fixes can be applied.",
                action: (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-green-600 text-white border-none hover:bg-green-700"
                        onClick={() => {
                            setCode(data.fixedCode);
                            toast({ title: "Applied", description: "Code updated." });
                        }}
                    >
                        Apply Fixes
                    </Button>
                ),
            });
        }
        
        toast({ title: "Analysis Complete", description: `Found ${data.issues?.length || 0} issues.` });

    } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Failed to connect to analysis engine. Is the server running?", variant: "destructive"});
    } finally {
        setIsAnalyzing(false);
    }
  };

  const runCode = () => {
    setLogs([]); 
    const capturedLogs: any[] = [];
    const originalLog = console.log;
    const originalError = console.error;

    const addLog = (type: string, ...args: any[]) => {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      capturedLogs.push({ type, message, timestamp: Date.now() });
      setLogs(prev => [...prev, { type, message, timestamp: Date.now() }]);
    };

    console.log = (...args) => addLog('log', ...args);
    console.error = (...args) => addLog('error', ...args);

    try {
      // eslint-disable-next-line no-new-func
      new Function(code)();
    } catch (error) {
      console.error(error);
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="flex items-center justify-between p-2 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-slate-200">{fileName}</span>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={analyzeCode}
              disabled={isAnalyzing}
              size="sm"
              className="h-7 text-xs bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-600/30"
            >
              {isAnalyzing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
              Analyze
            </Button>
            <Button 
              onClick={runCode}
              variant="secondary"
              size="sm"
              className="h-7 text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30"
            >
              <Play className="mr-2 h-3 w-3" />
              Run
            </Button>
            <Button 
              onClick={handleSave} 
              size="sm"
              className="h-7 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
            >
              <Save className="mr-2 h-3 w-3" />
              Save
            </Button>
          </div>
      </div>
      
      <div className="flex-1 relative">
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="// Start typing..."
          className="absolute inset-0 w-full h-full font-mono text-sm bg-slate-950 text-slate-100 border-none focus-visible:ring-0 resize-none p-4 leading-relaxed"
          spellCheck={false}
        />
      </div>

      {(logs.length > 0 || issues.length > 0) && (
        <div className="h-1/3 border-t border-slate-800 flex flex-col bg-slate-900/30">
            <div className="p-2 border-b border-slate-800 flex justify-between items-center">
                <div className="flex gap-4">
                    <span className={`text-xs font-semibold uppercase cursor-pointer ${logs.length > 0 ? 'text-slate-300' : 'text-slate-600'}`}>Output ({logs.length})</span>
                    <span className={`text-xs font-semibold uppercase cursor-pointer ${issues.length > 0 ? 'text-yellow-500' : 'text-slate-600'}`}>Issues ({issues.length})</span>
                </div>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => { setLogs([]); setIssues([]); }}>
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
            <ScrollArea className="flex-1 p-2 font-mono text-xs">
                {issues.length > 0 && (
                    <div className="mb-4 space-y-2">
                        {issues.map((issue, i) => (
                             <div key={i} className="flex gap-2 text-xs p-2 rounded bg-slate-900 border border-yellow-900/50 text-slate-300">
                                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                                <div>
                                    <span className="text-yellow-500 font-bold">Line {issue.line}:</span> {issue.message}
                                </div>
                             </div>
                        ))}
                    </div>
                )}
                {logs.map((log, i) => (
                    <div key={i} className={log.type === 'error' ? 'text-red-400' : 'text-slate-300'}>
                        <span className="opacity-50 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        {log.message}
                    </div>
                ))}
            </ScrollArea>
        </div>
      )}
    </div>
  );
};
