-- Make objectiveId nullable in daily_assessments
ALTER TABLE daily_assessments 
ALTER COLUMN objective_id DROP NOT NULL;
