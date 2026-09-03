import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Heart, 
  MessageCircle, 
  PhoneCall, 
  User as UserIcon, 
  Sparkles, 
  SlidersHorizontal, 
  ShieldCheck, 
  ExternalLink, 
  RefreshCw, 
  Crown, 
  Zap, 
  Lock, 
  Globe, 
  Phone, 
  Video, 
  CheckCircle2, 
  Search,
  ArrowRight,
  Shield,
  Layers,
  Grid,
  X
} from 'lucide-react';
import { useTranslation, LanguageProvider } from './i18n/LanguageContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DiscoveryCard } from './components/DiscoveryCard';
import { DiscoveryGrid } from './components/DiscoveryGrid';
import { FiltersModal } from './components/FiltersModal';
import { MatchModal } from './components/MatchModal';
import { ChatWindow } from './components/ChatWindow';
import { CallOverlay } from './components/CallOverlay';
import { IncomingCallModal } from './components/IncomingCallModal';
import { ProfileViewModal } from './components/ProfileViewModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { BoostModal } from './components/BoostModal';
import { ReportModal } from './components/ReportModal';
import { PartnerDisclosureModal } from './components/PartnerDisclosureModal';
import { LegalModal } from './components/LegalModal';
import { AuthModal } from './components/AuthModal';
import { AdminView } from './components/AdminView';
import { AdminPortal } from './components/AdminPortal';
import { PublicProfileView } from './components/PublicProfileView';
import { UserSearchModal } from './components/UserSearchModal';
import { Profile, User, Match, Conversation, Call, DiscoveryFilters } from './types';
import { soundManager } from './utils/sound';
import { api } from './services/api';
import { getSocket } from './services/socket';

