/**
 * Sales Invoice Validation Service
 * Validates sales invoices for GST compliance (GSTR-1 filing)
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'error';
  userFriendlyLabel: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning' | 'info';
  userFriendlyLabel: string;
}

/**
 * Field label mapping for user-friendly error messages
 */
const FIELD_LABELS: { [key: string]: string } = {
  seller_gstin: 'Seller GSTIN',
  seller_state_code: 'Seller State Code',
  customer_name: 'Customer Name',
  customer_gstin: 'Customer GSTIN',
  customer_state_code: 'Customer State Code',
  invoice_number: 'Invoice Number',
  invoice_date: 'Invoice Date',
  invoice_type: 'Invoice Type',
  supply_type: 'Supply Type',
  place_of_supply_state_code: 'Place of Supply',
  hsn_or_sac: 'HSN/SAC Code',
  description: 'Description',
  quantity: 'Quantity',
  unit: 'Unit of Measure',
  rate: 'Rate',
  taxable_value: 'Taxable Value',
  cgst: 'CGST Amount',
  sgst: 'SGST Amount',
  igst: 'IGST Amount',
  cess: 'CESS Amount',
  tcs: 'TCS Amount',
  invoice_bucket_url: 'Invoice File',
  payment_status: 'Payment Status',
  irn: 'E-Invoice IRN',
  ack_no: 'E-Invoice Acknowledgment Number',
  eway_bill_no: 'E-Way Bill Number',
};

/**
 * Validate sales invoice for GSTR-1 compliance
 */
