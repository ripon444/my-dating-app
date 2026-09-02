import React, { useState } from 'react';
import { 
  Crown, 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  Globe, 
  Languages, 
  ShieldCheck, 
  Video, 
  Flame,
  Loader2,
  Lock
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSubscriptionUpdated: (updatedUser: User) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  user,
  onSubscriptionUpdated,
}) => {
  const { t } = useTranslation();
  const [selectedTier, setSelectedTier] = useState<'PREMIUM' | 'VIP'>('VIP');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async (tier: 'PREMIUM' | 'VIP') => {
    setIsProcessing(true);
    try {
      const res = await api.checkoutSubscription(tier);
      onSubscriptionUpdated(res.user);
      setSuccessMessage(`Welcome to ${tier}! All premium dating features are now unlocked.`);
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const tiers = [
    {
      id: 'FREE' as const,
      name: 'Free Member',
      price: '$0',
      period: 'forever',
      badge: 'Standard',
      features: [
        '50 Daily Likes',
        'Standard Local Discovery',
        'Text Messaging with Matches',
        '1 Free AI Bio generation',
      ],
      current: user?.subscriptionTier === 'FREE',
    },
    {
      id: 'PREMIUM' as const,
      name: 'Premium Pass',
      price: '$19.99',
      period: 'per month',
      badge: 'Popular',
      features: [
        'Unlimited Likes & Rewinds',
        'Global Passport (Browse any country)',
        'Unlimited Gemini AI Real-time Message Translations',
        'See Who Liked You before matching',
        '1 Free Profile Boost every month',
        'High-Definition Audio & Video Calling',
      ],
      current: user?.subscriptionTier === 'PREMIUM',
    },
    {
      id: 'VIP' as const,
      name: 'VIP Elite Club',
      price: '$39.99',
      period: 'per month',
      badge: 'All-Inclusive',
      features: [
        'Everything in Premium Pass',
        'Top-of-Stack Priority Matchmaking Placement',
        '5 Free Weekly Super Likes',
        '5 Free Profile Boosts per month',
        'Exclusive VIP Gold Profile Badge',
        'AI Match Assistant & Compatibility Deep Dives',
        'Priority 24/7 Concierge & Trust Verification',
      ],
      current: user?.subscriptionTier === 'VIP',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-stone-900 w-full max-w-4xl rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-lg">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-serif">{t('upgradePlan')}</h2>
              <p className="text-xs text-stone-400">Unlock borderless global dating & AI-powered connections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-4 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-sm font-semibold text-center flex items-center justify-center gap-2">
            <Check className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-5">
          {tiers.map((tier) => {
            const isVip = tier.id === 'VIP';
            const isPremium = tier.id === 'PREMIUM';
            const isCurrent = tier.current;

            return (
              <div
                key={tier.id}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all ${
                  isVip
                    ? 'bg-gradient-to-b from-amber-950/40 via-stone-900 to-stone-900 border-2 border-amber-500/50 shadow-2xl'
                    : isPremium
                    ? 'bg-stone-900 border-2 border-purple-500/40 shadow-xl'
                    : 'bg-stone-900/60 border border-stone-800'
                }`}
              >
                {/* Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isVip
                        ? 'bg-amber-500 text-stone-950'
                        : isPremium
                        ? 'bg-purple-600 text-white'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {tier.badge}
                  </span>
                  {isCurrent && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Current Plan
                    </span>
                  )}
                </div>

                {/* Plan Name & Price */}
                <div className="space-y-1 mb-6">
                  <h3 className="text-xl font-bold text-white font-serif">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">{tier.price}</span>
                    <span className="text-xs text-stone-400">/{tier.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-stone-300">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isVip ? 'text-amber-400' : isPremium ? 'text-purple-400' : 'text-stone-500'
                        }`}
                      />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Checkout CTA */}
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-2xl bg-stone-800 text-stone-500 text-xs font-bold cursor-default"
                  >
                    Active Plan
                  </button>
                ) : tier.id === 'FREE' ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-2xl bg-stone-800/50 text-stone-500 text-xs font-bold"
                  >
                    Included
                  </button>
                ) : (
                  <button
                    onClick={() => handleCheckout(tier.id)}
                    disabled={isProcessing}
                    className={`w-full py-3.5 rounded-2xl text-xs font-bold shadow-lg transition flex items-center justify-center gap-2 active:scale-95 ${
                      isVip
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-900/30'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30'
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Upgrade to {tier.name}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Security & Stripe Guarantee Footer */}
        <div className="px-6 py-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>256-Bit SSL Encrypted & Stripe Secured Checkout</span>
          </div>
          <div>Cancel anytime with 1-click in account settings.</div>
        </div>

      </div>
    </div>
  );
};
