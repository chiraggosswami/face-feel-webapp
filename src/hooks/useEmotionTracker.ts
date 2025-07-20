import { useState, useCallback, useEffect } from 'react';

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

// Helper function to load logs from localStorage
const loadLogsFromStorage = (): EmotionLog[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored).map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp)
    })) : [];
  } catch {
    return [];
  }
};

export const useEmotionTracker = () => {
  const [emotionLogs, setEmotionLogs] = useState<EmotionLog[]>(loadLogsFromStorage);

  // Listen for storage changes from other components/tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        console.log('📡 Storage change detected, reloading logs');
        setEmotionLogs(loadLogsFromStorage());
      }
    };

    // Listen for storage events (cross-tab changes)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (same-tab changes)
    const handleCustomStorageChange = () => {
      console.log('🔄 Custom storage event detected, reloading logs');
      setEmotionLogs(loadLogsFromStorage());
    };

    window.addEventListener('emotionLogsUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('emotionLogsUpdated', handleCustomStorageChange);
    };
  }, []);

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
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('emotionLogsUpdated'));
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
    // Notify other components
    window.dispatchEvent(new CustomEvent('emotionLogsUpdated'));
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