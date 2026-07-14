import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { PremiumDraggableCard } from '@/components/PremiumDraggableCard';
import { EquationSlot } from '@/components/EquationSlot';
import { ObjectivePanel } from '@/components/ObjectivePanel';
import { CheckCircle, XCircle, Target, Check, AlertTriangle } from 'lucide-react';
import { getExpectedTypeForNextSlot, isReadyToCheck } from '@/utils/mathParser';

export const EquationBoard: React.FC = () => {
  const { equation, removeFromEquation, checkEquation, clearEquation, processCorrectEquation, generateNewTarget, lastInsertError, clearInsertError } = useGameStore();
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'target'>('idle');
  const [earnedXP, setEarnedXP] = useState(0);
  const [levelUpData, setLevelUpData] = useState({ leveledUp: false, earnedCoins: 0 });
  const [shakeSlot, setShakeSlot] = useState(false);

  // Limpar erro de inserção após 2s
  useEffect(() => {
    if (lastInsertError) {
      setShakeSlot(true);
      const timer = setTimeout(() => {
        clearInsertError();
        setShakeSlot(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastInsertError, clearInsertError]);

  const handleVerify = useCallback(() => {
    if (status !== 'idle') return;
    
    const result = checkEquation();
    if (result === true) {
      const { earnedXP: xp, leveledUp, earnedCoins, hitTarget } = processCorrectEquation();
      setEarnedXP(xp);
      setLevelUpData({ leveledUp, earnedCoins });
      setStatus(hitTarget ? 'target' : 'success');
      setTimeout(() => {
        clearEquation();
        if (hitTarget) {
          useGameStore.getState().completeGlobalChallenge();
        } else {
          useGameStore.getState().fetchGlobalChallenge();
        }
        setStatus('idle');
      }, 2500);
    } else if (result === false) {
      setStatus('error');
      setTimeout(() => {
        setStatus('idle');
      }, 1500);
    }
  }, [status, checkEquation, processCorrectEquation, clearEquation, generateNewTarget]);

  // Determinar slots a exibir
  const nextExpectedType = getExpectedTypeForNextSlot(equation);
  const showNextSlot = status === 'idle' && equation.length < 9;
  const canCheck = isReadyToCheck(equation) && status === 'idle';

  // Gerar labels para os slots existentes + próximo
  const getSlotLabel = (type: 'number' | 'operator'): string => {
    return type === 'number' ? '1..10' : '+/-';
  };

  return (
    <div 
      className="relative flex flex-col items-center justify-center p-2 pt-8 sm:p-6 w-full"
      role="region"
      aria-label="Quadro principal de equações"
    >
      
      {/* Top Panel: Objective or Feedback */}
      <div className="h-16 sm:h-20 flex items-center justify-center mb-2 w-full relative">
        <AnimatePresence mode="wait">
          {status === 'idle' ? (
            <motion.div
              key="objective"
              initial={{ opacity: 0, y: -15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <ObjectivePanel />
            </motion.div>
          ) : (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: -15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-2 sm:gap-3 px-4 py-2 sm:px-8 sm:py-4 rounded-2xl sm:rounded-3xl font-black text-white shadow-xl text-sm sm:text-lg z-50 whitespace-nowrap ${
                status === 'target' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 shadow-yellow-500/30' :
                status === 'success' ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-green-500/30' : 
                'bg-gradient-to-r from-red-400 to-rose-500 shadow-red-500/30'
              }`}
            >
              {status === 'target' ? (
                <>
                  <Target className="w-5 h-5 sm:w-7 sm:h-7" /> 🎯 Objetivo Atingido! +{earnedXP} XP
                  {levelUpData.leveledUp && <span className="ml-1 sm:ml-2 bg-white/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">Nível Up! +{levelUpData.earnedCoins} 🪙</span>}
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7" /> Brilhante! +{earnedXP} XP
                  {levelUpData.leveledUp && <span className="ml-1 sm:ml-2 bg-white/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">Nível Up! +{levelUpData.earnedCoins} 🪙</span>}
                </>
              ) : (
                <><XCircle className="w-5 h-5 sm:w-7 sm:h-7" /> Tente novamente!</>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Insert Error Toast */}
      <AnimatePresence>
        {lastInsertError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-8 sm:-bottom-10 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-xs sm:text-sm shadow-lg z-50"
          >
            <AlertTriangle size={14} /> {lastInsertError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Equation Slots */}
      <div className={`flex flex-wrap justify-center gap-1.5 sm:gap-4 mt-2 sm:mt-4 ${status === 'error' ? 'animate-shake' : ''}`}>
        {/* Rendered filled slots */}
        {equation.map((item, idx) => {
          // Recalculate after = sign
          const equalIdx = equation.findIndex(e => e.type === 'operator' && e.value === '=');
          let slotType: 'number' | 'operator';
          if (equalIdx !== -1 && idx > equalIdx) {
            const rightPos = idx - equalIdx - 1;
            slotType = rightPos % 2 === 0 ? 'number' : 'operator';
          } else {
            slotType = idx % 2 === 0 ? 'number' : 'operator';
          }

          return (
            <EquationSlot 
              key={`filled-${idx}`} 
              id={`slot-${idx}`}
              expectedType={slotType}
              label={getSlotLabel(slotType)}
              isEmpty={false}
              isActive={false}
              status={status === 'idle' ? 'idle' : status === 'target' ? 'success' : status}
            >
              <PremiumDraggableCard 
                type={item.type} 
                value={item.value} 
                onClick={() => status === 'idle' && removeFromEquation(item.id)}
                className="w-full h-full shadow-none absolute top-0 left-0"
              />
            </EquationSlot>
          );
        })}

        {/* Next empty slot */}
        {showNextSlot && (
          <EquationSlot 
            key={`next-${equation.length}`}
            id={`slot-${equation.length}`}
            expectedType={nextExpectedType}
            label={getSlotLabel(nextExpectedType)}
            isEmpty={true}
            isActive={true}
            status={shakeSlot ? 'error' : 'idle'}
          />
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-6 sm:mt-8">
        {equation.length > 0 && status === 'idle' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={clearEquation}
            className="px-6 py-2.5 sm:px-8 sm:py-3 text-sm font-black text-[#855f3f] hover:text-[#5a3b1a] bg-wood-pattern hover:bg-wood-dark-pattern rounded-full transition-all shadow-card-3d focus-visible:ring-4 focus-visible:ring-amber-500 outline-none border border-amber-200 cursor-pointer"
          >
            Limpar
          </motion.button>
        )}

        {canCheck && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleVerify}
            className="px-6 py-2.5 sm:px-8 sm:py-3 text-sm font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-full transition-all shadow-lg shadow-green-500/30 focus-visible:ring-4 focus-visible:ring-green-500 outline-none flex items-center gap-2 cursor-pointer"
          >
            <Check size={18} strokeWidth={3} />
            Verificar
          </motion.button>
        )}
      </div>
    </div>
  );
};
