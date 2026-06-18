-- Allow multiple responses per state+form (for duplicate rows feature)
ALTER TABLE responses DROP INDEX uq_state_form;
