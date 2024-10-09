const Razorpay = require("razorpay");
const { RAZOR_PAY_KEY_ID, RAZOR_PAY_KEY_SECRET } = require("../utils/config");

const RAZOR_PAY = new Razorpay({
  key_id: RAZOR_PAY_KEY_ID, // Replace with your Razorpay Key ID
  key_secret: RAZOR_PAY_KEY_SECRET, // Replace with your Razorpay Key Secret
});

module.exports = {
  RAZOR_PAY,
};
