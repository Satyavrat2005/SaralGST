/**
 * Validation Service for GST Invoice Data
 * Implements deterministic rules for GSTIN, tax calculations, and mandatory fields
 */

import { ExtractedInvoiceData } from './llmExtractionService';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  issue_type: 'missing' | 'unreadable' | 'mismatch' | 'invalid_format';
  detected_value: string | null;
  expected_value?: string;
  message: string;
  confidence_score?: number;
}

export interface ValidationWarning {
  field: string;
  message: string;
  detected_value: string | null;
}

/**
 * State codes for GST
 */
const STATE_CODES: { [key: string]: string } = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
};

/**
 * Validate extracted invoice data
 */
export function validateInvoiceData(data: ExtractedInvoiceData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Validate GSTIN formats
  validateGSTIN(data.supplier_gstin, 'supplier_gstin', errors, data.confidence.supplier_gstin);
  validateGSTIN(data.buyer_gstin, 'buyer_gstin', errors, 0.8);

  // 2. Validate mandatory fields
  validateMandatoryFields(data, errors);

  // 3. Validate tax calculations
  validateTaxCalculations(data, errors, warnings);

  // 4. Validate dates
  validateDate(data.invoice_date, 'invoice_date', errors);

  // 5. Validate invoice type
  validateInvoiceType(data.invoice_type, errors);

  // 6. Validate HSN/SAC code
  validateHsnSac(data.hsn_or_sac, errors, warnings);

  // 7. Validate place of supply
  validatePlaceOfSupply(data, errors, warnings);

  // 8. Check confidence thresholds
  checkConfidenceThresholds(data, errors);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate GSTIN format
 * Format: 22AAAAA0000A1Z5 (15 characters)
 * - First 2 digits: State code
 * - Next 10 characters: PAN
 * - 13th character: Entity number
 * - 14th character: Z (default)
 * - 15th character: Checksum
 */
function validateGSTIN(
  gstin: string,
  fieldName: string,
  errors: ValidationError[],
  confidence: number
): void {
  if (!gstin || gstin.trim() === '') {
    errors.push({
      field: fieldName,
      issue_type: 'missing',
      detected_value: null,
      message: `${fieldName} is required`,
      confidence_score: confidence,
    });
    return;
  }

  // Remove spaces and convert to uppercase
  const cleanGstin = gstin.trim().toUpperCase();

  // Check length
  if (cleanGstin.length !== 15) {
    errors.push({
      field: fieldName,
      issue_type: 'invalid_format',
      detected_value: gstin,
      expected_value: '15 character GSTIN',
      message: `${fieldName} must be 15 characters long`,
      confidence_score: confidence,
    });
    return;
  }

  // Check format using regex
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
  if (!gstinRegex.test(cleanGstin)) {
    errors.push({
      field: fieldName,
      issue_type: 'invalid_format',
      detected_value: gstin,
      message: `${fieldName} format is invalid. Expected format: 22AAAAA0000A1Z5`,
      confidence_score: confidence,
    });
    return;
  }

  // Validate state code
  const stateCode = cleanGstin.substring(0, 2);
  if (!STATE_CODES[stateCode]) {
    errors.push({
      field: fieldName,
      issue_type: 'invalid_format',
      detected_value: gstin,
      message: `Invalid state code '${stateCode}' in ${fieldName}`,
      confidence_score: confidence,
    });
  }
}

/**
 * Validate mandatory GST fields for GSTR-2B/Purchase Register compliance
 */
function validateMandatoryFields(data: ExtractedInvoiceData, errors: ValidationError[]): void {
  // Critical fields for GSTR-2B filing
  const mandatoryFields = [
    { field: 'supplier_name', value: data.supplier_name, label: 'Supplier Name', critical: true },
    { field: 'supplier_gstin', value: data.supplier_gstin, label: 'Supplier GSTIN', critical: true },
    { field: 'invoice_number', value: data.invoice_number, label: 'Invoice Number', confidence: data.confidence.invoice_number, critical: true },
    { field: 'invoice_date', value: data.invoice_date, label: 'Invoice Date', critical: true },
    { field: 'invoice_type', value: data.invoice_type, label: 'Invoice Type (B2B/Import/RCM/SEZ)', critical: true },
    { field: 'place_of_supply', value: data.place_of_supply, label: 'Place of Supply', critical: true },
    { field: 'taxable_value', value: data.taxable_value, label: 'Taxable Value', critical: true },
    { field: 'hsn_or_sac', value: data.hsn_or_sac, label: 'HSN/SAC Code', critical: true }, // Required for B2B invoices
    { field: 'description', value: data.description, label: 'Description of Goods/Services', critical: false },
    { field: 'quantity', value: data.quantity, label: 'Quantity', critical: false },
    { field: 'unit', value: data.unit, label: 'Unit of Measure', critical: false },
  ];

  mandatoryFields.forEach(({ field, value, confidence, label, critical }) => {
    if (value === null || value === undefined || value === '' || (typeof value === 'number' && value === 0 && field === 'taxable_value')) {
      errors.push({
        field,
        issue_type: 'missing',
        detected_value: value?.toString() || null,
        message: critical 
          ? `${label} is required for GST filing (GSTR-2B compliance)` 
          : `${label} is recommended for complete invoice records`,
        confidence_score: confidence,
      });
    }
  });
}

/**
 * Validate tax calculations
 */
function validateTaxCalculations(
  data: ExtractedInvoiceData,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  const taxableValue = data.taxable_value || 0;
  const cgst = data.cgst || 0;
  const sgst = data.sgst || 0;
  const igst = data.igst || 0;
  const cess = data.cess || 0;
  const totalInvoiceValue = data.total_invoice_value || 0;

  // Calculate expected total
  const calculatedTotal = taxableValue + cgst + sgst + igst + cess;
  const difference = Math.abs(calculatedTotal - totalInvoiceValue);

  // Allow for small rounding differences (up to ₹1)
  if (difference > 1) {
    errors.push({
      field: 'total_invoice_value',
      issue_type: 'mismatch',
      detected_value: totalInvoiceValue.toString(),
      expected_value: calculatedTotal.toFixed(2),
      message: `Total invoice value mismatch. Expected: ₹${calculatedTotal.toFixed(2)}, Found: ₹${totalInvoiceValue}`,
      confidence_score: data.confidence.tax_values,
    });
  }

  // Check if both CGST+SGST and IGST are present (should be mutually exclusive)
  if (cgst > 0 && sgst > 0 && igst > 0) {
    errors.push({
      field: 'tax_values',
      issue_type: 'mismatch',
      detected_value: `CGST: ${cgst}, SGST: ${sgst}, IGST: ${igst}`,
      message: 'Both intra-state (CGST+SGST) and inter-state (IGST) taxes cannot be applied together',
      confidence_score: data.confidence.tax_values,
    });
  }

  // Check if CGST and SGST are equal (they should be for intra-state)
  if (cgst > 0 && sgst > 0 && cgst !== sgst) {
    warnings.push({
      field: 'tax_values',
      message: `CGST (₹${cgst}) and SGST (₹${sgst}) should typically be equal`,
      detected_value: `CGST: ${cgst}, SGST: ${sgst}`,
    });
  }

  // Validate tax percentages are reasonable (typically 0%, 5%, 12%, 18%, or 28%)
  const totalTax = cgst + sgst + igst;
  if (taxableValue > 0 && totalTax > 0) {
    const taxPercentage = (totalTax / taxableValue) * 100;
    const validRates = [0, 0.25, 3, 5, 6, 9, 12, 14, 18, 28];
    const isValidRate = validRates.some(rate => Math.abs(taxPercentage - rate) < 0.5);

    if (!isValidRate) {
      warnings.push({
        field: 'tax_values',
        message: `Unusual tax rate: ${taxPercentage.toFixed(2)}%. Common GST rates are 5%, 12%, 18%, 28%`,
        detected_value: `${taxPercentage.toFixed(2)}%`,
      });
    }
  }
}

/**
 * Validate date format
 */
function validateDate(date: string, fieldName: string, errors: ValidationError[]): void {
  if (!date || date.trim() === '') {
    return; // Already handled in mandatory fields
  }

  // Check if date is in YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    errors.push({
      field: fieldName,
      issue_type: 'invalid_format',
      detected_value: date,
      expected_value: 'YYYY-MM-DD',
      message: `${fieldName} must be in YYYY-MM-DD format`,
    });
    return;
  }

  // Validate that it's a valid date
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    errors.push({
      field: fieldName,
      issue_type: 'invalid_format',
      detected_value: date,
      message: `${fieldName} is not a valid date`,
    });
    return;
  }

  // Check if date is not in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsedDate > today) {
    errors.push({
      field: fieldName,
      issue_type: 'mismatch',
      detected_value: date,
      message: `${fieldName} cannot be in the future`,
    });
  }

  // Check if date is not too old (more than 10 years)
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  if (parsedDate < tenYearsAgo) {
    errors.push({
      field: fieldName,
      issue_type: 'mismatch',
      detected_value: date,
      message: `${fieldName} seems unusually old (more than 10 years)`,
    });
  }
}

