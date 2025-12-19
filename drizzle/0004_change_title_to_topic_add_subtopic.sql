-- Change column title to topic and add subtopic column
ALTER TABLE "lesson_plans" RENAME COLUMN "title" TO "topic";
ALTER TABLE "lesson_plans" ADD COLUMN "subtopic" varchar;
