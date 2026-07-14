import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ShopCategory } from './shopItems';
import { shopItems } from './shopItems';
import { validateEquation, getExpectedTypeForNextSlot, isReadyToCheck, evaluateExpression } from '@/utils/mathParser';

export type ItemType = 'number' | 'operator';

export interface EquationItem {
  id: string;
  type: ItemType;
  value: string | number;
}

interface GameState {
  userId: string | null;
  username: string;
  xp: number;
  level: number;
  coins: number;
  
  // Store State
  unlockedIcons: string[];
  activeIcon: string;
  unlockedThemes: string[];
  activeTheme: string;
  unlockedDifficulties: string[];
  activeDifficulty: string;

  // Objective
  targetNumber: number;

  equationHistory: Record<string, number>;
  equation: EquationItem[];
  lastInsertError: string | null;

  login: (username: string, password: string, action?: 'login' | 'register') => Promise<boolean | string>;
  logout: () => void;
  addXP: (amount: number) => void;
  addToEquation: (item: Omit<EquationItem, 'id'>) => boolean;
  removeFromEquation: (id: string) => void;
  clearEquation: () => void;
  checkEquation: () => boolean | null;
  processCorrectEquation: () => { earnedXP: number, leveledUp: boolean, earnedCoins: number, hitTarget: boolean };
  generateNewTarget: () => void;
  clearInsertError: () => void;
  
  // Store Methods
  purchaseItem: (id: string) => boolean;
  equipItem: (id: string, category: ShopCategory) => void;
  
  // Database sync
  syncToDatabase: () => void;
  fetchUserData: () => Promise<void>;
}

// Debounce helper for database sync
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 1500;

