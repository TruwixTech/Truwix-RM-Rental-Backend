
const { v4: uuidv4 } = require('uuid');
const Invoice = require('../models/Invoice');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const Payment = require('../models/PaymentSchema');


exports.createInvoice = async (req, res) => {
  try {
    const paymentData = req.body;

    const payment = await Payment.findOne({ userId: paymentData.user });

    const invoice = new Invoice({
      invoiceNumber: `INV-${uuidv4()}`,
      orderId: paymentData._id,
      userId: paymentData.user,
      paymentId: payment._id,
      amount: paymentData.totalPrice,
      items: paymentData.products,
    });

    await invoice.save();
    res
      .status(201)
      .json({ success: true, message: "Invoice generated", invoice });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error generating invoice", error });
  }
}


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
    const invoice = await Invoice.findById(id).populate([
      { path: "orderId" },
      { path: "items.product" }
    ]);
    if (!invoice) return res.status(404).send("Invoice not found");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoice.invoiceNumber}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(25).text("RM Rental", { align: "center" }).moveDown(0.5);
    doc.fontSize(12).text("Address: Old barat Ghar, Makanpur, Nyay Khand 2, Indirapuram, Ghaziabad, Uttar Pradesh 201014", { align: "center" });
    doc.text("Phone: +91 9306839435", { align: "center" });
    doc.text("Email: rmfurniture2020@gmail.com", { align: "center" });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown().fontSize(20).text(`Invoice`, { align: "center" });
    doc.moveDown(0.5).fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Invoice Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
    doc.moveDown();
    doc.fontSize(14).text("Billed To:", { underline: true });
    doc.fontSize(12).text(`Customer ID: ${invoice.userId}`);
    doc.moveDown();
    doc.fontSize(14).text("Items:", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text("Item", 50, doc.y, { continued: true, width: 200 });
    doc.text("Quantity", 250, doc.y, { continued: true, width: 100 });
    doc.text("Price", 350, doc.y, { continued: true, width: 100 });
    doc.text("Total", 450, doc.y);
    doc.moveDown();



    let totalAmount = 0;
    for (const item of invoice.items || []) {
      if (!item.product) continue;
      const itemQuantity = item.quantity ?? 1;
      const itemName = item.product.title || "Unknown Item";
      const itemPrice = invoice.amount ?? 0;
      const itemTotal = itemQuantity * itemPrice;
      totalAmount += itemTotal;

      doc.text(itemName, 50, doc.y, { continued: true, width: 200 });
      doc.text(itemQuantity.toString(), 200, doc.y, { continued: true, width: 100 });
      doc.text(itemPrice.toFixed(2), 320, doc.y, { continued: true, width: 100 });
      doc.text(itemTotal.toFixed(2), 400, doc.y);
      doc.moveDown(0.5);
    }

    doc.moveDown();
    doc.fontSize(14).text("Summary:", { underline: true });
    doc.fontSize(12).text(`Total: ${invoice.currency} ${totalAmount.toFixed(2)}`);
    doc.moveDown();
    doc.moveDown();
    doc.fontSize(10).text("Thank you for your business!", { align: "center" });
    doc.moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).stroke();
    doc.fontSize(10).text("RM Rental © 2025", { align: "center" });
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating invoice");
  }
};
