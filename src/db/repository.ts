import { db } from './index.ts';
import { users, profiles, follows, blocks, notifications } from './schema.ts';
import { eq, and, or, ilike, sql, desc, notInArray } from 'drizzle-orm';
import { Profile } from '../types/index.ts';

// Helper to format a DB profile row into application Profile object
export function formatDbProfile(profileRow: any, extra?: { followers_count?: number; following_count?: number; is_following?: boolean; is_blocked?: boolean; has_blocked?: boolean }): Profile {
  if (!profileRow) return null as any;
  
  let photos: string[] = [];
  try {
    photos = typeof profileRow.photosJson === 'string' ? JSON.parse(profileRow.photosJson) : (profileRow.photos || []);
  } catch (e) {
    photos = [];
  }

  let interests: string[] = [];
  try {
    interests = typeof profileRow.interestsJson === 'string' ? JSON.parse(profileRow.interestsJson) : (profileRow.interests || []);
  } catch (e) {
    interests = [];
  }

  let languages: string[] = [];
  try {
    languages = typeof profileRow.languagesJson === 'string' ? JSON.parse(profileRow.languagesJson) : (profileRow.languages || []);
  } catch (e) {
    languages = [];
  }

  return {
    id: profileRow.id,
    source_type: (profileRow.sourceType as any) || 'native',
    user_id: profileRow.userId,
    provider_id: profileRow.providerId,
    provider_name: profileRow.providerName,
    external_profile_id: profileRow.externalProfileId,
    external_profile_url: profileRow.externalProfileUrl,
    last_synced_at: profileRow.lastSyncedAt,
    attribution_requirement: profileRow.attributionRequirement,
    name: profileRow.name,
    age: Number(profileRow.age) || 25,
    date_of_birth: profileRow.dateOfBirth,
    gender: profileRow.gender || 'OTHER',
    country: profileRow.country || '',
    city: profileRow.city || '',
    region: profileRow.region || '',
    approx_distance_km: Number(profileRow.approxDistanceKm) || 15,
    bio: profileRow.bio || '',
    cover_photo: profileRow.coverPhoto || '',
    photos,
    interests,
    languages,
    relationship_goal: profileRow.relationshipGoal || 'Relationship',
    education: profileRow.education,
    profession: profileRow.profession,
    height: profileRow.height ? Number(profileRow.height) : undefined,
    smoking: profileRow.smoking,
    drinking: profileRow.drinking,
    children: profileRow.children,
    compatibility_score: Number(profileRow.compatibilityScore) || 85,
    is_online: Boolean(profileRow.isOnline),
    last_active: profileRow.lastActive || new Date().toISOString(),
    is_verified: Boolean(profileRow.isVerified),
    is_boosted: Boolean(profileRow.isBoosted),
    boost_expires_at: profileRow.boostExpiresAt,
    is_visible: profileRow.isVisible !== 0,
    show_age: profileRow.showAge !== 0,
    show_approx_location: profileRow.showApproxLocation !== 0,
    allow_calls: profileRow.allowCalls !== 0,
    allow_messages: profileRow.allowMessages !== 0,
    created_at: typeof profileRow.createdAt === 'string' ? profileRow.createdAt : (profileRow.createdAt?.toISOString() || new Date().toISOString()),
    updated_at: typeof profileRow.updatedAt === 'string' ? profileRow.updatedAt : (profileRow.updatedAt?.toISOString() || new Date().toISOString()),
    followers_count: extra?.followers_count ?? 0,
    following_count: extra?.following_count ?? 0,
    is_following: extra?.is_following ?? false,
    is_blocked: extra?.is_blocked ?? false,
    has_blocked: extra?.has_blocked ?? false,
  };
}

/**
 * Get Public Profile with full social statistics, follow state, and block validation
 */
