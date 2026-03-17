const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const User = require("../models/User");
const Campaign = require("../models/Campaign");
const Survey = require("../models/Survey");
const Response = require("../models/Response");

const router = express.Router();

// Protect everything under /admin
router.use(requireAuth, requireAdmin);

// GET /admin/overview
router.get("/overview", async (req, res) => {
  try {
    const [users, campaigns, surveys, responses] = await Promise.all([
      User.countDocuments({}),
      Campaign.countDocuments({}),
      Survey.countDocuments({}),
      Response.countDocuments({}),
    ]);

    return res.status(200).json({ users, campaigns, surveys, responses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id email name role createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/campaigns
router.get("/campaigns", async (req, res) => {
  try {
    const campaigns = await Campaign.find({})
      .select("_id name status responses user createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ campaigns });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/surveys
router.get("/surveys", async (req, res) => {
  try {
    const surveys = await Survey.find({})
      .select("_id title status responses user createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ surveys });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
