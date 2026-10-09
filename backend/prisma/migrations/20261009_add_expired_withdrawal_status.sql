-- Fix withdrawal OTP requests failing with PostgreSQL 22P02.
-- Additive and safe to rerun; does not modify withdrawal records or balances.
ALTER TYPE public."WithdrawalStatus" ADD VALUE IF NOT EXISTS 'expired';
