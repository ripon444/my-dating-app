import React, { useState } from 'react';
import { Zap, Flame, Clock, Sparkles, X, Check, Loader2 } from 'lucide-react';
import { Profile } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onBoostApplied: (updatedProfile: Profile) => void;
}

export const BoostModal: React.FC<BoostModalProps> = ({
  isOpen,
  onClose,
  profile,
  onBoostApplied,
}) => {
  const { t } = useTranslation();
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const boostOptions = [
    { duration: 30, label: '30 Minutes', multiplier: '10x', price: '$4.99', desc: 'Ideal for prime evening browsing peak' },
    { duration: 60, label: '1 Hour', multiplier: '15x', price: '$7.99', popular: true, desc: 'Maximum engagement for active weekend dates' },
    { duration: 1440, label: '24 Hours Mega Boost', multiplier: '25x', price: '$14.99', desc: 'All-day top spotlight across all global feeds' },
  ];

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      const res = await api.purchaseBoost(selectedDuration);
      onBoostApplied(res.profile);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Boost error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-stone-900 w-full max-w-md rounded-3xl border border-amber-500/30 shadow-2xl p-6 relative overflow-hidden flex flex-col text-center">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Glow & Flame Icon */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center shadow-xl shadow-amber-500/30 mb-4 animate-bounce">
          <Zap className="w-8 h-8 text-stone-950 fill-stone-950" />
        </div>

        <h2 className="text-2xl font-bold text-white font-serif tracking-tight">
          {t('boostProfile')}
        </h2>
        <p className="text-xs text-stone-300 max-w-xs mx-auto mt-1 mb-6">
          Skip the line and get up to 25x more profile views in your area right now!
        </p>

        {success ? (
          <div className="p-6 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 text-emerald-300 space-y-2">
            <Check className="w-8 h-8 mx-auto text-emerald-400" />
            <h3 className="font-bold text-base">Boost Activated!</h3>
            <p className="text-xs">Your profile is now at the top of the discovery deck.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6 text-left">
            {boostOptions.map((opt) => (
              <button
                key={opt.duration}
                type="button"
                onClick={() => setSelectedDuration(opt.duration)}
                className={`w-full p-4 rounded-2xl border transition flex items-center justify-between ${
                  selectedDuration === opt.duration
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-stone-800/60 border-stone-700/60 text-stone-300 hover:bg-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-100">{opt.label}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                      {opt.multiplier} Views
                    </span>
                    {opt.popular && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold uppercase">
                        Best Value
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">{opt.desc}</p>
                </div>
                <div className="text-base font-extrabold text-amber-400">{opt.price}</div>
              </button>
            ))}
          </div>
        )}

        {!success && (
          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:opacity-95 text-stone-950 font-bold text-sm shadow-xl shadow-amber-900/30 flex items-center justify-center gap-2 transition active:scale-95"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Flame className="w-5 h-5 fill-stone-950" />
                <span>Activate Profile Boost</span>
              </>
            )}
          </button>
        )}

      </div>
    </div>
  );
};
