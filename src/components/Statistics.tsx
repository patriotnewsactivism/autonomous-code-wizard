import { Card } from "@/components/ui/card";
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";

interface StatisticsProps {
  stats: {
    analyzed: number;
    fixed: number;
    failed: number;
    inProgress: number;
  };
}

export const Statistics = ({ stats }: StatisticsProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20">
      <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
        <Activity className="h-5 w-5 text-primary" />
        Statistics
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 transition-all hover:bg-secondary">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">Fixed</span>
          </div>
          <span className="font-bold text-success">{stats.fixed}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 transition-all hover:bg-secondary">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Analyzed</span>
          </div>
          <span className="font-bold text-primary">{stats.analyzed}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 transition-all hover:bg-secondary">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm text-muted-foreground">In Progress</span>
          </div>
          <span className="font-bold text-warning">{stats.inProgress}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 transition-all hover:bg-secondary">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Failed</span>
          </div>
          <span className="font-bold text-destructive">{stats.failed}</span>
        </div>
      </div>
    </Card>
  );
};
