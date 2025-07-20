import { useState, useCallback } from 'react';

export interface EmotionLog {
  id: string;
  emotion: string;
  confidence: number;
  timestamp: Date;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface EmotionStats {
  totalEmotions: number;
  mostCommonEmotion: string;
  averageConfidence: number;
  emotionCounts: Record<string, number>;
  timePatterns: Record<string, number>;
}

const STORAGE_KEY = 'emotion-tracker-logs';

export const useEmotionTracker = () => {
  const [emotionLogs, setEmotionLogs] = useState<EmotionLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      })) : [];
    } catch {
      return [];
    }
  });

  const getTimeOfDay = (date: Date): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const logEmotion = useCallback((emotion: string, confidence: number) => {
    console.log('🎭 Logging emotion:', { emotion, confidence, timestamp: new Date().toISOString() });
    
    const timestamp = new Date();
    const newLog: EmotionLog = {
      id: `${timestamp.getTime()}-${Math.random()}`,
      emotion,
      confidence,
      timestamp,
      timeOfDay: getTimeOfDay(timestamp)
    };

    const updatedLogs = [...emotionLogs, newLog];
    setEmotionLogs(updatedLogs);
    
    console.log('📊 Updated logs count:', updatedLogs.length);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
      console.log('💾 Saved to localStorage successfully');
    } catch (error) {
      console.error('Failed to save emotion log:', error);
    }
  }, [emotionLogs]);

  const getEmotionStats = useCallback((): EmotionStats => {
    if (emotionLogs.length === 0) {
      return {
        totalEmotions: 0,
        mostCommonEmotion: 'neutral',
        averageConfidence: 0,
        emotionCounts: {},
        timePatterns: {}
      };
    }

    const emotionCounts: Record<string, number> = {};
    const timePatterns: Record<string, number> = {};
    let totalConfidence = 0;

    emotionLogs.forEach(log => {
      emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1;
      timePatterns[log.timeOfDay] = (timePatterns[log.timeOfDay] || 0) + 1;
      totalConfidence += log.confidence;
    });

    const mostCommonEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

    return {
      totalEmotions: emotionLogs.length,
      mostCommonEmotion,
      averageConfidence: totalConfidence / emotionLogs.length,
      emotionCounts,
      timePatterns
    };
  }, [emotionLogs]);

  const clearLogs = useCallback(() => {
    setEmotionLogs([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getRecentLogs = useCallback((hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return emotionLogs.filter(log => log.timestamp > cutoff);
  }, [emotionLogs]);

  return {
    emotionLogs,
    logEmotion,
    getEmotionStats,
    clearLogs,
    getRecentLogs
  };
};