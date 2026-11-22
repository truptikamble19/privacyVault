const express = require("express");
const jwt = require("jsonwebtoken");
const Platform = require("../models/Platform");
const PrivacyRequest = require("../models/PrivacyRequest");

const router = express.Router();

// Verify the login token
router.use((req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Please sign in first."
    });
  }

  try {
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please sign in again."
    });
  }
});

// Get platforms for the logged-in user
router.get("/platforms", async (req, res) => {
  try {
    const platforms = await Platform.find({
      userId: req.userId
    }).lean();

    res.json({ success: true, platforms });
  } catch (error) {
    console.error("Platforms error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not load platforms."
    });
  }
});

// Get privacy requests for the logged-in user
router.get("/requests", async (req, res) => {
  try {
    const requests = await PrivacyRequest.find({
      userId: req.userId
    }).sort({ createdAt: -1 }).lean();

    res.json({ success: true, requests });
  } catch (error) {
    console.error("Requests error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not load privacy requests."
    });
  }
});


//const PrivacyRequest = require("../models/PrivacyRequest");

router.post("/requests", async (req, res) => {
  try {
    const { platform, type, category } = req.body;

    if (!platform || !type) {
      return res.status(400).json({
        success: false,
        message: "Platform and request type are required"
      });
    }

    
const request = await PrivacyRequest.create({
  userId: req.userId,
  platform,
  type,
  category: category || "Personal data",
  status: "Pending",
  history: [{
    status: "Pending",
    at: new Date()
  }]
});


    return res.status(201).json({
      success: true,
      request
    });
  } catch (error) {
    console.error("Create request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not create privacy request"
    });
  }
});


module.exports = router;