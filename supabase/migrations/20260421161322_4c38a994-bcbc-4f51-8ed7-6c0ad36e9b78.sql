
-- Helper: check if user is owner OR admin (admin = legacy owner)
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner','admin')
  )
$$;

-- FINANCE_INCOME: owner-only
DROP POLICY IF EXISTS "Authenticated users can read income" ON public.finance_income;
DROP POLICY IF EXISTS "Authenticated users can insert income" ON public.finance_income;
DROP POLICY IF EXISTS "Authenticated users can update income" ON public.finance_income;
DROP POLICY IF EXISTS "Authenticated users can delete income" ON public.finance_income;

CREATE POLICY "Owners read income" ON public.finance_income FOR SELECT TO authenticated USING (public.is_owner(auth.uid()));
CREATE POLICY "Owners insert income" ON public.finance_income FOR INSERT TO authenticated WITH CHECK (public.is_owner(auth.uid()));
CREATE POLICY "Owners update income" ON public.finance_income FOR UPDATE TO authenticated USING (public.is_owner(auth.uid()));
CREATE POLICY "Owners delete income" ON public.finance_income FOR DELETE TO authenticated USING (public.is_owner(auth.uid()));

-- FINANCE_EXPENSES: owner-only
DROP POLICY IF EXISTS "Authenticated users can read expenses" ON public.finance_expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.finance_expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.finance_expenses;
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.finance_expenses;

CREATE POLICY "Owners read expenses" ON public.finance_expenses FOR SELECT TO authenticated USING (public.is_owner(auth.uid()));
CREATE POLICY "Owners insert expenses" ON public.finance_expenses FOR INSERT TO authenticated WITH CHECK (public.is_owner(auth.uid()));
CREATE POLICY "Owners update expenses" ON public.finance_expenses FOR UPDATE TO authenticated USING (public.is_owner(auth.uid()));
CREATE POLICY "Owners delete expenses" ON public.finance_expenses FOR DELETE TO authenticated USING (public.is_owner(auth.uid()));

-- ACTIVITY_LOG: owner-only read
DROP POLICY IF EXISTS "Authenticated users can read logs" ON public.activity_log;
CREATE POLICY "Owners read activity log" ON public.activity_log FOR SELECT TO authenticated USING (public.is_owner(auth.uid()));
