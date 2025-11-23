const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:12345@localhost:5000/mar_abu_pm"
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running manual migration...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, '../prisma/manual-migration.sql'),
      'utf8'
    );
    
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
