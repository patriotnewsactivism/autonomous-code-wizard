import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Code2, Save, Play, Terminal, Trash2 } from 'lucide-react';
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
  const { toast } = useToast();

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleSave = () => {
    if (onSave) {
        onSave(code);
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

      {logs.length > 0 && (
        <div className="h-1/3 border-t border-slate-800 flex flex-col bg-slate-900/30">
            <div className="p-2 border-b border-slate-800 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase">Local Output</span>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setLogs([])}>
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
            <ScrollArea className="flex-1 p-2 font-mono text-xs">
                {logs.map((log, i) => (
                    <div key={i} className={log.type === 'error' ? 'text-red-400' : 'text-slate-300'}>
                        {log.message}
                    </div>
                ))}
            </ScrollArea>
        </div>
      )}
    </div>
  );
};