/**
 * Validate invoice type
 */
function validateInvoiceType(invoiceType: string, errors: ValidationError[]): void {
  const validTypes = ['B2B', 'B2C', 'B2CL', 'EXPWP', 'EXPWOP', 'SEZ', 'SEZWP', 'SEZWOP', 'DEXP', 'Import', 'RCM'];

  if (!invoiceType || invoiceType.trim() === '') {
    errors.push({
      field: 'invoice_type',
      issue_type: 'missing',
      detected_value: null,
      message: 'invoice_type is required',
    });
    return;
  }

  if (!validTypes.includes(invoiceType.toUpperCase())) {
    errors.push({
      field: 'invoice_type',
      issue_type: 'invalid_format',
      detected_value: invoiceType,
      expected_value: validTypes.join(', '),
      message: `invoice_type must be one of: ${validTypes.join(', ')}`,
    });
  }
}

/**
 * Validate HSN/SAC code
 */
function validateHsnSac(hsnSac: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
  if (!hsnSac || hsnSac.trim() === '') {
    warnings.push({
      field: 'hsn_or_sac',
      message: 'HSN/SAC code is missing. It is recommended for GST compliance',
      detected_value: null,
    });
    return;
  }

  // HSN codes are typically 4, 6, or 8 digits
  // SAC codes are typically 6 digits
  const cleanCode = hsnSac.trim();
  if (!/^\d{4,8}$/.test(cleanCode)) {
    warnings.push({
      field: 'hsn_or_sac',
      message: 'HSN/SAC code should be 4-8 digits for HSN or 6 digits for SAC',
      detected_value: hsnSac,
    });
  }
}

