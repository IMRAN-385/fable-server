const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  photo: user.photo,
  pendingWriter: user.pendingWriter,
  writerVerified: user.writerVerified,
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ FIX: previously `role` from the request body was trusted directly,
    // so choosing "Publish ebooks" on registration instantly made someone
    // a writer with zero verification/payment — contradicts the spec
    // ("writers can upload after a one-time verification payment").
    // Now everyone starts as role "user". If they asked for "writer",
    // we just remember that intent in `pendingWriter` so the frontend can
    // route them to the verification-payment page next.
    const wantsWriter = role === "writer";

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      pendingWriter: wantsWriter,
    });

    const token = signToken(user);

    res.status(201).json({
      success: true,
      user: publicUser(user),
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    res.status(200).json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Profile (also used by the frontend to refresh user state after
// a role change, e.g. after the writer-verification payment succeeds)
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bookmarks
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("bookmarks");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, bookmarks: user.bookmarks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Google Login
//
// ⚠️ SECURITY NOTE (not fully fixed here, flagging it clearly):
// This route currently trusts whatever {name, email, photo} the client
// sends, with no verification that the caller actually owns that Google
// account. As written, anyone could POST { "email": "admin@fable.com" }
// directly to this endpoint (e.g. with curl/Postman) and get back a valid
// JWT for that account. The safe fix is to send the Google ID token (not
// the decoded profile) to this route and verify it server-side with
// google-auth-library:
//
//   const { OAuth2Client } = require("google-auth-library");
//   const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
//   const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
//   const payload = ticket.getPayload(); // trustworthy email/name here
//
// Left as-is for now to avoid widening the scope of this pass, but this
// should be hardened before going to production with real user data.
router.post("/google", async (req, res) => {
  try {
    const { name, email, photo } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        photo: photo || "",
        role: "user",
      });
    }

    const token = signToken(user);

    res.json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
