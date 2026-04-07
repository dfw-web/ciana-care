
-- Inventory items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Laboratory Consumables', 'Drugs & Treatment')),
  price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inventory" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert inventory" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update inventory" ON public.inventory_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete inventory" ON public.inventory_items FOR DELETE TO authenticated USING (true);

-- Stock usage table
CREATE TABLE public.stock_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity_used INTEGER NOT NULL,
  staff_name TEXT NOT NULL,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read usage" ON public.stock_usage FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert usage" ON public.stock_usage FOR INSERT TO authenticated WITH CHECK (true);

-- Activity log table
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_name TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read logs" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert logs" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- Finance income table
CREATE TABLE public.finance_income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL,
  source TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read income" ON public.finance_income FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert income" ON public.finance_income FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update income" ON public.finance_income FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete income" ON public.finance_income FOR DELETE TO authenticated USING (true);

-- Finance expenses table
CREATE TABLE public.finance_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read expenses" ON public.finance_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert expenses" ON public.finance_expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update expenses" ON public.finance_expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete expenses" ON public.finance_expenses FOR DELETE TO authenticated USING (true);
