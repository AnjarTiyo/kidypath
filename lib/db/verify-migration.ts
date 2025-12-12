import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { classrooms, classroomTeachers } from './schema';

async function verifyMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  console.log('🔍 Verifying migration...');

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    // Check if classroom_teachers table exists and is queryable
    const result = await db.select().from(classroomTeachers).limit(1);
    console.log('✅ classroom_teachers table exists and is accessible');
    console.log(`   Found ${result.length} record(s) in classroom_teachers`);

    // Check classrooms table
    const classroomsResult = await db.select().from(classrooms).limit(5);
    console.log('✅ classrooms table is accessible');
    console.log(`   Found ${classroomsResult.length} record(s) in classrooms`);

    console.log('\n✅ Migration verification successful!');
  } catch (error) {
    console.error('❌ Migration verification failed:');
    console.error(error);
  } finally {
    await client.end();
  }
}

verifyMigration();
