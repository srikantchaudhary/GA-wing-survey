-- Migration: add static-form tables (DA cadre nominations + MCA/MKI records)
-- Safe to run on an existing database — uses CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS da_nominations (
  id BIGINT PRIMARY KEY,
  state VARCHAR(255) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  designation VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  mobile VARCHAR(32) NOT NULL,
  created_by BIGINT DEFAULT NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT DEFAULT NULL,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mca_mki_records (
  id BIGINT PRIMARY KEY,
  state VARCHAR(255) NOT NULL,
  mca_due_date DATE DEFAULT NULL,
  mca_allocation_date DATE DEFAULT NULL,
  mca_comment TEXT,
  mki_due_date DATE DEFAULT NULL,
  mki_allocation_date DATE DEFAULT NULL,
  mki_comment TEXT,
  created_by BIGINT DEFAULT NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT DEFAULT NULL,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
