require('dotenv').config({ path: '.env.local' });
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express')
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use(express.json());
app.use(cookieParser());

// Routers
const authRouter = require("./routes/auth");
const campaignsRouter = require("./routes/campaigns");
const surveysRouter = require("./routes/surveys");
const usersRouter = require("./routes/users");
const editRouter = require("./routes/edit");
const customersRouter = require("./routes/customers");
const responsesRouter = require("./routes/responses");
const adminRouter = require("./routes/admin");

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('❌ MONGO_URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(mongoUri).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Mount routers
app.use("/auth", authRouter);
app.use("/campaigns", campaignsRouter);
app.use("/surveys", surveysRouter);
app.use("/users", usersRouter);
app.use("/edit", editRouter);
app.use("/customers", customersRouter);
app.use("/responses", responsesRouter);
app.use("/admin", adminRouter);

module.exports = app;
