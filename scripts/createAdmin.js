require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const DEMO_USERS = [
  {
    name: "Fable Admin",
    email: "admin@fable.com",
    password: "Admin@123",
    role: "admin",
  },
  {
    name: "Demo Writer",
    email: "writer@fable.com",
    password: "writer123",
    role: "writer",
  },
  {
    name: "Demo Reader",
    email: "reader@fable.com",
    password: "reader123",
    role: "user",
  },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require("../src/models/User");

  for (const demoUser of DEMO_USERS) {
    const existing = await User.findOne({ email: demoUser.email });
    if (existing) {
      console.log(`✓ User already exists: ${demoUser.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(demoUser.password, 10);
    await User.create({
      name: demoUser.name,
      email: demoUser.email,
      password: hashedPassword,
      role: demoUser.role,
      pendingWriter: demoUser.role === "writer",
    });
    console.log(`✓ Created demo user: ${demoUser.email} / ${demoUser.password}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});