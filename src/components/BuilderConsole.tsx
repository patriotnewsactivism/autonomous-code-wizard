import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Send, Loader2, Play, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LogEntry {
  type: 'cmd' | 'stdout' | 'stderr' | 'info';
  content: string;
  timestamp: Date;
}

export const BuilderConsole = () => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: 'info', content: 'Builder Console ready. Type a command (e.g., "npm install")', timestamp: new Date() }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    
    setLogs(prev => [...prev, { type: 'cmd', content: `> ${cmd}`, timestamp: new Date() }]);
    setInput('');
    setIsExecuting(true);

    try {
      const res = await fetch('http://localhost:3001/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });

      const data = await res.json();
      
      if (data.stdout) {
        setLogs(prev => [...prev, { type: 'stdout', content: data.stdout, timestamp: new Date() }]);
      }
      if (data.stderr) {
        setLogs(prev => [...prev, { type: 'stderr', content: data.stderr, timestamp: new Date() }]);
      }
      if (data.error) {
         setLogs(prev => [...prev, { type: 'stderr', content: `Error: ${data.error}`, timestamp: new Date() }]);
      }
    } catch (error) {
      setLogs(prev => [...prev, { type: 'stderr', content: 'Failed to connect to backend', timestamp: new Date() }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand(input);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-t border-slate-800">
      <div className="p-2 border-b border-slate-800 flex items-center gap-2 bg-slate-900/50">
        <Terminal className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Builder Terminal</span>
      </div>
      
      <ScrollArea className="flex-1 p-4 font-mono text-sm">
        <div className="space-y-1">
          {logs.map((log, i) => (
            <div key={i} className={`whitespace-pre-wrap break-all ${
              log.type === 'cmd' ? 'text-blue-400 font-bold mt-4' :
              log.type === 'stderr' ? 'text-red-400' :
              log.type === 'info' ? 'text-slate-500 italic' :
              'text-slate-300'
            }`}>
              {log.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="p-2 bg-slate-900/30 border-t border-slate-800 flex gap-2">
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter shell command..."
          className="flex-1 bg-slate-950 border-slate-800 font-mono text-sm h-9"
          disabled={isExecuting}
        />
        <Button 
            size="sm" 
            onClick={() => executeCommand(input)} 
            disabled={isExecuting || !input.trim()}
            className="h-9 px-3"
        >
            {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
