CREATE DATABASE IF NOT EXISTS ims
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ims;

-- ─────────────────────────────────────────────────────────────
--  REFERENCE TABLES  (no dependencies — must be created first)
-- ─────────────────────────────────────────────────────────────

-- All Indian states and union territories
CREATE TABLE IF NOT EXISTS states (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL UNIQUE,
  is_ut        TINYINT(1)   NOT NULL DEFAULT 0,
  created_by   BIGINT       DEFAULT NULL,
  created_date DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by   BIGINT       DEFAULT NULL,
  updated_date DATETIME     DEFAULT NULL
);

-- Designations (DA cadre and others)
CREATE TABLE IF NOT EXISTS designations (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL UNIQUE,
  sort_order   INT          NOT NULL DEFAULT 0,
  created_by   BIGINT       DEFAULT NULL,
  created_date DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by   BIGINT       DEFAULT NULL,
  updated_date DATETIME     DEFAULT NULL
);

-- ─────────────────────────────────────────────────────────────
--  CORE TABLES
-- ─────────────────────────────────────────────────────────────

-- Application users (admin and officers)
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT       PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  state         VARCHAR(255) NOT NULL,
  role          ENUM('admin','officer') NOT NULL,
  password_hash      VARCHAR(255) NOT NULL,
  reset_otp          VARCHAR(255) DEFAULT NULL,
  reset_otp_expires  DATETIME     DEFAULT NULL,
  created_by    BIGINT       DEFAULT NULL,
  created_date  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by    BIGINT       DEFAULT NULL,
  updated_date  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Self-referential audit trail
  CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,

  -- Each user belongs to exactly one state
  CONSTRAINT fk_users_state      FOREIGN KEY (state)      REFERENCES states (name) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Dynamic survey forms (admin-defined)
