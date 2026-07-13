import { useState, useEffect } from 'react';
import { EquationBoard } from '@/features/EquationBoard';
import { CardTray } from '@/features/CardTray';
import { useGameStore } from '@/store/gameStore';
import { Sparkles, Play, Hand, Coins, ShoppingCart } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreModal } from '@/components/StoreModal';
import { RankingModal } from '@/components/RankingModal';
import { ProfileModal } from '@/components/ProfileModal';
import { shopItems } from '@/store/shopItems';
import { AnimatedIcon } from '@/components/AnimatedIcon';

function App() {
  const { xp, level, coins, username, login, activeIcon, activeTheme, userId } = useGameStore();
  const [inputValue, setInputValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);

  useEffect(() => {
    // Top 3 Weekly Bonus Logic
    const checkWeeklyBonus = async () => {
      if (!userId) return;

      const lastBonusDate = localStorage.getItem('lastBonusDate');
      const today = new Date().toDateString();
      if (lastBonusDate === today) return;

      try {
        const response = await fetch('/api/getRanking');

        if (!response.ok) return;

        // Se estivermos rodando localmente no Vite (npm run dev) sem o Netlify Dev, 
        // a requisição pode retornar o index.html em vez de JSON.
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn("Aviso: A rota de API não retornou JSON. Ignorando bônus no ambiente local/Netlify erro.");
          return;
        }

        const text = await response.text();
        if (!text) return;
        const data = JSON.parse(text);

        let rank = 0;
        let isTop3 = false;

        const top3 = (data.ranking || []).slice(0, 3);
        top3.forEach((player: any) => {
          rank++;
          if (player.userId === userId) {
            isTop3 = true;
          }
        });

        if (isTop3) {
          setBonusMessage(`Parabéns! Você está no TOP 3 do ranking! Você ganhou um bônus surpresa.`);
          localStorage.setItem('lastBonusDate', today);
        }
      } catch (err) {
        console.error("Erro ao checar bônus:", err);
      }
    };

    checkWeeklyBonus();
  }, [userId]);

  // Fetch updated user data from server (to sync coins and level resets)
  useEffect(() => {
    if (userId) {
      useGameStore.getState().fetchUserData();
    }
  }, [userId]);

  const activeIconItem = shopItems.find(i => i.id === activeIcon);
  // @ts-ignore
  const UserIconComponent = activeIconItem?.iconName ? LucideIcons[activeIconItem.iconName] : LucideIcons.User;

  if (!username) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center font-sans p-6 bg-transparent">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-wood-pattern p-12 rounded-[3rem] shadow-wood-deep w-full max-w-md flex flex-col items-center gap-6 text-center border-t border-l border-white/40 relative"
        >
          <div className="p-5 bg-[#2b5585] text-white rounded-3xl shadow-card-3d border border-[#3c6b9d]">
            <Sparkles size={48} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-[#2b5585] tracking-tight mb-2 drop-shadow-sm">
              {isLoginMode ? 'Bem-vindo de volta!' : 'Criar Nova Conta'}
            </h1>
            <p className="text-[#3c6b9d] font-bold text-sm">
              {isLoginMode ? 'Entre com seu nome e senha para continuar jogando.' : 'Crie sua conta para salvar seu progresso na nuvem.'}
            </p>
          </div>

          <form
            className="w-full flex flex-col gap-4 mt-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (inputValue.trim() && passwordValue.trim()) {
                if (!isLoginMode && passwordValue !== confirmPasswordValue) {
                  setLoginError("As senhas não coincidem.");
                  return;
                }
                setIsLoggingIn(true);
                setLoginError(null);
                const result = await login(inputValue.trim(), passwordValue.trim(), isLoginMode ? 'login' : 'register');
                setIsLoggingIn(false);
                if (result !== true) {
                  setLoginError(result as string);
                }
              }
            }}
          >
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nome de Usuário"
                className="w-full px-6 py-4 rounded-2xl bg-wood-dark-pattern shadow-wood-inset focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all text-xl font-bold text-center text-[#2b5585] placeholder:font-medium placeholder:text-[#5a3b1a]/40"
                autoFocus
                disabled={isLoggingIn}
              />
              <input
                type="password"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                placeholder="Senha"
                className="w-full px-6 py-4 rounded-2xl bg-wood-dark-pattern shadow-wood-inset focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all text-xl font-bold text-center text-[#2b5585] placeholder:font-medium placeholder:text-[#5a3b1a]/40"
                disabled={isLoggingIn}
              />
              {!isLoginMode && (
                <input
                  type="password"
                  value={confirmPasswordValue}
                  onChange={(e) => setConfirmPasswordValue(e.target.value)}
                  placeholder="Confirmar Senha"
                  className="w-full px-6 py-4 rounded-2xl bg-wood-dark-pattern shadow-wood-inset focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all text-xl font-bold text-center text-[#2b5585] placeholder:font-medium placeholder:text-[#5a3b1a]/40"
                  disabled={isLoggingIn}
                />
              )}
            </div>
            
            {loginError && (
              <div className="text-red-500 font-bold bg-red-100 p-3 rounded-xl border border-red-200">
                {loginError}
              </div>
            )}

            <motion.button
              whileHover={isLoggingIn ? {} : { scale: 1.02 }}
              whileTap={isLoggingIn ? {} : { scale: 0.95 }}
              type="submit"
              disabled={!inputValue.trim() || !passwordValue.trim() || (!isLoginMode && !confirmPasswordValue.trim()) || isLoggingIn}
              className="w-full bg-[#d96c2e] text-white font-black text-xl py-5 rounded-2xl shadow-card-3d border border-orange-400 flex items-center justify-center gap-3 hover:bg-[#e87a3c] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
            >
              {isLoggingIn ? 'Conectando...' : (isLoginMode ? 'Entrar' : 'Criar Conta')} {!isLoggingIn && <Play fill="currentColor" size={24} />}
            </motion.button>

            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setLoginError(null);
                setPasswordValue('');
                setConfirmPasswordValue('');
              }}
              className="text-[#2b5585] font-bold text-sm hover:underline mt-2"
              disabled={isLoggingIn}
            >
              {isLoginMode ? 'Não tem uma conta? Crie uma agora!' : 'Já tem uma conta? Faça login!'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // xp is already < 100 based on our new logic, so xpProgress is just xp
  const xpProgress = xp;

  const themeClass = activeTheme.replace('_', '-');

  return (
    <div className={`flex h-screen w-full flex-col font-sans items-center p-2 sm:py-6 sm:px-10 transition-colors duration-1000 ${themeClass}`}>
      <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />
      <RankingModal isOpen={isRankingOpen} onClose={() => setIsRankingOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Top 3 Bonus Toast */}
      <AnimatePresence>
        {bonusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 z-50 bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-black px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-lg border-2 border-yellow-200 flex items-center gap-3 text-sm sm:text-base max-w-[90%] text-center"
          >
            <LucideIcons.Trophy size={20} className="sm:w-6 sm:h-6 shrink-0" />
            {bonusMessage}
            <button onClick={() => setBonusMessage(null)} className="ml-2 sm:ml-4 p-1 bg-black/10 rounded-full hover:bg-black/20 shrink-0"><LucideIcons.X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skeuomorphic Wooden Tablet Container */}
      <div className="w-full max-w-7xl h-full flex flex-col bg-wood-pattern rounded-3xl sm:rounded-[3rem] shadow-wood-deep overflow-hidden border-t-2 border-l-2 border-white/50 relative">

        {/* White Digital Header inside the tablet */}
        <header className="flex w-full justify-between items-center px-3 py-3 sm:px-10 sm:py-6 bg-white/95 backdrop-blur-md shadow-sm z-10 border-b border-slate-200">

          {/* Left: Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-1.5 sm:p-2 bg-[#2b5585] text-white rounded-lg sm:rounded-xl shadow-inner-soft">
              <Sparkles size={16} className="sm:w-6 sm:h-6" strokeWidth={2} />
            </div>
            <h1 className="text-xs sm:text-2xl font-black text-[#1a385c] tracking-tight leading-tight">
              Operações <span className="hidden sm:inline">Matemáticas</span><br className="sm:hidden" />
              <span className="text-[#3b82f6]">em Libras</span>
            </h1>
          </div>

          {/* Center: Hand Icon */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center bg-white border-2 border-slate-100 rounded-full p-1.5 sm:p-3 shadow-md -bottom-4 sm:-bottom-6">
            <Hand size={18} className="sm:w-8 sm:h-8 text-[#7d9ebc]" strokeWidth={2} />
            <Sparkles size={10} className="sm:w-4 sm:h-4 absolute -top-1 -right-1 text-amber-400" />
          </div>

          {/* Right: User, Progress, XP, Coins */}
          <div className="flex items-center gap-2 sm:gap-6">

            <div className="flex flex-col gap-1 w-32 hidden lg:flex">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Nível {level}</span>
                <span>Nível {level + 1}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-blue-500 rounded-full shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)] transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-slate-100/80 rounded-full shadow-inner-soft border border-slate-200/50">
              <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 rounded-full p-0.5 sm:p-1 shadow-sm border border-yellow-200">
                <Coins size={10} className="sm:w-3 sm:h-3 m-[1px] sm:m-[2px]" strokeWidth={3} />
              </div>
              <span className="font-black text-slate-700 text-xs sm:text-lg">{coins}</span>
            </div>

            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100/80 rounded-full shadow-inner-soft border border-slate-200/50">
              <div className="bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900 rounded-full p-1 shadow-sm border border-amber-200">
                <span className="text-[10px] font-black px-1">XP</span>
              </div>
              <span className="font-black text-slate-700 text-lg">{xp}</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 pl-1.5 sm:pl-4 border-l-2 border-slate-200/60">
              <button
                onClick={() => setIsRankingOpen(true)}
                className="bg-indigo-100 text-indigo-600 hover:bg-indigo-200 p-1.5 sm:p-2.5 rounded-full transition-all shadow-inner-soft mr-0 sm:mr-2 flex items-center gap-2 font-bold sm:px-4"
              >
                <LucideIcons.Trophy size={16} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
                <span className="hidden sm:inline text-sm">Ranking</span>
              </button>
              <button
                onClick={() => setIsStoreOpen(true)}
                className="bg-amber-100 text-amber-600 hover:bg-amber-200 p-1.5 sm:p-2.5 rounded-full transition-all shadow-inner-soft mr-0 sm:mr-2"
              >
                <ShoppingCart size={16} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
              </button>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-slate-500 font-medium text-xs leading-none mb-1">Olá,</span>
                <span className="text-[#1a385c] font-black text-lg leading-none">{username}</span>
              </div>
              <div 
                onClick={() => setIsProfileOpen(true)}
                className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-slate-100 border-[2px] sm:border-[3px] border-white shadow-md overflow-hidden flex items-center justify-center cursor-pointer hover:scale-105 hover:shadow-lg transition-all ring-2 ring-transparent hover:ring-blue-400"
              >
                <AnimatedIcon effect={activeIconItem?.effect}>
                  <UserIconComponent size={20} className={`sm:w-7 sm:h-7 ${activeIconItem?.color || 'text-slate-500'}`} strokeWidth={2.5} />
                </AnimatedIcon>
              </div>
            </div>

          </div>
        </header>

        {/* Main Board Area */}
        <main className="flex-1 flex justify-center p-2 sm:p-8 relative overflow-y-auto overflow-x-hidden z-0">
          <div className="w-full max-w-7xl flex flex-col items-center gap-4 sm:gap-6">
            <EquationBoard />
            <CardTray mode="all" />
          </div>
        </main>

      </div>
    </div>
  );
}

export default App;
