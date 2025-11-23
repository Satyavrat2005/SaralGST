// Demo workflow mock data and helpers

export interface Invoice {
  id: string;
  supplier: string;
  gstin: string;
  amount: number;
  gst: number;
  status: 'validated' | 'rejected' | 'pending' | 'corrected';
  validationErrors?: string[];
  timestamp: string;
  whatsappMessage?: string;
}

export interface Discrepancy {
  id: string;
  type: 'missing_in_2b' | 'missing_in_books' | 'amount_mismatch' | 'gstin_error' | 'quantity_mismatch';
  severity: 'critical' | 'warning' | 'info';
  invoice: string;
  supplier: string;
  issue: string;
  itcImpact: number;
  details: string;
}

export interface VendorScore {
  name: string;
  gstin: string;
  score: number;
  status: 'compliant' | 'at_risk' | 'non_compliant';
  invoices: number;
  onTimeFilings: number;
  issues: number;
}

// Mock invoice data
export const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    supplier: 'ABC Corp Pvt Ltd',
    gstin: '27AAACB1234F1Z5',
    amount: 125000,
    gst: 22500,
    status: 'validated',
    timestamp: 'Today, 10:30 AM',
  },
  {
    id: 'INV-002',
    supplier: 'XYZ Technologies Ltd',
    gstin: '29XYZAB5678H1Z2',
    amount: 89000,
    gst: 16020,
    status: 'validated',
    timestamp: 'Today, 11:15 AM',
  },
  {
    id: 'INV-003',
    supplier: 'PQR Traders',
    gstin: '07PQRST4321J1Z9',
    amount: 56000,
    gst: 10080,
    status: 'rejected',
    validationErrors: [
      'GSTIN format invalid',
      'Amount mismatch: Invoice shows ₹56,000 but tax calculation suggests ₹58,000',
      'GST rate 18% does not match HSN code 8471 (28%)'
    ],
    timestamp: 'Today, 11:45 AM',
    whatsappMessage: 'Dear Vendor, Invoice INV-003 has validation errors. Please review and resubmit. Errors: GSTIN format invalid, Amount mismatch detected.'
  },
  {
    id: 'INV-004',
    supplier: 'LMN Supplies Co',
    gstin: '19LMNOP8765K1Z3',
    amount: 42000,
    gst: 7560,
    status: 'pending',
    timestamp: 'Today, 12:20 PM',
  }
];

// Mock discrepancy data
export const mockDiscrepancies: Discrepancy[] = [
  {
    id: 'DISC-001',
    type: 'missing_in_2b',
    severity: 'critical',
    invoice: 'INV-8824',
    supplier: 'TechSol Solutions',
    issue: 'Invoice present in Purchase Register but missing in GSTR 2B',
    itcImpact: 18500,
    details: 'Supplier may have not filed GSTR-1 or filed incorrectly. ITC cannot be claimed until resolved.'
  },
  {
    id: 'DISC-002',
    type: 'amount_mismatch',
    severity: 'warning',
    invoice: 'INV-8920',
    supplier: 'Global Logistics',
    issue: 'Amount mismatch between books and GSTR 2B',
    itcImpact: 2400,
    details: 'Books: ₹35,000 | GSTR 2B: ₹32,600 | Difference: ₹2,400'
  },
  {
    id: 'DISC-003',
    type: 'gstin_error',
    severity: 'critical',
    invoice: 'INV-9001',
    supplier: 'Reddy Enterprises',
    issue: 'GSTIN validation failed - Inactive GSTIN',
    itcImpact: 15800,
    details: 'GSTIN 33REDDY9876L1Z4 is marked as inactive on GST portal. ITC blocked.'
  },
  {
    id: 'DISC-004',
    type: 'quantity_mismatch',
    severity: 'warning',
    invoice: 'INV-8756',
    supplier: 'ABC Corp',
    issue: 'Quantity mismatch detected',
    itcImpact: 1200,
    details: 'Purchase Register shows 100 units, GSTR 2B shows 95 units'
  },
  {
    id: 'DISC-005',
    type: 'missing_in_books',
    severity: 'info',
    invoice: 'INV-9120',
    supplier: 'Office Supplies Co',
    issue: 'Invoice present in GSTR 2B but missing in Purchase Register',
    itcImpact: 0,
    details: 'Potential unrecorded purchase. Verify if invoice was received and should be recorded.'
  }
];

// Mock vendor scores
export const mockVendorScores: VendorScore[] = [
  {
    name: 'ABC Corp Pvt Ltd',
    gstin: '27AAACB1234F1Z5',
    score: 95,
    status: 'compliant',
    invoices: 18,
    onTimeFilings: 18,
    issues: 0
  },
  {
    name: 'XYZ Technologies Ltd',
    gstin: '29XYZAB5678H1Z2',
    score: 92,
    status: 'compliant',
    invoices: 12,
    onTimeFilings: 11,
    issues: 1
  },
  {
    name: 'PQR Traders',
    gstin: '07PQRST4321J1Z9',
    score: 65,
    status: 'at_risk',
    invoices: 8,
    onTimeFilings: 5,
    issues: 3
  },
  {
    name: 'Reddy Enterprises',
    gstin: '33REDDY9876L1Z4',
    score: 40,
    status: 'non_compliant',
    invoices: 3,
    onTimeFilings: 0,
    issues: 3
  }
];

// Simulate step execution with realistic timings
export function getStepExecutionTime(stepId: number): number {
  const times: Record<number, number> = {
    1: 3000,  // Invoice capture - 3s
    2: 4000,  // OCR & Validation - 4s
    3: 2000,  // WhatsApp notifications - 2s
    4: 2500,  // Purchase register - 2.5s
    5: 3500,  // GSTR 2B - 3.5s
    6: 5000,  // Reconciliation - 5s
    7: 3000,  // Discrepancy analysis - 3s
    8: 2500,  // Vendor scoring - 2.5s
    9: 4000,  // Report generation - 4s
  };
  return times[stepId] || 3000;
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Get status badge colors
export function getStatusBadge(status: string): { bg: string; text: string; label: string } {
  const badges: Record<string, { bg: string; text: string; label: string }> = {
    validated: { bg: 'bg-green-500/20', text: 'text-green-500', label: 'Validated' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-500', label: 'Rejected' },
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-500', label: 'Pending' },
    corrected: { bg: 'bg-blue-500/20', text: 'text-blue-500', label: 'Corrected' },
    compliant: { bg: 'bg-green-500/20', text: 'text-green-500', label: 'Compliant' },
    at_risk: { bg: 'bg-amber-500/20', text: 'text-amber-500', label: 'At Risk' },
    non_compliant: { bg: 'bg-red-500/20', text: 'text-red-500', label: 'Non-Compliant' },
  };
  return badges[status] || { bg: 'bg-zinc-500/20', text: 'text-zinc-500', label: status };
}
