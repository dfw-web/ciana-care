
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'patient');

-- 2. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS on user_roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Admins table
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read admin records"
  ON public.admins FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Results table
CREATE TABLE public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  result_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on results"
  ON public.results FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read results by patient"
  ON public.results FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX idx_results_patient_id ON public.results(patient_id);

-- 7. Result codes table
CREATE TABLE public.result_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.result_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage result codes"
  ON public.result_codes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read valid codes"
  ON public.result_codes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX idx_result_codes_code ON public.result_codes(code);

-- 8. Validation trigger: prevent using expired or already-used codes
CREATE OR REPLACE FUNCTION public.validate_result_code_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.is_used = true AND NEW.is_used = true THEN
    RAISE EXCEPTION 'This result code has already been used';
  END IF;
  IF NEW.is_used = true AND OLD.is_used = false AND now() > OLD.expires_at THEN
    RAISE EXCEPTION 'This result code has expired';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_result_code
  BEFORE UPDATE ON public.result_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_result_code_usage();
