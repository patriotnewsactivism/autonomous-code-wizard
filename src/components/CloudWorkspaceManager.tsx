import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, FileCode, ChevronRight, ChevronDown, Plus, RefreshCw, Box, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CloudFile {
  id: string;
  path: string;
  language: string;
}

interface CloudProject {
  id: string;
  name: string;
  description: string;
}

interface CloudWorkspaceManagerProps {
  onFileSelect: (file: CloudFile) => void;
  selectedFile: CloudFile | null;
}

export const CloudWorkspaceManager = ({ onFileSelect, selectedFile }: CloudWorkspaceManagerProps) => {
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [currentProject, setCurrentProject] = useState<CloudProject | null>(null);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: 'Failed to load projects', variant: 'destructive' });
    } else {
      setProjects(data || []);
    }
    setIsLoading(false);
  };

  const fetchFiles = async (projectId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('files').select('*').eq('project_id', projectId).order('path');
    if (error) {
      toast({ title: 'Error', description: 'Failed to load files', variant: 'destructive' });
    } else {
      setFiles(data || []);
    }
    setIsLoading(false);
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from('projects').insert({
      name: newProjectName,
      user_id: user.id
    }).select().single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setProjects([data, ...projects]);
      setCurrentProject(data);
      setFiles([]);
      setNewProjectName('');
      toast({ title: 'Project created', description: 'Ready to code!' });
      
      // Create default file
      await createFile(data.id, 'README.md', '# ' + data.name);
    }
    setIsCreating(false);
  };

  const createFile = async (projectId: string, path: string, content: string = '') => {
    const { data, error } = await supabase.from('files').insert({
        project_id: projectId,
        path,
        content,
        language: 'markdown'
    }).select().single();
    
    if (!error && data) {
        setFiles(prev => [...prev, data]);
        onFileSelect(data);
    }
  };

  const handleProjectSelect = (project: CloudProject) => {
    setCurrentProject(project);
    fetchFiles(project.id);
  };

  const renderFileTree = () => {
    // Simple flat list for now, can be improved to tree later
    return files.map((file) => (
      <div 
        key={file.id}
        className={cn(
            "flex items-center gap-2 py-1.5 px-2 cursor-pointer hover:bg-slate-800/50 text-sm select-none transition-colors rounded",
            selectedFile?.id === file.id && "bg-primary/20 text-primary"
        )}
        onClick={() => onFileSelect(file)}
      >
        <FileCode className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate">{file.path}</span>
      </div>
    ));
  };

  if (!currentProject) {
    return (
        <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
             <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cloud Projects</span>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6"><Plus className="h-3 w-3" /></Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-950 border-slate-800 text-slate-200">
                        <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-4">
                            <Input 
                                placeholder="Project Name" 
                                value={newProjectName}
                                onChange={e => setNewProjectName(e.target.value)}
                                className="bg-slate-900 border-slate-700"
                            />
                            <Button onClick={createProject} disabled={isCreating} className="w-full">
                                {isCreating ? <Loader2 className="animate-spin mr-2" /> : 'Create'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <ScrollArea className="flex-1 p-2">
                <div className="space-y-1">
                    {isLoading ? <Loader2 className="animate-spin h-6 w-6 mx-auto mt-4 text-slate-500" /> : 
                     projects.map(p => (
                        <div 
                            key={p.id}
                            onClick={() => handleProjectSelect(p)}
                            className="flex items-center gap-2 p-2 rounded hover:bg-slate-900 cursor-pointer text-slate-300 hover:text-white group"
                        >
                            <Box className="h-4 w-4 text-blue-500" />
                            <div className="flex-1 truncate">
                                <div className="font-medium text-sm">{p.name}</div>
                                <div className="text-[10px] text-slate-500 truncate">{p.id}</div>
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
        <div className="p-3 border-b border-slate-800 flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6 -ml-2" onClick={() => setCurrentProject(null)}>
                <ArrowLeft className="h-3 w-3" />
            </Button>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate flex-1">
                {currentProject.name}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => createFile(currentProject.id, `new-file-${Date.now()}.js`)}>
                <Plus className="h-3 w-3" />
            </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
            {isLoading ? <Loader2 className="animate-spin h-6 w-6 mx-auto mt-4" /> : renderFileTree()}
        </ScrollArea>
    </div>
  );
};
