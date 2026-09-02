import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  Star, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Languages, 
  Ruler, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Flag, 
  ChevronLeft, 
  ChevronRight,
  Flame,
  MessageCircle,
  Phone,
  Video,
  UserPlus,
  UserCheck,
  Globe
} from 'lucide-react';
import { Profile } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';

interface ProfileViewModalProps {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (profile: Profile, isSuperLike?: boolean) => void;
  onReport?: (profile: Profile) => void;
  onStartChat?: (profile: Profile) => void;
  onStartCall?: (receiverId: string, type: 'voice' | 'video') => void;
  onViewFacebookProfile?: (profile: Profile) => void;
}

export const ProfileViewModal: React.FC<ProfileViewModalProps> = ({
  profile,
  isOpen,
  onClose,
  onLike,
  onReport,
  onStartChat,
  onStartCall,
  onViewFacebookProfile,
}) => {
  const { t } = useTranslation();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(Boolean(profile?.is_following));
  const [followersCount, setFollowersCount] = useState(profile?.followers_count ?? 128);
  const [followLoading, setFollowLoading] = useState(false);

  if (!isOpen || !profile) return null;

  const handleFollowToggle = async () => {
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
      console.warn('Follow error in modal:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const photos = profile.photos && profile.photos.length > 0
    ? profile.photos
    : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'];

  const isExternal = profile.source_type === 'external';

  const nextPhoto = () => setPhotoIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () => setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-stone-900 w-full max-w-xl rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Header with Close */}
        <div className="relative h-96 w-full bg-stone-950 select-none">
          <img
            src={photos[photoIndex]}
            alt={profile.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-black/40" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 backdrop-blur-md transition z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Source Badge */}
          <div className="absolute top-4 left-4 z-20">
            {isExternal ? (
              <span className="px-3 py-1 rounded-full bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                <ExternalLink className="w-3.5 h-3.5" />
                {t('partnerBadge')}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('memberBadge')}
              </span>
            )}
          </div>

          {/* Carousel Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-md transition z-20"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-md transition z-20"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Bottom Indicators */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === photoIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Profile Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Name & Basic Info Header */}
          <div className="space-y-3 border-b border-stone-800 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white font-serif">{profile.name}</h1>
                <span className="text-2xl font-light text-stone-300">{profile.age}</span>
                {profile.is_verified && (
                  <CheckCircle2 className="w-5 h-5 text-sky-400" title="Verified Profile" />
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Follow Button */}
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer active:scale-95 ${
                    isFollowing
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-400/40'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
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

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{profile.compatibility_score}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{profile.city}, {profile.country}</span>
                {profile.approx_distance_km !== undefined && (
                  <span>• {profile.approx_distance_km} km away</span>
                )}
                <span>• {followersCount} followers</span>
              </div>

              {onViewFacebookProfile && (
                <button
                  onClick={() => {
                    onViewFacebookProfile(profile);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-rose-400 hover:text-rose-300 font-semibold text-[11px] border border-stone-700 flex items-center gap-1 transition cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>View Full Facebook Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Partner Notice if External */}
          {isExternal && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">{profile.provider_name || 'Syndicated Partner Network'}</span>
                <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                  Licensed Feed
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                {profile.attribution_requirement || 'This profile is syndicated via an official authorized partner API agreement. To message or interact directly, please visit the partner platform.'}
              </p>
              {profile.external_profile_url && (
                <a
                  href={profile.external_profile_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition mt-1"
                >
                  <span>{t('viewOnPartner')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* About Me / Bio */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">About Me</h3>
            <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap">
              {profile.bio || 'No bio provided.'}
            </p>
          </div>

          {/* Professional & Education Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {profile.profession && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-800/60 border border-stone-700/60">
                <Briefcase className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-stone-400">Work</div>
                  <div className="font-semibold text-stone-200">{profile.profession}</div>
                </div>
              </div>
            )}

            {profile.education && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-800/60 border border-stone-700/60">
                <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-stone-400">Education</div>
                  <div className="font-semibold text-stone-200">{profile.education}</div>
                </div>
              </div>
            )}

            {profile.relationship_goal && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-800/60 border border-stone-700/60">
                <Heart className="w-4 h-4 text-pink-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-stone-400">Looking For</div>
                  <div className="font-semibold text-stone-200">{profile.relationship_goal}</div>
                </div>
              </div>
            )}

            {profile.height && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-800/60 border border-stone-700/60">
                <Ruler className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-stone-400">Height</div>
                  <div className="font-semibold text-stone-200">{profile.height} cm</div>
                </div>
              </div>
            )}
          </div>

          {/* Languages */}
          {profile.languages && profile.languages.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-sky-400" />
                Languages Spoken
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.languages.map((lang, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-stone-800 text-stone-300 text-xs font-medium border border-stone-700">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Interests & Passions</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Report profile link */}
          <div className="pt-4 border-t border-stone-800 flex justify-center">
            <button
              onClick={() => onReport?.(profile)}
              className="text-xs text-stone-500 hover:text-rose-400 flex items-center gap-1.5 transition"
            >
              <Flag className="w-3.5 h-3.5" />
              Report or flag this profile
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-900/90 border-t border-stone-800 flex flex-wrap items-center justify-center gap-3">
          {onStartChat && (
            <button
              onClick={() => {
                onStartChat(profile);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold flex items-center gap-2 transition"
              title="Message Profile"
            >
              <MessageCircle className="w-4 h-4 text-rose-400" />
              Chat
            </button>
          )}

          {!isExternal && onStartCall && (
            <>
              <button
                onClick={() => {
                  onStartCall(profile.user_id || profile.id, 'voice');
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-400 border border-stone-700 transition"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  onStartCall(profile.user_id || profile.id, 'video');
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-400 border border-stone-700 transition"
                title="Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </>
          )}

          {onLike && (
            <>
              <button
                onClick={() => {
                  onLike(profile, true);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-sky-400 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Star className="w-4 h-4 fill-sky-400" />
                Super Like
              </button>

              <button
                onClick={() => {
                  onLike(profile, false);
                  onClose();
                }}
                className="flex-1 min-w-[120px] max-w-xs py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition"
              >
                <Heart className="w-4 h-4 fill-white" />
                Like
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
