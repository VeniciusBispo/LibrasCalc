import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

export const ObjectivePanel: React.FC = () => {
  const { targetNumber } = useGameStore();

  return (
    <div className="w-full flex justify-center">
      <motion.div
        layout
        className="
          relative flex items-center gap-2 sm:gap-3 
          px-4 py-2 sm:px-6 sm:py-3 
          bg-gradient-to-r from-amber-500/90 to-orange-500/90
          backdrop-blur-sm rounded-xl sm:rounded-2xl 
          shadow-lg border border-amber-300/50
          text-white
        "
      >
        <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
          <Target size={16} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[0.65rem] sm:text-xs font-bold uppercase tracking-wider opacity-90">
            Resultado:
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={targetNumber}
              initial={{ opacity: 0, y: -10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-lg sm:text-2xl font-black drop-shadow-md tabular-nums"
            >
              {targetNumber}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
