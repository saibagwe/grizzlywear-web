/**
 * Invoice Generation Service
 * Generates clean, professional PDF invoices using jsPDF.
 * Stores base64 invoice data back to Firestore on the order document.
 */

import { jsPDF } from 'jspdf';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type InvoiceOrderData = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: {
    name?: string;
    line1?: string;
    line2?: string;
    address?: string;
    city: string;
    state: string;
    pincode: string;
    phone?: string;
  };
  items: {
    name: string;
    size: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt?: any;
};

const GST_NO = '27ABBFG6204A1Z1';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(dateInput?: any): string {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (dateInput?.toDate) {
    d = dateInput.toDate();
  } else if (dateInput?.seconds) {
    d = new Date(dateInput.seconds * 1000);
  } else {
    d = new Date(dateInput);
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 2) + '..';
}

// ─── PDF GENERATION ───────────────────────────────────────────────────────────

export function generateInvoicePDF(order: InvoiceOrderData): string {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Colors
  const black = '#000000';
  const darkGray = '#333333';
  const mediumGray = '#666666';
  const lightGray = '#999999';
  const accentGreen = '#16a34a';
  const lineColor = '#E5E5E5';
  const bgLight = '#FAFAFA';

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  HEADER — Brand + Invoice Info                                          ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  // Top accent line
  pdf.setFillColor(0, 0, 0);
  pdf.rect(0, 0, pageWidth, 3, 'F');

  y = 18;

  // Brand name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(black);
  pdf.text('GRIZZLYWEAR', margin, y);

  // Invoice label on right
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(lightGray);
  pdf.text('TAX INVOICE', pageWidth - margin, y - 5, { align: 'right' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(black);
  pdf.text(`#${order.orderId}`, pageWidth - margin, y + 1, { align: 'right' });

  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(mediumGray);
  pdf.text(`GSTIN: ${GST_NO}`, margin, y);

  pdf.setTextColor(lightGray);
  pdf.setFontSize(9);
  pdf.text(`Date: ${formatDate(order.createdAt)}`, pageWidth - margin, y, { align: 'right' });

  y += 4;

  // Divider line
  y += 4;
  pdf.setDrawColor(lineColor);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  SOLD BY & BILL TO — Two columns                                        ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  const colLeft = margin;
  const colRight = margin + contentWidth / 2 + 5;
  const colHalf = contentWidth / 2 - 5;

  // ── Sold By ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(lightGray);
  pdf.text('SOLD BY', colLeft, y);

  // ── Bill To ──
  pdf.text('BILL TO', colRight, y);

  y += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(black);
  pdf.text('GrizzlyWear', colLeft, y);

  const custName = order.customerName || order.deliveryAddress?.name || 'Customer';
  pdf.text(truncateText(custName, 30), colRight, y);

  y += 4.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(mediumGray);
  pdf.text('Fashion & Lifestyle', colLeft, y);

  if (order.customerEmail) {
    pdf.text(truncateText(order.customerEmail, 35), colRight, y);
  }

  y += 4;
  pdf.text(`GSTIN: ${GST_NO}`, colLeft, y);

  const custPhone = order.customerPhone || order.deliveryAddress?.phone || '';
  if (custPhone) {
    pdf.text(`Phone: ${custPhone}`, colRight, y);
  }

  y += 4;
  pdf.text('India', colLeft, y);

  // Delivery Address
  const addr = order.deliveryAddress;
  const addrLine1 = addr?.line1 || addr?.address || '';
  const addrLine2 = addr?.line2 || '';
  const addrCityLine = [addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(', ');

  if (addrLine1) {
    pdf.text(truncateText(addrLine1, 40), colRight, y);
    y += 4;
    if (addrLine2) {
      pdf.text(truncateText(addrLine2, 40), colRight, y);
      y += 4;
    }
    pdf.text(addrCityLine, colRight, y);
  }

  y += 8;

  // Divider
  pdf.setDrawColor(lineColor);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 2;

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  ITEMS TABLE                                                             ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  // Table header background
  y += 1;
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, y - 1, contentWidth, 8, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(lightGray);

  const colItem = margin + 3;
  const colSize = margin + 85;
  const colQty = margin + 108;
  const colRate = margin + 128;
  const colAmount = pageWidth - margin - 3;

  pdf.text('ITEM', colItem, y + 5);
  pdf.text('SIZE', colSize, y + 5);
  pdf.text('QTY', colQty, y + 5);
  pdf.text('RATE', colRate, y + 5);
  pdf.text('AMOUNT', colAmount, y + 5, { align: 'right' });

  y += 12;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);

  order.items.forEach((item, idx) => {
    const lineTotal = item.price * item.quantity;

    // Zebra stripe
    if (idx % 2 === 1) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, y - 4, contentWidth, 10, 'F');
    }

    pdf.setTextColor(darkGray);
    pdf.setFont('helvetica', 'normal');
    pdf.text(truncateText(item.name, 40), colItem, y);

    pdf.setTextColor(mediumGray);
    pdf.text(item.size || '—', colSize, y);
    pdf.text(String(item.quantity), colQty, y);
    pdf.text(formatCurrency(item.price), colRate, y);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(darkGray);
    pdf.text(formatCurrency(lineTotal), colAmount, y, { align: 'right' });

    y += 10;
  });

  // Bottom table line
  y += 2;
  pdf.setDrawColor(lineColor);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  PRICING SUMMARY — Right-aligned                                        ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  const summaryLabelX = pageWidth - margin - 55;
  const summaryValueX = pageWidth - margin - 3;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(mediumGray);

  // Subtotal
  pdf.text('Subtotal', summaryLabelX, y);
  pdf.setTextColor(darkGray);
  pdf.text(formatCurrency(order.subtotal), summaryValueX, y, { align: 'right' });
  y += 6;

  // Shipping
  pdf.setTextColor(mediumGray);
  pdf.text('Shipping', summaryLabelX, y);
  if (order.shipping === 0) {
    pdf.setTextColor(accentGreen);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FREE', summaryValueX, y, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
  } else {
    pdf.setTextColor(darkGray);
    pdf.text(formatCurrency(order.shipping), summaryValueX, y, { align: 'right' });
  }
  y += 6;

  // Discount (if any)
  if (order.discount > 0) {
    pdf.setTextColor(mediumGray);
    pdf.text('Discount', summaryLabelX, y);
    pdf.setTextColor(accentGreen);
    pdf.text(`-${formatCurrency(order.discount)}`, summaryValueX, y, { align: 'right' });
    y += 6;
  }

  // Total line
  y += 2;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(summaryLabelX - 5, y, pageWidth - margin, y);
  y += 7;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(black);
  pdf.text('TOTAL', summaryLabelX, y);
  pdf.text(formatCurrency(order.total), summaryValueX, y, { align: 'right' });
  y += 4;

  // Total in box
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(summaryLabelX - 5, y, pageWidth - margin, y);

  y += 12;

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  PAYMENT INFO                                                           ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  // Payment info box
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, y - 2, contentWidth, 22, 'F');
  pdf.setDrawColor(lineColor);
  pdf.setLineWidth(0.2);
  pdf.rect(margin, y - 2, contentWidth, 22, 'S');

  const payColLeft = margin + 8;
  const payColRight = margin + contentWidth / 2 + 8;

  y += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(lightGray);
  pdf.text('PAYMENT METHOD', payColLeft, y);
  pdf.text('PAYMENT STATUS', payColRight, y);

  y += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(darkGray);

  const payMethodStr = order.paymentMethod === 'cod' || order.paymentMethod === 'Cash on Delivery'
    ? 'Cash on Delivery'
    : order.paymentMethod === 'razorpay' || order.paymentMethod === 'online'
    ? 'Online Payment'
    : order.paymentMethod;
  pdf.text(payMethodStr, payColLeft, y);

  const payStatusStr = order.paymentStatus === 'paid'
    ? 'Paid'
    : order.paymentStatus === 'pending' || order.paymentStatus === 'unpaid'
    ? 'Pending'
    : order.paymentStatus === 'refunded'
    ? 'Refunded'
    : order.paymentStatus;
  
  // Color the status
  if (payStatusStr === 'Paid') {
    pdf.setTextColor(accentGreen);
  } else if (payStatusStr === 'Pending') {
    pdf.setTextColor('#ca8a04'); // yellow-600
  } else {
    pdf.setTextColor(mediumGray);
  }
  pdf.text(payStatusStr, payColRight, y);

  y += 14;

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  FOOTER — Thank you message                                             ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  // Divider
  pdf.setDrawColor(lineColor);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Thank you text
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(black);
  pdf.text('Thank you for shopping with GrizzlyWear!', pageWidth / 2, y, { align: 'center' });

  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(lightGray);
  pdf.text('If you have any questions about your order, reach out to support@grizzlywear.in', pageWidth / 2, y, { align: 'center' });

  y += 5;
  pdf.text('www.grizzlywear.in', pageWidth / 2, y, { align: 'center' });

  // Bottom accent line
  pdf.setFillColor(0, 0, 0);
  pdf.rect(0, 294, pageWidth, 3, 'F');

  // Computer-generated notice
  pdf.setFontSize(6);
  pdf.setTextColor(lightGray);
  pdf.text('This is a computer-generated invoice and does not require a physical signature.', pageWidth / 2, 290, { align: 'center' });

  // Return as data URI string
  return pdf.output('datauristring');
}

