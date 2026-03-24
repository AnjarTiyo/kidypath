import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Simple password hashing function for seeding purposes
// In production, use bcrypt or similar
async function hashPassword(password: string): Promise<string> {
  // For seeding, we'll use a simple hash
  // In production, replace this with bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  console.log('⏳ Seeding database...');

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });

  // Seed development scopes
  console.log('📝 Seeding development scopes...');
  const developmentScopesData = [
    { name: 'religious_moral' as const },
    { name: 'physical_motor' as const },
    { name: 'cognitive' as const },
    { name: 'language' as const },
    { name: 'social_emotional' as const },
    { name: 'art' as const },
  ];
  
  await db.insert(schema.developmentScopes)
    .values(developmentScopesData)
    .onConflictDoNothing();

  // Fetch inserted development scopes for learning objectives
  const insertedScopes = await db.select().from(schema.developmentScopes);
  const scopeMap = new Map(insertedScopes.map(scope => [scope.name, scope.id]));

  // Seed sample learning objectives for each development scope
  console.log('🎯 Seeding learning objectives...');
  const learningObjectivesData = [
    // Religious & Moral Values
    { scopeId: scopeMap.get('religious_moral'), description: 'Anak mampu mengenal dan mengucapkan doa sehari-hari dengan baik' },
    { scopeId: scopeMap.get('religious_moral'), description: 'Anak mampu menunjukkan perilaku santun dan berbagi dengan teman' },
    { scopeId: scopeMap.get('religious_moral'), description: 'Anak mampu mengenal dan menyebutkan ciptaan Tuhan' },
    
    // Physical & Motor
    { scopeId: scopeMap.get('physical_motor'), description: 'Anak mampu melakukan gerakan motorik kasar seperti berlari, melompat, dan melempar' },
    { scopeId: scopeMap.get('physical_motor'), description: 'Anak mampu melakukan gerakan motorik halus seperti menggunting, menempel, dan mewarnai' },
    { scopeId: scopeMap.get('physical_motor'), description: 'Anak mampu menjaga kebersihan diri dan lingkungan' },
    
    // Cognitive
    { scopeId: scopeMap.get('cognitive'), description: 'Anak mampu mengenal konsep bilangan 1-10 dan melakukan penghitungan sederhana' },
    { scopeId: scopeMap.get('cognitive'), description: 'Anak mampu mengelompokkan benda berdasarkan warna, bentuk, dan ukuran' },
    { scopeId: scopeMap.get('cognitive'), description: 'Anak mampu memecahkan masalah sederhana dalam kehidupan sehari-hari' },
    
    // Language
    { scopeId: scopeMap.get('language'), description: 'Anak mampu menyimak dan memahami cerita sederhana' },
    { scopeId: scopeMap.get('language'), description: 'Anak mampu mengekspresikan pikiran dan perasaan dengan bahasa yang jelas' },
    { scopeId: scopeMap.get('language'), description: 'Anak mampu mengenal huruf dan membaca kata sederhana' },
    
    // Social & Emotional
    { scopeId: scopeMap.get('social_emotional'), description: 'Anak mampu berinteraksi dengan teman sebaya dan orang dewasa dengan baik' },
    { scopeId: scopeMap.get('social_emotional'), description: 'Anak mampu mengenali dan mengekspresikan emosi dengan tepat' },
    { scopeId: scopeMap.get('social_emotional'), description: 'Anak mampu bekerja sama dalam kegiatan kelompok' },
    
    // Art
    { scopeId: scopeMap.get('art'), description: 'Anak mampu mengekspresikan kreativitas melalui berbagai karya seni' },
    { scopeId: scopeMap.get('art'), description: 'Anak mampu bernyanyi dan mengikuti irama musik dengan baik' },
    { scopeId: scopeMap.get('art'), description: 'Anak mampu menari dan mengekspresikan gerakan sesuai musik' },
  ];

  await db.insert(schema.learningObjectives)
    .values(learningObjectivesData)
    .onConflictDoNothing();

  // Seed users - one of each role
  console.log('👥 Seeding users...');
  const hashedPassword = await hashPassword('password123');
  
  await db.insert(schema.users).values([
    {
      name: 'Admin User',
      email: 'admin@kidypath.id',
      passwordHash: hashedPassword,
      role: 'admin',
    },
    {
      name: 'Teacher User',
      email: 'teacher@kidypath.id',
      passwordHash: hashedPassword,
      role: 'teacher',
    },
    {
      name: 'Parent User',
      email: 'parent@kidypath.id',
      passwordHash: hashedPassword,
      role: 'parent',
    },
  ]).onConflictDoNothing();

  // Seed day-offs (Indonesian national holidays 2025)
  console.log('📅 Seeding day-offs...');
  const adminUser = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .limit(1);
  const adminId = adminUser[0]?.id ?? null;

  await db.insert(schema.dayOffs).values([
    { date: '2025-01-01', name: 'Tahun Baru Masehi', createdBy: adminId },
    { date: '2025-01-27', name: 'Isra Miraj Nabi Muhammad SAW', createdBy: adminId },
    { date: '2025-01-29', name: 'Tahun Baru Imlek', createdBy: adminId },
    { date: '2025-03-29', name: 'Hari Suci Nyepi', createdBy: adminId },
    { date: '2025-03-30', name: 'Hari Raya Idul Fitri', createdBy: adminId },
    { date: '2025-03-31', name: 'Hari Raya Idul Fitri', createdBy: adminId },
    { date: '2025-04-18', name: 'Wafat Isa Al Masih', createdBy: adminId },
    { date: '2025-05-01', name: 'Hari Buruh Internasional', createdBy: adminId },
    { date: '2025-05-12', name: 'Hari Raya Waisak', createdBy: adminId },
    { date: '2025-05-29', name: 'Kenaikan Isa Al Masih', createdBy: adminId },
    { date: '2025-06-01', name: 'Hari Lahir Pancasila', createdBy: adminId },
    { date: '2025-06-06', name: 'Hari Raya Idul Adha', createdBy: adminId },
    { date: '2025-06-27', name: 'Tahun Baru Islam 1447 H', createdBy: adminId },
    { date: '2025-08-17', name: 'Hari Kemerdekaan RI', createdBy: adminId },
    { date: '2025-09-05', name: 'Maulid Nabi Muhammad SAW', createdBy: adminId },
    { date: '2025-12-25', name: 'Hari Raya Natal', createdBy: adminId },
  ]).onConflictDoNothing();

  console.log('✅ Seeding completed!');
  console.log('📝 Default credentials:');
  console.log('   Admin:  admin@kidypath.id / password123');
  console.log('   Teacher: teacher@kidypath.id / password123');
  console.log('   Parent:  parent@kidypath.id / password123');

  await client.end();
}

seed().catch((err) => {
  console.error('❌ Seeding failed');
  console.error(err);
  process.exit(1);
});
