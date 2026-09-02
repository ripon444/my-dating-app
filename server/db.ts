import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'globalmatch.sqlite');

let sqlDb: Database | null = null;
let initDbPromise: Promise<Database> | null = null;
let writeQueue: Promise<any> = Promise.resolve();

/**
 * Serializes all write operations to prevent race conditions or database corruption
 */
export function queueWrite<T>(op: () => Promise<T> | T): Promise<T> {
  const next = writeQueue.then(async () => {
    return await op();
  });
  writeQueue = next.catch((err) => {
    console.error('[SQL Database] Write queue task error:', err);
  });
  return next;
}

/**
 * Initializes and retrieves the singleton SQLite database instance
 */
export async function getSqlDb(): Promise<Database> {
  if (sqlDb) return sqlDb;
  if (initDbPromise) return initDbPromise;

  initDbPromise = (async () => {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    const SQL = await initSqlJs();

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileBuffer = fs.readFileSync(DB_FILE);
        if (fileBuffer.length > 0) {
          sqlDb = new SQL.Database(fileBuffer);
          console.log(`[SQL Database] Successfully opened existing SQLite database from ${DB_FILE} (${fileBuffer.length} bytes)`);
        } else {
          sqlDb = new SQL.Database();
          console.log(`[SQL Database] Existing file was empty, initialized new SQLite database`);
        }
      } catch (err) {
        console.error('[SQL Database] Error loading SQLite database from disk:', err);
        sqlDb = new SQL.Database();
      }
    } else {
      sqlDb = new SQL.Database();
      console.log(`[SQL Database] Created fresh SQLite database in memory, will persist to ${DB_FILE}`);
    }

    initTables(sqlDb);
    persistDbDirect();
    return sqlDb;
  })();

  return initDbPromise;
}

/**
 * Directly exports SQLite memory buffer to disk atomically
 */
function persistDbDirect() {
  if (!sqlDb) return;
  try {
    const data = sqlDb.export();
    const buffer = Buffer.from(data);
    const tmpFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
    fs.writeFileSync(tmpFile, buffer);
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('[SQL Database] Error persisting database to disk:', err);
  }
}

/**
 * Thread-safe asynchronous persist call
 */
export function persistDb(): Promise<void> {
  return queueWrite(() => {
    persistDbDirect();
  });
}

// Clean flush on process termination signals (Passenger / PM2 / Node.js restarts)
process.on('beforeExit', () => {
  persistDbDirect();
});
process.on('SIGINT', () => {
  persistDbDirect();
  process.exit(0);
});
process.on('SIGTERM', () => {
  persistDbDirect();
  process.exit(0);
});

