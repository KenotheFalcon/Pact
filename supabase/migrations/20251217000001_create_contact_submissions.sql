-- Migration: Create contact_submissions table
-- Created: 2025-12-17
-- Description: Table for storing contact form submissions

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    admin_notes text,
    resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_user_id ON public.contact_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own submissions
CREATE POLICY "Users can view their own contact submissions"
  ON public.contact_submissions FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR (SELECT auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Policy: Anyone can create a contact submission
CREATE POLICY "Anyone can create contact submissions"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

-- Policy: Only admins can update submissions
CREATE POLICY "Admins can update contact submissions"
  ON public.contact_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Policy: Only admins can delete submissions
CREATE POLICY "Admins can delete contact submissions"
  ON public.contact_submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer set search_path = '';

DROP TRIGGER IF EXISTS set_updated_at ON public.contact_submissions;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT SELECT, INSERT ON public.contact_submissions TO authenticated;
GRANT SELECT, INSERT ON public.contact_submissions TO anon;
GRANT ALL ON public.contact_submissions TO service_role;

-- Comments
COMMENT ON TABLE public.contact_submissions IS 'Stores contact form submissions from users and visitors';
COMMENT ON COLUMN public.contact_submissions.status IS 'Submission status: pending, in_progress, resolved, closed';
COMMENT ON COLUMN public.contact_submissions.admin_notes IS 'Internal notes added by support team';
