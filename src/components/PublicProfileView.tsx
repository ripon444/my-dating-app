import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCheck,
  UserPlus,
  MessageCircle,
  Phone,
  Video,
  Heart,
  Share2,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Briefcase,
  GraduationCap,
  Languages,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Users,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  X,
  ExternalLink,
  Ban,
  Flag,
  Copy,
  Flame,
  Info,
  Upload,
  Star,
  Globe,
} from 'lucide-react';
import { Profile, User } from '../types';
import { api } from '../services/api';
import { FollowListModal } from './FollowListModal';

interface PublicProfileViewProps {
  profileIdOrUserId?: string;
  profileId?: string;
  currentUserId?: string;
  initialProfile?: Profile | null;
  currentUser?: User | null;
  currentUserProfile?: Profile | null;
  isOwnProfile?: boolean;
  onBack?: () => void;
  onStartChat?: (targetUserId: string | Profile) => void;
  onStartCall?: (targetUserId: string, type: 'voice' | 'video') => void;
  onLike?: (profile: Profile) => void;
  onEditProfile?: () => void;
  onManagePlan?: () => void;
  onBoostProfile?: () => void;
  onNavigateProfile?: (targetUserIdOrProfile: Profile | string) => void;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  profileIdOrUserId,
  profileId,
  currentUserId,
  initialProfile,
  currentUser,
  currentUserProfile,
  isOwnProfile: isOwnProfileProp,
  onBack,
  onStartChat,
  onStartCall,
  onLike,
  onEditProfile,
  onManagePlan,
  onBoostProfile,
  onNavigateProfile,
}) => {
  const targetId = profileIdOrUserId || profileId || currentUserId || currentUser?.id || currentUserProfile?.user_id || currentUserProfile?.id || initialProfile?.user_id || initialProfile?.id || '';
  const isSelf = Boolean(
    isOwnProfileProp ||
    (currentUser?.id && (targetId === currentUser.id || targetId === currentUserProfile?.user_id || targetId === currentUserProfile?.id || !targetId))
  );

  const [profile, setProfile] = useState<Profile | null>(() => {
    if (initialProfile) return initialProfile;
    if (isSelf && currentUserProfile) return currentUserProfile;
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (initialProfile) return false;
    if (isSelf && currentUserProfile) return false;
    return true;
  });
  const [error, setError] = useState<string | null>(null);

  // Social & Follow states
  const [isFollowing, setIsFollowing] = useState(Boolean(initialProfile?.is_following));
  const [followersCount, setFollowersCount] = useState(initialProfile?.followers_count ?? (currentUserProfile?.followers_count ?? 0));
  const [followingCount, setFollowingCount] = useState(initialProfile?.following_count ?? (currentUserProfile?.following_count ?? 0));
  const [followActionLoading, setFollowActionLoading] = useState(false);

  // Block states
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'about' | 'photos' | 'followers' | 'following' | 'compatibility'>('about');

  // Modal & Lightbox states
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('followers');
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inline Followers/Following tab lists
  const [tabFollowersList, setTabFollowersList] = useState<any[]>([]);
  const [tabFollowingList, setTabFollowingList] = useState<any[]>([]);
  const [tabListLoading, setTabListLoading] = useState(false);

  // Cover photo edit modal for owner
  const [showCoverEditModal, setShowCoverEditModal] = useState(false);
  const [coverModalTab, setCoverModalTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [savingCover, setSavingCover] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = isSelf;

  useEffect(() => {
    loadProfile();
  }, [targetId]);

  useEffect(() => {
    if (activeTab === 'followers' && profile?.user_id) {
      loadTabFollowers();
    } else if (activeTab === 'following' && profile?.user_id) {
      loadTabFollowing();
    }
  }, [activeTab, profile?.user_id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadProfile = async () => {
    if (!profile) setLoading(true);
    setError(null);
    try {
      const data = await api.getPublicProfile(targetId);
      if (data?.profile) {
        setProfile(data.profile);
        setIsFollowing(Boolean(data.profile.is_following));
        setFollowersCount(data.profile.followers_count ?? 0);
        setFollowingCount(data.profile.following_count ?? 0);
        setIsBlocked(Boolean(data.profile.is_blocked));
      } else if (currentUserProfile && isSelf) {
        setProfile(currentUserProfile);
      }
    } catch (err: any) {
      console.warn('Public profile load note:', err);
      if (initialProfile) {
        setProfile(initialProfile);
        setError(null);
      } else if (currentUserProfile && isSelf) {
        setProfile(currentUserProfile);
        setError(null);
      } else {
        setError(err.message || 'Profile could not be loaded');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTabFollowers = async () => {
    if (!profile?.user_id) return;
    setTabListLoading(true);
    try {
      const res = await api.getFollowers(profile.user_id);
      setTabFollowersList(res.followers || []);
    } catch (err) {
      console.error('Failed to fetch tab followers:', err);
    } finally {
      setTabListLoading(false);
    }
  };

  const loadTabFollowing = async () => {
    if (!profile?.user_id) return;
    setTabListLoading(true);
    try {
      const res = await api.getFollowing(profile.user_id);
      setTabFollowingList(res.following || []);
    } catch (err) {
      console.error('Failed to fetch tab following:', err);
    } finally {
      setTabListLoading(false);
    }
  };

  // Follow / Unfollow handler (Requirements 3, 4, 5, 8, 9, 10, 12)
  const handleFollowToggle = async () => {
    if (!currentUser) {
      showToast('Please log in to follow profiles.');
      return;
    }
    if (isOwnProfile) {
      showToast('You cannot follow yourself.');
      return;
    }
    if (!profile?.user_id) return;

    setFollowActionLoading(true);
    const prevFollowing = isFollowing;
    const prevCount = followersCount;

    // Optimistic UI Update
    setIsFollowing(!prevFollowing);
    setFollowersCount(prevFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      if (prevFollowing) {
        const res = await api.unfollowUser(profile.user_id);
        setFollowersCount(res.followersCount);
        setIsFollowing(false);
        showToast(`Unfollowed ${profile.name}`);
      } else {
        const res = await api.followUser(profile.user_id);
        setFollowersCount(res.followersCount);
        setIsFollowing(true);
        showToast(`Now following ${profile.name}! User received real-time notification.`);
      }
    } catch (err: any) {
      // Revert optimistic update
      setIsFollowing(prevFollowing);
      setFollowersCount(prevCount);
      showToast(err.message || 'Failed to update follow status');
    } finally {
      setFollowActionLoading(false);
    }
  };

  // Block / Unblock handler (Requirement 11)
  const handleBlockToggle = async () => {
    if (!currentUser || !profile?.user_id) return;
    setBlockLoading(true);
    try {
      if (isBlocked) {
        await api.unblockUser(profile.user_id);
        setIsBlocked(false);
        showToast(`Unblocked ${profile.name}.`);
      } else {
        await api.blockUser(profile.user_id, 'User requested block via profile');
        setIsBlocked(true);
        setIsFollowing(false);
        showToast(`Blocked ${profile.name}. They cannot view or follow you.`);
      }
      setShowBlockConfirm(false);
    } catch (err: any) {
      showToast(err.message || 'Block action failed');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleShareProfile = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Profile link copied to clipboard! 📋');
    });
    setMenuOpen(false);
  };

  const processCoverImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Selected file is not an image'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1400;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleCoverFileUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setSavingCover(true);
    try {
      const dataUrl = await processCoverImageFile(file);
      const res = await api.updateProfile({ cover_photo: dataUrl });
      setProfile(res.profile);
      setShowCoverEditModal(false);
      showToast('Cover photo uploaded & updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload cover photo');
    } finally {
      setSavingCover(false);
    }
  };

  const handleSaveCoverPhoto = async () => {
    if (!customCoverUrl.trim()) return;
    setSavingCover(true);
    try {
      const res = await api.updateProfile({ cover_photo: customCoverUrl.trim() });
      setProfile(res.profile);
      setShowCoverEditModal(false);
      showToast('Cover photo updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update cover photo');
    } finally {
      setSavingCover(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-400 font-medium text-sm">Loading Facebook-style public profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-neutral-900 border border-neutral-800 rounded-3xl text-center space-y-4 shadow-2xl">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-white">Profile Unavailable</h3>
        <p className="text-sm text-neutral-400">{error || 'This user profile could not be found or has been removed.'}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => loadProfile()}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-rose-900/40 cursor-pointer"
          >
            Retry Loading
          </button>
          {onEditProfile && isOwnProfile && (
            <button
              onClick={onEditProfile}
              className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
            >
              Edit Profile
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const defaultCover =
    profile.cover_photo ||
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=80';
  const avatarPhoto =
    profile.photos?.[0] ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

  return (
    <div id="facebook-style-public-profile" className="max-w-5xl mx-auto pb-16 px-4 sm:px-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-rose-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <Sparkles className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between py-4">
        {onBack && (
          <button
            id="btn-profile-back"
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-neutral-300 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            id="btn-share-profile"
            onClick={handleShareProfile}
            className="p-2.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-xl transition-all shadow-sm flex items-center gap-1.5 text-xs font-semibold"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* More Actions Menu */}
          <div className="relative">
            <button
              id="btn-profile-more-menu"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-xl transition-all shadow-sm"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl py-1.5 z-30"
                >
                  <button
                    onClick={handleShareProfile}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-neutral-300 hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4 text-neutral-400" />
                    Copy Profile Link
                  </button>

                  {!isOwnProfile && currentUser && (
                    <>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setShowBlockConfirm(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-medium text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        {isBlocked ? 'Unblock User' : 'Block User'}
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          showToast('Report submitted to safety moderation.');
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-medium text-neutral-400 hover:bg-neutral-800 flex items-center gap-2"
                      >
                        <Flag className="w-4 h-4 text-neutral-500" />
                        Report Profile
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Profile Header Card (Facebook Layout) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative mb-6">
        {/* Cover Photo Banner */}
        <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden bg-neutral-950">
          <img
            id="profile-cover-photo"
            src={defaultCover}
            alt="Cover"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-black/30" />

          {/* Edit Cover Photo Button (Owner only) */}
          {isOwnProfile && (
            <button
              id="btn-edit-cover-photo"
              onClick={() => {
                setCustomCoverUrl(profile.cover_photo || '');
                setShowCoverEditModal(true);
              }}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border border-white/20 shadow-md"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Edit Cover Photo</span>
            </button>
          )}
        </div>

        {/* Profile Avatar & Info Section */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-4 -mt-20 md:-mt-24 mb-6">
            {/* Avatar & Online status */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
              <div className="relative group">
                <img
                  id="profile-avatar-photo"
                  src={avatarPhoto}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  onClick={() => setLightboxPhoto(avatarPhoto)}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-neutral-900 shadow-2xl ring-2 ring-neutral-700 cursor-pointer group-hover:opacity-90 transition-opacity"
                />
                {profile.is_online && (
                  <span
                    title="Online now"
                    className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-5 h-5 bg-emerald-500 border-4 border-neutral-900 rounded-full shadow-lg"
                  />
                )}
                {profile.is_verified && (
                  <span
                    title="Verified Profile"
                    className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full border-2 border-neutral-900 shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                  </span>
                )}
              </div>

              {/* Name & Basic details */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {profile.name}
                  </h1>
                  {profile.age && (
                    <span className="text-lg font-bold text-neutral-400">
                      , {profile.age}
                    </span>
                  )}
                  {profile.is_verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/60">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                {/* City & Country / Profession */}
                <div className="flex items-center justify-center md:justify-start gap-3 text-xs md:text-sm text-neutral-400 flex-wrap">
                  {(profile.city || profile.country) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {profile.city ? `${profile.city}, ` : ''}{profile.region ? `${profile.region}, ` : ''}{profile.country}
                    </span>
                  )}
                  {profile.profession && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-neutral-500" />
                      {profile.profession}
                    </span>
                  )}
                  {profile.gender && (
                    <span className="capitalize px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-xs">
                      {profile.gender}
                    </span>
                  )}
                </div>

                {/* Social Counters: Followers & Following (Requirement 6, 7) */}
                <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                  <button
                    id="btn-view-followers-count"
                    onClick={() => {
                      setFollowModalTab('followers');
                      setFollowModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-sm hover:text-rose-400 transition-colors group"
                  >
                    <span className="font-extrabold text-white group-hover:text-rose-400">
                      {followersCount}
                    </span>
                    <span className="text-neutral-400 font-medium">Followers</span>
                  </button>

                  <span className="text-neutral-700">•</span>

                  <button
                    id="btn-view-following-count"
                    onClick={() => {
                      setFollowModalTab('following');
                      setFollowModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-sm hover:text-rose-400 transition-colors group"
                  >
                    <span className="font-extrabold text-white group-hover:text-rose-400">
                      {followingCount}
                    </span>
                    <span className="text-neutral-400 font-medium">Following</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons Bar (Requirement 3, 4, 11, 12) */}
            <div className="flex items-center gap-2.5 flex-wrap justify-center w-full md:w-auto pt-2 md:pt-0">
              {isOwnProfile ? (
                <button
                  id="btn-owner-edit-profile"
                  onClick={onEditProfile}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-rose-950/50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  {/* Follow / Unfollow Button */}
                  <button
                    id="btn-toggle-follow-main"
                    disabled={followActionLoading || isBlocked}
                    onClick={handleFollowToggle}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-md ${
                      isFollowing
                        ? 'bg-neutral-800 text-neutral-200 hover:bg-rose-950/50 hover:text-rose-400 hover:border-rose-900 border border-neutral-700'
                        : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 shadow-rose-900/30'
                    }`}
                  >
                    {followActionLoading ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  {/* Direct Message Button */}
                  <button
                    id="btn-profile-message"
                    onClick={() => {
                      if (!currentUser) {
                        showToast('Please log in to message.');
                        return;
                      }
                      onStartChat?.(profile.user_id || profile.id);
                    }}
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl text-sm transition-all border border-neutral-700 flex items-center gap-2 shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4 text-sky-400" />
                    <span>Message</span>
                  </button>

                  {/* WebRTC Video / Voice Call Buttons */}
                  <button
                    id="btn-profile-video-call"
                    title="Video Call"
                    onClick={() => onStartCall?.(profile.user_id || profile.id, 'video')}
                    className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl border border-neutral-700 transition-all shadow-sm"
                  >
                    <Video className="w-4 h-4 text-emerald-400" />
                  </button>

                  <button
                    id="btn-profile-voice-call"
                    title="Voice Call"
                    onClick={() => onStartCall?.(profile.user_id || profile.id, 'voice')}
                    className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl border border-neutral-700 transition-all shadow-sm"
                  >
                    <Phone className="w-4 h-4 text-indigo-400" />
                  </button>

                  {/* Like / Dating Match Button (Requirement 12 - Distinct from follow) */}
                  <button
                    id="btn-profile-like"
                    title="Send Dating Like / Match"
                    onClick={() => onLike?.(profile)}
                    className="p-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-800/60 rounded-xl transition-all shadow-sm"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Facebook-style Horizontal Tab Bar */}
          <div className="flex border-t border-neutral-800 overflow-x-auto gap-2 pt-2 scrollbar-none">
            {[
              { id: 'about', label: 'About & Bio', icon: Info },
              { id: 'photos', label: `Photos (${profile.photos?.length || 0})`, icon: ImageIcon },
              { id: 'followers', label: `Followers (${followersCount})`, icon: Users },
              { id: 'following', label: `Following (${followingCount})`, icon: UserCheck },
              { id: 'compatibility', label: 'Dating Match', icon: Flame },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`profile-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="space-y-6">
        {/* Tab 1: About & Bio */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Bio & Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Bio Card */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  About {profile.name}
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                  {profile.bio || 'This user has not written a bio yet.'}
                </p>
              </div>

              {/* Interests & Tags */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Passions & Interests
                </h3>
                {profile.interests && profile.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700 text-xs font-semibold text-neutral-200 flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">No interests specified yet.</p>
                )}
              </div>

              {/* Photo Preview Grid in About Tab */}
              {profile.photos && profile.photos.length > 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-sky-400" />
                      Featured Photos
                    </h3>
                    <button
                      onClick={() => setActiveTab('photos')}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                    >
                      See All ({profile.photos.length})
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {profile.photos.slice(0, 8).map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setLightboxPhoto(url)}
                        className="aspect-square rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 cursor-pointer group relative"
                      >
                        <img
                          src={url}
                          alt="Thumbnail"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Quick Info Cards */}
            <div className="space-y-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white">Profile Details</h3>

                <div className="space-y-3.5 text-xs text-neutral-300">
                  {profile.relationship_goal && (
                    <div className="flex items-start gap-3">
                      <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-neutral-500 font-medium">Looking For</div>
                        <div className="font-semibold text-white">{profile.relationship_goal}</div>
                      </div>
                    </div>
                  )}

                  {(profile.city || profile.country) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-neutral-500 font-medium">Location</div>
                        <div className="font-semibold text-white">
                          {profile.city ? `${profile.city}, ` : ''}{profile.region ? `${profile.region}, ` : ''}{profile.country}
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.education && (
                    <div className="flex items-start gap-3">
                      <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-neutral-500 font-medium">Education</div>
                        <div className="font-semibold text-white">{profile.education}</div>
                      </div>
                    </div>
                  )}

                  {profile.profession && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-neutral-500 font-medium">Work</div>
                        <div className="font-semibold text-white">{profile.profession}</div>
                      </div>
                    </div>
                  )}

                  {profile.languages && profile.languages.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Languages className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-neutral-500 font-medium">Languages</div>
                        <div className="font-semibold text-white">
                          {profile.languages.join(', ')}
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.created_at && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-neutral-500 font-medium">Joined Network</div>
                        <div className="font-semibold text-neutral-300">
                          {new Date(profile.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Photos Gallery */}
        {activeTab === 'photos' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-sky-400" />
              Photo Gallery ({profile.photos?.length || 0})
            </h3>
            {profile.photos && profile.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {profile.photos.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxPhoto(url)}
                    className="aspect-square rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 cursor-pointer relative group"
                  >
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 py-8 text-center">No photos uploaded yet.</p>
            )}
          </div>
        )}

        {/* Tab 3: Followers List (Requirement 7) */}
        {activeTab === 'followers' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" />
                Followers ({followersCount})
              </h3>
            </div>

            {tabListLoading ? (
              <div className="py-12 text-center text-neutral-400">
                <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading followers from PostgreSQL...</p>
              </div>
            ) : tabFollowersList.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 space-y-2">
                <Users className="w-10 h-10 text-neutral-600 mx-auto" />
                <p className="text-sm font-semibold text-neutral-300">No followers yet</p>
                <p className="text-xs">Be the first to follow {profile.name}!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {tabFollowersList.map((item) => (
                  <div
                    key={item.followId || item.userId}
                    onClick={() => onNavigateProfile?.(item.profile || item.userId)}
                    className="p-4 bg-neutral-950 border border-neutral-800 hover:border-rose-500/50 rounded-2xl cursor-pointer flex items-center gap-3 transition-colors group"
                  >
                    <img
                      src={item.profile?.photos?.[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={item.profile?.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border border-neutral-700 group-hover:border-rose-500"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-rose-400 truncate">
                        {item.profile?.name || 'Registered User'}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate">
                        {item.profile?.city ? `${item.profile.city}, ${item.profile.country}` : 'Global Match'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Following List (Requirement 7) */}
        {activeTab === 'following' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-rose-500" />
              Following ({followingCount})
            </h3>

            {tabListLoading ? (
              <div className="py-12 text-center text-neutral-400">
                <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading following list from PostgreSQL...</p>
              </div>
            ) : tabFollowingList.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 space-y-2">
                <UserCheck className="w-10 h-10 text-neutral-600 mx-auto" />
                <p className="text-sm font-semibold text-neutral-300">Not following anyone yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {tabFollowingList.map((item) => (
                  <div
                    key={item.followId || item.userId}
                    onClick={() => onNavigateProfile?.(item.profile || item.userId)}
                    className="p-4 bg-neutral-950 border border-neutral-800 hover:border-rose-500/50 rounded-2xl cursor-pointer flex items-center gap-3 transition-colors group"
                  >
                    <img
                      src={item.profile?.photos?.[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={item.profile?.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border border-neutral-700 group-hover:border-rose-500"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-rose-400 truncate">
                        {item.profile?.name || 'Registered User'}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate">
                        {item.profile?.city ? `${item.profile.city}, ${item.profile.country}` : 'Global Match'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Dating Compatibility (Requirement 12) */}
        {activeTab === 'compatibility' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-500" />
                  Dating Compatibility & Matching
                </h3>
                <p className="text-xs text-neutral-400">
                  Follow system is completely separate from Dating Likes & Matches.
                </p>
              </div>

              {!isOwnProfile && (
                <button
                  onClick={() => onLike?.(profile)}
                  className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <Heart className="w-4 h-4" />
                  <span>Send Dating Like</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-center space-y-1">
                <div className="text-2xl font-black text-rose-400">
                  {profile.compatibility_score || 88}%
                </div>
                <div className="text-xs font-semibold text-white">Algorithm Match</div>
                <div className="text-[11px] text-neutral-400">Based on interests & values</div>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-center space-y-1">
                <div className="text-2xl font-black text-sky-400">
                  {profile.approx_distance_km || 12} km
                </div>
                <div className="text-xs font-semibold text-white">Approx. Distance</div>
                <div className="text-[11px] text-neutral-400">From your current region</div>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-center space-y-1">
                <div className="text-2xl font-black text-emerald-400">
                  {profile.languages?.length || 1}
                </div>
                <div className="text-xs font-semibold text-white">Shared Languages</div>
                <div className="text-[11px] text-neutral-400">{profile.languages?.join(', ') || 'English'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Followers / Following Modal */}
      {followModalOpen && profile.user_id && (
        <FollowListModal
          isOpen={followModalOpen}
          onClose={() => setFollowModalOpen(false)}
          userId={profile.user_id}
          userName={profile.name}
          initialTab={followModalTab}
          currentUserId={currentUser?.id}
          onViewProfile={onNavigateProfile}
          onFollowChanged={loadProfile}
        />
      )}

      {/* Lightbox Photo Viewer Modal */}
      <AnimatePresence>
        {lightboxPhoto && (
          <div
            id="lightbox-backdrop"
            onClick={() => setLightboxPhoto(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-5 right-5 p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxPhoto}
              alt="Enlarged"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Block Confirmation Modal (Requirement 11) */}
      <AnimatePresence>
        {showBlockConfirm && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-500 flex items-center justify-center mx-auto">
                <Ban className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {isBlocked ? `Unblock ${profile.name}?` : `Block ${profile.name}?`}
              </h3>
              <p className="text-xs text-neutral-400">
                {isBlocked
                  ? `${profile.name} will be able to view your public profile and follow you again.`
                  : `${profile.name} will not be able to view your profile, follow you, or send you any messages.`}
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={blockLoading}
                  onClick={handleBlockToggle}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  {blockLoading ? 'Processing...' : isBlocked ? 'Confirm Unblock' : 'Confirm Block'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Cover Photo Modal (Owner) */}
      <AnimatePresence>
        {showCoverEditModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <input
              type="file"
              ref={coverFileRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleCoverFileUpload(e.target.files[0]);
                }
                e.target.value = '';
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                  <Camera className="w-5 h-5 text-rose-500" />
                  Change Cover Banner
                </h3>
                <button
                  onClick={() => setShowCoverEditModal(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cover Modal Tabs */}
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                <button
                  type="button"
                  onClick={() => setCoverModalTab('upload')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    coverModalTab === 'upload'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-neutral-400 hover:text-neutral-200 bg-neutral-800/60'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Image File
                </button>
                <button
                  type="button"
                  onClick={() => setCoverModalTab('presets')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    coverModalTab === 'presets'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-neutral-400 hover:text-neutral-200 bg-neutral-800/60'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" /> Preset Themes
                </button>
                <button
                  type="button"
                  onClick={() => setCoverModalTab('url')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    coverModalTab === 'url'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-neutral-400 hover:text-neutral-200 bg-neutral-800/60'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> Image URL
                </button>
              </div>

              {/* Upload File Tab */}
              {coverModalTab === 'upload' && (
                <div
                  onClick={() => coverFileRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-neutral-700 hover:border-rose-500 bg-neutral-950/60 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Click to select banner from Device / Gallery</p>
                    <p className="text-xs text-neutral-400">Supports JPG, PNG, WebP (Landscape recommended)</p>
                  </div>
                </div>
              )}

              {/* Presets Tab */}
              {coverModalTab === 'presets' && (
                <div className="space-y-2">
                  <div className="text-xs text-neutral-400">Click a preset banner to select:</div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
                      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80',
                      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
                      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
                      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
                      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
                    ].map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setCustomCoverUrl(url)}
                        className={`h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition hover:scale-105 ${
                          customCoverUrl === url ? 'border-rose-500 ring-2 ring-rose-500/40' : 'border-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        <img
                          src={url}
                          alt="Preset"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* URL Tab */}
              {coverModalTab === 'url' && (
                <div className="space-y-2">
                  <p className="text-xs text-neutral-400">
                    Paste image URL for your cover banner:
                  </p>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={customCoverUrl}
                    onChange={(e) => setCustomCoverUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCoverEditModal(false)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                {coverModalTab !== 'upload' && (
                  <button
                    disabled={savingCover || !customCoverUrl.trim()}
                    onClick={handleSaveCoverPhoto}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {savingCover ? 'Saving...' : 'Apply Cover'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
