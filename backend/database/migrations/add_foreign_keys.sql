-- Migration: add proper foreign key constraints to all tables
-- Run AFTER schema.sql and all prior migrations.
-- Safe to run on an existing database — each constraint is guarded by
-- "ADD CONSTRAINT IF NOT EXISTS" logic in the runner script.

-- ── users: self-referential audit + state reference ──────────
ALTER TABLE users
  ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users  (id)   ON DELETE SET NULL  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users  (id)   ON DELETE SET NULL  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_users_state      FOREIGN KEY (state)      REFERENCES states (name) ON DELETE RESTRICT  ON UPDATE CASCADE;

-- ── forms: audit columns ──────────────────────────────────────
ALTER TABLE forms
  ADD CONSTRAINT fk_forms_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_forms_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ── custom_sections: audit columns ───────────────────────────
ALTER TABLE custom_sections
  ADD CONSTRAINT fk_custom_sections_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_custom_sections_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ── responses: form, state, officer, audit ───────────────────
ALTER TABLE responses
  ADD CONSTRAINT fk_responses_form_id FOREIGN KEY (form_id)    REFERENCES forms  (form_id) ON DELETE RESTRICT  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_responses_state   FOREIGN KEY (state)      REFERENCES states (name)    ON DELETE RESTRICT  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_responses_officer FOREIGN KEY (officer_id) REFERENCES users  (id)      ON DELETE SET NULL  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_responses_created FOREIGN KEY (created_by) REFERENCES users  (id)      ON DELETE SET NULL  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_responses_updated FOREIGN KEY (updated_by) REFERENCES users  (id)      ON DELETE SET NULL  ON UPDATE CASCADE;

-- ── draft_responses: form, state, audit ──────────────────────
ALTER TABLE draft_responses
  ADD CONSTRAINT fk_drafts_form_id FOREIGN KEY (form_id)    REFERENCES forms  (form_id) ON DELETE CASCADE  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_drafts_state   FOREIGN KEY (state)      REFERENCES states (name)    ON DELETE CASCADE  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_drafts_created FOREIGN KEY (created_by) REFERENCES users  (id)      ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_drafts_updated FOREIGN KEY (updated_by) REFERENCES users  (id)      ON DELETE SET NULL ON UPDATE CASCADE;

-- ── da_nominations: state, designation, audit ────────────────
ALTER TABLE da_nominations
  ADD CONSTRAINT fk_da_nom_state       FOREIGN KEY (state)       REFERENCES states       (name) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_da_nom_designation FOREIGN KEY (designation)  REFERENCES designations (name) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_da_nom_created     FOREIGN KEY (created_by)  REFERENCES users        (id)   ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_da_nom_updated     FOREIGN KEY (updated_by)  REFERENCES users        (id)   ON DELETE SET NULL ON UPDATE CASCADE;

-- ── mca_mki_records: state, audit ────────────────────────────
ALTER TABLE mca_mki_records
  ADD CONSTRAINT fk_mca_mki_state   FOREIGN KEY (state)      REFERENCES states (name) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_mca_mki_created FOREIGN KEY (created_by) REFERENCES users  (id)   ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_mca_mki_updated FOREIGN KEY (updated_by) REFERENCES users  (id)   ON DELETE SET NULL ON UPDATE CASCADE;

-- ── grievances: audit columns ─────────────────────────────────
ALTER TABLE grievances
  ADD CONSTRAINT fk_grievances_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_grievances_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ── performance indexes ───────────────────────────────────────
ALTER TABLE responses
  ADD INDEX IF NOT EXISTS idx_responses_form_id (form_id),
  ADD INDEX IF NOT EXISTS idx_responses_state   (state),
  ADD INDEX IF NOT EXISTS idx_responses_officer (officer_id);

ALTER TABLE da_nominations
  ADD INDEX IF NOT EXISTS idx_da_nominations_state (state);

ALTER TABLE mca_mki_records
  ADD INDEX IF NOT EXISTS idx_mca_mki_state (state);
