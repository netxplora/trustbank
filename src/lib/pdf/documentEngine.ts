/**
 * TrustBank Corporate Document Engine
 * 
 * Unified PDF generator for all platform documents.
 * Produces professionally branded, A4-layout PDFs with:
 * - Corporate header with logo
 * - Document title and reference info
 * - Customer information block
 * - Flexible content area (key-value rows, tables, paragraphs)
 * - QR verification code
 * - Digital verification footer
 * - Regulatory disclaimer
 * - Page numbers
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { encode } from "uqr";
import { LOGO_BASE64 } from "./logoBase64";

// ─── Types ───────────────────────────────────────────────────────

export interface DocumentConfig {
  /** Document title, e.g. "Deposit Receipt" */
  title: string;
  /** Document type code, e.g. "deposit_receipt" */
  documentType: string;
  /** Category: banking, loans, investments, etc. */
  category: string;
  /** Unique reference number */
  referenceNumber: string;
  /** Verification code for authenticity */
  verificationCode: string;
  /** Date of document generation */
  date: Date;
}

export interface CustomerInfo {
  name: string;
  accountNumber?: string;
  email?: string;
  phone?: string;
  customerId?: string;
}

export interface ContentRow {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}

export interface ContentTable {
  headers: string[];
  rows: string[][];
}

export interface ContentParagraph {
  text: string;
  bold?: boolean;
  fontSize?: number;
}

export type ContentBlock =
  | { type: "rows"; data: ContentRow[] }
  | { type: "table"; data: ContentTable }
  | { type: "paragraph"; data: ContentParagraph }
  | { type: "spacer"; height?: number }
  | { type: "divider" }
  | { type: "heading"; text: string }
  | { type: "status"; label: string; value: string; color: "green" | "red" | "amber" | "blue" };

export interface DocumentOptions {
  config: DocumentConfig;
  customer: CustomerInfo;
  content: ContentBlock[];
  /** Optional: institution info override */
  institution?: {
    name?: string;
    address?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  /** Optional: additional footer text */
  additionalDisclaimer?: string;
  /** Optional: skip QR code */
  skipQR?: boolean;
}

// ─── Color Palette ───────────────────────────────────────────────

const COLORS = {
  primary: [130, 20, 40] as [number, number, number],       // Deep crimson
  primaryLight: [180, 40, 60] as [number, number, number],
  dark: [30, 30, 35] as [number, number, number],
  text: [50, 50, 55] as [number, number, number],
  muted: [120, 120, 130] as [number, number, number],
  light: [200, 200, 210] as [number, number, number],
  bg: [248, 248, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [22, 120, 60] as [number, number, number],
  red: [180, 30, 40] as [number, number, number],
  amber: [180, 120, 20] as [number, number, number],
  blue: [30, 100, 180] as [number, number, number],
};

// ─── Constants ───────────────────────────────────────────────────

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 16;
const MARGIN_RIGHT = 16;
const MARGIN_TOP = 12;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const DEFAULT_INSTITUTION = {
  name: "TrustBank",
  address: "350 Fifth Avenue, Suite 4500, New York, NY 10118",
  email: "support@trustbank.com",
  phone: "+1 (212) 555-0180",
  website: "www.trustbank.com",
};

const DISCLAIMER = "This document is issued by TrustBank and is intended solely for the named recipient. " +
  "It is generated electronically and does not require a physical signature. " +
  "For verification, scan the QR code or visit our verification portal with the verification code provided. " +
  "TrustBank is a member of the Federal Deposit Insurance Corporation (FDIC). Deposits are insured up to applicable limits.";

// ─── QR Code SVG-to-Image Renderer ──────────────────────────────

function generateQRBase64(value: string, size: number = 80): string {
  const { data } = encode(value, { ecc: "M" });
  const moduleCount = data.length;
  const cellSize = size / moduleCount;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, size, size);

  // Dark modules
  ctx.fillStyle = "#000000";
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (data[row][col]) {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }

  return canvas.toDataURL("image/png");
}

// ─── Main Generator ─────────────────────────────────────────────

export function generateDocument(options: DocumentOptions): jsPDF {
  const { config, customer, content, institution, additionalDisclaimer, skipQR } = options;
  const inst = { ...DEFAULT_INSTITUTION, ...institution };
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = MARGIN_TOP;

  // ═══════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════

  // Top color bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 3, "F");

  // Logo
  try {
    doc.addImage(LOGO_BASE64, "PNG", MARGIN_LEFT, y + 2, 12, 12);
  } catch {
    // Fallback: draw a small box if logo fails
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(MARGIN_LEFT, y + 2, 12, 12, 2, 2, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.text("TB", MARGIN_LEFT + 3.5, y + 9.5);
  }

  // Institution name
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.text(inst.name.toUpperCase(), MARGIN_LEFT + 16, y + 9);

  // Tagline
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.muted);
  doc.text("MEMBER FDIC  ·  EQUAL HOUSING LENDER  ·  MEMBER SIPC", MARGIN_LEFT + 16, y + 13);

  // Right side: contact info
  const rightX = PAGE_WIDTH - MARGIN_RIGHT;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.text);
  doc.text(inst.address, rightX, y + 5, { align: "right" });
  doc.text(`Email: ${inst.email}  |  Phone: ${inst.phone}`, rightX, y + 9, { align: "right" });
  doc.text(inst.website, rightX, y + 13, { align: "right" });

