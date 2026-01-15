import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your Code Pilot. Ask me to create components, install packages, or explain your code.", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/agent/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg.content })
      });

      if (!res.ok) throw new Error('Failed to reach agent');

      const data = await res.json();
      const botMsg: Message = { role: 'assistant', content: data.message, timestamp: new Date() };
      
      setMessages(prev => [...prev, botMsg]);
      
      if (data.actions && data.actions.length > 0) {
        toast({ title: 'Action Performed', description: `Agent executed ${data.actions.length} actions.` });
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to the pilot engine.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800">
      <div className="p-3 border-b border-slate-800 flex items-center gap-2 bg-slate-900/50">
        <Sparkles className="h-4 w-4 text-purple-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Code Pilot</span>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-slate-700' : 'bg-purple-900/50 text-purple-400'
              }`}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`rounded-lg p-3 text-sm max-w-[85%] ${
                msg.role === 'user' ? 'bg-slate-800 text-slate-100' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
               <div className="h-8 w-8 rounded-full bg-purple-900/50 text-purple-400 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
               </div>
               <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
               </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-slate-800 bg-slate-900/30">
        <div className="flex gap-2">
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask to create components..." 
            className="bg-slate-950 border-slate-800 focus-visible:ring-purple-500/50"
          />
          <Button size="icon" onClick={sendMessage} disabled={isLoading || !input.trim()} className="shrink-0 bg-purple-600 hover:bg-purple-700">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
