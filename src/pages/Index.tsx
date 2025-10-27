import { CodeEditor } from '@/components/CodeEditor';
import { GitHubSync } from '@/components/GitHubSync';
import { Code2 } from 'lucide-react';
import { TabsContentWrapper, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs-content';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Code2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Auto Code Fixer</h1>
            <p className="text-xl text-muted-foreground">
              AI-powered code analysis and automatic fixing with GitHub sync
            </p>
          </div>
          
          <TabsContentWrapper defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Code</TabsTrigger>
              <TabsTrigger value="github">GitHub Repository</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual">
              <CodeEditor />
            </TabsContent>
            
            <TabsContent value="github">
              <GitHubSync />
            </TabsContent>
          </TabsContentWrapper>
        </div>
      </div>
    </div>
  );
};

export default Index;
