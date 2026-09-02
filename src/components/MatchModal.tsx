import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, MessageCircle, Flame, X, Sparkles } from 'lucide-react';
import { Profile, User } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: Profile | null;
  matchedProfile: Profile | null;
  onStartChat: (conversationId?: string) => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  matchedProfile,
  onStartChat,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      // Trigger festive match confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#f43f5e', '#ec4899', '#fb7185', '#fbbf24'],
        });
      } catch (err) {}
    }
  }, [isOpen]);

  if (!isOpen || !matchedProfile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-stone-900 w-full max-w-md rounded-3xl border border-rose-500/30 shadow-2xl p-6 text-center relative overflow-hidden">
        
        {/* Ambient background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            {t('itsAMatch')}
          </div>
          <h2 className="text-3xl font-extrabold text-white font-serif tracking-tight">
            Mutual Spark!
          </h2>
          <p className="text-xs text-stone-300">
            {t('matchSubtext', { name: matchedProfile.name })}
          </p>
        </div>

        {/* Two Avatar Circles with Interlocking Heart */}
        <div className="relative flex items-center justify-center gap-4 my-8">
          {/* User Photo */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-rose-500 shadow-xl bg-stone-800">
            <img
              src={currentUserProfile?.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'}
              alt={currentUserProfile?.name || 'You'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Center Heart Icon */}
          <div className="absolute z-10 w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-lg border-2 border-stone-900 animate-bounce">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>

          {/* Matched Profile Photo */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500 shadow-xl bg-stone-800">
            <img
              src={matchedProfile.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80'}
              alt={matchedProfile.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              onStartChat();
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-rose-900/40 transition flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t('sendMessage')}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-stone-800 hover:bg-stone-750 text-stone-300 font-semibold text-xs transition"
          >
            {t('keepSwiping')}
          </button>
        </div>

      </div>
    </div>
  );
};
