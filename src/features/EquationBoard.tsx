import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { PremiumDraggableCard } from '@/components/PremiumDraggableCard';
import { EquationSlot } from '@/components/EquationSlot';
import { CheckCircle, XCircle } from 'lucide-react';

export const EquationBoard: React.FC = () => {
  const { equation, removeFromEquation, checkEquation, clearEquation, processCorrectEquation } = useGameStore();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [earnedXP, setEarnedXP] = useState(0);
  const [levelUpData, setLevelUpData] = useState({ leveledUp: false, earnedCoins: 0 });

  useEffect(() => {
    if (equation.length === 4) {
      const result = checkEquation();
      if (result === true) {
        setStatus('success');
        const { earnedXP, leveledUp, earnedCoins } = processCorrectEquation();
        setEarnedXP(earnedXP);
        setLevelUpData({ leveledUp, earnedCoins });
        setTimeout(() => {
          clearEquation();
          setStatus('idle');
        }, 2000);
      } else if (result === false) {
        setStatus('error');
        setTimeout(() => {
          setStatus('idle');
        }, 1500);
      }
    }
  }, [equation, checkEquation, processCorrectEquation, clearEquation]);

  const slotsConfig = [
    { type: 'number', label: '1..10' },
    { type: 'operator', label: '+/-' },
    { type: 'number', label: '1..10' },
    { type: 'number', label: '?' }
  ] as const;

  return (
    <div 
      className="relative flex flex-col items-center justify-center p-6 w-full"
      role="region"
      aria-label="Quadro principal de equações"
    >
      
      {/* Animated Status Feedback */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className={`absolute -top-8 flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-white shadow-xl text-lg z-50 ${
              status === 'success' ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-green-500/30' : 'bg-gradient-to-r from-red-400 to-rose-500 shadow-red-500/30'
            }`}
          >
            {status === 'success' ? (
              <>
                <CheckCircle size={28} /> Brilhante! +{earnedXP} XP
                {levelUpData.leveledUp && <span className="ml-2 bg-white/20 px-3 py-1 rounded-full text-sm">Nível Up! +{levelUpData.earnedCoins} 🪙</span>}
              </>
            ) : (
              <><XCircle size={28} /> Tente novamente!</>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4 sm:gap-8 mt-4">
        {slotsConfig.map((config, slotIndex) => {
          const item = equation[slotIndex];
          // Slot is active if it's the first empty slot
          const isActive = equation.length === slotIndex && status === 'idle';
          
          return (
            <EquationSlot 
              key={slotIndex} 
              id={`slot-${slotIndex}`}
              expectedType={config.type}
              label={config.label}
              isEmpty={!item}
              isActive={isActive}
              status={status}
            >
              {item && (
                <PremiumDraggableCard 
                  type={item.type} 
                  value={item.value} 
                  onClick={() => removeFromEquation(item.id)}
                  className="w-full h-full shadow-none absolute top-0 left-0"
                />
              )}
            </EquationSlot>
          );
        })}
      </div>
      
      {equation.length > 0 && status === 'idle' && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={clearEquation}
          className="mt-10 px-8 py-3 text-sm font-black text-[#855f3f] hover:text-[#5a3b1a] bg-wood-pattern hover:bg-wood-dark-pattern rounded-full transition-all shadow-card-3d focus-visible:ring-4 focus-visible:ring-amber-500 outline-none border border-amber-200"
        >
          Limpar Quadro
        </motion.button>
      )}
    </div>
  );
};
