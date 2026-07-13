import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { shopItems } from '@/store/shopItems';
import type { ShopCategory } from '@/store/shopItems';
import * as LucideIcons from 'lucide-react';
import { AnimatedIcon } from './AnimatedIcon';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose }) => {
  const { coins, purchaseItem, equipItem, unlockedIcons, unlockedThemes, unlockedDifficulties, activeIcon, activeTheme, activeDifficulty } = useGameStore();
  const [activeTab, setActiveTab] = useState<ShopCategory>('icons');

  if (!isOpen) return null;

  const getUnlockedState = (category: ShopCategory, id: string) => {
    if (category === 'icons') return unlockedIcons.includes(id);
    if (category === 'themes') return unlockedThemes.includes(id);
    if (category === 'difficulties') return unlockedDifficulties.includes(id);
    return false;
  };

  const getActiveState = (category: ShopCategory, id: string) => {
    if (category === 'icons') return activeIcon === id;
    if (category === 'themes') return activeTheme === id;
    if (category === 'difficulties') return activeDifficulty === id;
    return false;
  };

  const filteredItems = shopItems.filter(item => item.category === activeTab);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh] border-4 border-amber-500/20"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-6 text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-3">
              <LucideIcons.Store size={32} />
              <h2 className="text-3xl font-black drop-shadow-sm">Loja</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md">
                <LucideIcons.Coins size={20} className="text-yellow-300 drop-shadow-sm" />
                <span className="font-black text-xl">{coins}</span>
              </div>
              <button onClick={onClose} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                <LucideIcons.X size={24} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-amber-50 border-b border-amber-200">
            {[
              { id: 'icons', label: 'Ícones', icon: 'User' },
              { id: 'themes', label: 'Temas', icon: 'Palette' },
              { id: 'difficulties', label: 'Dificuldade', icon: 'Swords' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ShopCategory)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all border-b-4 ${
                  activeTab === tab.id 
                    ? 'border-amber-500 text-amber-700 bg-amber-100' 
                    : 'border-transparent text-amber-900/60 hover:bg-amber-100/50'
                }`}
              >
                {/* @ts-ignore */}
                {React.createElement(LucideIcons[tab.icon], { size: 18 })}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredItems.map(item => {
                const isUnlocked = getUnlockedState(item.category, item.id);
                const isActive = getActiveState(item.category, item.id);
                
                // @ts-ignore
                const IconComp = item.iconName ? LucideIcons[item.iconName] : null;

                return (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={item.id} 
                    className={`bg-white rounded-2xl p-5 border-2 flex flex-col gap-3 shadow-sm transition-all ${
                      isActive ? 'border-amber-500 shadow-amber-200 shadow-lg ring-4 ring-amber-500/10' : 'border-slate-200 hover:border-amber-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`p-3 rounded-xl flex items-center justify-center ${isActive ? 'bg-amber-100' : 'bg-slate-100'} ${item.color || (isActive ? 'text-amber-700' : 'text-slate-500')}`}>
                        <AnimatedIcon effect={item.effect}>
                          {IconComp ? <IconComp size={32} className="drop-shadow-sm" /> : <LucideIcons.Package size={32} />}
                        </AnimatedIcon>
                      </div>
                      {!isUnlocked && (
                        <div className="flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-sm">
                          <LucideIcons.Coins size={14} /> {item.cost}
                        </div>
                      )}
                      {isUnlocked && !isActive && (
                        <div className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
                          Adquirido
                        </div>
                      )}
                      {isActive && (
                        <div className="bg-amber-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm">
                          <LucideIcons.Check size={14} /> Ativo
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-black text-lg text-slate-800 leading-tight">{item.name}</h3>
                      <p className="text-slate-500 text-sm mt-1">{item.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-2">
                      {!isUnlocked ? (
                        <button
                          onClick={() => purchaseItem(item.id)}
                          disabled={coins < item.cost}
                          className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            coins >= item.cost 
                              ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg active:scale-95' 
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <LucideIcons.ShoppingCart size={18} /> 
                          {coins >= item.cost ? 'Comprar' : 'Sem moedas'}
                        </button>
                      ) : (
                        <button
                          onClick={() => equipItem(item.id, item.category)}
                          disabled={isActive}
                          className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            isActive
                              ? 'bg-amber-100 text-amber-700 cursor-default'
                              : 'bg-slate-800 text-white hover:bg-slate-700 shadow-md hover:shadow-lg active:scale-95'
                          }`}
                        >
                          {isActive ? 'Em uso' : 'Equipar'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