function initTables(db: Database) {
  // Execute table definitions
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'USER',
      is_email_verified INTEGER DEFAULT 1,
      is_age_verified INTEGER DEFAULT 1,
      is_banned INTEGER DEFAULT 0,
      subscription_tier TEXT DEFAULT 'FREE',
      subscription_expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      source_type TEXT DEFAULT 'native',
      provider_id TEXT,
      provider_name TEXT,
      external_profile_id TEXT,
      external_profile_url TEXT,
      last_synced_at TEXT,
      attribution_requirement TEXT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      date_of_birth TEXT NOT NULL,
      gender TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      region TEXT,
      approx_distance_km REAL DEFAULT 15,
      bio TEXT,
      cover_photo TEXT,
      photos_json TEXT,
      interests_json TEXT,
      languages_json TEXT,
      relationship_goal TEXT,
      education TEXT,
      profession TEXT,
      height INTEGER,
      smoking TEXT,
      drinking TEXT,
      children TEXT,
      compatibility_score INTEGER DEFAULT 88,
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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      match_id TEXT,
      user_a_id TEXT NOT NULL,
      user_b_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
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
      caller_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT,
      ended_at TEXT,
      duration INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data_json TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      is_super_like INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      user_a_id TEXT NOT NULL,
      user_b_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      reported_user_id TEXT NOT NULL,
      reported_user_name TEXT,
      category TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      api_key_masked TEXT,
      client_id TEXT,
      status TEXT DEFAULT 'active',
      sync_interval_hours INTEGER DEFAULT 6,
      terms_url TEXT,
      privacy_url TEXT,
      attribution_requirement TEXT,
      profile_count INTEGER DEFAULT 0,
      last_synced_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      data_base64 TEXT,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_calls_users ON calls(caller_id, receiver_id);
  `);

  // Run safe schema migrations for existing databases
  try {
    db.run('ALTER TABLE profiles ADD COLUMN cover_photo TEXT;');
  } catch (e) {
    // Column already exists or table freshly created
  }
  try {
    db.run('ALTER TABLE profiles ADD COLUMN allow_calls INTEGER DEFAULT 1;');
  } catch (e) {}
  try {
    db.run('ALTER TABLE profiles ADD COLUMN allow_messages INTEGER DEFAULT 1;');
  } catch (e) {}

  // Seed default admin account if not existing
  const res = db.exec("SELECT COUNT(*) as count FROM users WHERE email = 'admin@globalmatch.com'");
  const adminCount = (res[0]?.values[0]?.[0] as number) || 0;
  if (adminCount === 0) {
    const adminId = 'usr_admin_01';
    const adminProfileId = 'prf_admin_01';
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO users (id, email, password, role, is_email_verified, is_age_verified, is_banned, subscription_tier, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, 1, 0, 'VIP', ?, ?)`,
      [adminId, 'admin@globalmatch.com', 'admin123', 'ADMIN', now, now]
    );

    db.run(
      `INSERT INTO profiles (
        id, user_id, source_type, name, age, date_of_birth, gender, country, city, region,
        approx_distance_km, bio, photos_json, interests_json, languages_json, relationship_goal,
        compatibility_score, is_online, last_active, is_verified, is_boosted, is_visible,
        show_age, show_approx_location, allow_calls, allow_messages, created_at, updated_at
      ) VALUES (
        ?, ?, 'native', 'System Administrator', 32, '1994-01-01', 'MALE', 'Global', 'Global HQ', 'Main',
        0, 'Platform Administrator and Verification Manager.', '["https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=1000&q=80"]',
        '["Security", "AI", "Global Community"]', '["English"]', 'System Management',
        100, 1, ?, 1, 0, 0, 1, 0, 0, 0, ?, ?
      )`,
      [adminProfileId, adminId, now, now, now]
    );
  }

  // Seed rich collection of demo users & global profiles
  const now = new Date().toISOString();
  const sampleProfiles = [
    {
      userId: 'usr_nat_01',
      profileId: 'prf_nat_01',
      email: 'anika.rahman@example.com',
      sourceType: 'native',
      name: 'Anika Rahman',
      age: 25,
      dob: '2001-08-14',
      gender: 'FEMALE',
      country: 'Bangladesh',
      city: 'Dhaka',
      region: 'Gulshan',
      distance: 12,
      bio: 'Software engineer at a fintech startup. I love classical Rabindra Sangeet, brewing artisan tea, and exploring historical architecture around old Dhaka.',
      photos: [
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=80',
      ],
      interests: ['Tech & AI', 'Tea Ceremonies', 'Music', 'Literature', 'Travel'],
      languages: ['Bengali', 'English'],
      relationshipGoal: 'Long-term relationship',
      education: 'B.Sc in Computer Science, BUET',
      profession: 'Senior Frontend Engineer',
      height: 165,
      smoking: 'Never',
      drinking: 'Never',
      children: 'Want someday',
      compatibility: 96,
      isOnline: 1,
      isVerified: 1,
      isBoosted: 1,
    },
    {
      userId: 'usr_nat_02',
      profileId: 'prf_nat_02',
      email: 'elena.vidal@example.com',
      sourceType: 'native',
      name: 'Elena Vidal',
      age: 26,
      dob: '2000-03-22',
      gender: 'FEMALE',
      country: 'Spain',
      city: 'Barcelona',
      region: 'Eixample',
      distance: 45,
      bio: 'Contemporary ceramic artist and Mediterranean foodie. Passionate about coastal runs, indie cinema, and cooking paella for close friends on Sunday afternoons.',
      photos: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80',
      ],
      interests: ['Ceramics', 'Culinary Arts', 'Beach Volleyball', 'Cinema', 'Design'],
      languages: ['Spanish', 'Catalan', 'English', 'French'],
      relationshipGoal: 'Long-term partner',
      education: 'Fine Arts Degree, University of Barcelona',
      profession: 'Studio Artist & Ceramicist',
      height: 170,
      smoking: 'Never',
      drinking: 'Socially',
      children: 'Open to children',
      compatibility: 92,
      isOnline: 1,
      isVerified: 1,
      isBoosted: 0,
    },
    {
      userId: 'usr_alex_01',
      profileId: 'prf_alex_01',
      email: 'alex.morgan@example.com',
      sourceType: 'native',
      name: 'Alex Morgan',
      age: 28,
      dob: '1998-05-12',
      gender: 'MALE',
      country: 'United States',
      city: 'San Francisco',
      region: 'Mission District',
      distance: 25,
      bio: 'Product designer & photographer. Exploring coffee shops, analog photography, and coastal bike routes. Searching for meaningful connection.',
      photos: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80',
      ],
      interests: ['Photography', 'Design', 'Cycling', 'Coffee', 'Cinema'],
      languages: ['English', 'Spanish'],
      relationshipGoal: 'Long-term relationship',
      education: 'B.A. in Visual Arts, Stanford',
      profession: 'Lead Product Designer',
      height: 182,
      smoking: 'Never',
      drinking: 'Socially',
      children: 'Want someday',
      compatibility: 94,
      isOnline: 1,
      isVerified: 1,
      isBoosted: 0,
    },
    {
      userId: 'usr_nat_04',
      profileId: 'prf_nat_04',
      email: 'nusrat.jahan@example.com',
      sourceType: 'native',
      name: 'Nusrat Jahan',
      age: 24,
      dob: '2002-04-10',
      gender: 'FEMALE',
      country: 'Bangladesh',
      city: 'Sylhet',
      region: 'Shahjalal Upashahar',
      distance: 30,
      bio: 'Architect passionate about sustainable urban eco-spaces, tea estate photography, and indie acoustic songs. Always up for good conversations over warm milk tea.',
      photos: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
      ],
      interests: ['Architecture', 'Photography', 'Travel', 'Art', 'Acoustic Guitar'],
      languages: ['Bengali', 'English', 'Hindi'],
      relationshipGoal: 'Long-term relationship',
      education: 'B.Arch, SUST Sylhet',
      profession: 'Landscape Architect',
      height: 162,
      smoking: 'Never',
      drinking: 'Never',
      children: 'Want someday',
      compatibility: 95,
      isOnline: 1,
      isVerified: 1,
      isBoosted: 1,
    },
    {
      userId: 'usr_nat_05',
      profileId: 'prf_nat_05',
      email: 'sophia.chen@example.com',
      sourceType: 'native',
      name: 'Sophia Chen',
      age: 26,
      dob: '2000-09-18',
      gender: 'FEMALE',
      country: 'Canada',
      city: 'Toronto',
      region: 'Yorkville',
      distance: 60,
      bio: 'Cognitive scientist and classical pianist. Lover of autumn hiking in Algonquin, warm cafes, and discussing philosophy and future tech ethics.',
      photos: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
      ],
      interests: ['Classical Piano', 'Neuroscience', 'Hiking', 'Coffee', 'Philosophy'],
      languages: ['English', 'Mandarin', 'French'],
      relationshipGoal: 'Long-term partner',
      education: 'M.Sc in Cognitive Psychology, UofT',
      profession: 'UX Research Lead',
      height: 168,
      smoking: 'Never',
      drinking: 'Socially',
      children: 'Open to children',
      compatibility: 91,
      isOnline: 1,
      isVerified: 1,
      isBoosted: 0,
    },
    {
      userId: 'usr_nat_06',
      profileId: 'prf_nat_06',
      email: 'marcus.vance@example.com',
      sourceType: 'native',
      name: 'Marcus Vance',
      age: 30,
      dob: '1996-01-25',
      gender: 'MALE',
      country: 'United States',
      city: 'New York',
      region: 'Brooklyn',
      distance: 40,
      bio: 'Documentary filmmaker & jazz drummer. Filming urban culture, browsing indie vinyl shops in Greenwich Village, and cooking rustic sourdough.',
      photos: [
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
      ],
      interests: ['Cinema', 'Jazz', 'Documentary', 'Baking', 'Urban History'],
      languages: ['English', 'Italian'],
      relationshipGoal: 'Long-term relationship',
      education: 'M.F.A Film, NYU Tisch',
      profession: 'Documentary Producer',
      height: 185,
      smoking: 'Never',
      drinking: 'Socially',
      children: 'Want someday',
      compatibility: 89,
      isOnline: 1,
      isVerified: 1,
      isBoosted: 0,
    },
    {
      userId: 'usr_nat_07',
      profileId: 'prf_nat_07',
      email: 'zara.mansoor@example.com',
      sourceType: 'native',
      name: 'Zara Al-Mansoor',
      age: 27,
      dob: '1999-12-05',
      gender: 'FEMALE',
      country: 'United Arab Emirates',
      city: 'Dubai',
      region: 'Downtown Dubai',
      distance: 85,
      bio: 'Fintech product manager and equestrian rider. Enjoys sunset desert stargazing, scuba diving in Fujairah, and reading world literature.',
      photos: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
      ],
      interests: ['Fintech', 'Equestrian', 'Scuba Diving', 'Literature', 'Travel'],
      languages: ['Arabic', 'English', 'French'],
      relationshipGoal: 'Marriage & Family',
      education: 'B.S. Business & Tech, INSEAD',
      profession: 'Head of Growth, PayTech',
      height: 172,
      smoking: 'Never',
      drinking: 'Never',
      children: 'Want children',
      compatibility: 93,
      isOnline: 1,
      isVerified: 1,
      isBoosted: 1,
    },
    {
      userId: 'usr_nat_08',
      profileId: 'prf_nat_08',
      email: 'chloe.dubois@example.com',
      sourceType: 'native',
      name: 'Chloe Dubois',
      age: 25,
      dob: '2001-06-14',
      gender: 'FEMALE',
      country: 'France',
      city: 'Paris',
      region: 'Le Marais',
      distance: 55,
      bio: 'Fashion curator and vintage book collector. Spending weekends at art galleries, baking French patisserie, and jogging along the Seine.',
      photos: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80',
      ],
      interests: ['Art History', 'Fashion', 'Baking', 'Jogging', 'Museums'],
      languages: ['French', 'English', 'Italian'],
      relationshipGoal: 'Long-term relationship',
      education: 'Sorbonne University, Art History',
      profession: 'Museum Curator',
      height: 167,
      smoking: 'Never',
      drinking: 'Socially',
      children: 'Open to children',
      compatibility: 90,
      isOnline: 1,
      isVerified: 1,
      isBoosted: 0,
    },
    {
      userId: 'usr_nat_09',
      profileId: 'prf_nat_09',
      email: 'farhan.chowdhury@example.com',
      sourceType: 'native',
      name: 'Farhan Chowdhury',
      age: 27,
      dob: '1999-02-18',
      gender: 'MALE',
      country: 'Bangladesh',
      city: 'Chittagong',
      region: 'Khulshi',
      distance: 20,
      bio: 'Marine structural engineer and outdoor photographer. Passionate about naval craft, coastal expeditions, photography, and trying local culinary delicacies.',
      photos: [
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
      ],
      interests: ['Marine Tech', 'Photography', 'Camping', 'Football', 'Food'],
      languages: ['Bengali', 'English'],
      relationshipGoal: 'Long-term relationship',
      education: 'B.Sc Naval Architecture, CUET',
      profession: 'Senior Marine Engineer',
      height: 178,
      smoking: 'Never',
      drinking: 'Never',
      children: 'Want someday',
      compatibility: 94,
      isOnline: 1,
      isVerified: 1,
      isBoosted: 1,
    },
    {
      userId: 'usr_nat_10',
      profileId: 'prf_nat_10',
      email: 'maya.sharma@example.com',
      sourceType: 'native',
      name: 'Maya Sharma',
      age: 26,
      dob: '2000-11-20',
      gender: 'FEMALE',
      country: 'India',
      city: 'Mumbai',
      region: 'Bandra West',
      distance: 70,
      bio: 'AI healthcare researcher and certified yoga practitioner. Enthusiastic about sunrise meditation, indie podcasts, and street food tours across the subcontinent.',
      photos: [
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=80',
      ],
      interests: ['AI in Medicine', 'Yoga', 'Podcasts', 'Meditation', 'Culinary'],
      languages: ['Hindi', 'English', 'Marathi'],
      relationshipGoal: 'Long-term partner',
      education: 'M.Tech AI, IIT Bombay',
      profession: 'Biomedical Data Scientist',
      height: 166,
      smoking: 'Never',
      drinking: 'Socially',
      children: 'Want someday',
      compatibility: 95,
      isOnline: 1,
      isVerified: 1,
      isBoosted: 0,
    },
    {
      userId: 'usr_nat_11',
      profileId: 'prf_nat_11',
      email: 'liam.oconnor@example.com',
      sourceType: 'native',
      name: "Liam O'Connor",
      age: 29,
      dob: '1997-07-11',
      gender: 'MALE',
      country: 'Ireland',
      city: 'Dublin',
      region: 'Temple Bar',
      distance: 90,
      bio: 'Marine biologist and Atlantic surfer. Dedicated to ocean conservation, playing Irish folk fiddle, and hiking the Wild Atlantic Way.',
      photos: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=1000&q=80',
      ],
      interests: ['Marine Biology', 'Surfing', 'Folk Music', 'Hiking', 'Wildlife'],
      languages: ['English', 'Irish', 'Spanish'],
      relationshipGoal: 'Long-term relationship',
      education: 'Ph.D Marine Sciences, Trinity College',
      profession: 'Marine Conservation Scientist',
      height: 183,
      smoking: 'Never',
      drinking: 'Socially',
      children: 'Want someday',
      compatibility: 88,
      isOnline: 1,
      isVerified: 1,
      isBoosted: 0,
    },
  ];

  // Insert or update all sample users and native profiles
  for (const p of sampleProfiles) {
    db.run(
      `INSERT OR REPLACE INTO users (id, email, password, role, is_email_verified, is_age_verified, is_banned, subscription_tier, created_at, updated_at)
       VALUES (?, ?, ?, 'USER', 1, 1, 0, 'PREMIUM', ?, ?)`,
      [p.userId, p.email, 'password123', now, now]
    );

    db.run(
      `INSERT OR REPLACE INTO profiles (
        id, user_id, source_type, name, age, date_of_birth, gender, country, city, region,
        approx_distance_km, bio, photos_json, interests_json, languages_json, relationship_goal,
        education, profession, height, smoking, drinking, children,
        compatibility_score, is_online, last_active, is_verified, is_boosted, is_visible,
        show_age, show_approx_location, allow_calls, allow_messages, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        1, 1, 1, 1, ?, ?
      )`,
      [
        p.profileId,
        p.userId,
        p.sourceType,
        p.name,
        p.age,
        p.dob,
        p.gender,
        p.country,
        p.city,
        p.region,
        p.distance,
        p.bio,
        JSON.stringify(p.photos),
        JSON.stringify(p.interests),
        JSON.stringify(p.languages),
        p.relationshipGoal,
        p.education,
        p.profession,
        p.height,
        p.smoking,
        p.drinking,
        p.children,
        p.compatibility,
        p.isOnline,
        now,
        p.isVerified,
        p.isBoosted,
        1,
        now,
        now,
      ]
    );
  }

  // Add External Providers
  db.run(`
    INSERT OR REPLACE INTO providers (id, name, base_url, api_key_masked, client_id, status, sync_interval_hours, terms_url, privacy_url, attribution_requirement, profile_count, last_synced_at, created_at)
    VALUES
    ('prov_affinity', 'Affinity Global Alliance', 'https://api.affinityglobal.example.com/v2/feed', 'aff_live_****************9a2f', 'affinity-partner-prod-88', 'active', 6, 'https://affinityglobal.example.com/terms', 'https://affinityglobal.example.com/privacy', 'Powered by Affinity Global Alliance Licensed Network', 3, ?, ?),
    ('prov_komorebi', 'Komorebi Partner Network (Japan & East Asia)', 'https://partner.komorebimatch.jp/api/syndication', 'kmb_sec_****************88e1', 'komorebi-tokyo-feed', 'active', 12, 'https://komorebimatch.jp/terms', 'https://komorebimatch.jp/privacy', 'Syndicated via Komorebi East Asia Match Partner', 2, ?, ?)
  `, [now, now, now, now]);

  // Add External Profiles
  db.run(`
    INSERT OR REPLACE INTO profiles (
      id, source_type, provider_id, provider_name, external_profile_id, external_profile_url,
      last_synced_at, attribution_requirement, name, age, date_of_birth, gender, country, city, region,
      approx_distance_km, bio, photos_json, interests_json, languages_json, relationship_goal,
      education, profession, height, smoking, drinking, children,
      compatibility_score, is_online, last_active, is_verified, is_boosted, is_visible,
      show_age, show_approx_location, allow_calls, allow_messages, created_at, updated_at
    ) VALUES
    (
      'prf_ext_01', 'external', 'prov_affinity', 'Affinity Global Alliance', 'aff_gb_9921', 'https://affinityglobal.example.com/profiles/aff_gb_9921',
      ?, 'Powered by Affinity Global Alliance Licensed Network', 'Julian Sterling', 30, '1996-11-04', 'MALE', 'United Kingdom', 'London', 'Kensington',
      110, 'Venture investor focused on green energy and clean tech. Avid rower on the Thames, marathon runner, and amateur violinist. Looking to connect with globally minded individuals.',
      '["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=1000&q=80"]',
      '["Green Tech", "Rowing", "Classical Music", "Marathon", "History"]', '["English", "German"]', 'Marriage & Family',
      'Oxford University, PPE', 'Partner at Climate Capital', 186, 'Never', 'Socially', 'Want children',
      87, 1, ?, 1, 0, 1, 1, 1, 0, 0, ?, ?
    ),
    (
      'prf_ext_02', 'external', 'prov_komorebi', 'Komorebi Partner Network', 'kmb_jp_3301', 'https://komorebimatch.jp/profiles/kmb_jp_3301',
      ?, 'Syndicated via Komorebi East Asia Match Partner', 'Sayaka Takahashi', 27, '1999-07-30', 'FEMALE', 'Japan', 'Kyoto', 'Higashiyama',
      150, 'Kimono fabric designer combining traditional Kyoto dye arts with modern eco-friendly materials. Cherishing peaceful mornings, matcha, and mountain temples.',
      '["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80"]',
      '["Textile Design", "Matcha", "Temple Architecture", "Gardening", "Travel"]', '["Japanese", "English"]', 'Long-term partner',
      'Kyoto Institute of Technology', 'Textile Artisan', 162, 'Never', 'Rarely', 'Want someday',
      93, 1, ?, 1, 0, 1, 1, 1, 0, 0, ?, ?
    )
  `, [now, now, now, now, now, now, now, now]);
}

