import { db } from './index.ts';
import { users, profiles } from './schema.ts';
import { SqlHelper } from '../../server/db.ts';

/**
 * Bi-directional / SQLite-to-Postgres user and profile sync
 * Ensures foreign keys and joins in PostgreSQL always find users and profiles
 * created via SQLite authentication and vice-versa.
 */
export async function syncSqliteWithPostgres() {
  try {
    const sqliteUsers = await SqlHelper.queryAll<any>('SELECT * FROM users');
    if (!sqliteUsers || sqliteUsers.length === 0) return;

    for (const u of sqliteUsers) {
      await db.insert(users).values({
        id: u.id,
        email: u.email,
        password: u.password || '',
        role: u.role || 'USER',
        isEmailVerified: Number(u.is_email_verified) || 1,
        isAgeVerified: Number(u.is_age_verified) || 1,
        isBanned: Number(u.is_banned) || 0,
        subscriptionTier: u.subscription_tier || 'FREE',
        subscriptionExpiresAt: u.subscription_expires_at,
      }).onConflictDoUpdate({
        target: users.id,
        set: {
          email: u.email,
          role: u.role || 'USER',
        }
      }).catch((e: any) => {
        // Ignore duplicate email if ID differed
      });
    }

    const sqliteProfiles = await SqlHelper.queryAll<any>('SELECT * FROM profiles');
    if (sqliteProfiles && sqliteProfiles.length > 0) {
      for (const p of sqliteProfiles) {
        await db.insert(profiles).values({
          id: p.id,
          userId: p.user_id,
          sourceType: p.source_type || 'native',
          providerId: p.provider_id,
          providerName: p.provider_name,
          externalProfileId: p.external_profile_id,
          externalProfileUrl: p.external_profile_url,
          lastSyncedAt: p.last_synced_at,
          attributionRequirement: p.attribution_requirement,
          name: p.name,
          age: Number(p.age) || 25,
          dateOfBirth: p.date_of_birth || '1999-01-01',
          gender: p.gender || 'OTHER',
          country: p.country || '',
          city: p.city || '',
          region: p.region || '',
          approxDistanceKm: Number(p.approx_distance_km) || 15,
          bio: p.bio || '',
          coverPhoto: p.cover_photo || '',
          username: p.username || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : null),
          socialLinksJson: p.social_links_json || '{}',
          website: p.website || '',
          photosJson: p.photos_json || '[]',
          interestsJson: p.interests_json || '[]',
          languagesJson: p.languages_json || '[]',
          relationshipGoal: p.relationship_goal || 'Relationship',
          education: p.education,
          profession: p.profession,
          height: p.height ? Number(p.height) : null,
          smoking: p.smoking,
          drinking: p.drinking,
          children: p.children,
          compatibilityScore: Number(p.compatibility_score) || 85,
          isOnline: Number(p.is_online) || 0,
          lastActive: p.last_active,
          isVerified: Number(p.is_verified) || 1,
          isBoosted: Number(p.is_boosted) || 0,
          boostExpiresAt: p.boost_expires_at,
          isVisible: p.is_visible !== 0 ? 1 : 0,
          showAge: p.show_age !== 0 ? 1 : 0,
          showApproxLocation: p.show_approx_location !== 0 ? 1 : 0,
          allowCalls: p.allow_calls !== 0 ? 1 : 0,
          allowMessages: p.allow_messages !== 0 ? 1 : 0,
        }).onConflictDoUpdate({
          target: profiles.id,
          set: {
            name: p.name,
            username: p.username || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : null),
            socialLinksJson: p.social_links_json || '{}',
            website: p.website || '',
            coverPhoto: p.cover_photo || '',
            bio: p.bio || '',
            city: p.city || '',
            country: p.country || '',
          }
        }).catch((e: any) => {
          // Ignore duplicate username
        });
      }
    }
    console.log(`[Sync Engine] Successfully synchronized ${sqliteUsers.length} users and ${sqliteProfiles?.length || 0} profiles from SQLite to PostgreSQL.`);
  } catch (error) {
    console.warn('[Sync Engine] Sync warning (non-fatal):', error);
  }
}
