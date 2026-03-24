CREATE TABLE "day_offs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"name" varchar NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "day_offs_date_unique" UNIQUE("date")
);
--> statement-breakpoint
ALTER TABLE "day_offs" ADD CONSTRAINT "day_offs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;