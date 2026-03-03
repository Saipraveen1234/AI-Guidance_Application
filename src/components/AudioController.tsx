'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';

interface AudioControllerProps {
  onSpeechRecognized: (text: string) => void;
  textToSpeak: string | null;
  isActive: boolean;
}

export function AudioController({ onSpeechRecognized, textToSpeak, isActive }: AudioControllerProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSupport, setHasSupport] = useState(true);
  
  const recognitionRef = useRef<any>(null); // Type any due to experimental API
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize Audio APIs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Setup Text-to-Speech
      synthRef.current = window.speechSynthesis;

      // Setup Speech-to-Text (Browser Native)
      // @ts-ignore - Vendor prefixes
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setHasSupport(false);
        setError("Your browser doesn't support native speech recognition.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        
        // Stop listening temporarily to process and avoid echo
        stopListening();
        onSpeechRecognized(transcript);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error("Speech recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        // Auto restart if still supposed to be active
        if (isActive && !synthRef.current?.speaking) {
           // Small delay before restarting
           setTimeout(() => {
             try {
                if (isActive) recognitionRef.current?.start();
             } catch (e) {}
           }, 500);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [isActive, onSpeechRecognized]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && hasSupport) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start listening:", err);
      }
    }
  }, [isListening, hasSupport]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  // Handle active state
  useEffect(() => {
    if (isActive) {
      startListening();
    } else {
      stopListening();
      if (synthRef.current) {
        synthRef.current.cancel(); // Stop talking
      }
    }
  }, [isActive, startListening, stopListening]);

  // Handle speaking incoming text
  useEffect(() => {
    if (textToSpeak && synthRef.current && isActive) {
      // Pause listening while speaking to avoid feedback loop
      stopListening();
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Try to find a good English voice
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en-US')) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.rate = 1.05; // Slightly faster for efficiency
      
      utterance.onend = () => {
        // Resume listening after speaking finishes
        if (isActive) {
          startListening();
        }
      };

      synthRef.current.speak(utterance);
    }
  }, [textToSpeak, isActive, startListening, stopListening]);

  if (!hasSupport) {
    return <div className="text-red-500 text-xs text-center p-2 bg-red-500/10 rounded">Audio not supported</div>;
  }

  return (
    <div className="flex items-center space-x-4 bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-full shadow-2xl">
      <div className={`p-3 rounded-full transition-all duration-300 ${isListening ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
        {isListening ? (
           <div className="relative">
              <Mic size={24} className="animate-pulse" />
              <div className="absolute inset-0 rounded-full animate-ping opacity-50 bg-blue-400" />
           </div>
        ) : (
          <MicOff size={24} />
        )}
      </div>
      
      <div className="flex flex-col flex-1 min-w-[150px]">
        <span className="text-sm font-medium text-white">
          {isListening ? 'Listening...' : 'Audio Paused'}
        </span>
        <span className="text-xs text-white/50">
          {textToSpeak ? 'Assistant replied' : 'Awaiting prompt'}
        </span>
      </div>

      <div className={`p-3 rounded-full transition-all duration-300 ${textToSpeak ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-white/5 text-white/40'}`}>
        <Volume2 size={24} />
      </div>
    </div>
  );
}
