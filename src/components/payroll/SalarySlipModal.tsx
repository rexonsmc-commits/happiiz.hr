/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  Calendar,
  CheckCircle,
  ShieldCheck,
  User,
  CreditCard,
  Briefcase,
  MapPin,
  IndianRupee,
} from 'lucide-react';
import { PayrollEntry, Company } from '../../types';
import { formatINR, numberToIndianWords } from '../../services/payrollService';

interface SalarySlipModalProps {
  entry: PayrollEntry;
  company: Company | null;
  onClose: () => void;
}

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({
  entry,
  company,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const slipText = `
================================================================================
                    ${company?.name || 'HAPPIIZ HR WORKFORCE PVT LTD'}
         ${company?.address || 'Corporate Tower, Phase II'}, ${company?.city || 'Gurugram'}, ${company?.state || 'Haryana'}
                    PAYSLIP FOR THE MONTH OF ${entry.period.toUpperCase()}
================================================================================
Employee Code   : ${entry.employeeCode}
Employee Name   : ${entry.employeeName}
Designation     : ${entry.designation}
Department      : ${entry.department}
Assigned Site   : ${entry.siteName}
Bank Name       : ${entry.bankName || 'HDFC Bank Ltd'}
Account Number  : ${entry.bankAccountMasked || '•••• •••• 4857'}
IFSC Code       : ${entry.ifscCode || 'HDFC0001829'}
PAN Number      : ${entry.panNumberMasked || 'AB•••••4F'}
--------------------------------------------------------------------------------
ATTENDANCE SUMMARY:
Total Scheduled Days: ${entry.scheduledDays}
Present Days        : ${entry.presentDays}
Half Days (x0.5)    : ${entry.halfDays}
Paid Leaves         : ${entry.paidLeaveDays}
Weekly Offs         : ${entry.weeklyOffDays}
Holiday Duty        : ${entry.holidayDays}
Absent Days         : ${entry.absentDays}
Total Payable Days  : ${entry.payableDays}
Overtime Hours      : ${entry.overtimeHours} hrs
Double Duty Shifts  : ${entry.doubleDutyCount} shifts
--------------------------------------------------------------------------------
EARNINGS (INR)                        | DEDUCTIONS (INR)
--------------------------------------|-----------------------------------------
Basic Salary Earned      : ${entry.basicEarned.toFixed(2).padStart(10)} | Provident Fund (EPF)  : ${entry.pfEmployee.toFixed(2).padStart(10)}
HRA Earned               : ${entry.hraEarned.toFixed(2).padStart(10)} | ESI Contribution      : ${entry.esiEmployee.toFixed(2).padStart(10)}
Allowances Earned        : ${entry.allowancesEarned.toFixed(2).padStart(10)} | Professional Tax (PT) : ${entry.ptAmount.toFixed(2).padStart(10)}
Overtime Pay             : ${entry.overtimeAmount.toFixed(2).padStart(10)} | TDS / Tax Withheld    : ${entry.tdsAmount.toFixed(2).padStart(10)}
Double Duty Pay          : ${entry.doubleDutyAmount.toFixed(2).padStart(10)} | Salary Advance Recover: ${entry.advanceDeduction.toFixed(2).padStart(10)}
Bonus / Incentives       : ${entry.bonusAmount.toFixed(2).padStart(10)} | Uniform / Equipment   : ${entry.uniformEquipmentDeduction.toFixed(2).padStart(10)}
--------------------------------------|-----------------------------------------
TOTAL GROSS EARNINGS     : ${entry.totalGrossSalary.toFixed(2).padStart(10)} | TOTAL DEDUCTIONS      : ${entry.totalDeductions.toFixed(2).padStart(10)}
--------------------------------------------------------------------------------
NET PAYABLE SALARY       : INR ${entry.netPayable.toFixed(2)}
IN WORDS                 : ${numberToIndianWords(entry.netPayable)}
--------------------------------------------------------------------------------
EMPLOYER CONTRIBUTIONS:
EPF Employer (12%)       : INR ${entry.pfEmployer.toFixed(2)}
ESIC Employer (3.25%)    : INR ${entry.esiEmployer.toFixed(2)}
Total Cost To Company    : INR ${entry.totalCostToCompany.toFixed(2)}
================================================================================
Note: This is a system generated document and does not require a physical signature.
Generated via Happiiz HR SaaS Platform
`;

    const blob = new Blob([slipText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payslip_${entry.employeeCode}_${entry.period}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn border border-slate-200">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center border border-blue-400/30">
              <IndianRupee className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Employee Salary Slip</h2>
              <p className="text-xs text-slate-300">
                {entry.employeeName} ({entry.employeeCode}) • Period: {entry.period}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
              title="Print A4 Payslip"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4</span>
            </button>
            <button
              onClick={handleDownloadText}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
              title="Download Statement"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50">
          <div
            ref={printRef}
            className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-3xl mx-auto print:border-none print:shadow-none print:p-0"
          >
            {/* Payslip Header */}
            <div className="border-b-2 border-slate-800 pb-5 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {company?.name || 'HAPPIIZ HR WORKFORCE SERVICES'}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 max-w-md">
                    {company?.address ? `${company.address}, ` : 'Sector 44, Institutional Area, '}
                    {company?.city || 'Gurugram'}, {company?.state || 'Haryana'} - {company?.pinCode || '122003'}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-2 font-mono">
                    <span>GSTIN: {company?.gstNumber || company?.taxId || '07AAAAA0000A1Z5'}</span>
                    <span>PF Reg: DL/GGM/0048291/000</span>
                    <span>ESIC Reg: 11000849200001001</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider mb-2">
                    Salary Payslip
                  </div>
                  <p className="text-xs font-bold text-slate-700">Month: {entry.period}</p>
                  <p className="text-[11px] text-slate-500">Pay Date: 07-{entry.period.split('-')[1]}-{entry.period.split('-')[0]}</p>
                </div>
              </div>
            </div>

            {/* Employee Details Grid */}
            <div className="bg-slate-50/70 rounded-lg p-4 mb-6 border border-slate-200/80">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Employee Name</span>
                  <span className="font-bold text-slate-900">{entry.employeeName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Employee Code</span>
                  <span className="font-mono font-bold text-slate-800">{entry.employeeCode}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Designation</span>
                  <span className="font-medium text-slate-800">{entry.designation}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Department</span>
                  <span className="font-medium text-slate-800">{entry.department}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Assigned Site</span>
                  <span className="font-medium text-slate-800 truncate block">{entry.siteName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Salary Type</span>
                  <span className="font-medium capitalize text-slate-800">{entry.salaryType} Wage</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Bank Account</span>
                  <span className="font-mono text-slate-800">{entry.bankAccountMasked || '•••• 4857'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Bank & IFSC</span>
                  <span className="font-mono text-slate-800 truncate block">{entry.bankName || 'HDFC'} ({entry.ifscCode || 'HDFC0001829'})</span>
                </div>
              </div>
            </div>

            {/* Attendance & Wage Metrics Summary */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Attendance & Duty Metrics
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-100 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Total Days</span>
                  <span className="font-bold text-slate-800">{entry.scheduledDays}</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 block">Present Days</span>
                  <span className="font-bold text-emerald-800">{entry.presentDays}</span>
                </div>
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="text-[10px] text-blue-700 block">Weekly Off / Hol</span>
                  <span className="font-bold text-blue-800">{entry.weeklyOffDays + entry.holidayDays}</span>
                </div>
                <div className="p-2 bg-amber-50 rounded border border-amber-200">
                  <span className="text-[10px] text-amber-700 block">Payable Days</span>
                  <span className="font-bold text-amber-800">{entry.payableDays}</span>
                </div>
                <div className="p-2 bg-indigo-50 rounded border border-indigo-200">
                  <span className="text-[10px] text-indigo-700 block">Overtime (OT)</span>
                  <span className="font-bold text-indigo-800">{entry.overtimeHours} hrs</span>
                </div>
                <div className="p-2 bg-purple-50 rounded border border-purple-200">
                  <span className="text-[10px] text-purple-700 block">Double Duty</span>
                  <span className="font-bold text-purple-800">{entry.doubleDutyCount} Shifts</span>
                </div>
              </div>
            </div>

            {/* Earnings vs Deductions Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
              <div className="grid grid-cols-2 divide-x divide-slate-300">
                {/* Earnings Side */}
                <div>
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Earnings Components</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Amount (INR)</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="px-4 py-2 flex justify-between">
                      <span className="text-slate-600">Basic Wage Earned</span>
                      <span className="font-medium font-mono text-slate-900">{formatINR(entry.basicEarned)}</span>
                    </div>
                    <div className="px-4 py-2 flex justify-between">
                      <span className="text-slate-600">House Rent Allowance (HRA)</span>
                      <span className="font-medium font-mono text-slate-900">{formatINR(entry.hraEarned)}</span>
                    </div>
                    <div className="px-4 py-2 flex justify-between">
                      <span className="text-slate-600">Conveyance & Special Allowances</span>
                      <span className="font-medium font-mono text-slate-900">{formatINR(entry.allowancesEarned)}</span>
                    </div>
                    <div className="px-4 py-2 flex justify-between">
                      <span className="text-slate-600">Overtime Wages ({entry.overtimeHours} hrs)</span>
                      <span className="font-medium font-mono text-slate-900">{formatINR(entry.overtimeAmount)}</span>
                    </div>
                    <div className="px-4 py-2 flex justify-between">
                      <span className="text-slate-600">Double Duty Allowance ({entry.doubleDutyCount} shifts)</span>
                      <span className="font-medium font-mono text-slate-900">{formatINR(entry.doubleDutyAmount)}</span>
                    </div>
                    {entry.bonusAmount > 0 && (
                      <div className="px-4 py-2 flex justify-between">
                        <span className="text-slate-600">Bonus & Performance Incentive</span>
                        <span className="font-medium font-mono text-slate-900">{formatINR(entry.bonusAmount)}</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-100/70 px-4 py-2.5 border-t border-slate-300 flex justify-between font-bold text-xs text-slate-900">
                    <span>Total Gross Earnings (A)</span>
                    <span className="font-mono text-emerald-700">{formatINR(entry.totalGrossSalary)}</span>
                  </div>
                </div>

                {/* Deductions Side */}
                <div>
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Deductions</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Amount (INR)</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="px-4 py-2 flex justify-between">
                      <span className="text-slate-600">Provident Fund (EPF 12%)</span>
                      <span className="font-medium font-mono text-slate-900">{formatINR(entry.pfEmployee)}</span>
                    </div>
                    <div className="px-4 py-2 flex justify-between">
                      <span className="text-slate-600">Employee State Insurance (ESIC 0.75%)</span>
                      <span className="font-medium font-mono text-slate-900">{formatINR(entry.esiEmployee)}</span>
                    </div>
                    <div className="px-4 py-2 flex justify-between">
                      <span className="text-slate-600">Professional Tax (PT)</span>
                      <span className="font-medium font-mono text-slate-900">{formatINR(entry.ptAmount)}</span>
                    </div>
                    <div className="px-4 py-2 flex justify-between">
                      <span className="text-slate-600">TDS / Income Tax</span>
                      <span className="font-medium font-mono text-slate-900">{formatINR(entry.tdsAmount)}</span>
                    </div>
                    <div className="px-4 py-2 flex justify-between">
                      <span className="text-slate-600">Advance Salary Recovery</span>
                      <span className="font-medium font-mono text-amber-700">{formatINR(entry.advanceDeduction)}</span>
                    </div>
                    <div className="px-4 py-2 flex justify-between">
                      <span className="text-slate-600">Uniform / Equipment Deduction</span>
                      <span className="font-medium font-mono text-amber-700">{formatINR(entry.uniformEquipmentDeduction)}</span>
                    </div>
                  </div>
                  <div className="bg-slate-100/70 px-4 py-2.5 border-t border-slate-300 flex justify-between font-bold text-xs text-slate-900">
                    <span>Total Deductions (B)</span>
                    <span className="font-mono text-rose-700">{formatINR(entry.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500/40 rounded-xl p-5 mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-blue-900 block">
                    Net Take-Home Salary (A - B)
                  </span>
                  <p className="text-xs text-blue-700 mt-1 italic">
                    {numberToIndianWords(entry.netPayable)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-blue-950">
                    {formatINR(entry.netPayable)}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold block uppercase tracking-wider">
                    {entry.paymentStatus === 'paid' ? '✓ Paid & Credited' : 'Pending Bank Clearance'}
                  </span>
                </div>
              </div>
            </div>

            {/* Employer Contribution Summary */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-6 text-slate-600 flex flex-wrap justify-between items-center">
              <div>
                <span className="font-bold text-slate-800">Employer Statutory Contribution: </span>
                <span>EPF (12%): {formatINR(entry.pfEmployer)}</span> |{' '}
                <span>ESIC (3.25%): {formatINR(entry.esiEmployer)}</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">Total CTC: </span>
                <span className="font-mono font-bold text-slate-900">{formatINR(entry.totalCostToCompany)}</span>
              </div>
            </div>

            {/* Signature & Disclaimer */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-slate-400 text-[11px] flex flex-col sm:flex-row justify-between items-end gap-6">
              <div className="text-left max-w-sm">
                <p className="font-medium text-slate-500 mb-1">Important Note:</p>
                <p>
                  This document is computer generated from Happiiz HR and requires no physical seal or signature. For discrepancies, reach HR within 5 days of disbursement.
                </p>
              </div>

              <div className="text-center sm:text-right">
                <div className="h-10 w-36 border-b border-dashed border-slate-300 mx-auto sm:ml-auto"></div>
                <p className="text-[10px] uppercase font-bold text-slate-600 mt-1">Authorized Signatory</p>
                <p className="text-[9px] text-slate-400">{company?.name || 'Happiiz HR Services'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
