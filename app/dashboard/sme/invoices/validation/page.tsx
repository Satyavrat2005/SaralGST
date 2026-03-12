'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  ChevronRight, 
  Wrench, 
  Trash2, 
  ExternalLink,
  Loader2
} from 'lucide-react';

interface ValidationQueueInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  vendor: string;
  gstin: string;
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

interface ValidationSummary {
  total: number;
  passed: number;
  partial: number;
  failed: number;
  purchase: number;
  sales: number;
}

export default function ValidationQueuePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'fail' | 'partial' | 'pass'>('fail');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<ValidationQueueInvoice[]>([]);
  const [summary, setSummary] = useState<ValidationSummary>({
    total: 0,
    passed: 0,
    partial: 0,
    failed: 0,
    purchase: 0,
    sales: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchValidationQueue = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoice/validation-queue');
      const data = await response.json();
      
      if (data.success) {
        setInvoices(data.invoices);
        setSummary(data.summary);
      } else {
        console.error('Failed to fetch validation queue');
      }
    } catch (error) {
      console.error('Error fetching validation queue:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchValidationQueue();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchValidationQueue();
  };

  // Export Issues to CSV
  const handleExportIssues = () => {
    const issueInvoices = invoices.filter(inv => inv.validation_status !== 'passed');
    if (issueInvoices.length === 0) {
      alert('No issues to export!');
      return;
    }

    const csvData = issueInvoices.map(inv => ({
      'Invoice Number': inv.invoice_number,
      'Date': inv.invoice_date,
      'Vendor': inv.vendor,
      'GSTIN': inv.gstin,
      'Amount': inv.amount,
      'Type': inv.type,
      'Status': inv.validation_status,
      'Errors': inv.errors.map(e => e.message).join('; '),
      'Warnings': inv.warnings.map(w => w.message).join('; ')
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-issues-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Navigate to edit invoice
  const handleEditInvoice = (invoice: ValidationQueueInvoice) => {
    router.push(`/dashboard/sme/invoices/${invoice.type}?id=${invoice.id}`);
  };

  // Delete invoice
  const handleDeleteInvoice = async (invoice: ValidationQueueInvoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      return;
    }

    setProcessingIds(prev => new Set(prev).add(invoice.id));
    
    try {
      const table = invoice.type === 'purchase' ? 'purchase_register' : 'sales_register';
      const response = await fetch(`/api/invoice/${invoice.type}?id=${invoice.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Invoice deleted successfully');
        fetchValidationQueue(); // Refresh the list
      } else {
        alert('Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Error deleting invoice');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoice.id);
        return newSet;
      });
    }
  };

  // Approve invoice (update status to verified)
  const handleApproveInvoice = async (invoice: ValidationQueueInvoice) => {
    setProcessingIds(prev => new Set(prev).add(invoice.id));
    
    try {
      const table = invoice.type === 'purchase' ? 'purchase_register' : 'sales_register';
      const response = await fetch(`/api/invoice/${invoice.type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: invoice.id,
          invoice_status: 'verified'
        })
      });

      if (response.ok) {
        alert('Invoice approved successfully');
        fetchValidationQueue(); // Refresh the list
      } else {
        alert('Failed to approve invoice');
      }
    } catch (error) {
      console.error('Error approving invoice:', error);
      alert('Error approving invoice');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoice.id);
        return newSet;
      });
    }
  };

  // Approve all passed invoices
  const handleApproveAll = async () => {
    const passedInvoices = invoices.filter(inv => inv.validation_status === 'passed');
    if (passedInvoices.length === 0) {
      alert('No passed invoices to approve');
      return;
    }

    if (!confirm(`Approve ${passedInvoices.length} validated invoices?`)) {
      return;
    }

    setRefreshing(true);
    
    try {
      const promises = passedInvoices.map(invoice => 
        fetch(`/api/invoice/${invoice.type}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: invoice.id,
            invoice_status: 'verified'
          })
        })
      );

      await Promise.all(promises);
      alert('All invoices approved successfully');
      fetchValidationQueue();
    } catch (error) {
      console.error('Error approving invoices:', error);
      alert('Error approving some invoices');
    } finally {
      setRefreshing(false);
    }
  };

  // Accept all partial invoices
  const handleAcceptAllPartial = async () => {
    const partialInvoices = invoices.filter(inv => inv.validation_status === 'partial');
    if (partialInvoices.length === 0) {
      alert('No partial invoices to accept');
      return;
    }

    if (!confirm(`Accept ${partialInvoices.length} invoices with warnings?`)) {
      return;
    }

    setRefreshing(true);
    
    try {
      const promises = partialInvoices.map(invoice => 
        fetch(`/api/invoice/${invoice.type}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: invoice.id,
            invoice_status: 'verified'
          })
        })
      );

      await Promise.all(promises);
      alert('All invoices accepted successfully');
      fetchValidationQueue();
    } catch (error) {
      console.error('Error accepting invoices:', error);
      alert('Error accepting some invoices');
    } finally {
      setRefreshing(false);
    }
  };

  const getPriority = (inv: ValidationQueueInvoice): 'High' | 'Medium' | 'Low' => {
    if (inv.errors.length > 3) return 'High';
    if (inv.errors.length > 0) return 'Medium';
    return 'Low';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const failedInvoices = invoices.filter(inv => inv.validation_status === 'failed');
  const partialInvoices = invoices.filter(inv => inv.validation_status === 'partial');
  const passedInvoices = invoices.filter(inv => inv.validation_status === 'passed');

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50 p-8">
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading validation queue...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50 p-8 space-y-6">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Validation Queue</h1>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-xs font-semibold border border-emerald-200">Quality Control</span>
          </div>
          <p className="text-gray-600 text-sm">Review and fix invoice validation issues</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={handleExportIssues}
             className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
           >
             <Download className="h-4 w-4" /> Export Issues
           </button>
           <button 
             onClick={handleRefresh}
             disabled={refreshing}
             className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
           >
             <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Re-validate All
           </button>
        </div>
      </div>

      {/* 2. STATS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setActiveTab('pass')}
          className={`p-4 rounded-xl border transition-all text-left group shadow-sm ${activeTab === 'pass' ? 'bg-emerald-50 border-emerald-200 shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
        >
           <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{summary.passed}</div>
                <div className={`text-xs font-medium ${activeTab === 'pass' ? 'text-emerald-700' : 'text-gray-600'}`}>Passed Invoices</div>
              </div>
              <div className={`p-2 rounded-lg ${activeTab === 'pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                 <CheckCircle2 className="h-5 w-5" />
              </div>
           </div>
           <div className="mt-3 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{width: `${summary.total > 0 ? (summary.passed / summary.total * 100) : 0}%`}}></div>
           </div>
           <p className="text-[10px] text-gray-500 mt-2 group-hover:text-emerald-600 transition-colors">Ready for reconciliation</p>
        </button>

        <button 
          onClick={() => setActiveTab('fail')}
          className={`p-4 rounded-xl border transition-all text-left group shadow-sm ${activeTab === 'fail' ? 'bg-red-50 border-red-200 shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
        >
           <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{summary.failed}</div>
                <div className={`text-xs font-medium ${activeTab === 'fail' ? 'text-red-700' : 'text-gray-600'}`}>Failed Validation</div>
              </div>
              <div className={`p-2 rounded-lg ${activeTab === 'fail' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                 <XCircle className="h-5 w-5" />
              </div>
           </div>
           <div className="mt-3 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500" style={{width: `${summary.total > 0 ? (summary.failed / summary.total * 100) : 0}%`}}></div>
           </div>
           <p className="text-[10px] text-gray-500 mt-2 group-hover:text-red-600 transition-colors">Requires immediate action</p>
        </button>

        <button 
          onClick={() => setActiveTab('partial')}
          className={`p-4 rounded-xl border transition-all text-left group shadow-sm ${activeTab === 'partial' ? 'bg-amber-50 border-amber-200 shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
        >
           <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{summary.partial}</div>
                <div className={`text-xs font-medium ${activeTab === 'partial' ? 'text-amber-700' : 'text-gray-600'}`}>Partial Match</div>
              </div>
              <div className={`p-2 rounded-lg ${activeTab === 'partial' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                 <AlertTriangle className="h-5 w-5" />
              </div>
           </div>
           <div className="mt-3 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{width: `${summary.total > 0 ? (summary.partial / summary.total * 100) : 0}%`}}></div>
           </div>
           <p className="text-[10px] text-gray-500 mt-2 group-hover:text-amber-600 transition-colors">Minor issues detected</p>
        </button>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-2">
         <button 
           onClick={() => setActiveTab('fail')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'fail' ? 'border-red-500 text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
         >
           Failed <span className="bg-red-100 text-red-700 px-1.5 rounded text-xs border border-red-200">{summary.failed}</span>
         </button>
         <button 
           onClick={() => setActiveTab('partial')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'partial' ? 'border-amber-500 text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
         >
           Partial <span className="bg-amber-100 text-amber-700 px-1.5 rounded text-xs border border-amber-200">{summary.partial}</span>
         </button>
         <button 
           onClick={() => setActiveTab('pass')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pass' ? 'border-emerald-500 text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
         >
           Passed <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded text-xs border border-emerald-200">{summary.passed}</span>
         </button>
      </div>

      {/* 4. CONTENT TABLES */}
      <div className="min-h-[400px]">
         
         {/* FAILED TAB */}
         {activeTab === 'fail' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
               {failedInvoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200 shadow-sm">
                     <CheckCircle2 className="h-12 w-12 text-emerald-600 mb-4" />
                     <p className="text-lg font-medium text-gray-900">No failed invoices!</p>
                     <p className="text-sm text-gray-600">All validations are clear.</p>
                  </div>
               ) : (
                 failedInvoices.map((inv) => {
                   const priority = getPriority(inv);
                   return (
                     <div key={inv.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden border-l-4 border-l-red-500">
                      {/* Header Row */}
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleRow(inv.id)}
                      >
                         <div className="flex items-center gap-4">
                            <button className={`p-1 rounded transition-transform duration-200 ${expandedRows.includes(inv.id) ? 'rotate-90 text-gray-900' : 'text-gray-500'}`}>
                               <ChevronRight className="h-5 w-5" />
                            </button>
                            <div>
                               <div className="flex items-center gap-3">
                                  <span className="font-bold text-gray-900">{inv.invoice_number}</span>
                                  <span className="text-xs text-gray-500">{formatDate(inv.invoice_date)}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${inv.type === 'purchase' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                    {inv.type === 'purchase' ? 'Purchase' : 'Sales'}
                                  </span>
                               </div>
                               <p className="text-sm text-gray-700 mt-0.5">{inv.vendor}</p>
                            </div>
                         </div>

                         <div className="flex items-center gap-8">
                            <div className="text-right">
                               <p className="text-sm font-bold text-gray-900">₹{inv.amount.toLocaleString()}</p>
                               <p className="text-[10px] text-gray-500 uppercase">Total Amount</p>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold border border-red-200">{inv.errors.length} Errors</span>
                               <span className={`px-2 py-1 rounded text-xs font-medium border ${priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                                  {priority} Priority
                               </span>
                            </div>
                         </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedRows.includes(inv.id) && (
                         <div className="bg-gray-50 border-t border-gray-200 p-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-4">
                               {inv.errors.map((err, idx) => (
                                  <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-red-50 border border-red-200">
                                     <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                     <div className="flex-1">
                                        <h4 className="text-sm font-bold text-red-900">{err.message}</h4>
                                        {err.expected && (
                                           <div className="mt-2 grid grid-cols-2 gap-4 max-w-md text-sm">
                                              <div className="bg-white p-2 rounded border border-gray-200 shadow-sm">
                                                 <span className="text-gray-600 text-xs uppercase block mb-1">Found</span>
                                                 <span className="text-red-700 font-mono">{err.found}</span>
                                              </div>
                                              <div className="bg-emerald-50 p-2 rounded border border-emerald-200 shadow-sm">
                                                 <span className="text-gray-600 text-xs uppercase block mb-1">Expected</span>
                                                 <span className="text-emerald-700 font-mono">{err.expected}</span>
                                              </div>
                                           </div>
                                        )}
                                        {err.detail && <p className="text-sm text-gray-600 mt-1">{err.detail}</p>}
                                     </div>
                                  </div>
                               ))}
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                               <button 
                                 onClick={() => handleDeleteInvoice(inv)}
                                 disabled={processingIds.has(inv.id)}
                                 className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                               >
                                  <Trash2 className="h-4 w-4" /> Delete
                               </button>
                               <button 
                                 onClick={() => handleEditInvoice(inv)}
                                 className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-lg transition-colors"
                               >
                                  <Wrench className="h-4 w-4" /> Edit Invoice
                               </button>
                            </div>
                         </div>
                        )}
                     </div>
                   );
                 })
               )}
            </div>
         )}

         {/* PARTIAL TAB */}
         {activeTab === 'partial' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="flex justify-end mb-2">
                  <button 
                    onClick={handleAcceptAllPartial}
                    disabled={refreshing}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 disabled:opacity-50"
                  >
                    Accept All Warnings
                  </button>
               </div>
               {partialInvoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200 shadow-sm">
                     <AlertTriangle className="h-12 w-12 text-amber-600 mb-4" />
                     <p className="text-lg font-medium text-gray-900">No partial matches!</p>
                     <p className="text-sm text-gray-600">All invoices are either passed or failed.</p>
                  </div>
               ) : (
                 partialInvoices.map((inv) => (
                   <div key={inv.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden border-l-4 border-l-amber-500">
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleRow(inv.id)}
                      >
                         <div className="flex items-center gap-4">
                            <button className={`p-1 rounded transition-transform duration-200 ${expandedRows.includes(inv.id) ? 'rotate-90 text-gray-900' : 'text-gray-500'}`}>
                               <ChevronRight className="h-5 w-5" />
                            </button>
                            <div>
                               <div className="flex items-center gap-3">
                                  <span className="font-bold text-gray-900">{inv.invoice_number}</span>
                                  <span className="text-xs text-gray-500">{formatDate(inv.invoice_date)}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${inv.type === 'purchase' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                    {inv.type === 'purchase' ? 'Purchase' : 'Sales'}
                                  </span>
                               </div>
                               <p className="text-sm text-gray-700 mt-0.5">{inv.vendor}</p>
                            </div>
                         </div>

                         <div className="flex items-center gap-8">
                            <div className="text-right">
                               <p className="text-sm font-bold text-gray-900">₹{inv.amount.toLocaleString()}</p>
                               <p className="text-[10px] text-gray-500 uppercase">Total Amount</p>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">{inv.warnings.length} Warnings</span>
                            </div>
                         </div>
                      </div>

                      {expandedRows.includes(inv.id) && (
                         <div className="bg-gray-50 border-t border-gray-200 p-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-4">
                               {inv.warnings.map((warn, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                                     <div className="flex items-center gap-3">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                        <div>
                                           <h4 className="text-sm font-medium text-amber-900">{warn.message}</h4>
                                           <p className="text-xs text-gray-600">Impact: {warn.impact}</p>
                                        </div>
                                     </div>
                                  </div>
                               ))}
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                               <button 
                                 onClick={() => handleEditInvoice(inv)}
                                 className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors flex items-center gap-2"
                               >
                                  <Wrench className="h-4 w-4" /> Edit Invoice
                               </button>
                               <button 
                                 onClick={() => handleApproveInvoice(inv)}
                                 disabled={processingIds.has(inv.id)}
                                 className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-700 hover:to-teal-700 shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                               >
                                  <CheckCircle2 className="h-4 w-4" /> Accept & Approve
                               </button>
                            </div>
                         </div>
                      )}
                   </div>
               ))
               )}
            </div>
         )}

         {/* PASS TAB */}
         {activeTab === 'pass' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="flex justify-end mb-2">
                  <button 
                    onClick={handleApproveAll}
                    disabled={refreshing}
                    className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 font-medium bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200 shadow-sm disabled:opacity-50"
                  >
                     <CheckCircle2 className="h-4 w-4" /> Approve All Validated
                  </button>
               </div>
               <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
                        <tr>
                           <th className="px-6 py-3">Invoice No</th>
                           <th className="px-6 py-3">Date</th>
                           <th className="px-6 py-3">Vendor</th>
                           <th className="px-6 py-3 text-right">Amount</th>
                           <th className="px-6 py-3 text-center">Validation</th>
                           <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200">
                        {passedInvoices.length === 0 ? (
                           <tr>
                              <td colSpan={6} className="px-6 py-12 text-center">
                                 <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                 <p className="text-gray-600">No passed invoices yet</p>
                              </td>
                           </tr>
                        ) : (
                           passedInvoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                 <td className="px-6 py-4 font-medium text-gray-900">{inv.invoice_number}</td>
                                 <td className="px-6 py-4 text-gray-600">{formatDate(inv.invoice_date)}</td>
                                 <td className="px-6 py-4">
                                    <div className="text-gray-900">{inv.vendor}</div>
                                    <div className="text-xs text-gray-500">{inv.gstin}</div>
                                 </td>
                                 <td className="px-6 py-4 text-right font-mono text-gray-900">₹{inv.amount.toLocaleString()}</td>
                                 <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                       <span className="text-xs text-emerald-700 flex items-center gap-1">
                                          <CheckCircle2 className="h-3 w-3" /> Passed
                                       </span>
                                       <span className={`px-2 py-1 rounded text-xs font-medium ${inv.type === 'purchase' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                          {inv.type === 'purchase' ? 'Purchase' : 'Sales'}
                                       </span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <button 
                                       onClick={() => router.push(`/dashboard/sme/invoices/${inv.type}?id=${inv.id}`)}
                                       className="text-gray-600 hover:text-gray-900 flex items-center gap-1 ml-auto text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-100"
                                    >
                                       View <ExternalLink className="h-3 w-3" />
                                    </button>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

      </div>
    </div>
  );
}
