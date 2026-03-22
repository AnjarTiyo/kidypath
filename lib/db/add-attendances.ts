import { db } from '../db';
import { sql } from 'drizzle-orm';

async function addAttendancesTable() {
  console.log('🔧 Adding attendances table and enums...');

  try {
    // Create enums
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE attendance_type AS ENUM('check_in', 'check_out');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ attendance_type enum created/exists');

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE attendance_status AS ENUM('present', 'sick', 'permission');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ attendance_status enum created/exists');

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE mood AS ENUM('bahagia', 'sedih', 'marah', 'takut', 'jijik');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ mood enum created/exists');

    // Create attendances table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS attendances (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        student_id uuid,
        classroom_id uuid,
        date date,
        type attendance_type,
        status attendance_status,
        mood mood,
        note text,
        recorded_by uuid,
        created_at timestamp with time zone DEFAULT now()
      );
    `);
    console.log('✓ attendances table created/exists');

    // Add foreign keys if they don't exist
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE attendances 
        ADD CONSTRAINT attendances_student_id_students_id_fk 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE cascade;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ student foreign key added/exists');

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE attendances 
        ADD CONSTRAINT attendances_classroom_id_classrooms_id_fk 
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE cascade;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ classroom foreign key added/exists');

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE attendances 
        ADD CONSTRAINT attendances_recorded_by_users_id_fk 
        FOREIGN KEY (recorded_by) REFERENCES users(id);
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ recorded_by foreign key added/exists');

    console.log('✅ Attendances table setup complete!');
  } catch (error) {
    console.error('❌ Error setting up attendances table:', error);
    throw error;
  }

  process.exit(0);
}

addAttendancesTable();
