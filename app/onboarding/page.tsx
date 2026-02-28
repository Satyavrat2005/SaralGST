'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, FileText, Phone, Mail, Globe, Hash, User, MapPin,
  ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Loader2, AlertCircle,
  Shield, Calendar, TrendingUp, Briefcase, Lock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ProfileFormData {
  legal_name: string;
  trade_name: string;
  constitution: string;
  business_pan: string;
  email: string;
  phone_number: string;
  gstin: string;
  portal_username: string;
  portal_password: string;
  nature_of_business: string;
  hsn_codes: string;
  sac_codes: string;
  state: string;
  date_of_registration: string;
  filing_frequency: string;
  annual_turnover_range: string;
  registered_address: string;
}

const CONSTITUTION_OPTIONS = [
  'Proprietorship',
  'Partnership',
  'LLP (Limited Liability Partnership)',
  'Private Limited Company',
  'Public Limited Company',
  'HUF (Hindu Undivided Family)',
  'Trust',
  'Society',
  'Government Department',
  'Others',
];

const NATURE_OF_BUSINESS_OPTIONS = [
  'Manufacturer',
  'Trader / Wholesaler',
  'Retailer',
  'Service Provider',
  'Works Contractor',
  'E-Commerce Operator',
  'Import / Export',
  'Job Worker',
  'Others',
];

const FILING_FREQUENCY_OPTIONS = [
  'Monthly (Turnover > ₹5 Cr)',
  'Quarterly (QRMP Scheme)',
];

