import React, { useState } from 'react';
import { ShieldAlert, X, Check, Loader2, Flag } from 'lucide-react';
import { Profile } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile: Profile | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetProfile,
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState('Scam / Commercial Solicitation');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !targetProfile) return null;

  const categories = [
    'Scam / Commercial Solicitation',
    'Inappropriate / Explicit Photos',
    'Harassment or Abusive Behavior',
    'Underage Account Suspected (Under 18)',
    'Fake Profile / Impersonation',
    'Spam or Promotional Links',
    'Hate Speech or Discrimination',
    'Other Safety Concern',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.submitReport({
        reported_user_id: targetProfile.user_id || targetProfile.id,
        reported_user_name: targetProfile.name,
        category,
        reason,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Report submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-stone-900 w-full max-w-lg rounded-3xl border border-stone-800 shadow-2xl p-6 relative overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-serif">{t('report')} Profile</h2>
              <p className="text-xs text-stone-400">Reporting {targetProfile.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Report Submitted</h3>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              Thank you for keeping Global Match safe. Our 24/7 trust and safety moderation team is reviewing this profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-300 block">Select Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-100 focus:outline-none focus:border-rose-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-stone-300 block">Additional Details & Context</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe what occurred or paste relevant messages..."
                required
                className="w-full bg-stone-800 border border-stone-700 rounded-xl p-3 text-stone-100 text-xs focus:outline-none focus:border-rose-500 leading-relaxed"
              />
            </div>

            <div className="p-3 bg-stone-800/40 border border-stone-700/40 rounded-xl text-[11px] text-stone-400 leading-relaxed">
              Reports are 100% anonymous. The reported user will not know who submitted the report.
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-stone-400 hover:text-white transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold transition shadow-lg shadow-rose-900/30 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
