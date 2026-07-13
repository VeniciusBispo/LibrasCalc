import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ShopCategory } from './shopItems';
import { shopItems } from './shopItems';

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

  equationHistory: Record<string, number>;
  equation: EquationItem[];
  login: (username: string, password: string) => Promise<boolean | string>;
  logout: () => void;
  addXP: (amount: number) => void;
  addToEquation: (item: Omit<EquationItem, 'id'>) => void;
  removeFromEquation: (id: string) => void;
  clearEquation: () => void;
  checkEquation: () => boolean | null;
  processCorrectEquation: () => { earnedXP: number, leveledUp: boolean, earnedCoins: number };
  
  // Store Methods
  purchaseItem: (id: string) => boolean;
  equipItem: (id: string, category: ShopCategory) => void;
  
  // Database sync
  syncToDatabase: () => void;
  fetchUserData: () => Promise<void>;
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

      equationHistory: {},
      equation: [],
      login: async (username, password) => {
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
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
            activeIcon: data.activeIcon || 'icon_user'
          });
          get().syncToDatabase();
          return true;
        } catch (e) {
          console.error('Login error', e);
          return 'Erro ao tentar conectar';
        }
      },
      logout: () => {
        set({ userId: null, username: '', xp: 0, level: 1, coins: 0, equationHistory: {} });
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
      addToEquation: (item) => set((state) => {
        if (state.equation.length >= 4) return state; // Limit slots to 4
        return {
          equation: [...state.equation, { ...item, id: crypto.randomUUID() }]
        };
      }),
      removeFromEquation: (id) => set((state) => ({
        equation: state.equation.filter(item => item.id !== id)
      })),
      clearEquation: () => set({ equation: [] }),
      checkEquation: () => {
        const { equation } = get();
        if (equation.length === 4) {
          const [n1, op, n2, res] = equation;
          if (
            n1.type === 'number' &&
            op.type === 'operator' &&
            n2.type === 'number' &&
            res.type === 'number'
          ) {
            const val1 = Number(n1.value);
            const val2 = Number(n2.value);
            const result = Number(res.value);
            
            let isCorrect = false;
            if (op.value === '+') isCorrect = val1 + val2 === result;
            else if (op.value === '-') isCorrect = val1 - val2 === result;
            else if (op.value === '*') isCorrect = val1 * val2 === result;
            else if (op.value === '/') isCorrect = val2 !== 0 && val1 / val2 === result;
            
            return isCorrect;
          }
        }
        return null;
      },
      processCorrectEquation: () => {
        const { equation, equationHistory, xp, level, coins } = get();
        if (equation.length !== 4) return { earnedXP: 0, leveledUp: false, earnedCoins: 0 };
        const [n1, op, n2, res] = equation;
        const eqString = `${n1.value}${op.value}${n2.value}=${res.value}`;
        
        const timesSolved = equationHistory[eqString] || 0;
        
        let earnedXP = 10;
        if (timesSolved === 1) earnedXP = 5;
        else if (timesSolved === 2) earnedXP = 2;
        else if (timesSolved >= 3) earnedXP = 1;
        
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
        return { earnedXP, leveledUp, earnedCoins };
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

      syncToDatabase: async () => {
        const { userId, username, level, coins, activeIcon } = get();
        if (!userId || !username) return;
        
        try {
          await fetch('/api/updateScore', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, username, level, coins, activeIcon })
          });
        } catch (error) {
          console.error("API sync error:", error);
        }
      },

      fetchUserData: async () => {
        const { userId } = get();
        if (!userId) return;
        
        try {
          const response = await fetch(`/api/getUser?userId=${userId}`);
          if (response.ok) {
            const data = await response.json();
            set({ level: data.level, xp: data.xp, coins: data.coins });
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
        activeDifficulty: state.activeDifficulty
      }),
    }
  )
);
