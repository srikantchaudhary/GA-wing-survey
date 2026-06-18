CREATE TABLE IF NOT EXISTS grievances (
  id            BIGINT       PRIMARY KEY,
  states        JSON         NOT NULL DEFAULT ('[]'),
  name          VARCHAR(255) NOT NULL,
  type          VARCHAR(255) NOT NULL,
  reason        TEXT         NOT NULL,
  file_name     VARCHAR(255) DEFAULT NULL,
  file_path     VARCHAR(500) DEFAULT NULL,
  file_mime     VARCHAR(100) DEFAULT NULL,
  file_size     INT          DEFAULT NULL,
  created_by    BIGINT       DEFAULT NULL,
  created_date  DATETIME     NOT NULL,
  updated_by    BIGINT       DEFAULT NULL,
  updated_date  DATETIME     NOT NULL
);