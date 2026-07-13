export type ShopCategory = 'icons' | 'themes' | 'difficulties';
export type IconEffect = 'none' | 'float' | 'bounce' | 'pulse' | 'spin' | 'shake';

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  cost: number;
  iconName?: string;
  description?: string;
  color?: string;
  effect?: IconEffect;
}

export const shopItems: ShopItem[] = [
  // --- Icons ---
  { id: 'icon_user', name: 'Aprendiz', category: 'icons', cost: 0, iconName: 'User', description: 'Ícone padrão', color: 'text-slate-500', effect: 'none' },
  { id: 'icon_cat', name: 'Gato', category: 'icons', cost: 2, iconName: 'Cat', description: 'Miau!', color: 'text-orange-500', effect: 'bounce' },
  { id: 'icon_dog', name: 'Cachorro', category: 'icons', cost: 2, iconName: 'Dog', description: 'Au au!', color: 'text-amber-700', effect: 'bounce' },
  { id: 'icon_ghost', name: 'Fantasma', category: 'icons', cost: 5, iconName: 'Ghost', description: 'Buuu!', color: 'text-indigo-400', effect: 'float' },
  { id: 'icon_rocket', name: 'Foguete', category: 'icons', cost: 8, iconName: 'Rocket', description: 'Para o alto e avante!', color: 'text-red-500', effect: 'shake' },
  { id: 'icon_star', name: 'Estrela', category: 'icons', cost: 10, iconName: 'Star', description: 'Brilhante!', color: 'text-yellow-400', effect: 'spin' },
  { id: 'icon_heart', name: 'Coração', category: 'icons', cost: 10, iconName: 'Heart', description: 'Feito com amor', color: 'text-pink-500', effect: 'pulse' },
  { id: 'icon_crown', name: 'Coroa', category: 'icons', cost: 15, iconName: 'Crown', description: 'Realeza matemática', color: 'text-yellow-500', effect: 'float' },

  // --- Themes ---
  { id: 'theme_wood', name: 'Madeira (Padrão)', category: 'themes', cost: 0, description: 'Visual clássico de madeira' },
  { id: 'theme_ocean', name: 'Oceano Profundo', category: 'themes', cost: 10, description: 'Azul relaxante do fundo do mar' },
  { id: 'theme_space', name: 'Espaço Sideral', category: 'themes', cost: 20, iconName: 'Box', description: 'Tema escuro estrelado' },
  { id: 'theme_candy', name: 'Mundo Doce', category: 'themes', cost: 50, iconName: 'Lollipop', description: 'Rosa pastel com poás brancos' },
  { id: 'theme_jungle', name: 'Floresta Densa', category: 'themes', cost: 150, iconName: 'TreePine', description: 'Verde rústico e folhagens escurecidas' },
  { id: 'theme_cyberpunk', name: 'Cyberpunk', category: 'themes', cost: 300, iconName: 'Cpu', description: 'Neon roxo e matrizes de dados' },

  // --- Difficulties ---
  { id: 'diff_easy', name: 'Fácil (1 a 10)', category: 'difficulties', cost: 0, description: 'Números até 10' },
  { id: 'diff_medium', name: 'Médio (1 a 20)', category: 'difficulties', cost: 15, description: 'Números até 20' },
  { id: 'diff_hard', name: 'Difícil (1 a 50)', category: 'difficulties', cost: 30, description: 'Números até 50' },
];
