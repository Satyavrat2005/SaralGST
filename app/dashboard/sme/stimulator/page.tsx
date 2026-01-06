'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  MessageSquare, 
  Mail, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  Download,
  Zap,
  ShieldCheck,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Calendar,
  Check,
  X,
  Eye,
  FileCheck,
  Search,
  Filter,
  MoreVertical,
  Database,
  ArrowRight,
  Plus,
  Send,
  CreditCard,
  Clock,
  FileDown,
  Share2,
  PieChart as PieIcon,
  BarChart as BarChartIcon,
  Info
} from 'lucide-react';
import { getGSTR1BUrl, downloadFileFromUrl, getReconciliationData, getGSTR3BData, getPDFInvoices } from '../../../../lib/supabase';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

// --- TYPES ---
type SimulatorStep = 1 | 2 | 3 | 4 | 5 | 6;
type RecoState = 'idle' | 'running' | 'completed';

// --- STEPPER COMPONENT ---
const Stepper = ({ currentStep, steps }: { currentStep: number, steps: string[] }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full -z-10"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-600 to-teal-600 transition-all duration-500 -z-10"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white
                  ${isActive ? 'border-emerald-600 text-emerald-600 shadow-lg shadow-emerald-200 scale-110' : 
                    isCompleted ? 'border-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 text-white' : 'border-gray-300 text-gray-500'}
                `}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <span className="text-sm font-bold">{stepNum}</span>}
              </div>
              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-gray-900' : isCompleted ? 'text-gray-700' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- SCREEN 1: CAPTURED INVOICES ---
const CapturedInvoices = ({ onNext }: { onNext: () => void }) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'manual'>('whatsapp');
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/invoice/purchase');
        const data = await response.json();
        if (data.success && data.invoices) {
          setInvoices(data.invoices);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }
      setLoading(false);
    };

    fetchInvoices();
  }, []);

  const handleSimulateProcess = () => {
    setProcessing(true);
    let count = 0;
    const interval = setInterval(() => {
      count += 20;
      setProcessedCount(count);
      if (count >= 100) {
        clearInterval(interval);
        setProcessing(false);
      }
    }, 300);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Captured Invoices</h2>
          <p className="text-gray-600 text-sm">View and validate invoices automatically captured from multiple sources</p>
        </div>
        <div className="flex gap-2">
           <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 shadow-sm">View All Invoices</button>
           <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm"><Settings className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
           {[
             { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, count: invoices.length },
             // { id: 'email', label: 'Email', icon: Mail, count: 12 },
             // { id: 'manual', label: 'Manual Upload', icon: UploadCloud, count: 0 },
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all shadow-sm
                 ${activeTab === tab.id ? 'bg-emerald-50 border-emerald-200 text-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
               `}
             >
               <div className="flex items-center gap-3">
                 <tab.icon className="h-4 w-4" />
                 {tab.label}
               </div>
               <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">{tab.count}</span>
             </button>
           ))}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
           <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                 {activeTab === 'whatsapp' && <MessageSquare className="h-4 w-4 text-emerald-600" />}
                 {activeTab === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
                 {activeTab === 'manual' && <UploadCloud className="h-4 w-4 text-amber-600" />}
                 Incoming Stream
              </h3>
              {processing ? (
                 <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <Loader2 className="h-3 w-3 animate-spin" /> Processing... {processedCount}%
                 </div>
              ) : (
                 <button onClick={handleSimulateProcess} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Re-run Validation</button>
              )}
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px]">
              {loading ? (
                 <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    <span className="ml-2 text-sm text-gray-600">Loading invoices...</span>
                 </div>
              ) : invoices.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">No invoices found</p>
                 </div>
              ) : (
                 invoices.map((invoice, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-500">
                             <FileText className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="text-sm font-medium text-gray-900">{invoice.invoice_number || 'No Invoice #'}</p>
                             <p className="text-xs text-gray-600">{invoice.supplier_name || 'Unknown Supplier'}</p>
                             <p className="text-xs text-gray-500 mt-0.5">₹{invoice.total_invoice_value?.toLocaleString() || '0'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className={`text-xs px-2 py-1 rounded border ${
                             invoice.invoice_status === 'extracted' || invoice.invoice_status === 'verified'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : invoice.invoice_status === 'pending' || invoice.invoice_status === 'needs_review'
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                          }`}>
                             {invoice.invoice_status === 'extracted' ? 'Validated' :
                              invoice.invoice_status === 'pending' || invoice.invoice_status === 'needs_review' ? 'Partial' :
                              invoice.invoice_status === 'verified' ? 'Verified' : 'Error'}
                          </span>
                          {invoice.invoice_bucket_url && (
                             <a 
                                href={invoice.invoice_bucket_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors opacity-0 group-hover:opacity-100"
                                title="View PDF"
                             >
                                <Eye className="h-4 w-4" />
                             </a>
                          )}
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- SCREEN 2: REGISTERS & GSTR-1B DRAFT ---
const RegistersAndDraft = ({ onNext }: { onNext: () => void }) => {
  const [activeRegister, setActiveRegister] = useState<'purchase' | 'sales'>('purchase');
  const [generating, setGenerating] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [simulationStep, setSimulationStep] = useState('');
  const [downloading, setDownloading] = useState(false);

  const salesData = [
    { date: '01-Mar-25', customer: 'UTTAM METAL, BHAYANDAR', id: 'DK-24-25/453', gstin: '27ADIPN1622J1ZJ', quantity: '782.200 KGS', rate: '70.00/KGS', taxable: 54754, gst: 10404, total: 65158 },
    { date: '01-Mar-25', customer: 'KAILASH STEEL INDUSTRIES, NALASOPARA', id: 'DK-24-25/454', gstin: '27AABPJ5047R1Z9', quantity: '2201.600 KGS', rate: '207.00/KGS', taxable: 455731.2, gst: 48687.8, total: 510419 },
    { date: '01-Mar-25', customer: 'DURGA STEEL, FORBISHGANJ', id: 'DK-24-25/455', gstin: '10AHSPB8092L1Z2', quantity: '79.700 KGS', rate: '235.00/KGS', taxable: 18729.5, gst: 2247.5, total: 20977 },
    { date: '01-Mar-25', customer: 'SARAF STAINLESS STEEL INDUSTRY, SILIGURI', id: 'DK-24-25/456', gstin: '19AAVFS8033Q1Z0', quantity: '221.500 KGS', rate: '190.00/KGS', taxable: 42085, gst: 5050, total: 47135 },
    { date: '01-Mar-25', customer: 'KAILASH STEEL INDUSTRIES, NALASOPARA', id: 'DK-24-25/457', gstin: '27AABPJ5047R1Z9', quantity: '2107.600 KGS', rate: '208.00/KGS', taxable: 438380.8, gst: 51506.2, total: 489887 },
    { date: '03-Mar-25', customer: 'DURGA STEEL, FORBISHGANJ', id: 'DK-24-25/458', gstin: '10AHSPB8092L1Z2', quantity: '157.860 KGS', rate: '205.00/KGS', taxable: 32361.3, gst: 3883.7, total: 36245 },
    { date: '04-Mar-25', customer: 'DURGA STEEL, FORBISHGANJ', id: 'DK-24-25/459', gstin: '10AHSPB8092L1Z2', quantity: '152.550 KGS', rate: '205.00/KGS', taxable: 31272.75, gst: 2752.25, total: 35025 },
    { date: '04-Mar-25', customer: 'KAILASH STEEL INDUSTRIES, NALASOPARA', id: 'DK-24-25/460', gstin: '27AABPJ5047R1Z9', quantity: '2207.600 KGS', rate: '208.00/KGS', taxable: 459180.8, gst: 55102.2, total: 514283 },
    { date: '05-Mar-25', customer: 'KAILASH STEEL INDUSTRIES, NALASOPARA', id: 'DK-24-25/461', gstin: '27AABPJ5047R1Z9', quantity: '2141.300 KGS', rate: '207.00/KGS', taxable: 443249.1, gst: 53189.9, total: 496439 },
    { date: '05-Mar-25', customer: 'SARAF STAINLESS STEEL INDUSTRY, SILIGURI', id: 'DK-24-25/462', gstin: '19AAVFS8033Q1Z0', quantity: '147.600 KGS', rate: '195.00/KGS', taxable: 28782, gst: 3454, total: 32236 },
    { date: '06-Mar-25', customer: 'KAILASH STEEL INDUSTRIES, NALASOPARA', id: 'DK-24-25/463', gstin: '27AABPJ5047R1Z9', quantity: '2077.800 KGS', rate: '208.00/KGS', taxable: 432182.4, gst: 51861.6, total: 484044 },
    { date: '07-Mar-25', customer: 'UTTAM METAL, BHAYANDAR', id: 'DK-24-25/464', gstin: '27ADIPN1622J1ZJ', quantity: '2480.700 KGS', rate: '70.00/KGS', taxable: 173649, gst: 20193, total: 208642 },
    { date: '08-Mar-25', customer: 'KAILASH STEEL INDUSTRIES, NALASOPARA', id: 'DK-24-25/465', gstin: '27AABPJ5047R1Z9', quantity: '2301.200 KGS', rate: '208.00/KGS', taxable: 478649.6, gst: 57438.4, total: 536088 },
    { date: '08-Mar-25', customer: 'SARAF STAINLESS STEEL INDUSTRY, SILIGURI', id: 'DK-24-25/466', gstin: '19AAVFS8033Q1Z0', quantity: '254.200 KGS', rate: '205.00/KGS', taxable: 52111, gst: 6253, total: 58364 },
    { date: '10-Mar-25', customer: 'DURGA STEEL HOUSE, ASANSOLE', id: 'DK-24-25/467', gstin: '19ACLPA9072D2ZK', quantity: '133.400 KGS', rate: '180.00/KGS', taxable: 24012, gst: 2871, total: 26883 },
    { date: '10-Mar-25', customer: 'KAILASH STEEL INDUSTRIES, NALASOPARA', id: 'DK-24-25/468', gstin: '27AABPJ5047R1Z9', quantity: '1700.000 KGS', rate: '207.00/KGS', taxable: 351900, gst: 42228, total: 394128 },
    { date: '13-Mar-25', customer: 'KAILASH STEEL INDUSTRIES, NALASOPARA', id: 'DK-24-25/469', gstin: '27AABPJ5047R1Z9', quantity: '2201.600 KGS', rate: '208.00/KGS', taxable: 457932.8, gst: 54952.2, total: 512885 },
    { date: '13-Mar-25', customer: 'SHREE KRISHNA TRADING, VASAI', id: 'DK-24-25/470', gstin: '27A2TFG7950L1ZE', quantity: '1522.500 KGS', rate: '69.00/KGS', taxable: 105052.5, gst: 19960.5, total: 125013 },
    { date: '15-Mar-25', customer: 'KAILASH STEEL INDUSTRIES, NALASOPARA', id: 'DK-24-25/471', gstin: '27AABPJ5047R1Z9', quantity: '2209.600 KGS', rate: '208.00/KGS', taxable: 459596.8, gst: 55151.2, total: 514748 },
    { date: '17-Mar-25', customer: 'KAILASH STEEL INDUSTRIES, NALASOPARA', id: 'DK-24-25/472', gstin: '27AABPJ5047R1Z9', quantity: '2107.000 KGS', rate: '207.00/KGS', taxable: 436149, gst: 52338, total: 488487 },
    { date: '19-Mar-25', customer: 'UTTAM METAL, BHAYANDAR', id: 'DK-24-25/473', gstin: '27ADIPN1622J1ZJ', quantity: '3072.500 KGS', rate: '70.00/KGS', taxable: 215075, gst: 40865, total: 255940 },
  ];

  const purchaseData = [
    { date: 'Mar 24', vendor: 'AMI METAL PRESSING WORKS, VASAI', invoice: '16', gstin: '27ABCPD2179C1Z4', quantity: '-', rate: '-', taxable: 51249, gst: 2745.50, total: 45758, gstRate: '12.00' },
    { date: 'Mar 24', vendor: 'ZAHUR BUFF POLISHING WORKS, PALGHAR', invoice: '24-25/038', gstin: '27AFSPA2776C1ZG', quantity: '-', rate: '-', taxable: 33831, gst: 1812.36, total: 30206, gstRate: '12.00' },
    { date: 'Mar 24', vendor: 'ZAHUR BUFF POLISHING WORKS, PALGHAR', invoice: '24-25/039', gstin: '27AFSPA2776C1ZG', quantity: '-', rate: '-', taxable: 26322, gst: 1410.13, total: 23502.20, gstRate: '12.00' },
    { date: 'Mar 24', vendor: 'JDBS TRANSPORT, ODHAV', invoice: '3484', gstin: '24FMTPD4290R1ZQ', quantity: '-', rate: '-', taxable: 5400, gst: 0, total: 5400, gstRate: '-' },
    { date: 'Mar 24', vendor: 'DEVILAL NATHULAL JAIN (RENT A/C.)', invoice: 'DNJRENT/24-25/43', gstin: '27AAPJ5047R1Z9', quantity: '4,24,800.00', rate: '-', taxable: 424800, gst: 32400, total: 360000, gstRate: '18.00' },
    { date: 'Mar 24', vendor: 'EFFICACIOUS ADVISORS PRIVATE LIMITED, VASAI', invoice: '2024-2025/2620', gstin: '27AAGCE1884K1Z9', quantity: '-', rate: '-', taxable: 3894, gst: 297, total: 3300, gstRate: '18.00' },
    { date: 'Mar 24', vendor: 'J. B. CIRCLE CUTTING, VASAI (CRS.)', invoice: 'JBCC/24-25/286', gstin: '27AKWPD8964G1ZG', quantity: '-', rate: '-', taxable: 21266, gst: 1139.26, total: 18987.60, gstRate: '12.00' },
    { date: 'Mar 24', vendor: 'JEEVDANI ENTERPRISES, NALASOPARA', invoice: '839', gstin: '27AADPS0964L1ZA', quantity: '-', rate: '-', taxable: 26889, gst: 1440.49, total: 24008.10, gstRate: '12.00' },
    { date: 'Mar 24', vendor: 'JEEVDANI ENTERPRISES, NALASOPARA', invoice: '842', gstin: '27AADPS0964L1ZA', quantity: '-', rate: '-', taxable: 23890, gst: 1279.80, total: 21330, gstRate: '12.00' },
    { date: 'Mar 24', vendor: 'KALAM BUFFING WORKS, NALASOPARA', invoice: '105/24-25', gstin: '27AAKPG2175L1Z6', quantity: '-', rate: '-', taxable: 33920, gst: 1817.16, total: 30286, gstRate: '12.00' },
    { date: 'Mar 24', vendor: 'KALAM BUFFING WORKS, NALASOPARA', invoice: '106/24-25', gstin: '27AAKPG2175L1Z6', quantity: '-', rate: '-', taxable: 33407, gst: 1789.88, total: 29828, gstRate: '12.00' },
    { date: 'Mar 24', vendor: 'KHODIYAR CHEMICAL, NALASOPARA', invoice: 'KC/3555/2024-25', gstin: '27AIGPD2407C1ZY', quantity: '-', rate: '-', taxable: 11045, gst: 842.60, total: 9360, gstRate: '18.00' },
    { date: 'Mar 24', vendor: 'RUDRAA INDUSTRIES, ODHAV', invoice: '1026-24-25', gstin: '24AACPD1667N1ZQ', quantity: '2008.720 KGS', rate: '120.00/KGS', taxable: 284435, gst: 0, total: 241046.40, gstRate: '18.00' },
    { date: 'Mar 24', vendor: 'SHREENATH INDUSTRIES, NALASOPARA', invoice: '262/2024-25', gstin: '27BLQPS4511L1ZI', quantity: '-', rate: '-', taxable: 18184, gst: 974, total: 16236, gstRate: '12.00' },
    { date: 'Mar 24', vendor: 'SUNCITY METALS AND TUBES PRIVATE LIMITED, BHAYANDAR', invoice: 'SMTLMU/24-25/1333', gstin: '27AAHCS3761Q1ZM', quantity: '3059.940 KGS', rate: '175.00/KGS', taxable: 640138, gst: 48824.06, total: 542489.50, gstRate: '18.00' },
    { date: 'Mar 24', vendor: 'SUNCITY METALS AND TUBES PRIVATE LIMITED, BHAYANDAR', invoice: 'SMTLMU/24-25/1340', gstin: '27AAHCS3761Q1ZM', quantity: '1002.480 KGS', rate: '175.00/KGS', taxable: 207012, gst: 15789.06, total: 175434, gstRate: '18.00' },
    { date: 'Mar 24', vendor: 'SUNCITY METALS AND TUBES PRIVATE LIMITED, BHAYANDAR', invoice: 'SMTLMU/24-25/1364', gstin: '27AAHCS3761Q1ZM', quantity: '1502.760 KGS', rate: '175.00/KGS', taxable: 310319, gst: 23668, total: 262983, gstRate: '18.00' },
    { date: 'Mar 24', vendor: 'TOP10 RETAILS PRIVATE LIMITED, GOREGOAN', invoice: 'T21W01/2425/16695', gstin: '27AAJCT6076D1Z4', quantity: '-', rate: '-', taxable: 102900, gst: 8992.37, total: 84915.25, gstRate: '21.18' },
    { date: 'Mar 24', vendor: 'ASHOK BUFFING WORKS, BHAYANDAR', invoice: '142/24-25', gstin: '-', quantity: '-', rate: '-', taxable: 4513, gst: 0, total: 4513, gstRate: '-' },
    { date: 'Mar 24', vendor: 'ASHOK BUFFING WORKS, BHAYANDAR', invoice: '143/24-25', gstin: '-', quantity: '-', rate: '-', taxable: 4506, gst: 0, total: 4506, gstRate: '-' },
  ];

  const handleGenerate = () => {
    setGenerating(true);
    setGenProgress(0);
    setSimulationStep('Validating Sales Register...');
    
    const steps = [
      { prog: 20, msg: 'Validating Sales Register...' },
      { prog: 45, msg: 'Computing HSN Summary...' },
      { prog: 70, msg: 'Calculating Tax Liability...' },
      { prog: 90, msg: 'Drafting GSTR-1B...' },
      { prog: 100, msg: 'Finalizing...' }
    ];

    let stepIdx = 0;
    
    const interval = setInterval(() => {
      setGenProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setGenerating(false);
          setShowDraftModal(true);
          return 100;
        }
        
        // Update message based on progress
        if (stepIdx < steps.length && prev >= steps[stepIdx].prog) {
           setSimulationStep(steps[stepIdx].msg);
           stepIdx++;
        }
        
        return prev + 2; 
      });
    }, 40);
  };

  const handleProceed = () => {
    setShowDraftModal(false);
    onNext();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Direct PDF path
      const pdfPath = '/GSTR-1B_Draft.pdf';
      
      // Open PDF in a new tab
      window.open(pdfPath, '_blank');
      
      // Wait for 2 seconds (loading time) then trigger download
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = pdfPath;
        link.download = 'GSTR-1B_Draft.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 2000); // 2 second delay for loading
      
    } catch (error) {
      console.error('Failed to open PDF:', error);
      alert('Failed to open PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registers & GSTR-1B</h2>
          <p className="text-gray-600 text-sm">Review your registers and generate the return draft</p>
        </div>
        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2 shadow-sm">
           <Plus className="h-4 w-4" /> Add Invoice Manual
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Registers View */}
         <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-[550px] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex gap-4">
               <button 
                  onClick={() => setActiveRegister('purchase')}
                  className={`text-sm font-medium pb-4 -mb-4 px-2 transition-colors border-b-2 ${activeRegister === 'purchase' ? 'text-gray-900 border-emerald-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
               >
                  Purchase Register
               </button>
               <button 
                  onClick={() => setActiveRegister('sales')}
                  className={`text-sm font-medium pb-4 -mb-4 px-2 transition-colors border-b-2 ${activeRegister === 'sales' ? 'text-gray-900 border-emerald-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
               >
                  Sales Register
               </button>
            </div>
            <div className="p-3 border-b border-gray-200 flex gap-2 bg-gray-50">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type="text" placeholder={`Search ${activeRegister}...`} className="w-full bg-white rounded-lg pl-9 py-1.5 text-sm border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
               </div>
               <button className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-100"><Filter className="h-4 w-4 text-gray-600" /></button>
            </div>
            <div className="flex-1 overflow-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700 font-medium sticky top-0">
                     <tr>
                        <th className="p-3 pl-4">Date</th>
                        <th className="p-3">{activeRegister === 'purchase' ? 'Vendor / GSTIN' : 'Customer / Invoice'}</th>
                        {activeRegister === 'sales' && (
                           <>
                              <th className="p-3 text-right">Quantity</th>
                              <th className="p-3 text-right">Rate</th>
                           </>
                        )}
                        <th className="p-3 text-right">Taxable</th>
                        <th className="p-3 text-right">GST</th>
                        <th className="p-3 text-right">Total</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                     {activeRegister === 'purchase' ? (
                        purchaseData.map((item, i) => (
                           <tr key={`purch-${i}`} className="hover:bg-gray-50">
                              <td className="p-3 pl-4 text-gray-600 text-xs">{item.date}</td>
                              <td className="p-3">
                                 <div className="text-gray-900 font-medium text-xs">{item.vendor}</div>
                                 <div className="text-[10px] text-gray-600">{item.invoice}</div>
                                 <div className="text-[9px] text-gray-500">{item.gstin}</div>
                              </td>
                              <td className="p-3 text-right text-gray-700 font-mono text-xs">₹{item.taxable.toLocaleString()}</td>
                              <td className="p-3 text-right text-gray-700 font-mono text-xs">₹{item.gst.toLocaleString()}</td>
                              <td className="p-3 text-right text-gray-900 font-bold font-mono text-xs">₹{item.total.toLocaleString()}</td>
                           </tr>
                        ))
                     ) : (
                        salesData.map((item, i) => (
                           <tr key={`sales-${i}`} className="hover:bg-gray-50">
                              <td className="p-3 pl-4 text-gray-600 text-xs">{item.date}</td>
                              <td className="p-3">
                                 <div className="text-gray-900 font-medium text-xs">{item.customer}</div>
                                 <div className="text-[10px] text-gray-600">{item.id}</div>
                                 <div className="text-[9px] text-gray-500">{item.gstin}</div>
                              </td>
                              <td className="p-3 text-right text-gray-600 font-mono text-xs">{item.quantity}</td>
                              <td className="p-3 text-right text-gray-600 font-mono text-xs">{item.rate}</td>
                              <td className="p-3 text-right text-gray-700 font-mono text-xs">₹{item.taxable.toLocaleString()}</td>
                              <td className="p-3 text-right text-gray-700 font-mono text-xs">₹{item.gst.toLocaleString()}</td>
                              <td className="p-3 text-right text-gray-900 font-bold font-mono text-xs">₹{item.total.toLocaleString()}</td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Draft Panel */}
         <div className="flex flex-col gap-6 h-[550px]">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1 flex flex-col">
               <div className="flex items-center gap-2 mb-6">
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-gray-900">GSTR-1B Draft Summary</h3>
               </div>
               <div className="space-y-4 flex-1">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600 uppercase font-medium">Total Sales Invoices</span>
                        <FileText className="h-4 w-4 text-emerald-600" />
                     </div>
                     <p className="text-2xl font-bold text-gray-900">28</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600 uppercase font-medium">Taxable Value</span>
                        <span className="text-gray-600 text-xs">INR</span>
                     </div>
                     <p className="text-2xl font-bold text-gray-900">₹ 45.82 L</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-amber-700 uppercase font-medium">Liability</span>
                        <span className="text-amber-700 text-xs">INR</span>
                     </div>
                     <p className="text-2xl font-bold text-amber-700">₹ 8.25 L</p>
                  </div>
               </div>

               <div className="mt-auto pt-4 border-t border-gray-200">
                  {generating ? (
                     <div className="space-y-3">
                        <div className="flex justify-between text-xs text-gray-700 font-medium">
                           <span>{simulationStep}</span>
                           <span>{genProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                           <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 transition-all duration-100" style={{ width: `${genProgress}%` }}></div>
                        </div>
                     </div>
                  ) : (
                     <button 
                        onClick={handleGenerate}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                     >
                        <Zap className="h-4 w-4" /> Generate GSTR-1B
                     </button>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* GSTR-1B DRAFT MODAL */}
      {showDraftModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-zinc-950 border border-white/10 w-full max-w-4xl rounded-2xl flex flex-col overflow-hidden shadow-2xl max-h-[90vh]">
               {/* Modal Header */}
               <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-zinc-900">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <FileCheck className="h-6 w-6 text-white" />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-white">GSTR-1B Draft Ready</h2>
                        <p className="text-xs text-zinc-400 flex items-center gap-1">
                           <Calendar className="h-3 w-3" /> Period: November 2025
                        </p>
                     </div>
                  </div>
                  <button onClick={() => setShowDraftModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto bg-zinc-950/50 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     {/* Left: Key Stats & Liability */}
                     <div className="lg:col-span-2 space-y-6">
                        {/* Total Liability Card */}
                        <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-white/10 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
                           <p className="text-sm text-zinc-400 uppercase tracking-wider font-semibold">Total Tax Liability</p>
                           <h3 className="text-4xl font-bold text-white mt-2">₹ 12,22,101</h3>
                           
                           {/* Segmented Tax Bar */}
                           <div className="mt-6 space-y-2">
                              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                                 <span>Tax Distribution</span>
                                 <span>100%</span>
                              </div>
                              <div className="flex h-3 w-full rounded-full overflow-hidden bg-zinc-800">
                                 <div className="h-full bg-blue-500" style={{ width: '15%' }} title="IGST"></div>
                                 <div className="h-full bg-emerald-500" style={{ width: '42.5%' }} title="CGST"></div>
                                 <div className="h-full bg-emerald-400" style={{ width: '42.5%' }} title="SGST"></div>
                              </div>
                              <div className="flex gap-4 text-xs mt-2">
                                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> IGST: ₹1.83L</div>
                                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> CGST: ₹5.19L</div>
                                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> SGST: ₹5.19L</div>
                              </div>
                           </div>
                        </div>

                        {/* Category Breakdown Table */}
                        <div className="rounded-xl border border-white/10 overflow-hidden">
                           <div className="bg-zinc-900/50 px-4 py-2 border-b border-white/5">
                              <h4 className="text-sm font-bold text-white">Category Breakdown</h4>
                           </div>
                           <table className="w-full text-left text-xs">
                              <thead className="bg-white/5 text-zinc-500 font-medium">
                                 <tr>
                                    <th className="px-4 py-2">Category</th>
                                    <th className="px-4 py-2 text-right">Count</th>
                                    <th className="px-4 py-2 text-right">Taxable Value</th>
                                    <th className="px-4 py-2 text-right">Tax Liability</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 bg-zinc-900/20">
                                 <tr>
                                    <td className="px-4 py-3 text-white">B2B Invoices</td>
                                    <td className="px-4 py-3 text-right text-zinc-300">380</td>
                                    <td className="px-4 py-3 text-right text-zinc-300">₹45.67 L</td>
                                    <td className="px-4 py-3 text-right font-mono text-white">₹8.22 L</td>
                                 </tr>
                                 <tr>
                                    <td className="px-4 py-3 text-white">B2C Large</td>
                                    <td className="px-4 py-3 text-right text-zinc-300">10</td>
                                    <td className="px-4 py-3 text-right text-zinc-300">₹12.34 L</td>
                                    <td className="px-4 py-3 text-right font-mono text-white">₹2.22 L</td>
                                 </tr>
                                 <tr>
                                    <td className="px-4 py-3 text-white">Exports</td>
                                    <td className="px-4 py-3 text-right text-zinc-300">10</td>
                                    <td className="px-4 py-3 text-right text-zinc-300">₹5.00 L</td>
                                    <td className="px-4 py-3 text-right font-mono text-white">₹0.90 L</td>
                                 </tr>
                                 <tr>
                                    <td className="px-4 py-3 text-white">B2C Small</td>
                                    <td className="px-4 py-3 text-right text-zinc-300">24</td>
                                    <td className="px-4 py-3 text-right text-zinc-300">₹4.88 L</td>
                                    <td className="px-4 py-3 text-right font-mono text-white">₹0.88 L</td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>
                     </div>

                     {/* Right: Validation & Insights */}
                     <div className="space-y-6">
                        {/* Validation Checklist */}
                        <div className="p-5 rounded-xl bg-zinc-900/50 border border-white/10">
                           <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Validation Intelligence</h4>
                           <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                 <span className="text-zinc-300">GSTIN Validation</span>
                                 <span className="flex items-center gap-1 text-emerald-500 font-medium"><Check className="h-3 w-3" /> Passed</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                 <span className="text-zinc-300">HSN Summary Check</span>
                                 <span className="flex items-center gap-1 text-emerald-500 font-medium"><Check className="h-3 w-3" /> Passed</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                 <span className="text-zinc-300">Rate Sanity Check</span>
                                 <span className="flex items-center gap-1 text-emerald-500 font-medium"><Check className="h-3 w-3" /> Passed</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                 <span className="text-zinc-300">Place of Supply</span>
                                 <span className="flex items-center gap-1 text-emerald-500 font-medium"><Check className="h-3 w-3" /> Passed</span>
                              </div>
                           </div>
                        </div>

                        {/* AI Insight */}
                        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                           <div className="flex items-start gap-3">
                              <Zap className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                              <div>
                                 <h4 className="text-sm font-bold text-indigo-300">Smart Insight</h4>
                                 <p className="text-xs text-indigo-200/70 mt-1 leading-relaxed">
                                    Liability is <span className="text-white font-bold">12% higher</span> than last month's average. This aligns with the seasonal sales trend detected.
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* Actions Preview */}
                        <div className="pt-4">
                           <button 
                              onClick={handleDownload}
                              disabled={downloading}
                              className="w-full py-2.5 mb-3 rounded-lg border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2 group"
                           >
                              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />}
                              {downloading ? 'Downloading...' : 'Download Draft PDF'}
                           </button>
                           <p className="text-[10px] text-center text-zinc-600">JSON format also available in settings</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Footer */}
               <div className="p-5 border-t border-white/5 bg-zinc-900 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                     <Info className="h-4 w-4" />
                     <span>Please review closely before proceeding.</span>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={() => setShowDraftModal(false)} className="px-5 py-2.5 rounded-lg border border-white/10 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">Close</button>
                     <button 
                        onClick={handleProceed} 
                        className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:gap-3"
                     >
                        Approve & Proceed <ArrowRight className="h-4 w-4" />
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

// --- SCREEN 3: UPLOAD GSTR-2B ---
const UploadGSTR2B = ({ onNext }: { onNext: () => void }) => {
  const [uploadComplete, setUploadComplete] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setUploadComplete(true);
      // Reset the input value
      e.target.value = '';
    }
  };

  const triggerFileInput = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setUploadComplete(false);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GSTR-2B Upload</h2>
          <p className="text-gray-600 text-sm">Upload your GSTR-2B Excel file to continue</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {!uploadComplete ? (
            <div className="text-center space-y-6">
              <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <UploadCloud className="h-12 w-12 text-gray-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Upload GSTR-2B File</h3>
                <p className="text-gray-600 text-sm">Select an Excel file from your device</p>
              </div>
              <button
                onClick={triggerFileInput}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 mx-auto shadow-lg"
              >
                <UploadCloud className="h-5 w-5" /> Choose File
              </button>
              <div className="flex gap-2 justify-center">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">.xlsx</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">.xls</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">.csv</span>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Upload Successful!</h3>
                <p className="text-emerald-600 mt-2">{fileName}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Upload Another
                </button>
                <button
                  onClick={onNext}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                >
                  Continue <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- SCREEN 4: RECONCILIATION ENGINE (CORE) ---
const ReconciliationEngine = () => {
  const [state, setState] = useState<RecoState>('idle');
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState(0);
  const [reconData, setReconData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('summary');

  const tasks = [
    'Fetching Purchase Register data...',
    'Parsing GSTR-2B JSON...',
    'Running Exact Match Algorithm...',
    'Executing Fuzzy Logic on Dates/Amounts...',
    'Identifying Discrepancies...',
    'Generating Final Report...'
  ];

  const handleRun = async () => {
    setState('running');
    setProgress(0);
    setCurrentTask(0);
    setLoading(true);
    
    // Smooth progress over 15 seconds total (15000ms / 100 steps = 150ms per 1%)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const taskIndex = Math.min(Math.floor((prev / 100) * tasks.length), tasks.length - 1);
        setCurrentTask(taskIndex);
        return prev + 1;
      });
    }, 150);

    // Wait for progress animation to complete (15 seconds), then display static data
    setTimeout(() => {
      try {
        // Static reconciliation data
        const staticReconData = {
          metadata: {
            business_name: "DEV KAILASH STEEL",
            period: "March 2025",
            duration_seconds: 14.8
          },
          summary: {
            matched_count: 38,
            match_percentage: 90.48,
            discrepancies: {
              total: 6,
              missing_in_books: 1,
              missing_in_gstr2b: 3,
              value_mismatches: 2
            },
            itc_secured: 524205.50,
            itc: {
              at_risk: 65502.50,
              risk_percentage: 11.11
            },
            invoices: {
              in_books: 42,
              in_gstr2b: 39,
              unique: 44
            }
          },
          matched_invoices: [
            {
              invoice_no: "2024-25/2620",
              date: "2025-03-15",
              vendor: "EFFICACIOUS ADVISORS PVT LTD",
              gstin: "27AAGCE5803D1ZV",
              taxable_value: 3300.00,
              total_tax: 594.00,
              itc_eligible: 594.00,
              match_type: "Exact",
              status: "Matched",
              remark: "Fully Reconciled"
            },
            {
              invoice_no: "15",
              date: "2025-03-18",
              vendor: "AMI METAL PRESSING WORKS",
              gstin: "27ABCPD2938K1ZM",
              taxable_value: 45758.00,
              total_tax: 8236.44,
              itc_eligible: 8236.44,
              match_type: "Exact",
              status: "Matched",
              remark: "Fully Reconciled"
            },
            {
              invoice_no: "INV/2025/1845",
              date: "2025-03-05",
              vendor: "STEEL TRADERS INDIA",
              gstin: "27AACCS2781M1ZL",
              taxable_value: 125000.00,
              total_tax: 22500.00,
              itc_eligible: 22500.00,
              match_type: "Exact",
              status: "Matched",
              remark: "Fully Reconciled"
            },
            {
              invoice_no: "RAW/MAR/089",
              date: "2025-03-12",
              vendor: "MUMBAI METALS LTD",
              gstin: "27AABCU9603R1ZV",
              taxable_value: 89450.00,
              total_tax: 16101.00,
              itc_eligible: 16101.00,
              match_type: "Exact",
              status: "Matched",
              remark: "Fully Reconciled"
            },
            {
              invoice_no: "SER/2025/452",
              date: "2025-03-20",
              vendor: "LOGISTICS EXPRESS",
              gstin: "29AADCL7027F1ZU",
              taxable_value: 15600.00,
              total_tax: 2808.00,
              itc_eligible: 2808.00,
              match_type: "Fuzzy",
              status: "Matched",
              remark: "Matched with minor date variance"
            }
          ],
          discrepancies: {
            missing_in_books: {
              count: 1,
              invoices: [
                {
                  invoice_no: "3162",
                  vendor: "J D B S TRANSLINE",
                  gstin: "24FMZPP2968G1ZH",
                  gross_amount: 1150.00,
                  tax: 207.00,
                  priority: "High",
                  action: "Invoice in 2B but not in Purchase Register - Add to books immediately"
                }
              ]
            },
            missing_in_gstr2b: {
              count: 3,
              invoices: [
                {
                  invoice_no: "115",
                  vendor: "SANTOSH BUFFING WORKS",
                  gstin: "(URD)",
                  gross_amount: 4924.00,
                  action: "Unregistered supplier - No ITC available"
                },
                {
                  invoice_no: "3484",
                  vendor: "JDBS TRANSPORT",
                  gstin: "24FMZPP2968G1ZH",
                  gross_amount: 5100.00,
                  action: "RCM entry - No ITC in 2B (expected)"
                },
                {
                  invoice_no: "MAR/2025/678",
                  vendor: "QUICK REPAIRS",
                  gstin: "27AAFCQ3654P1Z9",
                  gross_amount: 8500.00,
                  action: "Supplier hasn't filed GSTR-1 yet - Follow up"
                }
              ]
            },
            value_mismatches: [
              {
                invoice_no: "24-25/038",
                vendor: "ZAHUR BUFF POLISHING WORKS",
                gstin: "27AFSPA5182M1ZD",
                taxable_value_books: 30206.00,
                taxable_value_2b: 28500.00,
                difference: 1706.00,
                remark: "Taxable value mismatch - Verify invoice copy"
              },
              {
                invoice_no: "FEB/2025/223",
                vendor: "INDUSTRIAL SUPPLIES CO",
                gstin: "27AAECI9142J1ZK",
                taxable_value_books: 42800.00,
                taxable_value_2b: 42000.00,
                difference: 800.00,
                remark: "Minor difference in taxable amount"
              }
            ]
          },
          vendor_compliance: {
            total_vendors: 42,
            distribution: {
              compliant: 34,
              at_risk: 6,
              non_compliant: 2
            },
            vendors: [
              {
                name: "EFFICACIOUS ADVISORS PVT LTD",
                score: 100,
                invoices: { matched: 1, total: 1 },
                itc_secured: 594.00,
                itc_at_risk: 0,
                status: "Compliant"
              },
              {
                name: "AMI METAL PRESSING WORKS",
                score: 100,
                invoices: { matched: 1, total: 1 },
                itc_secured: 8236.44,
                itc_at_risk: 0,
                status: "Compliant"
              },
              {
                name: "STEEL TRADERS INDIA",
                score: 100,
                invoices: { matched: 3, total: 3 },
                itc_secured: 45000.00,
                itc_at_risk: 0,
                status: "Compliant"
              },
              {
                name: "MUMBAI METALS LTD",
                score: 95,
                invoices: { matched: 4, total: 4 },
                itc_secured: 52400.00,
                itc_at_risk: 0,
                status: "Compliant"
              },
              {
                name: "LOGISTICS EXPRESS",
                score: 90,
                invoices: { matched: 2, total: 2 },
                itc_secured: 4850.00,
                itc_at_risk: 0,
                status: "Compliant"
              },
              {
                name: "ZAHUR BUFF POLISHING WORKS",
                score: 75,
                invoices: { matched: 2, total: 3 },
                itc_secured: 18500.00,
                itc_at_risk: 1706.00,
                status: "At Risk"
              },
              {
                name: "QUICK REPAIRS",
                score: 60,
                invoices: { matched: 0, total: 1 },
                itc_secured: 0,
                itc_at_risk: 8500.00,
                status: "At Risk"
              },
              {
                name: "J D B S TRANSLINE",
                score: 55,
                invoices: { matched: 3, total: 5 },
                itc_secured: 12000.00,
                itc_at_risk: 1357.00,
                status: "At Risk"
              },
              {
                name: "SANTOSH BUFFING WORKS",
                score: 40,
                invoices: { matched: 2, total: 4 },
                itc_secured: 6200.00,
                itc_at_risk: 4924.00,
                status: "Non-Compliant"
              },
              {
                name: "INDUSTRIAL SUPPLIES CO",
                score: 70,
                invoices: { matched: 2, total: 3 },
                itc_secured: 38500.00,
                itc_at_risk: 800.00,
                status: "At Risk"
              }
            ]
          },
          itc_analysis: {
            totals: {
              available: 589708.00,
              utilized: 524205.50,
              at_risk: 65502.50
            }
          },
          insights: [
            {
              severity: "High",
              title: "Missing Invoice Entry in Books",
              affected_invoices: 1,
              amount: 115000,
              itc_at_risk: 20700,
              deadline: "Within 30 days",
              vendor: "J D B S TRANSLINE"
            },
            {
              severity: "High",
              title: "Supplier Filing Pending",
              affected_invoices: 1,
              amount: 850000,
              itc_at_risk: 15300,
              deadline: "Before return filing",
              vendor: "QUICK REPAIRS"
            },
            {
              severity: "Medium",
              title: "Value Mismatch Requiring Clarification",
              affected_invoices: 2,
              amount: 7300600,
              itc_at_risk: 25060,
              deadline: "45 days",
              vendor: "ZAHUR BUFF POLISHING WORKS & 1 other"
            },
            {
              severity: "Low",
              title: "Unregistered Supplier Transactions",
              affected_invoices: 1,
              amount: 492400,
              itc_at_risk: 44424,
              deadline: "N/A - No ITC available",
              vendor: "SANTOSH BUFFING WORKS"
            }
          ]
        };
        
        setReconData(staticReconData);
        setState('completed');
      } catch (error) {
        console.error('Error setting reconciliation data:', error);
        setState('idle');
      } finally {
        clearInterval(progressInterval);
        setLoading(false);
      }
    }, 15000); // Wait 15 seconds for progress animation to complete
  };

  // Progress is now handled directly in handleRun for smooth 15-second completion

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Run Reconciliation</h2>
          <p className="text-gray-600 text-sm">Match your invoices with GSTR-2B and identify discrepancies</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2 shadow-sm">
              <Clock className="h-4 w-4" /> Schedule Run
           </button>
           <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2 shadow-sm">
              <Settings className="h-4 w-4" /> Settings
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {/* CENTRAL STATUS CARD */}
         <div className="min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden p-10 bg-white rounded-xl border border-gray-200 shadow-sm">
            
            {/* IDLE STATE */}
            {state === 'idle' && (
               <div className="w-full max-w-2xl text-center space-y-10 animate-in zoom-in-95 duration-300 z-10">
                  <div className="flex flex-col items-center gap-6">
                     <div className="relative">
                        <div className="absolute inset-0 bg-emerald-200 blur-xl rounded-full"></div>
                        <div className="relative h-24 w-24 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                           <RefreshCw className="h-10 w-10 text-emerald-600" />
                        </div>
                     </div>
                     <div>
                        <h3 className="text-3xl font-bold text-gray-900">Ready to Reconcile</h3>
                        <div className="flex items-center justify-center gap-2 mt-2 text-gray-600">
                           <Clock className="h-4 w-4" /> Last run: 06 Jan, 11:48 AM
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                        <p className="text-xs text-gray-600 uppercase font-bold">Purchase Invoices</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">42</p>
                     </div>
                     <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                        <p className="text-xs text-gray-600 uppercase font-bold">GSTR-2B Entries</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">39</p>
                     </div>
                     <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                        <p className="text-xs text-gray-600 uppercase font-bold">Est. Time</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">~1 min</p>
                     </div>
                  </div>

                  <button 
                     onClick={handleRun}
                     className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-lg font-bold rounded-full shadow-lg shadow-emerald-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                  >
                     <Play className="h-6 w-6 fill-current" /> Run Reconciliation Now
                  </button>
               </div>
            )}

            {/* RUNNING STATE */}
            {state === 'running' && (
               <div className="w-full max-w-xl text-center space-y-10 animate-in fade-in duration-500 z-10">
                  <div className="relative h-48 w-48 mx-auto">
                     <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                        <circle 
                           cx="50" cy="50" r="45" fill="none" stroke="#10B981" strokeWidth="8" 
                           strokeDasharray="283" 
                           strokeDashoffset={283 - (283 * progress) / 100} 
                           strokeLinecap="round"
                           className="transition-all duration-100 ease-linear"
                        />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-gray-900">{progress}%</span>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <h3 className="text-2xl font-bold text-gray-900 animate-pulse">Reconciliation in Progress...</h3>
                     <p className="text-gray-600 h-6">{tasks[currentTask]}</p>
                  </div>

                  <div className="w-full bg-gray-50 rounded-xl p-4 border border-gray-200 flex justify-between text-sm">
                     <span className="text-gray-600">Processed: <span className="text-gray-900 font-mono">{Math.floor((progress/100)*823)}</span></span>
                     <span className="text-gray-600">Matches: <span className="text-gray-900 font-mono">{Math.floor((progress/100)*780)}</span></span>
                     <span className="text-gray-600">Issues: <span className="text-red-600 font-mono">{Math.floor((progress/100)*43)}</span></span>
                  </div>
               </div>
            )}

            {/* COMPLETED STATE */}
            {state === 'completed' && reconData && (
               <div className="w-full text-left space-y-6 animate-in zoom-in-95 duration-500 z-10">
                  <div className="flex flex-col items-center gap-4 text-center mb-8">
                     <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                        <CheckCircle2 className="h-10 w-10 text-white" />
                     </div>
                     <div>
                        <h3 className="text-3xl font-bold text-gray-900">Reconciliation Complete!</h3>
                        <p className="text-gray-600">Process finished successfully in {reconData.metadata?.duration_seconds?.toFixed(2) || '0'}s</p>
                        <p className="text-sm text-gray-500 mt-1">{reconData.metadata?.business_name} • {reconData.metadata?.period}</p>
                     </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                     <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-emerald-700 uppercase font-bold">Matched</p>
                        <p className="text-3xl font-bold text-emerald-600 mt-2">{reconData.summary?.matched_count || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">{reconData.summary?.match_percentage?.toFixed(2) || 0}% Rate</p>
                     </div>

                     <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-red-700 uppercase font-bold">Discrepancies</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">{reconData.summary?.discrepancies?.total || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">Issues Found</p>
                     </div>

                     <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-blue-700 uppercase font-bold">ITC Secured</p>
                        <p className="text-2xl font-bold text-blue-600 mt-2">₹{(reconData.summary?.itc_secured / 100000).toFixed(2)}L</p>
                        <p className="text-xs text-gray-600 mt-1">Available</p>
                     </div>

                     <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-amber-700 uppercase font-bold">ITC at Risk</p>
                        <p className="text-2xl font-bold text-amber-600 mt-2">₹{(reconData.summary?.itc?.at_risk / 100000).toFixed(2)}L</p>
                        <p className="text-xs text-gray-600 mt-1">{reconData.summary?.itc?.risk_percentage?.toFixed(2)}%</p>
                     </div>

                     <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-gray-700 uppercase font-bold">Total Invoices</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{reconData.summary?.invoices?.unique || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">Analyzed</p>
                     </div>
                  </div>

                  {/* Tabs for different views */}
                  <div className="flex gap-2 border-b border-gray-200 bg-white rounded-t-xl px-2">
                     <button 
                        onClick={() => setSelectedTab('summary')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${selectedTab === 'summary' ? 'text-gray-900 border-b-2 border-emerald-600' : 'text-gray-600 hover:text-gray-900'}`}
                     >
                        Summary
                     </button>
                     <button 
                        onClick={() => setSelectedTab('matched')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${selectedTab === 'matched' ? 'text-gray-900 border-b-2 border-emerald-600' : 'text-gray-600 hover:text-gray-900'}`}
                     >
                        Matched ({reconData.matched_invoices?.length || 0})
                     </button>
                     <button 
                        onClick={() => setSelectedTab('discrepancies')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${selectedTab === 'discrepancies' ? 'text-gray-900 border-b-2 border-emerald-600' : 'text-gray-600 hover:text-gray-900'}`}
                     >
                        Discrepancies ({reconData.summary?.discrepancies?.total || 0})
                     </button>
                     <button 
                        onClick={() => setSelectedTab('vendors')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${selectedTab === 'vendors' ? 'text-gray-900 border-b-2 border-emerald-600' : 'text-gray-600 hover:text-gray-900'}`}
                     >
                        Vendors ({reconData.vendor_compliance?.total_vendors || 0})
                     </button>
                     <button 
                        onClick={() => setSelectedTab('insights')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${selectedTab === 'insights' ? 'text-gray-900 border-b-2 border-emerald-600' : 'text-gray-600 hover:text-gray-900'}`}
                     >
                        Insights ({reconData.insights?.length || 0})
                     </button>
                  </div>

                  {/* Tab Content */}
                  <div className="min-h-[400px] bg-white rounded-b-xl border border-t-0 border-gray-200 p-6">
                     {selectedTab === 'summary' && (
                        <div className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Invoice Distribution */}
                              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                 <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-emerald-600" /> Invoice Distribution
                                 </h4>
                                 <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                       <span className="text-gray-600">In Books</span>
                                       <span className="text-gray-900 font-bold">{reconData.summary?.invoices?.in_books || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-gray-600">In GSTR-2B</span>
                                       <span className="text-gray-900 font-bold">{reconData.summary?.invoices?.in_gstr2b || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-gray-600">Unique Total</span>
                                       <span className="text-gray-900 font-bold">{reconData.summary?.invoices?.unique || 0}</span>
                                    </div>
                                 </div>
                              </div>

                              {/* ITC Analysis */}
                              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                 <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-emerald-600" /> ITC Analysis
                                 </h4>
                                 <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                       <span className="text-gray-600">Available ITC</span>
                                       <span className="text-emerald-600 font-bold">₹{(reconData.itc_analysis?.totals?.available / 100000).toFixed(2)}L</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-gray-600">Utilized ITC</span>
                                       <span className="text-blue-600 font-bold">₹{(reconData.itc_analysis?.totals?.utilized / 100000).toFixed(2)}L</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-gray-600">ITC at Risk</span>
                                       <span className="text-red-600 font-bold">₹{(reconData.itc_analysis?.totals?.at_risk / 100000).toFixed(2)}L</span>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Discrepancy Breakdown */}
                           <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                 <AlertTriangle className="h-5 w-5 text-red-600" /> Discrepancy Breakdown
                              </h4>
                              <div className="grid grid-cols-3 gap-4">
                                 <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                    <p className="text-xs text-red-700 uppercase font-bold">Missing in Books</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{reconData.summary?.discrepancies?.missing_in_books || 0}</p>
                                 </div>
                                 <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                    <p className="text-xs text-amber-700 uppercase font-bold">Missing in GSTR-2B</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{reconData.summary?.discrepancies?.missing_in_gstr2b || 0}</p>
                                 </div>
                                 <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                                    <p className="text-xs text-orange-700 uppercase font-bold">Value Mismatches</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{reconData.summary?.discrepancies?.value_mismatches || 0}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {selectedTab === 'matched' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                           <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                 <thead>
                                    <tr className="border-b border-gray-200">
                                       <th className="text-left py-3 px-2 text-gray-700 font-medium">Invoice No</th>
                                       <th className="text-left py-3 px-2 text-gray-700 font-medium">Date</th>
                                       <th className="text-left py-3 px-2 text-gray-700 font-medium">Vendor</th>
                                       <th className="text-right py-3 px-2 text-gray-700 font-medium">Taxable Value</th>
                                       <th className="text-right py-3 px-2 text-gray-700 font-medium">Total Tax</th>
                                       <th className="text-right py-3 px-2 text-gray-700 font-medium">ITC Eligible</th>
                                       <th className="text-center py-3 px-2 text-gray-700 font-medium">Match Type</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {reconData.matched_invoices?.slice(0, 10).map((invoice: any, idx: number) => (
                                       <tr key={idx} className="border-b border-gray-200 hover:bg-gray-100">
                                          <td className="py-3 px-2 text-gray-900 font-mono text-xs">{invoice.invoice_no}</td>
                                          <td className="py-3 px-2 text-gray-600">{invoice.date}</td>
                                          <td className="py-3 px-2 text-gray-900">{invoice.vendor}</td>
                                          <td className="py-3 px-2 text-right text-gray-900">₹{invoice.taxable_value.toLocaleString()}</td>
                                          <td className="py-3 px-2 text-right text-gray-900">₹{invoice.total_tax.toLocaleString()}</td>
                                          <td className="py-3 px-2 text-right text-emerald-600 font-bold">₹{invoice.itc_eligible.toLocaleString()}</td>
                                          <td className="py-3 px-2 text-center">
                                             <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full border border-emerald-200">{invoice.match_type}</span>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                              {reconData.matched_invoices?.length > 10 && (
                                 <p className="text-center text-gray-600 text-xs mt-4">Showing 10 of {reconData.matched_invoices.length} matched invoices</p>
                              )}
                           </div>
                        </div>
                     )}

                     {selectedTab === 'discrepancies' && (
                        <div className="space-y-4">
                           {/* Missing in Books */}
                           {reconData.discrepancies?.missing_in_books?.invoices?.length > 0 && (
                              <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
                                 <h4 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                                    <AlertOctagon className="h-5 w-5 text-red-600" /> Missing in Books ({reconData.discrepancies.missing_in_books.count})
                                 </h4>
                                 <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                       <thead>
                                          <tr className="border-b border-red-200">
                                             <th className="text-left py-2 px-2 text-red-700 font-medium">Invoice No</th>
                                             <th className="text-left py-2 px-2 text-red-700 font-medium">Vendor</th>
                                             <th className="text-right py-2 px-2 text-red-700 font-medium">Amount</th>
                                             <th className="text-right py-2 px-2 text-red-700 font-medium">Tax</th>
                                             <th className="text-center py-2 px-2 text-red-700 font-medium">Priority</th>
                                             <th className="text-left py-2 px-2 text-red-700 font-medium">Action</th>
                                          </tr>
                                       </thead>
                                       <tbody>
                                          {reconData.discrepancies.missing_in_books.invoices.map((invoice: any, idx: number) => (
                                             <tr key={idx} className="border-b border-red-100">
                                                <td className="py-2 px-2 text-red-900 font-mono text-xs">{invoice.invoice_no}</td>
                                                <td className="py-2 px-2 text-red-700">{invoice.vendor}</td>
                                                <td className="py-2 px-2 text-right text-red-900">₹{invoice.gross_amount.toLocaleString()}</td>
                                                <td className="py-2 px-2 text-right text-red-600 font-bold">₹{invoice.tax.toLocaleString()}</td>
                                                <td className="py-2 px-2 text-center">
                                                   <span className={`px-2 py-1 text-xs rounded-full border ${invoice.priority === 'High' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-amber-100 text-amber-700 border-amber-300'}`}>
                                                      {invoice.priority}
                                                   </span>
                                                </td>
                                                <td className="py-2 px-2 text-red-700 text-xs">{invoice.action}</td>
                                             </tr>
                                          ))}
                                       </tbody>
                                    </table>
                                 </div>
                              </div>
                           )}

                           {/* Missing in GSTR-2B */}
                           {reconData.discrepancies?.missing_in_gstr2b?.invoices?.length > 0 && (
                              <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
                                 <h4 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" /> Missing in GSTR-2B ({reconData.discrepancies.missing_in_gstr2b.count})
                                 </h4>
                                 <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                    <table className="w-full text-sm">
                                       <thead className="sticky top-0 bg-amber-50">
                                          <tr className="border-b border-amber-200">
                                             <th className="text-left py-2 px-2 text-amber-700 font-medium">Invoice No</th>
                                             <th className="text-left py-2 px-2 text-amber-700 font-medium">Vendor</th>
                                             <th className="text-right py-2 px-2 text-amber-700 font-medium">Amount</th>
                                             <th className="text-left py-2 px-2 text-amber-700 font-medium">Reason</th>
                                          </tr>
                                       </thead>
                                       <tbody>
                                          {reconData.discrepancies.missing_in_gstr2b.invoices.slice(0, 8).map((invoice: any, idx: number) => (
                                             <tr key={idx} className="border-b border-amber-100">
                                                <td className="py-2 px-2 text-amber-900 font-mono text-xs">{invoice.invoice_no}</td>
                                                <td className="py-2 px-2 text-amber-700">{invoice.vendor}</td>
                                                <td className="py-2 px-2 text-right text-amber-900">₹{invoice.gross_amount.toLocaleString()}</td>
                                                <td className="py-2 px-2 text-amber-700 text-xs">{invoice.action}</td>
                                             </tr>
                                          ))}
                                       </tbody>
                                    </table>
                                    {reconData.discrepancies.missing_in_gstr2b.invoices.length > 8 && (
                                       <p className="text-center text-amber-600 text-xs mt-2">Showing 8 of {reconData.discrepancies.missing_in_gstr2b.invoices.length} invoices</p>
                                    )}
                                 </div>
                              </div>
                           )}
                        </div>
                     )}

                     {selectedTab === 'vendors' && (
                        <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                           <div className="mb-6 grid grid-cols-3 gap-4">
                              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                                 <p className="text-xs text-emerald-700 uppercase font-bold">Compliant</p>
                                 <p className="text-2xl font-bold text-emerald-900 mt-1">{reconData.vendor_compliance?.distribution?.compliant || 0}</p>
                              </div>
                              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                 <p className="text-xs text-amber-700 uppercase font-bold">At Risk</p>
                                 <p className="text-2xl font-bold text-amber-900 mt-1">{reconData.vendor_compliance?.distribution?.at_risk || 0}</p>
                              </div>
                              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                 <p className="text-xs text-red-700 uppercase font-bold">Non-Compliant</p>
                                 <p className="text-2xl font-bold text-red-900 mt-1">{reconData.vendor_compliance?.distribution?.non_compliant || 0}</p>
                              </div>
                           </div>
                           <div className="overflow-x-auto max-h-96 overflow-y-auto">
                              <table className="w-full text-sm">
                                 <thead className="sticky top-0 bg-gray-50">
                                    <tr className="border-b border-gray-200">
                                       <th className="text-left py-2 px-2 text-gray-700 font-medium">Vendor</th>
                                       <th className="text-center py-2 px-2 text-gray-700 font-medium">Score</th>
                                       <th className="text-center py-2 px-2 text-gray-700 font-medium">Invoices</th>
                                       <th className="text-right py-2 px-2 text-gray-700 font-medium">ITC Secured</th>
                                       <th className="text-right py-2 px-2 text-gray-700 font-medium">ITC at Risk</th>
                                       <th className="text-center py-2 px-2 text-gray-700 font-medium">Status</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {reconData.vendor_compliance?.vendors?.slice(0, 15).map((vendor: any, idx: number) => (
                                       <tr key={idx} className="border-b border-gray-200 hover:bg-gray-100">
                                          <td className="py-2 px-2 text-gray-900">{vendor.name}</td>
                                          <td className="py-2 px-2 text-center">
                                             <span className={`px-2 py-1 rounded-full text-xs font-bold border ${vendor.score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : vendor.score >= 60 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                {vendor.score}
                                             </span>
                                          </td>
                                          <td className="py-2 px-2 text-center text-gray-900">{vendor.invoices.matched}/{vendor.invoices.total}</td>
                                          <td className="py-2 px-2 text-right text-emerald-600 font-bold">₹{(vendor.itc_secured / 1000).toFixed(1)}K</td>
                                          <td className="py-2 px-2 text-right text-red-600 font-bold">₹{(vendor.itc_at_risk / 1000).toFixed(1)}K</td>
                                          <td className="py-2 px-2 text-center">
                                             <span className={`px-2 py-1 text-xs rounded-full border ${vendor.status === 'Compliant' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : vendor.status === 'At Risk' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                {vendor.status}
                                             </span>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     )}

                     {selectedTab === 'insights' && (
                        <div className="space-y-4">
                           {reconData.insights?.map((insight: any, idx: number) => (
                              <div key={idx} className={`p-6 rounded-xl border ${insight.severity === 'High' ? 'bg-red-50 border-red-200' : insight.severity === 'Medium' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                                 <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                       <div className="flex items-center gap-2 mb-2">
                                          <span className={`px-2 py-1 text-xs rounded-full font-bold border ${insight.severity === 'High' ? 'bg-red-100 text-red-700 border-red-200' : insight.severity === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                             {insight.severity}
                                          </span>
                                          <h4 className={`text-lg font-bold ${insight.severity === 'High' ? 'text-red-900' : insight.severity === 'Medium' ? 'text-amber-900' : 'text-blue-900'}`}>{insight.title}</h4>
                                       </div>
                                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                          <div>
                                             <p className={`text-xs ${insight.severity === 'High' ? 'text-red-600' : insight.severity === 'Medium' ? 'text-amber-600' : 'text-blue-600'}`}>Affected Invoices</p>
                                             <p className={`font-bold ${insight.severity === 'High' ? 'text-red-900' : insight.severity === 'Medium' ? 'text-amber-900' : 'text-blue-900'}`}>{insight.affected_invoices}</p>
                                          </div>
                                          <div>
                                             <p className={`text-xs ${insight.severity === 'High' ? 'text-red-600' : insight.severity === 'Medium' ? 'text-amber-600' : 'text-blue-600'}`}>Amount</p>
                                             <p className={`font-bold ${insight.severity === 'High' ? 'text-red-900' : insight.severity === 'Medium' ? 'text-amber-900' : 'text-blue-900'}`}>₹{(insight.amount / 100000).toFixed(2)}L</p>
                                          </div>
                                          <div>
                                             <p className={`text-xs ${insight.severity === 'High' ? 'text-red-600' : insight.severity === 'Medium' ? 'text-amber-600' : 'text-blue-600'}`}>ITC at Risk</p>
                                             <p className="text-red-600 font-bold">₹{(insight.itc_at_risk / 100000).toFixed(2)}L</p>
                                          </div>
                                          <div>
                                             <p className={`text-xs ${insight.severity === 'High' ? 'text-red-600' : insight.severity === 'Medium' ? 'text-amber-600' : 'text-blue-600'}`}>Deadline</p>
                                             <p className={`font-bold ${insight.severity === 'High' ? 'text-red-900' : insight.severity === 'Medium' ? 'text-amber-900' : 'text-blue-900'}`}>{insight.deadline}</p>
                                          </div>
                                       </div>
                                       <p className={`text-sm mt-3 ${insight.severity === 'High' ? 'text-red-700' : insight.severity === 'Medium' ? 'text-amber-700' : 'text-blue-700'}`}>Vendor: {insight.vendor}</p>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  <div className="flex justify-center gap-4 mt-8">
                     <button onClick={() => setState('idle')} className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">Run Again</button>
                     {/* <button className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                        <Download className="h-4 w-4" /> Download Full Report
                     </button> */}
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

// --- SCREEN 5: ITC MAXIMIZER ---
const ITCMaximizer = () => {
  // Updated ITC values based on reconciliation results
  // ITC Available (from reconciliation analysis)
  const itcAvailable = 589708.00;
  
  // ITC Claimable (ITC Secured from reconciliation)
  const itcClaimable = 524205.50;
  
  // ITC at Risk (from reconciliation discrepancies)
  const itcBlocked = 65502.50;
  
  // Potential Additional (recoverable with action)
  const potentialAdditional = 35907.00; // From addressing discrepancies

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹ ${(amount / 100000).toFixed(2)} L`;
    } else if (amount >= 1000) {
      return `₹ ${(amount / 1000).toFixed(0)}k`;
    } else {
      return `₹ ${amount.toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ITC Claim Maximizer</h2>
          <p className="text-gray-600 text-sm">Monitor and maximize your eligible Input Tax Credit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
            <p className="text-xs text-emerald-700 uppercase font-bold">ITC Available</p>
            <h3 className="text-3xl font-bold text-emerald-900 mt-2">{formatCurrency(itcAvailable)}</h3>
            <p className="text-xs text-emerald-600 mt-1">Eligible for claim</p>
         </div>
         <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
            <p className="text-xs text-blue-700 uppercase font-bold">Claimable</p>
            <h3 className="text-3xl font-bold text-blue-900 mt-2">{formatCurrency(itcClaimable)}</h3>
            <p className="text-xs text-blue-600 mt-1">Ready to file</p>
         </div>
         <div className="p-6 bg-red-50 border border-red-200 rounded-xl shadow-sm">
            <p className="text-xs text-red-700 uppercase font-bold">Blocked / Lost</p>
            <h3 className="text-3xl font-bold text-red-900 mt-2">{formatCurrency(itcBlocked)}</h3>
            <p className="text-xs text-red-600 mt-1">Ineligible</p>
         </div>
         <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
            <p className="text-xs text-amber-700 uppercase font-bold">Potential Addl.</p>
            <h3 className="text-3xl font-bold text-amber-900 mt-2">{formatCurrency(potentialAdditional)}</h3>
            <p className="text-xs text-amber-600 mt-1">Action required</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-emerald-600" /> Suggestions & Alerts</h3>
            <div className="space-y-4">
               {[
                  { title: 'Missing Invoice in Books', desc: 'J D B S TRANSLINE invoice 3162 present in GSTR-2B', impact: '₹ 207', type: 'High' },
                  { title: 'Supplier Filing Pending', desc: 'QUICK REPAIRS has not filed GSTR-1 yet', impact: '₹ 1,530', type: 'High' },
                  { title: 'Value Mismatch', desc: 'ZAHUR BUFF invoice 24-25/038 has ₹1,706 difference', impact: '₹ 307', type: 'Medium' },
                  { title: 'Unregistered Supplier', desc: 'SANTOSH BUFFING WORKS - No ITC available', impact: '₹ 886', type: 'Low' },
               ].map((alert, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex justify-between items-center group hover:border-emerald-300 transition-colors">
                     <div className="flex gap-4">
                        <div className={`p-2 rounded-lg h-fit ${alert.type === 'High' ? 'bg-red-100 text-red-600' : alert.type === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                           <AlertOctagon className="h-5 w-5" />
                        </div>
                        <div>
                           <h4 className="text-sm font-bold text-gray-900">{alert.title}</h4>
                           <p className="text-xs text-gray-600 mt-1">{alert.desc}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{alert.impact}</p>
                        <button className="mt-1 text-xs text-emerald-600 hover:underline">Fix Now</button>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Vendor Communication</h3>
            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
               <div className="h-16 w-16 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center mb-4">
                  <Send className="h-8 w-8 text-gray-600" />
               </div>
               <p className="text-gray-900 font-medium">5 Vendors require follow-up</p>
               <p className="text-gray-600 text-sm mt-1 max-w-xs">Automated reminders drafted for missing invoices and filing delays.</p>
               
               <div className="grid grid-cols-1  justify-center w-full mt-6">
                  <button 
                     onClick={async () => {
                       try {
                         await fetch('https://glowing-g79w8.crab.containers.automata.host/webhook/deepbutton', {
                           method: 'POST',
                           headers: {
                             'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({
                             action: 'whatsapp_vendor_communication',
                             timestamp: new Date().toISOString(),
                             vendors_count: 5
                           })
                         });
                       } catch (error) {
                         console.error('Webhook error:', error);
                       }
                     }}
                     className="py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold hover:bg-emerald-100"
                  >
                     WhatsApp 
                  </button>
                  {/* <button className="py-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 text-sm font-bold hover:bg-blue-500/20">
                     Email (2)
                  </button> */}
               </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-center">
               <span className="text-xs text-gray-600">Live Updates</span>
               <span className="text-xs text-gray-900">Pending Responses: 6 | Alerts Sent: 20</span>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- SCREEN 6: FILING OUTPUT ---
const FilingOutput = () => {
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  
  // Static GSTR-3B data
  const gstr3bData = {
    "form": {
      "name": "GSTR-3B",
      "version": "3.1",
      "rule": "59(1)",
      "generated_on": "15/04/2025",
      "generated_by": "GST AI Assistant v2.0"
    },
    "period": {
      "fy": "2024-25",
      "month": "March",
      "month_no": 3,
      "year": 2025,
      "due_date": "20/04/2025",
      "status": "Draft"
    },
    "taxpayer": {
      "gstin": "27AATFD2632G1ZC",
      "legal_name": "DEV KAILASH STEEL",
      "arn": "AA2703256046383",
      "arn_date": "09/04/2025",
      "filed_on": ""
    },
    "table_3_1": [
      {
        "row": "3.1(a)",
        "type": "Outward taxable supplies (other than zero rated, nil rated and exempted)",
        "taxable": 8335591.43,
        "igst": 50863.32,
        "cgst": 499135.98,
        "sgst": 499135.98,
        "cess": 0
      },
      {
        "row": "3.1(b)",
        "type": "Outward taxable supplies (zero rated)",
        "taxable": 0,
        "igst": 0,
        "cgst": 0,
        "sgst": 0,
        "cess": 0
      },
      {
        "row": "3.1(c)",
        "type": "Other outward supplies (Nil rated, exempted)",
        "taxable": 0,
        "igst": 0,
        "cgst": 0,
        "sgst": 0,
        "cess": 0
      },
      {
        "row": "3.1(e)",
        "type": "Non-GST outward supplies",
        "taxable": 0,
        "igst": 0,
        "cgst": 0,
        "sgst": 0,
        "cess": 0
      }
    ],
    "notes_3_1": {
      "3.1(a)": "Includes 35 B2B invoices totaling ₹83,35,591.43 with CGST/SGST @9% each",
      "3.1(d)": "No reverse charge supplies reported in GSTR-1"
    },
    "table_3_1_1": [
      {
        "row": "3.1.1(a)",
        "type": "Supplies through E-Commerce Operator (TCS)",
        "taxable": 0,
        "igst": 0,
        "cgst": 0,
        "sgst": 0,
        "cess": 0
      }
    ],
    "table_3_2": [
      {
        "type": "Inward supplies liable to reverse charge (including import of services)",
        "taxable": 0,
        "igst": 0
      }
    ],
    "itc": {
      "available": {
        "igst": 10890.15,
        "cgst": 256607.75,
        "sgst": 256607.75,
        "cess": 0
      },
      "rcm_itc": 0,
      "details": [
        {
          "row": "4A(5)",
          "desc": "All other ITC (B2B Invoices)",
          "igst": 10890.15,
          "cgst": 256607.75,
          "sgst": 256607.75
        }
      ],
      "net_itc": {
        "igst": 10890.15,
        "cgst": 256607.75,
        "sgst": 256607.75
      },
      "notes": {
        "4(A)(5)": "B2B invoices: 38 matched invoices from reconciliation (₹5,24,205.50 ITC secured)"
      }
    },
    "table_5": {
      "exempt_inward": 0,
      "non_gst_inward": 0
    },
    "interest_latefee": {
      "interest_paid": 0,
      "late_fee_paid": 0
    },
    "tax_payment": {
      "regular": {
        "igst": {
          "payable": 50863.32,
          "paid_itc": 10890.15,
          "cash": 39973.17
        },
        "cgst": {
          "payable": 499135.98,
          "paid_itc": 256607.75,
          "cash": 242528.23
        },
        "sgst": {
          "payable": 499135.98,
          "paid_itc": 256607.75,
          "cash": 242528.23
        },
        "cess": {
          "payable": 0,
          "paid_itc": 0,
          "cash": 0
        }
      },
      "rcm": {
        "igst": {
          "payable": 0,
          "cash": 0
        }
      },
      "summary": {
        "total_liability": 1049135.28,
        "itc_used": 524105.65,
        "cash_paid": 525029.63,
        "itc_breakup": {
          "igst_to_igst": 10890.15,
          "cgst_to_cgst": 256607.75,
          "sgst_to_sgst": 256607.75
        }
      }
    },
    "liability_breakup": {
      "march_2025": {
        "igst": 50863.32,
        "cgst": 499135.98,
        "sgst": 499135.98,
        "notes": "All liability from 35 B2B invoices (GSTR-1 Table 4A)"
      }
    },
    "verification": {
      "signed_by": "DEVILAL JAIN",
      "designation": "PARTNER",
      "date": "15/04/2025"
    },
    "validation": [
      {
        "check": "ITC Utilization Order",
        "status": "PASS",
        "message": "IGST fully utilized before CGST/SGST as per Rule 88(4)"
      },
      {
        "check": "Table 3.1 vs GSTR-1",
        "status": "PASS",
        "message": "Outward supplies match GSTR-1 Table 4A (₹83,35,591.43)"
      },
      {
        "check": "ITC Availability",
        "status": "PASS",
        "message": "Net ITC: ₹5,24,105.65 (38 matched invoices, 90.48% match rate)"
      },
      {
        "check": "Reconciliation Status",
        "status": "WARNING",
        "message": "6 discrepancies identified - ₹65,502.50 ITC at risk"
      }
    ],
    "computations": {
      "outward": {
        "invoices": 35,
        "taxable_value": 8335591.43,
        "igst": 50863.32,
        "cgst": 499135.98,
        "sgst": 499135.98
      },
      "rcm": {
        "taxable": 0,
        "igst": 0,
        "invoices": []
      },
      "itc_total": 524105.65
    }
  };

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify([{ output: gstr3bData }], null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GSTR-3B_March_2025.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    
    // Show loading for 2 seconds
    setTimeout(() => {
      const pdfPath = '/GSTR3B_Draft.pdf';
      
      // Open in new tab
      window.open(pdfPath, '_blank');
      
      // Trigger download after a short delay
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = pdfPath;
        link.download = 'DEV_KAILASH_GSTR3B_MAR25.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setDownloadingPDF(false);
      }, 1000);
    }, 2000);
  };

  const handleCreateChallan = async () => {
    await handleDownloadPDF();
  };

  const taxPayment = gstr3bData?.tax_payment?.summary;
  const table31 = gstr3bData?.table_3_1?.[0]; // Outward taxable supplies
  const itc = gstr3bData?.itc;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Draft GSTR-3B & 9B</h2>
          <p className="text-gray-600 text-sm">Auto-generated drafts ready for final review and filing.</p>
          {gstr3bData && (
            <p className="text-xs text-gray-500 mt-1">Period: {gstr3bData.period?.month} {gstr3bData.period?.year} • Due: {gstr3bData.period?.due_date}</p>
          )}
        </div>
        <div className="flex gap-2">
           <button onClick={handleDownloadJSON} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2"><Download className="h-4 w-4" /> JSON</button>
           <button onClick={handleDownloadPDF} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2"><FileText className="h-4 w-4" /> PDF Summary</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
               <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Tax Liability Computation (3B)</h3>
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">Verified</span>
               </div>
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                     <tr>
                        <th className="p-3 pl-4">Description</th>
                        <th className="p-3 text-right">IGST</th>
                        <th className="p-3 text-right">CGST</th>
                        <th className="p-3 text-right">SGST</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                     <tr>
                        <td className="p-3 pl-4 text-gray-700">Outward Taxable Supplies</td>
                        <td className="p-3 text-right font-mono text-gray-900">₹ {table31?.igst?.toLocaleString() || '0'}</td>
                        <td className="p-3 text-right font-mono text-gray-900">₹ {table31?.cgst?.toLocaleString() || '0'}</td>
                        <td className="p-3 text-right font-mono text-gray-900">₹ {table31?.sgst?.toLocaleString() || '0'}</td>
                     </tr>
                     <tr>
                        <td className="p-3 pl-4 text-gray-700">Eligible ITC</td>
                        <td className="p-3 text-right font-mono text-emerald-600 font-bold">₹ {itc?.net_itc?.igst?.toLocaleString() || '0'}</td>
                        <td className="p-3 text-right font-mono text-emerald-600 font-bold">₹ {itc?.net_itc?.cgst?.toLocaleString() || '0'}</td>
                        <td className="p-3 text-right font-mono text-emerald-600 font-bold">₹ {itc?.net_itc?.sgst?.toLocaleString() || '0'}</td>
                     </tr>
                     <tr className="bg-gray-50">
                        <td className="p-3 pl-4 text-gray-900 font-bold">Net Payable (Cash)</td>
                        <td className="p-3 text-right font-mono text-gray-900 font-bold">₹ {gstr3bData?.tax_payment?.regular?.igst?.cash?.toLocaleString() || '0'}</td>
                        <td className="p-3 text-right font-mono text-gray-900 font-bold">₹ {gstr3bData?.tax_payment?.regular?.cgst?.cash?.toLocaleString() || '0'}</td>
                        <td className="p-3 text-right font-mono text-gray-900 font-bold">₹ {gstr3bData?.tax_payment?.regular?.sgst?.cash?.toLocaleString() || '0'}</td>
                     </tr>
                  </tbody>
               </table>
            </div>

            {gstr3bData?.validation && gstr3bData.validation.length > 0 && (
               <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-1" />
                  <div>
                     <h4 className="font-bold text-emerald-900 text-sm">Validation Status</h4>
                     <ul className="text-sm text-emerald-700 mt-2 space-y-1">
                        {gstr3bData.validation.slice(0, 3).map((v: any, idx: number) => (
                           <li key={idx} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{v.message}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
            )}
         </div>

         <div className="space-y-6">
            <div className="text-center p-8 bg-white border border-gray-200 rounded-xl shadow-sm">
               <p className="text-gray-600 text-sm uppercase mb-2">Net Cash Liability</p>
               <h3 className="text-5xl font-bold text-gray-900">₹ {taxPayment?.cash_paid?.toLocaleString() || '0'}</h3>
               <div className="my-6 h-px bg-gray-200"></div>
               <p className="text-xs text-gray-600 mb-4">
                  Total Liability: ₹{taxPayment?.total_liability?.toLocaleString() || '0'}<br/>
                  ITC Used: ₹{taxPayment?.itc_used?.toLocaleString() || '0'}
               </p>
               <button 
                  onClick={handleCreateChallan} 
                  disabled={downloadingPDF}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {downloadingPDF ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" /> Draft GSTR3B
                    </>
                  )}
               </button>
            </div>
            
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
               <h4 className="text-sm font-bold text-gray-900 mb-3">Return Information</h4>
               {gstr3bData && (
                  <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-gray-600">Business Name:</span>
                        <span className="text-gray-900 font-medium">{gstr3bData.taxpayer?.legal_name}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-gray-600">GSTIN:</span>
                        <span className="text-gray-900 font-mono text-xs">{gstr3bData.taxpayer?.gstin}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-gray-600">Period:</span>
                        <span className="text-gray-900">{gstr3bData.period?.month} {gstr3bData.period?.year}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs rounded">{gstr3bData.period?.status}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="text-red-600 font-medium">{gstr3bData.period?.due_date}</span>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function GSTRSimulatorPage() {
  const [step, setStep] = useState<SimulatorStep>(1);
  const [transitioning, setTransitioning] = useState(false);

  const nextStep = () => {
    if (step < 6 && !transitioning) {
      setTransitioning(true);
      setTimeout(() => {
        setStep((s) => (s + 1) as SimulatorStep);
        setTransitioning(false);
      }, 3000);
    }
  };

  const prevStep = () => {
    if (step > 1 && !transitioning) {
      setTransitioning(true);
      setTimeout(() => {
        setStep((s) => (s - 1) as SimulatorStep);
        setTransitioning(false);
      }, 3000);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1: return <CapturedInvoices onNext={nextStep} />;
      case 2: return <RegistersAndDraft onNext={nextStep} />;
      case 3: return <UploadGSTR2B onNext={nextStep} />;
      case 4: return <ReconciliationEngine />;
      case 5: return <ITCMaximizer />;
      case 6: return <FilingOutput />;
      default: return <CapturedInvoices onNext={nextStep} />;
    }
  };

  const stepsLabels = [
    'Invoices', 
    'Registers', 
    'GSTR-2B', 
    'Reconciliation', 
    'ITC Max', 
    'Filing'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50 pb-20 container mx-auto max-w-7xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">GSTR Compliance Simulator</h1>
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-xs font-semibold border border-emerald-200">Demo Mode</span>
        </div>
        <p className="text-gray-600 mt-2">Experience the complete end-to-end automation flow</p>
      </div>

      {/* Stepper */}
      <Stepper currentStep={step} steps={stepsLabels} />

      {/* Main Content Container */}
      <div className="relative min-h-[600px]">
        {transitioning && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
              <p className="text-gray-900 font-medium">Transitioning to next step...</p>
            </div>
          </div>
        )}
        {renderStep()}
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-gray-200 z-50">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <button 
            onClick={prevStep}
            disabled={step === 1 || transitioning}
            className="px-6 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          
          <div className="text-sm text-gray-600 font-mono">
            Step {step} of 6 {transitioning && <span className="text-emerald-600">(Loading...)</span>}
          </div>

          <button 
            onClick={nextStep}
            disabled={step === 6 || transitioning}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-lg"
          >
            Next Step <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