export async function getPublicProfileById(targetIdentifier: string, currentUserId?: string) {
  try {
    // Check if targetIdentifier is a userId or profileId
    const profileRows = await db.select().from(profiles).where(
      or(
        eq(profiles.id, targetIdentifier),
        eq(profiles.userId, targetIdentifier)
      )
    ).limit(1);

    if (!profileRows.length) {
      return null;
    }

    const targetProfile = profileRows[0];
    const targetUserId = targetProfile.userId || targetProfile.id;

    // Check block relationships
    let isBlocked = false;
    let hasBlocked = false;

    if (currentUserId && currentUserId !== targetUserId) {
      const blockRecords = await db.select().from(blocks).where(
        or(
          and(eq(blocks.blockerId, currentUserId), eq(blocks.blockedId, targetUserId)),
          and(eq(blocks.blockerId, targetUserId), eq(blocks.blockedId, currentUserId))
        )
      );

      for (const b of blockRecords) {
        if (b.blockerId === currentUserId) hasBlocked = true;
        if (b.blockerId === targetUserId) isBlocked = true;
      }
    }

    // Count followers
    const followersCountRes = await db.select({
      count: sql<number>`count(*)::int`
    }).from(follows).where(eq(follows.followingId, targetUserId));
    const followersCount = followersCountRes[0]?.count || 0;

    // Count following
    const followingCountRes = await db.select({
      count: sql<number>`count(*)::int`
    }).from(follows).where(eq(follows.followerId, targetUserId));
    const followingCount = followingCountRes[0]?.count || 0;

    // Check if current user is following target user
    let isFollowing = false;
    if (currentUserId && currentUserId !== targetUserId) {
      const followCheck = await db.select().from(follows).where(
        and(eq(follows.followerId, currentUserId), eq(follows.followingId, targetUserId))
      ).limit(1);
      isFollowing = followCheck.length > 0;
    }

    return formatDbProfile(targetProfile, {
      followers_count: followersCount,
      following_count: followingCount,
      is_following: isFollowing,
      is_blocked: isBlocked,
      has_blocked: hasBlocked,
    });
  } catch (error) {
    console.error('[Repository] getPublicProfileById failed:', error);
    throw new Error('Failed to retrieve user profile', { cause: error });
  }
}

/**
 * Follow a user (Atomic, Prevents duplicates & self-follow, Checks blocks, Stores in PostgreSQL)
 */
