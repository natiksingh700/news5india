const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_C3i1csmKzWUj@ep-lingering-fog-bdkyx1qm-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDB() {
  const client = await pool.connect();
  try {
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

    console.log('✅ [Neon PostgreSQL] Database tables initialized successfully!');
  } catch (err) {
    console.error('❌ [Neon PostgreSQL] Init error:', err.message);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDB
};
