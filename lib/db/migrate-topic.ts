import { db } from '../db'
import { sql } from 'drizzle-orm'

async function migrate() {
  console.log('Starting migration: Rename title to topic and add subtopic...')
  
  try {
    // Rename column title to topic
    await db.execute(sql`ALTER TABLE "lesson_plans" RENAME COLUMN "title" TO "topic"`)
    console.log('✓ Renamed column title to topic')
    
    // Add subtopic column
    await db.execute(sql`ALTER TABLE "lesson_plans" ADD COLUMN IF NOT EXISTS "subtopic" varchar`)
    console.log('✓ Added subtopic column')
    
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

migrate()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
