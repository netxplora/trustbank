/**
 * Domain-specific document generators built on the unified document engine.
 * Covers: Loans, Investments, Grants, Tax Refunds, KYC
 */

import { generateDocument, ContentBlock } from "./documentEngine";
import { generateReferenceNumber, generateVerificationCode } from "./referenceGenerator";
import type { PDFBrandColors } from "./brandColorForPDF";

// ─── Shared Formatters ───────────────────────────────────────────

const fmt = (n: number, currency = "USD") =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const statusColor = (status: string): "green" | "red" | "amber" | "blue" => {
  const s = status.toLowerCase();
  if (["approved", "active", "completed", "awarded", "paid", "verified"].includes(s)) return "green";
  if (["rejected", "declined", "failed", "closed"].includes(s)) return "red";
  if (["pending", "under_review", "processing", "submitted"].includes(s)) return "amber";
  return "blue";
};

// ─── Types ───────────────────────────────────────────────────────

export interface CustomerData {
  name: string;
  accountNumber?: string;
  email?: string;
  phone?: string;
}

// ═══════════════════════════════════════════════════════════════
// LOAN DOCUMENTS
// ═══════════════════════════════════════════════════════════════

export interface LoanData {
  id: string;
  amount: number;
  tenure_months: number;
  interest_rate?: number;
  status: string;
  purpose?: string | null;
  outstanding_balance?: number | null;
  total_repaid?: number;
  monthly_payment?: number | null;
  created_at: string;
  approved_at?: string | null;
}

export function generateLoanSummaryPDF(customer: CustomerData, loan: LoanData, brandColors?: PDFBrandColors) {
  const refNum = generateReferenceNumber("loan_application");
  const verCode = generateVerificationCode();
  const rate = loan.interest_rate || 5.0;
  const totalExpected = (loan.monthly_payment || 0) * loan.tenure_months;
  const totalInterest = totalExpected - loan.amount;

  // Build repayment schedule (first 12 rows max)
  const scheduleRows: string[][] = [];
  const monthlyRate = rate / 100 / 12;
  let balance = loan.amount;
  const maxRows = Math.min(loan.tenure_months, 12);
  for (let i = 1; i <= maxRows; i++) {
    const interest = balance * monthlyRate;
    const principal = (loan.monthly_payment || 0) - interest;
    balance = Math.max(0, balance - principal);
    scheduleRows.push([
      `Month ${i}`,
      fmt(loan.monthly_payment || 0),
      fmt(principal),
      fmt(interest),
      fmt(balance),
    ]);
  }
  if (loan.tenure_months > 12) {
    scheduleRows.push(["...", "...", "...", "...", `...${loan.tenure_months - 12} more months`]);
  }

  const content: ContentBlock[] = [
    { type: "status", label: "Loan Status", value: loan.status, color: statusColor(loan.status) },
    { type: "spacer", height: 4 },
    { type: "heading", text: "Facility Details" },
    {
      type: "rows",
      data: [
        { label: "Purpose", value: loan.purpose || "General Credit Facility", bold: true },
        { label: "Principal Amount", value: fmt(loan.amount), bold: true, highlight: true },
        { label: "Interest Rate (p.a.)", value: `${rate}%` },
        { label: "Term", value: `${loan.tenure_months} months` },
        { label: "Monthly Payment", value: fmt(loan.monthly_payment || 0) },
        { label: "Outstanding Balance", value: fmt(loan.outstanding_balance || loan.amount) },
        { label: "Total Interest", value: fmt(totalInterest) },
        { label: "Total Repayable", value: fmt(totalExpected), bold: true },
        { label: "Application Date", value: new Date(loan.created_at).toLocaleDateString() },
        ...(loan.approved_at
          ? [{ label: "Approval Date", value: new Date(loan.approved_at).toLocaleDateString() }]
          : []),
      ],
    },
    { type: "divider" },
    { type: "heading", text: "Indicative Repayment Schedule" },
    {
      type: "table",
      data: {
        headers: ["Period", "Payment", "Principal", "Interest", "Balance"],
        rows: scheduleRows,
      },
    },
    { type: "spacer", height: 3 },
    {
      type: "paragraph",
      data: {
        text: "This document is an indicative summary of your credit facility. Final terms are subject to our credit agreement. Interest is calculated on a reducing balance basis.",
        fontSize: 7.5,
      },
    },
  ];

  return {
    pdf: generateDocument({
      config: {
        title: "Credit Facility Summary",
        documentType: "loan_application",
        category: "loans",
        referenceNumber: refNum,
        verificationCode: verCode,
        date: new Date(),
      },
      customer,
      content,
      brandColors,
    }),
    referenceNumber: refNum,
    verificationCode: verCode,
  };
}

