const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
require('dotenv').config();
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger_output.json");

const allowedOrigins = [
  "http://localhost:5173", // for development
  "https://rm-rental-frontend-website.vercel.app", // for production
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.options("*", cors());

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("tiny"));
require("./config/database").connect();
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));
const user = require("./routes/user");
app.use("/api/", user);
app.use("/uploads", express.static("uploads"));
app.use("/payment", require("./routes/paymentRoute"));
const product = require("./routes/productsRoute");
app.use("/api/products", product);

const order = require("./routes/orderRoute");

app.use("/api", order);

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});