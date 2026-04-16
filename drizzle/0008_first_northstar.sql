ALTER TABLE "users" RENAME COLUMN "name" TO "full_name";--> statement-breakpoint
ALTER TABLE "classrooms" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "classrooms" ALTER COLUMN "academic_year" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "daily_assessments" ALTER COLUMN "image_url" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "day_offs" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "lesson_plans" ALTER COLUMN "topic" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "lesson_plans" ALTER COLUMN "subtopic" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "lesson_plans" ALTER COLUMN "code" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "monthly_topics" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "semester_topics" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "semester_topics" ALTER COLUMN "academic_year" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "full_name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "gender" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone_number" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "weekly_reports" ALTER COLUMN "pdf_url" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "weekly_topics" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;