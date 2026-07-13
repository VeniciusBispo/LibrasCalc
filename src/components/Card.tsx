import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  type: 'number' | 'operator';
  value: string | number;
  onClick?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ type, value, onClick, className = '' }) => {
  const isNumber = type === 'number';
  
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        w-20 h-28 rounded-2xl shadow-lg border-2 
        bg-white/90 backdrop-blur-md
        transition-colors overflow-hidden
        ${isNumber ? 'border-blue-100 hover:border-blue-300' : 'border-amber-100 hover:border-amber-300'}
        ${className}
      `}
    >
      {isNumber ? (
        <>
          <img 
            src={`/assets/hands/hand-${value}.png`} 
            alt={`Sinal ${value}`} 
            className="w-16 h-16 object-contain drop-shadow-sm"
          />
          <span className="absolute top-2 left-2 text-xs font-bold text-slate-400">{value}</span>
        </>
      ) : (
        <span className="text-4xl font-extrabold text-amber-500 drop-shadow-sm">
          {value === 'add' ? '+' : value === 'sub' ? '-' : value === 'eq' ? '=' : value}
        </span>
      )}
    </motion.button>
  );
};
