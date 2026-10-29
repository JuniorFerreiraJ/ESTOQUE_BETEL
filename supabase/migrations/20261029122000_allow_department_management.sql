-- Permite que usuários autenticados editem e removam departamentos.
DROP POLICY IF EXISTS "Allow authenticated users to update departments" ON public.departments;
CREATE POLICY "Allow authenticated users to update departments"
  ON public.departments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete departments" ON public.departments;
CREATE POLICY "Allow authenticated users to delete departments"
  ON public.departments
  FOR DELETE
  TO authenticated
  USING (true);