import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, 
  Flame, 
  Sparkles, 
  Shield, 
  Crown, 
  User as UserIcon, 
  SlidersHorizontal, 
  Grid, 
  Layers,
  ChevronDown,
  Check,
  Zap,
  Lock,
  Heart,
  Search,
  Users,
  Bell,
  X
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n/translations';
import { User, Profile } from '../types';

interface NavbarProps {
  user: User | null;
  profile: Profile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  viewMode: 'swipe' | 'grid';
  setViewMode: (mode: 'swipe' | 'grid') => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onOpenFilters: () => void;
  onOpenSubscription: () => void;
  onOpenBoost: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onLogout?: () => void;
  onOpenLegal: (tab: string) => void;
  onOpenUserSearch?: () => void;
  notifications?: any[];
  unreadNotificationsCount?: number;
  onSelectNotificationProfile?: (profileIdOrUserId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  profile,
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  searchQuery = '',
  setSearchQuery,
  onOpenFilters,
  onOpenSubscription,
  onOpenBoost,
  onOpenProfile,
  onOpenAuth,
  onLogout,
  onOpenLegal,
  onOpenUserSearch,
  notifications = [],
  unreadNotificationsCount = 0,
  onSelectNotificationProfile,
}) => {
  const { currentLanguage, setLanguage, t } = useTranslation();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  return (
    <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('discover')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/20">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-stone-100 tracking-tight font-serif">Global Match</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                Global
              </span>
            </div>
            <p className="text-xs text-stone-400 hidden sm:block">Unified Global & Partner Dating</p>
          </div>
        </div>

        {/* Center Quick Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-stone-800/60 p-1 rounded-xl border border-stone-700/50">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'discover'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow'
                : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
            }`}
          >
            {t('discover')}
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'matches'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow'
                : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
            }`}
          >
            {t('matches')}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'messages'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow'
                : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
            }`}
          >
            {t('messages')}
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'calls'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow'
                : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
            }`}
          >
            {t('calls')}
          </button>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-indigo-300 hover:text-white hover:bg-indigo-950/50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              {t('admin')}
            </button>
          )}
        </nav>

        {/* Right Tools: View Toggle, Search, Filters, Boost, Subscription, Language, Profile */}
        <div className="flex items-center gap-2">
          
          {/* Search Button / Input */}
          {setSearchQuery && (
            <div className="relative flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center bg-stone-800 border border-rose-500/50 rounded-xl px-2.5 py-1 animate-in fade-in slide-in-from-right-3">
                  <Search className="w-3.5 h-3.5 text-rose-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Search name, city, country..."
                    autoFocus
                    className="bg-transparent text-stone-100 placeholder-stone-400 text-xs focus:outline-none w-32 sm:w-48"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-stone-400 hover:text-white p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      if (activeTab !== 'discover') setActiveTab('discover');
                    }}
                    className="ml-1 text-stone-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(true);
                    if (activeTab !== 'discover') setActiveTab('discover');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium transition cursor-pointer"
                  title="Search Profiles"
                >
                  <Search className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              )}
            </div>
          )}

          {/* Find Registered Users (Social Search) */}
          {onOpenUserSearch && (
            <button
              id="btn-nav-find-members"
              type="button"
              onClick={onOpenUserSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-stone-200 border border-neutral-700 text-xs font-semibold transition"
              title="Find Registered Members"
            >
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Find Members</span>
            </button>
          )}

          {/* Real-time Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              id="btn-nav-notifications"
              onClick={() => setNotifMenuOpen(!notifMenuOpen)}
              className="relative p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-stone-300" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {notifMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 py-2 z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-rose-500" />
                    <span>Notifications & Activity</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {notifications.length} updates
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-neutral-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-400 space-y-1">
                      <Bell className="w-6 h-6 text-neutral-600 mx-auto" />
                      <p className="font-semibold text-neutral-300">All caught up!</p>
                      <p className="text-[11px]">When someone follows you or sends a like, it will appear here.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          setNotifMenuOpen(false);
                          const targetId = notif.data?.followerId || notif.data?.userId || notif.user_id;
                          if (targetId) {
                            onSelectNotificationProfile?.(targetId);
                          }
                        }}
                        className={`p-3 text-xs hover:bg-neutral-800/80 cursor-pointer transition ${
                          !notif.is_read ? 'bg-rose-950/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-white">{notif.title}</span>
                          <span className="text-[10px] text-neutral-500">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-neutral-300 text-[11px] leading-relaxed">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Discovery View Switcher (Swipe vs Grid) */}
          {activeTab === 'discover' && (
            <div className="hidden sm:flex items-center bg-stone-800 rounded-lg p-0.5 border border-stone-700">
              <button
                onClick={() => setViewMode('swipe')}
                className={`p-1.5 rounded-md text-xs transition ${
                  viewMode === 'swipe' ? 'bg-stone-700 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Swipe Card View"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs transition ${
                  viewMode === 'grid' ? 'bg-stone-700 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Browse Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Filters Button */}
          {activeTab === 'discover' && (
            <button
              onClick={onOpenFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">{t('filters')}</span>
            </button>
          )}

          {/* Boost Button */}
          <button
            onClick={onOpenBoost}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
              profile?.is_boosted
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
            }`}
            title="Boost Profile for 10x visibility"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">{profile?.is_boosted ? t('boostActive') : t('boostProfile')}</span>
          </button>

          {/* Subscription Tier Badge / Upgrade */}
          <button
            onClick={onOpenSubscription}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              user?.subscriptionTier === 'VIP'
                ? 'bg-gradient-to-r from-amber-500 to-amber-700 text-stone-900 font-bold shadow'
                : user?.subscriptionTier === 'PREMIUM'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">
              {user?.subscriptionTier === 'FREE' ? t('upgradePlan') : user?.subscriptionTier}
            </span>
          </button>

          {/* Language Switcher (10 Languages) */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs transition"
              title="Change Language"
            >
              <span className="text-sm">{currentLangObj?.flag}</span>
              <span className="font-semibold uppercase text-[11px] hidden sm:inline">{currentLangObj?.code}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-stone-900 rounded-xl shadow-2xl border border-stone-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-800 mb-1">
                  Global Languages
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as SupportedLanguage);
                        setLangMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-200 hover:bg-stone-800 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <div className="text-left">
                          <div className="font-medium text-stone-100">{lang.name}</div>
                          <div className="text-[10px] text-stone-400">{lang.nativeName}</div>
                        </div>
                      </div>
                      {currentLanguage === lang.code && <Check className="w-4 h-4 text-rose-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar / Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 transition"
            >
              {profile?.photos?.[0] ? (
                <img
                  src={profile.photos[0]}
                  alt={profile.name}
                  className="w-7 h-7 rounded-full object-cover border border-rose-500/30"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-stone-700 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-stone-300" />
                </div>
              )}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-stone-900 rounded-xl shadow-2xl border border-stone-700 py-2 z-50">
                <div className="px-4 py-3 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-stone-100 text-sm truncate">{profile?.name || 'Member'}</div>
                    <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-semibold rounded">
                      {t('memberBadge')}
                    </span>
                  </div>
                  <div className="text-xs text-stone-400 truncate">{user?.email}</div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onOpenProfile();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-stone-200 hover:bg-stone-800 flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4 text-rose-400" />
                    {t('profile')} & Preferences
                  </button>
                  <button
                    onClick={() => {
                      onOpenSubscription();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-stone-200 hover:bg-stone-800 flex items-center gap-2"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    Subscriptions ({user?.subscriptionTier})
                  </button>
                  <button
                    onClick={() => {
                      onOpenLegal('disclosure');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-stone-200 hover:bg-stone-800 flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-sky-400" />
                    {t('disclosure')}
                  </button>
                  <button
                    onClick={() => {
                      onOpenLegal('safety');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-stone-200 hover:bg-stone-800 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-emerald-400" />
                    {t('safety')}
                  </button>
                </div>

                <div className="border-t border-stone-800 pt-1 mt-1">
                  <button
                    onClick={() => {
                      if (onLogout) {
                        onLogout();
                      } else {
                        onOpenAuth();
                      }
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-stone-800 font-medium flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4 text-rose-400" />
                    {user ? 'Log Out' : 'Sign In / Register'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
