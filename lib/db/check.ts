import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

try {
  const result = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  
  console.log('📋 Existing tables in database:');
  if (result.length === 0) {
    console.log('  (empty - no tables found)');
  } else {
    result.forEach(row => console.log(`  - ${row.table_name}`));
  }
} catch (error) {
  console.error('Error:', error);
} finally {
  await sql.end();
}
