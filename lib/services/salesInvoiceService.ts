import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase client (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (bypasses RLS) - use only in API routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Sales Register Interface matching database schema
 */
export interface SalesRegister {
  id?: string;
  
  // Seller
  seller_gstin: string;
  seller_state_code: string;
  
  // Buyer
  customer_name?: string | null;
  customer_gstin?: string | null;
  customer_state_code?: string | null;
  
  // Invoice identity
  invoice_number: string;
  invoice_date: string;
  invoice_type: 'B2B' | 'B2C' | 'Export' | 'SEZ' | 'CreditNote';
  supply_type: 'Intra' | 'Inter';
  place_of_supply_state_code: string;
  
  // Goods/Services
  hsn_or_sac?: string | null;
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  rate?: number | null;
  
  // Values
  taxable_value: number;
  cgst?: number | null;
  sgst?: number | null;
  igst?: number | null;
  cess?: number | null;
  tcs?: number | null;
  total_invoice_value?: number | null; // Generated column
  
  // GST flags
  is_reverse_charge?: boolean | null;
  is_export?: boolean | null;
  is_sez?: boolean | null;
  is_itc_eligible?: boolean | null;
  
  // E-Invoice & logistics
  irn?: string | null;
  ack_no?: string | null;
  ack_date?: string | null;
  eway_bill_no?: string | null;
  vehicle_no?: string | null;
  transport_mode?: string | null;
  
  // Payment tracking
  payment_status?: 'unpaid' | 'partial' | 'paid' | null;
  payment_due_date?: string | null;
  
  // AI processing
  invoice_bucket_url: string;
  ocr_raw_json?: any | null;
  ocr_confidence_score?: number | null;
  extraction_source?: 'manual' | 'ocr' | 'ocr+llm' | null;
  invoice_status?: 'extracted' | 'verified' | 'needs_review' | null;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

/**
 * Sales Remarks Interface
 */
export interface SalesRemark {
  id?: string;
  sales_id: string;
  field_name: string;
  issue_type: 'missing' | 'mismatch' | 'invalid' | 'low_confidence';
  detected_value?: string | null;
  expected_value?: string | null;
  confidence_score?: number | null;
  status?: 'open' | 'resolved' | 'ignored';
  comment?: string | null;
  created_at?: string;
}

/**
 * Upload file to Supabase Storage bucket
 */
export async function uploadSalesInvoice(
  file: File,
  useAdmin = false
): Promise<{ data: { path: string; url: string } | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `Sales Invoice/${fileName}`;

    const { data, error } = await client.storage
      .from('Saral_GST')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      return { data: null, error: error.message };
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from('Saral_GST')
      .getPublicUrl(filePath);

    return {
      data: {
        path: filePath,
        url: urlData.publicUrl,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Exception uploading file:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Create a new sales invoice record
 */
export async function createSalesInvoice(
  invoice: Partial<SalesRegister>,
  useAdmin = false
): Promise<{ data: SalesRegister | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;

    const { data, error } = await client
      .from('sales_register')
      .insert(invoice)
      .select()
      .single();

    if (error) {
      console.error('Error creating sales invoice:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Exception creating sales invoice:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Get all sales invoices
 */
export async function getSalesInvoices(
  useAdmin = false
): Promise<{ data: SalesRegister[] | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;

    const { data, error } = await client
      .from('sales_register')
      .select('*')
      .order('invoice_date', { ascending: false });

    if (error) {
      console.error('Error fetching sales invoices:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Exception fetching sales invoices:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Get a single sales invoice by ID
 */
export async function getSalesInvoiceById(
  id: string,
  useAdmin = false
): Promise<{ data: SalesRegister | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;

    const { data, error } = await client
      .from('sales_register')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching sales invoice:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Exception fetching sales invoice:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Update a sales invoice
 */
export async function updateSalesInvoice(
  id: string,
  updates: Partial<SalesRegister>,
  useAdmin = false
): Promise<{ data: SalesRegister | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;

    const { data, error } = await client
      .from('sales_register')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating sales invoice:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Exception updating sales invoice:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Delete a sales invoice
 */
export async function deleteSalesInvoice(
  id: string,
  useAdmin = false
): Promise<{ success: boolean; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;

    const { error } = await client
      .from('sales_register')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting sales invoice:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Exception deleting sales invoice:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create sales remarks (validation issues)
 */
export async function createSalesRemarks(
  remarks: Partial<SalesRemark>[],
  useAdmin = false
): Promise<{ data: SalesRemark[] | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;

    if (remarks.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await client
      .from('sales_remarks')
      .insert(remarks)
      .select();

    if (error) {
      console.error('Error creating sales remarks:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Exception creating sales remarks:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Get remarks for a sales invoice
 */
export async function getSalesRemarks(
  salesId: string,
  useAdmin = false
): Promise<{ data: SalesRemark[] | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;

    const { data, error } = await client
      .from('sales_remarks')
      .select('*')
      .eq('sales_id', salesId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales remarks:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Exception fetching sales remarks:', error);
    return { data: null, error: error.message };
  }
}

// ============================================================
// NEW: sales_invoices table (improved schema)
// ============================================================

/**
 * Interface matching the new sales_invoices Supabase table.
 */
export interface SalesInvoice {
  id?: string;
  user_id?: string;

  // 1. Basic Invoice Information
  invoice_date?: string | null;
  voucher_type?: string | null;          // Sales | Credit Note | Debit Note
  invoice_number?: string | null;
  invoice_type?: string | null;          // B2B | B2C Small | B2C Large | Export

  // 2. Customer Details
  customer_name?: string | null;
  customer_gstin?: string | null;
  place_of_supply?: string | null;       // e.g. "27-Maharashtra"

  // 3. Product & Pricing
  hsn_sac_code?: string | null;
  quantity?: number | null;
  uqc?: string | null;                   // KGS | MTR | PCS | NOS | LTR | BAG | BOX
  rate?: number | null;

  // 4. Financial & Tax Breakdown
  local_sales_taxable_18?: number | null;
  local_sales_taxable_12?: number | null;
  oms_sales_taxable_12?: number | null;
  taxable_value?: number | null;
  cgst_amount?: number | null;
  sgst_amount?: number | null;
  igst_amount?: number | null;
  tcs_cess?: number | null;
  round_off?: number | null;
  gross_total?: number | null;

  // 5. Advanced Compliance
  reverse_charge?: boolean | null;
  eway_bill_number?: string | null;
  irn?: string | null;

  // File & AI Processing
  invoice_file_url?: string | null;
  extraction_status?: 'pending' | 'extracted' | 'needs_review' | null;
  gemini_raw_json?: any | null;

  created_at?: string;
  updated_at?: string;
}

/** Create a record in the new sales_invoices table */
export async function createNewSalesInvoice(
  invoice: Partial<SalesInvoice>,
  useAdmin = false
): Promise<{ data: SalesInvoice | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;
    const { data, error } = await client
      .from('sales_invoices')
      .insert(invoice)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/** Fetch all records from sales_invoices */
export async function getNewSalesInvoices(
  useAdmin = false
): Promise<{ data: SalesInvoice[] | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;
    const { data, error } = await client
      .from('sales_invoices')
      .select('*')
      .order('invoice_date', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/** Fetch a single record from sales_invoices by id */
export async function getNewSalesInvoiceById(
  id: string,
  useAdmin = false
): Promise<{ data: SalesInvoice | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;
    const { data, error } = await client
      .from('sales_invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/** Update a record in sales_invoices */
export async function updateNewSalesInvoice(
  id: string,
  updates: Partial<SalesInvoice>,
  useAdmin = false
): Promise<{ data: SalesInvoice | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;
    const { data, error } = await client
      .from('sales_invoices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/** Delete a record from sales_invoices */
export async function deleteNewSalesInvoice(
  id: string,
  useAdmin = false
): Promise<{ success: boolean; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;
    const { error } = await client.from('sales_invoices').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
