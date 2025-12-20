-- Drop existing daily_assessments table and all data
DROP TABLE IF EXISTS daily_assessments CASCADE;

-- Recreate daily_assessments with new structure (summary table)
CREATE TABLE "daily_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date,
	"student_id" uuid,
	"classroom_id" uuid,
	"summary" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);

-- Create assessment_items table (this will store the detailed assessment data)
CREATE TABLE "assessment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"daily_assessment_id" uuid,
	"scope_id" uuid,
	"objective_id" uuid,
	"activity_context" text,
	"score" "assessment_score",
	"note" text,
	"created_at" timestamp with time zone DEFAULT now()
);

-- Add foreign key constraints for daily_assessments
ALTER TABLE "daily_assessments" ADD CONSTRAINT "daily_assessments_student_id_students_id_fk" 
  FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "daily_assessments" ADD CONSTRAINT "daily_assessments_classroom_id_classrooms_id_fk" 
  FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "daily_assessments" ADD CONSTRAINT "daily_assessments_created_by_users_id_fk" 
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- Add foreign key constraints for assessment_items
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_daily_assessment_id_daily_assessments_id_fk" 
  FOREIGN KEY ("daily_assessment_id") REFERENCES "public"."daily_assessments"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_scope_id_development_scopes_id_fk" 
  FOREIGN KEY ("scope_id") REFERENCES "public"."development_scopes"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_objective_id_learning_objectives_id_fk" 
  FOREIGN KEY ("objective_id") REFERENCES "public"."learning_objectives"("id") ON DELETE no action ON UPDATE no action;