/**
 * Validate place of supply
 */
function validatePlaceOfSupply(
  data: ExtractedInvoiceData,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!data.place_of_supply || data.place_of_supply.trim() === '') {
    return; // Already handled in mandatory fields
  }

  // Check if place of supply matches tax type (CGST+SGST vs IGST)
  const supplierStateCode = data.supplier_gstin ? data.supplier_gstin.substring(0, 2) : null;
  const buyerStateCode = data.buyer_gstin ? data.buyer_gstin.substring(0, 2) : null;

  if (supplierStateCode && buyerStateCode) {
    const isIntraState = supplierStateCode === buyerStateCode;
    const hasCgstSgst = (data.cgst || 0) > 0 && (data.sgst || 0) > 0;
    const hasIgst = (data.igst || 0) > 0;

    if (isIntraState && hasIgst && !hasCgstSgst) {
      warnings.push({
        field: 'tax_type',
        message: 'Intra-state transaction should have CGST+SGST, not IGST',
        detected_value: `Supplier: ${supplierStateCode}, Buyer: ${buyerStateCode}, IGST: ${data.igst}`,
      });
    }

    if (!isIntraState && hasCgstSgst && !hasIgst) {
      warnings.push({
        field: 'tax_type',
        message: 'Inter-state transaction should have IGST, not CGST+SGST',
        detected_value: `Supplier: ${supplierStateCode}, Buyer: ${buyerStateCode}, CGST: ${data.cgst}, SGST: ${data.sgst}`,
      });
    }
  }
}

/**
 * Check confidence thresholds
 */
function checkConfidenceThresholds(data: ExtractedInvoiceData, errors: ValidationError[]): void {
  const minConfidence = 0.5; // Minimum acceptable confidence

  if (data.confidence.supplier_gstin < minConfidence) {
    errors.push({
      field: 'supplier_gstin',
      issue_type: 'unreadable',
      detected_value: data.supplier_gstin,
      message: `Low confidence (${(data.confidence.supplier_gstin * 100).toFixed(0)}%) in supplier GSTIN extraction`,
      confidence_score: data.confidence.supplier_gstin,
    });
  }

  if (data.confidence.invoice_number < minConfidence) {
    errors.push({
      field: 'invoice_number',
      issue_type: 'unreadable',
      detected_value: data.invoice_number,
      message: `Low confidence (${(data.confidence.invoice_number * 100).toFixed(0)}%) in invoice number extraction`,
      confidence_score: data.confidence.invoice_number,
    });
  }

  if (data.confidence.tax_values < minConfidence) {
    errors.push({
      field: 'tax_values',
      issue_type: 'unreadable',
      detected_value: `CGST: ${data.cgst}, SGST: ${data.sgst}, IGST: ${data.igst}`,
      message: `Low confidence (${(data.confidence.tax_values * 100).toFixed(0)}%) in tax value extraction`,
      confidence_score: data.confidence.tax_values,
    });
  }
}

/**
 * Get state code from GSTIN
 */
export function getStateCodeFromGSTIN(gstin: string): string | null {
  if (!gstin || gstin.length < 2) return null;
  return gstin.substring(0, 2);
}

/**
 * Get state name from state code
 */
export function getStateNameFromCode(stateCode: string): string | null {
  return STATE_CODES[stateCode] || null;
}
