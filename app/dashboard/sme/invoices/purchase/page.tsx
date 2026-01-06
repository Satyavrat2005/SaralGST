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
  ChevronDown,
  Save,
  History,
  Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';
import { PurchaseRegister } from '@/lib/services/purchaseInvoiceService';

interface Remark {
  id: string;
  field_name: string;
  issue_type: string;
  detected_value: string | null;
  expected_value: string | null;
  comment: string | null;
  status: string;
}

export default function PurchaseRegisterPage() {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseRegister | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'validation' | 'history'>('details');
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseRegister[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<PurchaseRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<PurchaseRegister>>({});
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState('This Month');
  const [vendorFilter, setVendorFilter] = useState('All Vendors');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [validationStatusData, setValidationStatusData] = useState([
    { name: 'Validated', value: 0, color: '#10B981' },
    { name: 'Partial', value: 0, color: '#F59E0B' },
    { name: 'Failed', value: 0, color: '#EF4444' },
  ]);
  
  const [stats, setStats] = useState({
    totalPurchases: 0,
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
  }, [purchaseInvoices, dateFilter, vendorFilter, statusFilter, searchQuery]);

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
      const response = await fetch('/api/invoice/purchase');
      const data = await response.json();

      if (data.success && data.invoices) {
        setPurchaseInvoices(data.invoices);
        calculateStats(data.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoices: PurchaseRegister[]) => {
    const totalPurchases = invoices.reduce((sum, inv) => sum + (inv.total_invoice_value || 0), 0);
    const cgst = invoices.reduce((sum, inv) => sum + (inv.cgst_amount || 0), 0);
    const sgst = invoices.reduce((sum, inv) => sum + (inv.sgst_amount || 0), 0);
    const igst = invoices.reduce((sum, inv) => sum + (inv.igst_amount || 0), 0);
    const totalTax = cgst + sgst + igst;

    const validated = invoices.filter(inv => inv.invoice_status === 'extracted' || inv.invoice_status === 'verified').length;
    const partial = invoices.filter(inv => inv.invoice_status === 'pending').length;
    const failed = invoices.filter(inv => inv.invoice_status === 'error').length;

    setStats({
      totalPurchases,
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
    let filtered = [...purchaseInvoices];

    // Vendor filter
    if (vendorFilter !== 'All Vendors') {
      filtered = filtered.filter(inv => inv.supplier_name === vendorFilter);
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
        inv.supplier_name?.toLowerCase().includes(query) ||
        inv.supplier_gstin?.toLowerCase().includes(query)
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
      const response = await fetch(`/api/invoice/purchase/${id}`);
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

  const handleFieldChange = (field: keyof PurchaseRegister, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!selectedInvoice?.id) return;

    try {
      // Remove total_invoice_value from editedData as it's a generated column
      const { total_invoice_value, ...dataToSave } = editedData;
      
      const response = await fetch(`/api/invoice/purchase/${selectedInvoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setPurchaseInvoices(prev =>
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
    setVendorFilter('All Vendors');
    setStatusFilter('All Status');
    setSearchQuery('');
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoice/purchase/${invoiceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        setPurchaseInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
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
    // Define all columns in standard purchase register format
    const headers = [
      // Basic Information
      'Serial No.',
      'Invoice Number',
      'Invoice Date',
      'Invoice Type',
      'Source',
      
      // Supplier Details
      'Supplier Name',
      'Supplier GSTIN',
      'Supplier State Code',
      
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
      
      // ITC Details
      'Is Reverse Charge',
      'Is ITC Eligible',
      'ITC Claimed CGST',
      'ITC Claimed SGST',
      'ITC Claimed IGST',
      'ITC Claimed CESS',
      'Total ITC Claimed',
      
      // Processing Details
      'Invoice Status',
      'OCR Confidence Score',
      'Created At',
      'Updated At',
      'Invoice URL'
    ];

    // Map data to CSV rows
    const rows = filteredInvoices.map((inv, index) => {
      const cgstRate = inv.cgst_amount && inv.taxable_value ? ((inv.cgst_amount / inv.taxable_value) * 100).toFixed(2) : '';
      const sgstRate = inv.sgst_amount && inv.taxable_value ? ((inv.sgst_amount / inv.taxable_value) * 100).toFixed(2) : '';
      const igstRate = inv.igst_amount && inv.taxable_value ? ((inv.igst_amount / inv.taxable_value) * 100).toFixed(2) : '';
      const totalTax = (inv.cgst_amount || 0) + (inv.sgst_amount || 0) + (inv.igst_amount || 0) + (inv.cess_amount || 0);
      const totalItc = (inv.itc_claimed_cgst || 0) + (inv.itc_claimed_sgst || 0) + (inv.itc_claimed_igst || 0) + (inv.itc_claimed_cess || 0);
      
      return [
        (index + 1).toString(),
        inv.invoice_number || '',
        inv.invoice_date || '',
        inv.invoice_type || '',
        inv.source || '',
        inv.supplier_name || '',
        inv.supplier_gstin || '',
        inv.supplier_state_code || '',
        inv.buyer_gstin || '',
        inv.place_of_supply_state_code || '',
        inv.hsn_or_sac_code || '',
        inv.description_of_goods_services || '',
        inv.quantity?.toString() || '',
        inv.unit_of_measure || '',
        inv.rate_per_unit?.toString() || '',
        inv.taxable_value?.toFixed(2) || '',
        cgstRate ? `${cgstRate}%` : '',
        inv.cgst_amount?.toFixed(2) || '',
        sgstRate ? `${sgstRate}%` : '',
        inv.sgst_amount?.toFixed(2) || '',
        igstRate ? `${igstRate}%` : '',
        inv.igst_amount?.toFixed(2) || '',
        inv.cess_amount?.toFixed(2) || '',
        totalTax.toFixed(2),
        inv.total_invoice_value?.toFixed(2) || '',
        inv.is_reverse_charge ? 'Yes' : 'No',
        inv.is_itc_eligible ? 'Yes' : 'No',
        inv.itc_claimed_cgst?.toFixed(2) || '',
        inv.itc_claimed_sgst?.toFixed(2) || '',
        inv.itc_claimed_igst?.toFixed(2) || '',
        inv.itc_claimed_cess?.toFixed(2) || '',
        totalItc.toFixed(2),
        inv.invoice_status || '',
        inv.ocr_confidence_score ? `${(inv.ocr_confidence_score * 100).toFixed(2)}%` : '',
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
    const filename = `purchase_register_${dateStr}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const XLSX = await import('xlsx');
      
      // Prepare data in standard purchase register format
      const data = filteredInvoices.map((inv, index) => {
        const cgstRate = inv.cgst_amount && inv.taxable_value ? ((inv.cgst_amount / inv.taxable_value) * 100).toFixed(2) : '';
        const sgstRate = inv.sgst_amount && inv.taxable_value ? ((inv.sgst_amount / inv.taxable_value) * 100).toFixed(2) : '';
        const igstRate = inv.igst_amount && inv.taxable_value ? ((inv.igst_amount / inv.taxable_value) * 100).toFixed(2) : '';
        const totalTax = (inv.cgst_amount || 0) + (inv.sgst_amount || 0) + (inv.igst_amount || 0) + (inv.cess_amount || 0);
        const totalItc = (inv.itc_claimed_cgst || 0) + (inv.itc_claimed_sgst || 0) + (inv.itc_claimed_igst || 0) + (inv.itc_claimed_cess || 0);
        
        return {
          // Basic Information
          'Serial No.': index + 1,
          'Invoice Number': inv.invoice_number || '',
          'Invoice Date': inv.invoice_date || '',
          'Invoice Type': inv.invoice_type || '',
          'Source': inv.source || '',
          
          // Supplier Details
          'Supplier Name': inv.supplier_name || '',
          'Supplier GSTIN': inv.supplier_gstin || '',
          'Supplier State Code': inv.supplier_state_code || '',
          
          // Buyer Details
          'Buyer GSTIN': inv.buyer_gstin || '',
          'Place of Supply': inv.place_of_supply_state_code || '',
          
          // Item Details
          'HSN/SAC Code': inv.hsn_or_sac_code || '',
          'Description of Goods/Services': inv.description_of_goods_services || '',
          'Quantity': inv.quantity || '',
          'Unit': inv.unit_of_measure || '',
          'Rate Per Unit': inv.rate_per_unit || '',
          
          // Tax Details
          'Taxable Value': inv.taxable_value || '',
          'CGST Rate': cgstRate ? `${cgstRate}%` : '',
          'CGST Amount': inv.cgst_amount || '',
          'SGST Rate': sgstRate ? `${sgstRate}%` : '',
          'SGST Amount': inv.sgst_amount || '',
          'IGST Rate': igstRate ? `${igstRate}%` : '',
          'IGST Amount': inv.igst_amount || '',
          'CESS Amount': inv.cess_amount || '',
          'Total Tax Amount': totalTax,
          'Total Invoice Value': inv.total_invoice_value || '',
          
          // ITC Details
          'Is Reverse Charge': inv.is_reverse_charge ? 'Yes' : 'No',
          'Is ITC Eligible': inv.is_itc_eligible ? 'Yes' : 'No',
          'ITC Claimed CGST': inv.itc_claimed_cgst || '',
          'ITC Claimed SGST': inv.itc_claimed_sgst || '',
          'ITC Claimed IGST': inv.itc_claimed_igst || '',
          'ITC Claimed CESS': inv.itc_claimed_cess || '',
          'Total ITC Claimed': totalItc,
          
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Register');

      // Set column widths for standard purchase register
      const columnWidths = [
        { wch: 10 },  // Serial No
        { wch: 20 },  // Invoice Number
        { wch: 15 },  // Invoice Date
        { wch: 15 },  // Invoice Type
        { wch: 12 },  // Source
        { wch: 35 },  // Supplier Name
        { wch: 18 },  // Supplier GSTIN
        { wch: 15 },  // Supplier State Code
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
        { wch: 15 },  // ITC Eligible
        { wch: 15 },  // ITC CGST
        { wch: 15 },  // ITC SGST
        { wch: 15 },  // ITC IGST
        { wch: 15 },  // ITC CESS
        { wch: 15 },  // Total ITC
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
      const filename = `purchase_register_${dateStr}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Trying CSV instead...');
      exportToCSV(); // Fallback to CSV
    }
  };

  const getUniqueVendors = () => {
    const vendors = new Set<string>();
    purchaseInvoices.forEach(inv => {
      if (inv.supplier_name) vendors.add(inv.supplier_name);
    });
    return Array.from(vendors);
  };

  const getMissingFields = (invoice: PurchaseRegister) => {
    const fieldLabels: { [key: string]: string } = {
      supplier_name: 'Vendor Name',
      supplier_gstin: 'Vendor GSTIN',
      supplier_state_code: 'Vendor State',
      invoice_number: 'Invoice Number',
      invoice_date: 'Invoice Date',
      invoice_type: 'Invoice Type (B2B/Import/RCM/SEZ)',
      buyer_gstin: 'Buyer GSTIN',
      place_of_supply_state_code: 'Place of Supply',
      taxable_value: 'Taxable Value',
      hsn_or_sac_code: 'HSN/SAC Code',
      description_of_goods_services: 'Description of Goods/Services',
      quantity: 'Quantity',
      unit_of_measure: 'Unit of Measure',
      rate_per_unit: 'Rate per Unit',
    };

    const missing: string[] = [];
    Object.entries(fieldLabels).forEach(([field, label]) => {
      const value = invoice[field as keyof PurchaseRegister];
      if (value === null || value === undefined || value === '' || value === 0) {
        missing.push(label);
      }
    });

    return missing;
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === purchaseInvoices.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(purchaseInvoices.map(inv => inv.id).filter((id): id is string => id !== undefined));
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
        return 'bg-gray-100 text-gray-600 border-gray-200';
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
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-2">
              <span className="text-emerald-700 text-xs font-semibold">PURCHASE REGISTER</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Purchase Register</h1>
            <p className="text-gray-600 text-sm mt-1">All inward invoices from vendors</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportToExcel}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm"
            >
              <Download className="h-4 w-4" /> Export
            </button>
            <button 
              onClick={() => router.push('/dashboard/sme/invoices/upload')}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-sm font-medium shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Upload Invoice
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between shadow-sm">
           <div className="flex flex-wrap items-center gap-3 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2 appearance-none cursor-pointer hover:bg-gray-50"
                >
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Quarter</option>
                  <option>All Time</option>
                </select>
              </div>

              <div className="w-px h-8 bg-gray-200 hidden md:block"></div>

              <select 
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2 cursor-pointer hover:bg-gray-50"
              >
                <option>All Vendors</option>
                {getUniqueVendors().map(vendor => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>

              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2 cursor-pointer hover:bg-gray-50"
              >
                <option>All Status</option>
                <option>Validated</option>
                <option>Partial</option>
                <option>Failed</option>
                <option>Processing</option>
              </select>

              <div className="relative flex-1 min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2 placeholder-gray-400" 
                  placeholder="Search invoices..." 
                />
              </div>
           </div>
           <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-900 whitespace-nowrap font-medium">Clear Filters</button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Total Purchases</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                ) : (
                  `₹ ${Math.round(stats.totalPurchases).toLocaleString()}`
                )}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{stats.count} Invoices • This Month</p>
            </div>
            <div className="px-2 py-1 bg-emerald-50 rounded text-emerald-700 text-xs font-medium flex items-center border border-emerald-200">
              <ArrowUpRight className="h-3 w-3 mr-1" /> New
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-200 shadow-lg p-6">
          <div className="flex justify-between items-start mb-4">
             <div>
               <p className="text-sm text-emerald-700">Total Input Tax (ITC)</p>
               <h3 className="text-3xl font-bold text-emerald-600 mt-2">
                 {loading ? (
                   <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                 ) : (
                   `₹ ${Math.round(stats.totalTax).toLocaleString()}`
                 )}
               </h3>
             </div>
             <div className="p-2 bg-emerald-100 rounded-lg">
               <CheckCircle2 className="h-5 w-5 text-emerald-600" />
             </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center border-t border-emerald-200 pt-3">
             <div>
               <p className="text-[10px] text-gray-600">CGST</p>
               <p className="text-xs font-mono text-gray-900">₹{(stats.cgst / 1000).toFixed(1)}K</p>
             </div>
             <div>
               <p className="text-[10px] text-gray-600">SGST</p>
               <p className="text-xs font-mono text-gray-900">₹{(stats.sgst / 1000).toFixed(1)}K</p>
             </div>
             <div>
               <p className="text-[10px] text-gray-600">IGST</p>
               <p className="text-xs font-mono text-gray-900">₹{(stats.igst / 1000).toFixed(1)}K</p>
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
                  <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #333' }} itemStyle={{color: '#fff'}} />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-gray-900 mb-2">Validation Status</p>
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
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-0 overflow-hidden flex flex-col h-[600px]">
        {/* Table Actions Bar */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <input 
                   type="checkbox" 
                   className="rounded bg-white border-gray-300 text-emerald-600 focus:ring-emerald-500"
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
                    <button className="px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700 border-r border-gray-200">Mark Reviewed</button>
                    <button className="px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700 border-r border-gray-200">Re-validate</button>
                    <button className="px-3 py-1.5 text-xs hover:bg-red-50 text-red-600 hover:text-red-700">Delete</button>
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
                 <th className="px-6 py-3 cursor-pointer hover:text-gray-900 transition-colors">Vendor</th>
                 <th className="px-6 py-3 text-right cursor-pointer hover:text-gray-900 transition-colors">Taxable</th>
                 <th className="px-6 py-3 text-right cursor-pointer hover:text-gray-900 transition-colors">GST</th>
                 <th className="px-6 py-3 text-right cursor-pointer hover:text-gray-900 transition-colors">Total</th>
                 <th className="px-6 py-3 text-center">HSN</th>
                 <th className="px-6 py-3 text-center">Status</th>
                 <th className="px-6 py-3 text-center">Source</th>
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
                       onClick={() => router.push('/dashboard/sme/invoices/upload')}
                       className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
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
                         className="rounded bg-white border-gray-300 text-emerald-600 focus:ring-emerald-500"
                         checked={selectedRows.includes(inv.id || '')}
                         onChange={() => toggleRowSelection(inv.id || '')}
                       />
                     </td>
                     <td className="px-6 py-4">
                        <button onClick={() => setSelectedInvoice(inv)} className="font-medium text-gray-900 hover:text-emerald-600 hover:underline text-left">
                          {inv.invoice_number || 'N/A'}
                        </button>
                     </td>
                     <td className="px-6 py-4 text-gray-600">
                       {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : 'N/A'}
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900">{inv.supplier_name || 'Unknown'}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{inv.supplier_gstin || 'N/A'}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right text-gray-700 font-mono">
                       ₹{(inv.taxable_value || 0).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-right text-gray-700 font-mono group-hover:text-emerald-600 transition-colors cursor-help" title="CGST + SGST + IGST">
                       ₹{((inv.cgst_amount || 0) + (inv.sgst_amount || 0) + (inv.igst_amount || 0)).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono">
                       ₹{(inv.total_invoice_value || 0).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-center text-gray-500 font-mono text-xs">
                       {inv.hsn_or_sac_code || 'N/A'}
                     </td>
                     <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(inv.invoice_status)}`}>
                           {getStatusLabel(inv.invoice_status)}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-center">
                        <span className="text-xs text-gray-700 capitalize">
                          {inv.source || 'manual'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900" title="View Details">
                              <Eye className="h-4 w-4" />
                           </button>
                           {inv.invoice_bucket_url && (
                             <a 
                               href={inv.invoice_bucket_url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900" 
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
                               className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
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
                                   className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
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
                                   className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                 >
                                   <Edit3 className="h-3 w-3" /> Edit
                                 </button>
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleDeleteInvoice(inv.id || '');
                                   }}
                                   className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2"
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
           <div className="text-xs text-gray-500">Showing 1-50 of 823</div>
           <div className="flex items-center gap-2">
              <select className="bg-white border border-gray-200 text-xs rounded p-1 text-gray-700 outline-none">
                <option>25 / page</option>
                <option>50 / page</option>
                <option>100 / page</option>
              </select>
              <div className="flex gap-1">
                 <button className="px-2 py-1 rounded bg-gray-200 text-gray-400 text-xs" disabled>Previous</button>
                 <button className="px-2 py-1 rounded bg-emerald-600 text-white text-xs">1</button>
                 <button className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:text-gray-900 hover:bg-gray-200">2</button>
                 <button className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:text-gray-900 hover:bg-gray-200">3</button>
                 <span className="px-2 py-1 text-gray-400 text-xs">...</span>
                 <button className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:text-gray-900 hover:bg-gray-200">Next</button>
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
                           className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
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
                          src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedInvoice.invoice_bucket_url)}&embedded=true`}
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
                 <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
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
                 <div className="flex border-b border-gray-200 px-6 bg-white">
                    <button 
                      onClick={() => setModalTab('details')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${modalTab === 'details' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                      Invoice Details
                    </button>
                    <button 
                      onClick={() => setModalTab('validation')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${modalTab === 'validation' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                      Validation Results
                    </button>
                    <button 
                      onClick={() => setModalTab('history')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${modalTab === 'history' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
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
                                <label className="text-xs text-gray-600 font-medium uppercase">Invoice Number</label>
                                <input 
                                  type="text" 
                                  value={isEditing ? (editedData.invoice_number ?? selectedInvoice.invoice_number ?? '') : (selectedInvoice.invoice_number || '')} 
                                  onChange={(e) => handleFieldChange('invoice_number', e.target.value)}
                                  disabled={!isEditing}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-gray-50 disabled:text-gray-500" 
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs text-gray-600 font-medium uppercase">Invoice Date</label>
                                <input 
                                  type="date" 
                                  value={isEditing ? (editedData.invoice_date ?? selectedInvoice.invoice_date ?? '') : (selectedInvoice.invoice_date || '')} 
                                  onChange={(e) => handleFieldChange('invoice_date', e.target.value)}
                                  disabled={!isEditing}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-gray-50 disabled:text-gray-500" 
                                />
                             </div>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-gray-200">
                             <h4 className="text-sm font-semibold text-gray-900">Vendor Details</h4>
                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <label className="text-xs text-gray-600 font-medium uppercase">Vendor Name</label>
                                   <input 
                                     type="text" 
                                     value={isEditing ? (editedData.supplier_name ?? selectedInvoice.supplier_name ?? '') : (selectedInvoice.supplier_name || '')} 
                                     onChange={(e) => handleFieldChange('supplier_name', e.target.value)}
                                     disabled={!isEditing}
                                     className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-gray-50 disabled:text-gray-500" 
                                   />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-xs text-gray-600 font-medium uppercase">GSTIN</label>
                                   <input 
                                     type="text" 
                                     value={isEditing ? (editedData.supplier_gstin ?? selectedInvoice.supplier_gstin ?? '') : (selectedInvoice.supplier_gstin || '')} 
                                     onChange={(e) => handleFieldChange('supplier_gstin', e.target.value)}
                                     disabled={!isEditing}
                                     className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-gray-50 disabled:text-gray-500" 
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
                                     className="w-full bg-transparent border-b border-gray-300 py-1 text-sm text-gray-900 font-mono outline-none focus:border-emerald-500 text-right disabled:text-gray-500" 
                                   />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-xs text-gray-600">CGST</label>
                                   <input 
                                     type="number" 
                                     value={isEditing ? (editedData.cgst_amount ?? selectedInvoice.cgst_amount ?? 0) : (selectedInvoice.cgst_amount || 0)} 
                                     onChange={(e) => handleFieldChange('cgst_amount', parseFloat(e.target.value))}
                                     disabled={!isEditing}
                                     className="w-full bg-transparent border-b border-gray-300 py-1 text-sm text-gray-900 font-mono outline-none focus:border-emerald-500 text-right disabled:text-gray-500" 
                                   />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-xs text-gray-600">SGST</label>
                                   <input 
                                     type="number" 
                                     value={isEditing ? (editedData.sgst_amount ?? selectedInvoice.sgst_amount ?? 0) : (selectedInvoice.sgst_amount || 0)} 
                                     onChange={(e) => handleFieldChange('sgst_amount', parseFloat(e.target.value))}
                                     disabled={!isEditing}
                                     className="w-full bg-transparent border-b border-gray-300 py-1 text-sm text-gray-900 font-mono outline-none focus:border-emerald-500 text-right disabled:text-gray-500" 
                                   />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-xs text-gray-600">IGST</label>
                                   <input 
                                     type="number" 
                                     value={isEditing ? (editedData.igst_amount ?? selectedInvoice.igst_amount ?? 0) : (selectedInvoice.igst_amount || 0)} 
                                     onChange={(e) => handleFieldChange('igst_amount', parseFloat(e.target.value))}
                                     disabled={!isEditing}
                                     className="w-full bg-transparent border-b border-gray-300 py-1 text-sm text-gray-900 font-mono outline-none focus:border-emerald-500 text-right disabled:text-gray-500" 
                                   />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-xs text-gray-600">CESS</label>
                                   <input 
                                     type="number" 
                                     value={isEditing ? (editedData.cess_amount ?? selectedInvoice.cess_amount ?? 0) : (selectedInvoice.cess_amount || 0)} 
                                     onChange={(e) => handleFieldChange('cess_amount', parseFloat(e.target.value))}
                                     disabled={!isEditing}
                                     className="w-full bg-transparent border-b border-gray-300 py-1 text-sm text-gray-900 font-mono outline-none focus:border-emerald-500 text-right disabled:text-gray-500" 
                                   />
                                </div>
                             </div>
                             <div className="flex justify-end items-center gap-4 pt-2">
                                <span className="text-sm text-gray-600">Total Amount</span>
                                <span className="text-2xl font-bold text-gray-900 font-mono">₹ {(selectedInvoice.total_invoice_value || 0).toLocaleString()}</span>
                             </div>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-gray-200">
                             <h4 className="text-sm font-semibold text-gray-900">Additional Details</h4>
                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <label className="text-xs text-gray-600 font-medium uppercase">HSN/SAC Code</label>
                                   <input 
                                     type="text" 
                                     value={isEditing ? (editedData.hsn_or_sac_code ?? selectedInvoice.hsn_or_sac_code ?? '') : (selectedInvoice.hsn_or_sac_code || '')} 
                                     onChange={(e) => handleFieldChange('hsn_or_sac_code', e.target.value)}
                                     disabled={!isEditing}
                                     className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-gray-50 disabled:text-gray-500" 
                                   />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-xs text-gray-600 font-medium uppercase">Invoice Type</label>
                                   <input 
                                     type="text" 
                                     value={isEditing ? (editedData.invoice_type ?? selectedInvoice.invoice_type ?? '') : (selectedInvoice.invoice_type || '')} 
                                     onChange={(e) => handleFieldChange('invoice_type', e.target.value)}
                                     disabled={!isEditing}
                                     className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-gray-50 disabled:text-gray-500" 
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
                              {/* Missing Fields Section */}
                              {(() => {
                                const missingFields = getMissingFields(selectedInvoice);
                                return missingFields.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Missing Information</h4>
                                    {missingFields.map((field, idx) => (
                                      <div 
                                        key={idx}
                                        className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 mb-3"
                                      >
                                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <h4 className="text-sm font-semibold text-amber-900">{field}</h4>
                                          <p className="text-xs text-amber-700 mt-1">This field is missing or empty in the invoice.</p>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                                          missing
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}

                              {/* Remarks/Issues Section */}
                              {remarks.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Validation Issues</h4>
                                  {remarks.map((remark) => (
                                    <div 
                                      key={remark.id} 
                                      className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 mb-3"
                                    >
                                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                      <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-amber-900 capitalize">
                                          {remark.field_name.replace(/_/g, ' ')} - {remark.issue_type}
                                        </h4>
                                        <p className="text-xs text-amber-700 mt-1">{remark.comment || 'No details provided'}</p>
                                        {remark.detected_value && (
                                          <p className="text-xs text-gray-600 mt-1">
                                            Detected: <span className="font-mono">{remark.detected_value}</span>
                                          </p>
                                        )}
                                        {remark.expected_value && (
                                          <p className="text-xs text-gray-600">
                                            Expected: <span className="font-mono">{remark.expected_value}</span>
                                          </p>
                                        )}
                                      </div>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        remark.status === 'resolved' 
                                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                                          : 'bg-amber-100 text-amber-700 border border-amber-300'
                                      }`}>
                                        {remark.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* All Clear Message */}
                              {remarks.length === 0 && getMissingFields(selectedInvoice).length === 0 && (
                                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                  <div>
                                    <h4 className="text-sm font-semibold text-emerald-900">All Fields Validated</h4>
                                    <p className="text-xs text-emerald-700 mt-1">No issues found with this invoice. All required information is present.</p>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                       </div>
                    )}
                    
                    {modalTab === 'history' && (
                       <div className="relative pl-6 border-l border-gray-200 space-y-8">
                          {[
                             { time: 'Today, 2:30 PM', action: 'Validated Successfully', user: 'System', icon: CheckCircle2, color: 'text-emerald-600' },
                             { time: 'Today, 2:29 PM', action: 'Edited by User', user: 'Rahul Sharma', icon: Edit3, color: 'text-blue-600' },
                             { time: 'Today, 2:25 PM', action: 'Validation Failed (Total Mismatch)', user: 'System', icon: AlertTriangle, color: 'text-red-600' },
                             { time: 'Today, 2:24 PM', action: 'Uploaded via WhatsApp', user: 'System', icon: UploadCloud, color: 'text-gray-500' },
                          ].map((item, i) => (
                             <div key={i} className="relative">
                                <div className={`absolute -left-[33px] top-0 h-4 w-4 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center`}>
                                   <div className={`h-1.5 w-1.5 rounded-full ${item.color.replace('text-', 'bg-')}`}></div>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">{item.time}</p>
                                <p className="text-sm text-gray-900 font-medium">{item.action}</p>
                                <p className="text-xs text-gray-600 mt-0.5">by {item.user}</p>
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
                          className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveChanges}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-colors shadow-lg flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" /> Save Changes
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => { setSelectedInvoice(null); setIsEditing(false); }} 
                        className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        Close
                      </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
      </div>

    </div>
  );
}
