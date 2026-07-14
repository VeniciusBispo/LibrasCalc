import React from 'react';
import { PremiumDraggableCard } from '@/components/PremiumDraggableCard';
import { useGameStore } from '@/store/gameStore';

export interface CardTrayProps {
  mode?: 'all' | 'numbers' | 'operators';
}

export const CardTray: React.FC<CardTrayProps> = ({ mode = 'all' }) => {
  const { addToEquation, activeDifficulty } = useGameStore();

  // Limitado a 10 pois só temos imagens de mãos de 1 a 10
  const maxNumber = 10;

  const numbers = Array.from({ length: maxNumber }, (_, i) => i + 1);
  const operators = ['+', '-', '*', '/'];

  /* ──────── NÚMEROS ──────── */
  const renderNumbers = () => (
    <div className="w-fit mx-auto bg-wood-dark-pattern p-2 pt-8 sm:p-6 sm:pt-10 rounded-2xl sm:rounded-[2rem] shadow-wood-inset border-b border-white/20 border-r border-white/10 relative">
      <h3 className="text-[0.55rem] sm:text-[0.65rem] font-black text-[#66432b]/70 uppercase tracking-[0.2em] absolute top-2.5 left-4 sm:top-3.5 sm:left-6">
        Números em Libras
      </h3>

      {/* Grid uniforme 3 colunas com scroll no mobile */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-3 justify-items-center max-h-[220px] sm:max-h-[400px] overflow-y-auto p-1 sm:p-2 scrollbar-thin scrollbar-thumb-amber-700/30 scrollbar-track-transparent">
        {numbers.map((num) => (
          <PremiumDraggableCard
            key={`num-${num}`}
            type="number"
            value={num}
            onClick={() => addToEquation({ type: 'number', value: num })}
          />
        ))}
      </div>
    </div>
  );

  /* ──────── OPERAÇÕES ──────── */
  const renderOperators = (vertical: boolean) => (
    <div className={`
      bg-wood-dark-pattern rounded-2xl sm:rounded-[2rem] shadow-wood-inset
      border-b border-white/20 border-r border-white/10 relative
      ${vertical
        ? 'flex flex-col items-center py-6 px-3 sm:py-8 sm:px-4 h-full gap-2 sm:gap-3'
        : 'w-fit mx-auto p-4 pt-8 sm:p-6 sm:pt-10'}
    `}>
      <h3 className={`
        text-[0.55rem] sm:text-[0.65rem] font-black text-[#66432b]/70 uppercase tracking-[0.2em]
        ${vertical ? 'mb-2' : 'absolute top-2.5 left-4 sm:top-3.5 sm:left-6'}
      `}>
        Operações
      </h3>

      <div className={`
        ${vertical
          ? 'flex flex-col items-center gap-2 sm:gap-3 flex-1 justify-center'
          : 'flex flex-col gap-2 sm:gap-3 justify-center w-full'}
      `}>
        {vertical ? (
          <>
            {operators.map((op) => (
              <PremiumDraggableCard
                key={`op-${op}`}
                type="operator"
                value={op}
                onClick={() => addToEquation({ type: 'operator', value: op })}
              />
            ))}
            <div className="bg-[#a06e46]/40 rounded-full self-center h-[2px] w-10 sm:w-14 my-1" />
            <PremiumDraggableCard
              type="operator"
              value="="
              onClick={() => addToEquation({ type: 'operator', value: '=' })}
            />
          </>
        ) : (
          <>
            {/* Linha superior: Adição, Subtração, Igualdade */}
            <div className="flex flex-row flex-wrap justify-center gap-2 sm:gap-3">
              <PremiumDraggableCard type="operator" value="+" onClick={() => addToEquation({ type: 'operator', value: '+' })} />
              <PremiumDraggableCard type="operator" value="-" onClick={() => addToEquation({ type: 'operator', value: '-' })} />
              <PremiumDraggableCard type="operator" value="=" onClick={() => addToEquation({ type: 'operator', value: '=' })} />
            </div>
            {/* Linha inferior: Multiplicação, Divisão (mais largos) */}
            <div className="flex flex-row flex-wrap justify-center gap-2 sm:gap-3">
              <PremiumDraggableCard type="operator" value="*" onClick={() => addToEquation({ type: 'operator', value: '*' })} />
              <PremiumDraggableCard type="operator" value="/" onClick={() => addToEquation({ type: 'operator', value: '/' })} />
            </div>
          </>
        )}
      </div>
    </div>
  );

  /* ──────── RENDER ──────── */
  return (
    <div className={mode === 'all' ? 'flex flex-col xl:flex-row flex-wrap justify-center items-center xl:items-start gap-4 sm:gap-8 w-full max-w-7xl mt-0 sm:mt-2' : 'w-full h-full'}>
      {mode === 'all' && (
        <>
          {renderNumbers()}
          {renderOperators(false)}
        </>
      )}
      {mode === 'numbers' && renderNumbers()}
      {mode === 'operators' && renderOperators(true)}
    </div>
  );
};