  y += 20;

  // Separator line
  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  y += 6;

  // ═══════════════════════════════════════════════════════════════
  // DOCUMENT TITLE BAR
  // ═══════════════════════════════════════════════════════════════

  doc.setFillColor(...COLORS.bg);
  doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 18, 2, 2, "F");

  // Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.dark);
  doc.text(config.title.toUpperCase(), MARGIN_LEFT + 5, y + 7);

  // Reference and date
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Reference: ${config.referenceNumber}`, MARGIN_LEFT + 5, y + 13);

  const dateStr = config.date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = config.date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  doc.text(`${dateStr}  ·  ${timeStr}`, rightX - 5, y + 13, { align: "right" });

  y += 24;

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER INFORMATION BLOCK
  // ═══════════════════════════════════════════════════════════════

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text("ACCOUNT HOLDER", MARGIN_LEFT, y);
  y += 4;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.text(customer.name, MARGIN_LEFT, y);

  // Right side customer details
  const custDetails: string[] = [];
  if (customer.accountNumber) custDetails.push(`Account: ****${customer.accountNumber.slice(-4)}`);
  if (customer.email) custDetails.push(customer.email);
  if (customer.phone) custDetails.push(customer.phone);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.text);
  custDetails.forEach((line, i) => {
    doc.text(line, rightX, y - 4 + (i * 4), { align: "right" });
  });

  y += 6;

  // Thin divider
  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  y += 6;

  // ═══════════════════════════════════════════════════════════════
  // CONTENT BLOCKS
  // ═══════════════════════════════════════════════════════════════

  for (const block of content) {
    // Page break check
    if (y > PAGE_HEIGHT - 60) {
      doc.addPage();
      y = MARGIN_TOP + 10;
    }

    switch (block.type) {
      case "rows": {
        for (const row of block.data) {
          if (y > PAGE_HEIGHT - 60) {
            doc.addPage();
            y = MARGIN_TOP + 10;
          }

          if (row.highlight) {
            doc.setFillColor(...COLORS.bg);
            doc.rect(MARGIN_LEFT, y - 3.5, CONTENT_WIDTH, 6, "F");
          }

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...COLORS.muted);
          doc.text(row.label, MARGIN_LEFT + 2, y);

          doc.setFont("Helvetica", row.bold ? "bold" : "normal");
          doc.setFontSize(8);
          doc.setTextColor(...COLORS.dark);
          doc.text(row.value, rightX - 2, y, { align: "right" });

          y += 7;
        }
        y += 2;
        break;
      }

      case "table": {
        autoTable(doc, {
          startY: y,
          head: [block.data.headers],
          body: block.data.rows,
          theme: "striped",
          headStyles: {
            fillColor: COLORS.primary,
            textColor: COLORS.white,
            fontSize: 7.5,
            fontStyle: "bold",
          },
          bodyStyles: {
            fontSize: 7.5,
            textColor: COLORS.text,
          },
          alternateRowStyles: {
            fillColor: [248, 248, 252],
          },
          styles: {
            cellPadding: 3,
            lineWidth: 0.1,
            lineColor: COLORS.light,
          },
          margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
        break;
      }

      case "paragraph": {
        doc.setFont("Helvetica", block.data.bold ? "bold" : "normal");
        doc.setFontSize(block.data.fontSize || 8.5);
        doc.setTextColor(...COLORS.text);
        const lines = doc.splitTextToSize(block.data.text, CONTENT_WIDTH - 4);
        doc.text(lines, MARGIN_LEFT + 2, y);
        y += lines.length * (block.data.fontSize || 8.5) * 0.45 + 4;
        break;
      }

      case "spacer": {
        y += block.height || 6;
        break;
      }

      case "divider": {
        doc.setDrawColor(...COLORS.light);
        doc.setLineWidth(0.2);
        doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
        y += 5;
        break;
      }

      case "heading": {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(...COLORS.dark);
        doc.text(block.text.toUpperCase(), MARGIN_LEFT, y);
        y += 6;
        break;
      }

      case "status": {
        const colorMap = {
          green: COLORS.green,
          red: COLORS.red,
          amber: COLORS.amber,
          blue: COLORS.blue,
        };
        const statusColor = colorMap[block.color];

        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.roundedRect(MARGIN_LEFT, y - 3.5, CONTENT_WIDTH, 10, 2, 2, "F");

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.white);
        doc.text(block.label, MARGIN_LEFT + 5, y + 2);
        doc.text(block.value.toUpperCase(), rightX - 5, y + 2, { align: "right" });

        y += 14;
        break;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // VERIFICATION FOOTER
  // ═══════════════════════════════════════════════════════════════

  // Ensure footer has room
  if (y > PAGE_HEIGHT - 75) {
    doc.addPage();
    y = MARGIN_TOP + 10;
  }

  y = Math.max(y + 4, PAGE_HEIGHT - 72);

  // Divider before footer
  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  y += 5;

  // Verification section
  doc.setFillColor(...COLORS.bg);
  doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 28, 2, 2, "F");

  // QR Code
  if (!skipQR) {
    try {
      const qrUrl = `${window.location.origin}/verify/${config.verificationCode}`;
      const qrBase64 = generateQRBase64(qrUrl, 200);
      doc.addImage(qrBase64, "PNG", MARGIN_LEFT + 3, y + 2, 24, 24);
    } catch {
      // QR generation failed silently — skip it
    }
  }

  const verX = skipQR ? MARGIN_LEFT + 5 : MARGIN_LEFT + 32;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text("DOCUMENT VERIFICATION", verX, y + 5);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.text);
  doc.text(`Verification Code: ${config.verificationCode}`, verX, y + 10);
  doc.text(`Document Reference: ${config.referenceNumber}`, verX, y + 14);
  doc.text(`Issue Date: ${dateStr}`, verX, y + 18);
  doc.text(`Generated: ${config.date.toISOString()}`, verX, y + 22);

  // Right side: digital signature stamp
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.primary);
  doc.text("DIGITALLY ISSUED", rightX - 5, y + 8, { align: "right" });
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.muted);
  doc.text("This document is electronically", rightX - 5, y + 12, { align: "right" });
  doc.text("generated and verified.", rightX - 5, y + 15.5, { align: "right" });

  y += 34;

  // Disclaimer
  const disclaimerText = additionalDisclaimer
    ? `${DISCLAIMER} ${additionalDisclaimer}`
    : DISCLAIMER;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(...COLORS.muted);
  const disclaimerLines = doc.splitTextToSize(disclaimerText, CONTENT_WIDTH);
  doc.text(disclaimerLines, MARGIN_LEFT, y);

  // Bottom bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, PAGE_HEIGHT - 4, PAGE_WIDTH, 4, "F");

  // Page numbering on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom bar on every page
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, PAGE_HEIGHT - 4, PAGE_WIDTH, 4, "F");

    // Page number
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.white);
    doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 1, { align: "center" });

    // Copyright on every page
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(5);
    doc.text(
      `© ${new Date().getFullYear()} ${inst.name}. All rights reserved.`,
      MARGIN_LEFT + 2,
      PAGE_HEIGHT - 1
    );
  }

  return doc;
}
