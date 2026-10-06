CREATE TABLE public.design_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL UNIQUE REFERENCES public.entries(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'ready',
  spec jsonb,
  files jsonb,
  error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_systems TO authenticated;
GRANT ALL ON public.design_systems TO service_role;
ALTER TABLE public.design_systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage design systems" ON public.design_systems FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));