-- Phase 4.5 Features Migration
-- Push Notifications, Chargebacks, Webhook Logs, Reputation System

-- =====================================================
-- 1. PUSH SUBSCRIPTIONS TABLE (for Web Push API)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. CHARGEBACKS TABLE (Paystack Disputes)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chargebacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  pool_member_id UUID,
  paystack_dispute_id TEXT UNIQUE,
  payment_reference TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in kobo
  currency TEXT DEFAULT 'NGN',
  reason TEXT,
  status TEXT CHECK (status IN ('open', 'awaiting_response', 'under_review', 'resolved_won', 'resolved_lost', 'refunded')) DEFAULT 'open',
  evidence JSONB DEFAULT '{}'::jsonb,
  due_date TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  outcome TEXT,
  admin_notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.chargebacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all chargebacks"
  ON chargebacks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage chargebacks"
  ON chargebacks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 3. WEBHOOK LOGS TABLE (Audit Trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'paystack', -- paystack, internal, etc.
  payload JSONB NOT NULL,
  reference TEXT,
  status TEXT CHECK (status IN ('pending', 'processed', 'failed', 'retrying')) DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs"
  ON webhook_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage webhook logs"
  ON webhook_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_logs_reference ON webhook_logs(reference);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- =====================================================
-- 4. REPUTATION SYSTEM (Add fields to profiles)
-- =====================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS successful_pools INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS on_time_deliveries INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_transactions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badge TEXT CHECK (badge IN ('new', 'verified', 'trusted', 'premium')) DEFAULT 'new';

-- =====================================================
-- 5. FARMER BANK ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.farmer_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  bank_code TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  recipient_code TEXT, -- Paystack recipient code
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, bank_code, account_number)
);

ALTER TABLE public.farmer_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank accounts"
  ON farmer_bank_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bank accounts"
  ON farmer_bank_accounts FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. PAYOUT STATS VIEW (for dashboard)
-- =====================================================
CREATE OR REPLACE VIEW public.farmer_payout_stats AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_earned,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE)), 0) as this_month_earned,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' AND created_at < date_trunc('month', CURRENT_DATE)), 0) as last_month_earned
FROM payouts
GROUP BY user_id;

-- =====================================================
-- 7. REPUTATION CALCULATION FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_reputation_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_completed_orders INTEGER;
  v_successful_pools INTEGER;
  v_rating NUMERIC;
  v_is_verified BOOLEAN;
BEGIN
  -- Get user stats
  SELECT 
    COALESCE(completed_orders, 0),
    COALESCE(successful_pools, 0),
    COALESCE(rating, 0),
    COALESCE(is_verified, false)
  INTO v_completed_orders, v_successful_pools, v_rating, v_is_verified
  FROM profiles WHERE id = p_user_id;

  -- Calculate score
  v_score := v_score + (v_completed_orders * 5);  -- 5 points per completed order
  v_score := v_score + (v_successful_pools * 10); -- 10 points per successful pool
  v_score := v_score + (v_rating * 20)::INTEGER;  -- Up to 100 points for rating
  
  IF v_is_verified THEN
    v_score := v_score + 50; -- 50 points for verification
  END IF;

  -- Update profile
  UPDATE profiles 
  SET 
    reputation_score = v_score,
    badge = CASE
      WHEN v_score >= 500 THEN 'premium'
      WHEN v_score >= 200 THEN 'trusted'
      WHEN v_is_verified THEN 'verified'
      ELSE 'new'
    END
  WHERE id = p_user_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. LOG WEBHOOK FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION log_webhook_event(
  p_event_type TEXT,
  p_source TEXT,
  p_payload JSONB,
  p_reference TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO webhook_logs (event_type, source, payload, reference, status)
  VALUES (p_event_type, p_source, p_payload, p_reference, 'pending')
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. UPDATE WEBHOOK LOG STATUS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_webhook_log_status(
  p_log_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE webhook_logs
  SET 
    status = p_status,
    error_message = p_error_message,
    processed_at = CASE WHEN p_status IN ('processed', 'failed') THEN NOW() ELSE processed_at END,
    retry_count = CASE WHEN p_status = 'retrying' THEN retry_count + 1 ELSE retry_count END
  WHERE id = p_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. MONTHLY EARNINGS FUNCTION (for chart data)
-- =====================================================
CREATE OR REPLACE FUNCTION get_farmer_monthly_earnings(p_user_id UUID, p_months INTEGER DEFAULT 6)
RETURNS TABLE (
  month TEXT,
  amount BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(date_trunc('month', created_at), 'Mon YYYY') as month,
    COALESCE(SUM(payouts.amount)::BIGINT, 0) as amount
  FROM generate_series(
    date_trunc('month', CURRENT_DATE) - ((p_months - 1) || ' months')::INTERVAL,
    date_trunc('month', CURRENT_DATE),
    '1 month'::INTERVAL
  ) as months(month_start)
  LEFT JOIN payouts ON 
    payouts.user_id = p_user_id 
    AND payouts.status = 'completed'
    AND date_trunc('month', payouts.created_at) = months.month_start
  GROUP BY months.month_start
  ORDER BY months.month_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
