const { v4: uuidv4 } = require('uuid');
const Invoice = require('../models/Invoice');
const fs = require('fs');
const PDFDocument = require('pdfkit');


exports.createInvoice = async (req, res) => {
  try {
    const paymentData = req.body;

    const invoice = new Invoice({
      invoiceNumber: `INV-${uuidv4()}`,
      userId: paymentData.userId,
      paymentId: paymentData.paymentId,
      amount: paymentData.amount,
      items: paymentData.items,
    });

    await invoice.save();
    res.status(201).json({ success: true, message: 'Invoice generated', invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating invoice', error });
  }
};


exports.getAllInvoices = async (req, res) => {

  const { page = 1, limit = 50 } = req.query;

  try {
    const invoices = await Invoice.find()
      .populate('userId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalInvoices = await Invoice.countDocuments();

    res.status(200).json({
      success: true,
      invoices,
      pagination: {
        totalInvoices,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error,
    });
  }
};

exports.userInvoices = async (req, res) => {
  const userId = req.user.id;

  const { page = 1, limit = 50 } = req.query;

  try {
    const invoices = await Invoice.find({ userId })
      .populate("userId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalInvoices = await Invoice.countDocuments({ userId });

    res.status(200).json({
      success: true,
      invoices,
      pagination: {
        totalInvoices,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error,
    });
  }
};

exports.downloadInvoicePdf = async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).send('Invoice not found');

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${invoice.invoiceNumber}.pdf`
    );
    res.setHeader('Content-Type', 'application/pdf');

    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(res);

    // Add Company Name or Logo
    doc.fontSize(25).text('RM Rental', { align: 'center' }).moveDown(0.5);
    doc.fontSize(12).text('Address: 123 Main Street, City, State, ZIP', { align: 'center' });
    doc.text('Phone: +1 234-567-890', { align: 'center' });
    doc.text('Email: contact@yourcompany.com', { align: 'center' });
    doc.moveDown();

    // Draw a horizontal line
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();

    // Invoice Header
    doc.moveDown().fontSize(20).text(`Invoice`, { align: 'center' });
    doc.moveDown(0.5).fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Invoice Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    // Customer Details
    doc.fontSize(14).text('Billed To:', { underline: true });
    doc.fontSize(12).text(`Customer ID: ${invoice.userId}`);
    doc.moveDown();

    // Add Items Table Header
    doc.fontSize(14).text('Items:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text('Item', 50, doc.y, { continued: true, width: 200 });
    doc.text('Quantity', 250, doc.y, { continued: true, width: 100 });
    doc.text('Price', 350, doc.y, { continued: true, width: 100 });
    doc.text('Total', 450, doc.y);
    doc.moveDown();

    // Add Items Table Content
    let totalAmount = 0;
    for (const item of invoice.items) {
      const itemTotal = item.quantity * item.price;
      totalAmount += itemTotal;

      doc.text(item.name, 50, doc.y, { continued: true, width: 200 });
      doc.text(item.quantity.toString(), 250, doc.y, { continued: true, width: 100 });
      doc.text(item.price.toFixed(2), 350, doc.y, { continued: true, width: 100 });
      doc.text(itemTotal.toFixed(2), 450, doc.y);
      doc.moveDown(0.5);
    }

    doc.moveDown();

    // Add Summary Section
    doc.fontSize(14).text('Summary:', { underline: true });
    doc.fontSize(12).text(`Total: ${invoice.currency} ${totalAmount.toFixed(2)}`);
    // doc.text(`Tax (if applicable): ${invoice.currency} ${(totalAmount * 0.1).toFixed(2)}`);
    // doc.fontSize(14).text(`Total: ${invoice.currency} ${(totalAmount * 1.1).toFixed(2)}`, { bold: true });
    doc.moveDown();

    // Add Footer
    doc.moveDown();
    doc.fontSize(10).text(
      'Thank you for your business!',
      { align: 'center' }
    );

    doc
      .moveTo(50, doc.y + 10)
      .lineTo(550, doc.y + 10)
      .stroke();

    doc.fontSize(10).text('RM Rental © 2025', { align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    res.status(500).send('Error generating invoice');
  }
};
