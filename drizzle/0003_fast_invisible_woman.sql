CREATE TABLE "lesson_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_plan_id" uuid,
	"development_scope" "development_scope",
	"learning_goal" text,
	"activity_context" text,
	"generated_by_ai" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "lesson_plans" ALTER COLUMN "generated_by_ai" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "lesson_plans" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "lesson_plan_items" ADD CONSTRAINT "lesson_plan_items_lesson_plan_id_lesson_plans_id_fk" FOREIGN KEY ("lesson_plan_id") REFERENCES "public"."lesson_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_plans" DROP COLUMN "content";