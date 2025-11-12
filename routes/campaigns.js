const express = require("express");
const Campaign = require("../models/Campaign");
const User = require("../models/User");

const router = express.Router();

// POST /campaigns
router.post("/", async (req, res) => {
	const { userId, name, description } = req.body;
	if (!userId || !name) {
		return res.status(400).json({ error: "userId and name are required" });
	}
	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		const campaign = await Campaign.create({ name, description, user: user._id });
		res.status(201).json({ campaign });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;


