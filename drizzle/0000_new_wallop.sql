CREATE TYPE "public"."assessment_score" AS ENUM('BB', 'MB', 'BSH', 'BSB');--> statement-breakpoint
CREATE TYPE "public"."development_scope" AS ENUM('religious_moral', 'physical_motor', 'cognitive', 'language', 'social_emotional', 'art');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'teacher', 'parent');--> statement-breakpoint
CREATE TABLE "activity_agenda" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date,
	"classroom_id" uuid,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "classrooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar,
	"academic_year" varchar,
	"teacher_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date,
	"student_id" uuid,
	"teacher_id" uuid,
	"scope_id" uuid,
	"objective_id" uuid,
	"activity_context" text,
	"score" "assessment_score",
	"note" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "development_scopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "development_scope"
);
--> statement-breakpoint
CREATE TABLE "learning_objectives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_id" uuid,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "lesson_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"classroom_id" uuid,
	"date" date,
	"generated_by_ai" boolean,
	"content" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "monthly_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid,
	"month" integer,
	"year" integer,
	"summary_text" text,
	"auto_generated" boolean,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "parent_child" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"child_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar,
	"classroom_id" uuid,
	"birth_date" date,
	"gender" varchar,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar,
	"email" varchar,
	"password_hash" varchar,
	"role" "user_role",
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weekly_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid,
	"week_start" date,
	"week_end" date,
	"summary_text" text,
	"auto_generated" boolean,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activity_agenda" ADD CONSTRAINT "activity_agenda_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_agenda" ADD CONSTRAINT "activity_agenda_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_assessments" ADD CONSTRAINT "daily_assessments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_assessments" ADD CONSTRAINT "daily_assessments_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_assessments" ADD CONSTRAINT "daily_assessments_scope_id_development_scopes_id_fk" FOREIGN KEY ("scope_id") REFERENCES "public"."development_scopes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_assessments" ADD CONSTRAINT "daily_assessments_objective_id_learning_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."learning_objectives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_scope_id_development_scopes_id_fk" FOREIGN KEY ("scope_id") REFERENCES "public"."development_scopes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child" ADD CONSTRAINT "parent_child_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child" ADD CONSTRAINT "parent_child_child_id_students_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;