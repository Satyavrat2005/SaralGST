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
import GlassPanel from '../../../../components/ui/GlassPanel';
import BentoCard from '../../../../components/ui/BentoCard';

// --- TYPES ---
type SimulatorStep = 1 | 2 | 3 | 4 | 5 | 6;
type RecoState = 'idle' | 'running' | 'completed';

// --- STEPPER COMPONENT ---
const Stepper = ({ currentStep, steps }: { currentStep: number, steps: string[] }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-800 rounded-full -z-10"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-10"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background
                  ${isActive ? 'border-primary text-primary shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-110' : 
                    isCompleted ? 'border-primary bg-primary text-white' : 'border-zinc-700 text-zinc-500'}
                `}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <span className="text-sm font-bold">{stepNum}</span>}
              </div>
              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-white' : isCompleted ? 'text-zinc-300' : 'text-zinc-600'}`}>
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
      const data = await getPDFInvoices();
      if (data) {
        setInvoices(data);
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
          <h2 className="text-2xl font-bold text-white">Captured Invoices</h2>
          <p className="text-zinc-400 text-sm">View and validate invoices automatically captured from multiple sources</p>
        </div>
        <div className="flex gap-2">
           <button className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white">View All Invoices</button>
           <button className="p-2 bg-zinc-900 border border-white/10 rounded-lg text-zinc-300 hover:text-white"><Settings className="h-5 w-5" /></button>
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
               className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all
                 ${activeTab === tab.id ? 'bg-primary/10 border-primary text-white' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-900 hover:text-white'}
               `}
             >
               <div className="flex items-center gap-3">
                 <tab.icon className="h-4 w-4" />
                 {tab.label}
               </div>
               <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full">{tab.count}</span>
             </button>
           ))}
        </div>

        {/* Main Content */}
        <GlassPanel className="lg:col-span-3 p-0 overflow-hidden flex flex-col min-h-[400px]">
           <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <h3 className="font-semibold text-white flex items-center gap-2">
                 {activeTab === 'whatsapp' && <MessageSquare className="h-4 w-4 text-emerald-500" />}
                 {activeTab === 'email' && <Mail className="h-4 w-4 text-blue-500" />}
                 {activeTab === 'manual' && <UploadCloud className="h-4 w-4 text-amber-500" />}
                 Incoming Stream
              </h3>
              {processing ? (
                 <div className="flex items-center gap-2 text-xs text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" /> Processing... {processedCount}%
                 </div>
              ) : (
                 <button onClick={handleSimulateProcess} className="text-xs text-primary hover:underline">Re-run Validation</button>
              )}
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                 <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-zinc-400">Loading invoices...</span>
                 </div>
              ) : invoices.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-zinc-600 mb-2" />
                    <p className="text-sm text-zinc-400">No invoices found</p>
                 </div>
              ) : (
                 invoices.map((invoice, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                             <FileText className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="text-sm font-medium text-white">{invoice.invoice_number}</p>
                             <p className="text-xs text-zinc-500">{invoice.company_name}</p>
                             {invoice.reason && (
                                <p className="text-xs text-red-400 mt-0.5" title={invoice.reason}>
                                   {invoice.reason.length > 50 ? invoice.reason.substring(0, 50) + '...' : invoice.reason}
                                </p>
                             )}
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className={`text-xs px-2 py-1 rounded border ${
                             invoice.status.toLowerCase() === 'error' || invoice.status.toLowerCase() === 'failed' 
                                ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}>
                             {invoice.status}
                          </span>
                          {invoice.links && (
                             <a 
                                href={invoice.links} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
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
        </GlassPanel>
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
      const url = await getGSTR1BUrl();
      if (!url) {
        alert('GSTR-1B PDF not found. Please generate the draft first.');
        return;
      }
      await downloadFileFromUrl(url, 'GSTR-1B_Draft.pdf');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Registers & GSTR-1B</h2>
          <p className="text-zinc-400 text-sm">Review your registers and generate the return draft</p>
        </div>
        <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white flex items-center gap-2">
           <Plus className="h-4 w-4" /> Add Invoice Manual
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Registers View */}
         <GlassPanel className="lg:col-span-2 p-0 overflow-hidden h-[550px] flex flex-col">
            <div className="p-4 border-b border-white/5 flex gap-4">
               <button 
                  onClick={() => setActiveRegister('purchase')}
                  className={`text-sm font-medium pb-4 -mb-4 px-2 transition-colors border-b-2 ${activeRegister === 'purchase' ? 'text-white border-primary' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
               >
                  Purchase Register
               </button>
               <button 
                  onClick={() => setActiveRegister('sales')}
                  className={`text-sm font-medium pb-4 -mb-4 px-2 transition-colors border-b-2 ${activeRegister === 'sales' ? 'text-white border-primary' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
               >
                  Sales Register
               </button>
            </div>
            <div className="p-3 border-b border-white/5 flex gap-2">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input type="text" placeholder={`Search ${activeRegister}...`} className="w-full bg-zinc-900 rounded-lg pl-9 py-1.5 text-sm border border-white/10 focus:border-primary outline-none" />
               </div>
               <button className="p-1.5 border border-white/10 rounded-lg hover:bg-white/5"><Filter className="h-4 w-4 text-zinc-400" /></button>
            </div>
            <div className="flex-1 overflow-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-900/50 text-zinc-500 font-medium">
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
                  <tbody className="divide-y divide-white/5">
                     {activeRegister === 'purchase' ? (
                        purchaseData.map((item, i) => (
                           <tr key={`purch-${i}`} className="hover:bg-white/5">
                              <td className="p-3 pl-4 text-zinc-400 text-xs">{item.date}</td>
                              <td className="p-3">
                                 <div className="text-white font-medium text-xs">{item.vendor}</div>
                                 <div className="text-[10px] text-zinc-500">{item.invoice}</div>
                                 <div className="text-[9px] text-zinc-600">{item.gstin}</div>
                              </td>
                              <td className="p-3 text-right text-zinc-300 font-mono text-xs">₹{item.taxable.toLocaleString()}</td>
                              <td className="p-3 text-right text-zinc-300 font-mono text-xs">₹{item.gst.toLocaleString()}</td>
                              <td className="p-3 text-right text-white font-bold font-mono text-xs">₹{item.total.toLocaleString()}</td>
                           </tr>
                        ))
                     ) : (
                        salesData.map((item, i) => (
                           <tr key={`sales-${i}`} className="hover:bg-white/5">
                              <td className="p-3 pl-4 text-zinc-400 text-xs">{item.date}</td>
                              <td className="p-3">
                                 <div className="text-white font-medium text-xs">{item.customer}</div>
                                 <div className="text-[10px] text-zinc-500">{item.id}</div>
                                 <div className="text-[9px] text-zinc-600">{item.gstin}</div>
                              </td>
                              <td className="p-3 text-right text-zinc-400 font-mono text-xs">{item.quantity}</td>
                              <td className="p-3 text-right text-zinc-400 font-mono text-xs">{item.rate}</td>
                              <td className="p-3 text-right text-zinc-300 font-mono text-xs">₹{item.taxable.toLocaleString()}</td>
                              <td className="p-3 text-right text-zinc-300 font-mono text-xs">₹{item.gst.toLocaleString()}</td>
                              <td className="p-3 text-right text-white font-bold font-mono text-xs">₹{item.total.toLocaleString()}</td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </GlassPanel>

         {/* Draft Panel */}
         <div className="flex flex-col gap-6 h-[550px]">
            <BentoCard title="GSTR-1B Draft Summary" className="flex-1 flex flex-col">
               <div className="space-y-4 mt-4 flex-1">
                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/10">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-zinc-500 uppercase">Total Sales Invoices</span>
                        <FileText className="h-4 w-4 text-primary" />
                     </div>
                     <p className="text-2xl font-bold text-white">21</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/10">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-zinc-500 uppercase">Taxable Value</span>
                        <span className="text-zinc-400 text-xs">INR</span>
                     </div>
                     <p className="text-2xl font-bold text-white">₹ 61.31 L</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/10">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-zinc-500 uppercase">Liability</span>
                        <span className="text-zinc-400 text-xs">INR</span>
                     </div>
                     <p className="text-2xl font-bold text-amber-500">₹ 7.66 L</p>
                  </div>
               </div>

               <div className="mt-auto pt-4 border-t border-white/5">
                  {generating ? (
                     <div className="space-y-3">
                        <div className="flex justify-between text-xs text-zinc-300 font-medium">
                           <span>{simulationStep}</span>
                           <span>{genProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                           <div className="h-full bg-gradient-to-r from-emerald-600 to-primary transition-all duration-100" style={{ width: `${genProgress}%` }}></div>
                        </div>
                     </div>
                  ) : (
                     <button 
                        onClick={handleGenerate}
                        className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                     >
                        <Zap className="h-4 w-4" /> Generate GSTR-1B
                     </button>
                  )}
               </div>
            </BentoCard>
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
          <h2 className="text-2xl font-bold text-white">GSTR-2B Upload</h2>
          <p className="text-zinc-400 text-sm">Upload your GSTR-2B Excel file to continue</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <GlassPanel className="p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {!uploadComplete ? (
            <div className="text-center space-y-6">
              <div className="h-24 w-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                <UploadCloud className="h-12 w-12 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Upload GSTR-2B File</h3>
                <p className="text-zinc-500 text-sm">Select an Excel file from your device</p>
              </div>
              <button
                onClick={triggerFileInput}
                className="px-6 py-3 bg-primary hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <UploadCloud className="h-5 w-5" /> Choose File
              </button>
              <div className="flex gap-2 justify-center">
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400">.xlsx</span>
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400">.xls</span>
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400">.csv</span>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Upload Successful!</h3>
                <p className="text-emerald-400 mt-2">{fileName}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                >
                  Upload Another
                </button>
                <button
                  onClick={onNext}
                  className="px-6 py-2 bg-primary hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  Continue <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </GlassPanel>
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
    
    // Simulate progress while fetching
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        const taskIndex = Math.min(Math.floor((prev / 100) * tasks.length), tasks.length - 1);
        setCurrentTask(taskIndex);
        return prev + 2;
      });
    }, 50);

    // Fetch reconciliation data from Supabase
    try {
      const data = await getReconciliationData();
      console.log('Fetched reconciliation data:', data);
      console.log('Data type:', typeof data);
      console.log('Data keys:', data ? Object.keys(data) : 'null');
      
      if (data) {
        // Check if data has an 'output' property (from your JSON structure)
        const reconOutput = data.output || data;
        console.log('Recon output:', reconOutput);
        console.log('Recon output keys:', reconOutput ? Object.keys(reconOutput) : 'null');
        
        // More flexible validation - just check if data exists and has some expected properties
        if (reconOutput && (reconOutput.metadata || reconOutput.summary || reconOutput.matched_invoices)) {
          setReconData(reconOutput);
          setProgress(100);
          setState('completed');
        } else {
          console.error('Invalid data structure. Expected properties not found.');
          console.error('Data received:', JSON.stringify(data, null, 2).substring(0, 500));
          alert('Invalid reconciliation data structure. Check console for details.');
          setState('idle');
        }
      } else {
        console.error('No data returned from Supabase');
        alert('No reconciliation data found. Please run reconciliation first.');
        setState('idle');
      }
    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      alert('Failed to fetch reconciliation data: ' + (error as Error).message);
      setState('idle');
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (state === 'running' && !loading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setState('completed');
            return 100;
          }
          const taskIndex = Math.min(Math.floor((prev / 100) * tasks.length), tasks.length - 1);
          setCurrentTask(taskIndex);
          return prev + 1;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [state, loading]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Run Reconciliation</h2>
          <p className="text-zinc-400 text-sm">Match your invoices with GSTR-2B and identify discrepancies</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white flex items-center gap-2">
              <Clock className="h-4 w-4" /> Schedule Run
           </button>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white flex items-center gap-2">
              <Settings className="h-4 w-4" /> Settings
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {/* CENTRAL STATUS CARD */}
         <GlassPanel className="min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden p-10">
            
            {/* IDLE STATE */}
            {state === 'idle' && (
               <div className="w-full max-w-2xl text-center space-y-10 animate-in zoom-in-95 duration-300 z-10">
                  <div className="flex flex-col items-center gap-6">
                     <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                        <div className="relative h-24 w-24 rounded-full bg-zinc-900 border-2 border-primary/50 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                           <RefreshCw className="h-10 w-10 text-primary" />
                        </div>
                     </div>
                     <div>
                        <h3 className="text-3xl font-bold text-white">Ready to Reconcile</h3>
                        <div className="flex items-center justify-center gap-2 mt-2 text-zinc-400">
                           <Clock className="h-4 w-4" /> Last run: 23 Nov, 4:00 PM
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <div className="bg-zinc-900/50 border border-white/10 p-4 rounded-xl">
                        <p className="text-xs text-zinc-500 uppercase font-bold">Purchase Invoices</p>
                        <p className="text-2xl font-bold text-white mt-1">823</p>
                     </div>
                     <div className="bg-zinc-900/50 border border-white/10 p-4 rounded-xl">
                        <p className="text-xs text-zinc-500 uppercase font-bold">GSTR-2B Entries</p>
                        <p className="text-2xl font-bold text-white mt-1">856</p>
                     </div>
                     <div className="bg-zinc-900/50 border border-white/10 p-4 rounded-xl">
                        <p className="text-xs text-zinc-500 uppercase font-bold">Est. Time</p>
                        <p className="text-2xl font-bold text-white mt-1">~2 mins</p>
                     </div>
                  </div>

                  <button 
                     onClick={handleRun}
                     className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-500 hover:to-emerald-400 text-white text-lg font-bold rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
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
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" strokeWidth="8" />
                        <circle 
                           cx="50" cy="50" r="45" fill="none" stroke="#10B981" strokeWidth="8" 
                           strokeDasharray="283" 
                           strokeDashoffset={283 - (283 * progress) / 100} 
                           strokeLinecap="round"
                           className="transition-all duration-100 ease-linear"
                        />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-white">{progress}%</span>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <h3 className="text-2xl font-bold text-white animate-pulse">Reconciliation in Progress...</h3>
                     <p className="text-zinc-400 h-6">{tasks[currentTask]}</p>
                  </div>

                  <div className="w-full bg-zinc-900/50 rounded-xl p-4 border border-white/5 flex justify-between text-sm">
                     <span className="text-zinc-500">Processed: <span className="text-white font-mono">{Math.floor((progress/100)*823)}</span></span>
                     <span className="text-zinc-500">Matches: <span className="text-white font-mono">{Math.floor((progress/100)*780)}</span></span>
                     <span className="text-zinc-500">Issues: <span className="text-red-400 font-mono">{Math.floor((progress/100)*43)}</span></span>
                  </div>
               </div>
            )}

            {/* COMPLETED STATE */}
            {state === 'completed' && reconData && (
               <div className="w-full text-left space-y-6 animate-in zoom-in-95 duration-500 z-10">
                  <div className="flex flex-col items-center gap-4 text-center mb-8">
                     <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                        <CheckCircle2 className="h-10 w-10 text-white" />
                     </div>
                     <div>
                        <h3 className="text-3xl font-bold text-white">Reconciliation Complete!</h3>
                        <p className="text-zinc-400">Process finished successfully in {reconData.metadata?.duration_seconds?.toFixed(2) || '0'}s</p>
                        <p className="text-sm text-zinc-500 mt-1">{reconData.metadata?.business_name} • {reconData.metadata?.period}</p>
                     </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                     <GlassPanel className="p-4 bg-emerald-500/10 border-emerald-500/20">
                        <p className="text-xs text-emerald-400 uppercase font-bold">Matched</p>
                        <p className="text-3xl font-bold text-emerald-500 mt-2">{reconData.summary?.matched_count || 0}</p>
                        <p className="text-xs text-zinc-400 mt-1">{reconData.summary?.match_percentage?.toFixed(2) || 0}% Rate</p>
                     </GlassPanel>

                     <GlassPanel className="p-4 bg-red-500/10 border-red-500/20">
                        <p className="text-xs text-red-400 uppercase font-bold">Discrepancies</p>
                        <p className="text-3xl font-bold text-red-500 mt-2">{reconData.summary?.discrepancies?.total || 0}</p>
                        <p className="text-xs text-zinc-400 mt-1">Issues Found</p>
                     </GlassPanel>

                     <GlassPanel className="p-4 bg-blue-500/10 border-blue-500/20">
                        <p className="text-xs text-blue-400 uppercase font-bold">ITC Secured</p>
                        <p className="text-2xl font-bold text-blue-500 mt-2">₹{(reconData.summary?.itc_secured / 100000).toFixed(2)}L</p>
                        <p className="text-xs text-zinc-400 mt-1">Available</p>
                     </GlassPanel>

                     <GlassPanel className="p-4 bg-yellow-500/10 border-yellow-500/20">
                        <p className="text-xs text-yellow-400 uppercase font-bold">ITC at Risk</p>
                        <p className="text-2xl font-bold text-yellow-500 mt-2">₹{(reconData.summary?.itc?.at_risk / 100000).toFixed(2)}L</p>
                        <p className="text-xs text-zinc-400 mt-1">{reconData.summary?.itc?.risk_percentage?.toFixed(2)}%</p>
                     </GlassPanel>

                     <GlassPanel className="p-4 bg-zinc-900/50 border-white/10">
                        <p className="text-xs text-zinc-400 uppercase font-bold">Total Invoices</p>
                        <p className="text-3xl font-bold text-white mt-2">{reconData.summary?.invoices?.unique || 0}</p>
                        <p className="text-xs text-zinc-400 mt-1">Analyzed</p>
                     </GlassPanel>
                  </div>

                  {/* Tabs for different views */}
                  <div className="flex gap-2 border-b border-white/10">
                     <button 
                        onClick={() => setSelectedTab('summary')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${selectedTab === 'summary' ? 'text-white border-b-2 border-primary' : 'text-zinc-400 hover:text-white'}`}
                     >
                        Summary
                     </button>
                     <button 
                        onClick={() => setSelectedTab('matched')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${selectedTab === 'matched' ? 'text-white border-b-2 border-primary' : 'text-zinc-400 hover:text-white'}`}
                     >
                        Matched ({reconData.matched_invoices?.length || 0})
                     </button>
                     <button 
                        onClick={() => setSelectedTab('discrepancies')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${selectedTab === 'discrepancies' ? 'text-white border-b-2 border-primary' : 'text-zinc-400 hover:text-white'}`}
                     >
                        Discrepancies ({reconData.summary?.discrepancies?.total || 0})
                     </button>
                     <button 
                        onClick={() => setSelectedTab('vendors')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${selectedTab === 'vendors' ? 'text-white border-b-2 border-primary' : 'text-zinc-400 hover:text-white'}`}
                     >
                        Vendors ({reconData.vendor_compliance?.total_vendors || 0})
                     </button>
                     <button 
                        onClick={() => setSelectedTab('insights')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${selectedTab === 'insights' ? 'text-white border-b-2 border-primary' : 'text-zinc-400 hover:text-white'}`}
                     >
                        Insights ({reconData.insights?.length || 0})
                     </button>
                  </div>

                  {/* Tab Content */}
                  <div className="min-h-[400px]">
                     {selectedTab === 'summary' && (
                        <div className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Invoice Distribution */}
                              <GlassPanel className="p-6">
                                 <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" /> Invoice Distribution
                                 </h4>
                                 <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                       <span className="text-zinc-400">In Books</span>
                                       <span className="text-white font-bold">{reconData.summary?.invoices?.in_books || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-zinc-400">In GSTR-2B</span>
                                       <span className="text-white font-bold">{reconData.summary?.invoices?.in_gstr2b || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-zinc-400">Unique Total</span>
                                       <span className="text-white font-bold">{reconData.summary?.invoices?.unique || 0}</span>
                                    </div>
                                 </div>
                              </GlassPanel>

                              {/* ITC Analysis */}
                              <GlassPanel className="p-6">
                                 <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" /> ITC Analysis
                                 </h4>
                                 <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                       <span className="text-zinc-400">Available ITC</span>
                                       <span className="text-emerald-500 font-bold">₹{(reconData.itc_analysis?.totals?.available / 100000).toFixed(2)}L</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-zinc-400">Utilized ITC</span>
                                       <span className="text-blue-500 font-bold">₹{(reconData.itc_analysis?.totals?.utilized / 100000).toFixed(2)}L</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-zinc-400">ITC at Risk</span>
                                       <span className="text-red-500 font-bold">₹{(reconData.itc_analysis?.totals?.at_risk / 100000).toFixed(2)}L</span>
                                    </div>
                                 </div>
                              </GlassPanel>
                           </div>

                           {/* Discrepancy Breakdown */}
                           <GlassPanel className="p-6">
                              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                 <AlertTriangle className="h-5 w-5 text-red-500" /> Discrepancy Breakdown
                              </h4>
                              <div className="grid grid-cols-3 gap-4">
                                 <div className="bg-zinc-900/50 border border-red-500/20 p-4 rounded-lg">
                                    <p className="text-xs text-red-400 uppercase font-bold">Missing in Books</p>
                                    <p className="text-2xl font-bold text-white mt-2">{reconData.summary?.discrepancies?.missing_in_books || 0}</p>
                                 </div>
                                 <div className="bg-zinc-900/50 border border-yellow-500/20 p-4 rounded-lg">
                                    <p className="text-xs text-yellow-400 uppercase font-bold">Missing in GSTR-2B</p>
                                    <p className="text-2xl font-bold text-white mt-2">{reconData.summary?.discrepancies?.missing_in_gstr2b || 0}</p>
                                 </div>
                                 <div className="bg-zinc-900/50 border border-orange-500/20 p-4 rounded-lg">
                                    <p className="text-xs text-orange-400 uppercase font-bold">Value Mismatches</p>
                                    <p className="text-2xl font-bold text-white mt-2">{reconData.summary?.discrepancies?.value_mismatches || 0}</p>
                                 </div>
                              </div>
                           </GlassPanel>
                        </div>
                     )}

                     {selectedTab === 'matched' && (
                        <GlassPanel className="p-6">
                           <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                 <thead>
                                    <tr className="border-b border-white/10">
                                       <th className="text-left py-3 px-2 text-zinc-400 font-medium">Invoice No</th>
                                       <th className="text-left py-3 px-2 text-zinc-400 font-medium">Date</th>
                                       <th className="text-left py-3 px-2 text-zinc-400 font-medium">Vendor</th>
                                       <th className="text-right py-3 px-2 text-zinc-400 font-medium">Taxable Value</th>
                                       <th className="text-right py-3 px-2 text-zinc-400 font-medium">Total Tax</th>
                                       <th className="text-right py-3 px-2 text-zinc-400 font-medium">ITC Eligible</th>
                                       <th className="text-center py-3 px-2 text-zinc-400 font-medium">Match Type</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {reconData.matched_invoices?.slice(0, 10).map((invoice: any, idx: number) => (
                                       <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                                          <td className="py-3 px-2 text-white font-mono text-xs">{invoice.invoice_no}</td>
                                          <td className="py-3 px-2 text-zinc-400">{invoice.date}</td>
                                          <td className="py-3 px-2 text-white">{invoice.vendor}</td>
                                          <td className="py-3 px-2 text-right text-white">₹{invoice.taxable_value.toLocaleString()}</td>
                                          <td className="py-3 px-2 text-right text-white">₹{invoice.total_tax.toLocaleString()}</td>
                                          <td className="py-3 px-2 text-right text-emerald-500 font-bold">₹{invoice.itc_eligible.toLocaleString()}</td>
                                          <td className="py-3 px-2 text-center">
                                             <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">{invoice.match_type}</span>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                              {reconData.matched_invoices?.length > 10 && (
                                 <p className="text-center text-zinc-500 text-xs mt-4">Showing 10 of {reconData.matched_invoices.length} matched invoices</p>
                              )}
                           </div>
                        </GlassPanel>
                     )}

                     {selectedTab === 'discrepancies' && (
                        <div className="space-y-4">
                           {/* Missing in Books */}
                           {reconData.discrepancies?.missing_in_books?.invoices?.length > 0 && (
                              <GlassPanel className="p-6 bg-red-500/5 border-red-500/20">
                                 <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <AlertOctagon className="h-5 w-5 text-red-500" /> Missing in Books ({reconData.discrepancies.missing_in_books.count})
                                 </h4>
                                 <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                       <thead>
                                          <tr className="border-b border-white/10">
                                             <th className="text-left py-2 px-2 text-zinc-400 font-medium">Invoice No</th>
                                             <th className="text-left py-2 px-2 text-zinc-400 font-medium">Vendor</th>
                                             <th className="text-right py-2 px-2 text-zinc-400 font-medium">Amount</th>
                                             <th className="text-right py-2 px-2 text-zinc-400 font-medium">Tax</th>
                                             <th className="text-center py-2 px-2 text-zinc-400 font-medium">Priority</th>
                                             <th className="text-left py-2 px-2 text-zinc-400 font-medium">Action</th>
                                          </tr>
                                       </thead>
                                       <tbody>
                                          {reconData.discrepancies.missing_in_books.invoices.map((invoice: any, idx: number) => (
                                             <tr key={idx} className="border-b border-white/5">
                                                <td className="py-2 px-2 text-white font-mono text-xs">{invoice.invoice_no}</td>
                                                <td className="py-2 px-2 text-zinc-400">{invoice.vendor}</td>
                                                <td className="py-2 px-2 text-right text-white">₹{invoice.gross_amount.toLocaleString()}</td>
                                                <td className="py-2 px-2 text-right text-red-400">₹{invoice.tax.toLocaleString()}</td>
                                                <td className="py-2 px-2 text-center">
                                                   <span className={`px-2 py-1 text-xs rounded-full ${invoice.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                      {invoice.priority}
                                                   </span>
                                                </td>
                                                <td className="py-2 px-2 text-zinc-400 text-xs">{invoice.action}</td>
                                             </tr>
                                          ))}
                                       </tbody>
                                    </table>
                                 </div>
                              </GlassPanel>
                           )}

                           {/* Missing in GSTR-2B */}
                           {reconData.discrepancies?.missing_in_gstr2b?.invoices?.length > 0 && (
                              <GlassPanel className="p-6 bg-yellow-500/5 border-yellow-500/20">
                                 <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-500" /> Missing in GSTR-2B ({reconData.discrepancies.missing_in_gstr2b.count})
                                 </h4>
                                 <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                    <table className="w-full text-sm">
                                       <thead className="sticky top-0 bg-zinc-900">
                                          <tr className="border-b border-white/10">
                                             <th className="text-left py-2 px-2 text-zinc-400 font-medium">Invoice No</th>
                                             <th className="text-left py-2 px-2 text-zinc-400 font-medium">Vendor</th>
                                             <th className="text-right py-2 px-2 text-zinc-400 font-medium">Amount</th>
                                             <th className="text-left py-2 px-2 text-zinc-400 font-medium">Reason</th>
                                          </tr>
                                       </thead>
                                       <tbody>
                                          {reconData.discrepancies.missing_in_gstr2b.invoices.slice(0, 8).map((invoice: any, idx: number) => (
                                             <tr key={idx} className="border-b border-white/5">
                                                <td className="py-2 px-2 text-white font-mono text-xs">{invoice.invoice_no}</td>
                                                <td className="py-2 px-2 text-zinc-400">{invoice.vendor}</td>
                                                <td className="py-2 px-2 text-right text-white">₹{invoice.gross_amount.toLocaleString()}</td>
                                                <td className="py-2 px-2 text-zinc-400 text-xs">{invoice.action}</td>
                                             </tr>
                                          ))}
                                       </tbody>
                                    </table>
                                    {reconData.discrepancies.missing_in_gstr2b.invoices.length > 8 && (
                                       <p className="text-center text-zinc-500 text-xs mt-2">Showing 8 of {reconData.discrepancies.missing_in_gstr2b.invoices.length} invoices</p>
                                    )}
                                 </div>
                              </GlassPanel>
                           )}
                        </div>
                     )}

                     {selectedTab === 'vendors' && (
                        <GlassPanel className="p-6">
                           <div className="mb-6 grid grid-cols-3 gap-4">
                              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg">
                                 <p className="text-xs text-emerald-400 uppercase font-bold">Compliant</p>
                                 <p className="text-2xl font-bold text-white mt-1">{reconData.vendor_compliance?.distribution?.compliant || 0}</p>
                              </div>
                              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                                 <p className="text-xs text-yellow-400 uppercase font-bold">At Risk</p>
                                 <p className="text-2xl font-bold text-white mt-1">{reconData.vendor_compliance?.distribution?.at_risk || 0}</p>
                              </div>
                              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                                 <p className="text-xs text-red-400 uppercase font-bold">Non-Compliant</p>
                                 <p className="text-2xl font-bold text-white mt-1">{reconData.vendor_compliance?.distribution?.non_compliant || 0}</p>
                              </div>
                           </div>
                           <div className="overflow-x-auto max-h-96 overflow-y-auto">
                              <table className="w-full text-sm">
                                 <thead className="sticky top-0 bg-zinc-900">
                                    <tr className="border-b border-white/10">
                                       <th className="text-left py-2 px-2 text-zinc-400 font-medium">Vendor</th>
                                       <th className="text-center py-2 px-2 text-zinc-400 font-medium">Score</th>
                                       <th className="text-center py-2 px-2 text-zinc-400 font-medium">Invoices</th>
                                       <th className="text-right py-2 px-2 text-zinc-400 font-medium">ITC Secured</th>
                                       <th className="text-right py-2 px-2 text-zinc-400 font-medium">ITC at Risk</th>
                                       <th className="text-center py-2 px-2 text-zinc-400 font-medium">Status</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {reconData.vendor_compliance?.vendors?.slice(0, 15).map((vendor: any, idx: number) => (
                                       <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                                          <td className="py-2 px-2 text-white">{vendor.name}</td>
                                          <td className="py-2 px-2 text-center">
                                             <span className={`px-2 py-1 rounded-full text-xs font-bold ${vendor.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : vendor.score >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {vendor.score}
                                             </span>
                                          </td>
                                          <td className="py-2 px-2 text-center text-white">{vendor.invoices.matched}/{vendor.invoices.total}</td>
                                          <td className="py-2 px-2 text-right text-emerald-500">₹{(vendor.itc_secured / 1000).toFixed(1)}K</td>
                                          <td className="py-2 px-2 text-right text-red-400">₹{(vendor.itc_at_risk / 1000).toFixed(1)}K</td>
                                          <td className="py-2 px-2 text-center">
                                             <span className={`px-2 py-1 text-xs rounded-full ${vendor.status === 'Compliant' ? 'bg-emerald-500/20 text-emerald-400' : vendor.status === 'At Risk' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {vendor.status}
                                             </span>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </GlassPanel>
                     )}

                     {selectedTab === 'insights' && (
                        <div className="space-y-4">
                           {reconData.insights?.map((insight: any, idx: number) => (
                              <GlassPanel key={idx} className={`p-6 ${insight.severity === 'High' ? 'bg-red-500/5 border-red-500/20' : insight.severity === 'Medium' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
                                 <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                       <div className="flex items-center gap-2 mb-2">
                                          <span className={`px-2 py-1 text-xs rounded-full font-bold ${insight.severity === 'High' ? 'bg-red-500/20 text-red-400' : insight.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                             {insight.severity}
                                          </span>
                                          <h4 className="text-lg font-bold text-white">{insight.title}</h4>
                                       </div>
                                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                          <div>
                                             <p className="text-xs text-zinc-400">Affected Invoices</p>
                                             <p className="text-white font-bold">{insight.affected_invoices}</p>
                                          </div>
                                          <div>
                                             <p className="text-xs text-zinc-400">Amount</p>
                                             <p className="text-white font-bold">₹{(insight.amount / 100000).toFixed(2)}L</p>
                                          </div>
                                          <div>
                                             <p className="text-xs text-zinc-400">ITC at Risk</p>
                                             <p className="text-red-400 font-bold">₹{(insight.itc_at_risk / 100000).toFixed(2)}L</p>
                                          </div>
                                          <div>
                                             <p className="text-xs text-zinc-400">Deadline</p>
                                             <p className="text-white font-bold">{insight.deadline}</p>
                                          </div>
                                       </div>
                                       <p className="text-sm text-zinc-400 mt-3">Vendor: {insight.vendor}</p>
                                    </div>
                                 </div>
                              </GlassPanel>
                           ))}
                        </div>
                     )}
                  </div>

                  <div className="flex justify-center gap-4 mt-8">
                     <button onClick={() => setState('idle')} className="px-6 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white">Run Again</button>
                     <button className="px-6 py-2 bg-primary hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                        <Download className="h-4 w-4" /> Download Full Report
                     </button>
                  </div>
               </div>
            )}

            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none"></div>
         </GlassPanel>
      </div>
    </div>
  );
};

// --- SCREEN 5: ITC MAXIMIZER ---
const ITCMaximizer = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">ITC Claim Maximizer</h2>
          <p className="text-zinc-400 text-sm">Monitor and maximize your eligible Input Tax Credit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <BentoCard className="bg-emerald-500/10 border-emerald-500/30">
            <p className="text-xs text-emerald-400 uppercase font-bold">ITC Available</p>
            <h3 className="text-3xl font-bold text-white mt-2">₹ 8.22 L</h3>
            <p className="text-xs text-zinc-400 mt-1">Eligible for claim</p>
         </BentoCard>
         <BentoCard className="bg-blue-500/10 border-blue-500/30">
            <p className="text-xs text-blue-400 uppercase font-bold">Claimable</p>
            <h3 className="text-3xl font-bold text-white mt-2">₹ 7.54 L</h3>
            <p className="text-xs text-zinc-400 mt-1">Ready to file</p>
         </BentoCard>
         <BentoCard className="bg-red-500/10 border-red-500/30">
            <p className="text-xs text-red-400 uppercase font-bold">Blocked / Lost</p>
            <h3 className="text-3xl font-bold text-white mt-2">₹ 45k</h3>
            <p className="text-xs text-zinc-400 mt-1">Ineligible</p>
         </BentoCard>
         <BentoCard className="bg-amber-500/10 border-amber-500/30">
            <p className="text-xs text-amber-400 uppercase font-bold">Potential Addl.</p>
            <h3 className="text-3xl font-bold text-white mt-2">₹ 22k</h3>
            <p className="text-xs text-zinc-400 mt-1">Action required</p>
         </BentoCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <GlassPanel className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Suggestions & Alerts</h3>
            <div className="space-y-4">
               {[
                  { title: 'Missing Invoices', desc: '12 invoices in GSTR-2B not in books (>30 days)', impact: '₹ 18,500', type: 'High' },
                  { title: 'Vendor Filing', desc: 'Vendor "Alpha Corp" has not filed GSTR-1', impact: '₹ 12,000', type: 'Medium' },
                  { title: 'Amendment Required', desc: 'Tax mismatch in INV-009 (IGST vs CGST)', impact: '₹ 2,400', type: 'Low' },
               ].map((alert, i) => (
                  <div key={i} className="p-4 rounded-xl bg-zinc-900/50 border border-white/10 flex justify-between items-center group hover:border-primary/30 transition-colors">
                     <div className="flex gap-4">
                        <div className={`p-2 rounded-lg h-fit ${alert.type === 'High' ? 'bg-red-500/10 text-red-500' : alert.type === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                           <AlertOctagon className="h-5 w-5" />
                        </div>
                        <div>
                           <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                           <p className="text-xs text-zinc-400 mt-1">{alert.desc}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-bold text-white">{alert.impact}</p>
                        <button className="mt-1 text-xs text-primary hover:underline">Fix Now</button>
                     </div>
                  </div>
               ))}
            </div>
         </GlassPanel>

         <GlassPanel className="p-6 flex flex-col">
            <h3 className="text-lg font-bold text-white mb-4">Vendor Communication</h3>
            <div className="flex-1 bg-zinc-900/30 rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center text-center">
               <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                  <Send className="h-8 w-8 text-zinc-400" />
               </div>
               <p className="text-zinc-300 font-medium">5 Vendors require follow-up</p>
               <p className="text-zinc-500 text-sm mt-1 max-w-xs">Automated reminders drafted for missing invoices and filing delays.</p>
               
               <div className="grid grid-cols-2 gap-4 w-full mt-6">
                  <button className="py-2 rounded-lg bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 text-sm font-bold hover:bg-emerald-600/20">
                     WhatsApp (3)
                  </button>
                  <button className="py-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 text-sm font-bold hover:bg-blue-500/20">
                     Email (2)
                  </button>
               </div>
            </div>
            <div className="mt-4 p-3 bg-zinc-900 border border-white/5 rounded-lg flex justify-between items-center">
               <span className="text-xs text-zinc-500">Live Updates</span>
               <span className="text-xs text-white">Pending Responses: 6 | Alerts Sent: 20</span>
            </div>
         </GlassPanel>
      </div>
    </div>
  );
};

// --- SCREEN 6: FILING OUTPUT ---
const FilingOutput = () => {
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
        "igst": 43445.85,
        "cgst": 148402.25,
        "sgst": 148402.25,
        "cess": 0
      },
      "rcm_itc": 0,
      "details": [
        {
          "row": "4A(5)",
          "desc": "All other ITC (B2B Invoices)",
          "igst": 43388.35,
          "cgst": 148402.25,
          "sgst": 148402.25
        },
        {
          "row": "4A(3)",
          "desc": "Inward supplies liable for reverse charge (net)",
          "igst": 57.5,
          "cgst": -880.25,
          "sgst": -880.25
        }
      ],
      "net_itc": {
        "igst": 43445.85,
        "cgst": 147522,
        "sgst": 147522
      },
      "notes": {
        "4(A)(3)": "Reverse charge ITC adjusted for amendment (₹880.25 CGST/SGST reversed)",
        "4(A)(5)": "B2B invoices total 22 accepted in IMS (₹1,988,836.46 taxable value)"
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
          "paid_itc": 43445.85,
          "cash": 7417.47
        },
        "cgst": {
          "payable": 499135.98,
          "paid_itc": 147522,
          "cash": 351613.98
        },
        "sgst": {
          "payable": 499135.98,
          "paid_itc": 147522,
          "cash": 351613.98
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
        "itc_used": 338489.85,
        "cash_paid": 710645.43,
        "itc_breakup": {
          "igst_to_igst": 43445.85,
          "cgst_to_cgst": 147522,
          "sgst_to_sgst": 147522
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
        "message": "Net ITC matches GSTR-2B available ITC (₹3,38,489.85)"
      },
      {
        "check": "Rounding",
        "status": "PASS",
        "message": "All amounts rounded to 2 decimal places"
      },
      {
        "check": "Reverse Charge",
        "status": "PASS",
        "message": "No reverse charge liability reported in GSTR-1/3B"
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
      "itc_total": 338489.85
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
    const pdfUrl = "https://hbbsmbukdjkgjpogalhq.supabase.co/storage/v1/object/public/Saral_GST/DEV%20KAILASH%20-%20GSTR3B_MAR'25.pdf";
    await downloadFileFromUrl(pdfUrl, "DEV_KAILASH_GSTR3B_MAR25.pdf");
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
          <h2 className="text-2xl font-bold text-white">Draft GSTR-3B & 9B</h2>
          <p className="text-zinc-400 text-sm">Auto-generated drafts ready for final review and filing.</p>
          {gstr3bData && (
            <p className="text-xs text-zinc-500 mt-1">Period: {gstr3bData.period?.month} {gstr3bData.period?.year} • Due: {gstr3bData.period?.due_date}</p>
          )}
        </div>
        <div className="flex gap-2">
           <button onClick={handleDownloadJSON} className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white flex items-center gap-2"><Download className="h-4 w-4" /> JSON</button>
           <button onClick={handleDownloadPDF} className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white flex items-center gap-2"><FileText className="h-4 w-4" /> PDF Summary</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
            <GlassPanel className="p-0 overflow-hidden">
               <div className="p-4 bg-zinc-900/50 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-white">Tax Liability Computation (3B)</h3>
                  <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Verified</span>
               </div>
               <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-zinc-500">
                     <tr>
                        <th className="p-3 pl-4">Description</th>
                        <th className="p-3 text-right">IGST</th>
                        <th className="p-3 text-right">CGST</th>
                        <th className="p-3 text-right">SGST</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     <tr>
                        <td className="p-3 pl-4 text-zinc-300">Outward Taxable Supplies</td>
                        <td className="p-3 text-right font-mono text-zinc-400">₹ {table31?.igst?.toLocaleString() || '0'}</td>
                        <td className="p-3 text-right font-mono text-zinc-400">₹ {table31?.cgst?.toLocaleString() || '0'}</td>
                        <td className="p-3 text-right font-mono text-zinc-400">₹ {table31?.sgst?.toLocaleString() || '0'}</td>
                     </tr>
                     <tr>
                        <td className="p-3 pl-4 text-zinc-300">Eligible ITC</td>
                        <td className="p-3 text-right font-mono text-emerald-500">₹ {itc?.net_itc?.igst?.toLocaleString() || '0'}</td>
                        <td className="p-3 text-right font-mono text-emerald-500">₹ {itc?.net_itc?.cgst?.toLocaleString() || '0'}</td>
                        <td className="p-3 text-right font-mono text-emerald-500">₹ {itc?.net_itc?.sgst?.toLocaleString() || '0'}</td>
                     </tr>
                     <tr className="bg-white/5">
                        <td className="p-3 pl-4 text-white font-bold">Net Payable (Cash)</td>
                        <td className="p-3 text-right font-mono text-white font-bold">₹ {gstr3bData?.tax_payment?.regular?.igst?.cash?.toLocaleString() || '0'}</td>
                        <td className="p-3 text-right font-mono text-white font-bold">₹ {gstr3bData?.tax_payment?.regular?.cgst?.cash?.toLocaleString() || '0'}</td>
                        <td className="p-3 text-right font-mono text-white font-bold">₹ {gstr3bData?.tax_payment?.regular?.sgst?.cash?.toLocaleString() || '0'}</td>
                     </tr>
                  </tbody>
               </table>
            </GlassPanel>

            {gstr3bData?.validation && gstr3bData.validation.length > 0 && (
               <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0 mt-1" />
                  <div>
                     <h4 className="font-bold text-white text-sm">Validation Status</h4>
                     <ul className="text-sm text-zinc-400 mt-2 space-y-1">
                        {gstr3bData.validation.slice(0, 3).map((v: any, idx: number) => (
                           <li key={idx} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{v.message}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
            )}
         </div>

         <div className="space-y-6">
            <BentoCard className="text-center p-8">
               <p className="text-zinc-500 text-sm uppercase mb-2">Net Cash Liability</p>
               <h3 className="text-5xl font-bold text-white">₹ {taxPayment?.cash_paid?.toLocaleString() || '0'}</h3>
               <div className="my-6 h-px bg-white/10"></div>
               <p className="text-xs text-zinc-400 mb-4">
                  Total Liability: ₹{taxPayment?.total_liability?.toLocaleString() || '0'}<br/>
                  ITC Used: ₹{taxPayment?.itc_used?.toLocaleString() || '0'}
               </p>
               <button onClick={handleCreateChallan} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                  <CreditCard className="h-5 w-5" /> Create Challan
               </button>
            </BentoCard>
            
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5">
               <h4 className="text-sm font-bold text-white mb-3">Return Information</h4>
               {gstr3bData && (
                  <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-zinc-400">Business Name:</span>
                        <span className="text-white font-medium">{gstr3bData.taxpayer?.legal_name}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-zinc-400">GSTIN:</span>
                        <span className="text-white font-mono text-xs">{gstr3bData.taxpayer?.gstin}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-zinc-400">Period:</span>
                        <span className="text-white">{gstr3bData.period?.month} {gstr3bData.period?.year}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-zinc-400">Status:</span>
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">{gstr3bData.period?.status}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-zinc-400">Due Date:</span>
                        <span className="text-red-400 font-medium">{gstr3bData.period?.due_date}</span>
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

  const nextStep = () => {
    if (step < 6) setStep((s) => (s + 1) as SimulatorStep);
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => (s - 1) as SimulatorStep);
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
    <div className="min-h-screen pb-20 container mx-auto max-w-7xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">GSTR Compliance Simulator</h1>
        <p className="text-zinc-400 mt-2">Experience the complete end-to-end automation flow</p>
      </div>

      {/* Stepper */}
      <Stepper currentStep={step} steps={stepsLabels} />

      {/* Main Content Container */}
      <div className="relative min-h-[600px]">
        {renderStep()}
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/80 backdrop-blur-lg border-t border-white/10 z-50">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <button 
            onClick={prevStep}
            disabled={step === 1}
            className="px-6 py-2 rounded-lg border border-white/10 text-zinc-300 font-medium hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          
          <div className="text-sm text-zinc-500 font-mono">
            Step {step} of 6
          </div>

          <button 
            onClick={nextStep}
            disabled={step === 6}
            className="px-6 py-2 rounded-lg bg-white text-black font-bold hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-lg shadow-white/10"
          >
            Next Step <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
