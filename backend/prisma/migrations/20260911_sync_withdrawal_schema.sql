-- =====================================================
-- Sync Withdrawal table schema with Prisma schema
-- Fixes P2022: The column '(not available)' does not exist
-- Safe migration: each column added only if missing
-- =====================================================

-- Add missing WithdrawalStatus enum type check (if enum was never created)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WithdrawalStatus') THEN
        CREATE TYPE "WithdrawalStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'reversed');
    END IF;
END
$$;

-- =====================================================
-- Add columns one-by-one with safe defaults
-- Each is wrapped so it won't fail if the column exists
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'bankName') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "bankName" TEXT;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'accountName') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "accountName" TEXT;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'bvn') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "bvn" TEXT;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'reference') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "reference" TEXT;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'transferId') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "transferId" TEXT;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'fee') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "fee" DECIMAL(10,2);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'amountReceived') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "amountReceived" DECIMAL(10,2);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'narration') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "narration" TEXT;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'otpHash') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "otpHash" TEXT;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'otpExpires') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "otpExpires" TIMESTAMP(3);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'otpAttempts') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "otpAttempts" INTEGER NOT NULL DEFAULT 0;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'lastOtpSentAt') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "lastOtpSentAt" TIMESTAMP(3);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'reversed') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "reversed" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'reversedAt') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "reversedAt" TIMESTAMP(3);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'reversalReason') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "reversalReason" TEXT;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'sourceType') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "sourceType" TEXT DEFAULT 'gift';
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Withdrawal' AND column_name = 'updatedAt') THEN
        ALTER TABLE "Withdrawal" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END
$$;

-- =====================================================
-- Migrate status column to enum type if it's still plain text
-- (safe no-op if already enum)
-- =====================================================
DO $$
DECLARE
    status_col_type text;
BEGIN
    SELECT data_type INTO status_col_type
    FROM information_schema.columns
    WHERE table_name = 'Withdrawal' AND column_name = 'status';

    IF status_col_type = 'character varying' THEN
        -- Cast existing text values to the enum type
        ALTER TABLE "Withdrawal"
            ALTER COLUMN status DROP DEFAULT,
            ALTER COLUMN status TYPE "WithdrawalStatus" USING status::"WithdrawalStatus",
            ALTER COLUMN status SET DEFAULT 'pending'::"WithdrawalStatus";
    END IF;
END
$$;

-- =====================================================
-- Re-create indexes if missing
-- =====================================================
CREATE INDEX IF NOT EXISTS "Withdrawal_userId_idx" ON "Withdrawal"("userId");
CREATE INDEX IF NOT EXISTS "Withdrawal_status_idx" ON "Withdrawal"("status");
CREATE INDEX IF NOT EXISTS "Withdrawal_createdAt_idx" ON "Withdrawal"("createdAt");

-- Unique constraint on reference if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Withdrawal_reference_key') THEN
        ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_reference_key" UNIQUE ("reference");
    END IF;
EXCEPTION WHEN unique_violation OR duplicate_object THEN
    NULL;
END
$$;
