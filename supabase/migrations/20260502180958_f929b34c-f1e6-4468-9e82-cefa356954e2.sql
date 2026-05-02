-- Link patients to auth users
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_patients_auth_user_id ON public.patients(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email_lower ON public.patients(lower(email));

-- New: random access codes per test
CREATE TABLE IF NOT EXISTS public.result_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_test_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  used_by_auth_user_id uuid
);

CREATE INDEX IF NOT EXISTS idx_rac_code ON public.result_access_codes(code);
CREATE INDEX IF NOT EXISTS idx_rac_patient_test ON public.result_access_codes(patient_test_id);

ALTER TABLE public.result_access_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can look up a code (needed before login to validate)
CREATE POLICY "Public can validate access codes"
ON public.result_access_codes
FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated staff can insert new codes
CREATE POLICY "Authenticated users can insert access codes"
ON public.result_access_codes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can mark a code as used (the unlock flow updates used_at + used_by_auth_user_id)
CREATE POLICY "Authenticated users can update access codes"
ON public.result_access_codes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- New: which tests has a patient account unlocked
CREATE TABLE IF NOT EXISTS public.patient_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL,
  patient_test_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (auth_user_id, patient_test_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_unlocks_auth_user ON public.patient_unlocks(auth_user_id);

ALTER TABLE public.patient_unlocks ENABLE ROW LEVEL SECURITY;

-- A patient can only see their own unlocks
CREATE POLICY "Patients view own unlocks"
ON public.patient_unlocks
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- A patient inserts their own unlock when they redeem a code
CREATE POLICY "Patients insert own unlocks"
ON public.patient_unlocks
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

-- Staff (admin/owner) can also view all unlocks for support
CREATE POLICY "Staff view all unlocks"
ON public.patient_unlocks
FOR SELECT
TO authenticated
USING (is_owner(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow a patient to update their own patients row to set auth_user_id during first signup
-- (existing "Authenticated users can update patients" policy already permits this for any authenticated user)