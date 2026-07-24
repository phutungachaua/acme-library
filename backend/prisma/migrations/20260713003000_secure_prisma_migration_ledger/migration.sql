-- Prisma creates this internal table before applying migrations. Secure it from
-- Supabase browser-facing roles just like the application tables.
REVOKE ALL ON public."_prisma_migrations" FROM anon, authenticated, service_role;
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_data_api" ON public."_prisma_migrations";
CREATE POLICY "deny_data_api" ON public."_prisma_migrations"
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
