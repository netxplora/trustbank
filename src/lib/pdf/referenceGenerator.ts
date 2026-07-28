/**
 * Reference Number & Verification Code Generator
 * 
 * Generates unique, prefixed reference numbers and verification codes
 * for all platform documents. Reference numbers are human-readable
 * and include a date component for easy identification.
 */

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes I, O, 0, 1 to avoid confusion

function randomChars(length: number): string {
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += CHARSET[array[i] % CHARSET.length];
  }
  return result;
}

function getDateSegment(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/** Document type → prefix mapping */
const PREFIXES: Record<string, string> = {
  // Banking
  deposit_receipt: 'DEP',
  withdrawal_receipt: 'WDR',
  transfer_receipt: 'TRF',
  internal_transfer_receipt: 'ITR',
  external_transfer_receipt: 'ETR',
  crypto_deposit_receipt: 'CRD',
  crypto_withdrawal_receipt: 'CRW',
  currency_swap_receipt: 'SWP',
  card_purchase_receipt: 'CPR',
  card_replacement_receipt: 'CRP',
  card_activation: 'CAC',
  payment_receipt: 'PAY',

  // Accounts
  account_opening: 'AOC',
  account_statement: 'STM',
  monthly_statement: 'MST',
  annual_statement: 'AST',
  balance_confirmation: 'BAL',

  // Investments
  investment_purchase: 'INP',
  investment_certificate: 'INC',
  portfolio_summary: 'PFS',
  dividend_statement: 'DVS',
  investment_report: 'INR',

  // Loans
  loan_application: 'LNA',
  loan_approval: 'LNP',
  loan_agreement: 'LNG',
  repayment_schedule: 'RPS',
  loan_settlement: 'LNS',

  // Grants
  grant_application: 'GRA',
  grant_approval: 'GRP',
  grant_rejection: 'GRJ',
  grant_certificate: 'GRC',
  grant_payment: 'GRM',

  // Tax
  tax_refund_application: 'TXA',
  tax_refund_approval: 'TXP',
  tax_refund_processing: 'TXR',
  tax_refund_completion: 'TXC',

  // KYC
  kyc_submission: 'KYS',
  kyc_approval: 'KYA',
  kyc_rejection: 'KYR',

  // Security
  password_change: 'SEC',
  login_alert: 'SLA',
  security_alert: 'SAL',
  device_registration: 'SDR',
  two_factor_confirmation: 'S2F',

  // General
  notification: 'NTF',
  invoice: 'INV',
  welcome_letter: 'WEL',
  account_closure: 'ACL',
  general: 'DOC',
};

/**
 * Generate a unique reference number for a document.
 * Format: PREFIX-YYYYMMDD-XXXXXX
 * Example: DEP-20260728-A3X9K2
 */
export function generateReferenceNumber(documentType: string): string {
  const prefix = PREFIXES[documentType] || 'DOC';
  const date = getDateSegment();
  const unique = randomChars(6);
  return `${prefix}-${date}-${unique}`;
}

/**
 * Generate a unique verification code for document authenticity.
 * Format: VER-XXXXXXXXXXXX (12 random chars)
 * Example: VER-A3X9K2B7M4P1
 */
export function generateVerificationCode(): string {
  return `VER-${randomChars(12)}`;
}

/**
 * Generate a document number for display purposes.
 * Format: TB-XXXXXXXXXX (10 random chars)
 * Example: TB-A3X9K2B7M4
 */
export function generateDocumentNumber(): string {
  return `TB-${randomChars(10)}`;
}
