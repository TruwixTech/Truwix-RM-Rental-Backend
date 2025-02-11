const nodemailer = require('nodemailer');
const hbs = require('nodemailer-handlebars');
const dotenv = require('dotenv');
const path = require('path');
const Order = require("../models/OrderSchema");
const { logger } = require('../utils/logger');
async function mailsender(orderId,productsWithDetails,res_email) {
    // console.log(orderId,productsWithDetails,res_email);
    logger.info("Mailsender Flag 1");
    const order = await Order.findById(orderId);
    // console.log("Hello",order)

    logger.info("Initializing mail sender...");
    // const user = await User.findById(order.user);
    // console.log("User "+ user);
  
    let transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  
    logger.info("Transporter created successfully!");
    
    // Ensure Handlebars is correctly set up
    transporter.use(
      "compile",
      hbs({
        viewEngine: {
          extName: ".handlebars",
          partialsDir: path.join(__dirname, "views/"),
          defaultLayout: false,
        },
        viewPath: path.join(__dirname, "views/"),
        extName: ".handlebars",
      })
    );
  
    logger.info("Handlebars engine configured!");

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: res_email,
        subject: "Invoice for RM-Rental",
        text: `Invoice for Purchase`,
        template: "index",
        context: {
          orderNumber: order.orderNumber,
          status: order.status,
          orderDate: order.orderDate,
          expectedDelivery: order.expectedDelivery,
          totalPrice: order.totalPrice,
          shippingCost: order.shippingCost,
          shippingAddress: order.shippingAddress,
          products: productsWithDetails,
        },
      };
      logger.info("Flag reached");
    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${res_email} with order : ${order}`);
      return order; // Return OTP after sending mail
    } catch (error) {
      logger.info("Error sending email:", error);
      throw new Error("Failed to send OTP email.");
    }
  }

  async function mailsend_details(app_details) {
    
    logger.info("Initializing mail sender...");
    
  
    let transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_SEND,
        pass: process.env.EMAIL_SEND_PASS,
      },
    });
  
    logger.info("Transporter created successfully!");
    
    // Ensure Handlebars is correctly set up
    transporter.use(
      "compile",
      hbs({
        viewEngine: {
          extName: ".handlebars",
          partialsDir: path.join(__dirname, "views/"),
          defaultLayout: false,
        },
        viewPath: path.join(__dirname, "views/"),
        extName: ".handlebars",
      })
    );
  
    logger.info("Handlebars engine configured!");

    let mailOptions = {
        from: process.env.EMAIL_SEND,
        to: process.env.EMAIL_USER,
        subject: "Application Details for Test",
        text: `Application Details`,
        template: "application_details",
        context: {...app_details},
      };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${process.env.EMAIL_USER}`);
    } catch (error) {
      logger.log("Error sending email:", error);
      throw new Error("Failed to send OTP email.");
    }
  }

  module.exports = {mailsender,mailsend_details};