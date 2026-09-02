import { getPool } from './index.ts';

/**
 * Automatically creates all PostgreSQL tables if they don't already exist.
 * This runs seamlessly when DATABASE_URL is supplied (e.g. Neon, Supabase, Cloud SQL).
 */
export async function initializePostgresTables() {
  const pool = getPool();
  if (!pool) return;

  const client = await pool.connect();
  try {
    console.log('[Postgres Init] Verifying and creating database tables...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL DEFAULT '',
        role TEXT DEFAULT 'USER',
        is_email_verified INTEGER DEFAULT 1,
        is_age_verified INTEGER DEFAULT 1,
        is_banned INTEGER DEFAULT 0,
        subscription_tier TEXT DEFAULT 'FREE',
        subscription_expires_at TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        source_type TEXT DEFAULT 'native',
        provider_id TEXT,
        provider_name TEXT,
        external_profile_id TEXT,
        external_profile_url TEXT,
        last_synced_at TEXT,
        attribution_requirement TEXT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL DEFAULT 25,
        date_of_birth TEXT DEFAULT '1999-01-01',
        gender TEXT DEFAULT 'OTHER',
        country TEXT DEFAULT '',
        city TEXT DEFAULT '',
        region TEXT DEFAULT '',
        approx_distance_km REAL DEFAULT 15,
        bio TEXT DEFAULT '',
        cover_photo TEXT DEFAULT '',
        username TEXT,
        social_links_json TEXT DEFAULT '{}',
        website TEXT DEFAULT '',
        photos_json TEXT DEFAULT '[]',
        interests_json TEXT DEFAULT '[]',
        languages_json TEXT DEFAULT '[]',
        relationship_goal TEXT DEFAULT 'Relationship',
        education TEXT,
        profession TEXT,
        height INTEGER,
        smoking TEXT,
        drinking TEXT,
        children TEXT,
        compatibility_score INTEGER DEFAULT 85,
        is_online INTEGER DEFAULT 0,
        last_active TEXT,
        is_verified INTEGER DEFAULT 1,
        is_boosted INTEGER DEFAULT 0,
        boost_expires_at TEXT,
        is_visible INTEGER DEFAULT 1,
        show_age INTEGER DEFAULT 1,
        show_approx_location INTEGER DEFAULT 1,
        allow_calls INTEGER DEFAULT 1,
        allow_messages INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS follows (
        id TEXT PRIMARY KEY,
        follower_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        following_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      );

      CREATE TABLE IF NOT EXISTS blocks (
        id TEXT PRIMARY KEY,
        blocker_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        blocked_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(blocker_id, blocked_id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data_json TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        match_id TEXT,
        user_a_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        user_b_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
        sender_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        content TEXT,
        message_type TEXT DEFAULT 'text',
        attachment_url TEXT,
        file_name TEXT,
        file_size INTEGER,
        mime_type TEXT,
        is_read INTEGER DEFAULT 0,
        read_at TEXT,
        translated_text TEXT,
        translated_lang TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS calls (
        id TEXT PRIMARY KEY,
        caller_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TEXT,
        ended_at TEXT,
        duration INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS likes (
        id TEXT PRIMARY KEY,
        sender_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        is_super_like INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        UNIQUE(sender_id, receiver_id)
      );

      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        user_a_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        user_b_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(user_a_id, user_b_id)
      );

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        reported_user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        reported_user_name TEXT,
        category TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- Safe Alter statements for upgrades
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links_json TEXT DEFAULT '{}';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_photo TEXT DEFAULT '';
      CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
    `);

    console.log('[Postgres Init] All tables are ready in PostgreSQL database.');
  } catch (error) {
    console.error('[Postgres Init Error]:', error);
  } finally {
    client.release();
  }
}