// ─── SAVE INVOICE TO FIRESTORE ────────────────────────────────────────────────

/**
 * Generates the invoice PDF and saves the base64 data to the Firestore order document.
 * Uses updateDoc with merge fields — does NOT overwrite existing order data.
 * Fails silently to avoid blocking the order success flow.
 *
 * @param firestoreDocId The Firestore document ID (NOT the human-readable orderId)
 * @param order The order data for invoice generation
 * @returns The base64 data URI string, or null if generation failed
 */
export async function generateAndSaveInvoice(
  firestoreDocId: string,
  order: InvoiceOrderData
): Promise<string | null> {
  try {
    const pdfBase64 = generateInvoicePDF(order);

    // Save to Firestore — only add invoiceData and invoiceGeneratedAt
    await updateDoc(doc(db, 'orders', firestoreDocId), {
      invoiceData: pdfBase64,
      invoiceGeneratedAt: serverTimestamp(),
    });

    return pdfBase64;
  } catch (err) {
    console.error('[InvoiceService] Failed to generate/save invoice:', err);
    return null;
  }
}

// ─── DOWNLOAD INVOICE ─────────────────────────────────────────────────────────

/**
 * Downloads a PDF from a base64 data URI string.
 */
export function downloadInvoice(pdfBase64: string, orderId: string): void {
  const link = document.createElement('a');
  link.href = pdfBase64;
  link.download = `GrizzlyWear-Invoice-${orderId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Regenerates an invoice from order data and downloads it.
 * Used for older orders that don't have invoiceData saved.
 */
export function regenerateAndDownloadInvoice(order: InvoiceOrderData): void {
  const pdfBase64 = generateInvoicePDF(order);
  downloadInvoice(pdfBase64, order.orderId);
}
