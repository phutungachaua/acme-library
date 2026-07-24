-- Explicit default-deny policies document that browser-facing Supabase roles
-- must never access the internal library tables directly.
CREATE POLICY "deny_data_api" ON public."User" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."Book" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."Author" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."BookAuthor" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."Category" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."Publisher" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."Location" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."BookCopy" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."BorrowRecord" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."Fine" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."Review" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."ViewHistory" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."Feedback" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."Notification" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."SystemSetting" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."AdminAuditLog" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_data_api" ON public."RefreshToken" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
