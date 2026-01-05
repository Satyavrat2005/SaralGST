import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  invoice_status?: 'extracted' | 'verified' | 'error' | 'pending' | 'needs_review' | null;
  created_at?: string;
  updated_at?: string;
}

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
  invoiceId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${invoiceId}.${fileExt}`;
    const filePath = `SARALGST/Purchase Invoice/${fileName}`;

    const { data, error } = await supabase.storage
      .from('invoices') // Make sure this bucket exists in your Supabase project
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      return { url: null, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
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
  invoice: PurchaseRegister
): Promise<{ data: PurchaseRegister | null; error: string | null }> {
  try {
    const { data, error } = await supabase
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
  updates: Partial<PurchaseRegister>
): Promise<{ data: PurchaseRegister | null; error: string | null }> {
  try {
    const { data, error } = await supabase
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
      query = query.eq('invoice_status', filters.status);
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
  remark: PurchaseRemark
): Promise<{ data: PurchaseRemark | null; error: string | null }> {
  try {
    const { data, error } = await supabase
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
 * Delete a purchase invoice and its remarks
 */
export async function deletePurchaseInvoice(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // First delete remarks
    await supabase
      .from('purchase_remarks')
      .delete()
      .eq('purchase_id', id);

    // Then delete the invoice
    const { error } = await supabase
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
