ALTER TYPE "public"."user_role" ADD VALUE 'curriculum';--> statement-breakpoint
CREATE TABLE "monthly_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"semester_topic_id" uuid,
	"title" varchar NOT NULL,
	"description" text,
	"month_number" integer,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "semester_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"academic_year" varchar,
	"semester_number" integer,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "weekly_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monthly_topic_id" uuid,
	"title" varchar NOT NULL,
	"description" text,
	"week_number" integer,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "monthly_topics" ADD CONSTRAINT "monthly_topics_semester_topic_id_semester_topics_id_fk" FOREIGN KEY ("semester_topic_id") REFERENCES "public"."semester_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_topics" ADD CONSTRAINT "monthly_topics_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_topics" ADD CONSTRAINT "semester_topics_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_topics" ADD CONSTRAINT "weekly_topics_monthly_topic_id_monthly_topics_id_fk" FOREIGN KEY ("monthly_topic_id") REFERENCES "public"."monthly_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_topics" ADD CONSTRAINT "weekly_topics_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;