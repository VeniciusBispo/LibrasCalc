import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, AlertCircle, Medal } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { shopItems } from '@/store/shopItems';
import { AnimatedIcon } from './AnimatedIcon';
import * as LucideIcons from 'lucide-react';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Player {
  userId: string;
  username: string;
  level: number;
  activeIcon: string;
}

export const RankingModal: React.FC<RankingModalProps> = ({ isOpen, onClose }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useGameStore();

  useEffect(() => {
    if (isOpen) {
      fetchRanking();
    }
  }, [isOpen]);

  const fetchRanking = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/getRanking');
      let data: any = {};
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (e) {
        console.error("Failed to parse response", e);
      }
      
      if (!response.ok) {
        if (response.status === 502) {
          throw new Error("O servidor demorou muito para responder (Timeout 502). O MongoDB bloqueou a conexão ou demorou mais de 10 segundos.");
        }
        if (data.error === "MongoDB URI not configured") {
          setError("MongoDB não configurado. Adicione sua URI no Netlify ou no arquivo da função para ver o ranking online.");
          setLoading(false);
          return;
        }
        throw new Error(data.details || data.error || 'Erro de comunicação com o servidor');
      }

      setPlayers(data.ranking || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao carregar o ranking. Verifique sua conexão ou a configuração do MongoDB.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[70vh] border-4 border-indigo-500/20"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-3">
              <Trophy size={32} className="text-yellow-300 drop-shadow-md" />
              <h2 className="text-3xl font-black drop-shadow-sm">Ranking Global</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
            {loading && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                <p className="font-bold">Carregando os melhores do mundo...</p>
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-red-50 rounded-2xl border-2 border-red-200">
                <AlertCircle size={48} className="text-red-400 mb-4" />
                <p className="text-red-700 font-bold mb-2">Ops! Algo deu errado.</p>
                <p className="text-red-500 text-sm max-w-md">{error}</p>
              </div>
            )}

            {!loading && !error && players.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Trophy size={64} className="opacity-20 mb-4" />
                <p className="font-bold">Nenhum jogador encontrado ainda.</p>
                <p className="text-sm">Seja o primeiro a jogar e conquistar o Top 1!</p>
              </div>
            )}

            {!loading && !error && players.length > 0 && (
              <div className="flex flex-col gap-3">
                {players.map((player, index) => {
                  const isMe = player.userId === userId;
                  const shopIcon = shopItems.find(i => i.id === player.activeIcon);
                  // @ts-ignore
                  const IconComp = shopIcon?.iconName ? LucideIcons[shopIcon.iconName] : LucideIcons.User;
                  
                  let bgClass = "bg-white border-slate-200";
                  let rankColor = "text-slate-400";
                  
                  if (index === 0) { bgClass = "bg-yellow-50 border-yellow-300 shadow-yellow-100"; rankColor = "text-yellow-500"; }
                  else if (index === 1) { bgClass = "bg-slate-50 border-slate-300 shadow-slate-200"; rankColor = "text-slate-500"; }
                  else if (index === 2) { bgClass = "bg-orange-50 border-orange-300 shadow-orange-100"; rankColor = "text-orange-600"; }
                  else if (isMe) { bgClass = "bg-indigo-50 border-indigo-300 shadow-indigo-100"; }

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key={player.userId} 
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 shadow-sm transition-all hover:scale-[1.01] ${bgClass} ${isMe ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                    >
                      {/* Rank Position */}
                      <div className={`font-black text-2xl w-10 text-center ${rankColor}`}>
                        {index < 3 ? <Medal size={32} className="mx-auto drop-shadow-sm" /> : `#${index + 1}`}
                      </div>
                      
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center">
                        <AnimatedIcon effect={shopIcon?.effect}>
                          <IconComp size={24} className={shopIcon?.color || "text-slate-500"} strokeWidth={2.5} />
                        </AnimatedIcon>
                      </div>

                      {/* Name & Stats */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-lg leading-none ${isMe ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {player.username}
                          </span>
                          {isMe && (
                            <span className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Você</span>
                          )}
                        </div>
                        <div className="flex gap-4 mt-1">
                          <span className="text-slate-500 text-sm font-bold flex items-center gap-1">
                            Lvl <span className="text-indigo-600">{player.level}</span>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
