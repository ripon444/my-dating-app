import React, { useState } from 'react';
import { 
  Heart, 
  X, 
  Star, 
  MapPin, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Info,
  Flame,
  UserPlus,
  UserCheck,
  Users
} from 'lucide-react';
import { Profile } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';

interface DiscoveryGridProps {
  profiles: Profile[];
  onLike: (profile: Profile, isSuperLike?: boolean) => void;
  onPass: (profile: Profile) => void;
  onViewDetails: (profile: Profile) => void;
  onResetFilters?: () => void;
}

const GridCardItem: React.FC<{
  profile: Profile;
  onLike: (profile: Profile, isSuperLike?: boolean) => void;
  onPass: (profile: Profile) => void;
  onViewDetails: (profile: Profile) => void;
}> = ({ profile, onLike, onPass, onViewDetails }) => {
  const { t } = useTranslation();
  const [isFollowing, setIsFollowing] = useState(Boolean(profile.is_following));
  const [followersCount, setFollowersCount] = useState(profile.followers_count ?? 128);
  const [followLoading, setFollowLoading] = useState(false);

  const isExternal = profile.source_type === 'external';
  const photo = profile.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80';

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (followLoading) return;

    setFollowLoading(true);
    const prev = isFollowing;
    const prevCount = followersCount;

    setIsFollowing(!prev);
    setFollowersCount(prev ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      if (profile.user_id) {
        if (prev) {
          const res = await api.unfollowUser(profile.user_id);
          setFollowersCount(res.followersCount);
          setIsFollowing(false);
        } else {
          const res = await api.followUser(profile.user_id);
          setFollowersCount(res.followersCount);
          setIsFollowing(true);
        }
      }
    } catch (err) {
      console.warn('Follow error in grid:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="group relative bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 shadow-xl hover:border-stone-700 transition flex flex-col justify-between select-none">
      {/* Card Photo & Top Badges */}
      <div 
        className="relative h-80 w-full overflow-hidden bg-stone-950 cursor-pointer"
        onClick={() => onViewDetails(profile)}
        title="Click to view full Facebook profile"
      >
        <img
          src={photo}
          alt={profile.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />

        {/* Source & Compatibility Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          {isExternal ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 text-[10px] font-bold flex items-center gap-1 shadow">
              <ExternalLink className="w-3 h-3" />
              {t('partnerBadge')}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold flex items-center gap-1 shadow">
              <ShieldCheck className="w-3 h-3" />
              {t('memberBadge')}
            </span>
          )}

          {profile.is_boosted && (
            <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-bold flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-300" />
              Boosted
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {profile.compatibility_score}%
          </span>
        </div>

        {/* Bottom Photo Overlay Info */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div onClick={(e) => { e.stopPropagation(); onViewDetails(profile); }} className="cursor-pointer">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xl font-bold text-white font-serif hover:text-rose-400 transition-colors">{profile.name}</h3>
              <span className="text-lg font-light text-stone-300">{profile.age}</span>
              {profile.is_verified && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-stone-300">
              <MapPin className="w-3 h-3 text-rose-400" />
              <span>{profile.city}, {profile.country}</span>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(profile); }}
            className="p-2 rounded-xl bg-white/20 hover:bg-rose-600 text-white backdrop-blur-md transition cursor-pointer"
            title="View Full Facebook Profile"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        {/* Followers & Follow Button Bar */}
        <div className="flex items-center justify-between gap-2">
          <div 
            onClick={() => onViewDetails(profile)}
            className="flex items-center gap-1 text-[11px] text-rose-300 font-semibold cursor-pointer hover:underline"
          >
            <Users className="w-3 h-3 text-rose-400" />
            <span>{followersCount} followers</span>
          </div>

          <button
            onClick={handleFollowToggle}
            disabled={followLoading}
            className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition shadow-md cursor-pointer active:scale-95 ${
              isFollowing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-400/30'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {isFollowing ? (
              <>
                <UserCheck className="w-3 h-3 text-emerald-200" />
                <span>Following</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3" />
                <span>Follow</span>
              </>
            )}
          </button>
        </div>

        <p 
          onClick={() => onViewDetails(profile)}
          className="text-xs text-stone-300 line-clamp-2 leading-relaxed cursor-pointer hover:text-white"
        >
          {profile.bio}
        </p>

        {/* Interests */}
        {profile.interests && (
          <div className="flex items-center gap-1 flex-wrap">
            {profile.interests.slice(0, 3).map((int, i) => (
              <span key={i} className="px-2 py-0.5 bg-stone-800 text-[10px] text-stone-300 rounded-md">
                {int}
              </span>
            ))}
          </div>
        )}

        {/* Partner Attribution if External */}
        {isExternal && (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 flex items-center justify-between">
            <span className="truncate">{profile.provider_name || 'Partner Feed'}</span>
            {profile.external_profile_url && (
              <a
                href={profile.external_profile_url}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 font-bold hover:underline flex items-center gap-1 ml-2 shrink-0"
              >
                {t('viewOnPartner')} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-center gap-3 pt-2 border-t border-stone-800">
          <button
            onClick={() => onPass(profile)}
            className="w-10 h-10 rounded-full bg-stone-800 hover:bg-stone-700 text-rose-500 flex items-center justify-center transition cursor-pointer"
            title={t('pass')}
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={() => onLike(profile, true)}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-sky-400 flex items-center justify-center transition cursor-pointer"
            title={t('superLike')}
          >
            <Star className="w-4 h-4 fill-sky-400" />
          </button>
          <button
            onClick={() => onLike(profile, false)}
            className="w-11 h-11 rounded-full bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white flex items-center justify-center shadow-lg shadow-rose-900/40 transition cursor-pointer"
            title={t('like')}
          >
            <Heart className="w-5 h-5 fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const DiscoveryGrid: React.FC<DiscoveryGridProps> = ({
  profiles,
  onLike,
  onPass,
  onViewDetails,
  onResetFilters,
}) => {
  const { t } = useTranslation();

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-stone-900/50 rounded-3xl border border-stone-800 space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-stone-200">No profiles found</h3>
        <p className="text-xs text-stone-400 max-w-sm mx-auto">
          No profiles matched your current search or filters. Click below to show all available global matches.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition cursor-pointer"
          >
            Show All Worldwide Profiles
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {profiles.map((profile) => (
        <GridCardItem
          key={profile.id}
          profile={profile}
          onLike={onLike}
          onPass={onPass}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};
