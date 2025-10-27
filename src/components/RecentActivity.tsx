import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface Activity {
  id: string;
  type: 'analysis' | 'fix' | 'sync';
  description: string;
  status: 'success' | 'error' | 'pending';
  timestamp: Date;
}

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity = ({ activities }: RecentActivityProps) => {
  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'success': return 'bg-success/20 text-success border-success/30';
      case 'error': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'pending': return 'bg-warning/20 text-warning border-warning/30';
    }
  };

  const getTypeEmoji = (type: Activity['type']) => {
    switch (type) {
      case 'analysis': return '🔍';
      case 'fix': return '🔧';
      case 'sync': return '🔄';
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20">
      <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
        <Clock className="h-5 w-5 text-primary" />
        Recent Activity
      </h3>
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="p-3 rounded-lg bg-secondary/50 transition-all hover:bg-secondary"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeEmoji(activity.type)}</span>
                  <p className="text-sm flex-1">{activity.description}</p>
                </div>
                <Badge variant="outline" className={getStatusColor(activity.status)}>
                  {activity.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-7">
                {activity.timestamp.toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
