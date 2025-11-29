-- Ensure emotion_name column exists in mood_entries table
-- This migration is idempotent and safe to run multiple times

-- Add the column if it doesn't exist
ALTER TABLE mood_entries 
ADD COLUMN IF NOT EXISTS emotion_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN mood_entries.emotion_name IS 'User-provided name for the emotion/mood (from dropdown or custom input)';

-- Verify the column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'mood_entries' 
    AND column_name = 'emotion_name'
  ) THEN
    RAISE EXCEPTION 'emotion_name column was not created successfully';
  END IF;
END $$;

-- Force schema cache refresh by querying the column
SELECT emotion_name FROM mood_entries LIMIT 1;

