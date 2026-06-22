const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const ebookRoutes = require("./routes/ebookRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const userRoutes = require("./routes/userRoutes");
const app = express();


app.use("/api/users", userRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/ebooks", ebookRoutes);
app.use("/api/bookmark", bookmarkRoutes);

app.get("/", (req, res) => {
  res.send("Fable Server Running");
});

module.exports = app;