import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Trash2, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { useEmotionTracker, EmotionLog, EmotionStats } from '@/hooks/useEmotionTracker';

interface EmotionTrendsProps {
  className?: string;
}

const EmotionTrends: React.FC<EmotionTrendsProps> = ({ className }) => {
  const { emotionLogs, getEmotionStats, clearLogs, getRecentLogs } = useEmotionTracker();
  const stats = getEmotionStats();
  const recentLogs = getRecentLogs(24);

  const getEmotionColor = (emotion: string): string => {
    const colors: Record<string, string> = {
      happy: 'hsl(var(--emotion-happy))',
      sad: 'hsl(var(--emotion-sad))',
      angry: 'hsl(var(--emotion-angry))',
      fearful: 'hsl(var(--emotion-fear))',
      surprised: 'hsl(var(--emotion-surprise))',
      disgusted: 'hsl(var(--emotion-disgust))',
      neutral: 'hsl(var(--emotion-neutral))',
    };
    return colors[emotion] || colors.neutral;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (emotionLogs.length === 0) {
    return (
      <Card className={`p-6 bg-card/50 border-muted ${className}`}>
        <div className="text-center space-y-2">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-muted-foreground">No Data Yet</h3>
          <p className="text-sm text-muted-foreground">
            Start using the emotion detector to see your mood patterns
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Stats Overview */}
      <Card className="p-4 bg-gradient-stats border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Emotion Trends
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={clearLogs}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalEmotions}</div>
            <div className="text-sm text-muted-foreground">Total Logs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: getEmotionColor(stats.mostCommonEmotion) }}>
              {stats.mostCommonEmotion}
            </div>
            <div className="text-sm text-muted-foreground">Most Common</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{(stats.averageConfidence * 100).toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground">Avg Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{recentLogs.length}</div>
            <div className="text-sm text-muted-foreground">Last 24h</div>
          </div>
        </div>

        {/* Emotion Distribution */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Emotion Distribution
          </h4>
          {Object.entries(stats.emotionCounts)
            .sort(([,a], [,b]) => b - a)
            .map(([emotion, count]) => {
              const percentage = (count / stats.totalEmotions) * 100;
              return (
                <div key={emotion} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{emotion}</span>
                    <span>{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    style={{ 
                      background: 'hsl(var(--muted))',
                    }}
                  />
                </div>
              );
            })}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-4 bg-card/50 border-muted">
        <h4 className="font-medium flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4" />
          Recent Activity
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentLogs.slice(-10).reverse().map((log) => (
            <div key={log.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className="capitalize"
                  style={{ 
                    backgroundColor: getEmotionColor(log.emotion) + '20',
                    color: getEmotionColor(log.emotion),
                    borderColor: getEmotionColor(log.emotion) + '40'
                  }}
                >
                  {log.emotion}
                </Badge>
                <span className="text-sm">{(log.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(log.timestamp)} {formatTime(log.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default EmotionTrends;