const { v4: uuidv4 } = require('uuid');
const Invoice = require('../models/Invoice');


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

  exports.userInvoices = async (req, res) => {
    const userId = req.user.id; 
    
    const { page = 1, limit = 50 } = req.query; 
  
    try {
      const invoices = await Invoice.find({ userId }) 
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