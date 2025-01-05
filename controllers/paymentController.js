const { RAZOR_PAY } = require("../service/payment");

const createOrder = async (req, res) => {
  const { amount, currency, receipt } = req.body;

  try {
    const options = {
      amount: amount * 100, // Amount in paise (1 INR = 100 paise)
      currency: currency,
      receipt: receipt,
    };

    const order = await RAZOR_PAY.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Route to verify payment signature
const verifyPayment = async (req, res) => {
  const crypto = require("crypto");
  const { order_id, payment_id, signature } = req.body;

  const hmac = crypto.createHmac(
    "rzp_test_bPKH4b75rXxBKr",
    "EcsqIxkDzv4wcMFSaobbyWiF"
  );
  hmac.update(order_id + "|" + payment_id);
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature === signature) {
    res.json({ status: "success" });
  } else {
    res.status(400).json({ status: "failure" });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};
