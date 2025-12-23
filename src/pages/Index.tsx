import { useState } from 'react';
import { CodeEditor } from '@/components/CodeEditor';
import { GitHubSync } from '@/components/GitHubSync';
import { Statistics } from '@/components/Statistics';
import { RecentActivity } from '@/components/RecentActivity';
import { BadgeCheck, Code2, Sparkles, Wand2 } from 'lucide-react';
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-gradient-to-br from-primary/30 via-cyan-400/20 to-purple-500/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-gradient-to-tr from-primary/20 via-purple-500/25 to-amber-400/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-primary via-cyan-400 to-purple-500 shadow-[var(--shadow-glow)]">
              <img src="/logo.svg" alt="Autonomous Code Wizard" className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Autonomous</p>
              <h1 className="text-xl font-bold leading-tight text-foreground">Code Wizard</h1>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Orchestrated Quality
            </div>
          </div>
        </div>
      </header>

      <main className="container relative z-10 px-4 pb-12 pt-10">
        <section className="mx-auto max-w-5xl space-y-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <BadgeCheck className="h-3.5 w-3.5" />
            Enterprise Ready
          </div>
          <h2 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
            Elevate code quality with an AI partner that reads, reasons, and repairs.
          </h2>
          <p className="mx-auto max-w-3xl text-base text-muted-foreground sm:text-lg">
            Auto Code Fixer orchestrates thoughtful analysis, concise recommendations, and trustworthy fixes. Bring clarity to your delivery pipeline with a professional review experience that stays centered on your standards.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/60 bg-card/80 p-4 shadow-[var(--shadow-card)]">
              <div className="flex flex-col items-center gap-3 text-center">
                <Wand2 className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-base font-semibold">Precise Guidance</h3>
                  <p className="text-sm text-muted-foreground">Structured recommendations that respect your coding conventions.</p>
                </div>
              </div>
            </Card>
            <Card className="border-border/60 bg-card/80 p-4 shadow-[var(--shadow-card)]">
              <div className="flex flex-col items-center gap-3 text-center">
                <Code2 className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-base font-semibold">Seamless Analysis</h3>
                  <p className="text-sm text-muted-foreground">Inline diagnostics that surface risks before they reach production.</p>
                </div>
              </div>
            </Card>
            <Card className="border-border/60 bg-card/80 p-4 shadow-[var(--shadow-card)]">
              <div className="flex flex-col items-center gap-3 text-center">
                <Sparkles className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-base font-semibold">Confident Delivery</h3>
                  <p className="text-sm text-muted-foreground">Automated fixes paired with transparent reasoning for every change.</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-6">
            <Card className="border-border/70 bg-card/80 p-6 shadow-[var(--shadow-card)]">
              <div className="space-y-3 text-center">
                <h3 className="text-xl font-semibold">Start with your preferred workflow</h3>
                <p className="text-sm text-muted-foreground">
                  Paste a code sample for rapid feedback or connect a repository to synchronize automated reviews with your team.
                </p>
              </div>

              <TabsContentWrapper defaultValue="manual" className="w-full">
                <TabsList className="mx-auto mt-6 grid w-full max-w-md grid-cols-2 rounded-full bg-muted/30 p-1">
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

          {/* Sidebar */}
          <aside className="space-y-6">
            <Statistics stats={stats} />
            <RecentActivity activities={activities} />
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Index;