export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new Error('You cannot follow yourself.');
  }

  try {
    // 1. Check if either user has blocked the other
    const blockCheck = await db.select().from(blocks).where(
      or(
        and(eq(blocks.blockerId, followerId), eq(blocks.blockedId, followingId)),
        and(eq(blocks.blockerId, followingId), eq(blocks.blockedId, followerId))
      )
    ).limit(1);

    if (blockCheck.length > 0) {
      throw new Error('Cannot follow this user due to block restrictions.');
    }

    // 2. Insert follow relationship (idempotent)
    const followId = `fol_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await db.insert(follows)
      .values({
        id: followId,
        followerId,
        followingId,
      })
      .onConflictDoNothing();

    // 3. Create notification for the target user in PostgreSQL
    const followerProfileRes = await db.select().from(profiles).where(eq(profiles.userId, followerId)).limit(1);
    const followerName = followerProfileRes[0]?.name || 'Someone';

    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await db.insert(notifications).values({
      id: notifId,
      userId: followingId,
      type: 'follow',
      title: 'New Follower! 👤',
      message: `${followerName} started following your profile.`,
      dataJson: JSON.stringify({
        followerId,
        followerName,
        followerPhoto: followerProfileRes[0]?.photosJson ? JSON.parse(followerProfileRes[0].photosJson)[0] : null,
      }),
      isRead: 0,
    });

    // 4. Return updated statistics
    const followersCountRes = await db.select({ count: sql<number>`count(*)::int` })
      .from(follows).where(eq(follows.followingId, followingId));
    const followingCountRes = await db.select({ count: sql<number>`count(*)::int` })
      .from(follows).where(eq(follows.followerId, followingId));

    return {
      success: true,
      isFollowing: true,
      followersCount: followersCountRes[0]?.count || 0,
      followingCount: followingCountRes[0]?.count || 0,
      notification: {
        id: notifId,
        recipientUserId: followingId,
        followerId,
        followerName,
      }
    };
  } catch (error: any) {
    console.error('[Repository] followUser error:', error);
    throw new Error(error.message || 'Failed to follow user', { cause: error });
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string) {
  try {
    await db.delete(follows).where(
      and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
    );

    const followersCountRes = await db.select({ count: sql<number>`count(*)::int` })
      .from(follows).where(eq(follows.followingId, followingId));
    const followingCountRes = await db.select({ count: sql<number>`count(*)::int` })
      .from(follows).where(eq(follows.followerId, followingId));

    return {
      success: true,
      isFollowing: false,
      followersCount: followersCountRes[0]?.count || 0,
      followingCount: followingCountRes[0]?.count || 0,
    };
  } catch (error) {
    console.error('[Repository] unfollowUser error:', error);
    throw new Error('Failed to unfollow user', { cause: error });
  }
}

/**
 * Get Followers list for a given user
 */
export async function getFollowersList(userId: string, currentUserId?: string) {
  try {
    const followerRows = await db.select({
      followId: follows.id,
      followedAt: follows.createdAt,
      profile: profiles,
      user: users,
    })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(follows.followingId, userId))
      .orderBy(desc(follows.createdAt));

    // For each follower, determine if currentUserId follows them
    const results = await Promise.all(followerRows.map(async (row) => {
      let isFollowing = false;
      if (currentUserId && currentUserId !== row.user.id) {
        const check = await db.select().from(follows).where(
          and(eq(follows.followerId, currentUserId), eq(follows.followingId, row.user.id))
        ).limit(1);
        isFollowing = check.length > 0;
      }

      return {
        followId: row.followId,
        followedAt: row.followedAt,
        userId: row.user.id,
        email: row.user.email,
        profile: formatDbProfile(row.profile, { is_following: isFollowing }),
        isFollowing,
      };
    }));

    return results;
  } catch (error) {
    console.error('[Repository] getFollowersList error:', error);
    throw new Error('Failed to retrieve followers list', { cause: error });
  }
}

/**
 * Get Following list for a given user
 */
export async function getFollowingList(userId: string, currentUserId?: string) {
  try {
    const followingRows = await db.select({
      followId: follows.id,
      followedAt: follows.createdAt,
      profile: profiles,
      user: users,
    })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(follows.followerId, userId))
      .orderBy(desc(follows.createdAt));

    const results = await Promise.all(followingRows.map(async (row) => {
      let isFollowing = false;
      if (currentUserId && currentUserId !== row.user.id) {
        const check = await db.select().from(follows).where(
          and(eq(follows.followerId, currentUserId), eq(follows.followingId, row.user.id))
        ).limit(1);
        isFollowing = check.length > 0;
      }

      return {
        followId: row.followId,
        followedAt: row.followedAt,
        userId: row.user.id,
        email: row.user.email,
        profile: formatDbProfile(row.profile, { is_following: isFollowing }),
        isFollowing,
      };
    }));

    return results;
  } catch (error) {
    console.error('[Repository] getFollowingList error:', error);
    throw new Error('Failed to retrieve following list', { cause: error });
  }
}

/**
 * Block a user & remove reciprocal follow records
 */
export async function blockUser(blockerId: string, blockedId: string, reason?: string) {
  if (blockerId === blockedId) {
    throw new Error('You cannot block yourself.');
  }

  try {
    const blockId = `blk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await db.insert(blocks).values({
      id: blockId,
      blockerId,
      blockedId,
      reason: reason || 'User requested block',
    }).onConflictDoNothing();

    // Remove any existing follow relationships between both users
    await db.delete(follows).where(
      or(
        and(eq(follows.followerId, blockerId), eq(follows.followingId, blockedId)),
        and(eq(follows.followerId, blockedId), eq(follows.followingId, blockerId))
      )
    );

    return { success: true, isBlocked: true };
  } catch (error) {
    console.error('[Repository] blockUser error:', error);
    throw new Error('Failed to block user', { cause: error });
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(blockerId: string, blockedId: string) {
  try {
    await db.delete(blocks).where(
      and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId))
    );
    return { success: true, isBlocked: false };
  } catch (error) {
    console.error('[Repository] unblockUser error:', error);
    throw new Error('Failed to unblock user', { cause: error });
  }
}

