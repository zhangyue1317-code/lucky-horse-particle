import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Overlay } from './components/Overlay';
import { Experience } from './components/Experience';
import { ConfigPanel } from './components/ConfigPanel';
import { GestureType, PhotoData, UIConfig } from './types';

// Global MediaPipe Objects (assumes loaded via CDN in index.html)
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gesture, setGesture] = useState<GestureType>(GestureType.NONE);
  const [pinchDistance, setPinchDistance] = useState<number>(1);
  const [handOpenAmount, setHandOpenAmount] = useState<number>(0.5);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);

  // UI Configuration State
  const [uiConfig, setUiConfig] = useState<UIConfig>({
    titleScale: 1.0,
    titleColorStart: '#fef9c3', // yellow-100
    titleColorMid: '#facc15',   // yellow-400
    titleColorEnd: '#dc2626',   // red-600
    titleShadowOpacity: 0.5,
    titleOffsetX: 0,
    titleOffsetY: 0,
    
    containerBgColor: '#ffffff',
    containerBgOpacity: 0.05,
    containerBlur: 24,
    containerBorderOpacity: 0.1,
    containerShineOpacity: 0.5,
    containerPaddingX: 48,
    containerPaddingY: 32,
    containerOffsetX: 0,
    containerOffsetY: 0
  });

  // Calculate Euclidean distance
  const getDistance = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  useEffect(() => {
    // Retry mechanism to wait for scripts to load
    let intervalId: any;
    
    const initMediaPipe = () => {
        if (!window.Hands || !window.Camera || !videoRef.current) {
            return false;
        }

        const hands = new window.Hands({
            locateFile: (file: string) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults((results: any) => {
            if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
                setGesture(GestureType.NONE);
                setHandOpenAmount(prev => prev * 0.95 + 0.5 * 0.05);
                return;
            }

            const landmarks = results.multiHandLandmarks[0];
            const wrist = landmarks[0];
            const middleMCP = landmarks[9];
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];
            
            // Reference Size
            const handSize = getDistance(wrist, middleMCP) || 0.1;

            // 1. Openness
            const tips = [4, 8, 12, 16, 20].map(i => landmarks[i]);
            let totalDistToWrist = 0;
            tips.forEach(tip => {
                totalDistToWrist += getDistance(tip, wrist);
            });
            const avgDist = totalDistToWrist / 5;
            const opennessRatio = avgDist / handSize; 
            const normalizedOpen = Math.min(Math.max((opennessRatio - 0.8) / 1.2, 0), 1);
            setHandOpenAmount(normalizedOpen);

            // 2. Pinch
            const pinchAbsDist = getDistance(thumbTip, indexTip);
            const pinchRatio = pinchAbsDist / handSize;
            setPinchDistance(pinchRatio);

            // 3. Classification
            if (pinchRatio < 0.25) { 
                setGesture(GestureType.PINCH);
            } else if (opennessRatio < 1.1) { 
                setGesture(GestureType.FIST);
            } else {
                setGesture(GestureType.OPEN_PALM);
            }
        });

        const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
                if (videoRef.current) {
                    await hands.send({image: videoRef.current});
                }
            },
            width: 640,
            height: 480
        });
        camera.start();

        setIsMediaPipeReady(true);
        return true;
    };

    // Attempt immediately, then poll
    if (!initMediaPipe()) {
        intervalId = setInterval(() => {
            if (initMediaPipe()) {
                clearInterval(intervalId);
            }
        }, 500);
    }

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleAddPhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
          const url = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => {
            const aspectRatio = img.width / img.height;
            setPhotos(prev => [...prev, { 
                // Generate a more unique ID to avoid collisions in fast loops
                id: Math.random().toString(36).substr(2, 9) + Date.now(), 
                url, 
                aspectRatio 
            }]);
          };
          img.src = url;
      });
    }
  }, []);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden"
      style={{
        // Deep Red Radial Gradient for a premium, spatial, festive atmosphere
        // Center: Dark red (#3a0909) -> Mid: Deep reddish-black (#1a0202) -> Edge: Black (#000000)
        background: 'radial-gradient(circle at 50% 30%, #3a0909 0%, #1a0202 50%, #000000 100%)'
      }}
    >
      <video ref={videoRef} className="hidden" playsInline muted />
      
      {!isMediaPipeReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-white backdrop-blur-sm">
           <div className="text-center">
             <p className="text-xl mb-2 font-light tracking-widest text-yellow-100">Initializing Experience...</p>
             <div className="w-8 h-8 border-4 border-red-800 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
           </div>
        </div>
      )}

      <Experience 
        gesture={gesture} 
        pinchDistance={pinchDistance}
        photos={photos}
        handOpenAmount={handOpenAmount}
      />

      <Overlay 
        onAddPhoto={handleAddPhoto} 
        gestureName={gesture} 
        config={uiConfig} 
      />
      
      <ConfigPanel config={uiConfig} setConfig={setUiConfig} />
    </div>
  );
};

export default App;