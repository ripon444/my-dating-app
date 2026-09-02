import { pgTable, text, integer, real, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull().default(''),
  role: text('role').default('USER'),
  isEmailVerified: integer('is_email_verified').default(1),
  isAgeVerified: integer('is_age_verified').default(1),
  isBanned: integer('is_banned').default(0),
  subscriptionTier: text('subscription_tier').default('FREE'),
  subscriptionExpiresAt: text('subscription_expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_users_email').on(table.email),
]);

// 2. Profiles Table (with Facebook-style coverPhoto and social fields)
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sourceType: text('source_type').default('native'),
  providerId: text('provider_id'),
  providerName: text('provider_name'),
  externalProfileId: text('external_profile_id'),
  externalProfileUrl: text('external_profile_url'),
  lastSyncedAt: text('last_synced_at'),
  attributionRequirement: text('attribution_requirement'),
  name: text('name').notNull(),
  age: integer('age').notNull().default(25),
  dateOfBirth: text('date_of_birth').default('1999-01-01'),
  gender: text('gender').default('OTHER'),
  country: text('country').default(''),
  city: text('city').default(''),
  region: text('region').default(''),
  approxDistanceKm: real('approx_distance_km').default(15),
  bio: text('bio').default(''),
  coverPhoto: text('cover_photo').default(''),
  username: text('username'),
  socialLinksJson: text('social_links_json').default('{}'),
  website: text('website').default(''),
  photosJson: text('photos_json').default('[]'),
  interestsJson: text('interests_json').default('[]'),
  languagesJson: text('languages_json').default('[]'),
  relationshipGoal: text('relationship_goal').default('Relationship'),
  education: text('education'),
  profession: text('profession'),
  height: integer('height'),
  smoking: text('smoking'),
  drinking: text('drinking'),
  children: text('children'),
  compatibilityScore: integer('compatibility_score').default(85),
  isOnline: integer('is_online').default(0),
  lastActive: text('last_active'),
  isVerified: integer('is_verified').default(1),
  isBoosted: integer('is_boosted').default(0),
  boostExpiresAt: text('boost_expires_at'),
  isVisible: integer('is_visible').default(1),
  showAge: integer('show_age').default(1),
  showApproxLocation: integer('show_approx_location').default(1),
  allowCalls: integer('allow_calls').default(1),
  allowMessages: integer('allow_messages').default(1),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (table) => [
  index('idx_profiles_user_id').on(table.userId),
  index('idx_profiles_username').on(table.username),
  index('idx_profiles_name').on(table.name),
  index('idx_profiles_city').on(table.city),
]);

// 3. Follows Table (Permanent follow relationships)
export const follows = pgTable('follows', {
  id: text('id').primaryKey(),
  followerId: text('follower_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followingId: text('following_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  uniqueIndex('idx_follows_pair').on(table.followerId, table.followingId),
  index('idx_follows_follower').on(table.followerId),
  index('idx_follows_following').on(table.followingId),
]);

// 4. Blocks Table (User blocking system)
export const blocks = pgTable('blocks', {
  id: text('id').primaryKey(),
  blockerId: text('blocker_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  blockedId: text('blocked_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  uniqueIndex('idx_blocks_pair').on(table.blockerId, table.blockedId),
  index('idx_blocks_blocker').on(table.blockerId),
  index('idx_blocks_blocked').on(table.blockedId),
]);

// 5. Notifications Table
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  dataJson: text('data_json'),
  isRead: integer('is_read').default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_notifications_user_id').on(table.userId),
  index('idx_notifications_created_at').on(table.createdAt),
]);

// 6. Sessions Table
export const sessions = pgTable('sessions', {
  token: text('token').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
}, (table) => [
  index('idx_sessions_token').on(table.token),
  index('idx_sessions_user_id').on(table.userId),
]);

// 7. Conversations Table
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  matchId: text('match_id'),
  userAId: text('user_a_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userBId: text('user_b_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('idx_conversations_user_a').on(table.userAId),
  index('idx_conversations_user_b').on(table.userBId),
]);

// 8. Messages Table
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  senderId: text('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  receiverId: text('receiver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content'),
  messageType: text('message_type').default('text'),
  attachmentUrl: text('attachment_url'),
  fileName: text('file_name'),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  isRead: integer('is_read').default(0),
  readAt: text('read_at'),
  translatedText: text('translated_text'),
  translatedLang: text('translated_lang'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_messages_conversation').on(table.conversationId),
  index('idx_messages_sender').on(table.senderId),
  index('idx_messages_receiver').on(table.receiverId),
]);

// 9. Calls Table
export const calls = pgTable('calls', {
  id: text('id').primaryKey(),
  callerId: text('caller_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  receiverId: text('receiver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  status: text('status').notNull(),
  startedAt: text('started_at'),
  endedAt: text('ended_at'),
  duration: integer('duration').default(0),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_calls_caller').on(table.callerId),
  index('idx_calls_receiver').on(table.receiverId),
]);

// 10. Likes Table
export const likes = pgTable('likes', {
  id: text('id').primaryKey(),
  senderId: text('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  receiverId: text('receiver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  isSuperLike: integer('is_super_like').default(0),
  createdAt: text('created_at').notNull(),
}, (table) => [
  uniqueIndex('idx_likes_pair').on(table.senderId, table.receiverId),
]);

// 11. Matches Table
export const matches = pgTable('matches', {
  id: text('id').primaryKey(),
  userAId: text('user_a_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userBId: text('user_b_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  uniqueIndex('idx_matches_pair').on(table.userAId, table.userBId),
]);

// 12. Reports Table
export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  reporterId: text('reporter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reportedUserId: text('reported_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reportedUserName: text('reported_user_name'),
  category: text('category').notNull(),
  reason: text('reason').notNull(),
  status: text('status').default('PENDING'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  following: many(follows, { relationName: 'user_following' }),
  followers: many(follows, { relationName: 'user_followers' }),
  notifications: many(notifications),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: 'user_following',
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: 'user_followers',
  }),
}));
