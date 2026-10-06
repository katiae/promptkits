ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS html_content text;
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS scan_report jsonb;