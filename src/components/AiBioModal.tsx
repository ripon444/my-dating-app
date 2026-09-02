import React, { useState } from 'react';
import { Sparkles, X, Wand2, Check, RefreshCw, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

interface AiBioModalProps {
  isOpen: boolean;
  onClose: () => void;
  interests: string[];
  profession?: string;
  relationshipGoal?: string;
  onBioGenerated: (bio: string) => void;
}

export const AiBioModal: React.FC<AiBioModalProps> = ({
  isOpen,
  onClose,
  interests,
  profession,
  relationshipGoal,
  onBioGenerated,
}) => {
  const { t } = useTranslation();
  const [style, setStyle] = useState('charismatic');
  const [generatedBio, setGeneratedBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const styles = [
    { id: 'charismatic', label: 'Charismatic & Confident', desc: 'Magnetic, warm, charming' },
    { id: 'witty', label: 'Witty & Playful', desc: 'Fun, lighthearted, clever banter' },
    { id: 'intellectual', label: 'Thoughtful & Grounded', desc: 'Curious, cultured, sincere' },
    { id: 'adventurous', label: 'Adventurous Wanderer', desc: 'Energetic, spontaneous, active' },
    { id: 'romantic', label: 'Poetic & Romantic', desc: 'Heartfelt, gentle, meaningful' },
  ];

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await api.generateBio({
        interests,
        profession,
        style,
        relationshipGoal,
      });
      setGeneratedBio(res.bio);
    } catch (err) {
      console.error('Bio generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedBio) {
      onBioGenerated(generatedBio);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-stone-900 w-full max-w-lg rounded-3xl border border-rose-500/30 shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-serif">{t('aiBioAssistant')}</h2>
              <p className="text-xs text-stone-400">Powered by Gemini 3.7 Flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-5 overflow-y-auto flex-1">
          
          {/* Tone Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Select Tone & Vibe
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {styles.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`p-3 rounded-xl text-left border transition ${
                    style === s.id
                      ? 'bg-rose-500/20 border-rose-500 text-white'
                      : 'bg-stone-800/60 border-stone-700/60 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <div className="font-semibold text-xs text-rose-300">{s.label}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Context Snippet */}
          <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-700/40 text-xs text-stone-300 space-y-1">
            <span className="font-semibold text-stone-200">AI will incorporate:</span>
            <div className="text-[11px] text-stone-400">
              {profession ? `• Profession: ${profession}` : ''}
              {relationshipGoal ? ` • Goal: ${relationshipGoal}` : ''}
              {interests.length > 0 ? ` • Interests: ${interests.slice(0, 4).join(', ')}` : ''}
            </div>
          </div>

          {/* Generated Result Box */}
          {generatedBio ? (
            <div className="space-y-2 animate-in fade-in">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center justify-between">
                <span>Generated Bio</span>
                <span className="text-[10px] text-stone-400 font-normal">Click apply to save</span>
              </label>
              <div className="p-4 rounded-2xl bg-stone-950 border border-rose-500/30 text-stone-100 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {generatedBio}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-stone-500 text-xs">
              Click generate to let AI craft an authentic and captivating bio for you.
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-stone-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-bold border border-stone-700 flex items-center justify-center gap-2 transition"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                <span>Crafting Magnetic Bio...</span>
              </>
            ) : (
              <>
                {generatedBio ? <RefreshCw className="w-4 h-4" /> : <Wand2 className="w-4 h-4 text-rose-400" />}
                <span>{generatedBio ? 'Regenerate' : 'Generate Bio'}</span>
              </>
            )}
          </button>

          {generatedBio && (
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              <span>{t('applyBio')}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