CREATE TABLE IF NOT EXISTS forms (
  id           BIGINT        PRIMARY KEY,
  form_id      VARCHAR(64)   NOT NULL UNIQUE,
  name         VARCHAR(500)  NOT NULL,
  sections     JSON          NOT NULL,   -- array of section-id strings
  states       JSON          NOT NULL,   -- array of state-name strings
  status       VARCHAR(32)   NOT NULL DEFAULT 'draft',
  survey_year  VARCHAR(32)   DEFAULT NULL,
  description  TEXT,
  created_by   BIGINT        DEFAULT NULL,
  created_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by   BIGINT        DEFAULT NULL,
  updated_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_forms_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_forms_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Admin-defined custom form sections
CREATE TABLE IF NOT EXISTS custom_sections (
  id           VARCHAR(128)  PRIMARY KEY,
  payload      JSON          NOT NULL,
  created_by   BIGINT        DEFAULT NULL,
  created_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by   BIGINT        DEFAULT NULL,
  updated_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_custom_sections_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_custom_sections_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Submitted form responses (one record per submission)
-- Note: uq_state_form unique constraint intentionally omitted to allow
--       multiple submissions per state+form (dropped via migration).
CREATE TABLE IF NOT EXISTS responses (
  id            BIGINT        AUTO_INCREMENT PRIMARY KEY,
  form_id       VARCHAR(64)   NOT NULL,
  form_name     VARCHAR(500)  DEFAULT NULL,
  state         VARCHAR(255)  NOT NULL,
  survey_year   VARCHAR(32)   DEFAULT NULL,
  data          JSON          NOT NULL,
  officer_id    BIGINT        DEFAULT NULL,
  officer_name  VARCHAR(255)  DEFAULT NULL,
  officer_email VARCHAR(255)  DEFAULT NULL,
  created_by    BIGINT        DEFAULT NULL,
  created_date  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by    BIGINT        DEFAULT NULL,
  updated_date  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes for common filter queries
  INDEX idx_responses_form_id  (form_id),
  INDEX idx_responses_state    (state),
  INDEX idx_responses_officer  (officer_id),

  -- A response must belong to a real form; block form deletion if responses exist
  CONSTRAINT fk_responses_form_id   FOREIGN KEY (form_id)    REFERENCES forms  (form_id) ON DELETE RESTRICT  ON UPDATE CASCADE,
  -- A response must come from a real state
  CONSTRAINT fk_responses_state     FOREIGN KEY (state)      REFERENCES states (name)    ON DELETE RESTRICT  ON UPDATE CASCADE,
  -- Officer reference; null-safe if the officer account is later removed
  CONSTRAINT fk_responses_officer   FOREIGN KEY (officer_id) REFERENCES users  (id)      ON DELETE SET NULL  ON UPDATE CASCADE,
  CONSTRAINT fk_responses_created   FOREIGN KEY (created_by) REFERENCES users  (id)      ON DELETE SET NULL  ON UPDATE CASCADE,
  CONSTRAINT fk_responses_updated   FOREIGN KEY (updated_by) REFERENCES users  (id)      ON DELETE SET NULL  ON UPDATE CASCADE
);

-- Auto-saved draft responses (one draft per state+form; replaced on each save)
CREATE TABLE IF NOT EXISTS draft_responses (
  state        VARCHAR(255)  NOT NULL,
  form_id      VARCHAR(64)   NOT NULL,
  data         JSON          NOT NULL,
  created_by   BIGINT        DEFAULT NULL,
  created_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by   BIGINT        DEFAULT NULL,
  updated_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (state, form_id),

  -- Drafts are discardable; cascade-delete when form or state is removed
  CONSTRAINT fk_drafts_form_id   FOREIGN KEY (form_id)    REFERENCES forms  (form_id) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_drafts_state     FOREIGN KEY (state)      REFERENCES states (name)    ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_drafts_created   FOREIGN KEY (created_by) REFERENCES users  (id)      ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_drafts_updated   FOREIGN KEY (updated_by) REFERENCES users  (id)      ON DELETE SET NULL ON UPDATE CASCADE
);

-- Final submission lock — one row per state+form when permanently locked
CREATE TABLE IF NOT EXISTS form_final_status (
  state        VARCHAR(255) NOT NULL,
  form_id      VARCHAR(64)  NOT NULL,
  finalized_by BIGINT       DEFAULT NULL,
  finalized_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (state, form_id),
  CONSTRAINT fk_final_state FOREIGN KEY (state)        REFERENCES states (name)    ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_final_form  FOREIGN KEY (form_id)      REFERENCES forms  (form_id) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_final_user  FOREIGN KEY (finalized_by) REFERENCES users  (id)      ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────
--  STATIC FORMS  (admin-managed: DA cadre nominations, MCA/MKI)
-- ─────────────────────────────────────────────────────────────

-- Form 1: Nomination of DA Cadre Official
CREATE TABLE IF NOT EXISTS da_nominations (
  id            BIGINT        PRIMARY KEY,
  state         VARCHAR(255)  NOT NULL,
  employee_name VARCHAR(255)  NOT NULL,
  designation   VARCHAR(255)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  mobile        VARCHAR(32)   NOT NULL,
  created_by    BIGINT        DEFAULT NULL,
  created_date  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by    BIGINT        DEFAULT NULL,
  updated_date  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_da_nominations_state (state),

  CONSTRAINT fk_da_nom_state       FOREIGN KEY (state)       REFERENCES states       (name) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_da_nom_designation FOREIGN KEY (designation)  REFERENCES designations (name) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_da_nom_created     FOREIGN KEY (created_by)  REFERENCES users        (id)   ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_da_nom_updated     FOREIGN KEY (updated_by)  REFERENCES users        (id)   ON DELETE SET NULL ON UPDATE CASCADE
);

-- Form 2: MCA / MKI combined record
CREATE TABLE IF NOT EXISTS mca_mki_records (
  id                   BIGINT  PRIMARY KEY,
  state                VARCHAR(255) NOT NULL,
  mca_due_date         DATE    DEFAULT NULL,
  mca_allocation_date  DATE    DEFAULT NULL,
  mca_comment          TEXT,
  mki_due_date         DATE    DEFAULT NULL,
  mki_allocation_date  DATE    DEFAULT NULL,
  mki_comment          TEXT,
  created_by           BIGINT  DEFAULT NULL,
  created_date         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by           BIGINT  DEFAULT NULL,
  updated_date         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_mca_mki_state (state),

  CONSTRAINT fk_mca_mki_state   FOREIGN KEY (state)      REFERENCES states (name) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mca_mki_created FOREIGN KEY (created_by) REFERENCES users  (id)   ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_mca_mki_updated FOREIGN KEY (updated_by) REFERENCES users  (id)   ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────
--  GRIEVANCES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS grievances (
  id           BIGINT        PRIMARY KEY,
  states       JSON          NOT NULL DEFAULT ('[]'),  -- targeted state(s) — JSON array
  name         VARCHAR(255)  NOT NULL,
  type         VARCHAR(255)  NOT NULL,
  reason       TEXT          NOT NULL,
  file_name    VARCHAR(255)  DEFAULT NULL,
  file_path    VARCHAR(500)  DEFAULT NULL,
  file_mime    VARCHAR(100)  DEFAULT NULL,
  file_size    INT           DEFAULT NULL,
  created_by   BIGINT        DEFAULT NULL,
  created_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by   BIGINT        DEFAULT NULL,
  updated_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_grievances_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_grievances_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
);
