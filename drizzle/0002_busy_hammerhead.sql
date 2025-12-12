CREATE TABLE "classroom_teachers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"classroom_id" uuid,
	"teacher_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
-- Migrate existing teacher assignments to the junction table
INSERT INTO "classroom_teachers" ("classroom_id", "teacher_id")
SELECT "id", "teacher_id" 
FROM "classrooms" 
WHERE "teacher_id" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "classrooms" DROP CONSTRAINT "classrooms_teacher_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "classroom_teachers" ADD CONSTRAINT "classroom_teachers_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_teachers" ADD CONSTRAINT "classroom_teachers_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classrooms" DROP COLUMN "teacher_id";