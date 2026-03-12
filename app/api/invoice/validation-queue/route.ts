import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/services/purchaseInvoiceService';

interface ValidationQueueInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  vendor: string; // supplier_name or customer_name
  gstin: string; // supplier_gstin or seller_gstin/customer_gstin
  amount: number;
  type: 'purchase' | 'sales';
  validation_status: 'passed' | 'partial' | 'failed';
  errors: ValidationError[];
  warnings: ValidationWarning[];
  created_at: string;
}

interface ValidationError {
  type: 'critical';
  message: string;
  expected?: string;
  found?: string;
  detail?: string;
}

interface ValidationWarning {
  type: 'warning';
  message: string;
  impact?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all'; // all, passed, partial, failed

    // Fetch purchase invoices
    const { data: purchaseInvoices, error: purchaseError } = await supabaseAdmin
      .from('purchase_register')
      .select('*')
      .order('created_at', { ascending: false });

    if (purchaseError) {
      console.error('Error fetching purchase invoices:', purchaseError);
      return NextResponse.json({ error: 'Failed to fetch purchase invoices' }, { status: 500 });
    }

    // Fetch sales invoices (optional - table may not exist yet)
    let salesInvoices: any[] = [];
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from('sales_register')
      .select('*')
      .order('created_at', { ascending: false });

    if (salesError) {
      console.warn('Sales register table not found or error fetching:', salesError.message);
      // Continue without sales invoices
      salesInvoices = [];
    } else {
      salesInvoices = salesData || [];
    }

    // Fetch remarks for all invoices
    const purchaseIds = purchaseInvoices?.map(inv => inv.id) || [];
    const salesIds = salesInvoices?.map(inv => inv.id) || [];

    const { data: purchaseRemarks } = await supabaseAdmin
      .from('purchase_remarks')
      .select('*')
      .in('purchase_id', purchaseIds)
      .eq('status', 'open');

    const { data: salesRemarks } = await supabaseAdmin
      .from('sales_remarks')
      .select('*')
      .in('sales_id', salesIds)
      .eq('status', 'open');

    // Group remarks by invoice ID
    const purchaseRemarksMap = new Map<string, any[]>();
    purchaseRemarks?.forEach(remark => {
      if (!purchaseRemarksMap.has(remark.purchase_id)) {
        purchaseRemarksMap.set(remark.purchase_id, []);
      }
      purchaseRemarksMap.get(remark.purchase_id)!.push(remark);
    });

    const salesRemarksMap = new Map<string, any[]>();
    salesRemarks?.forEach(remark => {
      if (!salesRemarksMap.has(remark.sales_id)) {
        salesRemarksMap.set(remark.sales_id, []);
      }
      salesRemarksMap.get(remark.sales_id)!.push(remark);
    });

