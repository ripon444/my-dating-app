// Unified Types for Global Dating & Partner Platform

export type Role = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';

export type SourceType = 'native' | 'external';

export type MatchStatus = 'active' | 'unmatched' | 'blocked';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'system';

export type CallType = 'voice' | 'video';

export type CallStatus = 'ringing' | 'accepted' | 'rejected' | 'missed' | 'ended';

export type SubscriptionTier = 'FREE' | 'PREMIUM' | 'VIP';

export type ReportCategory = 
  | 'Spam' 
  | 'Scam' 
  | 'Harassment' 
  | 'Fake profile' 
  | 'Impersonation' 
  | 'Inappropriate content' 
  | 'Underage user' 
  | 'Other';

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'ACTION_TAKEN' | 'DISMISSED';

export type ProviderStatus = 'active' | 'inactive' | 'error';

export interface User {
  id: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  isAgeVerified: boolean;
  isBanned: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfilePhoto {
  id: string;
  profileId: string;
  url: string;
  thumbnailUrl?: string;
  isPrimary: boolean;
  order: number;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string;
  telegram?: string;
  github?: string;
  website?: string;
}

export interface Profile {
  id: string;
  source_type: SourceType;
  user_id?: string;
  username?: string;
  social_links?: SocialLinks;
  website?: string;
  
  // External Provider attributes (Mandatory for external)
  provider_id?: string;
  provider_name?: string;
  external_profile_id?: string;
  external_profile_url?: string;
  last_synced_at?: string;
  attribution_requirement?: string;

  // Unified Profile Fields
  name: string;
  age: number;
  date_of_birth?: string;
  gender: Gender;
  country: string;
  city: string;
  region?: string;
  approx_distance_km?: number;
  bio: string;
  cover_photo?: string;
  photos: string[]; // List of image URLs
  interests: string[];
  languages: string[];
  relationship_goal: string;
  education?: string;
  profession?: string;
  height?: number; // cm
  smoking?: string;
  drinking?: string;
  children?: string;

  // Social & Follow stats
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
  is_blocked?: boolean;
  has_blocked?: boolean;

  // Real-time and Discovery Metadata
  compatibility_score: number;
  is_online: boolean;
  last_active?: string;
  is_verified?: boolean;
  is_boosted?: boolean;
  boost_expires_at?: string;

  // Privacy options
  is_visible?: boolean;
  show_age?: boolean;
  show_approx_location?: boolean;
  allow_calls?: boolean;
  allow_messages?: boolean;

  created_at: string;
  updated_at: string;
}

export interface Preferences {
  userId: string;
  minAge: number;
  maxAge: number;
  interestedIn: Gender[];
  targetCountries: string[];
  maxDistanceKm: number;
  languages: string[];
  relationshipGoals: string[];
  sourceFilter: 'ALL' | 'NATIVE' | 'PARTNER';
}

export interface Like {
  id: string;
  sender_id: string;
  receiver_id: string;
  is_super_like: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: MatchStatus;
  created_at: string;
  updated_at?: string;
  matched_profile: Profile;
  last_message?: string;
  unread_count?: number;
}

export interface Conversation {
  id: string;
  match_id?: string;
  user_a_id: string;
  user_b_id: string;
  other_user: Profile;
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface MessageAttachment {
  url: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  duration?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_type: MessageType;
  content: string;
  attachment_url?: string;
  attachment?: MessageAttachment;
  file_name?: string;
  file_size?: number;
  translated_text?: string;
  translated_lang?: string;
  is_translating?: boolean;
  created_at: string;
  delivered_at?: string;
  read_at?: string;
  deleted_at?: string;
}

export interface Call {
  id: string;
  caller_id: string;
  receiver_id: string;
  caller_profile: Profile;
  receiver_profile: Profile;
  type: CallType;
  status: CallStatus;
  started_at?: string;
  ended_at?: string;
  duration: number; // in seconds
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  user_id?: string;
  profile?: Profile;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'like' | 'match' | 'message' | 'call' | 'system' | 'boost' | 'follow' | 'block';
  title: string;
  message: string;
  data?: Record<string, any>;
  data_json?: string;
  is_read: boolean;
  created_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reported_user_name: string;
  category: ReportCategory;
  reason: string;
  status: ReportStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ExternalProvider {
  id: string;
  name: string;
  base_url: string;
  api_key_masked: string;
  client_id?: string;
  status: ProviderStatus;
  sync_interval_hours: number;
  terms_url: string;
  privacy_url: string;
  attribution_requirement: string;
  profile_count: number;
  last_synced_at?: string;
  created_at: string;
}

export interface ExternalSyncLog {
  id: string;
  provider_id: string;
  provider_name: string;
  started_at: string;
  completed_at?: string;
  profiles_fetched: number;
  profiles_updated: number;
  profiles_removed: number;
  error_count: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'RUNNING';
  error_message?: string;
}

export interface Boost {
  id: string;
  user_id: string;
  duration_minutes: number;
  started_at: string;
  expires_at: string;
  status: 'ACTIVE' | 'EXPIRED';
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  popular?: boolean;
  badge?: string;
}

export interface DiscoveryFilters {
  minAge: number;
  maxAge: number;
  gender: Gender | 'ALL';
  country: string;
  city: string;
  maxDistance: number;
  languages: string[];
  interests: string[];
  relationshipGoal: string;
  onlineOnly: boolean;
  profileSource: 'ALL' | 'NATIVE' | 'PARTNER';
}

export interface ExternalProviderAdapter {
  providerId: string;
  getProviderName(): string;
  searchProfiles(filters: Partial<DiscoveryFilters>): Promise<Profile[]>;
  getProfile(externalProfileId: string): Promise<Profile | null>;
  getProfileUrl(externalProfileId: string): string;
  syncProfiles(): Promise<{
    fetched: number;
    updated: number;
    removed: number;
    errors: number;
  }>;
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  nativeProfilesCount: number;
  externalProfilesCount: number;
  totalMatches: number;
  totalMessages: number;
  totalCalls: number;
  pendingReports: number;
  activeSubscriptions: number;
  totalRevenueUsd: number;
  externalProfileClicks: number;
  callsByDay: { date: string; voice: number; video: number }[];
  registrationsByCountry: { country: string; count: number }[];
}
