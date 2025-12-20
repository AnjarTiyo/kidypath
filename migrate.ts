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
    
    // Split by statement separator and execute each statement
    const statements = migrationSQL
      .split('-- statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        await db.execute(sql.raw(statement));
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  process.exit(0);
}

migrate();