    // Process purchase invoices
    const processedPurchaseInvoices: ValidationQueueInvoice[] = (purchaseInvoices || []).map(invoice => {
      const remarks = purchaseRemarksMap.get(invoice.id) || [];
      const { errors, warnings } = categorizeRemarks(remarks);
      const missingFields = getPurchaseMissingFields(invoice);
      
      // Add missing field errors
      missingFields.forEach(field => {
        errors.push({
          type: 'critical',
          message: `Missing required field: ${field}`,
          detail: 'This field is required for GST compliance'
        });
      });

      const validationStatus = getValidationStatus(invoice.invoice_status, errors, warnings);

      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number || 'N/A',
        invoice_date: invoice.invoice_date || 'N/A',
        vendor: invoice.supplier_name || 'Unknown Supplier',
        gstin: invoice.supplier_gstin || 'N/A',
        amount: invoice.total_invoice_value || 0,
        type: 'purchase',
        validation_status: validationStatus,
        errors,
        warnings,
        created_at: invoice.created_at
      };
    });

    // Process sales invoices
    const processedSalesInvoices: ValidationQueueInvoice[] = (salesInvoices || []).map(invoice => {
      const remarks = salesRemarksMap.get(invoice.id) || [];
      const { errors, warnings } = categorizeRemarks(remarks);
      const missingFields = getSalesMissingFields(invoice);
      
      // Add missing field errors
      missingFields.forEach(field => {
        errors.push({
          type: 'critical',
          message: `Missing required field: ${field}`,
          detail: 'This field is required for GST compliance'
        });
      });

      const validationStatus = getValidationStatus(invoice.invoice_status, errors, warnings);

      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number || 'N/A',
        invoice_date: invoice.invoice_date || 'N/A',
        vendor: invoice.customer_name || 'Unknown Customer',
        gstin: invoice.customer_gstin || invoice.seller_gstin || 'N/A',
        amount: invoice.total_invoice_value || 0,
        type: 'sales',
        validation_status: validationStatus,
        errors,
        warnings,
        created_at: invoice.created_at
      };
    });

    // Combine and sort by created_at
    let allInvoices = [...processedPurchaseInvoices, ...processedSalesInvoices];
    allInvoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Filter by status if specified
    if (status !== 'all') {
      allInvoices = allInvoices.filter(inv => inv.validation_status === status);
    }

    // Calculate summary stats
    const summary = {
      total: allInvoices.length,
      passed: allInvoices.filter(inv => inv.validation_status === 'passed').length,
      partial: allInvoices.filter(inv => inv.validation_status === 'partial').length,
      failed: allInvoices.filter(inv => inv.validation_status === 'failed').length,
      purchase: allInvoices.filter(inv => inv.type === 'purchase').length,
      sales: allInvoices.filter(inv => inv.type === 'sales').length
    };

    return NextResponse.json({
      success: true,
      summary,
      invoices: allInvoices
    });
  } catch (error) {
    console.error('Error in validation queue API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function categorizeRemarks(remarks: any[]): { errors: ValidationError[], warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  remarks.forEach(remark => {
    if (remark.issue_type === 'missing' || remark.issue_type === 'invalid_format' || remark.issue_type === 'mismatch') {
      errors.push({
        type: 'critical',
        message: `${remark.field_name}: ${remark.issue_type}`,
        expected: remark.expected_value,
        found: remark.detected_value,
        detail: remark.comment
      });
    } else if (remark.issue_type === 'unreadable' || remark.issue_type === 'low_confidence') {
      warnings.push({
        type: 'warning',
        message: `${remark.field_name}: ${remark.issue_type}`,
        impact: `Confidence: ${(remark.confidence_score || 0) * 100}%`
      });
    }
  });

  return { errors, warnings };
}

function getValidationStatus(
  invoiceStatus: string | null | undefined,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): 'passed' | 'partial' | 'failed' {
  // If invoice status is error or pending, it's failed
  if (invoiceStatus === 'error') {
    return 'failed';
  }

  // If there are critical errors, it's failed
  if (errors.length > 0) {
    return 'failed';
  }

  // If there are warnings or needs_review status, it's partial
  if (warnings.length > 0 || invoiceStatus === 'needs_review' || invoiceStatus === 'pending') {
    return 'partial';
  }

  // If verified or extracted with no issues, it's passed
  if (invoiceStatus === 'verified' || invoiceStatus === 'extracted') {
    return 'passed';
  }

  // Default to partial for unknown states
  return 'partial';
}

function getPurchaseMissingFields(invoice: any): string[] {
  const required = [
    'supplier_name',
    'supplier_gstin',
    'invoice_number',
    'invoice_date',
    'taxable_value',
    'total_invoice_value'
  ];

  const missing: string[] = [];
  required.forEach(field => {
    if (!invoice[field] || invoice[field] === '' || invoice[field] === null) {
      missing.push(field.replace(/_/g, ' ').toUpperCase());
    }
  });

  return missing;
}

function getSalesMissingFields(invoice: any): string[] {
  const required = [
    'seller_gstin',
    'invoice_number',
    'invoice_date',
    'taxable_value',
    'place_of_supply_state_code'
  ];

  const missing: string[] = [];
  required.forEach(field => {
    if (!invoice[field] || invoice[field] === '' || invoice[field] === null) {
      missing.push(field.replace(/_/g, ' ').toUpperCase());
    }
  });

  return missing;
}
