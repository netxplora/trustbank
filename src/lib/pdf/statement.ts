import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface StatementAccount {
  account_number: string;
  account_type: string;
  balance: number;
  currency: string;
}

interface StatementTransaction {
  created_at: string;
  description: string | null;
  reference: string | null;
  amount: number;
  type: string;
}

export function generateStatementPDF(
  customerName: string,
  account: StatementAccount,
  transactions: StatementTransaction[],
  periodName: string
): jsPDF {
  const doc = new jsPDF();
  
  // Crimson Header Color Bar
  doc.setFillColor(150, 20, 40); // HSL Primary: Crimson Red
  doc.rect(0, 0, 210, 15, "F");

  // Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(150, 20, 40);
  doc.text("TRUSTBANK", 14, 32);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("MEMBER FDIC · EQUAL HOUSING LENDER · MEMBER SIPC", 14, 37);

  // Bank Info (Right aligned)
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("TrustBank Premium Banking", 140, 28);
  doc.text("350 Fifth Avenue, Suite 4500, New York, NY 10118", 140, 33);
  doc.text("Email: info@trustbank.com", 140, 38);
  doc.text("Phone: +1 (212) 555-0180", 140, 43);

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 48, 196, 48);

  // Statement Header Info
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Official Account Statement", 14, 58);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Account Holder: ${customerName}`, 14, 65);
  doc.text(`Account Number: ****${account.account_number.slice(-4)}`, 14, 70);
  doc.text(`Account Type: ${account.account_type.toUpperCase()}`, 14, 75);
  doc.text(`Statement Period: ${periodName}`, 14, 80);

  // Balances summary card
  doc.setFillColor(245, 245, 247);
  doc.rect(130, 53, 66, 32, "F");
  doc.setDrawColor(220, 220, 225);
  doc.rect(130, 53, 66, 32, "D");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("STATEMENT SUMMARY", 135, 60);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Starting Balance:", 135, 68);
  doc.text("Ending Balance:", 135, 78);

  const startBalance = transactions.length > 0 ? account.balance - transactions.reduce((sum, tx) => sum + (tx.type === "credit" ? tx.amount : -tx.amount), 0) : account.balance;
  
  doc.text(`$${Number(startBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 190, 68, { align: "right" });
  
  doc.setFont("Helvetica", "bold");
  doc.text(`$${Number(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 190, 78, { align: "right" });

  // Generate transaction rows
  const tableData = transactions.map((t) => {
    const isCredit = t.type === "credit" || t.type === "deposit" || t.type === "loan_disbursement";
    const dateStr = new Date(t.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return [
      dateStr,
      t.description || t.type.replace("_", " ").toUpperCase(),
      t.reference || "—",
      isCredit
        ? `+$${Number(t.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
        : `-$${Number(t.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    ];
  });

  // Render Table
  autoTable(doc, {
    startY: 90,
    head: [["Date", "Description", "Reference Number", "Amount"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [150, 20, 40] },
    styles: { fontSize: 8.5 },
    columnStyles: {
      3: { halign: "right", fontStyle: "bold" },
    },
  });

  // Footer (on the last page)
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "TrustBank Premium Banking is a member of the Federal Deposit Insurance Corporation (FDIC). Deposits are insured up to applicable limits.",
      14,
      287
    );
    doc.text(`Page ${i} of ${totalPages}`, 196, 287, { align: "right" });
  }

  return doc;
}