/**
 * Search real users from PostgreSQL
 */
export async function searchRealUsers(searchTerm: string, currentUserId?: string, limit = 20) {
  try {
    const term = `%${searchTerm.trim()}%`;

    // Filter out blocked users if currentUserId provided
    let blockedIds: string[] = [];
    if (currentUserId) {
      const userBlocks = await db.select().from(blocks).where(
        or(eq(blocks.blockerId, currentUserId), eq(blocks.blockedId, currentUserId))
      );
      blockedIds = userBlocks.map(b => b.blockerId === currentUserId ? b.blockedId : b.blockerId);
    }

    let query = db.select({
      profile: profiles,
      user: users,
    })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(
        and(
          eq(users.isBanned, 0),
          or(
            ilike(profiles.name, term),
            ilike(profiles.city, term),
            ilike(profiles.country, term),
            ilike(profiles.profession, term),
            ilike(profiles.bio, term),
            ilike(users.email, term)
          )
        )
      )
      .limit(limit);

    const rows = await query;

    const filtered = blockedIds.length > 0 
      ? rows.filter(r => !blockedIds.includes(r.user.id))
      : rows;

    return await Promise.all(filtered.map(async (r) => {
      let isFollowing = false;
      if (currentUserId && currentUserId !== r.user.id) {
        const check = await db.select().from(follows).where(
          and(eq(follows.followerId, currentUserId), eq(follows.followingId, r.user.id))
        ).limit(1);
        isFollowing = check.length > 0;
      }

      const followersCountRes = await db.select({ count: sql<number>`count(*)::int` })
        .from(follows).where(eq(follows.followingId, r.user.id));

      return formatDbProfile(r.profile, {
        followers_count: followersCountRes[0]?.count || 0,
        is_following: isFollowing,
      });
    }));
  } catch (error) {
    console.error('[Repository] searchRealUsers error:', error);
    throw new Error('Failed to search users', { cause: error });
  }
}

/**
 * Update Profile (including coverPhoto, bio, location, etc.)
 */
export async function updateProfile(userId: string, data: Partial<Profile>) {
  try {
    const updateValues: any = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) updateValues.name = data.name;
    if (data.bio !== undefined) updateValues.bio = data.bio;
    if (data.cover_photo !== undefined) updateValues.coverPhoto = data.cover_photo;
    if (data.city !== undefined) updateValues.city = data.city;
    if (data.country !== undefined) updateValues.country = data.country;
    if (data.profession !== undefined) updateValues.profession = data.profession;
    if (data.education !== undefined) updateValues.education = data.education;
    if (data.relationship_goal !== undefined) updateValues.relationshipGoal = data.relationship_goal;
    if (data.gender !== undefined) updateValues.gender = data.gender;
    if (data.age !== undefined) updateValues.age = data.age;
    if (data.photos !== undefined) updateValues.photosJson = JSON.stringify(data.photos);
    if (data.interests !== undefined) updateValues.interestsJson = JSON.stringify(data.interests);
    if (data.languages !== undefined) updateValues.languagesJson = JSON.stringify(data.languages);

    await db.update(profiles)
      .set(updateValues)
      .where(eq(profiles.userId, userId));

    return await getPublicProfileById(userId);
  } catch (error) {
    console.error('[Repository] updateProfile error:', error);
    throw new Error('Failed to update profile', { cause: error });
  }
}
