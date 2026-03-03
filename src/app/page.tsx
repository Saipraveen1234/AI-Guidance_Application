'use client';

import { useState, useCallback, useRef } from 'react';
import { CameraFeed } from '@/components/CameraFeed';
import { AudioController } from '@/components/AudioController';
import { GuidanceOverlay } from '@/components/GuidanceOverlay';
import { Play, Square } from 'lucide-react';

export default function Home() {
  const [isActive, setIsActive] = useState(false);
  const [latestFrame, setLatestFrame] = useState<string | null>(null);
  const [currentInstruction, setCurrentInstruction] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Keep a ref to the latest frame so the voice callback can access it without restale closures
  const frameRef = useRef<string | null>(null);

  const handleFrameCaptured = useCallback((base64Data: string) => {
    setLatestFrame(base64Data);
    frameRef.current = base64Data;
  }, []);

  const handleSpeechRecognized = useCallback(async (transcript: string) => {
    setUserQuery(transcript);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageContent: frameRef.current, // The most recently captured frame
          textContent: transcript,
        }),
      });

      if (!response.ok) {
        throw new Error('API Request Failed');
      }

      const data = await response.json();
      setCurrentInstruction(data.instruction);
    } catch (error) {
      console.error('Error fetching guidance:', error);
      setCurrentInstruction('Sorry, I encountered an error processing that.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const toggleSession = () => {
    if (isActive) {
      setIsActive(false);
      setCurrentInstruction(null);
      setUserQuery(null);
    } else {
      setIsActive(true);
      setCurrentInstruction("I'm ready. Show me what you're working on and tell me what you need help with.");
    }
  };

  return (
    <main className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none" />

      {/* Main Workspace Area (Camera) */}
      <div className="relative w-full max-w-2xl aspect-[3/4] sm:aspect-[9/16] rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10 flex-shrink-0">
        <CameraFeed 
          isActive={isActive} 
          onFrameCaptured={handleFrameCaptured} 
        />
        
        {/* The Text instructions Overlay */}
        <GuidanceOverlay 
          currentInstruction={currentInstruction} 
          userQuery={userQuery} 
        />

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute top-4 right-1/2 translate-x-1/2 z-20">
             <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-xs text-blue-300 font-medium">
                Analyzing...
             </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="fixed bottom-0 inset-x-0 p-8 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center justify-end z-30">
        
        {isActive && (
          <div className="mb-6 w-full max-w-sm">
            <AudioController 
              isActive={isActive}
              onSpeechRecognized={handleSpeechRecognized}
              textToSpeak={currentInstruction}
            />
          </div>
        )}

        <button
          onClick={toggleSession}
          className={`group flex items-center justify-center space-x-3 px-8 py-4 rounded-full font-bold text-lg transition-all transform active:scale-95 shadow-xl ${
            isActive 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
              : 'bg-white text-black hover:bg-neutral-200'
          }`}
        >
          {isActive ? (
            <>
              <Square size={20} className="fill-current" />
              <span>End Session</span>
            </>
          ) : (
            <>
              <Play size={20} className="fill-current" />
              <span>Start Guidance</span>
            </>
          )}
        </button>
      </div>

    </main>
  );
}
