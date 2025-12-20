import { sql } from 'drizzle-orm';
import { db } from './lib/db';
import fs from 'fs';
import path from 'path';

async function migrate() {
  try {
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'drizzle/0005_careless_korvac.sql'),
      'utf-8'
    );

    console.log('Executing migration...');
    
    // Execute the entire migration as one transaction
    await db.execute(sql.raw(migrationSQL));

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  process.exit(0);
}

migrate();
