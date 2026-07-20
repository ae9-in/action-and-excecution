import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log('🌱 Seeding database...');

  // 1. Create default organization
  const [org] = await db
    .insert(schema.organizations)
    .values({ name: 'Acme Corp', slug: 'acme-corp' })
    .onConflictDoNothing()
    .returning();

  if (!org) {
    console.log('Organization already exists, skipping...');
  } else {
    console.log('✅ Created organization:', org.name);

    // 2. Create super_admin user
    const passwordHash = await bcrypt.hash('Password123!', 12);
    await db
      .insert(schema.users)
      .values({
        orgId: org.id,
        email: 'admin@acme.com',
        fullName: 'Super Admin',
        passwordHash,
        role: 'super_admin',
        isActive: true,
      })
      .onConflictDoNothing();
    console.log('✅ Created super_admin: admin@acme.com / Password123!');
  }

  // 3. Seed the 18 categories
  const categoryData = [
    { key: 'sops', label: 'SOPs', icon: 'FileText', viewType: 'file' as const, sortOrder: 1 },
    { key: 'hierarchy', label: 'Hierarchy', icon: 'GitBranch', viewType: 'structured' as const, sortOrder: 2 },
    { key: 'spoc', label: 'SPOC', icon: 'Users', viewType: 'structured' as const, sortOrder: 3 },
    { key: 'workflow', label: 'Workflow', icon: 'Workflow', viewType: 'file' as const, sortOrder: 4 },
    { key: 'faq', label: 'FAQ', icon: 'HelpCircle', viewType: 'structured' as const, sortOrder: 5 },
    { key: 'pitch', label: 'Pitch', icon: 'Presentation', viewType: 'file' as const, sortOrder: 6 },
    { key: 'brochures', label: 'Brochures', icon: 'BookOpen', viewType: 'file' as const, sortOrder: 7 },
    { key: 'flyers', label: 'Flyers', icon: 'Image', viewType: 'file' as const, sortOrder: 8 },
    { key: 'mail_draft', label: 'Mail Draft', icon: 'Mail', viewType: 'structured' as const, sortOrder: 9 },
    { key: 'recordings', label: 'Recordings', icon: 'Mic', viewType: 'file' as const, sortOrder: 10 },
    { key: 'leads_storage', label: 'Leads Storage', icon: 'Database', viewType: 'structured' as const, sortOrder: 11 },
    { key: 'updates', label: 'Updates', icon: 'Bell', viewType: 'structured' as const, sortOrder: 12 },
    { key: 'prices', label: 'Prices', icon: 'DollarSign', viewType: 'structured' as const, sortOrder: 13 },
    { key: 'targets', label: 'Targets', icon: 'Target', viewType: 'structured' as const, sortOrder: 14 },
    { key: 'competitor_info', label: 'Competitor Info', icon: 'Shield', viewType: 'hybrid' as const, sortOrder: 15 },
    { key: 'features', label: 'Features', icon: 'Star', viewType: 'structured' as const, sortOrder: 16 },
    { key: 'videos', label: 'Videos', icon: 'Video', viewType: 'file' as const, sortOrder: 17 },
    { key: 'plan_of_action', label: 'Plan of Action', icon: 'CheckSquare', viewType: 'structured' as const, sortOrder: 18 },
  ];

  for (const cat of categoryData) {
    await db.insert(schema.categories).values(cat).onConflictDoNothing();
  }
  console.log('✅ Seeded 18 categories');

  console.log('\n🚀 Seed complete!');
  console.log('   Login: admin@acme.com / Password123!');
  console.log('   ⚠️  Change credentials in production!');
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
