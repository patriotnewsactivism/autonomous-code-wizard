import { useState, useEffect } from 'react';
import { WorkspaceManager } from '@/components/WorkspaceManager';
import { CloudWorkspaceManager } from '@/components/CloudWorkspaceManager';
import { BuilderConsole } from '@/components/BuilderConsole';
import { CodeEditor } from '@/components/CodeEditor';
import { AIAssistant } from '@/components/AIAssistant';
import { AuthDialog } from '@/components/AuthDialog';
import { Sparkles, LayoutDashboard, Settings, User, Cloud, HardDrive, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Mode = 'local' | 'cloud';

const Index = () => {
  const [mode, setMode] = useState<Mode>('local');
  const [session, setSession] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileContent, setFileContent] = useState('// Select a file to view content');
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleModeChange = (newMode: string) => {
    if (newMode === 'cloud' && !session) {
      setShowAuth(true);
    }
    setMode(newMode as Mode);
    setSelectedFile(null);
    setFileContent('// Select a file to view content');
  };

  const handleFileSelect = async (file: any) => {
    setSelectedFile(file);
    try {
        if (mode === 'local') {
            const res = await fetch(`http://localhost:3001/api/files/content?path=${encodeURIComponent(file.path)}`);
            if (res.ok) {
                const data = await res.json();
                setFileContent(data.content);
            }
        } else {
            // Cloud fetch
            const { data, error } = await supabase.from('files').select('content').eq('id', file.id).single();
            if (error) throw error;
            setFileContent(data.content || '');
        }
    } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to load file', variant: 'destructive' });
    }
  };

  const handleSave = async (content: string) => {
    if (!selectedFile) return;
    try {
        if (mode === 'local') {
            const res = await fetch('http://localhost:3001/api/files/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: selectedFile.path, content })
            });
            if (res.ok) toast({ title: 'Saved', description: `Saved to disk` });
        } else {
            // Cloud save
            const { error } = await supabase.from('files').update({ content }).eq('id', selectedFile.id);
            if (error) throw error;
            toast({ title: 'Saved', description: `Saved to cloud` });
        }
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to save file', variant: 'destructive' });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <div className="relative flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-indigo-500 to-purple-600">
                <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                    <div className="text-sm font-bold text-slate-100 leading-none">CodeWizard</div>
                    <div className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">Autonomous IDE</div>
                </div>
            </div>

            <div className="h-6 w-px bg-slate-800 mx-2" />

            <Tabs value={mode} onValueChange={handleModeChange} className="w-[200px]">
                <TabsList className="grid w-full grid-cols-2 bg-slate-900 border border-slate-800 h-9">
                    <TabsTrigger value="local" className="text-xs data-[state=active]:bg-slate-800">
                        <HardDrive className="w-3 h-3 mr-2" /> Local
                    </TabsTrigger>
                    <TabsTrigger value="cloud" className="text-xs data-[state=active]:bg-slate-800">
                        <Cloud className="w-3 h-3 mr-2" /> Cloud
                    </TabsTrigger>
                </TabsList>
            </Tabs>
          </div>
          
          <div className="flex items-center gap-2">
             {session && (
                 <Badge variant="outline" className="border-green-900 bg-green-900/20 text-green-400">
                     {session.user.email}
                 </Badge>
             )}
             {mode === 'cloud' && session && (
                <Button variant="ghost" size="icon" onClick={() => supabase.auth.signOut()}>
                    <LogOut className="h-4 w-4 text-slate-400" />
                </Button>
             )}
             {!session && mode === 'cloud' && (
                <Button size="sm" onClick={() => setShowAuth(true)}>Sign In</Button>
             )}
          </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 shrink-0 flex flex-col bg-slate-950 border-r border-slate-800">
            {mode === 'local' ? (
                <WorkspaceManager onFileSelect={handleFileSelect} selectedFile={selectedFile} />
            ) : (
                session ? (
                    <CloudWorkspaceManager onFileSelect={handleFileSelect} selectedFile={selectedFile} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-4">
                        <Cloud className="h-12 w-12 opacity-20" />
                        <p className="text-sm">Sign in to access your cloud projects.</p>
                        <Button onClick={() => setShowAuth(true)}>Sign In</Button>
                    </div>
                )
            )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
            {/* Editor Area */}
            <div className="flex-1 overflow-hidden relative">
                 <CodeEditor 
                    key={selectedFile?.id || selectedFile?.path || 'empty'}
                    initialCode={fileContent} 
                    fileName={selectedFile?.path || (mode === 'cloud' ? 'Cloud File' : 'Local File')}
                    onSave={handleSave}
                 />
            </div>

            {/* Bottom Console */}
            <div className="h-48 shrink-0">
                <BuilderConsole />
            </div>
        </div>

        {/* Right Sidebar: AI Assistant */}
        <div className="w-[300px] shrink-0 border-l border-slate-800 hidden lg:block">
            <AIAssistant />
        </div>
      </div>

      {showAuth && <AuthDialog onSuccess={() => setShowAuth(false)} />}
    </div>
  );
};

export default Index;
