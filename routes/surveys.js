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

// PATCH /surveys/:surveyId
router.patch("/:surveyId", async (req, res) => {
	const { surveyId } = req.params;
	const { userId } = req.query;
	const { title, description, questions, thankYouMessage, goal, status, responses } = req.body;

	if (!surveyId) {
		return res.status(400).json({ error: "surveyId parameter is required" });
	}

	try {
		const survey = await Survey.findById(surveyId);

		if (!survey) {
			return res.status(404).json({ error: "Survey not found" });
		}

		if (userId && survey.user.toString() !== userId) {
			return res.status(403).json({ error: "You are not authorized to edit this survey" });
		}

		const updates = {};
		if (title !== undefined) updates.title = title;
		if (description !== undefined) updates.description = description;
		if (questions !== undefined) updates.questions = questions;
		if (thankYouMessage !== undefined) updates.thankYouMessage = thankYouMessage;
		if (goal !== undefined) updates.goal = goal;
		if (status !== undefined) updates.status = status;
		if (responses !== undefined) updates.responses = responses;
		if (Object.keys(updates).length === 0) {
			return res.status(400).json({ error: "Provide at least one field to update" });
		}

		const updatedSurvey = await Survey.findByIdAndUpdate(
			surveyId,
			{ $set: updates },
			{ new: true }
		);

		res.status(200).json({ survey: updatedSurvey });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// DELETE /surveys/:surveyId
router.delete("/:surveyId", async (req, res) => {
	const { surveyId } = req.params;
	const { userId } = req.query;

	if (!surveyId) {
		return res.status(400).json({ error: "surveyId parameter is required" });
	}

	try {
		const survey = await Survey.findById(surveyId);

		if (!survey) {
			return res.status(404).json({ error: "Survey not found" });
		}

		if (userId && survey.user.toString() !== userId) {
			return res.status(403).json({ error: "You are not authorized to delete this survey" });
		}

		await Survey.findByIdAndDelete(surveyId);

		res.status(200).json({ message: "Survey deleted successfully" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;


