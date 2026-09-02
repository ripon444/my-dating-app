import React, { useState } from 'react';
import { 
  X, 
  SlidersHorizontal, 
  ShieldCheck, 
  ExternalLink, 
  RotateCcw,
  Check,
  Globe,
  Heart,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { DiscoveryFilters, Gender } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { WORLD_COUNTRIES, getStatesForCountry, getCitiesForState } from '../data/worldLocations';

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DiscoveryFilters;
  onApplyFilters: (newFilters: DiscoveryFilters) => void;
}

export const FiltersModal: React.FC<FiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
}) => {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState<DiscoveryFilters>(filters);

  if (!isOpen) return null;

  const handleReset = () => {
    const defaultFilters: DiscoveryFilters = {
      minAge: 18,
      maxAge: 55,
      gender: 'ALL',
      country: '',
      city: '',
      maxDistance: 100,
      languages: [],
      interests: [],
      relationshipGoal: '',
      onlineOnly: false,
      profileSource: 'ALL',
    };
    setLocalFilters(defaultFilters);
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const popularCountries = ['United States', 'Bangladesh', 'Spain', 'Japan', 'France', 'United Kingdom', 'Germany', 'Brazil'];
  const popularInterests = ['Travel', 'Music', 'Photography', 'Art', 'Tech & AI', 'Culinary Arts', 'Fitness', 'Cinema', 'Hiking'];

  const toggleInterest = (interest: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-stone-900 w-full max-w-lg rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold text-white font-serif">{t('filters')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* Profile Source Filter (Core Requirement: All / Member / Partner) */}
          <div className="space-y-2">
            <label className="font-semibold text-stone-200 block uppercase tracking-wider text-[11px] text-stone-400">
              {t('profileSource')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLocalFilters({ ...localFilters, profileSource: 'ALL' })}
                className={`py-2 px-3 rounded-xl font-semibold text-xs transition border flex items-center justify-center gap-1.5 ${
                  localFilters.profileSource === 'ALL'
                    ? 'bg-rose-600 text-white border-rose-500 shadow'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{t('sourceAll')}</span>
              </button>

              <button
                type="button"
                onClick={() => setLocalFilters({ ...localFilters, profileSource: 'NATIVE' })}
                className={`py-2 px-3 rounded-xl font-semibold text-xs transition border flex items-center justify-center gap-1.5 ${
                  localFilters.profileSource === 'NATIVE'
                    ? 'bg-rose-600 text-white border-rose-500 shadow'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('sourceNative')}</span>
              </button>

              <button
                type="button"
                onClick={() => setLocalFilters({ ...localFilters, profileSource: 'PARTNER' })}
                className={`py-2 px-3 rounded-xl font-semibold text-xs transition border flex items-center justify-center gap-1.5 ${
                  localFilters.profileSource === 'PARTNER'
                    ? 'bg-amber-500 text-stone-950 font-bold border-amber-400 shadow'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t('sourcePartner')}</span>
              </button>
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-stone-200 uppercase tracking-wider text-[11px] text-stone-400">
                {t('ageRange')}
              </label>
              <span className="text-rose-400 font-bold">
                {localFilters.minAge} - {localFilters.maxAge} years
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-stone-400">Min Age (18+)</span>
                <input
                  type="range"
                  min="18"
                  max="65"
                  value={localFilters.minAge}
                  onChange={(e) => setLocalFilters({ ...localFilters, minAge: Number(e.target.value) })}
                  className="w-full accent-rose-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-stone-400">Max Age</span>
                <input
                  type="range"
                  min={localFilters.minAge}
                  max="70"
                  value={localFilters.maxAge}
                  onChange={(e) => setLocalFilters({ ...localFilters, maxAge: Number(e.target.value) })}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Gender Filter */}
          <div className="space-y-2">
            <label className="font-semibold text-stone-200 uppercase tracking-wider text-[11px] text-stone-400">
              {t('gender')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['ALL', 'FEMALE', 'MALE', 'NON_BINARY'] as (Gender | 'ALL')[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, gender: g })}
                  className={`py-2 rounded-xl text-xs font-semibold border transition ${
                    localFilters.gender === g
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  {g === 'ALL' ? t('all') : g === 'FEMALE' ? t('female') : g === 'MALE' ? t('male') : t('nonBinary')}
                </button>
              ))}
            </div>
          </div>

          {/* Worldwide Country Selection */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-200 uppercase tracking-wider text-[11px] text-stone-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-rose-500" />
                {t('country')}
              </label>
              <div className="relative">
                <select
                  value={localFilters.country}
                  onChange={(e) => setLocalFilters({ ...localFilters, country: e.target.value, city: '' })}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-rose-500 appearance-none cursor-pointer pr-8 text-xs sm:text-sm"
                >
                  <option value="">🌍 All Countries (Global Matches)</option>
                  {WORLD_COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* City or Region filter when country selected */}
            {localFilters.country && (
              <div className="space-y-2 animate-in fade-in">
                <label className="font-semibold text-stone-200 uppercase tracking-wider text-[11px] text-stone-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  City / State (Optional)
                </label>
                
                {/* Pre-populated cities dropdown if available */}
                {getStatesForCountry(localFilters.country).length > 0 && (
                  <div className="relative">
                    <select
                      value={localFilters.city || ''}
                      onChange={(e) => setLocalFilters({ ...localFilters, city: e.target.value })}
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-rose-500 appearance-none cursor-pointer pr-8 text-xs sm:text-sm"
                    >
                      <option value="">-- All Cities in {localFilters.country} --</option>
                      {getStatesForCountry(localFilters.country).flatMap(stateName => 
                        getCitiesForState(localFilters.country, stateName).map(cityName => (
                          <option key={`${stateName}-${cityName}`} value={cityName}>
                            {cityName} ({stateName})
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}

                <input
                  type="text"
                  value={localFilters.city || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, city: e.target.value })}
                  placeholder="Or type custom city (e.g. Gazipur, Dhaka, Tongi...)"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-rose-500 text-xs sm:text-sm placeholder-stone-500"
                />
              </div>
            )}
          </div>

          {/* Online Only Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-800/60 border border-stone-700">
            <div>
              <div className="font-semibold text-stone-200 text-xs">{t('onlineNow')}</div>
              <div className="text-[10px] text-stone-400">Show only currently active users</div>
            </div>
            <input
              type="checkbox"
              checked={localFilters.onlineOnly}
              onChange={(e) => setLocalFilters({ ...localFilters, onlineOnly: e.target.checked })}
              className="w-4 h-4 accent-rose-500 rounded"
            />
          </div>

          {/* Interests Filter */}
          <div className="space-y-2">
            <label className="font-semibold text-stone-200 uppercase tracking-wider text-[11px] text-stone-400">
              {t('interests')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {popularInterests.map((interest) => {
                const isSelected = localFilters.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                      isSelected
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-900/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition text-xs font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('resetFilters')}</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{t('applyFilters')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
