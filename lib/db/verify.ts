import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

try {
  console.log('🔍 Checking database content...\n');
  
  // Check development scopes
  const scopes = await sql`SELECT * FROM development_scopes ORDER BY name`;
  console.log('📊 Development Scopes:');
  if (scopes.length === 0) {
    console.log('  (empty)');
  } else {
    scopes.forEach(scope => console.log(`  ✓ ${scope.name}`));
  }
  
  // Check users
  const users = await sql`SELECT id, name, email, role FROM users`;
  console.log('\n👥 Users:');
  if (users.length === 0) {
    console.log('  (empty - no users yet)');
  } else {
    users.forEach(user => console.log(`  - ${user.name} (${user.email}) - ${user.role}`));
  }
  
  // Check classrooms
  const classrooms = await sql`SELECT * FROM classrooms`;
  console.log('\n🏫 Classrooms:');
  if (classrooms.length === 0) {
    console.log('  (empty - no classrooms yet)');
  } else {
    classrooms.forEach(classroom => console.log(`  - ${classroom.name} (${classroom.academic_year})`));
  }
  
} catch (error) {
  console.error('❌ Error:', error);
} finally {
  await sql.end();
}
