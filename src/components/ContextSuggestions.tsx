import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Lightbulb, Clock } from 'lucide-react';
import { useContextSuggestions, Suggestion } from '@/hooks/useContextSuggestions';

interface ContextSuggestionsProps {
  currentEmotion: string | null;
  className?: string;
}

const ContextSuggestions: React.FC<ContextSuggestionsProps> = ({ currentEmotion, className }) => {
  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const timeOfDay = getTimeOfDay();
  const emotion = currentEmotion || 'neutral';
  const suggestions = useContextSuggestions(emotion, timeOfDay);

  const getTimeDisplay = (time: string) => {
    const displays = {
      morning: '🌅 Morning',
      afternoon: '☀️ Afternoon', 
      evening: '🌅 Evening',
      night: '🌙 Night'
    };
    return displays[time as keyof typeof displays] || time;
  };

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

  return (
    <Card className={`p-4 bg-gradient-suggestions border-primary/20 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Suggestions
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {getTimeDisplay(timeOfDay)}
            </Badge>
            {currentEmotion && (
              <Badge 
                variant="secondary"
                className="text-xs capitalize"
                style={{ 
                  backgroundColor: getEmotionColor(emotion) + '20',
                  color: getEmotionColor(emotion),
                  borderColor: getEmotionColor(emotion) + '40'
                }}
              >
                {emotion}
              </Badge>
            )}
          </div>
        </div>

        {/* Suggestions Grid */}
        <div className="grid gap-3">
          {suggestions.map((suggestion, index) => (
            <Card 
              key={index} 
              className="p-3 bg-card/50 border-muted hover:border-primary/30 transition-all duration-200 cursor-pointer hover:shadow-elegant"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-1">{suggestion.icon}</div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-sm">{suggestion.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Context Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-muted">
          Suggestions are personalized based on your current emotion and time of day
        </div>
      </div>
    </Card>
  );
};

export default ContextSuggestions;