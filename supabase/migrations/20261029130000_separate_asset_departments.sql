-- Separa os departamentos de ativos dos departamentos usados pelo estoque.
CREATE TABLE IF NOT EXISTS public.asset_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

INSERT INTO public.asset_departments (name)
SELECT DISTINCT upper(regexp_replace(btrim(department), '\s+', ' ', 'g'))
FROM public.assets
WHERE department IS NOT NULL AND btrim(department) <> ''
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.asset_departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read asset departments" ON public.asset_departments;
CREATE POLICY "Allow authenticated users to read asset departments"
  ON public.asset_departments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert asset departments" ON public.asset_departments;
CREATE POLICY "Allow authenticated users to insert asset departments"
  ON public.asset_departments FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update asset departments" ON public.asset_departments;
CREATE POLICY "Allow authenticated users to update asset departments"
  ON public.asset_departments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete asset departments" ON public.asset_departments;
CREATE POLICY "Allow authenticated users to delete asset departments"
  ON public.asset_departments FOR DELETE TO authenticated USING (true);

-- Remove da lista do estoque somente departamentos sem itens vinculados.
DELETE FROM public.departments AS departments
WHERE upper(regexp_replace(btrim(departments.name), '\s+', ' ', 'g')) NOT IN
  ('TI', 'ADMINISTRATIVO', 'COMERCIAL', 'OPERACIONAL')
  AND NOT EXISTS (
    SELECT 1
    FROM public.inventory_items AS items
    WHERE items.department_id = departments.id
  );