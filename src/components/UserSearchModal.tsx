import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Users, UserPlus, UserCheck, Sparkles, MapPin, X, ArrowRight } from 'lucide-react';
import { Profile } from '../types';
import { api } from '../services/api';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onSelectUser: (profile: Profile) => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onSelectUser,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query.trim());
      } else {
        setResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (q: string) => {
    setLoading(true);
    try {
      const res = await api.searchRealUsers(q);
      setResults(res.users || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (e: React.MouseEvent, user: Profile) => {
    e.stopPropagation();
    if (!currentUserId || !user.user_id) return;
    setActionLoadingId(user.user_id);
    try {
      if (user.is_following) {
        const res = await api.unfollowUser(user.user_id);
        setResults((prev) =>
          prev.map((u) =>
            u.user_id === user.user_id
              ? { ...u, is_following: false, followers_count: res.followersCount }
              : u
          )
        );
      } else {
        const res = await api.followUser(user.user_id);
        setResults((prev) =>
          prev.map((u) =>
            u.user_id === user.user_id
              ? { ...u, is_following: true, followers_count: res.followersCount }
              : u
          )
        );
      }
    } catch (err: any) {
      alert(err.message || 'Follow action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="user-search-modal-backdrop" className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        id="user-search-modal-container"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Search Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center gap-3">
          <Search className="w-5 h-5 text-rose-500 shrink-0" />
          <input
            id="input-user-search-query"
            type="text"
            autoFocus
            placeholder="Search registered users by name, city, or username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none"
          />
          <button
            id="btn-close-user-search"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-neutral-400">
              <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Searching PostgreSQL user database...</p>
            </div>
          ) : query && results.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 space-y-2">
              <Users className="w-10 h-10 text-neutral-600 mx-auto" />
              <p className="text-sm font-semibold text-neutral-300">No registered users match "{query}"</p>
              <p className="text-xs">Try searching by first name, last name, or city.</p>
            </div>
          ) : !query ? (
            <div className="py-12 text-center text-neutral-500 space-y-2">
              <Search className="w-10 h-10 text-neutral-700 mx-auto" />
              <p className="text-sm font-semibold text-neutral-300">Search the Global Network</p>
              <p className="text-xs">Find friends, creators, and dates across all regions.</p>
            </div>
          ) : (
            results.map((user) => {
              const photo = user.photos?.[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
              const isSelf = currentUserId === user.user_id;

              return (
                <div
                  key={user.id || user.user_id}
                  onClick={() => {
                    onClose();
                    onSelectUser(user);
                  }}
                  className="p-3.5 bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-rose-500/50 rounded-2xl cursor-pointer flex items-center justify-between gap-3 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <img
                      src={photo}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border border-neutral-700 group-hover:border-rose-500 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white group-hover:text-rose-400 truncate">
                          {user.name}
                        </h4>
                        {user.is_verified && (
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        {user.age && (
                          <span className="text-xs text-neutral-400">• {user.age}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
                        {user.city && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-neutral-500" />
                            {user.city}, {user.country}
                          </span>
                        )}
                        <span>{user.followers_count ?? 0} followers</span>
                      </div>
                    </div>
                  </div>

                  {!isSelf && currentUserId && (
                    <button
                      id={`btn-search-follow-${user.user_id}`}
                      disabled={actionLoadingId === user.user_id}
                      onClick={(e) => handleToggleFollow(e, user)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                        user.is_following
                          ? 'bg-neutral-800 text-neutral-300 hover:bg-rose-950/40 hover:text-rose-400 border border-neutral-700'
                          : 'bg-rose-600 text-white hover:bg-rose-500 shadow-sm'
                      }`}
                    >
                      {actionLoadingId === user.user_id ? (
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : user.is_following ? (
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

                  <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-300 shrink-0" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 text-center text-[11px] text-neutral-500">
          Showing real registered users stored in Cloud SQL PostgreSQL
        </div>
      </motion.div>
    </div>
  );
};
