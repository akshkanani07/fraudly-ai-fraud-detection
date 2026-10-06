import "server-only";

import { logger } from "@/lib/logger/logger";
import {
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_CHANNEL_LABELS,
  RISK_LEVEL_LABELS,
  formatCurrency,
} from "@/features/transactions/constants";
import type { TransactionRow } from "@/features/transactions/types";

/* ============================================================
 * CSV
 * ============================================================ */
function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const CSV_HEADERS = [
  "ID",
  "External ID",
  "Date",
  "Amount",
  "Currency",
  "Merchant",
  "Category",
  "Channel",
  "Customer ID",
  "Country",
  "Status",
  "Fraud Label",
  "Risk Level",
  "Fraud Probability",
  "Confidence",
  "Model",
];

export function exportTransactionsToCsv(rows: TransactionRow[]): string {
  const lines: string[] = [CSV_HEADERS.join(",")];

  for (const row of rows) {
    const line = [
      row.id,
      row.externalId,
      row.transactedAt,
      formatCurrency(row.amount, row.currency),
      row.currency,
      row.merchant,
      row.category,
      TRANSACTION_CHANNEL_LABELS[row.channel],
      row.customerId,
      row.country,
      TRANSACTION_STATUS_LABELS[row.status],
      row.isFraudLabel === null ? "" : row.isFraudLabel ? "Fraud" : "Legit",
      row.riskLevel ? RISK_LEVEL_LABELS[row.riskLevel] : "",
      row.riskScore !== null ? (row.riskScore * 100).toFixed(2) + "%" : "",
      row.confidence !== null ? (row.confidence * 100).toFixed(2) + "%" : "",
      row.modelName ? `${row.modelName} v${row.modelVersion}` : "",
    ]
      .map(escapeCsv)
      .join(",");

    lines.push(line);
  }

  return "\uFEFF" + lines.join("\n"); // BOM for Excel UTF-8
}

/* ============================================================
 * Excel (XLSX)
 * ============================================================ */
export async function exportTransactionsToXlsx(
  rows: TransactionRow[],
): Promise<Buffer> {
  try {
    const XLSX = await import("xlsx");

    const data = rows.map((row) => ({
      ID: row.id,
      "External ID": row.externalId ?? "",
      Date: row.transactedAt,
      Amount: row.amount,
      Currency: row.currency,
      Merchant: row.merchant ?? "",
      Category: row.category ?? "",
      Channel: TRANSACTION_CHANNEL_LABELS[row.channel],
      "Customer ID": row.customerId ?? "",
      Country: row.country ?? "",
      Status: TRANSACTION_STATUS_LABELS[row.status],
      "Fraud Label":
        row.isFraudLabel === null ? "" : row.isFraudLabel ? "Fraud" : "Legit",
      "Risk Level": row.riskLevel ? RISK_LEVEL_LABELS[row.riskLevel] : "",
      "Fraud Probability": row.riskScore ?? "",
      Confidence: row.confidence ?? "",
      Model: row.modelName ? `${row.modelName} v${row.modelVersion}` : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as Buffer;

    return buffer;
  } catch (error) {
    logger.error({ error }, "XLSX export failed");
    throw new Error("Failed to generate Excel file");
  }
}

/* ============================================================
 * PDF
 * ============================================================ */
export async function exportTransactionsToPdf(
  rows: TransactionRow[],
): Promise<Buffer> {
  try {
    const PDFDocument = (await import("pdfkit")).default;

    return await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 30,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      /* Header */
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Fraudly — Transaction Report", { align: "left" });

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#666")
        .text(`Generated: ${new Date().toISOString()}`, { align: "left" })
        .text(`Total Records: ${rows.length}`, { align: "left" });

      doc.moveDown(0.5);

      /* Columns */
      const startX = doc.x;
      let y = doc.y + 10;
      const columns = [
        { label: "Date", width: 80 },
        { label: "ID", width: 70 },
        { label: "Amount", width: 70 },
        { label: "Merchant", width: 100 },
        { label: "Channel", width: 60 },
        { label: "Status", width: 60 },
        { label: "Risk", width: 60 },
        { label: "Fraud Prob", width: 70 },
      ];

      /* Table Header */
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#000");
      let x = startX;
      for (const col of columns) {
        doc.text(col.label, x, y, { width: col.width });
        x += col.width;
      }
      y += 14;

      /* Table Rows */
      doc.font("Helvetica").fontSize(7);
      for (const row of rows) {
        if (y > doc.page.height - 50) {
          doc.addPage({ size: "A4", layout: "landscape", margin: 30 });
          y = 40;
        }

        x = startX;
        const values = [
          new Date(row.transactedAt).toLocaleDateString(),
          row.id.slice(0, 8),
          formatCurrency(row.amount, row.currency),
          row.merchant ?? "—",
          TRANSACTION_CHANNEL_LABELS[row.channel],
          TRANSACTION_STATUS_LABELS[row.status],
          row.riskLevel ? RISK_LEVEL_LABELS[row.riskLevel] : "—",
          row.riskScore !== null
            ? (row.riskScore * 100).toFixed(1) + "%"
            : "—",
        ];

        for (let i = 0; i < columns.length; i++) {
          doc.text(String(values[i]), x, y, {
            width: columns[i].width,
            ellipsis: true,
          });
          x += columns[i].width;
        }

        y += 12;
      }

      doc.end();
    });
  } catch (error) {
    logger.error({ error }, "PDF export failed");
    throw new Error("Failed to generate PDF file");
  }
}

/* ============================================================
 * Unified Dispatcher
 * ============================================================ */
export async function exportTransactions(
  rows: TransactionRow[],
  format: "csv" | "xlsx" | "pdf",
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  switch (format) {
    case "csv": {
      const csv = exportTransactionsToCsv(rows);
      return {
        buffer: Buffer.from(csv, "utf-8"),
        contentType: "text/csv; charset=utf-8",
        extension: "csv",
      };
    }
    case "xlsx": {
      const buffer = await exportTransactionsToXlsx(rows);
      return {
        buffer,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        extension: "xlsx",
      };
    }
    case "pdf": {
      const buffer = await exportTransactionsToPdf(rows);
      return {
        buffer,
        contentType: "application/pdf",
        extension: "pdf",
      };
    }
    default:
      throw new Error("Unsupported export format");
  }
}