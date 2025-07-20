import { useMemo } from 'react';

export interface Suggestion {
  title: string;
  description: string;
  icon: string;
  action?: string;
}

export const useContextSuggestions = (emotion: string, timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night') => {
  const suggestions = useMemo((): Suggestion[] => {
    const baseTime = timeOfDay;
    
    // Time-based suggestions
    const timeBasedSuggestions: Record<string, Suggestion[]> = {
      morning: [
        { title: "Start with gratitude", description: "List 3 things you're grateful for", icon: "☀️" },
        { title: "Energizing workout", description: "Try a 10-minute morning routine", icon: "💪" },
        { title: "Healthy breakfast", description: "Fuel your day with nutritious food", icon: "🥗" }
      ],
      afternoon: [
        { title: "Take a walk", description: "Fresh air can boost your mood", icon: "🚶" },
        { title: "Mindful break", description: "5-minute breathing exercise", icon: "🧘" },
        { title: "Connect with someone", description: "Call a friend or family member", icon: "📞" }
      ],
      evening: [
        { title: "Reflect on your day", description: "Journal about your experiences", icon: "📝" },
        { title: "Gentle stretching", description: "Relax your body before bed", icon: "🤸" },
        { title: "Read something inspiring", description: "End the day with positivity", icon: "📚" }
      ],
      night: [
        { title: "Meditation practice", description: "Calm your mind for better sleep", icon: "🌙" },
        { title: "Warm herbal tea", description: "Chamomile or lavender for relaxation", icon: "🍵" },
        { title: "Digital detox", description: "Put devices away 1 hour before bed", icon: "📱" }
      ]
    };

    // Emotion-specific suggestions
    const emotionSuggestions: Record<string, Suggestion[]> = {
      happy: [
        { title: "Share your joy", description: "Tell someone about what made you happy", icon: "😊" },
        { title: "Creative expression", description: "Draw, sing, or write about your mood", icon: "🎨" },
        { title: "Help others", description: "Spread positivity to those around you", icon: "🤝" }
      ],
      sad: [
        { title: "Acknowledge your feelings", description: "It's okay to feel sad sometimes", icon: "💙" },
        { title: "Gentle self-care", description: "Take a warm bath or listen to music", icon: "🛁" },
        { title: "Reach out for support", description: "Talk to someone you trust", icon: "🤗" }
      ],
      angry: [
        { title: "Cool down period", description: "Take deep breaths and count to 10", icon: "❄️" },
        { title: "Physical release", description: "Try some vigorous exercise", icon: "🏃" },
        { title: "Express safely", description: "Write in a journal or punch a pillow", icon: "✍️" }
      ],
      fearful: [
        { title: "Ground yourself", description: "Name 5 things you can see, 4 you can touch", icon: "🌱" },
        { title: "Slow breathing", description: "4-7-8 breathing technique", icon: "💨" },
        { title: "Safe space", description: "Go somewhere you feel secure", icon: "🏠" }
      ],
      surprised: [
        { title: "Process the moment", description: "Take time to understand what happened", icon: "💭" },
        { title: "Stay present", description: "Focus on the here and now", icon: "⏰" },
        { title: "Embrace curiosity", description: "Explore what this surprise means", icon: "🔍" }
      ],
      disgusted: [
        { title: "Remove yourself", description: "Step away from the source if possible", icon: "🚫" },
        { title: "Cleanse your senses", description: "Fresh air or pleasant scents", icon: "🌸" },
        { title: "Focus on positives", description: "Think of things you appreciate", icon: "✨" }
      ],
      neutral: [
        { title: "Mindful awareness", description: "Check in with your body and mind", icon: "🧠" },
        { title: "Set an intention", description: "Choose how you want to feel", icon: "🎯" },
        { title: "Gentle movement", description: "Light stretching or walking", icon: "🚶" }
      ]
    };

    // Combine time and emotion suggestions
    const timeSuggestions = timeBasedSuggestions[baseTime] || [];
    const emotionSpecific = emotionSuggestions[emotion] || emotionSuggestions.neutral;
    
    return [...emotionSpecific.slice(0, 2), ...timeSuggestions.slice(0, 2)];
  }, [emotion, timeOfDay]);

  return suggestions;
};