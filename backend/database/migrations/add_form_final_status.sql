-- Migration: track final submission lock per state+form
CREATE TABLE IF NOT EXISTS form_final_status (
  state        VARCHAR(255) NOT NULL,
  form_id      VARCHAR(64)  NOT NULL,
  finalized_by BIGINT       DEFAULT NULL,
  finalized_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (state, form_id),
  CONSTRAINT fk_final_state   FOREIGN KEY (state)        REFERENCES states (name)    ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_final_form    FOREIGN KEY (form_id)      REFERENCES forms  (form_id) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_final_user    FOREIGN KEY (finalized_by) REFERENCES users  (id)      ON DELETE SET NULL ON UPDATE CASCADE
);
