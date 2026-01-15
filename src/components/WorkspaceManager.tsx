import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, FileCode, ChevronRight, ChevronDown, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  children?: FileNode[];
  isOpen?: boolean;
}

interface WorkspaceManagerProps {
  onFileSelect: (file: FileNode) => void;
  selectedFile: FileNode | null;
}

export const WorkspaceManager = ({ onFileSelect, selectedFile }: WorkspaceManagerProps) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchFiles = async (path: string = '') => {
    try {
      const res = await fetch(`http://localhost:3001/api/files?path=${path}`);
      if (!res.ok) throw new Error('Failed to fetch files');
      return await res.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const loadRoot = async () => {
    setIsLoading(true);
    const rootFiles = await fetchFiles('');
    setFiles(rootFiles);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRoot();
  }, []);

  const toggleFolder = async (node: FileNode, indexPath: number[]) => {
    // Deep clone to avoid mutation issues
    const newFiles = [...files];
    let current = newFiles;
    let target = null;

    // Navigate to the node
    for (let i = 0; i < indexPath.length; i++) {
        target = current[indexPath[i]];
        if (target.children) {
            current = target.children;
        }
    }

    if (!target) return;

    if (target.isOpen) {
        target.isOpen = false;
    } else {
        target.isOpen = true;
        if (!target.children || target.children.length === 0) {
            target.children = await fetchFiles(target.path);
        }
    }
    
    setFiles(newFiles); // Trigger re-render
  };

  // Recursive render
  const renderTree = (nodes: FileNode[], depth = 0, parentPath: number[] = []) => {
    return nodes.map((node, idx) => {
        const currentPath = [...parentPath, idx];
        const isSelected = selectedFile?.path === node.path;
        
        return (
            <div key={node.path}>
                <div 
                    className={cn(
                        "flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-slate-800/50 text-sm select-none transition-colors",
                        isSelected && "bg-primary/20 text-primary border-l-2 border-primary"
                    )}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (node.type === 'dir') {
                            toggleFolder(node, currentPath);
                        } else {
                            onFileSelect(node);
                        }
                    }}
                >
                    {node.type === 'dir' ? (
                        <>
                            {node.isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <Folder className={cn("h-4 w-4", node.isOpen ? "text-blue-400" : "text-blue-500")} />
                        </>
                    ) : (
                        <FileCode className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="truncate">{node.name}</span>
                </div>
                {node.isOpen && node.children && (
                    <div>{renderTree(node.children, depth + 1, currentPath)}</div>
                )}
            </div>
        );
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workspace</span>
            <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={loadRoot}>
                    <RefreshCw className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                </Button>
            </div>
        </div>
        <ScrollArea className="flex-1">
            <div className="py-2">
                {files.length === 0 && !isLoading && (
                    <div className="text-center p-4 text-slate-500 text-xs">
                        Workspace is empty
                    </div>
                )}
                {renderTree(files)}
            </div>
        </ScrollArea>
    </div>
  );
};
