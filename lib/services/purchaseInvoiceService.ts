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

// Types matching the database schema
export interface PurchaseRegister {
  id?: string;
  source: 'whatsapp' | 'email' | 'manual' | 'bulk';
  supplier_name?: string | null;
  supplier_gstin?: string | null;
  supplier_state_code?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  invoice_type?: string | null;
  buyer_gstin?: string | null;
  place_of_supply_state_code?: string | null;
  taxable_value?: number | null;
  cgst_amount?: number | null;
  sgst_amount?: number | null;
  igst_amount?: number | null;
  cess_amount?: number | null;
  total_invoice_value?: number | null;
  hsn_or_sac_code?: string | null;
  description_of_goods_services?: string | null;
  quantity?: number | null;
  unit_of_measure?: string | null;
  rate_per_unit?: number | null;
  is_reverse_charge?: boolean | null;
  is_itc_eligible?: boolean | null;
  itc_claimed_cgst?: number | null;
  itc_claimed_sgst?: number | null;
  itc_claimed_igst?: number | null;
  itc_claimed_cess?: number | null;
  invoice_bucket_url?: string | null;
  ocr_raw_json?: any | null;
  ocr_confidence_score?: number | null;
  invoice_status?: 'extracted' | 'verified' | 'error' | 'pending' | 'needs_review' | 'wa_quarantine' | null;
  // WhatsApp intake tracking (single-tenant for now; TODO: multi-tenant number->account map)
  wa_sender_phone?: string | null;
  wa_attempt_count?: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Statuses that are considered "validated / visible" in the dashboard tab.
 * Anything not in this set (e.g. `wa_quarantine`) is hidden by default so that
 * unvalidated WhatsApp invoices never surface until they pass the gate.
 */
export const VISIBLE_INVOICE_STATUSES = [
  'extracted',
  'verified',
  'pending',
  'needs_review',
  'error',
] as const;

/** Statuses hidden from the default dashboard query. */
export const HIDDEN_INVOICE_STATUSES = ['wa_quarantine'] as const;

export interface PurchaseRemark {
  id?: string;
  purchase_id: string;
  field_name: string;
  issue_type: 'missing' | 'unreadable' | 'mismatch' | 'invalid_format';
  detected_value?: string | null;
  expected_value?: string | null;
  confidence_score?: number | null;
  status?: 'open' | 'resolved' | 'ignored';
  comment?: string | null;
  created_at?: string;
}

/**
 * Upload a file to Supabase Storage bucket
 */
export async function uploadInvoiceToStorage(
  file: File,
  invoiceId: string,
  useAdmin = false
): Promise<{ url: string | null; error: string | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${invoiceId}.${fileExt}`;
    const filePath = `Purchase Invoice/${fileName}`;

    const client = useAdmin ? supabaseAdmin : supabase;
    const { data, error } = await client.storage
      .from('Saral_GST')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      return { url: null, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = client.storage
      .from('Saral_GST')
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (err: any) {
    console.error('Exception uploading file:', err);
    return { url: null, error: err.message };
  }
}

/**
 * Create a new purchase invoice record
 */
export async function createPurchaseInvoice(
  invoice: PurchaseRegister,
  useAdmin = false
): Promise<{ data: PurchaseRegister | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;
    const { data, error } = await client
      .from('purchase_register')
      .insert([invoice])
      .select()
      .single();

    if (error) {
      console.error('Error creating purchase invoice:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Exception creating purchase invoice:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Update an existing purchase invoice record
 */
export async function updatePurchaseInvoice(
  id: string,
  updates: Partial<PurchaseRegister>,
  useAdmin = false
): Promise<{ data: PurchaseRegister | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;
    const { data, error } = await client
      .from('purchase_register')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating purchase invoice:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Exception updating purchase invoice:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Get all purchase invoices with optional filters
 */
export async function getPurchaseInvoices(filters?: {
  source?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  vendor?: string;
  /** Set true to include quarantined/hidden statuses (e.g. a "Needs Review" admin view). */
  includeHidden?: boolean;
}): Promise<{ data: PurchaseRegister[] | null; error: string | null }> {
  try {
    let query = supabase
      .from('purchase_register')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.source) {
      query = query.eq('source', filters.source);
    }

    if (filters?.status) {
      // Explicit status filter wins (lets callers request `wa_quarantine` directly).
      query = query.eq('invoice_status', filters.status);
    } else if (!filters?.includeHidden) {
      // Default: hide quarantine/intake-only states from the dashboard tab.
      query = query.not(
        'invoice_status',
        'in',
        `(${HIDDEN_INVOICE_STATUSES.join(',')})`
      );
    }

    if (filters?.startDate) {
      query = query.gte('invoice_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('invoice_date', filters.endDate);
    }

    if (filters?.vendor) {
      query = query.ilike('supplier_name', `%${filters.vendor}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching purchase invoices:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Exception fetching purchase invoices:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Get a single purchase invoice by ID
 */
export async function getPurchaseInvoiceById(
  id: string
): Promise<{ data: PurchaseRegister | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('purchase_register')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching purchase invoice:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Exception fetching purchase invoice:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Create a remark/issue for a purchase invoice
 */
export async function createPurchaseRemark(
  remark: PurchaseRemark,
  useAdmin = false
): Promise<{ data: PurchaseRemark | null; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;
    const { data, error } = await client
      .from('purchase_remarks')
      .insert([remark])
      .select()
      .single();

    if (error) {
      console.error('Error creating purchase remark:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Exception creating purchase remark:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Get remarks for a purchase invoice
 */
export async function getPurchaseRemarks(
  purchaseId: string
): Promise<{ data: PurchaseRemark[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('purchase_remarks')
      .select('*')
      .eq('purchase_id', purchaseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase remarks:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Exception fetching purchase remarks:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Find an existing (non-quarantined) purchase invoice with the same supplier
 * GSTIN + invoice number. Used for duplicate detection at WhatsApp intake.
 */
export async function findDuplicateInvoice(
  supplierGstin: string | null | undefined,
  invoiceNumber: string | null | undefined,
  excludeId?: string,
  useAdmin = false
): Promise<{ data: PurchaseRegister | null; error: string | null }> {
  try {
    if (!supplierGstin || !invoiceNumber) {
      return { data: null, error: null };
    }

    const client = useAdmin ? supabaseAdmin : supabase;
    let query = client
      .from('purchase_register')
      .select('*')
      .eq('supplier_gstin', supplierGstin)
      .eq('invoice_number', invoiceNumber)
      // A quarantined record is not yet "received" — don't treat it as a dup.
      .neq('invoice_status', 'wa_quarantine')
      .limit(1);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking for duplicate invoice:', error);
      return { data: null, error: error.message };
    }

    return { data: data && data.length > 0 ? data[0] : null, error: null };
  } catch (err: any) {
    console.error('Exception checking for duplicate invoice:', err);
    return { data: null, error: err.message };
  }
}

// =====================================================
// WhatsApp intake tracking (correlates resends)
// =====================================================

export type InvoiceKind = 'purchase' | 'sales';

export interface WhatsAppIntake {
  id?: string;
  sender_phone: string;
  invoice_number?: string | null;
  invoice_kind?: InvoiceKind | null;
  attempt_count?: number | null;
  last_status?:
    | 'pending'
    | 'validated'
    | 'rejected'
    | 'needs_review'
    | 'awaiting_kind'
    | null;
  last_error_summary?: string | null;
  linked_purchase_id?: string | null;
  linked_sales_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Find an existing intake record for a sender + invoice number so we can
 * correlate a resend with its prior attempts.
 */
export async function findWhatsAppIntake(
  senderPhone: string,
  invoiceNumber: string | null | undefined
): Promise<{ data: WhatsAppIntake | null; error: string | null }> {
  try {
    let query = supabaseAdmin
      .from('whatsapp_intake')
      .select('*')
      .eq('sender_phone', senderPhone)
      .limit(1);

    // Invoice number may be null on a first/unreadable attempt — match nulls too.
    if (invoiceNumber) {
      query = query.eq('invoice_number', invoiceNumber);
    } else {
      query = query.is('invoice_number', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching whatsapp_intake:', error);
      return { data: null, error: error.message };
    }

    return { data: data && data.length > 0 ? data[0] : null, error: null };
  } catch (err: any) {
    console.error('Exception fetching whatsapp_intake:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Upsert an intake record (insert on first contact, update attempt_count/status
 * on a resend). Returns the persisted record.
 */
export async function upsertWhatsAppIntake(
  intake: WhatsAppIntake
): Promise<{ data: WhatsAppIntake | null; error: string | null }> {
  try {
    const { id, ...fields } = intake;
    const payload: Record<string, unknown> = {
      ...fields,
      updated_at: new Date().toISOString(),
    };
    // Omit id on insert so Postgres DEFAULT uuid_generate_v4() applies.
    // Explicit `id: undefined` would otherwise be sent as NULL.

    let result;
    if (id) {
      result = await supabaseAdmin
        .from('whatsapp_intake')
        .update({ ...payload, id })
        .eq('id', id)
        .select()
        .single();
    } else {
      result = await supabaseAdmin
        .from('whatsapp_intake')
        .insert([payload])
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error upserting whatsapp_intake:', result.error);
      return { data: null, error: result.error.message };
    }

    return { data: result.data, error: null };
  } catch (err: any) {
    console.error('Exception upserting whatsapp_intake:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Delete a purchase invoice and its remarks
 */
export async function deletePurchaseInvoice(
  id: string,
  useAdmin = false
): Promise<{ success: boolean; error: string | null }> {
  try {
    const client = useAdmin ? supabaseAdmin : supabase;
    
    // First delete remarks
    await client
      .from('purchase_remarks')
      .delete()
      .eq('purchase_id', id);

    // Then delete the invoice
    const { error } = await client
      .from('purchase_register')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting purchase invoice:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Exception deleting purchase invoice:', err);
    return { success: false, error: err.message };
  }
}