// Helper function to extract profile target from Facebook-style URL
function getProfileTargetFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  // Match /profile/:identifier
  const profileMatch = path.match(/^\/profile\/([a-zA-Z0-9_.-]+)/i);
  if (profileMatch && profileMatch[1]) {
    return decodeURIComponent(profileMatch[1]);
  }
  // Match /@:username
  const atMatch = path.match(/^\/@([a-zA-Z0-9_.-]+)/i);
  if (atMatch && atMatch[1]) {
    return decodeURIComponent(atMatch[1]);
  }
  // Check hash e.g. #/profile/:id or #@username
  const hash = window.location.hash;
  const hashMatch = hash.match(/^#\/?profile\/([a-zA-Z0-9_.-]+)/i);
  if (hashMatch && hashMatch[1]) {
    return decodeURIComponent(hashMatch[1]);
  }
  const hashAtMatch = hash.match(/^#\/?@([a-zA-Z0-9_.-]+)/i);
  if (hashAtMatch && hashAtMatch[1]) {
    return decodeURIComponent(hashAtMatch[1]);
  }
  // Check query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const qProfile = urlParams.get('profile') || urlParams.get('username') || urlParams.get('u');
  if (qProfile) {
    return qProfile.trim();
  }
  return null;
}

function MainApp() {
  const { t } = useTranslation();

  // Admin Route State (/tanvir or /admin)
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path === '/tanvir' ||
      path.endsWith('/tanvir') ||
      path === '/admin' ||
      path.endsWith('/admin') ||
      hash === '#tanvir' ||
      hash === '#/tanvir' ||
      hash === '#admin' ||
      search.includes('admin=tanvir') ||
      search.includes('route=tanvir')
    );
  });

  // App States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('discover');
  const [viewMode, setViewMode] = useState<'swipe' | 'grid'>('swipe');

  // Discovery State
  const [discoverProfiles, setDiscoverProfiles] = useState<Profile[]>([]);
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DiscoveryFilters>({
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
  });

  // Matches, Conversations, Calls
  const [matches, setMatches] = useState<Match[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [callHistory, setCallHistory] = useState<Call[]>([]);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  // Modals
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [matchedProfileData, setMatchedProfileData] = useState<Profile | null>(null);
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false);
  const [inspectProfile, setInspectProfile] = useState<Profile | null>(null);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isBoostOpen, setIsBoostOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportTargetProfile, setReportTargetProfile] = useState<Profile | null>(null);
  const [isPartnerDisclosureOpen, setIsPartnerDisclosureOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState('terms');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Social & Registered Users Search / Profile
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [selectedPublicUserId, setSelectedPublicUserId] = useState<string | null>(() => getProfileTargetFromUrl());
  const [selectedPublicProfile, setSelectedPublicProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const handleOpenPublicProfile = (target: Profile | string) => {
    let identifier = '';
    if (typeof target === 'string') {
      identifier = target;
      setSelectedPublicUserId(target);
      setSelectedPublicProfile(null);
    } else {
      identifier = target.username || target.user_id || target.id;
      setSelectedPublicProfile(target);
      setSelectedPublicUserId(target.user_id || target.id);
    }

    if (typeof window !== 'undefined' && identifier) {
      const targetPath = `/profile/${identifier}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ profileTarget: identifier }, '', targetPath);
      }
    }
  };

  const handleClosePublicProfile = () => {
    setSelectedPublicUserId(null);
    setSelectedPublicProfile(null);
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/profile/') || window.location.pathname.startsWith('/@')) {
        window.history.pushState({}, '', '/');
      }
    }
  };

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      const [meData, discoverData, matchesData, convsData, callsData, notifsData] = await Promise.all([
        api.getMe(),
        api.getDiscoverProfiles(filters),
        api.getMatches(),
        api.getConversations(),
        api.getCallHistory(),
        api.getNotifications().catch(() => ({ notifications: [] })),
      ]);

      setCurrentUser(meData.user);
      setCurrentProfile(meData.profile);
      setDiscoverProfiles(discoverData.profiles);
      setMatches(matchesData.matches);
      setConversations(convsData.conversations);
      setCallHistory(callsData.calls);
      setNotifications(notifsData.notifications || []);
    } catch (err) {
      console.error('Failed to load initial app data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Socket.io connection and real-time listeners
    const socket = getSocket();

    const emitUserJoin = () => {
      const myId = currentUser?.id || currentProfile?.user_id || currentProfile?.id;
      if (myId) {
        socket.emit('user:join', { userId: myId });
      }
    };

    emitUserJoin();
    socket.on('connect', emitUserJoin);

    socket.on('match:created', (data) => {
      setMatchedProfileData(data.matched_profile);
      setIsMatchModalOpen(true);
      api.getMatches().then((m) => setMatches(m.matches));
      api.getConversations().then((c) => setConversations(c.conversations));
    });

    socket.on('call:incoming', (callData: Call) => {
      const myId = currentUser?.id || currentProfile?.user_id || currentProfile?.id;
      if (!myId) return;
      // If we are the receiver of the call, trigger the incoming call modal
      const isTarget = 
        callData.receiver_id === myId || 
        (currentProfile && (callData.receiver_id === currentProfile.id || callData.receiver_id === currentProfile.user_id));

      if (isTarget && callData.caller_id !== myId) {
        setIncomingCall(callData);
      }
    });

    socket.on('call:accepted', (data: any) => {
      const callData = data?.call || data;
      if (callData?.id && activeCall && activeCall.id === callData.id) {
        setActiveCall((prev) => prev ? { ...prev, ...callData, status: 'accepted' } : callData);
      }
    });

    socket.on('call:rejected', (callData: Call) => {
      if (activeCall && activeCall.id === callData.id) {
        setActiveCall(null);
      }
      if (incomingCall && incomingCall.id === callData.id) {
        setIncomingCall(null);
      }
    });

    socket.on('call:ended', (data: any) => {
      if (!data?.callId || (activeCall && activeCall.id === data.callId) || (incomingCall && incomingCall.id === data.callId)) {
        setActiveCall(null);
        setIncomingCall(null);
        api.getCallHistory().then((c) => setCallHistory(c.calls)).catch(() => {});
      }
    });

    socket.on('notification:new', (notif: any) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    const handleUrlChange = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const isTanvir = 
        path === '/tanvir' ||
        path.endsWith('/tanvir') ||
        path === '/admin' ||
        path.endsWith('/admin') ||
        hash === '#tanvir' ||
        hash === '#/tanvir' ||
        hash === '#admin' ||
        search.includes('admin=tanvir') ||
        search.includes('route=tanvir');
      setIsAdminRoute(isTanvir);

      // Check if URL points to a public profile
      const urlProfileTarget = getProfileTargetFromUrl();
      if (urlProfileTarget) {
        setSelectedPublicUserId(urlProfileTarget);
      } else if (path === '/' || path === '') {
        setSelectedPublicUserId(null);
        setSelectedPublicProfile(null);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      socket.off('match:created');
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:ended');
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [currentUser?.id, currentProfile?.user_id, activeCall?.id, incomingCall?.id]);

  // Reset all filters and search query to show all global profiles
  const handleResetAllFilters = async () => {
    const defaultFilters: DiscoveryFilters = {
      minAge: 18,
      maxAge: 70,
      gender: 'ALL',
      country: '',
      city: '',
      maxDistance: 500,
      languages: [],
      interests: [],
      relationshipGoal: '',
      onlineOnly: false,
      profileSource: 'ALL',
    };
    setSearchQuery('');
    setFilters(defaultFilters);
    setCurrentDeckIndex(0);
    setIsLoading(true);
    try {
      const res = await api.getDiscoverProfiles(defaultFilters);
      setDiscoverProfiles(res.profiles);
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profiles when filters change
  const handleApplyFilters = async (newFilters: DiscoveryFilters) => {
    setFilters(newFilters);
    setIsLoading(true);
    try {
      const res = await api.getDiscoverProfiles(newFilters);
      setDiscoverProfiles(res.profiles);
      setCurrentDeckIndex(0);
    } catch (err) {
      console.error('Filters error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Like / Super Like Handler
  const handleLike = async (profile: Profile, isSuperLike = false) => {
    try {
      const res = await api.sendLike(profile.user_id || profile.id, isSuperLike);
      if (res.is_match && res.match_data) {
        setMatchedProfileData(profile);
        setIsMatchModalOpen(true);
        // Refresh matches
        api.getMatches().then((m) => setMatches(m.matches));
        api.getConversations().then((c) => setConversations(c.conversations));
      }
      // Advance card
      setCurrentDeckIndex((prev) => prev + 1);
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // Pass Handler
  const handlePass = (profile: Profile) => {
    setCurrentDeckIndex((prev) => prev + 1);
  };

  // Call Initiation Handler
  const handleStartCall = async (receiverId: string, type: 'voice' | 'video') => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    soundManager.unlock();
    try {
      const res = await api.initiateCall(receiverId, type);
      setActiveCall(res.call);
    } catch (err: any) {
      if (err.message === 'Authentication required' || err.message?.includes('auth')) {
        setIsAuthOpen(true);
      } else {
        alert(err.message || 'Call failed to start');
      }
    }
  };

  // Incoming Call Acceptance (Instant 1-Click Connection)
  const handleAcceptCall = async (call: Call) => {
    soundManager.unlock();
    // 1. Immediately transition UI state so the modal closes and call view opens instantly
    setIncomingCall(null);
    setActiveCall({ ...call, status: 'accepted' });

    // 2. Emit real-time WebRTC/Socket acceptance
    try {
      const socket = getSocket();
      socket.emit('call:accept', {
        callId: call.id,
        caller_id: call.caller_id,
        receiver_id: call.receiver_id,
        call,
      });
    } catch (e) {}

    // 3. Persist call state to database
    try {
      const res = await api.acceptCall(call.id);
      if (res.call) {
        setActiveCall((prev) => prev ? { ...prev, ...res.call, status: 'accepted' } : res.call);
      }
    } catch (err) {
      console.warn('Accept call background sync note:', err);
    }
  };

  // Incoming Call Rejection
  const handleRejectCall = async (call: Call) => {
    try {
      await api.rejectCall(call.id);
    } catch (err) {}
    setIncomingCall(null);
  };

  // Direct Message Handler from Profile Modal
  const handleStartChat = async (profile: Profile) => {
    try {
      const res = await api.createOrGetConversation(profile.user_id || profile.id);
      if (res.conversation) {
        setConversations((prev) => {
          if (prev.some((c) => c.id === res.conversation.id)) return prev;
          return [res.conversation, ...prev];
        });
        setActiveConversationId(res.conversation.id);
        setActiveTab('messages');
      }
    } catch (err) {
      console.error('Start chat error:', err);
    }
  };

  const handleOpenLegalModal = (tabName: string) => {
    if (tabName === 'disclosure') {
      setIsPartnerDisclosureOpen(true);
    } else {
      setLegalInitialTab(tabName);
      setIsLegalOpen(true);
    }
  };

  // Filter discover profiles by search query
  const filteredDiscoverProfiles = discoverProfiles.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const cityMatch = (p.city || '').toLowerCase().includes(q);
    const countryMatch = (p.country || '').toLowerCase().includes(q);
    const professionMatch = (p.profession || '').toLowerCase().includes(q);
    const bioMatch = (p.bio || '').toLowerCase().includes(q);
    const interestMatch = (p.interests || []).some((i) => i.toLowerCase().includes(q));
    const langMatch = (p.languages || []).some((l) => l.toLowerCase().includes(q));
    return nameMatch || cityMatch || countryMatch || professionMatch || bioMatch || interestMatch || langMatch;
  });

  const activeProfileInDeck = filteredDiscoverProfiles[currentDeckIndex];
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // If visiting Admin Route (/tanvir or /admin)
  if (isAdminRoute) {
    return (
      <AdminPortal
        onBackToSite={() => {
          setIsAdminRoute(false);
          try {
            window.history.pushState({}, '', '/');
          } catch (e) {}
        }}
      />
    );
  }

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    setCurrentUser(null);
    setCurrentProfile(null);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Header */}
      <Navbar
        user={currentUser}
        profile={currentProfile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenFilters={() => setIsFiltersOpen(true)}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
        onOpenBoost={() => setIsBoostOpen(true)}
        onOpenProfile={() => setIsProfileEditOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenLegal={handleOpenLegalModal}
        onOpenUserSearch={() => setIsUserSearchOpen(true)}
        notifications={notifications}
        unreadNotificationsCount={notifications.filter((n) => !n.is_read).length}
        onSelectNotificationProfile={(profileOrUserId) => {
          setSelectedPublicUserId(profileOrUserId);
        }}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          matchesCount={matches.length}
          unreadMessagesCount={conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)}
          user={currentUser}
          onOpenLegal={handleOpenLegalModal}
        />

        {/* Content View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24 md:pb-8">
          
          {/* ========================================================================= */}
          {/* 1. DISCOVER TAB */}
          {/* ========================================================================= */}
          {activeTab === 'discover' && (
            <div className="space-y-6">
              
              {/* Profile Search & Filter Bar */}
              <div className="bg-stone-900/80 p-3 sm:p-4 rounded-2xl border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                
                {/* Search Input */}
                <div className="relative w-full sm:w-80 flex items-center">
                  <Search className="w-4 h-4 text-rose-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentDeckIndex(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Search by name, city, country, interest..."
                    className="w-full bg-stone-950 border border-stone-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-rose-500 transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentDeckIndex(0);
                      }}
                      className="absolute right-2.5 text-stone-400 hover:text-white p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills & Refresh */}
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end text-xs">
                  {searchQuery && (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold flex items-center gap-1">
                      {filteredDiscoverProfiles.length} Results
                    </span>
                  )}

                  <span className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 border text-[11px] ${
                    filters.profileSource === 'ALL'
                      ? 'bg-stone-800 text-stone-300 border-stone-700'
                      : filters.profileSource === 'NATIVE'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {filters.profileSource === 'ALL' ? 'Global' : filters.profileSource === 'NATIVE' ? 'Members' : 'Partners'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsFiltersOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-rose-400" />
                    <span>Filters</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentDeckIndex(0);
                      setSearchQuery('');
                      api.getDiscoverProfiles(filters).then((r) => setDiscoverProfiles(r.profiles));
                    }}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
                    title="Reset & Refresh"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* View Content: Swipe Deck or Grid */}
              {viewMode === 'swipe' ? (
                <div className="flex items-center justify-center min-h-[680px]">
                  {activeProfileInDeck ? (
                    <DiscoveryCard
                      key={activeProfileInDeck.id}
                      profile={activeProfileInDeck}
                      onLike={handleLike}
                      onPass={handlePass}
                      onViewDetails={(p) => handleOpenPublicProfile(p)}
                      onReport={(p) => {
                        setReportTargetProfile(p);
                        setIsReportOpen(true);
                      }}
                    />
                  ) : (
                    <div className="text-center py-20 px-6 max-w-md bg-stone-900/60 rounded-3xl border border-stone-800 shadow-2xl space-y-4">
                      <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                        <Globe className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-white font-serif">
                        {searchQuery ? 'No Matching Profiles Found' : 'Deck Completed!'}
                      </h3>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        {searchQuery 
                          ? `No profiles matched "${searchQuery}". Try a different keyword or clear search.`
                          : 'You have browsed all matching profiles with your current filters. Adjust your age range, distance, or reset filters to discover more people worldwide.'}
                      </p>
                      <div className="flex gap-2 justify-center pt-2 flex-wrap">
                        {searchQuery ? (
                          <>
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setCurrentDeckIndex(0);
                              }}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-900/30 cursor-pointer"
                            >
                              Clear Search
                            </button>
                            <button
                              onClick={handleResetAllFilters}
                              className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs cursor-pointer"
                            >
                              Show All Worldwide
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={handleResetAllFilters}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 cursor-pointer"
                            >
                              Restart & Show All
                            </button>
                            <button
                              onClick={() => setIsFiltersOpen(true)}
                              className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs cursor-pointer"
                            >
                              Adjust Filters
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <DiscoveryGrid
                  profiles={filteredDiscoverProfiles}
                  onLike={handleLike}
                  onPass={handlePass}
                  onViewDetails={(p) => handleOpenPublicProfile(p)}
                  onResetFilters={handleResetAllFilters}
                />
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. MATCHES TAB */}
          {/* ========================================================================= */}
          {activeTab === 'matches' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white font-serif">{t('matches')}</h1>
                <p className="text-xs text-stone-400">Your mutual sparks and connections worldwide</p>
              </div>

              {matches.length === 0 ? (
                <div className="p-16 text-center bg-stone-900/50 rounded-3xl border border-stone-800 space-y-3">
                  <Heart className="w-10 h-10 text-stone-600 mx-auto" />
                  <h3 className="font-bold text-white text-base">No matches yet</h3>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    Keep swiping and liking profiles on Discover. When someone likes you back, they will appear here!
                  </p>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-900/30"
                  >
                    Start Discovering
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.map((match) => {
                    const prof = match.matched_profile;
                    if (!prof) return null;

                    return (
                      <div
                        key={match.id}
                        className="p-4 rounded-3xl bg-stone-900 border border-stone-800 shadow-lg flex items-center justify-between gap-3 hover:border-rose-500/50 transition group"
                      >
                        <div
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => handleOpenPublicProfile(prof)}
                        >
                          <div className="relative">
                            <img
                              src={prof.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'}
                              alt={prof.name}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-500/40 group-hover:border-rose-500 transition"
                              referrerPolicy="no-referrer"
                            />
                            {prof.is_online && (
                              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-stone-900" />
                            )}
                          </div>

                          <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-white text-sm font-serif truncate group-hover:text-rose-400 transition-colors">{prof.name}</h3>
                              <span className="text-xs text-stone-400">{prof.age}</span>
                            </div>
                            <p className="text-[11px] text-stone-400 truncate">{prof.city}, {prof.country}</p>
                            <p className="text-[10px] text-rose-400 font-semibold mt-0.5">
                              {prof.compatibility_score}% Compatible
                            </p>
                          </div>
                        </div>

                        {/* Quick Chat / Call Triggers */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              if (match.conversation_id) {
                                setActiveConversationId(match.conversation_id);
                                setActiveTab('messages');
                              }
                            }}
                            className="p-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow hover:opacity-90 transition"
                            title="Chat"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          {prof.source_type === 'native' && (
                            <button
                              onClick={() => handleStartCall(prof.user_id || prof.id, 'video')}
                              className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
                              title="Video Call"
                            >
                              <Video className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. MESSAGES TAB */}
          {/* ========================================================================= */}
          {activeTab === 'messages' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
              
              {/* Conversations List */}
              <div className={`bg-stone-900 rounded-3xl border border-stone-800 overflow-hidden flex flex-col shadow-xl ${
                activeConversationId ? 'hidden md:flex' : 'flex'
              }`}>
                <div className="p-4 border-b border-stone-800">
                  <h2 className="font-bold text-white text-base font-serif">{t('messages')}</h2>
                  <p className="text-xs text-stone-400">Encrypted instant chats with AI translation</p>
                </div>

                <div className="p-2 overflow-y-auto flex-1 space-y-1">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 text-xs">
                      No active conversations. Match with someone to start chatting!
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const other = conv.other_user;
                      const isSelected = activeConversationId === conv.id;

                      return (
                        <button
                          key={conv.id}
                          onClick={() => setActiveConversationId(conv.id)}
                          className={`w-full p-3 rounded-2xl text-left flex items-center gap-3 transition ${
                            isSelected
                              ? 'bg-rose-500/15 border border-rose-500/40 text-white'
                              : 'hover:bg-stone-800/80 text-stone-300'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={other.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'}
                              alt={other.name}
                              className="w-12 h-12 rounded-full object-cover border border-rose-500/30"
                              referrerPolicy="no-referrer"
                            />
                            {other.is_online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-stone-900" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-xs truncate font-serif">{other.name}</span>
                              <span className="text-[10px] text-stone-500">
                                {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-400 truncate mt-0.5">
                              {conv.last_message?.content || 'Matched! Say hello...'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Active Conversation Thread */}
              <div className={`md:col-span-2 h-full ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                {activeConversation ? (
                  <ChatWindow
                    conversation={activeConversation}
                    currentUser={currentUser}
                    onBack={() => setActiveConversationId(null)}
                    onInitiateCall={(id, type) => handleStartCall(id, type)}
                    onViewProfile={(p) => {
                      setInspectProfile(p);
                      setIsProfileViewOpen(true);
                    }}
                    onReportUser={(p) => {
                      setReportTargetProfile(p);
                      setIsReportOpen(true);
                    }}
                    onUnmatch={(matchId) => {
                      api.unmatch(matchId).then(() => {
                        api.getConversations().then((c) => setConversations(c.conversations));
                        api.getMatches().then((m) => setMatches(m.matches));
                        setActiveConversationId(null);
                      });
                    }}
                  />
                ) : (
                  <div className="flex-1 bg-stone-900/40 rounded-3xl border border-stone-800 flex flex-col items-center justify-center text-center p-8 text-stone-500 space-y-2">
                    <MessageCircle className="w-12 h-12 text-stone-700" />
                    <h3 className="font-bold text-stone-300 text-sm">Select a Conversation</h3>
                    <p className="text-xs text-stone-500 max-w-xs">
                      Choose a match from the left to start sending messages and initiating voice/video calls.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. CALLS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'calls' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold text-white font-serif">{t('calls')}</h1>
                <p className="text-xs text-stone-400">Encrypted WebRTC Voice & Video Call Log</p>
              </div>

              {callHistory.length === 0 ? (
                <div className="p-16 text-center bg-stone-900/50 rounded-3xl border border-stone-800 space-y-3">
                  <PhoneCall className="w-10 h-10 text-stone-600 mx-auto" />
                  <h3 className="font-bold text-white text-base">No Call History Yet</h3>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    Start high-definition voice and video calls directly from match profiles or chat threads.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {callHistory.map((c) => {
                    const isCaller = c.caller_id === currentUser?.id;
                    const otherProf = isCaller ? c.receiver_profile : c.caller_profile;

                    return (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-stone-800 border border-stone-700 shrink-0">
                            <img
                              src={otherProf?.photos?.[0]}
                              alt={otherProf?.name || 'Member'}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-sm font-serif">{otherProf?.name}</h3>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-semibold uppercase">
                                {c.type}
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-400 mt-0.5">
                              {new Date(c.created_at).toLocaleString()} • Duration: {Math.floor((c.duration || 0) / 60)}m {(c.duration || 0) % 60}s
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartCall(otherProf?.user_id || otherProf?.id || '', c.type)}
                          className="p-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-400 transition"
                          title="Redial"
                        >
                          {c.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. PROFILE TAB (Facebook-Style Profile with Cover, Posts, Photos & Tabs) */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            currentUser ? (
              <PublicProfileView
                profileIdOrUserId={currentUser.id || currentProfile?.user_id || currentProfile?.id || ''}
                profileId={currentUser.id || currentProfile?.user_id || currentProfile?.id || ''}
                currentUserId={currentUser.id || currentProfile?.user_id || currentProfile?.id || ''}
                currentUser={currentUser}
                currentUserProfile={currentProfile}
                isOwnProfile={true}
                onEditProfile={() => setIsProfileEditOpen(true)}
                onManagePlan={() => setIsSubscriptionOpen(true)}
                onBoostProfile={() => setIsBoostOpen(true)}
                onStartChat={handleStartChat}
                onStartCall={handleStartCall}
              />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-stone-900/90 border border-stone-800 text-center space-y-5 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-serif mb-1">Sign in to view your profile</h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Create or log into your account to customize your profile, view followers, update photos, and manage preferences.
                  </p>
                </div>
                <button
                  id="btn-login-profile-tab"
                  onClick={() => setIsAuthOpen(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-900/40 transition cursor-pointer"
                >
                  Sign In / Register
                </button>
              </div>
            )
          )}

          {/* ========================================================================= */}
          {/* 6. ADMIN VIEW TAB */}
          {/* ========================================================================= */}
          {activeTab === 'admin' && currentUser?.role === 'ADMIN' && (
            <AdminView />
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* GLOBAL MODALS */}
      {/* ========================================================================= */}
      
      {/* 1. Filters Modal */}
      <FiltersModal
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />

      {/* 2. Match Celebration Modal */}
      <MatchModal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        currentUserProfile={currentProfile}
        matchedProfile={matchedProfileData}
        onStartChat={(convId) => {
          if (convId) {
            setActiveConversationId(convId);
          }
          setActiveTab('messages');
        }}
      />

      {/* 3. Detailed Profile Inspection Modal */}
      <ProfileViewModal
        profile={inspectProfile}
        isOpen={isProfileViewOpen}
        onClose={() => setIsProfileViewOpen(false)}
        onLike={handleLike}
        onReport={(p) => {
          setReportTargetProfile(p);
          setIsReportOpen(true);
        }}
        onStartChat={handleStartChat}
        onStartCall={handleStartCall}
        onViewFacebookProfile={(p) => handleOpenPublicProfile(p)}
      />

      {/* 4. Profile Editor Modal */}
      <ProfileEditModal
        profile={currentProfile}
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
        onProfileUpdated={(updated) => {
          setCurrentProfile(updated);
          api.getDiscoverProfiles(filters).then((r) => setDiscoverProfiles(r.profiles));
        }}
      />

      {/* 5. Subscription Plan Upgrade Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        user={currentUser}
        onSubscriptionUpdated={(upd) => setCurrentUser(upd)}
      />

      {/* 6. Profile Boost Modal */}
      <BoostModal
        isOpen={isBoostOpen}
        onClose={() => setIsBoostOpen(false)}
        profile={currentProfile}
        onBoostApplied={(upd) => setCurrentProfile(upd)}
      />

      {/* 7. Trust & Safety Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetProfile={reportTargetProfile}
      />

      {/* 8. Partner Syndication Disclosure Modal */}
      <PartnerDisclosureModal
        isOpen={isPartnerDisclosureOpen}
        onClose={() => setIsPartnerDisclosureOpen(false)}
      />

      {/* 9. Legal & Safety Guidelines Modal */}
      <LegalModal
        isOpen={isLegalOpen}
        initialTab={legalInitialTab}
        onClose={() => setIsLegalOpen(false)}
      />

      {/* 10. Age Gate Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(usr, prf) => {
          setCurrentUser(usr);
          setCurrentProfile(prf);
          loadInitialData();
        }}
      />

      {/* 11. Incoming Call Ringing Alert Modal */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* 12. Fullscreen WebRTC Voice / Video Call Overlay */}
      {activeCall && (
        <CallOverlay
          call={activeCall}
          currentUser={currentUser}
          currentUserProfile={currentProfile}
          onEndCall={() => setActiveCall(null)}
        />
      )}

      {/* 13. Registered Members Search Modal */}
      <UserSearchModal
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
        currentUserId={currentUser?.id || currentProfile?.user_id}
        onSelectUser={(user) => {
          handleOpenPublicProfile(user);
        }}
      />

      {/* 14. Facebook-Style Public Profile Modal (When viewing another member) */}
      {selectedPublicUserId && (
        <div id="public-profile-viewer-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-2 sm:p-6 flex justify-center items-start">
          <div className="w-full max-w-5xl relative my-2 sm:my-4">
            <button
              onClick={handleClosePublicProfile}
              className="fixed top-4 right-4 z-50 px-4 py-2 rounded-full bg-black/80 hover:bg-black text-white text-xs font-bold border border-white/20 shadow-2xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close Profile</span>
            </button>
            <PublicProfileView
              profileIdOrUserId={selectedPublicUserId}
              profileId={selectedPublicUserId}
              initialProfile={selectedPublicProfile}
              currentUser={currentUser}
              currentUserProfile={currentProfile}
              currentUserId={currentUser?.id || currentProfile?.user_id}
              isOwnProfile={selectedPublicUserId === currentUser?.id || selectedPublicUserId === currentProfile?.user_id}
              onBack={handleClosePublicProfile}
              onNavigateProfile={(target) => {
                handleOpenPublicProfile(target);
              }}
              onStartChat={(otherId) => {
                handleClosePublicProfile();
                handleStartChat(otherId);
              }}
              onStartCall={(otherId, type) => {
                handleClosePublicProfile();
                handleStartCall(otherId, type);
              }}
              onEditProfile={() => {
                handleClosePublicProfile();
                setIsProfileEditOpen(true);
              }}
              onManagePlan={() => {
                handleClosePublicProfile();
                setIsSubscriptionOpen(true);
              }}
              onBoostProfile={() => {
                handleClosePublicProfile();
                setIsBoostOpen(true);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}

export default App;
