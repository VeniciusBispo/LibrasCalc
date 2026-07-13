import React from 'react';
import { motion } from 'framer-motion';

export interface EquationSlotProps {
  id: string;
  expectedType: 'number' | 'operator';
  label?: string;
  isEmpty: boolean;
  isActive?: boolean;
  status?: 'idle' | 'success' | 'error';
  children?: React.ReactNode;
}

export const EquationSlot: React.FC<EquationSlotProps> = ({ 
  expectedType, 
  label,
  isEmpty, 
  isActive = false,
  status = 'idle',
  children 
}) => {
  const isOperator = expectedType === 'operator';
  const defaultLabel = isOperator ? '+/-' : '1..10';
  const displayLabel = label || defaultLabel;
  
  // Acessibility: Describe the slot purpose
  const ariaLabel = isEmpty 
    ? `Espaço vazio para ${isOperator ? 'um operador matemático' : 'um número'}`
    : `Espaço preenchido`;

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={`
        relative flex items-center justify-center 
        w-[3.5rem] h-20 sm:w-28 sm:h-36 rounded-xl sm:rounded-3xl transition-colors duration-300
        
        /* Skeuomorphic Wood Slot (Inset shadow carving) */
        ${isEmpty ? 'bg-wood-dark-pattern shadow-wood-deep border border-[#b5835a]/50' : 'bg-transparent border-transparent'}
        
        /* Active (Glowing) state */
        ${isActive && isEmpty ? 'ring-[3px] ring-blue-500 shadow-slot-glow animate-pulse' : ''}
        
        /* Status feedback styles */
        ${status === 'error' ? 'ring-4 ring-red-400 bg-red-900/10' : ''}
        ${status === 'success' ? 'ring-4 ring-green-400 bg-green-900/10' : ''}
      `}
    >
      {isEmpty && (
        <span className={`font-black text-xl select-none z-0 ${
          isActive 
            ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' 
            : 'text-[#855f3f]/40 shadow-inner mix-blend-multiply'
        }`}>
          {displayLabel}
        </span>
      )}
      
      {/* Corner cutouts aesthetic for the active slot (mock holographic style) */}
      {isEmpty && isActive && (
        <>
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-blue-400 rounded-tl-lg"></div>
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-blue-400 rounded-tr-lg"></div>
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-blue-400 rounded-bl-lg"></div>
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-blue-400 rounded-br-lg"></div>
        </>
      )}
      
      {/* If an item is dropped here, it renders inside this slot */}
      {children && (
        <motion.div
          layoutId={`item-${children.toString()}`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};