// SQL Query Helpers for typed and structured operations
export class SqlHelper {
  static async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const db = await getSqlDb();
    const cleanParams = params.map((p) => (p === undefined ? null : p));
    const stmt = db.prepare(sql);
    try {
      stmt.bind(cleanParams);
      if (stmt.step()) {
        const row = stmt.getAsObject() as T;
        return row;
      }
      return null;
    } finally {
      stmt.free();
    }
  }

  static async queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const db = await getSqlDb();
    const cleanParams = params.map((p) => (p === undefined ? null : p));
    const stmt = db.prepare(sql);
    const results: T[] = [];
    try {
      stmt.bind(cleanParams);
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
      }
      return results;
    } finally {
      stmt.free();
    }
  }

  static async execute(sql: string, params: any[] = []): Promise<void> {
    return queueWrite(async () => {
      const db = await getSqlDb();
      const cleanParams = params.map((p) => (p === undefined ? null : p));
      db.run(sql, cleanParams);
      persistDbDirect();
    });
  }

  static async transaction<T>(callback: (db: Database) => Promise<T> | T): Promise<T> {
    return queueWrite(async () => {
      const db = await getSqlDb();
      db.run('BEGIN TRANSACTION');
      try {
        const res = await callback(db);
        db.run('COMMIT');
        persistDbDirect();
        return res;
      } catch (err) {
        db.run('ROLLBACK');
        throw err;
      }
    });
  }
}

