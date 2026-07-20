import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import 'dotenv/config';

async function testConnection() {
  console.log('🔍 Testing NeonDB Connection...');
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ Error: DATABASE_URL not set in environment.');
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql, { schema });

  try {
    // Read the seeded categories
    const allCategories = await db.select().from(schema.categories);
    console.log(`✅ Connection Successful! Found ${allCategories.length} categories in database.`);
    
    // Read the organization
    const orgs = await db.select().from(schema.organizations);
    console.log(`✅ Organizations: ${orgs.map(o => o.name).join(', ')}`);

    // Read the default user
    const users = await db.select().from(schema.users);
    console.log(`✅ Users in database: ${users.map(u => u.email).join(', ')}`);

    console.log('🎉 Backend Test Audit: SUCCESS');
  } catch (error) {
    console.error('❌ Database query failed:', error);
    process.exit(1);
  }
}

testConnection();
