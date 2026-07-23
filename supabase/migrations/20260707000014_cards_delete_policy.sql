-- ============================================================
-- Phase 19: Cards Delete Policies
-- ============================================================

CREATE POLICY "Users can delete own cards" ON public.cards FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete all cards" ON public.cards FOR DELETE USING (public.is_admin(auth.uid()));