// ═══════════════════════════════════════════════════════════════
// INVESTMENT DOCUMENTS
// ═══════════════════════════════════════════════════════════════

export interface InvestmentData {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  sector?: string | null;
}

export function generateInvestmentReceiptPDF(
  customer: CustomerData,
  investment: InvestmentData,
  actionType: "buy" | "sell" = "buy",
  brandColors?: PDFBrandColors
) {
  const refNum = generateReferenceNumber("investment_purchase");
  const verCode = generateVerificationCode();
  const totalValue = investment.shares * investment.current_price;
  const costBasis = investment.shares * investment.purchase_price;
  const gainLoss = totalValue - costBasis;
  const gainLossPct = costBasis > 0 ? ((gainLoss / costBasis) * 100).toFixed(2) : "0.00";

  const content: ContentBlock[] = [
    {
      type: "status",
      label: `${titleCase(actionType)} Order`,
      value: "Executed",
      color: "green",
    },
    { type: "spacer", height: 4 },
    { type: "heading", text: "Order Details" },
    {
      type: "rows",
      data: [
        { label: "Security", value: `${investment.name} (${investment.symbol})`, bold: true },
        { label: "Sector", value: investment.sector || "General" },
        { label: "Action", value: titleCase(actionType), bold: true },
        { label: "Shares / Units", value: investment.shares.toLocaleString(), highlight: true },
        { label: "Execution Price", value: fmt(investment.current_price), bold: true },
        { label: "Total Transaction Value", value: fmt(totalValue), bold: true, highlight: true },
        { label: "Purchase Price (Avg)", value: fmt(investment.purchase_price) },
        { label: "Cost Basis", value: fmt(costBasis) },
        {
          label: "Unrealised Gain / Loss",
          value: `${gainLoss >= 0 ? "+" : ""}${fmt(gainLoss)} (${gainLossPct}%)`,
          bold: true,
        },
        { label: "Trade Date", value: new Date(investment.purchase_date).toLocaleDateString() },
      ],
    },
    { type: "divider" },
    {
      type: "paragraph",
      data: {
        text: "Investment transactions are subject to market risk. Past performance is not indicative of future results. All values are indicative and may vary from final settlement figures.",
        fontSize: 7.5,
      },
    },
  ];

  return {
    pdf: generateDocument({
      config: {
        title: `Investment ${titleCase(actionType)} Receipt`,
        documentType: "investment_purchase",
        category: "investments",
        referenceNumber: refNum,
        verificationCode: verCode,
        date: new Date(),
      },
      customer,
      content,
      brandColors,
    }),
    referenceNumber: refNum,
    verificationCode: verCode,
  };
}

export function generatePortfolioSummaryPDF(
  customer: CustomerData,
  investments: InvestmentData[],
  totalValue: number,
  totalCost: number,
  brandColors?: PDFBrandColors
) {
  const refNum = generateReferenceNumber("portfolio_summary");
  const verCode = generateVerificationCode();
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPct = totalCost > 0 ? ((totalGainLoss / totalCost) * 100).toFixed(2) : "0.00";

  const tableRows = investments.map((inv) => {
    const val = inv.shares * inv.current_price;
    const cost = inv.shares * inv.purchase_price;
    const gl = val - cost;
    return [
      `${inv.symbol}`,
      inv.name,
      inv.shares.toString(),
      fmt(inv.current_price),
      fmt(val),
      `${gl >= 0 ? "+" : ""}${fmt(gl)}`,
    ];
  });

  const content: ContentBlock[] = [
    { type: "heading", text: "Portfolio Summary" },
    {
      type: "rows",
      data: [
        { label: "Total Portfolio Value", value: fmt(totalValue), bold: true, highlight: true },
        { label: "Total Cost Basis", value: fmt(totalCost) },
        {
          label: "Total Gain / Loss",
          value: `${totalGainLoss >= 0 ? "+" : ""}${fmt(totalGainLoss)} (${totalGainLossPct}%)`,
          bold: true,
        },
        { label: "No. of Holdings", value: investments.length.toString() },
        { label: "Report Date", value: new Date().toLocaleDateString() },
      ],
    },
    { type: "divider" },
    { type: "heading", text: "Holdings" },
    {
      type: "table",
      data: {
        headers: ["Symbol", "Security", "Shares", "Price", "Value", "Gain/Loss"],
        rows: tableRows,
      },
    },
    {
      type: "paragraph",
      data: {
        text: "Investment values are based on the latest available prices and may not reflect real-time market data. All figures are for informational purposes only.",
        fontSize: 7.5,
      },
    },
  ];

  return {
    pdf: generateDocument({
      config: {
        title: "Investment Portfolio Summary",
        documentType: "portfolio_summary",
        category: "investments",
        referenceNumber: refNum,
        verificationCode: verCode,
        date: new Date(),
      },
      customer,
      content,
      brandColors,
    }),
    referenceNumber: refNum,
    verificationCode: verCode,
  };
}

