import React from 'react';
import { ExternalLink, ShieldCheck, Lock, CheckCircle2, X, Globe, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface PartnerDisclosureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerDisclosureModal: React.FC<PartnerDisclosureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-stone-900 w-full max-w-2xl rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-serif">{t('disclosure')}</h2>
              <p className="text-xs text-amber-300">Partner Syndication & Profile Integrity Architecture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs sm:text-sm text-stone-300 leading-relaxed">
          
          {/* Main Statement */}
          <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/80 space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-rose-500" />
              100% Transparency in Dating
            </h3>
            <p>
              Global Match connects authentic individuals across borders. To expand cross-border international discovery, we partner with reputable, licensed global dating federations via secure, authenticated REST APIs.
            </p>
          </div>

          {/* Core Principles */}
          <div className="space-y-4">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Our Architectural Commitments:</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-1.5">
                <div className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  Native Member Profiles
                </div>
                <p className="text-[11px] text-stone-400">
                  Created directly by registered Global Match members. Native members support real-time text messaging, encrypted voice & video calls, mutual match notifications, and photo verification.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-1.5">
                <div className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-amber-500" />
                  Partner Syndicated Profiles
                </div>
                <p className="text-[11px] text-stone-400">
                  Provided via official authorized API feeds from partner networks. Each profile features an amber badge, attribution notice, and direct deep link to the licensed host provider.
                </p>
              </div>
            </div>
          </div>

          {/* Strict Rules */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-rose-500/20 space-y-2.5">
            <div className="font-bold text-stone-200 text-xs uppercase tracking-wider flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              Strict No-Scraping & Integrity Mandates
            </div>
            <ul className="space-y-1.5 text-xs text-stone-300 list-disc list-inside">
              <li>We <strong>never scrape</strong> web pages or bypass authentication headers.</li>
              <li>We <strong>never pretend</strong> external partner members are native platform users.</li>
              <li>Provider API keys and credentials are strictly stored in secure server-side vaults.</li>
              <li>Real-time in-app calling is restricted to native users to prevent fraudulent signaling.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-950 border-t border-stone-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};
