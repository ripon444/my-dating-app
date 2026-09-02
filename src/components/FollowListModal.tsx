import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserCheck, UserPlus, Search, Users, ShieldAlert, Sparkles, MapPin, ExternalLink } from 'lucide-react';
import { Profile } from '../types';
import { api } from '../services/api';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  initialTab?: 'followers' | 'following';
  currentUserId?: string;
  onViewProfile?: (targetUserIdOrProfile: Profile | string) => void;
  onFollowChanged?: () => void;
}

interface FollowUserItem {
  followId: string;
  followedAt: string;
  userId: string;
  email: string;
  profile: Profile;
  isFollowing: boolean;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  initialTab = 'followers',
  currentUserId,
  onViewProfile,
  onFollowChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<FollowUserItem[]>([]);
  const [following, setFollowing] = useState<FollowUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen && userId) {
      loadData();
    }
  }, [isOpen, userId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'followers') {
        const data = await api.getFollowers(userId);
        setFollowers(data.followers || []);
      } else {
        const data = await api.getFollowing(userId);
        setFollowing(data.following || []);
      }
    } catch (err) {
      console.error('Failed to load follow list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (item: FollowUserItem) => {
    if (!currentUserId || item.userId === currentUserId) return;
    setActionLoadingId(item.userId);
    try {
      if (item.isFollowing) {
        await api.unfollowUser(item.userId);
        // Update local state
        const updater = (list: FollowUserItem[]) =>
          list.map((u) => (u.userId === item.userId ? { ...u, isFollowing: false } : u));
        setFollowers(updater);
        setFollowing(updater);
      } else {
        await api.followUser(item.userId);
        const updater = (list: FollowUserItem[]) =>
          list.map((u) => (u.userId === item.userId ? { ...u, isFollowing: true } : u));
        setFollowers(updater);
        setFollowing(updater);
      }
      onFollowChanged?.();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  const currentList = activeTab === 'followers' ? followers : following;
  const filteredList = currentList.filter((item) => {
    const name = item.profile?.name?.toLowerCase() || '';
    const city = item.profile?.city?.toLowerCase() || '';
    const email = item.email?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return name.includes(q) || city.includes(q) || email.includes(q);
  });

  return (
    <AnimatePresence>
      <div id="follow-list-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          id="follow-list-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-10">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" />
                {userName}'s Connections
              </h2>
              <p className="text-xs text-neutral-400">View and manage network connections</p>
            </div>
            <button
              id="btn-close-follow-modal"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-neutral-800 bg-neutral-950 px-6 pt-2">
            <button
              id="tab-followers"
              onClick={() => setActiveTab('followers')}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'followers'
                  ? 'border-rose-500 text-rose-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>Followers</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-800 text-neutral-300">
                {followers.length}
              </span>
            </button>
            <button
              id="tab-following"
              onClick={() => setActiveTab('following')}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'following'
                  ? 'border-rose-500 text-rose-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>Following</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-800 text-neutral-300">
                {following.length}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-neutral-800 bg-neutral-900/50">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-followers"
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-neutral-800/50">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-400 space-y-3">
                <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading connections...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 flex flex-col items-center justify-center space-y-2">
                <Users className="w-10 h-10 text-neutral-600 mb-1" />
                <p className="text-sm font-medium text-neutral-300">
                  {searchQuery ? 'No matching users found' : `No ${activeTab} yet`}
                </p>
                <p className="text-xs text-neutral-500">
                  {activeTab === 'followers'
                    ? 'When other users follow this profile, they will appear here.'
                    : 'Profiles followed by this user will be listed here.'}
                </p>
              </div>
            ) : (
              filteredList.map((item) => {
                const photoUrl = item.profile?.photos?.[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
                const isSelf = currentUserId === item.userId;

                return (
                  <div
                    key={item.followId || item.userId}
                    className="pt-3 first:pt-0 flex items-center justify-between gap-3 group"
                  >
                    {/* User Profile Card Clickable */}
                    <div
                      onClick={() => {
                        onClose();
                        onViewProfile?.(item.profile || item.userId);
                      }}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={photoUrl}
                          alt={item.profile?.name || 'User'}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border border-neutral-700 group-hover:border-rose-500 transition-colors"
                        />
                        {item.profile?.is_online && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-neutral-900 rounded-full" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors truncate">
                            {item.profile?.name || 'Global User'}
                          </h4>
                          {item.profile?.is_verified && (
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                          {item.profile?.city && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                              {item.profile.city}, {item.profile.country}
                            </span>
                          )}
                          {item.profile?.age && (
                            <span>• {item.profile.age} yrs</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Follow/Unfollow Action Button */}
                    {!isSelf && currentUserId && (
                      <button
                        id={`btn-follow-user-${item.userId}`}
                        disabled={actionLoadingId === item.userId}
                        onClick={() => handleToggleFollow(item)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                          item.isFollowing
                            ? 'bg-neutral-800 text-neutral-300 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900 border border-neutral-700'
                            : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 shadow-sm'
                        }`}
                      >
                        {actionLoadingId === item.userId ? (
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : item.isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    )}

                    {isSelf && (
                      <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-[11px] font-medium text-neutral-400 shrink-0">
                        You
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 bg-neutral-950 border-t border-neutral-800 text-center">
            <p className="text-[11px] text-neutral-500">
              Relationships are stored in Cloud SQL PostgreSQL for maximum reliability.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
