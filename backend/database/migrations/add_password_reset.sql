-- Migration: Add password-reset OTP columns to users table
ALTER TABLE users
  ADD COLUMN reset_otp         VARCHAR(255) DEFAULT NULL,
  ADD COLUMN reset_otp_expires DATETIME     DEFAULT NULL;
