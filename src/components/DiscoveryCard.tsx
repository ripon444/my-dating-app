import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  X, 
  Star, 
  MapPin, 
  Globe, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink, 
  Info, 
  Flag, 
  Bookmark, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Flame,
  Volume2,
  UserPlus,
  UserCheck,
  Users
} from 'lucide-react';
import { Profile } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';

interface DiscoveryCardProps {
  profile: Profile;
  onLike: (profile: Profile, isSuperLike?: boolean) => void;
  onPass: (profile: Profile) => void;
  onViewDetails: (profile: Profile) => void;
  onReport: (profile: Profile) => void;
}

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
  profile,
  onLike,
  onPass,
  onViewDetails,
  onReport,
}) => {
  const { t } = useTranslation();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(Boolean(profile.is_following));
  const [followersCount, setFollowersCount] = useState(profile.followers_count ?? 128);
  const [followLoading, setFollowLoading] = useState(false);

  const photos = profile.photos && profile.photos.length > 0
    ? profile.photos
    : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'];

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const isExternal = profile.source_type === 'external';

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (followLoading) return;
    
    setFollowLoading(true);
    const prev = isFollowing;
    const prevCount = followersCount;
    
    // Optimistic UI update
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
      // Keep optimistic or silent fallback
      console.warn('Follow toggle info:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: -20 }}
      transition={{ duration: 0.25 }}
      className="relative w-full max-w-md h-[680px] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col justify-between select-none"
    >
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0 bg-stone-950">
        <img
          src={photos[photoIndex]}
          alt={profile.name}
          className="w-full h-full object-cover cursor-pointer"
          referrerPolicy="no-referrer"
          onClick={() => onViewDetails(profile)}
          title="Click to view full Facebook profile"
        />
        
        {/* Soft Multi-Stop Gradient Overlays for optimal readability */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-black/30 cursor-pointer" 
          onClick={() => onViewDetails(profile)}
        />

        {/* Photo Navigation Touch Areas */}
        <div className="absolute inset-0 flex z-10 pointer-events-none">
          <div className="w-1/3 h-1/2 cursor-pointer pointer-events-auto" onClick={prevPhoto} title="Previous Photo" />
          <div className="w-1/3 h-1/2 cursor-pointer pointer-events-auto" onClick={() => onViewDetails(profile)} title="View Full Profile" />
          <div className="w-1/3 h-1/2 cursor-pointer pointer-events-auto" onClick={nextPhoto} title="Next Photo" />
        </div>
      </div>

      {/* Top Bar: Indicators, Badges & Safety Actions */}
      <div className="relative z-20 p-4 space-y-3">
        {/* Story-style Photo Pagination Indicators */}
        {photos.length > 1 && (
          <div className="flex gap-1.5 w-full">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  idx === photoIndex ? 'bg-white shadow' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Badges Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Native vs External Partner Badge */}
            {isExternal ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-stone-950 text-xs font-bold flex items-center gap-1 shadow-md">
                <ExternalLink className="w-3 h-3" />
                {t('partnerBadge')}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-xs font-bold flex items-center gap-1 shadow-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('memberBadge')}
              </span>
            )}

            {/* Compatibility Score */}
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              {profile.compatibility_score}% {t('compatibility')}
            </span>

            {/* Boost Badge if active */}
            {profile.is_boosted && (
              <span className="px-2 py-0.5 rounded-full bg-purple-600/90 text-white text-[11px] font-bold flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3 text-amber-300" />
                Boosted
              </span>
            )}
          </div>

          {/* Top Quick Actions: Save / Report */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 rounded-full backdrop-blur-md transition ${
                isSaved ? 'bg-rose-500 text-white' : 'bg-black/40 text-stone-200 hover:bg-black/60'
              }`}
              title="Bookmark Profile"
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={() => onReport(profile)}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md text-stone-300 hover:text-rose-400 hover:bg-black/60 transition"
              title="Report Profile"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Profile Details & Content */}
      <div className="relative z-20 p-5 space-y-4">
        
        {/* Name, Age, Verification, Follow Button & Online Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            {/* Clickable Profile Name to open Facebook Profile */}
            <div 
              onClick={() => onViewDetails(profile)}
              className="flex items-center gap-2 cursor-pointer group flex-wrap"
              title="Click to view full Facebook profile"
            >
              <h2 className="text-2xl font-extrabold text-white tracking-tight font-serif group-hover:text-rose-400 transition-colors">
                {profile.name}
              </h2>
              {profile.show_age !== false && (
                <span className="text-2xl font-light text-stone-200">
                  {profile.age}
                </span>
              )}
              {profile.is_verified && (
                <CheckCircle2 className="w-5 h-5 text-sky-400 fill-sky-400/20" title="Verified Profile" />
              )}
            </div>
            
            {/* Follow & Full Details Info Actions */}
            <div className="flex items-center gap-2">
              {/* Prominent Follow / Following Button */}
              <button
                id={`btn-follow-${profile.id}`}
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer active:scale-95 ${
                  isFollowing
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-400/40 shadow-emerald-900/30'
                    : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-900/40'
                }`}
                title={isFollowing ? 'Following - Click to unfollow' : 'Follow this profile'}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </>
                )}
              </button>

              {/* Full Facebook Profile Info Button */}
              <button
                onClick={() => onViewDetails(profile)}
                className="p-2 rounded-full bg-white/10 hover:bg-rose-600 text-white backdrop-blur-md transition-all shadow-md cursor-pointer group"
                title="View Full Facebook-style Profile"
              >
                <Info className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* Followers count & Location & Online status */}
          <div className="flex items-center gap-3 text-xs text-stone-300 flex-wrap">
            {/* Followers count badge */}
            <div 
              onClick={() => onViewDetails(profile)}
              className="flex items-center gap-1 text-rose-300 font-semibold cursor-pointer hover:underline"
            >
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <span>{followersCount} followers</span>
            </div>

            <span className="text-stone-500">•</span>

            <div className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>{profile.city}, {profile.country}</span>
              {profile.approx_distance_km !== undefined && (
                <span className="text-stone-400">({profile.approx_distance_km} km)</span>
              )}
            </div>

            {profile.is_online ? (
              <div className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{t('onlineNow')}</span>
              </div>
            ) : (
              <span className="text-stone-400">{t('activeRecently')}</span>
            )}
          </div>
        </div>

        {/* Bio Snippet (Clickable to view full profile) */}
        <p 
          onClick={() => onViewDetails(profile)}
          className="text-xs sm:text-sm text-stone-200 line-clamp-2 leading-relaxed cursor-pointer hover:text-white transition-colors"
          title="Click to view full profile"
        >
          {profile.bio}
        </p>

        {/* Interests Chips */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {profile.interests.slice(0, 4).map((interest, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-[11px] font-medium text-stone-100 border border-white/10"
              >
                {interest}
              </span>
            ))}
            {profile.interests.length > 4 && (
              <span className="px-2 py-0.5 rounded-lg bg-white/5 text-[10px] text-stone-400">
                +{profile.interests.length - 4}
              </span>
            )}
          </div>
        )}

        {/* External Partner Provider Attribution Notice & Deep Link */}
        {isExternal && (
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2">
            <div className="text-[11px] leading-tight">
              <span className="font-semibold">{profile.provider_name || 'Authorized Partner Feed'}</span>
              <p className="text-[10px] text-amber-300/80 mt-0.5">
                {profile.attribution_requirement || 'Licensed global partner syndication'}
              </p>
            </div>
            {profile.external_profile_url && (
              <a
                href={profile.external_profile_url}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1 hover:bg-amber-400 transition shrink-0"
              >
                <span>{t('viewOnPartner')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Action Buttons Bar (Pass, Super Like, Like) */}
        <div className="flex items-center justify-center gap-4 pt-1">
          {/* Pass Button */}
          <button
            onClick={() => onPass(profile)}
            className="w-14 h-14 rounded-full bg-stone-800/90 hover:bg-stone-700 text-rose-500 border border-rose-500/30 flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
            title={t('pass')}
          >
            <X className="w-7 h-7" />
          </button>

          {/* Super Like Button */}
          <button
            onClick={() => onLike(profile, true)}
            className="w-12 h-12 rounded-full bg-stone-800/90 hover:bg-stone-700 text-sky-400 border border-sky-500/30 flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
            title={t('superLike')}
          >
            <Star className="w-6 h-6 fill-sky-400" />
          </button>

          {/* Like Button */}
          <button
            onClick={() => onLike(profile, false)}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition active:scale-95 cursor-pointer"
            title={t('like')}
          >
            <Heart className="w-8 h-8 fill-white" />
          </button>
        </div>

      </div>
    </motion.div>
  );
};
