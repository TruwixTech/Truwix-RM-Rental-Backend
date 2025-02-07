const express = require('express');
const { createInvoice, userInvoices, downloadInvoicePdf } = require('../controllers/invoiceController');
const { authenticate } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create-invoice',createInvoice);
router.get('/user-invoices', authenticate, userInvoices);
router.get('/:id/download-invoice', downloadInvoicePdf);

module.exports = router;
