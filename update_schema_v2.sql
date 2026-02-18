-- Remove priority column
ALTER TABLE tickets DROP COLUMN priority;

-- Add new columns
ALTER TABLE tickets ADD COLUMN location text;
ALTER TABLE tickets ADD COLUMN type_of_damage text;