const TURNOVER_RANGE_OPTIONS = [
  'Up to ₹20 Lakh',
  '₹20 Lakh - ₹1 Crore',
  '₹1 Crore - ₹5 Crore',
  '₹5 Crore - ₹10 Crore',
  '₹10 Crore - ₹50 Crore',
  '₹50 Crore - ₹100 Crore',
  'Above ₹100 Crore',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const STEPS = [
  { id: 1, title: 'Business Identity', description: 'Basic business details', icon: Building2 },
  { id: 2, title: 'Contact & GST', description: 'Contact info & GSTIN', icon: FileText },
  { id: 3, title: 'Portal & Operations', description: 'GST portal & business type', icon: Globe },
  { id: 4, title: 'Filing & Compliance', description: 'Filing frequency & turnover', icon: TrendingUp },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    legal_name: '',
    trade_name: '',
    constitution: '',
    business_pan: '',
    email: '',
    phone_number: '',
    gstin: '',
    portal_username: '',
    portal_password: '',
    nature_of_business: '',
    hsn_codes: '',
    sac_codes: '',
    state: '',
    date_of_registration: '',
    filing_frequency: '',
    annual_turnover_range: '',
    registered_address: '',
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUserId(user.id);
      // Pre-fill email from auth
      setFormData(prev => ({ ...prev, email: user.email || '' }));

      // Check if profile already complete
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('is_profile_complete')
        .eq('user_id', user.id)
        .single();

      if (profile?.is_profile_complete) {
        router.push('/dashboard/sme');
        return;
      }
      setCheckingAuth(false);
    };
    checkUser();
  }, [supabase, router]);

  const updateField = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    setError(null);
    switch (step) {
      case 1:
        if (!formData.legal_name.trim()) {
          setError('Legal Name of Business is required.');
          return false;
        }
        if (!formData.constitution) {
          setError('Please select Constitution of Business.');
          return false;
        }
        if (formData.business_pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.business_pan.toUpperCase())) {
          setError('Please enter a valid PAN (e.g., ABCDE1234F).');
          return false;
        }
        return true;
      case 2:
        if (!formData.email.trim()) {
          setError('Email is required.');
          return false;
        }
        if (!formData.phone_number.trim()) {
          setError('Phone number is required.');
          return false;
        }
        if (formData.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(formData.gstin.toUpperCase())) {
          setError('Please enter a valid 15-digit GSTIN.');
          return false;
        }
        return true;
      case 3:
        if (!formData.nature_of_business) {
          setError('Please select Nature of Business.');
          return false;
        }
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('business_profiles')
        .upsert({
          user_id: userId,
          legal_name: formData.legal_name.trim(),
          trade_name: formData.trade_name.trim() || null,
          constitution: formData.constitution || null,
          business_pan: formData.business_pan.toUpperCase().trim() || null,
          email: formData.email.trim(),
          phone_number: formData.phone_number.trim(),
          gstin: formData.gstin.toUpperCase().trim() || null,
          portal_username: formData.portal_username.trim() || null,
          portal_password: formData.portal_password.trim() || null,
          nature_of_business: formData.nature_of_business || null,
          hsn_codes: formData.hsn_codes.trim() || null,
          sac_codes: formData.sac_codes.trim() || null,
          state: formData.state || null,
          date_of_registration: formData.date_of_registration || null,
          filing_frequency: formData.filing_frequency || null,
          annual_turnover_range: formData.annual_turnover_range || null,
          registered_address: formData.registered_address.trim() || null,
          is_profile_complete: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (upsertError) {
        setError(upsertError.message);
        return;
      }

      router.push('/dashboard/sme');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const renderInputField = (
    label: string,
    field: keyof ProfileFormData,
    icon: React.ReactNode,
    placeholder: string,
    options?: {
      type?: string;
      required?: boolean;
      helpText?: string;
      isPassword?: boolean;
      maxLength?: number;
    }
  ) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
        {options?.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
        <input
          type={options?.isPassword ? 'password' : (options?.type || 'text')}
          value={formData[field]}
          onChange={(e) => updateField(field, e.target.value)}
          maxLength={options?.maxLength}
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
          placeholder={placeholder}
        />
      </div>
      {options?.helpText && (
        <p className="text-xs text-gray-400 mt-1">{options.helpText}</p>
      )}
    </div>
  );

  const renderSelectField = (
    label: string,
    field: keyof ProfileFormData,
    icon: React.ReactNode,
    selectOptions: string[],
    placeholder: string,
    required?: boolean
  ) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
        <select
          value={formData[field]}
          onChange={(e) => updateField(field, e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 text-sm appearance-none cursor-pointer"
        >
          <option value="">{placeholder}</option>
          {selectOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );

  const renderTextareaField = (
    label: string,
    field: keyof ProfileFormData,
    icon: React.ReactNode,
    placeholder: string
  ) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-3 text-gray-400">{icon}</div>
        <textarea
          value={formData[field]}
          onChange={(e) => updateField(field, e.target.value)}
          rows={3}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm resize-none"
          placeholder={placeholder}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 flex flex-col">
      {/* Header */}
      <div className="w-full border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">SaralGST</h1>
              <p className="text-xs text-gray-500">Complete your business profile</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/auth');
            }}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : isActive
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-1.5 font-medium hidden sm:block ${isActive ? 'text-emerald-600' : isCompleted ? 'text-emerald-500' : 'text-gray-400'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 sm:w-16 h-0.5 rounded-full transition-all duration-300 mt-[-16px] sm:mt-[-20px] ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">{STEPS[currentStep - 1].title}</h2>
            <p className="text-sm text-gray-500 mt-1">{STEPS[currentStep - 1].description}</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Business Identity */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {renderInputField('Legal Name of Business', 'legal_name', <Building2 className="h-4 w-4" />, 'e.g., ABC Enterprises Pvt. Ltd.', { required: true })}
              {renderInputField('Trade Name', 'trade_name', <Briefcase className="h-4 w-4" />, 'e.g., ABC Store (optional)', { helpText: 'Brand name or trade name, if different from legal name' })}
              {renderSelectField('Constitution of Business', 'constitution', <Shield className="h-4 w-4" />, CONSTITUTION_OPTIONS, 'Select business type', true)}
              {renderInputField('Business PAN', 'business_pan', <FileText className="h-4 w-4" />, 'e.g., ABCDE1234F', { maxLength: 10, helpText: 'PAN of the business entity' })}
            </div>
          )}

          {/* Step 2: Contact & GST */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {renderInputField('Email', 'email', <Mail className="h-4 w-4" />, 'business@company.com', { type: 'email', required: true })}
              {renderInputField('Phone Number', 'phone_number', <Phone className="h-4 w-4" />, '+91 9876543210', { type: 'tel', required: true })}
              {renderInputField('GSTIN', 'gstin', <Hash className="h-4 w-4" />, 'e.g., 27AABCU9603R1ZM', { maxLength: 15, helpText: '15-digit GST Identification Number' })}
              {renderSelectField('State / UT of Registration', 'state', <MapPin className="h-4 w-4" />, INDIAN_STATES, 'Select state')}
            </div>
          )}

          {/* Step 3: Portal & Operations */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
                <p className="text-xs text-amber-700 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                  Your GST portal credentials are encrypted and stored securely. They are used only for automated filing.
                </p>
              </div>
              {renderInputField('GST Portal Username', 'portal_username', <User className="h-4 w-4" />, 'Your GST portal login username')}
              {renderInputField('GST Portal Password', 'portal_password', <Lock className="h-4 w-4" />, 'Your GST portal password', { isPassword: true })}
              {renderSelectField('Nature of Business', 'nature_of_business', <Briefcase className="h-4 w-4" />, NATURE_OF_BUSINESS_OPTIONS, 'Select nature of business', true)}
              {renderInputField('HSN Codes', 'hsn_codes', <Hash className="h-4 w-4" />, 'e.g., 8471, 3004, 6109 (comma-separated)', { helpText: 'Harmonized System of Nomenclature codes for goods you deal in' })}
              {renderInputField('SAC Codes', 'sac_codes', <Hash className="h-4 w-4" />, 'e.g., 9983, 9971, 9954 (comma-separated)', { helpText: 'Service Accounting Codes for services you provide' })}
            </div>
          )}

          {/* Step 4: Filing & Compliance */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {renderSelectField('Filing Frequency', 'filing_frequency', <Calendar className="h-4 w-4" />, FILING_FREQUENCY_OPTIONS, 'Select filing frequency')}
              {renderSelectField('Annual Turnover Range', 'annual_turnover_range', <TrendingUp className="h-4 w-4" />, TURNOVER_RANGE_OPTIONS, 'Select turnover range')}
              {renderInputField('Date of GST Registration', 'date_of_registration', <Calendar className="h-4 w-4" />, '', { type: 'date' })}
              {renderTextareaField('Registered Address', 'registered_address', <MapPin className="h-4 w-4" />, 'Full registered business address')}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {currentStep > 1 ? (
              <button
                onClick={handlePrev}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors rounded-xl hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 btn-primary-custom font-semibold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 btn-primary-custom font-semibold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Skip option */}
        <div className="text-center mt-4">
          <button
            onClick={async () => {
              // Mark profile as complete even if skipped
              if (userId) {
                await supabase
                  .from('business_profiles')
                  .upsert({
                    user_id: userId,
                    email: formData.email,
                    is_profile_complete: true,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'user_id' });
              }
              router.push('/dashboard/sme');
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
          >
            Skip for now, I&apos;ll complete this later
          </button>
        </div>
      </div>
    </div>
  );
}
