/**
 * Invoice Generation Service — GrizzlyWear
 * Professional PDF invoice with GST tax breakdown.
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
const GST_RATE = 18; // 18% GST (9% CGST + 9% SGST) included in price

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function rs(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d?: any): string {
  const dt = !d ? new Date() : d?.toDate ? d.toDate() : d?.seconds ? new Date(d.seconds * 1000) : new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toWords(n: number): string {
  if (n === 0) return 'Zero';
  const o = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const t = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function c(num: number): string {
    if (num < 20) return o[num];
    if (num < 100) return t[Math.floor(num/10)] + (num%10 ? ' ' + o[num%10] : '');
    if (num < 1000) return o[Math.floor(num/100)] + ' Hundred' + (num%100 ? ' ' + c(num%100) : '');
    if (num < 100000) return c(Math.floor(num/1000)) + ' Thousand' + (num%1000 ? ' ' + c(num%1000) : '');
    if (num < 10000000) return c(Math.floor(num/100000)) + ' Lakh' + (num%100000 ? ' ' + c(num%100000) : '');
    return c(Math.floor(num/10000000)) + ' Crore' + (num%10000000 ? ' ' + c(num%10000000) : '');
  }
  const w = Math.floor(n);
  const p = Math.round((n - w) * 100);
  return 'Rupees ' + c(w) + (p > 0 ? ' and ' + c(p) + ' Paise' : '') + ' Only';
}

function clip(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 2) + '..';
}

// ─── PDF PRIMITIVES ───────────────────────────────────────────────────────────

function rgb(h: string) {
  return { r: parseInt(h.slice(1,3),16), g: parseInt(h.slice(3,5),16), b: parseInt(h.slice(5,7),16) };
}
function tc(p: jsPDF, h: string) { const c = rgb(h); p.setTextColor(c.r,c.g,c.b); }
function fc(p: jsPDF, h: string) { const c = rgb(h); p.setFillColor(c.r,c.g,c.b); }
function dc(p: jsPDF, h: string) { const c = rgb(h); p.setDrawColor(c.r,c.g,c.b); }

function fill(p: jsPDF, x: number, y: number, w: number, h: number, color: string) {
  fc(p, color); p.rect(x, y, w, h, 'F');
}

function stroke(p: jsPDF, x: number, y: number, w: number, h: number, color: string, lw = 0.3) {
  dc(p, color); p.setLineWidth(lw); p.rect(x, y, w, h, 'S');
}

function line(p: jsPDF, x1: number, y1: number, x2: number, y2: number, color: string, lw = 0.3) {
  dc(p, color); p.setLineWidth(lw); p.line(x1, y1, x2, y2);
}

// Right-align text within a cell ending at xRight
function textR(p: jsPDF, txt: string, xRight: number, y: number) {
  p.text(txt, xRight, y, { align: 'right' });
}

// ─── GENERATE PDF ─────────────────────────────────────────────────────────────

export function generateInvoicePDF(order: InvoiceOrderData): string {
  const p = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210, M = 14, CW = PW - 2*M, RE = PW - M;
  let y = 0;

  // ════════════════════════════════════════════════════════════════════════
  //  HEADER
  // ════════════════════════════════════════════════════════════════════════

  fill(p, 0, 0, PW, 1.2, '#1a1a1a');
  y = 10;

  p.setFont('helvetica', 'bold');
  p.setFontSize(18);
  tc(p, '#1a1a1a');
  p.text('GRIZZLYWEAR', M, y);

  p.setFontSize(7);
  tc(p, '#999999');
  p.text('Premium Streetwear & Fashion', M, y + 4.5);

  // Right: Tax Invoice title
  p.setFont('helvetica', 'bold');
  p.setFontSize(16);
  tc(p, '#cccccc');
  textR(p, 'TAX INVOICE', RE, y);

  y += 8;
  line(p, M, y, RE, y, '#1a1a1a', 0.5);
  line(p, M, y + 0.7, RE, y + 0.7, '#1a1a1a', 0.12);

  // ════════════════════════════════════════════════════════════════════════
  //  INVOICE META — 4 columns
  // ════════════════════════════════════════════════════════════════════════

  y += 5;
  const mw = CW / 4;

  const meta = [
    ['Invoice No.', order.orderId],
    ['Date', fmtDate(order.createdAt)],
    ['Place of Supply', 'Maharashtra'],
    ['GSTIN', GST_NO],
  ];

  meta.forEach((m2, i) => {
    const cx = M + i * mw;
    p.setFont('helvetica', 'normal'); p.setFontSize(6); tc(p, '#999999');
    p.text(m2[0].toUpperCase(), cx, y);
    p.setFont('helvetica', 'bold'); p.setFontSize(8); tc(p, '#1a1a1a');
    p.text(clip(m2[1], 22), cx, y + 4.5);
  });

  y += 11;
  line(p, M, y, RE, y, '#e5e5e5');

  // ════════════════════════════════════════════════════════════════════════
  //  SELLER / CUSTOMER — side by side
  // ════════════════════════════════════════════════════════════════════════

  y += 4;
  const cardGap = 6;
  const cardW = (CW - cardGap) / 2;
  const LX = M, RX = M + cardW + cardGap;
  const cardH = 36;

  // Seller
  stroke(p, LX, y, cardW, cardH, '#e0e0e0', 0.2);
  fill(p, LX, y, cardW, 6.5, '#f5f5f5');
  line(p, LX, y + 6.5, LX + cardW, y + 6.5, '#e0e0e0', 0.2);

  p.setFont('helvetica', 'bold'); p.setFontSize(6); tc(p, '#777777');
  p.text('SOLD BY', LX + 3, y + 4.5);

  let s = y + 12;
  p.setFont('helvetica', 'bold'); p.setFontSize(8.5); tc(p, '#1a1a1a');
  p.text('GrizzlyWear', LX + 3, s);
  p.setFont('helvetica', 'normal'); p.setFontSize(7); tc(p, '#555555');
  s += 4.5; p.text('Maharashtra, India', LX + 3, s);
  s += 4; p.text('GSTIN: ' + GST_NO, LX + 3, s);
  s += 4; p.text('support@grizzlywear.in', LX + 3, s);
  s += 4; p.text('www.grizzlywear.in', LX + 3, s);

  // Customer
  stroke(p, RX, y, cardW, cardH, '#e0e0e0', 0.2);
  fill(p, RX, y, cardW, 6.5, '#f5f5f5');
  line(p, RX, y + 6.5, RX + cardW, y + 6.5, '#e0e0e0', 0.2);

  p.setFont('helvetica', 'bold'); p.setFontSize(6); tc(p, '#777777');
  p.text('BILL TO / SHIP TO', RX + 3, y + 4.5);

  let c = y + 12;
  const cn = order.customerName || order.deliveryAddress?.name || 'Customer';
  p.setFont('helvetica', 'bold'); p.setFontSize(8.5); tc(p, '#1a1a1a');
  p.text(clip(cn, 28), RX + 3, c);

  p.setFont('helvetica', 'normal'); p.setFontSize(7); tc(p, '#555555');
  const addr = order.deliveryAddress;
  const aLines: string[] = [];
  const a1 = addr?.line1 || addr?.address || '';
  if (a1) aLines.push(clip(a1, 36));
  if (addr?.line2) aLines.push(clip(addr.line2, 36));
  const cityLine = [addr?.city, addr?.state].filter(Boolean).join(', ');
  if (cityLine) aLines.push(cityLine + (addr?.pincode ? ' - ' + addr.pincode : ''));
  const ph2 = order.customerPhone || addr?.phone || '';
  if (ph2) aLines.push('Ph: ' + ph2);
  if (order.customerEmail) aLines.push(clip(order.customerEmail, 36));

  aLines.forEach(l => { c += 4.2; p.text(l, RX + 3, c); });

  y += cardH + 5;

  // ════════════════════════════════════════════════════════════════════════
  //  ITEMS TABLE with Tax columns
  // ════════════════════════════════════════════════════════════════════════

  // Column layout — carefully calculated to fit within margins
  // Total width = CW (182mm)
  // Columns: # (8) | Description (50) | HSN (18) | Size (14) | Qty (12) | Rate (22) | Tax% (14) | Tax Amt (22) | Amount (22)
  const T = M; // table left
  const TW = CW; // table width
  const TR = RE; // table right

  // Absolute X positions for each column start
  const colSr   = T;          // 0
  const colName = T + 8;      // 8
  const colHsn  = T + 58;     // 58
  const colSize = T + 76;     // 76
  const colQty  = T + 90;     // 90
  const colRate = T + 102;    // 102
  const colTaxP = T + 124;    // 124
  const colTaxA = T + 138;    // 138
  const colAmt  = TR;         // right-aligned

  // Table header
  const thH = 7;
  fill(p, T, y, TW, thH, '#1a1a1a');

  p.setFont('helvetica', 'bold'); p.setFontSize(5.5); tc(p, '#ffffff');
  const thy = y + 4.8;
  p.text('#', colSr + 2, thy);
  p.text('DESCRIPTION', colName, thy);
  p.text('HSN', colHsn, thy);
  p.text('SIZE', colSize, thy);
  p.text('QTY', colQty, thy);
  p.text('RATE', colRate, thy);
  p.text('TAX %', colTaxP, thy);
  p.text('TAX AMT', colTaxA, thy);
  textR(p, 'AMOUNT', colAmt - 2, thy);

  y += thH;

  // Table rows
  const rH = 8;

  order.items.forEach((item, i) => {
    const lineTotal = item.price * item.quantity;
    // Calculate tax: price is inclusive of GST
    const taxableValue = lineTotal / (1 + GST_RATE / 100);
    const taxAmt = lineTotal - taxableValue;

    // Alternate row bg
    if (i % 2 === 0) fill(p, T, y, TW, rH, '#fafafa');

    // Row bottom line
    line(p, T, y + rH, TR, y + rH, '#eeeeee', 0.12);

    const ry = y + 5.5;

    // Serial
    p.setFont('helvetica', 'normal'); p.setFontSize(6.5); tc(p, '#aaaaaa');
    p.text(String(i + 1), colSr + 2, ry);

    // Name
    p.setFont('helvetica', 'bold'); p.setFontSize(7); tc(p, '#222222');
    p.text(clip(item.name, 26), colName, ry);

    // HSN (generic apparel code)
    p.setFont('helvetica', 'normal'); p.setFontSize(6.5); tc(p, '#888888');
    p.text('6109', colHsn, ry);

    // Size
    tc(p, '#555555');
    p.text(item.size || '-', colSize, ry);

    // Qty
    tc(p, '#333333');
    p.text(String(item.quantity), colQty, ry);

    // Rate (taxable per unit)
    p.setFontSize(6.5); tc(p, '#555555');
    textR(p, rs(item.price / (1 + GST_RATE / 100)), colRate + 18, ry);

    // Tax %
    tc(p, '#888888');
    p.text(GST_RATE + '%', colTaxP, ry);

    // Tax amount
    tc(p, '#555555');
    textR(p, rs(taxAmt), colTaxA + 18, ry);

    // Total amount
    p.setFont('helvetica', 'bold'); p.setFontSize(7); tc(p, '#111111');
    textR(p, rs(lineTotal), colAmt - 2, ry);

    y += rH;
  });

  // Table bottom
  line(p, T, y, TR, y, '#1a1a1a', 0.5);

  // Totals row
  y += 0.5;
  fill(p, T, y, TW, 7, '#f5f5f5');
  stroke(p, T, y, TW, 7, '#e0e0e0', 0.2);

  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
  const allTaxable = order.subtotal / (1 + GST_RATE / 100);
  const allTax = order.subtotal - allTaxable;

  p.setFont('helvetica', 'bold'); p.setFontSize(6.5); tc(p, '#666666');
  p.text('Total', colSr + 2, y + 5);
  p.text(totalQty + ' item' + (totalQty !== 1 ? 's' : ''), colQty - 2, y + 5);

  tc(p, '#555555');
  textR(p, rs(allTaxable), colRate + 18, y + 5);

  textR(p, rs(allTax), colTaxA + 18, y + 5);

  p.setFont('helvetica', 'bold'); p.setFontSize(7); tc(p, '#111111');
  textR(p, rs(order.subtotal), colAmt - 2, y + 5);

  y += 11;

  // ════════════════════════════════════════════════════════════════════════
  //  TAX BREAKUP + AMOUNT SUMMARY — Two columns
  // ════════════════════════════════════════════════════════════════════════

  const leftBoxW = cardW;
  const rightBoxW = cardW;
  const rightBoxX = RX;

  // ── LEFT: Tax Breakup ──
  p.setFont('helvetica', 'bold'); p.setFontSize(6.5); tc(p, '#999999');
  p.text('TAX BREAKUP', LX, y);
  y += 3;

  const taxBoxH = 28;
  stroke(p, LX, y, leftBoxW, taxBoxH, '#e0e0e0', 0.2);

  // Tax table header
  fill(p, LX, y, leftBoxW, 6, '#f5f5f5');
  line(p, LX, y + 6, LX + leftBoxW, y + 6, '#e0e0e0', 0.2);

  p.setFont('helvetica', 'bold'); p.setFontSize(5.5); tc(p, '#888888');
  const txL = LX + 3;
  const txC = LX + leftBoxW * 0.35;
  const txR2 = LX + leftBoxW * 0.65;
  const txR3 = LX + leftBoxW - 3;
  p.text('TAX TYPE', txL, y + 4.2);
  p.text('RATE', txC, y + 4.2);
  p.text('TAXABLE AMT', txR2, y + 4.2);
  textR(p, 'TAX AMT', txR3, y + 4.2);

  // CGST row
  let txy = y + 11;
  p.setFont('helvetica', 'normal'); p.setFontSize(6.5); tc(p, '#444444');
  p.text('CGST', txL, txy);
  p.text((GST_RATE/2) + '%', txC, txy);
  p.text(rs(allTaxable), txR2, txy);
  textR(p, rs(allTax / 2), txR3, txy);

  // SGST row
  txy += 5;
  line(p, LX + 2, txy - 2.5, LX + leftBoxW - 2, txy - 2.5, '#f0f0f0', 0.1);
  p.text('SGST', txL, txy);
  p.text((GST_RATE/2) + '%', txC, txy);
  p.text(rs(allTaxable), txR2, txy);
  textR(p, rs(allTax / 2), txR3, txy);

  // Total tax
  txy += 5;
  line(p, LX + 2, txy - 2.5, LX + leftBoxW - 2, txy - 2.5, '#dddddd', 0.3);
  p.setFont('helvetica', 'bold'); tc(p, '#222222');
  p.text('Total Tax', txL, txy);
  p.text(GST_RATE + '%', txC, txy);
  textR(p, rs(allTax), txR3, txy);

  // ── RIGHT: Amount Summary ──
  p.setFont('helvetica', 'bold'); p.setFontSize(6.5); tc(p, '#999999');
  p.text('AMOUNT SUMMARY', rightBoxX, y - 3);

  const sumH = taxBoxH;
  stroke(p, rightBoxX, y, rightBoxW, sumH, '#e0e0e0', 0.2);

  const sL = rightBoxX + 4;
  const sR = rightBoxX + rightBoxW - 4;
  let sY2 = y + 6;

  p.setFont('helvetica', 'normal'); p.setFontSize(7); tc(p, '#666666');
  p.text('Taxable Amount', sL, sY2);
  tc(p, '#333333'); textR(p, rs(allTaxable), sR, sY2);

  sY2 += 5.5;
  tc(p, '#666666'); p.text('Total Tax (GST ' + GST_RATE + '%)', sL, sY2);
  tc(p, '#333333'); textR(p, rs(allTax), sR, sY2);

  sY2 += 5.5;
  tc(p, '#666666'); p.text('Shipping', sL, sY2);
  if (order.shipping === 0) {
    p.setFont('helvetica', 'bold'); tc(p, '#16a34a'); textR(p, 'FREE', sR, sY2);
    p.setFont('helvetica', 'normal');
  } else {
    tc(p, '#333333'); textR(p, rs(order.shipping), sR, sY2);
  }

  if (order.discount > 0) {
    sY2 += 5.5;
    tc(p, '#666666'); p.text('Discount', sL, sY2);
    p.setFont('helvetica', 'bold'); tc(p, '#16a34a'); textR(p, '- ' + rs(order.discount), sR, sY2);
    p.setFont('helvetica', 'normal');
  }

  // Grand Total bar
  sY2 += 6;
  const gtY = sY2 - 3;
  fill(p, rightBoxX, gtY, rightBoxW, 8, '#1a1a1a');

  p.setFont('helvetica', 'bold'); p.setFontSize(6.5); tc(p, '#cccccc');
  p.text('GRAND TOTAL', sL, sY2 + 2);
  p.setFontSize(8); tc(p, '#ffffff');
  textR(p, 'Rs. ' + rs(order.total), sR, sY2 + 2);

  y += taxBoxH + 5;

  // Amount in words
  p.setFont('helvetica', 'italic'); p.setFontSize(6.5); tc(p, '#888888');
  p.text('Amount in words:  ' + toWords(order.total), M, y);

  y += 7;

  // ════════════════════════════════════════════════════════════════════════
  //  PAYMENT ROW
  // ════════════════════════════════════════════════════════════════════════

  line(p, M, y, RE, y, '#eeeeee');
  y += 1;

  fill(p, M, y, CW, 6, '#f5f5f5');
  line(p, M, y + 6, RE, y + 6, '#e0e0e0', 0.2);
  p.setFont('helvetica', 'bold'); p.setFontSize(6); tc(p, '#777777');
  p.text('PAYMENT DETAILS', M + 3, y + 4.2);
  y += 9;

  const pW = CW / 4;
  const pLabels = ['Payment Method', 'Payment Status', 'Invoice Amount', 'Order Date'];
  const methodStr = order.paymentMethod === 'cod' ? 'Cash on Delivery'
    : order.paymentMethod === 'razorpay' ? 'Online (Razorpay)'
    : order.paymentMethod;
  const statusStr = order.paymentStatus === 'paid' ? 'PAID'
    : (order.paymentStatus === 'pending' || order.paymentStatus === 'unpaid') ? 'PENDING'
    : order.paymentStatus === 'refunded' ? 'REFUNDED'
    : order.paymentStatus.toUpperCase();
  const pValues = [methodStr, statusStr, 'Rs. ' + rs(order.total), fmtDate(order.createdAt)];

  pLabels.forEach((lbl, i) => {
    const px = M + 3 + i * pW;
    p.setFont('helvetica', 'normal'); p.setFontSize(5.5); tc(p, '#999999');
    p.text(lbl.toUpperCase(), px, y);

    p.setFont('helvetica', 'bold'); p.setFontSize(7.5);
    if (i === 1) {
      tc(p, statusStr === 'PAID' ? '#16a34a' : statusStr === 'PENDING' ? '#d97706' : '#2563eb');
    } else {
      tc(p, '#222222');
    }
    p.text(clip(pValues[i], 20), px, y + 5);
  });

  y += 12;
  line(p, M, y, RE, y, '#eeeeee');

  // ════════════════════════════════════════════════════════════════════════
  //  TERMS
  // ════════════════════════════════════════════════════════════════════════

  if (y < 252) {
    y += 4;
    p.setFont('helvetica', 'bold'); p.setFontSize(6); tc(p, '#bbbbbb');
    p.text('TERMS & CONDITIONS', M, y);
    y += 4;
    p.setFont('helvetica', 'normal'); p.setFontSize(6); tc(p, '#bbbbbb');
    const terms = [
      '1. Goods can be returned/exchanged within 7 days of delivery as per our return policy.',
      '2. For queries regarding this invoice, contact support@grizzlywear.in.',
      '3. This is a computer-generated invoice and does not require a signature.',
      '4. E&OE -- Errors and Omissions Excepted.',
    ];
    terms.forEach(t => { p.text(t, M, y); y += 3.8; });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  FOOTER
  // ════════════════════════════════════════════════════════════════════════

  const fY = 281;
  line(p, M, fY, RE, fY, '#1a1a1a', 0.5);
  line(p, M, fY + 0.7, RE, fY + 0.7, '#1a1a1a', 0.12);

  p.setFont('helvetica', 'bold'); p.setFontSize(7.5); tc(p, '#333333');
  p.text('Thank you for shopping with GrizzlyWear!', PW / 2, fY + 5.5, { align: 'center' });

  p.setFont('helvetica', 'normal'); p.setFontSize(6); tc(p, '#aaaaaa');
  p.text('support@grizzlywear.in  |  www.grizzlywear.in  |  GSTIN: ' + GST_NO, PW / 2, fY + 9.5, { align: 'center' });

  fill(p, 0, 295.5, PW, 1.5, '#1a1a1a');

  return p.output('datauristring');
}

// ─── FIRESTORE & DOWNLOAD ─────────────────────────────────────────────────────

export async function generateAndSaveInvoice(
  firestoreDocId: string,
  order: InvoiceOrderData
): Promise<string | null> {
  try {
    const pdfBase64 = generateInvoicePDF(order);
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

export function downloadInvoice(pdfBase64: string, orderId: string): void {
  const link = document.createElement('a');
  link.href = pdfBase64;
  link.download = `GrizzlyWear-Invoice-${orderId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function regenerateAndDownloadInvoice(order: InvoiceOrderData): void {
  const pdfBase64 = generateInvoicePDF(order);
  downloadInvoice(pdfBase64, order.orderId);
}
