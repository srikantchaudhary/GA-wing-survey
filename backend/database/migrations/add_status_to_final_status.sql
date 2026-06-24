-- Add status and rejection_reason to form_final_status
-- Existing rows default to 'approved' (backwards compatible)
ALTER TABLE form_final_status
  ADD COLUMN IF NOT EXISTS status ENUM('approved', 'rejected') NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500) DEFAULT NULL;
