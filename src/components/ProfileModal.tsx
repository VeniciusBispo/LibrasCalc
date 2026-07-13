import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, LogOut, Lock, User as UserIcon } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { shopItems } from '@/store/shopItems';
import { AnimatedIcon } from './AnimatedIcon';
import * as LucideIcons from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { userId, username, level, xp, coins, activeIcon, logout } = useGameStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isOpen) return null;

  const activeIconItem = shopItems.find(i => i.id === activeIcon);
  // @ts-ignore
  const UserIconComponent = activeIconItem?.iconName ? LucideIcons[activeIconItem.iconName] : UserIcon;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim()) {
      setMessage({ type: 'error', text: 'Preencha todos os campos.' });
      return;
    }

    setIsChangingPassword(true);
    setMessage(null);

    try {
      const response = await fetch('/api/changePassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Erro ao alterar senha.' });
      } else {
        setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro de conexão com o servidor.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

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
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border-4 border-[#2b5585]/20"
        >
          {/* Header */}
          <div className="bg-[#2b5585] p-6 text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-3">
              <UserIcon size={28} className="text-blue-300" />
              <h2 className="text-2xl font-black drop-shadow-sm">Meu Perfil</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 bg-slate-50 flex flex-col gap-6">
            {/* User Info Section */}
            <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <div className="w-24 h-24 rounded-full bg-slate-100 border-[4px] border-[#2b5585] shadow-md flex items-center justify-center relative overflow-hidden">
                <AnimatedIcon effect={activeIconItem?.effect}>
                  <UserIconComponent size={48} className={activeIconItem?.color || "text-slate-500"} strokeWidth={2} />
                </AnimatedIcon>
              </div>
              <h3 className="text-2xl font-black text-[#1a385c]">{username}</h3>
              <div className="flex gap-4 text-sm font-bold text-slate-500">
                <span>Nível <span className="text-[#3b82f6]">{level}</span></span>
                <span>•</span>
                <span>XP <span className="text-amber-500">{xp}</span></span>
                <span>•</span>
                <span><span className="text-yellow-500">{coins}</span> 🪙</span>
              </div>
            </div>

            {/* Change Password Section */}
            <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2 text-[#2b5585]">
                <Shield size={20} />
                <h4 className="font-black text-lg">Segurança</h4>
              </div>

              {message && (
                <div className={`p-3 rounded-xl font-bold text-sm border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 ml-1">SENHA ATUAL</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#3b82f6] font-medium"
                    placeholder="Sua senha atual"
                    disabled={isChangingPassword}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 ml-1">NOVA SENHA</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#3b82f6] font-medium"
                    placeholder="Crie uma nova senha"
                    disabled={isChangingPassword}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword || !currentPassword.trim() || !newPassword.trim()}
                className="mt-2 w-full bg-[#2b5585] text-white font-bold py-3 rounded-xl hover:bg-[#1a385c] disabled:opacity-50 transition-colors"
              >
                {isChangingPassword ? 'Salvando...' : 'Alterar Senha'}
              </button>
            </form>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full bg-red-50 text-red-600 border-2 border-red-200 font-black py-4 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all mt-2"
            >
              <LogOut size={20} />
              SAIR DA CONTA
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
