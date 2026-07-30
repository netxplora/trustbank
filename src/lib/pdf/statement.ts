/**
 * TrustBank Account Statement PDF Generator
 * Refactored to use the unified corporate document engine.
 */

import { generateDocument, ContentBlock } from "./documentEngine";
import { generateReferenceNumber, generateVerificationCode } from "./referenceGenerator";
import type { PDFBrandColors } from "./brandColorForPDF";

export interface StatementAccount {
  account_number: string;
  account_type: string;
  balance: number;
  currency: string;
}

export interface StatementTransaction {
  created_at: string;
  description: string | null;
  reference: string | null;
  amount: number;
  type: string;
}

export interface StatementCustomer {
  name: string;
  email?: string;
  phone?: string;
  accountNumber?: string;
}

export async function generateStatementPDF(
  customer: StatementCustomer,
  account: StatementAccount,
  transactions: StatementTransaction[],
  periodName: string,
  brandColors?: PDFBrandColors
) {
  const refNum = generateReferenceNumber("account_statement");
  const verCode = generateVerificationCode();

  const isCredit = (t: StatementTransaction) =>
    t.type === "credit" || t.type === "deposit" || t.type === "loan_disbursement";

  const startBalance =
    transactions.length > 0
      ? account.balance -
        transactions.reduce(
          (sum, tx) => sum + (isCredit(tx) ? tx.amount : -tx.amount),
          0
        )
      : account.balance;

  const totalCredits = transactions
    .filter(isCredit)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalDebits = transactions
    .filter((tx) => !isCredit(tx))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const fmt = (n: number) =>
    `${account.currency || "$"}${Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}`;

  const accountTypeName =
    {
      checking: "Private Client Checking",
      savings: "High-Yield Portfolio Reserve",
      investment: "Sovereign Wealth Managed Portfolio",
      credit: "Signature Elite Credit Facility",
      loan: "Institutional Credit Facility",
    }[account.account_type.toLowerCase()] ||
    `${account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account`;

  // Transaction table rows
  const tableRows = transactions.map((t) => {
    const credit = isCredit(t);
    const dateStr = new Date(t.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const amountStr = credit
      ? `+${fmt(t.amount)}`
      : `-${fmt(t.amount)}`;

    return [
      dateStr,
      t.description || t.type.replace(/_/g, " ").toUpperCase(),
      t.reference || "—",
      credit ? amountStr : "",
      !credit ? amountStr : "",
    ];
  });

  const content: ContentBlock[] = [
    {
      type: "rows",
      data: [
        { label: "Account Type", value: accountTypeName, bold: true },
        {
          label: "Account Number",
          value: `****${account.account_number.slice(-4)}`,
        },
        { label: "Statement Period", value: periodName },
        { label: "Currency", value: account.currency || "USD" },
      ],
    },
    { type: "divider" },
    { type: "heading", text: "Period Summary" },
    {
      type: "rows",
      data: [
        { label: "Opening Balance", value: fmt(startBalance) },
        { label: "Total Credits", value: fmt(totalCredits) },
        { label: "Total Debits", value: fmt(totalDebits) },
        {
          label: "Closing Balance",
          value: fmt(account.balance),
          bold: true,
          highlight: true,
        },
        { label: "Total Transactions", value: String(transactions.length) },
      ],
    },
    { type: "divider" },
    { type: "heading", text: "Transaction History" },
    transactions.length === 0
      ? {
          type: "paragraph",
          data: {
            text: "No transactions were recorded during this statement period.",
          },
        }
      : {
          type: "table",
          data: {
            headers: ["Date", "Description", "Reference", "Credit", "Debit"],
            rows: tableRows,
          },
        },
  ];

  return await generateDocument({
    config: {
      title: "Official Account Statement",
      documentType: "account_statement",
      category: "accounts",
      referenceNumber: refNum,
      verificationCode: verCode,
      date: new Date(),
    },
    customer: {
      name: customer.name,
      accountNumber: account.account_number,
      email: customer.email,
      phone: customer.phone,
    },
    content,
    brandColors,
    additionalDisclaimer:
      "This statement is provided for your records. Please review all transactions and report any discrepancies within 30 days of the statement date.",
  });
}
