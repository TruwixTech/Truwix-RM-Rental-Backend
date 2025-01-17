const twilio = require("twilio");
const { logger } = require('../utils/logger');
exports.sendWhatsAppOtp = async (req, res, next) => {
  const phone = req.params.id;

  // Validate the phone number length
  if (phone.length !== 10) {
    return res.status(422).json({ message: "Invalid phone number" });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_AUTH_SERVICES;

  const client = twilio(accountSid, authToken);

  try {
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: `+91${phone}`,
        channel: "sms", // Specify WhatsApp as the channel
      });

    // Respond with success
    return res.status(200).json({
      message: "Verification OTP sent successfully",
      success: true,
      sid: verification.sid, // Optional: Provide the verification SID for tracking
    });
  } catch (error) {
    logger.error("Error sending OTP:", error.message);
    return res
      .status(500)
      .json({ message: "Error in Sending OTP", error: error.message });
  }
};

exports.verifyWhatsAppOtp = async (req, res) => {
  const otp = req.params.otp,
    phone = req.params.contact;

  if (phone.length !== 10 || otp.length !== 6) {
    return res.status(422).json({ message: "Invalid Contact/OTP Length." });
  }
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  const verificationCheck = await client.verify.v2
    .services(process.env.TWILIO_AUTH_SERVICES)
    .verificationChecks.create({
      code: otp,
      to: "+91" + phone,
    })
    .then((resp) => {
      // logger.info(otp + " " + phone);
      // logger.info(resp.status);
      if (resp.status === "approved") {
        return res
          .status(200)
          .json({
            message: "Contact Verified Successfully: " + resp.status,
            success: true,
          });
      } else {
        return res
          .status(422)
          .json({ message: "Verification Failed: " + resp.status });
      }
    })
    .catch((e) => {
      // logger.info(e);
      return res.status(404).json({ message: "Error in Verifing OTP: " + e });
    });
};
