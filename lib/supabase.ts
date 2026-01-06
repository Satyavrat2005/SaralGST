import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to fetch GSTR-1B URL from purchase_register table
export async function getGSTR1BUrl(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('purchase_register')
      .select('gstr1b_url')
      .single();

    if (error) {
      console.error('Error fetching GSTR-1B URL:', error);
      return null;
    }

    return data?.gstr1b_url || null;
  } catch (err) {
    console.error('Exception fetching GSTR-1B URL:', err);
    return null;
  }
}

// Function to download file from URL
export async function downloadFileFromUrl(url: string, filename: string = 'GSTR-1B_Draft.pdf') {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    window.URL.revokeObjectURL(link.href);
    
    return true;
  } catch (err) {
    console.error('Error downloading file:', err);
    return false;
  }
}

// Function to fetch reconciliation JSON from purchase_register table
export async function getReconciliationData(): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('purchase_register')
      .select('reconciliation_json')
      .single();

    if (error) {
      console.error('Supabase error fetching reconciliation data:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return null;
    }

    console.log('Raw data from Supabase:', data);
    
    // Parse the JSON if it's a string
    let reconciliationData = data?.reconciliation_json;
    
    if (!reconciliationData) {
      console.error('reconciliation_json column is null or undefined');
      return null;
    }
    
    if (typeof reconciliationData === 'string') {
      console.log('Parsing string JSON...');
      try {
        reconciliationData = JSON.parse(reconciliationData);
      } catch (parseError) {
        console.error('Failed to parse JSON string:', parseError);
        return null;
      }
    }
    
    // Handle if data is an array (your case: [{output: {...}}])
    if (Array.isArray(reconciliationData) && reconciliationData.length > 0) {
      console.log('Data is an array, extracting first element...');
      reconciliationData = reconciliationData[0];
    }
    
    console.log('Returning processed data');
    return reconciliationData;
  } catch (err) {
    console.error('Exception fetching reconciliation data:', err);
    return null;
  }
}

// Function to fetch GSTR-3B JSON from purchase_register table
export async function getGSTR3BData(): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('purchase_register')
      .select('gstr3b_json')
      .single();

    if (error) {
      console.error('Supabase error fetching GSTR-3B data:', error);
      return null;
    }

    let gstr3bData = data?.gstr3b_json;
    
    if (!gstr3bData) {
      console.error('gstr3b_json column is null or undefined');
      return null;
    }
    
    if (typeof gstr3bData === 'string') {
      try {
        gstr3bData = JSON.parse(gstr3bData);
      } catch (parseError) {
        console.error('Failed to parse GSTR-3B JSON string:', parseError);
        return null;
      }
    }
    
    // Handle if data is an array
    if (Array.isArray(gstr3bData) && gstr3bData.length > 0) {
      gstr3bData = gstr3bData[0];
    }
    
    return gstr3bData;
  } catch (err) {
    console.error('Exception fetching GSTR-3B data:', err);
    return null;
  }
}

// Function to fetch invoice data from pdf table
export interface PDFInvoice {
  company_name: string;
  invoice_number: string;
  status: string;
  reason: string | null;
  links: string;
}

export async function getPDFInvoices(): Promise<PDFInvoice[] | null> {
  try {
    const { data, error } = await supabase
      .from('pdf')
      .select('company_name, invoice_number, status, reason, links');

    if (error) {
      console.error('Error fetching PDF invoices:', error);
      return null;
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching PDF invoices:', err);
    return null;
  }
}
