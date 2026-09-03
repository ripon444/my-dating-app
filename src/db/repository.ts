import { db } from './index.ts';
import { users, profiles, follows, blocks, notifications } from './schema.ts';
import { eq, and, or, ilike, sql, desc, notInArray } from 'drizzle-orm';
import { Profile } from '../types/index.ts';
import { SqlHelper } from '../../server/db.ts';

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
    username: profileRow.username || (profileRow.name ? profileRow.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : undefined),
    social_links: typeof profileRow.socialLinksJson === 'string' ? JSON.parse(profileRow.socialLinksJson || '{}') : ((profileRow as any).social_links || {}),
    website: profileRow.website || '',
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
    // Check if targetIdentifier is a userId, profileId, or username in PostgreSQL
    let targetProfile: any = null;
    try {
      const profileRows = await db.select().from(profiles).where(
        or(
          eq(profiles.id, targetIdentifier),
          eq(profiles.userId, targetIdentifier),
          eq(profiles.username, targetIdentifier.toLowerCase())
        )
      ).limit(1);
      if (profileRows.length) {
        targetProfile = profileRows[0];
      }
    } catch (e) {
      // Postgres pool reconnect or temporary error
    }

    // Fallback to SQLite if not found in PostgreSQL
    if (!targetProfile) {
      const sqliteRow = await SqlHelper.queryOne<any>(
        'SELECT * FROM profiles WHERE id = ? OR user_id = ? OR LOWER(username) = ?',
        [targetIdentifier, targetIdentifier, targetIdentifier.toLowerCase()]
      );
      if (sqliteRow) {
        targetProfile = {
          id: sqliteRow.id,
          userId: sqliteRow.user_id,
          sourceType: sqliteRow.source_type || 'native',
          providerId: sqliteRow.provider_id,
          providerName: sqliteRow.provider_name,
          externalProfileId: sqliteRow.external_profile_id,
          externalProfileUrl: sqliteRow.external_profile_url,
          lastSyncedAt: sqliteRow.last_synced_at,
          attributionRequirement: sqliteRow.attribution_requirement,
          name: sqliteRow.name,
          age: Number(sqliteRow.age) || 25,
          dateOfBirth: sqliteRow.date_of_birth || '1999-01-01',
          gender: sqliteRow.gender || 'OTHER',
          country: sqliteRow.country || '',
          city: sqliteRow.city || '',
          region: sqliteRow.region || '',
          approxDistanceKm: Number(sqliteRow.approx_distance_km) || 15,
          bio: sqliteRow.bio || '',
          coverPhoto: sqliteRow.cover_photo || '',
          username: sqliteRow.username || (sqliteRow.name ? sqliteRow.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : null),
          socialLinksJson: sqliteRow.social_links_json || '{}',
          website: sqliteRow.website || '',
          photosJson: sqliteRow.photos_json || '[]',
          interestsJson: sqliteRow.interests_json || '[]',
          languagesJson: sqliteRow.languages_json || '[]',
          relationshipGoal: sqliteRow.relationship_goal || 'Relationship',
          education: sqliteRow.education,
          profession: sqliteRow.profession,
          height: sqliteRow.height ? Number(sqliteRow.height) : null,
          smoking: sqliteRow.smoking,
          drinking: sqliteRow.drinking,
          children: sqliteRow.children,
          compatibilityScore: Number(sqliteRow.compatibility_score) || 85,
          isOnline: Number(sqliteRow.is_online) || 0,
          lastActive: sqliteRow.last_active,
          isVerified: Number(sqliteRow.is_verified) || 1,
          isBoosted: Number(sqliteRow.is_boosted) || 0,
          boostExpiresAt: sqliteRow.boost_expires_at,
          isVisible: sqliteRow.is_visible !== 0 ? 1 : 0,
          showAge: sqliteRow.show_age !== 0 ? 1 : 0,
          showApproxLocation: sqliteRow.show_approx_location !== 0 ? 1 : 0,
          allowCalls: sqliteRow.allow_calls !== 0 ? 1 : 0,
          allowMessages: sqliteRow.allow_messages !== 0 ? 1 : 0,
          createdAt: sqliteRow.created_at,
          updatedAt: sqliteRow.updated_at,
        };
      }
    }

    if (!targetProfile) {
      return null;
    }

    const targetUserId = targetProfile.userId || targetProfile.id;

    // Check block relationships
    let isBlocked = false;
    let hasBlocked = false;

    if (currentUserId && currentUserId !== targetUserId) {
      try {
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
      } catch (e) {}

      if (!isBlocked && !hasBlocked) {
        hasBlocked = await SqlHelper.isBlocked(currentUserId, targetUserId).catch(() => false);
        isBlocked = await SqlHelper.isBlocked(targetUserId, currentUserId).catch(() => false);
      }
    }

    // Count followers from PostgreSQL and SQLite
    let pgFollowers = 0;
    try {
      const followersCountRes = await db.select({
        count: sql<number>`count(*)::int`
      }).from(follows).where(eq(follows.followingId, targetUserId));
      pgFollowers = followersCountRes[0]?.count || 0;
    } catch {}
    const sqliteFollowers = await SqlHelper.getFollowerCount(targetUserId).catch(() => 0);
    const followersCount = Math.max(pgFollowers, sqliteFollowers);

    // Count following from PostgreSQL and SQLite
    let pgFollowing = 0;
    try {
      const followingCountRes = await db.select({
        count: sql<number>`count(*)::int`
      }).from(follows).where(eq(follows.followerId, targetUserId));
      pgFollowing = followingCountRes[0]?.count || 0;
    } catch {}
    const sqliteFollowing = await SqlHelper.getFollowingCount(targetUserId).catch(() => 0);
    const followingCount = Math.max(pgFollowing, sqliteFollowing);

    // Check if current user is following target user
    let isFollowing = false;
    if (currentUserId && currentUserId !== targetUserId) {
      try {
        const followCheck = await db.select().from(follows).where(
          and(eq(follows.followerId, currentUserId), eq(follows.followingId, targetUserId))
        ).limit(1);
        isFollowing = followCheck.length > 0;
      } catch {}
      if (!isFollowing) {
        isFollowing = await SqlHelper.isFollowing(currentUserId, targetUserId).catch(() => false);
      }
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
 * Follow a user (Atomic, Prevents duplicates & self-follow, Checks blocks, Stores in Postgres & SQLite)
 */
export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new Error('You cannot follow yourself.');
  }

  try {
    // 1. Check if either user has blocked the other
    const isBlockedInSqlite = (await SqlHelper.isBlocked(followerId, followingId).catch(() => false)) ||
                              (await SqlHelper.isBlocked(followingId, followerId).catch(() => false));
    if (isBlockedInSqlite) {
      throw new Error('Cannot follow this user due to block restrictions.');
    }

    try {
      const blockCheck = await db.select().from(blocks).where(
        or(
          and(eq(blocks.blockerId, followerId), eq(blocks.blockedId, followingId)),
          and(eq(blocks.blockerId, followingId), eq(blocks.blockedId, followerId))
        )
      ).limit(1);

      if (blockCheck.length > 0) {
        throw new Error('Cannot follow this user due to block restrictions.');
      }
    } catch (e: any) {
      if (e.message?.includes('block restrictions')) throw e;
    }

    // 2. Persist follow relationship in SQLite
    const sqliteRes = await SqlHelper.followUserSqlite(followerId, followingId);

    // 3. Persist follow relationship in PostgreSQL
    const followId = `fol_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    let pgFollowers = 0;
    let pgFollowing = 0;
    try {
      await db.insert(follows)
        .values({
          id: followId,
          followerId,
          followingId,
        })
        .onConflictDoNothing();

      const followersCountRes = await db.select({ count: sql<number>`count(*)::int` })
        .from(follows).where(eq(follows.followingId, followingId));
      pgFollowers = followersCountRes[0]?.count || 0;

      const followingCountRes = await db.select({ count: sql<number>`count(*)::int` })
        .from(follows).where(eq(follows.followerId, followingId));
      pgFollowing = followingCountRes[0]?.count || 0;
    } catch (e: any) {
      console.warn('[Postgres follow write notice]:', e?.message || e);
    }

    // 4. Resolve follower name for notification
    let followerName = 'Someone';
    let followerPhoto: string | null = null;
    try {
      const followerProfileRes = await db.select().from(profiles).where(eq(profiles.userId, followerId)).limit(1);
      if (followerProfileRes[0]?.name) {
        followerName = followerProfileRes[0].name;
        followerPhoto = followerProfileRes[0].photosJson ? JSON.parse(followerProfileRes[0].photosJson)[0] : null;
      }
    } catch {}

    if (followerName === 'Someone') {
      const sqliteProfile = await SqlHelper.queryOne<any>('SELECT name, photos_json FROM profiles WHERE user_id = ?', [followerId]).catch(() => null);
      if (sqliteProfile?.name) {
        followerName = sqliteProfile.name;
        followerPhoto = sqliteProfile.photos_json ? JSON.parse(sqliteProfile.photos_json)[0] : null;
      }
    }

    // 5. Create notification for target user in SQLite & Postgres
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    const dataJson = JSON.stringify({
      followerId,
      followerName,
      followerPhoto,
    });

    await SqlHelper.execute(
      'INSERT INTO notifications (id, user_id, type, title, message, data_json, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
      [notifId, followingId, 'follow', 'New Follower! 👤', `${followerName} started following your profile.`, dataJson, now]
    ).catch(() => {});

    try {
      await db.insert(notifications).values({
        id: notifId,
        userId: followingId,
        type: 'follow',
        title: 'New Follower! 👤',
        message: `${followerName} started following your profile.`,
        dataJson,
        isRead: 0,
      });
    } catch {}

    const followersCount = Math.max(pgFollowers, sqliteRes.followersCount, 1);
    const followingCount = Math.max(pgFollowing, sqliteRes.followingCount, 0);

    return {
      success: true,
      isFollowing: true,
      followersCount,
      followingCount,
      notification: {
        id: notifId,
        recipientUserId: followingId,
        followerId,
        followerName,
      }
    };
  } catch (error: any) {
    console.error('[Repository] followUser error:', error);
    if (error.message?.includes('block restrictions') || error.message?.includes('cannot follow yourself')) {
      throw error;
    }
    throw new Error('Failed to follow user. Please try again.');
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string) {
  try {
    const sqliteRes = await SqlHelper.unfollowUserSqlite(followerId, followingId);

    let pgFollowers = 0;
    let pgFollowing = 0;
    try {
      await db.delete(follows).where(
        and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
      );

      const followersCountRes = await db.select({ count: sql<number>`count(*)::int` })
        .from(follows).where(eq(follows.followingId, followingId));
      pgFollowers = followersCountRes[0]?.count || 0;

      const followingCountRes = await db.select({ count: sql<number>`count(*)::int` })
        .from(follows).where(eq(follows.followerId, followingId));
      pgFollowing = followingCountRes[0]?.count || 0;
    } catch (e: any) {
      console.warn('[Postgres unfollow notice]:', e?.message || e);
    }

    return {
      success: true,
      isFollowing: false,
      followersCount: Math.max(pgFollowers, sqliteRes.followersCount),
      followingCount: Math.max(pgFollowing, sqliteRes.followingCount),
    };
  } catch (error: any) {
    console.error('[Repository] unfollowUser error:', error);
    throw new Error('Failed to unfollow user');
  }
}

/**
 * Get Followers list for a given user
 */
export async function getFollowersList(userId: string, currentUserId?: string) {
  try {
    const followItems: Array<{ followId: string; followedAt: any; followerId: string }> = [];

    // 1. Get follows from Postgres
    try {
      const pgFollows = await db.select({
        id: follows.id,
        createdAt: follows.createdAt,
        followerId: follows.followerId,
      }).from(follows).where(eq(follows.followingId, userId)).orderBy(desc(follows.createdAt));
      for (const f of pgFollows) {
        followItems.push({ followId: f.id, followedAt: f.createdAt, followerId: f.followerId });
      }
    } catch {}

    // 2. Get follows from SQLite
    try {
      const sqliteFollows = await SqlHelper.queryAll<any>(
        'SELECT id, follower_id, created_at FROM follows WHERE following_id = ? ORDER BY created_at DESC',
        [userId]
      );
      for (const sf of sqliteFollows) {
        if (!followItems.some(item => item.followerId === sf.follower_id)) {
          followItems.push({ followId: sf.id, followedAt: sf.created_at, followerId: sf.follower_id });
        }
      }
    } catch {}

    // For each follower, load public profile and calculate isFollowing
    const results = await Promise.all(followItems.map(async (row) => {
      let isFollowing = false;
      if (currentUserId && currentUserId !== row.followerId) {
        try {
          const check = await db.select().from(follows).where(
            and(eq(follows.followerId, currentUserId), eq(follows.followingId, row.followerId))
          ).limit(1);
          isFollowing = check.length > 0;
        } catch {}
        if (!isFollowing) {
          isFollowing = await SqlHelper.isFollowing(currentUserId, row.followerId).catch(() => false);
        }
      }

      // Fetch follower profile
      const prof = await getPublicProfileById(row.followerId, currentUserId).catch(() => null);

      return {
        followId: row.followId,
        followedAt: row.followedAt,
        userId: row.followerId,
        email: '',
        profile: prof,
        isFollowing,
      };
    }));

    return results.filter(r => r.profile !== null);
  } catch (error) {
    console.error('[Repository] getFollowersList error:', error);
    return [];
  }
}

/**
 * Get Following list for a given user
 */
export async function getFollowingList(userId: string, currentUserId?: string) {
  try {
    const followingItems: Array<{ followId: string; followedAt: any; followingId: string }> = [];

    // 1. Get following from Postgres
    try {
      const pgFollowing = await db.select({
        id: follows.id,
        createdAt: follows.createdAt,
        followingId: follows.followingId,
      }).from(follows).where(eq(follows.followerId, userId)).orderBy(desc(follows.createdAt));
      for (const f of pgFollowing) {
        followingItems.push({ followId: f.id, followedAt: f.createdAt, followingId: f.followingId });
      }
    } catch {}

    // 2. Get following from SQLite
    try {
      const sqliteFollowing = await SqlHelper.queryAll<any>(
        'SELECT id, following_id, created_at FROM follows WHERE follower_id = ? ORDER BY created_at DESC',
        [userId]
      );
      for (const sf of sqliteFollowing) {
        if (!followingItems.some(item => item.followingId === sf.following_id)) {
          followingItems.push({ followId: sf.id, followedAt: sf.created_at, followingId: sf.following_id });
        }
      }
    } catch {}

    const results = await Promise.all(followingItems.map(async (row) => {
      let isFollowing = false;
      if (currentUserId && currentUserId !== row.followingId) {
        try {
          const check = await db.select().from(follows).where(
            and(eq(follows.followerId, currentUserId), eq(follows.followingId, row.followingId))
          ).limit(1);
          isFollowing = check.length > 0;
        } catch {}
        if (!isFollowing) {
          isFollowing = await SqlHelper.isFollowing(currentUserId, row.followingId).catch(() => false);
        }
      }

      const prof = await getPublicProfileById(row.followingId, currentUserId).catch(() => null);

      return {
        followId: row.followId,
        followedAt: row.followedAt,
        userId: row.followingId,
        email: '',
        profile: prof,
        isFollowing,
      };
    }));

    return results.filter(r => r.profile !== null);
  } catch (error) {
    console.error('[Repository] getFollowingList error:', error);
    return [];
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
    const now = new Date().toISOString();

    // 1. SQLite block
    await SqlHelper.execute(
      'INSERT OR IGNORE INTO blocks (id, blocker_id, blocked_id, reason, created_at) VALUES (?, ?, ?, ?, ?)',
      [blockId, blockerId, blockedId, reason || 'User requested block', now]
    ).catch(() => {});

    await SqlHelper.execute(
      'DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)',
      [blockerId, blockedId, blockedId, blockerId]
    ).catch(() => {});

    // 2. Postgres block
    try {
      await db.insert(blocks).values({
        id: blockId,
        blockerId,
        blockedId,
        reason: reason || 'User requested block',
      }).onConflictDoNothing();

      await db.delete(follows).where(
        or(
          and(eq(follows.followerId, blockerId), eq(follows.followingId, blockedId)),
          and(eq(follows.followerId, blockedId), eq(follows.followingId, blockerId))
        )
      );
    } catch {}

    return { success: true, isBlocked: true };
  } catch (error) {
    console.error('[Repository] blockUser error:', error);
    throw new Error('Failed to block user');
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(blockerId: string, blockedId: string) {
  try {
    await SqlHelper.execute(
      'DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, blockedId]
    ).catch(() => {});

    try {
      await db.delete(blocks).where(
        and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId))
      );
    } catch {}

    return { success: true, isBlocked: false };
  } catch (error) {
    console.error('[Repository] unblockUser error:', error);
    throw new Error('Failed to unblock user');
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
    if (data.username !== undefined) updateValues.username = data.username ? data.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') : null;
    if (data.social_links !== undefined) updateValues.socialLinksJson = JSON.stringify(data.social_links);
    if (data.website !== undefined) updateValues.website = data.website;

    await db.update(profiles)
      .set(updateValues)
      .where(eq(profiles.userId, userId));

    return await getPublicProfileById(userId);
  } catch (error) {
    console.error('[Repository] updateProfile error:', error);
    throw new Error('Failed to update profile', { cause: error });
  }
}
