const express = require('express');
const { createInvoice, userInvoices } = require('../controllers/invoiceController');
const { authenticate } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create-invoice',createInvoice );

router.get('/user-invoices', authenticate, userInvoices)

module.exports = router;