function generateTarget(currentTarget: number): number {
  // Limite máximo de 10 pois só temos imagens de mãos de 1 a 10
  const max = 10;
  let newTarget: number;
  do {
    newTarget = Math.floor(Math.random() * max) + 1;
  } while (newTarget === currentTarget);
  return newTarget;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      userId: null,
      username: '',
      xp: 0,
      level: 1,
      coins: 0,

      unlockedIcons: ['icon_user'],
      activeIcon: 'icon_user',
      unlockedThemes: ['theme_wood'],
      activeTheme: 'theme_wood',
      unlockedDifficulties: ['diff_easy'],
      activeDifficulty: 'diff_easy',

      targetNumber: generateTarget(0),

      equationHistory: {},
      equation: [],
      lastInsertError: null,

      login: async (username, password, action = 'login') => {
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, action })
          });
          const data = await res.json();
          if (!res.ok) {
            return data.error || 'Erro de comunicação';
          }
          set({
            userId: data.userId,
            username: data.username,
            level: data.level || 1,
            xp: data.xp || 0,
            coins: data.coins || 0,
            activeIcon: data.activeIcon || 'icon_user',
            activeTheme: data.activeTheme || 'theme_wood',
            activeDifficulty: data.activeDifficulty || 'diff_easy',
            unlockedIcons: data.unlockedIcons || ['icon_user'],
            unlockedThemes: data.unlockedThemes || ['theme_wood'],
            unlockedDifficulties: data.unlockedDifficulties || ['diff_easy']
          });
          get().syncToDatabase();
          return true;
        } catch (e) {
          console.error('Login error', e);
          return 'Erro ao tentar conectar';
        }
      },

      logout: () => {
        set({ 
          userId: null, 
          username: '', 
          xp: 0, 
          level: 1, 
          coins: 0, 
          equationHistory: {},
          activeIcon: 'icon_user',
          activeTheme: 'theme_wood',
          activeDifficulty: 'diff_easy',
          unlockedIcons: ['icon_user'],
          unlockedThemes: ['theme_wood'],
          unlockedDifficulties: ['diff_easy']
        });
      },

      addXP: (amount) => {
        set((state) => {
          let newXP = state.xp + amount;
          let newLevel = state.level;
          let newCoins = state.coins;
          
          while (newXP >= 100) {
            newXP -= 100;
            newCoins += (newLevel * 2) - 1;
            newLevel += 1;
          }
          return { xp: newXP, level: newLevel, coins: newCoins };
        });
        get().syncToDatabase();
      },

      addToEquation: (item) => {
        const state = get();
        
        // Limite máximo de 9 itens (ex: N op N op N = N op N)
        if (state.equation.length >= 9) return false;
        
        // Determinar o tipo esperado para o próximo slot
        const expectedType = getExpectedTypeForNextSlot(state.equation);
        
        // O sinal "=" é um operador especial — permitir apenas se não existe um ainda
        if (item.value === '=') {
          if (expectedType !== 'operator') {
            set({ lastInsertError: 'Este espaço é para um número!' });
            return false;
          }
          // Já tem "=" na equação?
          const hasEqual = state.equation.some(e => e.type === 'operator' && e.value === '=');
          if (hasEqual) {
            set({ lastInsertError: 'Só pode ter um sinal de igual!' });
            return false;
          }
          // O = precisa ter pelo menos 1 número antes
          if (state.equation.length < 1) {
            set({ lastInsertError: 'Coloque um número antes do igual!' });
            return false;
          }
        }

        // Validação de tipo
        if (item.type !== expectedType) {
          if (expectedType === 'number') {
            set({ lastInsertError: 'Este espaço é para um número!' });
          } else {
            set({ lastInsertError: 'Este espaço é para uma operação!' });
          }
          return false;
        }

        set((s) => ({
          equation: [...s.equation, { ...item, id: crypto.randomUUID() }],
          lastInsertError: null
        }));
        return true;
      },

      removeFromEquation: (id) => set((state) => {
        // Ao remover um item, remover todos os itens a partir dele (para manter a sequência válida)
        const idx = state.equation.findIndex(item => item.id === id);
        if (idx === -1) return state;
        return {
          equation: state.equation.slice(0, idx),
          lastInsertError: null
        };
      }),

      clearEquation: () => set({ equation: [], lastInsertError: null }),

      clearInsertError: () => set({ lastInsertError: null }),

      checkEquation: () => {
        const { equation } = get();
        if (!isReadyToCheck(equation)) return null;
        return validateEquation(equation);
      },

      processCorrectEquation: () => {
        const { equation, equationHistory, xp, level, coins, targetNumber } = get();
        if (!isReadyToCheck(equation)) return { earnedXP: 0, leveledUp: false, earnedCoins: 0, hitTarget: false };
        
        const eqString = equation.map(e => e.value).join('');
        const timesSolved = equationHistory[eqString] || 0;
        
        let earnedXP = 10;
        if (timesSolved === 1) earnedXP = 5;
        else if (timesSolved === 2) earnedXP = 2;
        else if (timesSolved >= 3) earnedXP = 1;

        // Verificar se atingiu o objetivo
        const equalIndex = equation.findIndex(e => e.type === 'operator' && e.value === '=');
        const rightSide = equation.slice(equalIndex + 1);
        const leftSide = equation.slice(0, equalIndex);
        
        // O "resultado" é avaliado de ambos os lados
        const leftVal = evaluateExpression(leftSide);
        const rightVal = evaluateExpression(rightSide);
        const resultValue = rightVal ?? leftVal;
        
        const hitTarget = resultValue === targetNumber;
        if (hitTarget) {
          earnedXP += 5; // Bônus por atingir o objetivo
        }
        
        let newXP = xp + earnedXP;
        let newLevel = level;
        let newCoins = coins;
        let leveledUp = false;
        let earnedCoins = 0;

        if (newXP >= 100) {
          newXP = newXP % 100;
          earnedCoins = (level * 2) - 1;
          newCoins += earnedCoins;
          newLevel += 1;
          leveledUp = true;
        }
        
        set({ 
          xp: newXP, 
          level: newLevel,
          coins: newCoins,
          equationHistory: { ...equationHistory, [eqString]: timesSolved + 1 }
        });
        
        get().syncToDatabase();
        return { earnedXP, leveledUp, earnedCoins, hitTarget };
      },

      generateNewTarget: () => {
        const state = get();
        set({ targetNumber: generateTarget(state.targetNumber) });
      },

      purchaseItem: (id: string) => {
        const state = get();
        const item = shopItems.find(i => i.id === id);
        if (!item) return false;

        // Check if already unlocked
        if (item.category === 'icons' && state.unlockedIcons.includes(id)) return false;
        if (item.category === 'themes' && state.unlockedThemes.includes(id)) return false;
        if (item.category === 'difficulties' && state.unlockedDifficulties.includes(id)) return false;

        if (state.coins >= item.cost) {
          set((s) => {
            const newCoins = s.coins - item.cost;
            if (item.category === 'icons') return { coins: newCoins, unlockedIcons: [...s.unlockedIcons, id] };
            if (item.category === 'themes') return { coins: newCoins, unlockedThemes: [...s.unlockedThemes, id] };
            if (item.category === 'difficulties') return { coins: newCoins, unlockedDifficulties: [...s.unlockedDifficulties, id] };
            return { coins: newCoins };
          });
          get().syncToDatabase();
          return true;
        }
        return false;
      },

      equipItem: (id: string, category: ShopCategory) => {
        set((state) => {
          if (category === 'icons' && state.unlockedIcons.includes(id)) return { activeIcon: id };
          if (category === 'themes' && state.unlockedThemes.includes(id)) return { activeTheme: id };
          if (category === 'difficulties' && state.unlockedDifficulties.includes(id)) return { activeDifficulty: id };
          return {};
        });
        get().syncToDatabase();
      },

      syncToDatabase: () => {
        // Debounce: evita chamadas excessivas
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(async () => {
          const { userId, username, level, xp, coins, activeIcon, activeTheme, activeDifficulty, unlockedIcons, unlockedThemes, unlockedDifficulties } = get();
          if (!userId || !username) return;
          
          try {
            await fetch('/api/updateScore', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, username, level, xp, coins, activeIcon, activeTheme, activeDifficulty, unlockedIcons, unlockedThemes, unlockedDifficulties })
            });
          } catch (error) {
            console.error("API sync error:", error);
          }
        }, SYNC_DEBOUNCE_MS);
      },

      fetchUserData: async () => {
        const { userId } = get();
        if (!userId) return;
        
        try {
          const response = await fetch(`/api/getUser?userId=${userId}`);
          if (response.ok) {
            const data = await response.json();
            set({ 
              level: data.level, 
              xp: data.xp, 
              coins: data.coins,
              activeIcon: data.activeIcon || 'icon_user',
              activeTheme: data.activeTheme || 'theme_wood',
              activeDifficulty: data.activeDifficulty || 'diff_easy',
              unlockedIcons: data.unlockedIcons || ['icon_user'],
              unlockedThemes: data.unlockedThemes || ['theme_wood'],
              unlockedDifficulties: data.unlockedDifficulties || ['diff_easy']
            });
          }
        } catch (error) {
          console.error("API fetch error:", error);
        }
      }
    }),
    {
      name: 'math-game-storage',
      partialize: (state) => ({ 
        userId: state.userId,
        username: state.username, 
        xp: state.xp, 
        level: state.level, 
        coins: state.coins,
        unlockedIcons: state.unlockedIcons,
        activeIcon: state.activeIcon,
        unlockedThemes: state.unlockedThemes,
        activeTheme: state.activeTheme,
        unlockedDifficulties: state.unlockedDifficulties,
        activeDifficulty: state.activeDifficulty,
        targetNumber: state.targetNumber
      }),
    }
  )
);
