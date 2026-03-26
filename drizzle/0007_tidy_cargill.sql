CREATE TYPE "public"."lesson_plan_activity_phase" AS ENUM('kegiatan_awal', 'kegiatan_inti', 'istirahat', 'kegiatan_penutup', 'refleksi');--> statement-breakpoint
CREATE TABLE "lesson_plan_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_plan_id" uuid,
	"phase" "lesson_plan_activity_phase",
	"description" text,
	"generated_by_ai" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "lesson_plans" ADD COLUMN "materials" text;--> statement-breakpoint
ALTER TABLE "lesson_plan_activities" ADD CONSTRAINT "lesson_plan_activities_lesson_plan_id_lesson_plans_id_fk" FOREIGN KEY ("lesson_plan_id") REFERENCES "public"."lesson_plans"("id") ON DELETE cascade ON UPDATE no action;