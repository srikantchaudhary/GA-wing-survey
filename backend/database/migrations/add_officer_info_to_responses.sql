-- Migration to add officer information to responses table
-- Run this migration to update existing responses table structure

-- Add officer information columns
ALTER TABLE responses
ADD COLUMN officer_id BIGINT DEFAULT NULL,
ADD COLUMN officer_name VARCHAR(255) DEFAULT NULL,
ADD COLUMN officer_email VARCHAR(255) DEFAULT NULL;

-- Note: Existing responses will have NULL values for these columns.
-- New responses submitted after this migration will include officer information.
