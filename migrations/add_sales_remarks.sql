-- Sales validation remarks for GSTR-1 review
-- This table stores extraction and validation issues raised by the sales upload pipeline.

CREATE TABLE IF NOT EXISTS public.sales_remarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sales_id uuid NOT NULL,
  field_name text NOT NULL,
  issue_type text NOT NULL,
  detected_value text,
  expected_value text,
  confidence_score numeric,
  status text NOT NULL DEFAULT 'open',
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sales_remarks_pkey PRIMARY KEY (id),
  CONSTRAINT sales_remarks_sales_id_fkey FOREIGN KEY (sales_id) REFERENCES public.sales_invoices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sales_remarks_sales_id ON public.sales_remarks (sales_id);
CREATE INDEX IF NOT EXISTS idx_sales_remarks_status ON public.sales_remarks (status);
CREATE INDEX IF NOT EXISTS idx_sales_remarks_created_at ON public.sales_remarks (created_at DESC);

ALTER TABLE public.sales_remarks DISABLE ROW LEVEL SECURITY;