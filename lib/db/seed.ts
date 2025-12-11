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
  await db.insert(schema.developmentScopes).values([
    { name: 'religious_moral' },
    { name: 'physical_motor' },
    { name: 'cognitive' },
    { name: 'language' },
    { name: 'social_emotional' },
    { name: 'art' },
  ]).onConflictDoNothing();

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
