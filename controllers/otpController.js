const twilio = require("twilio");

exports.sendWhatsAppOtp = async (req, res, next) => {
  const phone = req.params.id;
  if (phone.length !== 10) {
    return res.status(422).json({ message: "Invalid phone number" });
  }
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  const verification = await client.verify.v2
    .services(process.env.TWILIO_AUTH_SERVICES)
    .verifications.create({
      channel: "whatsapp",
      to: "+91" + phone,
      channelConfiguration: {
        whatsapp: {
          enabled: true,
        },
      },
    })
    .then((resp) => {
      // console.log(resp);
      // console.log(resp.accountSid);
      return res
        .status(200)
        .json({ message: "SMS/WhatsApp OTP Send Successfully", success: true });
    })
    .catch((e) => {
      // console.log(e);
      return res.status(404).json({ message: "Error in Sending OTP: " + e });
    });
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
      // console.log(otp + " " + phone);
      // console.log(resp.status);
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
      // console.log(e);
      return res.status(404).json({ message: "Error in Verifing OTP: " + e });
    });
};
