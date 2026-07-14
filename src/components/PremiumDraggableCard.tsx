import React, { useRef } from 'react';
import { motion } from 'framer-motion';

export interface PremiumDraggableCardProps {
  id?: string;
  type: 'number' | 'operator';
  value: string | number;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

// Mapeamento dos GIFs com suas dimensões reais para proporções corretas
const GIF_MAP: Record<string, { file: string; aspect: 'portrait' | 'landscape' }> = {
  '+': { file: 'Gif_Adição.gif', aspect: 'portrait' },       // 184x332
  '-': { file: 'Gif_Subtração.gif', aspect: 'portrait' },     // 184x328
  '*': { file: 'gif_Multiplicar.gif', aspect: 'landscape' },  // 800x450
  '/': { file: 'gif_Divisão.gif', aspect: 'landscape' },      // 800x450
  '=': { file: 'Gif_Igualdade.gif', aspect: 'portrait' },       // 188x328
};

const OP_NAMES: Record<string, { label: string; symbol: string }> = {
  '+': { label: 'Adição', symbol: '+' },
  '-': { label: 'Subtração', symbol: '−' },
  '*': { label: 'Multiplicação', symbol: '×' },
  '/': { label: 'Divisão', symbol: '÷' },
  '=': { label: 'Igualdade', symbol: '=' },
};

export const PremiumDraggableCard: React.FC<PremiumDraggableCardProps> = ({
  type,
  value,
  onClick,
  className = '',
  disabled = false
}) => {
  const isNumber = type === 'number';
  const videoRef = useRef<HTMLVideoElement>(null);

  const gifInfo = !isNumber ? GIF_MAP[value as string] : null;
  const opInfo = !isNumber ? OP_NAMES[value as string] : null;

  // Aria labels para acessibilidade
  const ariaLabel = isNumber
    ? `Sinal em Libras para o número ${value}`
    : `Sinal de Libras para ${opInfo?.label || value}`;

  // Cores por tipo de operação
  const isAdd = value === '+';
  const isSub = value === '-';
  const isMul = value === '*';
  const isDiv = value === '/';
  const isEq = value === '=';

  let bgClass = 'bg-[#fffbf0]';
  let borderAccent = 'border-[#e0d6c8]';
  if (isAdd) { bgClass = 'bg-gradient-to-b from-[#3b6fa0] to-[#1e4b75]'; borderAccent = 'border-[#4a80b5]'; }
  if (isSub) { bgClass = 'bg-gradient-to-b from-[#e07a3a] to-[#c05520]'; borderAccent = 'border-[#e8874d]'; }
  if (isMul) { bgClass = 'bg-gradient-to-b from-[#e07a3a] to-[#c05520]'; borderAccent = 'border-[#e8874d]'; }
  if (isDiv) { bgClass = 'bg-gradient-to-b from-[#e07a3a] to-[#c05520]'; borderAccent = 'border-[#e8874d]'; }
  if (isEq)  { bgClass = 'bg-gradient-to-b from-[#3b6fa0] to-[#1e4b75]'; borderAccent = 'border-[#4a80b5]'; }

  // Se está no slot (className tem w-), preenche o slot
  const isInSlot = className.includes('w-');

  // Handlers para Play on Hover (futuro: quando tiver vídeos)
  const handleMouseEnter = () => {
    videoRef.current?.play().catch(() => {});
  };
  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      whileHover={!disabled ? { scale: 1.05, y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.96, y: 1, boxShadow: 'inset 2px 4px 8px rgba(0,0,0,0.15)' } : {}}
      drag={!disabled}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      dragElastic={0.2}
      className={`
        relative flex flex-col items-center justify-center
        rounded-xl sm:rounded-2xl border-2 ${borderAccent}
        transition-colors overflow-hidden select-none
        shadow-card-3d
        ${isInSlot ? 'w-full h-full' : (isNumber ? 'w-[4.5rem] h-[6.5rem] sm:w-[5.5rem] sm:h-[7.5rem]' : (gifInfo?.aspect === 'landscape' ? 'w-[8.5rem] h-[7.5rem] sm:w-[14rem] sm:h-[11rem]' : 'w-[5.5rem] h-[7.5rem] sm:w-[8.5rem] sm:h-[11rem]'))}
        focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
        ${bgClass}
        ${className}
      `}
    >
      {/* ───── NUMBER CARDS ───── */}
      {isNumber && (
        <img
          src={`/assets/hands/hand-${value}.png`}
          alt=""
          loading="lazy"
          aria-hidden="true"
          className="w-full h-full object-contain p-1 sm:p-1.5 pointer-events-none drop-shadow-sm"
        />
      )}

      {/* ───── OPERATOR CARDS ───── */}
      {!isNumber && gifInfo && opInfo && (
        <>
          {/* GIF container - preenche todo o card */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={`/assets/gifs/${gifInfo.file}`}
              alt=""
              loading="lazy"
              aria-hidden="true"
              className="w-full h-full object-cover object-center"
              style={gifInfo.aspect === 'landscape' ? { transform: 'scale(1.85)', transformOrigin: '100% 40%' } : undefined}
            />
            {/* Overlay gradiente para legibilidade */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          </div>

          {/* Badge do símbolo no canto superior direito */}
          <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-10 pointer-events-none">
            <span className="
              bg-white/90 backdrop-blur-sm text-[#1a385c] font-black text-[0.6rem] sm:text-xs
              w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center
              rounded-full shadow-md border border-white/50
            ">
              {opInfo.symbol}
            </span>
          </div>

          {/* Label da operação na parte inferior */}
          <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none pb-1 pt-3 sm:pb-1.5 sm:pt-4 bg-gradient-to-t from-black/60 to-transparent">
            <span className="
              block text-center text-white font-black text-[0.4rem] sm:text-[0.55rem]
              uppercase tracking-[0.1em] sm:tracking-[0.15em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]
            ">
              {opInfo.label}
            </span>
          </div>
        </>
      )}
    </motion.button>
  );
};
