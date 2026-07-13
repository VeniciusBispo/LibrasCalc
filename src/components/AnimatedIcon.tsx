import React from 'react';
import { motion } from 'framer-motion';
import type { IconEffect } from '@/store/shopItems';

interface AnimatedIconProps {
  children: React.ReactNode;
  effect?: IconEffect;
  className?: string;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({ children, effect = 'none', className = '' }) => {
  const getAnimation = () => {
    switch (effect) {
      case 'float':
        return {
          y: [-3, 3, -3],
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        };
      case 'bounce':
        return {
          y: [0, -6, 0],
          transition: { duration: 0.6, repeat: Infinity, ease: 'easeOut', repeatType: 'reverse' }
        };
      case 'pulse':
        return {
          scale: [1, 1.15, 1],
          transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
        };
      case 'spin':
        return {
          rotate: [0, 360],
          transition: { duration: 3, repeat: Infinity, ease: 'linear' }
        };
      case 'shake':
        return {
          rotate: [-10, 10, -10],
          transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
        };
      case 'none':
      default:
        return {};
    }
  };

  return (
    <motion.div 
      className={`inline-flex items-center justify-center ${className}`}
      animate={getAnimation() as any}
      // @ts-ignore
      style={effect === 'pulse' ? { originX: 0.5, originY: 0.5 } : {}}
    >
      {children}
    </motion.div>
  );
};
