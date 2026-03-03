'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface GuidanceOverlayProps {
  currentInstruction: string | null;
  userQuery: string | null;
}

export function GuidanceOverlay({ currentInstruction, userQuery }: GuidanceOverlayProps) {
  return (
    <div className="absolute inset-x-0 bottom-32 z-20 px-6 flex flex-col items-center pointer-events-none">
      <AnimatePresence mode="wait">
        {userQuery && (
          <motion.div
            key="user-query"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 bg-white/10 backdrop-blur-md px-4 py-2 text-sm text-white/70 italic rounded-full border border-white/5 shadow-lg max-w-sm text-center"
          >
            "{userQuery}"
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {currentInstruction && (
          <motion.div
            key={currentInstruction} // Re-animate when instruction changes
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="bg-gradient-to-br from-black/80 to-blue-900/60 backdrop-blur-2xl border border-white/20 p-6 rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.2)]">
              <h3 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>AI Guide</span>
              </h3>
              <p className="text-white text-xl sm:text-2xl font-medium leading-relaxed tracking-tight">
                {currentInstruction}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
