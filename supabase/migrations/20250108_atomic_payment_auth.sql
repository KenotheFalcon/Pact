-- Migration: Atomic Payment Authorization RPC
-- Purpose: Prevent race conditions in payment verification by using atomic database operations
-- Date: 2025-01-08

-- Drop if exists for idempotency
DROP FUNCTION IF EXISTS authorize_payment_atomically(TEXT, UUID);

/**
 * Atomically authorizes a payment and increments pool quantity.
 * This prevents race conditions where multiple requests could process the same payment.
 * 
 * Uses SELECT ... FOR UPDATE to lock the row during the transaction.
 * 
 * @param p_payment_reference - The payment reference from Paystack
 * @param p_pool_id - The pool ID
 * @returns TEXT - 'authorized', 'already_processed', or 'not_found'
 */
CREATE OR REPLACE FUNCTION authorize_payment_atomically(
  p_payment_reference TEXT,
  p_pool_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_current_status TEXT;
  v_quantity_pledged INTEGER;
BEGIN
  -- Lock the row with FOR UPDATE to prevent concurrent modifications
  SELECT payment_status, quantity_pledged
  INTO v_member
  FROM pool_members
  WHERE payment_reference = p_payment_reference
    AND pool_id = p_pool_id
  FOR UPDATE;

  -- Check if member exists
  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  v_current_status := v_member.payment_status;
  v_quantity_pledged := COALESCE(v_member.quantity_pledged, 0);

  -- Idempotency check: already processed
  IF v_current_status = 'authorized' OR v_current_status = 'captured' THEN
    RETURN 'already_processed';
  END IF;

  -- Only process if currently pending
  IF v_current_status = 'pending' THEN
    -- Update payment status to authorized
    UPDATE pool_members
    SET 
      payment_status = 'authorized',
      updated_at = NOW()
    WHERE payment_reference = p_payment_reference
      AND pool_id = p_pool_id;

    -- Increment pool quantity if there's a pledged amount
    IF v_quantity_pledged > 0 THEN
      UPDATE pools
      SET 
        current_quantity = current_quantity + v_quantity_pledged,
        updated_at = NOW()
      WHERE id = p_pool_id;
    END IF;

    RETURN 'authorized';
  END IF;

  -- For any other status (failed, voided, etc.), don't process
  RETURN 'already_processed';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION authorize_payment_atomically(TEXT, UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION authorize_payment_atomically IS 
'Atomically authorizes a payment and increments pool quantity. 
Uses row-level locking to prevent race conditions in concurrent payment verifications.';
