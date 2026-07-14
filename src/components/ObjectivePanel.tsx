import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Timer } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

export const ObjectivePanel: React.FC = () => {
  const { targetNumber, challengeExpiresAt, fetchGlobalChallenge } = useGameStore();
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  // 1. Ao montar e a cada 15 segundos, busca o desafio atualizado do servidor
  useEffect(() => {
    fetchGlobalChallenge();
    const interval = setInterval(() => {
      fetchGlobalChallenge();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchGlobalChallenge]);

  // 2. Controla o cronômetro regressivo com base no expiresAt do servidor
  useEffect(() => {
    if (!challengeExpiresAt) return;

    const updateTimer = () => {
      const diff = challengeExpiresAt - Date.now();
      if (diff <= 0) {
        setTimeLeftStr('0:00');
        fetchGlobalChallenge(); // Força atualização ao zerar
      } else {
        const minutes = Math.floor(diff / 1000 / 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeftStr(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [challengeExpiresAt, fetchGlobalChallenge]);

  return (
    <div className="w-full flex justify-center">
      <motion.div
        layout
        className="
          relative flex items-center gap-2 sm:gap-4 
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

        {timeLeftStr && (
          <div className="flex items-center gap-1 pl-2 sm:pl-4 border-l border-white/30 text-white/90">
            <Timer size={14} className="sm:w-4 sm:h-4 opacity-80" />
            <span className="text-[0.65rem] sm:text-xs font-bold font-mono tracking-wider tabular-nums">{timeLeftStr}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
