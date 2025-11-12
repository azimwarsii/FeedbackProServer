const express = require("express");
const Survey = require("../models/Survey");
const User = require("../models/User");

const router = express.Router();

// GET /surveys?userId=USER_ID -> get all surveys for a specific user
router.get("/", async (req, res) => {
	const { userId } = req.query;
	if (!userId) {
		return res.status(400).json({ error: "userId query parameter is required" });
	}
	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		const surveys = await Survey.find({ user: userId }).sort({ createdAt: -1 });
		res.status(200).json({ surveys });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// POST /surveys
router.post("/", async (req, res) => {
	const { userId, title, description, questions, thankYouMessage, goal } = req.body;
	if (!userId || !title ) {
		return res.status(400).json({ error: "userId and title are required" });
	}
	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		const survey = await Survey.create({
			title,
			description: description || "",
			questions: questions || [],
			thankYouMessage: thankYouMessage || "",
			goal: goal || "",
			user: user._id
		});
		res.status(201).json({ survey });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;


