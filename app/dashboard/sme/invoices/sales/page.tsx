'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Filter, 
  Download, 
  Plus, 
  Search, 
  Calendar, 
  MoreVertical, 
  Eye, 
  FileText, 
  Edit3, 
  RefreshCw, 
  CheckCircle2, 
  Trash2,
  ArrowUpRight,
  MessageSquare,
  Mail,
  UploadCloud,
  FileSpreadsheet,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Save,
  History,
  Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';
import { SalesRegister } from '@/lib/services/salesInvoiceService';

interface Remark {
  id: string;
  field_name: string;
  issue_type: string;
  detected_value: string | null;
  expected_value: string | null;
  comment: string | null;
  status: string;
}

export default function SalesRegisterPage() {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesRegister | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'validation' | 'history'>('details');
  const [salesInvoices, setsalesInvoices] = useState<SalesRegister[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<SalesRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<SalesRegister>>({});
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState('This Month');
  const [CustomerFilter, setCustomerFilter] = useState('All Customers');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [paymentFilter, setPaymentFilter] = useState('All Payments');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [validationStatusData, setValidationStatusData] = useState([
    { name: 'Validated', value: 0, color: '#10B981' },
    { name: 'Partial', value: 0, color: '#F59E0B' },
    { name: 'Failed', value: 0, color: '#EF4444' },
  ]);
  
  const [stats, setStats] = useState({
    totalSales: 0,
    totalTax: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    validated: 0,
    partial: 0,
    failed: 0,
    count: 0
  });

  // Fetch invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Apply filters whenever filter states or invoices change
  useEffect(() => {
    applyFilters();
  }, [salesInvoices, dateFilter, CustomerFilter, statusFilter, paymentFilter, searchQuery]);

  // Update stats when filtered invoices change
  useEffect(() => {
    calculateStats(filteredInvoices);
  }, [filteredInvoices]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  // Fetch invoice details and remarks when modal opens
  useEffect(() => {
    if (selectedInvoice?.id) {
      fetchInvoiceDetails(selectedInvoice.id);
    }
  }, [selectedInvoice?.id]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoice/sales');
      const data = await response.json();

      if (data.success && data.invoices) {
        setsalesInvoices(data.invoices);
        calculateStats(data.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoices: SalesRegister[]) => {
    const totalSales = invoices.reduce((sum, inv) => sum + (inv.total_invoice_value || 0), 0);
    const cgst = invoices.reduce((sum, inv) => sum + (inv.cgst || 0), 0);
    const sgst = invoices.reduce((sum, inv) => sum + (inv.sgst || 0), 0);
    const igst = invoices.reduce((sum, inv) => sum + (inv.igst || 0), 0);
    const totalTax = cgst + sgst + igst;

    const validated = invoices.filter(inv => inv.invoice_status === 'extracted' || inv.invoice_status === 'verified').length;
    const partial = invoices.filter(inv => inv.invoice_status === 'needs_review').length;
    const failed = invoices.filter(inv => !inv.invoice_status || inv.invoice_status === null).length;

    setStats({
      totalSales,
      totalTax,
      cgst,
      sgst,
      igst,
      validated,
      partial,
      failed,
      count: invoices.length
    });

    // Update validation chart
    setValidationStatusData([
      { name: 'Validated', value: validated, color: '#10B981' },
      { name: 'Partial', value: partial, color: '#F59E0B' },
      { name: 'Failed', value: failed, color: '#EF4444' },
    ]);
  };

  const applyFilters = () => {
    let filtered = [...salesInvoices];

    // Customer filter
    if (CustomerFilter !== 'All Customers') {
      filtered = filtered.filter(inv => inv.customer_name === CustomerFilter);
    }

    // Status filter
    if (statusFilter !== 'All Status') {
      const statusMap: { [key: string]: string[] } = {
        'Validated': ['extracted', 'verified'],
        'Partial': ['pending'],
        'Failed': ['error'],
        'Processing': ['pending']
      };
      const statuses = statusMap[statusFilter] || [];
      filtered = filtered.filter(inv => statuses.includes(inv.invoice_status || ''));
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.invoice_number?.toLowerCase().includes(query) ||
        inv.customer_name?.toLowerCase().includes(query) ||
        inv.customer_gstin?.toLowerCase().includes(query)
      );
    }

    // Date filter - only apply if not "This Month" or explicitly selected
    if (dateFilter === 'Last Month') {
      const now = new Date();
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      
      filtered = filtered.filter(inv => {
        if (!inv.invoice_date) return false;
        const invDate = new Date(inv.invoice_date);
        return invDate >= firstDayOfLastMonth && invDate <= lastDayOfLastMonth;
      });
    } else if (dateFilter === 'This Quarter') {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const firstDayOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
      
      filtered = filtered.filter(inv => {
        if (!inv.invoice_date) return false;
        const invDate = new Date(inv.invoice_date);
        return invDate >= firstDayOfQuarter;
      });
    }
    // For "This Month" and "All Time", show all invoices (no date filtering)

    setFilteredInvoices(filtered);
  };

  const fetchInvoiceDetails = async (id: string) => {
    try {
      setLoadingRemarks(true);
      const response = await fetch(`/api/invoice/sales/${id}`);
      const data = await response.json();

      if (data.success) {
        setRemarks(data.remarks || []);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    } finally {
      setLoadingRemarks(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({ ...selectedInvoice });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const handleFieldChange = (field: keyof SalesRegister, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!selectedInvoice?.id) return;

    try {
      // Remove total_invoice_value from editedData as it's a generated column
      const { total_invoice_value, ...dataToSave } = editedData;
      
      const response = await fetch(`/api/invoice/sales/${selectedInvoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setsalesInvoices(prev =>
          prev.map(inv => inv.id === selectedInvoice.id ? { ...inv, ...editedData } : inv)
        );
        setSelectedInvoice(prev => prev ? { ...prev, ...editedData } : null);
        setIsEditing(false);
        alert('Changes saved successfully');
      } else {
        throw new Error(data.error || 'Failed to save changes');
      }
    } catch (error: any) {
      console.error('Error saving changes:', error);
      alert(`Failed to save: ${error.message}`);
    }
  };

  const clearFilters = () => {
    setDateFilter('This Month');
    setCustomerFilter('All Customers');
    setStatusFilter('All Status');
    setPaymentFilter('All Payments');
    setSearchQuery('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress (replace with actual upload progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const response = await fetch('/api/invoice/sales/process', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      console.log('Upload response:', data);

      if (data.success) {
        const message = data.validation?.isValid 
          ? `Invoice processed successfully: ${data.invoice?.invoice_number || 'Invoice'}`
          : `Invoice uploaded with ${data.validation?.errorCount || 0} errors. Please review.`;
        alert(message);
        setUploadModalOpen(false);
        setSelectedFile(null);
        setUploadProgress(0);
        // Refresh invoices
        await fetchInvoices();
      } else {
        console.error('Upload failed:', data);
        throw new Error(data.error || 'Failed to upload invoice');
      }
    } catch (error: any) {
      console.error('Error uploading invoice:', error);
      alert(`Failed to upload: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoiceRs.')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoice/sales/${invoiceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        setsalesInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
        alert('Invoice deleted successfully');
      } else {
        throw new Error(data.error || 'Failed to delete invoice');
      }
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      alert(`Failed to delete invoice: ${error.message}`);
    } finally {
      setActiveDropdown(null);
    }
  };

  const exportToCSV = () => {
    // Define all columns in standard Sales Register format
    const headers = [
      // Basic Information
      'Serial No.',
      'Invoice Number',
      'Invoice Date',
      'Invoice Type',
      'Source',
      
      // Customer Details
      'Customer Name',
      'Customer GSTIN',
      'Customer State Code',
      
      // Buyer Details
      'Buyer GSTIN',
      'Place of Supply',
      
      // Item Details
      'HSN/SAC Code',
      'Description of Goods/Services',
      'Quantity',
      'Unit',
      'Rate Per Unit',
      
      // Tax Details
      'Taxable Value',
      'CGST Rate',
      'CGST Amount',
      'SGST Rate',
      'SGST Amount',
      'IGST Rate',
      'IGST Amount',
      'CESS Amount',
      'Total Tax Amount',
      'Total Invoice Value',
      
      // Additional Details
      'Is Reverse Charge',
      'Payment Status',
      
      // Processing Details
      'Invoice Status',
      'OCR Confidence Score',
      'Created At',
      'Updated At',
      'Invoice URL'
    ];

    // Map data to CSV rows
    const rows = filteredInvoices.map((inv, index) => {
      const cgstRate = inv.cgst && inv.taxable_value ? ((inv.cgst / inv.taxable_value) * 100).toFixed(2) : '';
      const sgstRate = inv.sgst && inv.taxable_value ? ((inv.sgst / inv.taxable_value) * 100).toFixed(2) : '';
      const igstRate = inv.igst && inv.taxable_value ? ((inv.igst / inv.taxable_value) * 100).toFixed(2) : '';
      const totalTax = (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0) + (inv.cess || 0);
      
      return [
        (index + 1).toString(),
        inv.invoice_number || '',
        inv.invoice_date || '',
        inv.invoice_type || '',
        inv.extraction_source || '',
        inv.customer_name || '',
        inv.customer_gstin || '',
        inv.customer_state_code || '',
        inv.customer_gstin || '',
        inv.place_of_supply_state_code || '',
        inv.hsn_or_sac || '',
        inv.description || '',
        inv.quantity?.toString() || '',
        inv.unit || '',
        inv.rate?.toString() || '',
        inv.taxable_value?.toFixed(2) || '',
        cgstRate ? `${cgstRate}%` : '',
        inv.cgst?.toFixed(2) || '',
        sgstRate ? `${sgstRate}%` : '',
        inv.sgst?.toFixed(2) || '',
        igstRate ? `${igstRate}%` : '',
        inv.igst?.toFixed(2) || '',
        inv.cess?.toFixed(2) || '',
        totalTax.toFixed(2),
        inv.total_invoice_value?.toFixed(2) || '',
        inv.is_reverse_charge ? 'Yes' : 'No',
        inv.payment_status || 'unpaid',
        inv.invoice_status || '',
        (inv.ocr_confidence_score || 0) > 0 ? `${((inv.ocr_confidence_score || 0) * 100).toFixed(2)}%` : '',
        inv.created_at || '',
        inv.updated_at || '',
        inv.invoice_bucket_url || ''
      ];
    });

    // Escape and quote CSV fields
    const escapeCsvValue = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV content
    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `sales_register_${dateStr}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMissingFields = (invoice: SalesRegister): string[] => {
    const missing: string[] = [];
    
    // Check required NOT NULL fields from DB schema
    if (!invoice.seller_gstin || invoice.seller_gstin === 'TEMP') missing.push('Seller GSTIN');
    if (!invoice.seller_state_code || invoice.seller_state_code === '00') missing.push('Seller State Code');
    if (!invoice.invoice_number || invoice.invoice_number === 'TEMP') missing.push('Invoice Number');
    if (!invoice.invoice_date) missing.push('Invoice Date');
    if (!invoice.invoice_type) missing.push('Invoice Type');
    if (!invoice.supply_type) missing.push('Supply Type');
    if (!invoice.place_of_supply_state_code || invoice.place_of_supply_state_code === '00') missing.push('Place of Supply');
    if (!invoice.taxable_value || invoice.taxable_value === 0) missing.push('Taxable Value');
    if (!invoice.invoice_bucket_url) missing.push('Invoice File');
    
    // B2B specific requirements
    if (invoice.invoice_type === 'B2B') {
      if (!invoice.customer_name) missing.push('Customer Name');
      if (!invoice.customer_gstin) missing.push('Customer GSTIN');
    }
    
    return missing;
  };

  const getValidationStatus = (invoice: SalesRegister): 'validated' | 'partial' | 'failed' => {
    const missingFields = getMissingFields(invoice);
    if (missingFields.length === 0 && invoice.invoice_status === 'extracted') return 'validated';
    if (missingFields.length > 0 || invoice.invoice_status === 'needs_review') return 'partial';
    return 'failed';
  };

  const exportToExcel = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const XLSX = await import('xlsx');
      
      // Prepare data in standard Sales Register format
      const data = filteredInvoices.map((inv, index) => {
        const cgstRate = inv.cgst && inv.taxable_value ? ((inv.cgst / inv.taxable_value) * 100).toFixed(2) : '';
        const sgstRate = inv.sgst && inv.taxable_value ? ((inv.sgst / inv.taxable_value) * 100).toFixed(2) : '';
        const igstRate = inv.igst && inv.taxable_value ? ((inv.igst / inv.taxable_value) * 100).toFixed(2) : '';
        const totalTax = (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0) + (inv.cess || 0);
        
        return {
          // Basic Information
          'Serial No.': index + 1,
          'Invoice Number': inv.invoice_number || '',
          'Invoice Date': inv.invoice_date || '',
          'Invoice Type': inv.invoice_type || '',
          'Source': inv.extraction_source || '',
          
          // Customer Details
          'Customer Name': inv.customer_name || '',
          'Customer GSTIN': inv.customer_gstin || '',
          'Customer State Code': inv.customer_state_code || '',
          
          // Buyer Details
          'Buyer GSTIN': inv.customer_gstin || '',
          'Place of Supply': inv.place_of_supply_state_code || '',
          
          // Item Details
          'HSN/SAC Code': inv.hsn_or_sac || '',
          'Description of Goods/Services': inv.description || '',
          'Quantity': inv.quantity || '',
          'Unit': inv.unit || '',
          'Rate Per Unit': inv.rate || '',
          
          // Tax Details
          'Taxable Value': inv.taxable_value || '',
          'CGST Rate': cgstRate ? `${cgstRate}%` : '',
          'CGST Amount': inv.cgst || '',
          'SGST Rate': sgstRate ? `${sgstRate}%` : '',
          'SGST Amount': inv.sgst || '',
          'IGST Rate': igstRate ? `${igstRate}%` : '',
          'IGST Amount': inv.igst || '',
          'CESS Amount': inv.cess || '',
          'Total Tax Amount': totalTax,
          'Total Invoice Value': inv.total_invoice_value || '',
          
          // Additional Details
          'Is Reverse Charge': inv.is_reverse_charge ? 'Yes' : 'No',
          'Payment Status': inv.payment_status || 'unpaid',
          
          // Processing Details
          'Invoice Status': inv.invoice_status || '',
          'OCR Confidence Score': inv.ocr_confidence_score ? `${(inv.ocr_confidence_score * 100).toFixed(2)}%` : '',
          'Created At': inv.created_at || '',
          'Updated At': inv.updated_at || '',
          'Invoice URL': inv.invoice_bucket_url || ''
        };
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Register');

      // Set column widths for standard Sales Register
      const columnWidths = [
        { wch: 10 },  // Serial No
        { wch: 20 },  // Invoice Number
        { wch: 15 },  // Invoice Date
        { wch: 15 },  // Invoice Type
        { wch: 12 },  // Source
        { wch: 35 },  // Customer Name
        { wch: 18 },  // Customer GSTIN
        { wch: 15 },  // Customer State Code
        { wch: 18 },  // Buyer GSTIN
        { wch: 18 },  // Place of Supply
        { wch: 15 },  // HSN/SAC Code
        { wch: 40 },  // Description
        { wch: 12 },  // Quantity
        { wch: 12 },  // Unit
        { wch: 15 },  // Rate Per Unit
        { wch: 15 },  // Taxable Value
        { wch: 12 },  // CGST Rate
        { wch: 15 },  // CGST Amount
        { wch: 12 },  // SGST Rate
        { wch: 15 },  // SGST Amount
        { wch: 12 },  // IGST Rate
        { wch: 15 },  // IGST Amount
        { wch: 15 },  // CESS Amount
        { wch: 15 },  // Total Tax
        { wch: 18 },  // Total Invoice Value
        { wch: 15 },  // Reverse Charge
        { wch: 15 },  // Payment Status
        { wch: 15 },  // Status
        { wch: 18 },  // Confidence
        { wch: 20 },  // Created
        { wch: 20 },  // Updated
        { wch: 50 }   // URL
      ];
      worksheet['!cols'] = columnWidths;

      // Generate file
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `sales_register_${dateStr}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Trying CSV instead...');
      exportToCSV(); // Fallback to CSV
    }
  };

  const getUniqueCustomers = () => {
    const Customers = new Set<string>();
    salesInvoices.forEach(inv => {
      if (inv.customer_name) Customers.add(inv.customer_name);
    });
    return Array.from(Customers);
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === salesInvoices.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(salesInvoices.map(inv => inv.id).filter((id): id is string => id !== undefined));
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'extracted':
      case 'verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string | null | undefined) => {
    switch (status) {
      case 'extracted': return 'Validated';
      case 'verified': return 'Verified';
      case 'pending': return 'Partial';
      case 'error': return 'Failed';
      default: return 'Unknown';
    }
  };

  const getPaymentStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'partial':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'unpaid':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp': return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      case 'email': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'manual': return <UploadCloud className="h-4 w-4 text-zinc-400" />;
      case 'bulk': return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      default: return <FileText className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-2">
            <span className="text-emerald-700 text-xs font-semibold">INVOICES</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sales Register</h1>
          <p className="text-gray-600 text-sm mt-1">All outward invoices to customers - GSTR-1 Filing</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToExcel}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button 
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Upload Invoice
          </button>
        </div>
      </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
           <div className="flex flex-wrap items-center gap-3 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-500" />
                </div>
                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Quarter</option>
                  <option>All Time</option>
                </select>
              </div>

              <div className="w-px h-8 bg-gray-200 hidden md:block"></div>

              <select 
                value={CustomerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option>All Customers</option>
                {getUniqueCustomers().map(Customer => (
                  <option key={Customer} value={Customer}>{Customer}</option>
                ))}
              </select>

              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option>All Status</option>
                <option>Validated</option>
                <option>Partial</option>
                <option>Failed</option>
                <option>Processing</option>
              </select>

              <select 
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option>All Payments</option>
                <option>paid</option>
                <option>unpaid</option>
                <option>partial</option>
              </select>

              <div className="relative flex-1 min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2 placeholder-gray-400 hover:bg-gray-100 transition-colors" 
                  placeholder="Search invoices..." 
                />
              </div>
           </div>
           <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-900 whitespace-nowrap transition-colors">Clear Filters</button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
          <div className="flex flex-col h-full justify-between">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Sales</p>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                ) : (
                  `Rs. ${Math.round(stats.totalSales / 1000).toFixed(1)}K`
                )}
              </h3>
              <p className="text-xs text-emerald-600 mt-1">{stats.count} Invoices � This Month</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-200 shadow-lg p-5">
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <ArrowUpRight className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-xs text-amber-700 uppercase tracking-wider font-semibold">Output Tax</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                ) : (
                  `Rs. ${Math.round(stats.totalTax / 1000).toFixed(1)}K`
                )}
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center border-t border-amber-100 pt-2 mt-2">
                <div>
                  <p className="text-[10px] text-gray-500">CGST</p>
                  <p className="text-xs font-mono text-gray-900">Rs.{(stats.cgst / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">SGST</p>
                  <p className="text-xs font-mono text-gray-900">Rs.{(stats.sgst / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">IGST</p>
                  <p className="text-xs font-mono text-gray-900">Rs.{(stats.igst / 1000).toFixed(1)}K</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center gap-4">
          <div className="h-24 w-24 relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={validationStatusData}
                  innerRadius={25}
                  outerRadius={35}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {validationStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd' }} itemStyle={{color: '#333'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Validation</p>
            {validationStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="text-gray-900 font-mono font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. DATA TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col min-h-[600px]">
        {/* Table Actions Bar */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <input 
                   type="checkbox" 
                   className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                   checked={selectedRows.length === filteredInvoices.length && filteredInvoices.length > 0}
                   onChange={toggleSelectAll}
                 />
                 <span className="text-sm text-gray-600">Select All</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-900 font-medium">{filteredInvoices.length} Invoices Found</span>
           </div>

           {selectedRows.length > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                 <span className="text-sm text-gray-700">{selectedRows.length} selected</span>
                 <div className="flex items-center rounded-lg bg-white border border-gray-200 overflow-hidden shadow-sm">
                    <button className="px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700 border-r border-gray-200 transition-colors">Mark Reviewed</button>
                    <button className="px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700 border-r border-gray-200 transition-colors">Re-validate</button>
                    <button className="px-3 py-1.5 text-xs hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors">Delete</button>
                 </div>
              </div>
           )}
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm relative">
            <thead className="text-gray-500 font-medium bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
               <tr>
                 <th className="px-6 py-3 w-12"></th>
                 <th className="px-6 py-3 cursor-pointer hover:text-gray-900 transition-colors">Invoice No</th>
                 <th className="px-6 py-3 cursor-pointer hover:text-gray-900 transition-colors">Date</th>
                 <th className="px-6 py-3 cursor-pointer hover:text-gray-900 transition-colors">Customer</th>
                 <th className="px-6 py-3 text-right cursor-pointer hover:text-gray-900 transition-colors">Taxable</th>
                 <th className="px-6 py-3 text-right cursor-pointer hover:text-gray-900 transition-colors">GST</th>
                 <th className="px-6 py-3 text-right cursor-pointer hover:text-gray-900 transition-colors">Total</th>
                 <th className="px-6 py-3 text-center">HSN</th>
                 <th className="px-6 py-3 text-center">Validation</th>
                 <th className="px-6 py-3 text-center">Payment</th>
                 <th className="px-6 py-3 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {loading ? (
                 <tr>
                   <td colSpan={11} className="px-6 py-12 text-center">
                     <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
                     <p className="text-sm text-gray-500 mt-2">Loading invoices...</p>
                   </td>
                 </tr>
               ) : filteredInvoices.length === 0 ? (
                 <tr>
                   <td colSpan={11} className="px-6 py-12 text-center">
                     <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                     <p className="text-sm text-gray-500">No invoices found</p>
                     <button 
                       onClick={() => setUploadModalOpen(true)}
                       className="mt-4 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm hover:from-emerald-700 hover:to-teal-700 transition-all"
                     >
                       Upload First Invoice
                     </button>
                   </td>
                 </tr>
               ) : (
                 filteredInvoices.map((inv) => (
                   <tr key={inv.id} className="group hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4">
                       <input 
                         type="checkbox" 
                         className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                         checked={selectedRows.includes(inv.id || '')}
                         onChange={() => toggleRowSelection(inv.id || '')}
                       />
                     </td>
                     <td className="px-6 py-4">
                        <button onClick={() => setSelectedInvoice(inv)} className="font-medium text-gray-900 hover:text-emerald-600 hover:underline text-left transition-colors">
                          {inv.invoice_number || 'N/A'}
                        </button>
                     </td>
                     <td className="px-6 py-4 text-gray-600">
                       {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : 'N/A'}
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900">{inv.customer_name || 'Unknown'}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{inv.customer_gstin || 'N/A'}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right text-gray-900 font-mono">
                       Rs.{(inv.taxable_value || 0).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-right text-gray-700 font-mono group-hover:text-emerald-600 transition-colors cursor-help" title="CGST + SGST + IGST">
                       Rs.{((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0)).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono">
                       Rs.{(inv.total_invoice_value || 0).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-center text-gray-500 font-mono text-xs">
                       {inv.hsn_or_sac || 'N/A'}
                     </td>
                     <td className="px-6 py-4 text-center">
                        {(() => {
                          const validationStatus = getValidationStatus(inv);
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                              validationStatus === 'validated' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : validationStatus === 'partial'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {validationStatus === 'validated' ? (
                                <><CheckCircle className="h-3 w-3" /> Validated</>
                              ) : validationStatus === 'partial' ? (
                                <><AlertCircle className="h-3 w-3" /> Partial</>
                              ) : (
                                <><XCircle className="h-3 w-3" /> Failed</>
                              )}
                            </span>
                          );
                        })()}
                     </td>
                     <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(inv.payment_status)}`}>
                          {inv.payment_status || 'unpaid'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-900 transition-colors" title="View Details">
                              <Eye className="h-4 w-4" />
                           </button>
                           {inv.invoice_bucket_url && (
                             <a 
                               href={inv.invoice_bucket_url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-900 transition-colors" 
                               title="Download"
                             >
                               <Download className="h-4 w-4" />
                             </a>
                           )}
                           <div className="relative">
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setActiveDropdown(activeDropdown === inv.id ? null : inv.id || null);
                               }}
                               className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-900 transition-colors"
                             >
                               <MoreVertical className="h-4 w-4" />
                             </button>
                             {activeDropdown === inv.id && (
                               <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1">
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setSelectedInvoice(inv);
                                     setActiveDropdown(null);
                                   }}
                                   className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 transition-colors"
                                 >
                                   <Eye className="h-3 w-3" /> View Details
                                 </button>
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setIsEditing(true);
                                     setSelectedInvoice(inv);
                                     setActiveDropdown(null);
                                   }}
                                   className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 transition-colors"
                                 >
                                   <Edit3 className="h-3 w-3" /> Edit
                                 </button>
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleDeleteInvoice(inv.id || '');
                                   }}
                                   className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors"
                                 >
                                   <Trash2 className="h-3 w-3" /> Delete
                                 </button>
                               </div>
                             )}
                           </div>
                        </div>
                     </td>
                   </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
           <div className="text-xs text-gray-500">Showing 1-{filteredInvoices.length} of {filteredInvoices.length}</div>
           <div className="flex items-center gap-2">
              <select className="bg-white border border-gray-200 text-xs rounded p-1 text-gray-700 outline-none hover:bg-gray-50 transition-colors">
                <option>25 / page</option>
                <option>50 / page</option>
                <option>100 / page</option>
              </select>
              <div className="flex gap-1">
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700" disabled>Previous</button>
                 <button className="px-2 py-1 rounded bg-primary text-white text-xs">1</button>
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700">2</button>
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700">3</button>
                 <span className="px-2 py-1 text-zinc-600 text-xs">...</span>
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700">Next</button>
              </div>
           </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white border border-gray-200 w-full max-w-6xl h-[90vh] rounded-2xl flex overflow-hidden shadow-2xl">
              {/* Left: Preview */}
              <div className="w-[40%] bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-900 font-semibold">Original Invoice</h3>
                    <div className="flex gap-2">
                       {selectedInvoice.invoice_bucket_url && (
                         <a 
                           href={selectedInvoice.invoice_bucket_url} 
                           target="_blank"
                           rel="noopener noreferrer"
                           className="p-2 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                         >
                           <Download className="h-4 w-4" />
                         </a>
                       )}
                    </div>
                 </div>
                 <div className="flex-1 bg-white rounded-xl border border-gray-200 relative overflow-hidden shadow-sm">
                    {selectedInvoice.invoice_bucket_url ? (
                      <object 
                        data={selectedInvoice.invoice_bucket_url} 
                        type="application/pdf"
                        className="w-full h-full"
                      >
                        <iframe 
                          src={`https://docs.google.com/viewerRs.url=${encodeURIComponent(selectedInvoice.invoice_bucket_url)}&embedded=true`}
                          className="w-full h-full"
                          title="Invoice Preview"
                        />
                      </object>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <FileText className="h-16 w-16 text-gray-300" />
                        <p className="mt-4 text-gray-500 text-sm">No Preview Available</p>
                      </div>
                    )}
                 </div>
              </div>

              {/* Right: Details */}
              <div className="w-[60%] flex flex-col bg-white">
                 {/* Modal Header */}
                 <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                       <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          {selectedInvoice.invoice_number || 'N/A'} 
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(selectedInvoice.invoice_status)}`}>
                            {getStatusLabel(selectedInvoice.invoice_status)}
                          </span>
                       </h2>
                    </div>
                    <div className="flex items-center gap-2">
                       {!isEditing && (
                         <button 
                           onClick={handleEdit}
                           className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                         >
                           <Edit3 className="h-4 w-4" />
                         </button>
                       )}
                       <button onClick={() => { setSelectedInvoice(null); setIsEditing(false); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors">
                          <X className="h-5 w-5" />
                       </button>
                    </div>
                 </div>

                 {/* Tabs */}
                 <div className="flex border-b border-gray-200 px-6 bg-gray-50">
                    <button 
                      onClick={() => setModalTab('details')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${modalTab === 'details' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                    >
                      Invoice Details
                    </button>
                    <button 
                      onClick={() => setModalTab('validation')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${modalTab === 'validation' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                    >
                      Validation Results
                    </button>
                    <button 
                      onClick={() => setModalTab('history')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${modalTab === 'history' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                    >
                      History
                    </button>
                 </div>

                 {/* Tab Content */}
                 <div className="flex-1 overflow-y-auto p-6">
                    {modalTab === 'details' && (
                       <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-xs text-gray-600 font-medium uppercase tracking-wider">Invoice Number</label>
                                <input 
                                  type="text" 
                                  value={isEditing ? (editedData.invoice_number ?? selectedInvoice.invoice_number ?? '') : (selectedInvoice.invoice_number || '')} 
                                  onChange={(e) => handleFieldChange('invoice_number', e.target.value)}
                                  disabled={!isEditing}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-50 disabled:bg-gray-100" 
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs text-gray-600 font-medium uppercase tracking-wider">Invoice Date</label>
                                <input 
                                  type="date" 
                                  value={isEditing ? (editedData.invoice_date ?? selectedInvoice.invoice_date ?? '') : (selectedInvoice.invoice_date || '')} 
                                  onChange={(e) => handleFieldChange('invoice_date', e.target.value)}
                                  disabled={!isEditing}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-50 disabled:bg-gray-100" 
                                />
                             </div>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-gray-200">
                             <h4 className="text-sm font-semibold text-gray-900">Customer Details</h4>
                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <label className="text-xs text-gray-600 font-medium uppercase tracking-wider">Customer Name</label>
                                   <input 
                                     type="text" 
                                     value={isEditing ? (editedData.customer_name ?? selectedInvoice.customer_name ?? '') : (selectedInvoice.customer_name || '')} 
                                     onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                                     disabled={!isEditing}
                                     className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-50 disabled:bg-gray-100" 
                                   />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-xs text-gray-600 font-medium uppercase tracking-wider">GSTIN</label>
                                   <input 
                                     type="text" 
                                     value={isEditing ? (editedData.customer_gstin ?? selectedInvoice.customer_gstin ?? '') : (selectedInvoice.customer_gstin || '')} 
                                     onChange={(e) => handleFieldChange('customer_gstin', e.target.value)}
                                     disabled={!isEditing}
                                     className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-50 disabled:bg-gray-100" 
                                   />
                                </div>
                             </div>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-gray-200">
                             <h4 className="text-sm font-semibold text-gray-900">Tax Breakdown</h4>
                             <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="space-y-1">
                                   <label className="text-xs text-gray-600">Taxable Value</label>
                                   <input 
                                     type="number" 
                                     value={isEditing ? (editedData.taxable_value ?? selectedInvoice.taxable_value ?? 0) : (selectedInvoice.taxable_value || 0)} 
                                     onChange={(e) => handleFieldChange('taxable_value', parseFloat(e.target.value))}
                                     disabled={!isEditing}
                                     className="w-full bg-transparent border-b border-gray-200 py-1 text-sm text-gray-900 font-mono outline-none focus:border-primary text-right disabled:opacity-50" 
                                   />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-xs text-gray-600">CGST</label>
                                   <input 
                                     type="number" 
                                     value={isEditing ? (editedData.cgst ?? selectedInvoice.cgst ?? 0) : (selectedInvoice.cgst || 0)} 
                                     onChange={(e) => handleFieldChange('cgst', parseFloat(e.target.value))}
                                     disabled={!isEditing}
                                     className="w-full bg-transparent border-b border-gray-200 py-1 text-sm text-gray-900 font-mono outline-none focus:border-primary text-right disabled:opacity-50" 
                                   />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-xs text-gray-600">SGST</label>
                                   <input 
                                     type="number" 
                                     value={isEditing ? (editedData.sgst ?? selectedInvoice.sgst ?? 0) : (selectedInvoice.sgst || 0)} 
                                     onChange={(e) => handleFieldChange('sgst', parseFloat(e.target.value))}
                                     disabled={!isEditing}
                                     className="w-full bg-transparent border-b border-gray-200 py-1 text-sm text-gray-900 font-mono outline-none focus:border-primary text-right disabled:opacity-50" 
                                   />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-xs text-gray-600">IGST</label>
                                   <input 
                                     type="number" 
                                     value={isEditing ? (editedData.igst ?? selectedInvoice.igst ?? 0) : (selectedInvoice.igst || 0)} 
                                     onChange={(e) => handleFieldChange('igst', parseFloat(e.target.value))}
                                     disabled={!isEditing}
                                     className="w-full bg-transparent border-b border-gray-200 py-1 text-sm text-gray-900 font-mono outline-none focus:border-primary text-right disabled:opacity-50" 
                                   />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-xs text-gray-600">CESS</label>
                                   <input 
                                     type="number" 
                                     value={isEditing ? (editedData.cess ?? selectedInvoice.cess ?? 0) : (selectedInvoice.cess || 0)} 
                                     onChange={(e) => handleFieldChange('cess', parseFloat(e.target.value))}
                                     disabled={!isEditing}
                                     className="w-full bg-transparent border-b border-gray-200 py-1 text-sm text-gray-900 font-mono outline-none focus:border-primary text-right disabled:opacity-50" 
                                   />
                                </div>
                             </div>
                             <div className="flex justify-end items-center gap-4 pt-2">
                                <span className="text-sm text-zinc-400">Total Amount</span>
                                <span className="text-2xl font-bold text-white font-mono">Rs. {(selectedInvoice.total_invoice_value || 0).toLocaleString()}</span>
                             </div>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-white/5">
                             <h4 className="text-sm font-semibold text-white">Additional Details</h4>
                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <label className="text-xs text-gray-600 font-medium uppercase">HSN/SAC Code</label>
                                   <input 
                                     type="text" 
                                     value={isEditing ? (editedData.hsn_or_sac ?? selectedInvoice.hsn_or_sac ?? '') : (selectedInvoice.hsn_or_sac || '')} 
                                     onChange={(e) => handleFieldChange('hsn_or_sac', e.target.value)}
                                     disabled={!isEditing}
                                     className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-50 disabled:bg-gray-100" 
                                   />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-xs text-gray-600 font-medium uppercase">Invoice Type</label>
                                   <input 
                                     type="text" 
                                     value={isEditing ? (editedData.invoice_type ?? selectedInvoice.invoice_type ?? '') : (selectedInvoice.invoice_type || '')} 
                                     onChange={(e) => handleFieldChange('invoice_type', e.target.value)}
                                     disabled={!isEditing}
                                     className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-50 disabled:bg-gray-100" 
                                   />
                                </div>
                             </div>
                          </div>
                       </div>
                    )}

                    {modalTab === 'validation' && (
                       <div className="space-y-4">
                          {loadingRemarks ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                            </div>
                          ) : (
                            <>
                              {/* Overall Status */}
                              <div className={`p-4 rounded-xl border-2 ${
                                getValidationStatus(selectedInvoice) === 'validated' 
                                  ? 'bg-emerald-50 border-emerald-200' 
                                  : getValidationStatus(selectedInvoice) === 'partial'
                                  ? 'bg-amber-50 border-amber-200'
                                  : 'bg-red-50 border-red-200'
                              }`}>
                                <div className="flex items-center gap-3">
                                  {getValidationStatus(selectedInvoice) === 'validated' ? (
                                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                                  ) : getValidationStatus(selectedInvoice) === 'partial' ? (
                                    <AlertCircle className="h-6 w-6 text-amber-600" />
                                  ) : (
                                    <XCircle className="h-6 w-6 text-red-600" />
                                  )}
                                  <div className="flex-1">
                                    <h3 className={`text-sm font-semibold ${
                                      getValidationStatus(selectedInvoice) === 'validated' 
                                        ? 'text-emerald-900' 
                                        : getValidationStatus(selectedInvoice) === 'partial'
                                        ? 'text-amber-900'
                                        : 'text-red-900'
                                    }`}>
                                      {getValidationStatus(selectedInvoice) === 'validated' 
                                        ? 'Invoice Validated Successfully' 
                                        : getValidationStatus(selectedInvoice) === 'partial'
                                        ? 'Invoice Partially Valid - Action Required'
                                        : 'Invoice Validation Failed'}
                                    </h3>
                                    <p className={`text-xs mt-1 ${
                                      getValidationStatus(selectedInvoice) === 'validated' 
                                        ? 'text-emerald-700' 
                                        : getValidationStatus(selectedInvoice) === 'partial'
                                        ? 'text-amber-700'
                                        : 'text-red-700'
                                    }`}>
                                      {getValidationStatus(selectedInvoice) === 'validated' 
                                        ? 'All required fields are present and valid for GSTR-1 filing' 
                                        : getValidationStatus(selectedInvoice) === 'partial'
                                        ? 'Some required fields are missing or invalid. Please review and complete.'
                                        : 'Critical validation errors found. Manual review required.'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Missing Fields Section */}
                              {(() => {
                                const missingFields = getMissingFields(selectedInvoice);
                                return missingFields.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4 text-amber-600" />
                                      Missing Required Information ({missingFields.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {missingFields.map((field, idx) => (
                                        <div 
                                          key={idx}
                                          className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3"
                                        >
                                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                          <div className="flex-1">
                                            <p className="text-sm font-medium text-amber-900">{field}</p>
                                            <p className="text-xs text-amber-700 mt-0.5">This field is required for GSTR-1 compliance</p>
                                          </div>
                                          <span className="text-xs px-2 py-1 rounded-md bg-amber-100 text-amber-700 font-medium">
                                            MISSING
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Validation Remarks/Issues Section */}
                              {remarks.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                                    Validation Issues ({remarks.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {remarks.map((remark) => (
                                      <div 
                                        key={remark.id} 
                                        className={`p-3 rounded-lg border flex items-start gap-3 ${
                                          remark.issue_type === 'missing' 
                                            ? 'bg-amber-50 border-amber-200' 
                                            : remark.issue_type === 'invalid'
                                            ? 'bg-red-50 border-red-200'
                                            : remark.issue_type === 'mismatch'
                                            ? 'bg-orange-50 border-orange-200'
                                            : 'bg-blue-50 border-blue-200'
                                        }`}
                                      >
                                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                                          remark.issue_type === 'missing' 
                                            ? 'bg-amber-500' 
                                            : remark.issue_type === 'invalid'
                                            ? 'bg-red-500'
                                            : remark.issue_type === 'mismatch'
                                            ? 'bg-orange-500'
                                            : 'bg-blue-500'
                                        }`}></div>
                                        <div className="flex-1">
                                          <h4 className={`text-sm font-semibold capitalize ${
                                            remark.issue_type === 'missing' 
                                              ? 'text-amber-900' 
                                              : remark.issue_type === 'invalid'
                                              ? 'text-red-900'
                                              : remark.issue_type === 'mismatch'
                                              ? 'text-orange-900'
                                              : 'text-blue-900'
                                          }`}>
                                            {remark.field_name.replace(/_/g, ' ')}
                                          </h4>
                                          <p className={`text-xs mt-1 ${
                                            remark.issue_type === 'missing' 
                                              ? 'text-amber-700' 
                                              : remark.issue_type === 'invalid'
                                              ? 'text-red-700'
                                              : remark.issue_type === 'mismatch'
                                              ? 'text-orange-700'
                                              : 'text-blue-700'
                                          }`}>
                                            {remark.comment || 'No details provided'}
                                          </p>
                                          {remark.detected_value && (
                                            <p className="text-xs text-gray-600 mt-1 font-mono">
                                              Detected: {remark.detected_value}
                                            </p>
                                          )}
                                          {remark.expected_value && (
                                            <p className="text-xs text-gray-600 mt-0.5 font-mono">
                                              Expected: {remark.expected_value}
                                            </p>
                                          )}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-md font-medium uppercase ${
                                          remark.issue_type === 'missing' 
                                            ? 'bg-amber-100 text-amber-700' 
                                            : remark.issue_type === 'invalid'
                                            ? 'bg-red-100 text-red-700'
                                            : remark.issue_type === 'mismatch'
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {remark.issue_type}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Success State */}
                              {selectedInvoice && getMissingFields(selectedInvoice).length === 0 && remarks.length === 0 && (
                                <div className="text-center py-12">
                                  <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Issues Found</h3>
                                  <p className="text-sm text-gray-600">This invoice passes all validation checks and is ready for filing.</p>
                                </div>
                              )}
                            </>
                          )}
                       </div>
                    )}
                    
                    {modalTab === 'history' && (
                       <div className="relative pl-6 border-l border-zinc-800 space-y-8">
                          {[
                             { time: 'Today, 2:30 PM', action: 'Validated Successfully', user: 'System', icon: CheckCircle2, color: 'text-emerald-500' },
                             { time: 'Today, 2:29 PM', action: 'Edited by User', user: 'Rahul Sharma', icon: Edit3, color: 'text-blue-500' },
                             { time: 'Today, 2:25 PM', action: 'Validation Failed (Total Mismatch)', user: 'System', icon: AlertTriangle, color: 'text-red-500' },
                             { time: 'Today, 2:24 PM', action: 'Uploaded via WhatsApp', user: 'System', icon: UploadCloud, color: 'text-zinc-400' },
                          ].map((item, i) => (
                             <div key={i} className="relative">
                                <div className={`absolute -left-[33px] top-0 h-4 w-4 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center`}>
                                   <div className={`h-1.5 w-1.5 rounded-full ${item.color.replace('text-', 'bg-')}`}></div>
                                </div>
                                <p className="text-xs text-gray-600 mb-1">{item.time}</p>
                                <p className="text-sm text-white font-medium">{item.action}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">by {item.user}</p>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>

                 {/* Modal Footer */}
                 <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                    {isEditing ? (
                      <>
                        <button 
                          onClick={handleCancelEdit} 
                          className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveChanges}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" /> Save Changes
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => { setSelectedInvoice(null); setIsEditing(false); }} 
                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        Close
                      </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Upload Sales Invoice</h2>
              <button 
                onClick={() => {
                  setUploadModalOpen(false);
                  setSelectedFile(null);
                  setUploadProgress(0);
                }} 
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer"
                     onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <UploadCloud className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400">PDF, PNG, JPG up to 10MB</p>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <FileText className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                    {!isUploading && (
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="p-1 hover:bg-emerald-200 rounded text-emerald-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Uploading and processing...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Processing Pipeline:</strong> Upload → OCR Extraction → AI Validation → GSTR-1 Compliance Check
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setSelectedFile(null);
                  setUploadProgress(0);
                }}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" /> Upload & Process
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}








