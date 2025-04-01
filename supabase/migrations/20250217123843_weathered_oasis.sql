/*
  # Add observation column to inventory_history table

  1. Changes
    - Add `observation` column to `inventory_history` table
      - Type: text
      - Nullable: true (to maintain compatibility with existing records)

  2. Notes
    - This change is backward compatible
    - Existing records will have NULL in the observation column
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_history' AND column_name = 'observation'
  ) THEN
    ALTER TABLE inventory_history ADD COLUMN observation text;
  END IF;
END $$;