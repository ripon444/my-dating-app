// API Service Layer with Token-Based Session Storage
import { Profile, User, Match, Conversation, Message, Call, ExternalProvider, ExternalSyncLog, Report, AdminAnalytics, DiscoveryFilters } from '../types';

const TOKEN_KEY = 'globalmatch_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function authFetch(input: string, init?: RequestInit): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(init?.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export const api = {
  // Auth & Profile
  async getMe(): Promise<{ user: User | null; profile: Profile | null }> {
    const token = getStoredToken();
    if (!token) {
      return { user: null, profile: null };
    }
    try {
      const res = await authFetch('/api/auth/me');
      if (!res.ok) return { user: null, profile: null };
      return res.json();
    } catch {
      return { user: null, profile: null };
    }
  },

  // Facebook-Style Public Profile & Follow System
  async getPublicProfile(id?: string): Promise<{ profile: Profile }> {
    const targetId = (!id || id === 'undefined' || id === 'null') ? 'me' : id;
    const res = await authFetch(`/api/public-profiles/${targetId}`);
    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      let errMsg = 'Profile not found';
      if (contentType.includes('application/json')) {
        const err = await res.json().catch(() => ({}));
        errMsg = err.error || errMsg;
      }
      throw new Error(errMsg);
    }

    if (!contentType.includes('application/json')) {
      throw new Error('Profile is temporarily unavailable');
    }

    const data = await res.json();
    if (!data || !data.profile) {
      throw new Error('Profile data not found');
    }
    return data;
  },

  async followUser(userId: string): Promise<{ success: boolean; isFollowing: boolean; followersCount: number; followingCount: number }> {
    const res = await authFetch(`/api/users/${userId}/follow`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to follow user');
    }
    return data;
  },

  async unfollowUser(userId: string): Promise<{ success: boolean; isFollowing: boolean; followersCount: number; followingCount: number }> {
    const res = await authFetch(`/api/users/${userId}/unfollow`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to unfollow user');
    }
    return data;
  },

  async getFollowers(userId: string): Promise<{ followers: Array<{ followId: string; followedAt: string; userId: string; email: string; profile: Profile; isFollowing: boolean }> }> {
    const res = await authFetch(`/api/users/${userId}/followers`);
    if (!res.ok) throw new Error('Failed to fetch followers list');
    return res.json();
  },

  async getFollowing(userId: string): Promise<{ following: Array<{ followId: string; followedAt: string; userId: string; email: string; profile: Profile; isFollowing: boolean }> }> {
    const res = await authFetch(`/api/users/${userId}/following`);
    if (!res.ok) throw new Error('Failed to fetch following list');
    return res.json();
  },

  async blockUser(userId: string, reason?: string): Promise<{ success: boolean; isBlocked: boolean }> {
    const res = await authFetch(`/api/users/${userId}/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to block user');
    return data;
  },

  async unblockUser(userId: string): Promise<{ success: boolean; isBlocked: boolean }> {
    const res = await authFetch(`/api/users/${userId}/unblock`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to unblock user');
    return data;
  },

  async searchRealUsers(query: string): Promise<{ users: Profile[] }> {
    const res = await authFetch(`/api/users/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return { users: [] };
    return res.json();
  },

  async getNotifications(): Promise<{ notifications: Array<{ id: string; user_id: string; type: string; title: string; message: string; data?: any; is_read: boolean; created_at: string }> }> {
    const res = await authFetch('/api/notifications');
    if (!res.ok) return { notifications: [] };
    return res.json();
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await authFetch(`/api/notifications/${id}/read`, { method: 'POST' });
    return res.json();
  },

  async login(email: string, password?: string, role?: string): Promise<{ success: boolean; user: User; profile: Profile; token?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Login failed. Please check your email and password.');
    }
    if (data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  async register(params: { email: string; password?: string; name: string; dob: string; gender: string }): Promise<{ success: boolean; message: string; registeredEmail?: string; userId?: string; profileId?: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Registration failed');
    }
    return json;
  },

  async logout(): Promise<{ success: boolean }> {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      removeStoredToken();
    }
    return { success: true };
  },

  async updateProfile(data: Partial<Profile>): Promise<{ profile: Profile }> {
    const res = await authFetch('/api/profiles/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Discovery
  async getDiscoverProfiles(filters?: Partial<DiscoveryFilters>): Promise<{ profiles: Profile[] }> {
    const params = new URLSearchParams();
    if (filters?.minAge) params.append('minAge', String(filters.minAge));
    if (filters?.maxAge) params.append('maxAge', String(filters.maxAge));
    if (filters?.gender) params.append('gender', filters.gender);
    if (filters?.country) params.append('country', filters.country);
    if (filters?.profileSource) params.append('source', filters.profileSource);
    if (filters?.onlineOnly) params.append('onlineOnly', String(filters.onlineOnly));

    const res = await authFetch(`/api/discover?${params.toString()}`);
    return res.json();
  },

  // Likes & Matches
  async sendLike(receiverId: string, isSuperLike = false): Promise<{ success: boolean; is_match: boolean; match_data?: any }> {
    const res = await authFetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: receiverId, is_super_like: isSuperLike }),
    });
    return res.json();
  },

  async getMatches(): Promise<{ matches: Match[] }> {
    const res = await authFetch('/api/matches');
    return res.json();
  },

  async unmatch(matchId: string): Promise<{ success: boolean }> {
    const res = await authFetch(`/api/matches/${matchId}`, { method: 'DELETE' });
    return res.json();
  },

  // Chat
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    const res = await authFetch('/api/conversations');
    return res.json();
  },

  async createOrGetConversation(targetUserId: string): Promise<{ conversation: Conversation }> {
    const res = await authFetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: targetUserId }),
    });
    return res.json();
  },

  async markConversationAsRead(conversationId: string): Promise<{ success: boolean }> {
    const res = await authFetch(`/api/conversations/${conversationId}/read`, {
      method: 'POST',
    });
    return res.json();
  },

  async getMessages(conversationId: string): Promise<{ messages: Message[] }> {
    const res = await authFetch(`/api/conversations/${conversationId}/messages`);
    return res.json();
  },

  async uploadAttachment(data: { data: string; filename: string; mimeType: string; size: number }): Promise<{ success: boolean; file: { id?: string; url: string; filename: string; size: number; mimeType: string; messageType: string } }> {
    const res = await authFetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async sendMessage(data: {
    conversation_id: string;
    receiver_id?: string;
    content: string;
    attachment_url?: string;
    attachment?: any;
    file_name?: string;
    file_size?: number;
    message_type?: string;
  }): Promise<{ message: Message }> {
    const res = await authFetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // AI Service
  async generateBio(data: { interests: string[]; profession?: string; style?: string; relationshipGoal?: string }): Promise<{ bio: string }> {
    const res = await authFetch('/api/ai/bio-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async translateText(text: string, targetLang: string): Promise<{ translatedText: string; targetLang: string }> {
    const res = await authFetch('/api/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang }),
    });
    return res.json();
  },

  // Calls
  async initiateCall(receiverId: string, type: 'voice' | 'video'): Promise<{ call: Call }> {
    const res = await authFetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: receiverId, type }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to start call');
    }
    return res.json();
  },

  async acceptCall(callId: string): Promise<{ call: Call }> {
    const res = await authFetch(`/api/calls/${callId}/accept`, { method: 'POST' });
    return res.json();
  },

  async rejectCall(callId: string): Promise<{ success: boolean }> {
    const res = await authFetch(`/api/calls/${callId}/reject`, { method: 'POST' });
    return res.json();
  },

  async endCall(callId: string): Promise<{ success: boolean; duration?: number }> {
    const res = await authFetch(`/api/calls/${callId}/end`, { method: 'POST' });
    return res.json();
  },

  async getCallHistory(): Promise<{ calls: Call[] }> {
    const res = await authFetch('/api/calls/history');
    return res.json();
  },

  // Subscriptions & Boosts
  async checkoutSubscription(tier: 'PREMIUM' | 'VIP'): Promise<{ success: boolean; user: User; message: string }> {
    const res = await authFetch('/api/subscriptions/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    });
    return res.json();
  },

  async purchaseBoost(durationMinutes: number): Promise<{ success: boolean; profile: Profile; boostExpiresAt: string }> {
    const res = await authFetch('/api/boosts/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationMinutes }),
    });
    return res.json();
  },

  // Safety & Reports
  async submitReport(data: { reported_user_id: string; reported_user_name: string; category: string; reason: string }): Promise<{ success: boolean }> {
    const res = await authFetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // External Providers
  async getProviders(): Promise<{ providers: ExternalProvider[] }> {
    const res = await authFetch('/api/external/providers');
    return res.json();
  },

  async addProvider(data: Partial<ExternalProvider>): Promise<{ provider: ExternalProvider }> {
    const res = await authFetch('/api/external/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async syncProvider(providerId: string): Promise<{ success: boolean; log: ExternalSyncLog }> {
    const res = await authFetch(`/api/external/providers/${providerId}/sync`, { method: 'POST' });
    return res.json();
  },

  async getSyncLogs(): Promise<{ logs: ExternalSyncLog[] }> {
    const res = await authFetch('/api/external/sync-logs');
    return res.json();
  },

  async trackPartnerClick(): Promise<void> {
    authFetch('/api/external/track-click', { method: 'POST' }).catch(() => {});
  },

  // Admin
  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const res = await authFetch('/api/admin/analytics');
    return res.json();
  },

  async getModerationQueue(): Promise<{ reports: Report[] }> {
    const res = await authFetch('/api/admin/moderation');
    return res.json();
  },

  async takeModerationAction(reportId: string, action: string, notes?: string): Promise<{ success: boolean }> {
    const res = await authFetch(`/api/admin/moderation/${reportId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes }),
    });
    return res.json();
  },
};
