import { useState } from 'react';
import { CodeEditor } from '@/components/CodeEditor';
import { GitHubSync } from '@/components/GitHubSync';
import { Statistics } from '@/components/Statistics';
import { RecentActivity } from '@/components/RecentActivity';
import { Code2, Sparkles } from 'lucide-react';
import { TabsContentWrapper, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs-content';
import { Card } from '@/components/ui/card';

const Index = () => {
  const [stats] = useState({
    analyzed: 0,
    fixed: 0,
    failed: 0,
    inProgress: 0,
  });

  const [activities] = useState<Array<{
    id: string;
    type: 'analysis' | 'fix' | 'sync';
    description: string;
    status: 'success' | 'error' | 'pending';
    timestamp: Date;
  }>>([]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-cyan-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            Auto Code Fixer
          </h1>
        </div>
      </header>

      <main className="container py-6 px-4">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
            <Statistics stats={stats} />
            <RecentActivity activities={activities} />
          </aside>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Welcome Card */}
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-[var(--shadow-card)]">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-4xl">🚀</span>
                  <div>
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      AI-Powered Code Fixer
                      <Sparkles className="h-5 w-5 text-primary" />
                    </h2>
                    <p className="text-muted-foreground">
                      Automatically analyze and fix code issues with AI
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">✨ Features:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>🔍 AI-powered code analysis and issue detection</li>
                    <li>🔧 Automatic code fixing with detailed explanations</li>
                    <li>🔄 GitHub integration for repository sync</li>
                    <li>📊 Real-time statistics and activity monitoring</li>
                    <li>⚡ Fast and efficient processing</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">🎯 Quick Start:</h3>
                  <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Paste your code or connect a GitHub repository</li>
                    <li>Click "Analyze & Fix Code" to detect issues</li>
                    <li>Review the AI-generated fixes and suggestions</li>
                    <li>Apply fixes or sync back to GitHub</li>
                  </ol>
                </div>
              </div>
            </Card>

            {/* Tabs for Code Input */}
            <Card className="bg-card border-border">
              <TabsContentWrapper defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1">
                  <TabsTrigger value="manual">Manual Code</TabsTrigger>
                  <TabsTrigger value="github">GitHub Repository</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="p-6">
                  <CodeEditor />
                </TabsContent>
                
                <TabsContent value="github" className="p-6">
                  <GitHubSync />
                </TabsContent>
              </TabsContentWrapper>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