export function validateSalesInvoice(invoice: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Critical: Seller GSTIN (must be present)
  if (!invoice.seller_gstin || invoice.seller_gstin.trim() === '') {
    errors.push({
      field: 'seller_gstin',
      message: 'Seller GSTIN is mandatory for GSTR-1 filing',
      severity: 'critical',
      userFriendlyLabel: FIELD_LABELS.seller_gstin,
    });
  } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(invoice.seller_gstin)) {
    errors.push({
      field: 'seller_gstin',
      message: 'Invalid GSTIN format',
      severity: 'error',
      userFriendlyLabel: FIELD_LABELS.seller_gstin,
    });
  }

  // Critical: Seller State Code
  if (!invoice.seller_state_code || invoice.seller_state_code.trim() === '') {
    errors.push({
      field: 'seller_state_code',
      message: 'Seller State Code is required',
      severity: 'critical',
      userFriendlyLabel: FIELD_LABELS.seller_state_code,
    });
  }

  // Critical: Invoice Number
  if (!invoice.invoice_number || invoice.invoice_number.trim() === '') {
    errors.push({
      field: 'invoice_number',
      message: 'Invoice Number is mandatory',
      severity: 'critical',
      userFriendlyLabel: FIELD_LABELS.invoice_number,
    });
  }

  // Critical: Invoice Date
  if (!invoice.invoice_date) {
    errors.push({
      field: 'invoice_date',
      message: 'Invoice Date is mandatory',
      severity: 'critical',
      userFriendlyLabel: FIELD_LABELS.invoice_date,
    });
  }

  // Critical: Invoice Type
  const validInvoiceTypes = ['B2B', 'B2C', 'Export', 'SEZ', 'CreditNote'];
  if (!invoice.invoice_type || !validInvoiceTypes.includes(invoice.invoice_type)) {
    errors.push({
      field: 'invoice_type',
      message: 'Valid Invoice Type is required (B2B, B2C, Export, SEZ, CreditNote)',
      severity: 'critical',
      userFriendlyLabel: FIELD_LABELS.invoice_type,
    });
  }

  // Critical: Supply Type
  const validSupplyTypes = ['Intra', 'Inter'];
  if (!invoice.supply_type || !validSupplyTypes.includes(invoice.supply_type)) {
    errors.push({
      field: 'supply_type',
      message: 'Supply Type must be Intra or Inter',
      severity: 'critical',
      userFriendlyLabel: FIELD_LABELS.supply_type,
    });
  }

  // Critical: Place of Supply
  if (!invoice.place_of_supply_state_code || invoice.place_of_supply_state_code.trim() === '') {
    errors.push({
      field: 'place_of_supply_state_code',
      message: 'Place of Supply is mandatory',
      severity: 'critical',
      userFriendlyLabel: FIELD_LABELS.place_of_supply_state_code,
    });
  }

  // Critical: Taxable Value
  if (invoice.taxable_value === null || invoice.taxable_value === undefined || invoice.taxable_value <= 0) {
    errors.push({
      field: 'taxable_value',
      message: 'Taxable Value must be greater than zero',
      severity: 'critical',
      userFriendlyLabel: FIELD_LABELS.taxable_value,
    });
  }

  // Invoice Type Specific Validations
  if (invoice.invoice_type === 'B2B') {
    // B2B requires customer GSTIN
    if (!invoice.customer_gstin || invoice.customer_gstin.trim() === '') {
      errors.push({
        field: 'customer_gstin',
        message: 'Customer GSTIN is mandatory for B2B invoices',
        severity: 'critical',
        userFriendlyLabel: FIELD_LABELS.customer_gstin,
      });
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(invoice.customer_gstin)) {
      errors.push({
        field: 'customer_gstin',
        message: 'Invalid Customer GSTIN format',
        severity: 'error',
        userFriendlyLabel: FIELD_LABELS.customer_gstin,
      });
    }

    // B2B requires customer name
    if (!invoice.customer_name || invoice.customer_name.trim() === '') {
      errors.push({
        field: 'customer_name',
        message: 'Customer Name is required for B2B invoices',
        severity: 'error',
        userFriendlyLabel: FIELD_LABELS.customer_name,
      });
    }
  }

  if (invoice.invoice_type === 'B2C') {
    // B2C above 2.5 lakh requires customer state
    if (invoice.taxable_value > 250000 && (!invoice.customer_state_code || invoice.customer_state_code.trim() === '')) {
      errors.push({
        field: 'customer_state_code',
        message: 'Customer State Code is required for B2C invoices above ₹2.5 lakh',
        severity: 'error',
        userFriendlyLabel: FIELD_LABELS.customer_state_code,
      });
    }
  }

  // Tax validation based on supply type
  if (invoice.supply_type === 'Intra') {
    // Intra-state: CGST + SGST should be present, IGST should be 0 or null
    if ((invoice.igst || 0) > 0) {
      errors.push({
        field: 'igst',
        message: 'IGST should not be charged for Intra-state supply',
        severity: 'error',
        userFriendlyLabel: FIELD_LABELS.igst,
      });
    }

    if ((invoice.cgst || 0) === 0 && (invoice.sgst || 0) === 0) {
      warnings.push({
        field: 'cgst',
        message: 'CGST and SGST are typically charged for Intra-state supply',
        severity: 'warning',
        userFriendlyLabel: FIELD_LABELS.cgst,
      });
    }
  }

  if (invoice.supply_type === 'Inter') {
    // Inter-state: IGST should be present, CGST + SGST should be 0 or null
    if ((invoice.cgst || 0) > 0 || (invoice.sgst || 0) > 0) {
      errors.push({
        field: 'cgst',
        message: 'CGST/SGST should not be charged for Inter-state supply',
        severity: 'error',
        userFriendlyLabel: FIELD_LABELS.cgst,
      });
    }

    if ((invoice.igst || 0) === 0 && invoice.invoice_type !== 'Export') {
      warnings.push({
        field: 'igst',
        message: 'IGST is typically charged for Inter-state supply',
        severity: 'warning',
        userFriendlyLabel: FIELD_LABELS.igst,
      });
    }
  }

  // Export specific validations
  if (invoice.invoice_type === 'Export' || invoice.is_export) {
    if ((invoice.cgst || 0) > 0 || (invoice.sgst || 0) > 0 || (invoice.igst || 0) > 0) {
      warnings.push({
        field: 'cgst',
        message: 'GST is typically zero for export invoices',
        severity: 'info',
        userFriendlyLabel: FIELD_LABELS.cgst,
      });
    }
  }

  // Recommended: HSN/SAC Code (critical for GST compliance)
  if (!invoice.hsn_or_sac || invoice.hsn_or_sac.trim() === '') {
    warnings.push({
      field: 'hsn_or_sac',
      message: 'HSN/SAC Code is recommended for GST compliance',
      severity: 'warning',
      userFriendlyLabel: FIELD_LABELS.hsn_or_sac,
    });
  }

  // Recommended: Description
  if (!invoice.description || invoice.description.trim() === '') {
    warnings.push({
      field: 'description',
      message: 'Description of goods/services is recommended',
      severity: 'info',
      userFriendlyLabel: FIELD_LABELS.description,
    });
  }

  // Recommended: Quantity and Unit
  if (!invoice.quantity || invoice.quantity <= 0) {
    warnings.push({
      field: 'quantity',
      message: 'Quantity should be specified',
      severity: 'info',
      userFriendlyLabel: FIELD_LABELS.quantity,
    });
  }

  if (!invoice.unit || invoice.unit.trim() === '') {
    warnings.push({
      field: 'unit',
      message: 'Unit of Measure is recommended',
      severity: 'info',
      userFriendlyLabel: FIELD_LABELS.unit,
    });
  }

  // E-Invoice validation for B2B > 5 crore turnover (informational)
  if (invoice.invoice_type === 'B2B' && invoice.taxable_value > 100000 && (!invoice.irn || invoice.irn.trim() === '')) {
    warnings.push({
      field: 'irn',
      message: 'E-Invoice IRN may be required for high-value B2B invoices',
      severity: 'info',
      userFriendlyLabel: FIELD_LABELS.irn,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert validation results to sales_remarks format
 */
export function validationToRemarks(
  salesId: string,
  validation: ValidationResult
): any[] {
  const remarks: any[] = [];

  // Add errors as remarks
  validation.errors.forEach((error) => {
    remarks.push({
      sales_id: salesId,
      field_name: error.field,
      issue_type: error.severity === 'critical' ? 'missing' : 'invalid',
      detected_value: null,
      expected_value: null,
      comment: error.message,
      status: 'open',
    });
  });

  // Add warnings as remarks
  validation.warnings.forEach((warning) => {
    remarks.push({
      sales_id: salesId,
      field_name: warning.field,
      issue_type: 'missing',
      detected_value: null,
      expected_value: null,
      comment: warning.message,
      status: 'open',
    });
  });

  return remarks;
}
