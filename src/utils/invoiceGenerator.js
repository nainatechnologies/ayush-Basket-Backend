/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Utility: invoiceGenerator.js
 */

const PDFDocument = require('pdfkit');

function generateInvoice(order, res) {
  // Create a document
  const doc = new PDFDocument({ margin: 50 });

  // Pipe its output to the response
  doc.pipe(res);

  // --- Header ---
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('Ayush Basket', 50, 57)
    .fontSize(10)
    .text('Tax Invoice', 200, 50, { align: 'right' })
    .text(`Order Number: ${order.id}`, 200, 65, { align: 'right' })
    .text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 200, 80, { align: 'right' })
    .moveDown();

  doc.strokeColor('#aaaaaa')
    .lineWidth(1)
    .moveTo(50, 110)
    .lineTo(550, 110)
    .stroke();

  // --- Customer Info ---
  doc
    .fillColor('#333333')
    .fontSize(14)
    .text('Bill To:', 50, 130)
    .fontSize(10)
    .text(`Name: ${order.user?.name || 'Customer'}`, 50, 150)
    .text(`Phone: ${order.user?.phone || 'N/A'}`, 50, 165);

  if (order.address) {
    const addr = order.address;
    doc.text(`Address: ${addr.street}, ${addr.city}`, 50, 180)
       .text(`${addr.state} - ${addr.pincode}`, 50, 195);
  }

  // --- Invoice Table Header ---
  const tableTop = 250;
  doc.font('Helvetica-Bold');
  generateTableRow(doc, tableTop, 'Item', 'Unit Price', 'Quantity', 'Line Total');
  
  doc.strokeColor('#aaaaaa')
    .lineWidth(1)
    .moveTo(50, tableTop + 20)
    .lineTo(550, tableTop + 20)
    .stroke();

  doc.font('Helvetica');
  let position = tableTop + 30;

  // --- Invoice Table Rows ---
  let subtotal = 0;
  if (order.items && order.items.length > 0) {
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      const prodName = item.product?.name || 'Product';
      const unitPrice = parseFloat(item.price || 0);
      const qty = parseInt(item.quantity || 0, 10);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      generateTableRow(
        doc,
        position,
        prodName,
        `Rs. ${unitPrice.toFixed(2)}`,
        qty,
        `Rs. ${lineTotal.toFixed(2)}`
      );
      position += 20;
    }
  }

  doc.strokeColor('#aaaaaa')
    .lineWidth(1)
    .moveTo(50, position + 10)
    .lineTo(550, position + 10)
    .stroke();

  // --- Totals ---
  const discount = subtotal - parseFloat(order.totalAmount || subtotal);
  const total = parseFloat(order.totalAmount || subtotal);
  
  position += 30;
  doc.font('Helvetica-Bold');
  
  if (discount > 0) {
    doc.text('Subtotal:', 350, position, { width: 90, align: 'right' });
    doc.text(`Rs. ${subtotal.toFixed(2)}`, 450, position, { width: 90, align: 'right' });
    position += 20;
    doc.text('Discount:', 350, position, { width: 90, align: 'right' });
    doc.text(`-Rs. ${discount.toFixed(2)}`, 450, position, { width: 90, align: 'right' });
    position += 20;
  }
  
  doc.fontSize(12);
  doc.text('Total Amount:', 350, position, { width: 90, align: 'right' });
  doc.text(`Rs. ${total.toFixed(2)}`, 450, position, { width: 90, align: 'right' });
  position += 20;
  doc.fontSize(10);
  doc.text('Payment Method:', 350, position, { width: 90, align: 'right' });
  doc.text((order.paymentMethod || 'cod').toUpperCase(), 450, position, { width: 90, align: 'right' });

  // --- Footer ---
  doc
    .fontSize(10)
    .fillColor('#777777')
    .text('Thank you for shopping with Ayush Basket!', 50, 700, { align: 'center', width: 500 });

  // Finalize document
  doc.end();
}

function generateTableRow(doc, y, item, unitCost, qty, lineTotal) {
  doc
    .text(item, 50, y, { width: 200 })
    .text(unitCost, 280, y, { width: 90, align: 'right' })
    .text(qty.toString(), 370, y, { width: 90, align: 'right' })
    .text(lineTotal, 450, y, { width: 90, align: 'right' });
}

module.exports = {
  generateInvoice
};
