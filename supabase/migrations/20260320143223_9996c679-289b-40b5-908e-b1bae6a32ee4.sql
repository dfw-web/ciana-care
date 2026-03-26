-- Create patients table for storing lab results
CREATE TABLE public.patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    patient_name TEXT NOT NULL,
    test_name TEXT NOT NULL,
    result TEXT NOT NULL,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Public can look up results by code (read-only)
CREATE POLICY "Anyone can look up results by code"
ON public.patients FOR SELECT
USING (true);

-- Only authenticated users (admins) can insert
CREATE POLICY "Authenticated users can insert patients"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update patients"
ON public.patients FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can delete
CREATE POLICY "Authenticated users can delete patients"
ON public.patients FOR DELETE
TO authenticated
USING (true);