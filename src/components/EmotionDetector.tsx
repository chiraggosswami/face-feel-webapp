import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEmotionTracker } from '@/hooks/useEmotionTracker';
import EmotionTrends from './EmotionTrends';
import ContextSuggestions from './ContextSuggestions';

interface EmotionResult {
  emotion: string;
  confidence: number;
  position: { x: number; y: number; width: number; height: number };
}

const EmotionDetector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionResult | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [lastLoggedEmotion, setLastLoggedEmotion] = useState<string | null>(null);
  const [lastLogTime, setLastLogTime] = useState<number>(0);
  const { toast } = useToast();
  const { logEmotion } = useEmotionTracker();

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        
        // Load the models - we'll try from CDN if local fails
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          faceapi.nets.faceExpressionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights')
        ]);
        
        setIsModelLoaded(true);
        toast({
          title: "Models loaded",
          description: "Ready to detect emotions!",
        });
      } catch (error) {
        console.error('Error loading models:', error);
        toast({
          title: "Error loading models",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
      }
    };

    loadModels();
  }, [toast]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setIsCameraActive(true);
      toast({
        title: "Camera started",
        description: "Now detecting emotions in real-time!",
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to use emotion detection.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
    setIsDetecting(false);
    setCurrentEmotion(null);
    
    // Clear canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [stream]);

  // Get emotion color
  const getEmotionColor = (emotion: string): string => {
    const colors: Record<string, string> = {
      happy: '#facc15', // emotion-happy
      sad: '#60a5fa', // emotion-sad  
      angry: '#f87171', // emotion-angry
      fearful: '#c084fc', // emotion-fear
      surprised: '#fb923c', // emotion-surprise
      disgusted: '#4ade80', // emotion-disgust
      neutral: '#9ca3af', // emotion-neutral
    };
    return colors[emotion] || colors.neutral;
  };

  // Detect emotions
  const detectEmotions = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isModelLoaded || !isCameraActive) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    try {
      setIsDetecting(true);

      // Detect faces with expressions
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detections.length > 0) {
        const detection = detections[0]; // Use first face
        const { box } = detection.detection;
        const expressions = detection.expressions;

        // Find dominant emotion
        const dominantEmotion = Object.keys(expressions).reduce((a, b) =>
          (expressions as any)[a] > (expressions as any)[b] ? a : b
        );

        const confidence = (expressions as any)[dominantEmotion] as number;

        // Update current emotion
        setCurrentEmotion({
          emotion: dominantEmotion,
          confidence: confidence,
          position: { x: box.x, y: box.y, width: box.width, height: box.height }
        });

        // Log emotion (throttled to prevent spam)
        const now = Date.now();
        const shouldLog = (
          dominantEmotion !== lastLoggedEmotion || 
          now - lastLogTime > 5000 // 5 seconds
        ) && confidence > 0.6; // Only log if confidence is high enough

        if (shouldLog) {
          logEmotion(dominantEmotion, confidence);
          setLastLoggedEmotion(dominantEmotion);
          setLastLogTime(now);
        }

        // Draw face rectangle
        const color = getEmotionColor(dominantEmotion);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw emotion label
        ctx.fillStyle = color;
        ctx.font = '20px Arial';
        ctx.fillText(
          `${dominantEmotion}: ${(confidence * 100).toFixed(1)}%`,
          box.x,
          box.y - 10
        );
      } else {
        setCurrentEmotion(null);
      }
    } catch (error) {
      console.error('Error detecting emotions:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [isModelLoaded, isCameraActive]);

  // Run emotion detection loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isCameraActive && isModelLoaded) {
      intervalId = setInterval(detectEmotions, 100); // 10 FPS
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isCameraActive, isModelLoaded, detectEmotions]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Camera Section */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-gradient-camera border-primary/20">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Emotion Detector
            </h1>
            <p className="text-muted-foreground">
              Real-time emotion recognition using your camera
            </p>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isCameraActive ? (
              <Button
                onClick={startCamera}
                disabled={!isModelLoaded}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
              >
                {!isModelLoaded ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Models...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Start Camera
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={stopCamera}
                variant="destructive"
                className="shadow-elegant"
              >
                <CameraOff className="mr-2 h-4 w-4" />
                Stop Camera
              </Button>
            )}
          </div>

          {/* Camera Feed */}
          <div className="relative flex justify-center">
            <div className="relative rounded-lg overflow-hidden shadow-elegant">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="max-w-full h-auto bg-black"
                style={{ transform: 'scaleX(-1)' }} // Mirror effect
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 pointer-events-none"
                style={{ transform: 'scaleX(-1)' }} // Mirror effect to match video
              />
              
              {/* Detection indicator */}
              {isDetecting && (
                <div className="absolute top-4 right-4 animate-pulse-glow">
                  <div className="w-3 h-3 bg-primary rounded-full shadow-glow"></div>
                </div>
              )}
            </div>
          </div>

          {/* Emotion Display */}
          {currentEmotion && (
            <Card className="p-4 bg-card/50 border-2 animate-fade-in" 
                  style={{ borderColor: getEmotionColor(currentEmotion.emotion) }}>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold" 
                    style={{ color: getEmotionColor(currentEmotion.emotion) }}>
                  {currentEmotion.emotion.charAt(0).toUpperCase() + currentEmotion.emotion.slice(1)}
                </h3>
                <p className="text-muted-foreground">
                  Confidence: {(currentEmotion.confidence * 100).toFixed(1)}%
                </p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${currentEmotion.confidence * 100}%`,
                      backgroundColor: getEmotionColor(currentEmotion.emotion),
                    }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Status */}
          <div className="text-center text-sm text-muted-foreground">
            {!isModelLoaded && "Loading AI models..."}
            {isModelLoaded && !isCameraActive && "Ready to start"}
            {isCameraActive && !currentEmotion && "Looking for faces..."}
            {isCameraActive && currentEmotion && "Emotion detected!"}
            </div>
          </div>
        </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ContextSuggestions currentEmotion={currentEmotion?.emotion || null} />
          <EmotionTrends />
        </div>
      </div>
    </div>
  );
};

export default EmotionDetector;