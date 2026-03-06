-- Migration: Add disputes table for order/payout dispute resolution
-- Created: 2025-01-09

-- Create dispute status enum type
DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create dispute type enum
DO $$ BEGIN
  CREATE TYPE dispute_type AS ENUM ('order', 'payout', 'quality', 'delivery', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reporter info
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- What the dispute is about (at least one must be set)
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  pool_id UUID REFERENCES pools(id) ON DELETE SET NULL,
  payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,
  
  -- Dispute details
  type dispute_type NOT NULL DEFAULT 'other',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  
  -- Status tracking
  status dispute_status NOT NULL DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  
  -- Resolution
  resolution TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  
  -- Admin notes (internal)
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_disputes_reporter_id ON disputes(reporter_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_pool_id ON disputes(pool_id);
CREATE INDEX IF NOT EXISTS idx_disputes_payout_id ON disputes(payout_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

-- Enable RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own disputes
CREATE POLICY "Users can view own disputes"
  ON disputes FOR SELECT
  USING (auth.uid() = reporter_id);

-- Users can create disputes
CREATE POLICY "Users can create disputes"
  ON disputes FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can update their own open disputes (e.g., add evidence)
CREATE POLICY "Users can update own open disputes"
  ON disputes FOR UPDATE
  USING (auth.uid() = reporter_id AND status = 'open')
  WITH CHECK (auth.uid() = reporter_id);

-- Admins can view all disputes
CREATE POLICY "Admins can view all disputes"
  ON disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update all disputes
CREATE POLICY "Admins can update all disputes"
  ON disputes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete disputes
CREATE POLICY "Admins can delete disputes"
  ON disputes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_disputes_updated_at();

-- Add comment for documentation
COMMENT ON TABLE disputes IS 'Order, payout, and quality disputes raised by users for admin resolution';
