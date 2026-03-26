
-- Create patient_tests table for multi-test support
CREATE TABLE public.patient_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  test_date date NOT NULL DEFAULT CURRENT_DATE,
  result text NOT NULL,
  result_file_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add email and approved columns to patients
ALTER TABLE public.patients ADD COLUMN email text;
ALTER TABLE public.patients ADD COLUMN approved boolean NOT NULL DEFAULT false;

-- Remove old test columns from patients (migrate data first)
-- Migrate existing patient data to patient_tests
INSERT INTO public.patient_tests (patient_id, test_name, test_date, result, result_file_path)
SELECT id, test_name, test_date, result, result_file_path FROM public.patients
WHERE test_name IS NOT NULL AND result IS NOT NULL;

-- Drop old columns
ALTER TABLE public.patients DROP COLUMN test_name;
ALTER TABLE public.patients DROP COLUMN result;
ALTER TABLE public.patients DROP COLUMN result_file_path;
ALTER TABLE public.patients DROP COLUMN test_date;

-- Add unique constraint on email (case-insensitive)
CREATE UNIQUE INDEX patients_email_unique ON public.patients (LOWER(email));

-- Enable RLS on patient_tests
ALTER TABLE public.patient_tests ENABLE ROW LEVEL SECURITY;

-- Public can read tests (when accessed via patient lookup)
CREATE POLICY "Public can read patient tests"
ON public.patient_tests FOR SELECT TO public
USING (true);

-- Authenticated users can manage tests
CREATE POLICY "Authenticated users can insert tests"
ON public.patient_tests FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update tests"
ON public.patient_tests FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete tests"
ON public.patient_tests FOR DELETE TO authenticated
USING (true);

-- Enable realtime for patient_tests
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_tests;
