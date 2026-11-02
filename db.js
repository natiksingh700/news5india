const dns = require('dns');
const { Pool } = require('pg');

// Render/Neon may return an IPv6 address that is unreachable from the instance.
// Prefer IPv4 when Node resolves the database hostname.
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is missing. Add your Neon PostgreSQL connection string in Render Environment Variables.');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDB() {
  let client;
  try {
    client = await pool.connect();
    // 1. Articles Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        excerpt TEXT,
        category VARCHAR(50),
        category_slug VARCHAR(50),
        author VARCHAR(100),
        date VARCHAR(50),
        read_time VARCHAR(20),
        image TEXT,
        views VARCHAR(20),
        content TEXT,
        state VARCHAR(50),
        state_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Instagram Stories Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS instagram_stories (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        image TEXT,
        category VARCHAR(50),
        insta_url TEXT,
        date VARCHAR(50),
        views VARCHAR(20),
        is_instagram BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);


    // 3. User accounts (public users and the single configured admin)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        username VARCHAR(40) NOT NULL UNIQUE,
        email VARCHAR(254) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Admin-published reels. Existing Instagram stories are left untouched.
    await client.query(`
      CREATE TABLE IF NOT EXISTS reels (
        id BIGSERIAL PRIMARY KEY,
        title VARCHAR(180) NOT NULL,
        description TEXT NOT NULL,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        category VARCHAR(80) DEFAULT 'Other',
        created_by BIGINT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Per-user saved reels. Each account has its own saved list.
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_reels (
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reel_id BIGINT NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, reel_id)
      );
    `);

    // 5. Admin-managed sticky sidebar advertisement. Images are stored persistently in PostgreSQL.
    await client.query(`
      CREATE TABLE IF NOT EXISTS advertisements (
        id BIGSERIAL PRIMARY KEY,
        title VARCHAR(140) NOT NULL,
        sponsor VARCHAR(100) DEFAULT 'प्रायोजित',
        click_url TEXT,
        image_data TEXT NOT NULL,
        mime_type VARCHAR(40) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by BIGINT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Upgrade existing ads table to three independent slots, preserving existing slot-1 ad.
    await client.query(`ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS slot_no SMALLINT NOT NULL DEFAULT 1`);
    await client.query(`DROP INDEX IF EXISTS advertisements_single_active_idx`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS advertisements_one_active_per_slot_idx ON advertisements (slot_no) WHERE is_active = TRUE`);

    console.log('✅ [Neon PostgreSQL] Database tables initialized successfully!');
    return true;
  } catch (err) {
    console.error('❌ [Neon PostgreSQL] Init error:', err.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

module.exports = {
  pool,
  initDB
};
