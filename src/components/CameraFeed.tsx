'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraFeedProps {
  onFrameCaptured?: (base64Image: string) => void;
  isActive: boolean;
  className?: string;
}

export function CameraFeed({ onFrameCaptured, isActive, className }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false, // We handle audio separately
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err: any) {
      // Ignore AbortError caused by rapid toggling of the camera
      if (err.name !== 'AbortError') {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Please ensure permissions are granted.');
      }
    }
  }, [facingMode]); // stream dependency removed intentionally to avoid infinite loops

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  // Handle active state changes
  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isActive, startCamera, stopCamera]);

  // Frame capture loop when active
  useEffect(() => {
    let captureInterval: NodeJS.Timeout;
    
    if (isActive && stream && onFrameCaptured) {
      captureInterval = setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // Set canvas dimensions to match video to avoid distortion
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // Compress the image slightly to save bandwidth (JPEG, 0.7 quality)
              const base64Image = canvas.toDataURL('image/jpeg', 0.7);
              // Extract just the base64 data string
              const base64Data = base64Image.split(',')[1];
              
              onFrameCaptured(base64Data);
            }
          }
        }
      }, 3000); // Capture every 3 seconds
    }
    
    return () => {
      clearInterval(captureInterval);
    };
  }, [isActive, stream, onFrameCaptured]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className={cn("relative w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-2xl border border-white/10", className)}>
      {/* Hidden canvas for taking snapshots */}
      <canvas ref={canvasRef} className="hidden" />
      
      {error ? (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
            <CameraOff size={32} />
          </div>
          <p className="text-white/80 max-w-xs">{error}</p>
          <button 
            onClick={startCamera}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-full text-white text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      ) : !isActive ? (
        <div className="flex flex-col items-center space-y-3 text-white/50">
          <Camera size={48} strokeWidth={1} />
          <p className="text-sm">Camera Paused</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Controls Overlay */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={toggleCamera}
              className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all border border-white/10"
              aria-label="Switch camera"
            >
              <RefreshCw size={20} />
            </button>
          </div>
          
          {/* Recording Indicator */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-white uppercase shadow-black drop-shadow-md">Live</span>
          </div>
        </>
      )}
    </div>
  );
}
