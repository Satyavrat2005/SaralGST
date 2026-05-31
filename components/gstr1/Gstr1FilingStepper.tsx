'use client';

import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export type FilingStepId =
  | 'generate'
  | 'review'
  | 'validate'
  | 'auth'
  | 'save'
  | 'submit'
  | 'file';

interface Step {
  id: FilingStepId;
  label: string;
  done: boolean;
  active: boolean;
}

interface Props {
  returnStatus: string | undefined;
  hasInvoices: boolean;
  isAuthenticated: boolean;
  isValidated: boolean;
  currentAction: string | null;
}

export function Gstr1FilingStepper({
  returnStatus,
  hasInvoices,
  isAuthenticated,
  isValidated,
  currentAction,
}: Props) {
  const filed = returnStatus === 'filed';
  const submitted = returnStatus === 'submitted' || filed;
  const generated = hasInvoices || returnStatus === 'generated' || returnStatus === 'validated' || submitted;

  const steps: Step[] = [
    { id: 'generate', label: 'Generate', done: generated, active: currentAction === 'generate' },
    { id: 'review', label: 'Review', done: generated, active: false },
    { id: 'validate', label: 'Validate', done: isValidated || submitted, active: currentAction === 'validate' },
    { id: 'auth', label: 'Portal Auth', done: isAuthenticated, active: currentAction === 'auth' },
    { id: 'save', label: 'Save', done: submitted, active: currentAction === 'save' },
    { id: 'submit', label: 'Submit', done: submitted, active: currentAction === 'submit' },
    { id: 'file', label: 'File EVC', done: filed, active: currentAction === 'file' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              step.done
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : step.active
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}
          >
            {step.active ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : step.done ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Circle className="h-3 w-3" />
            )}
            {step.label}
          </div>
          {idx < steps.length - 1 && <span className="text-gray-300">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