// ═══════════════════════════════════════════════════════════════
// GRANT DOCUMENTS
// ═══════════════════════════════════════════════════════════════

export interface GrantApplicationData {
  id: string;
  grant_program_id?: string;
  status: string;
  requested_amount: number;
  approved_amount?: number | null;
  purpose?: string | null;
  business_name?: string | null;
  business_type?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  program?: { name?: string; description?: string } | null;
}

export function generateGrantApplicationReceiptPDF(
  customer: CustomerData,
  grant: GrantApplicationData,
  brandColors?: PDFBrandColors
) {
  const refNum = generateReferenceNumber("grant_application");
  const verCode = generateVerificationCode();
  const isApproved = ["approved", "awarded"].includes(grant.status.toLowerCase());
  const isRejected = ["rejected", "declined"].includes(grant.status.toLowerCase());

  const content: ContentBlock[] = [
    { type: "status", label: "Application Status", value: grant.status, color: statusColor(grant.status) },
    { type: "spacer", height: 4 },
    { type: "heading", text: "Application Details" },
    {
      type: "rows",
      data: [
        { label: "Program", value: grant.program?.name || "Grant Program", bold: true },
        { label: "Business / Organisation", value: grant.business_name || "—" },
        { label: "Business Type", value: grant.business_type || "—" },
        { label: "Requested Amount", value: fmt(grant.requested_amount), bold: true, highlight: true },
        ...(isApproved && grant.approved_amount
          ? [{ label: "Approved Amount", value: fmt(grant.approved_amount), bold: true }]
          : []),
        { label: "Application Date", value: new Date(grant.created_at).toLocaleDateString() },
        ...(grant.reviewed_at
          ? [{ label: "Review Date", value: new Date(grant.reviewed_at).toLocaleDateString() }]
          : []),
      ],
    },
    { type: "divider" },
    {
      type: "paragraph",
      data: {
        text: isApproved
          ? "Your grant application has been approved. Funds will be disbursed to your registered account within the agreed timeline. Please retain this document for your records."
          : isRejected
          ? "We regret that your application did not meet the criteria for this grant cycle. You may reapply in the next available cycle. For enquiries, please contact our support team."
          : "Your grant application has been submitted successfully and is under review. You will be notified of any status updates via your registered contact details.",
        fontSize: 8.5,
      },
    },
  ];

  const docType = isApproved ? "grant_approval" : isRejected ? "grant_rejection" : "grant_application";
  const docTitle = isApproved
    ? "Grant Approval Letter"
    : isRejected
    ? "Grant Rejection Notice"
    : "Grant Application Receipt";

  return {
    pdf: generateDocument({
      config: {
        title: docTitle,
        documentType: docType,
        category: "grants",
        referenceNumber: refNum,
        verificationCode: verCode,
        date: new Date(),
      },
      customer,
      content,
      brandColors,
    }),
    referenceNumber: refNum,
    verificationCode: verCode,
  };
}

// ═══════════════════════════════════════════════════════════════
// TAX REFUND DOCUMENTS
// ═══════════════════════════════════════════════════════════════

export interface TaxRefundData {
  id: string;
  tax_year?: number | null;
  filing_status?: string | null;
  gross_income?: number | null;
  estimated_refund?: number | null;
  status: string;
  submitted_at?: string | null;
  created_at: string;
}

