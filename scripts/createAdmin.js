require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require("./src/models/User");
  const existing = await User.findOne({ email: "admin@fable.com" });
  if (existing) {
    console.log("Admin already exists");
    process.exit(0);
  }
  const hashedPassword = await bcrypt.hash("Admin@123", 10);
  await User.create({ name: "Fable Admin", email: "admin@fable.com", password: hashedPassword, role: "admin" });
  console.log("✓ Admin created: admin@fable.com / Admin@123");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });