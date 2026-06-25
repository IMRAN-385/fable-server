const express = require("express");
const cors    = require("cors");

const authRoutes     = require("./routes/authRoutes");
const ebookRoutes    = require("./routes/ebookRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const userRoutes     = require("./routes/userRoutes");

const app = express();

// Stripe webhook needs raw body — MUST be before express.json()
app.use(
  "/api/purchase/webhook",
  express.raw({ type: "application/json" })
);

// CORS — allow both local and production
const allowedOrigins = [
  "http://localhost:3000",
  "https://fable-client-azure.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth",     authRoutes);
app.use("/api/ebooks",   ebookRoutes);
app.use("/api/bookmark", bookmarkRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/users",    userRoutes);

app.get("/", (req, res) => res.send("Fable Server Running"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

module.exports = app;