export function generateTaxRefundReceiptPDF(
  customer: CustomerData,
  taxRefund: TaxRefundData,
  brandColors?: PDFBrandColors
) {
  const refNum = generateReferenceNumber("tax_refund_application");
  const verCode = generateVerificationCode();
  const isApproved = ["approved", "completed", "paid"].includes(taxRefund.status.toLowerCase());

  const content: ContentBlock[] = [
    { type: "status", label: "Refund Status", value: taxRefund.status, color: statusColor(taxRefund.status) },
    { type: "spacer", height: 4 },
    { type: "heading", text: "Tax Refund Details" },
    {
      type: "rows",
      data: [
        { label: "Tax Year", value: taxRefund.tax_year ? String(taxRefund.tax_year) : "—", bold: true },
        { label: "Filing Status", value: taxRefund.filing_status ? titleCase(taxRefund.filing_status) : "—" },
        { label: "Gross Income", value: taxRefund.gross_income ? fmt(taxRefund.gross_income) : "—" },
        {
          label: "Estimated Refund",
          value: taxRefund.estimated_refund ? fmt(taxRefund.estimated_refund) : "—",
          bold: true,
          highlight: true,
        },
        { label: "Submission Date", value: taxRefund.submitted_at ? new Date(taxRefund.submitted_at).toLocaleDateString() : "—" },
        { label: "Application Date", value: new Date(taxRefund.created_at).toLocaleDateString() },
      ],
    },
    { type: "divider" },
    {
      type: "paragraph",
      data: {
        text: isApproved
          ? "Your tax refund has been approved. The refund amount will be credited to your registered account. Please allow 3–5 business days for processing."
          : "Your tax refund application has been received and is being processed. Please retain this document as proof of submission. You will be notified of any updates.",
        fontSize: 8.5,
      },
    },
  ];

  const docType = isApproved ? "tax_refund_approval" : "tax_refund_application";
  const docTitle = isApproved ? "Tax Refund Approval Letter" : "Tax Refund Application Receipt";

  return {
    pdf: generateDocument({
      config: {
        title: docTitle,
        documentType: docType,
        category: "tax",
        referenceNumber: refNum,
        verificationCode: verCode,
        date: new Date(),
      },
      customer,
      content,
      brandColors,
    }),
    referenceNumber: refNum,
    verificationCode: verCode,
  };
}

// ═══════════════════════════════════════════════════════════════
// KYC DOCUMENTS
// ═══════════════════════════════════════════════════════════════

export interface KYCData {
  id: string;
  status: string;
  tier?: number | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

export function generateKYCReceiptPDF(customer: CustomerData, kyc: KYCData, brandColors?: PDFBrandColors) {
  const refNum = generateReferenceNumber("kyc_submission");
  const verCode = generateVerificationCode();
  const isApproved = ["approved", "verified"].includes(kyc.status.toLowerCase());
  const isRejected = ["rejected", "declined"].includes(kyc.status.toLowerCase());

  const tierLabel = kyc.tier
    ? { 1: "Tier 1 — Basic", 2: "Tier 2 — Standard", 3: "Tier 3 — Premium" }[kyc.tier] || `Tier ${kyc.tier}`
    : "—";

  const content: ContentBlock[] = [
    { type: "status", label: "Verification Status", value: kyc.status, color: statusColor(kyc.status) },
    { type: "spacer", height: 4 },
    { type: "heading", text: "Verification Record" },
    {
      type: "rows",
      data: [
        { label: "KYC Tier", value: tierLabel, bold: true, highlight: true },
        { label: "Submission Date", value: kyc.submitted_at ? new Date(kyc.submitted_at).toLocaleDateString() : new Date(kyc.created_at).toLocaleDateString() },
        ...(kyc.reviewed_at ? [{ label: "Review Date", value: new Date(kyc.reviewed_at).toLocaleDateString() }] : []),
        ...(isRejected && kyc.rejection_reason ? [{ label: "Rejection Reason", value: kyc.rejection_reason }] : []),
      ],
    },
    { type: "divider" },
    {
      type: "paragraph",
      data: {
        text: isApproved
          ? "Your identity has been successfully verified. You now have access to the features and limits associated with your KYC tier. Please retain this document for your records."
          : isRejected
          ? `Your verification was unsuccessful. Reason: ${kyc.rejection_reason || "Documents did not meet requirements"}. Please resubmit with correct documents or contact support.`
          : "Your identity verification documents have been received and are under review. You will be notified once the review is complete.",
        fontSize: 8.5,
      },
    },
  ];

  const docType = isApproved ? "kyc_approval" : isRejected ? "kyc_rejection" : "kyc_submission";
  const docTitle = isApproved ? "KYC Approval Letter" : isRejected ? "KYC Rejection Notice" : "KYC Submission Receipt";

  return {
    pdf: generateDocument({
      config: {
        title: docTitle,
        documentType: docType,
        category: "kyc",
        referenceNumber: refNum,
        verificationCode: verCode,
        date: new Date(),
      },
      customer,
      content,
      brandColors,
    }),
    referenceNumber: refNum,
    verificationCode: verCode,
  };
}
