const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
require('dotenv').config();
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger_output.json");
const { logger } = require('./utils/logger');


const allowedOrigins = [
  "http://localhost:5173", // for development
  "http://localhost:4000",
  "https://rmrental-backend.vercel.app",
  "https://rmrental-project.vercel.app",
  // "http://rmrental-project-ab15fwi42-aftab1311s-projects.vercel.app",
  // "http://rmrental-project-ab15fwi42-aftab1311s-projects.vercel.app/",
  // "https://rmrental-project-git-main-aftab1311s-projects.vercel.app",
  // "https://rmrental-project-git-main-aftab1311s-projects.vercel.app/",
  // "https://rmrental-project-cj9xppxtg-aftab1311s-projects.vercel.app",
  // "https://rmrental-project-cj9xppxtg-aftab1311s-projects.vercel.app/",
  "https://truwix-rm-rental-backend-dev.vercel.app",
  "https://rmfurniturerental.in",
  "https://rm-rental-frontend-dev.vercel.app",
  "https://truwix-rm-rental-backend-dev.vercel.app/api"
];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) === -1) {
//         const msg =
//           "The CORS policy for this site does not allow access from the specified origin.";
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//     credentials: true,
//   })
// );

// app.options("*", cors());

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true); // Allow the origin
    } else {
      callback(new Error('Origin not allowed by Cors'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}

app.use(cors(corsOptions));

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
const coupon = require("./routes/couponRoute");
const invoice = require("./routes/invoiceRoute");

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache'); // For HTTP/1.0 compatibility
  res.setHeader('Expires', '0'); // Forces the browser to consider the response as expirednext();
  next()
});

app.use("/api/coupon", coupon);
app.use("/api", order);
app.use("/api/invoice", invoice);

app.listen(PORT, () => {
  logger.info(`App listening on port ${PORT}`);
});
