const express = require("express");
const Response = require("../models/Response");
const User = require("../models/User");
const Survey = require("../models/Survey");
const Campaign = require("../models/Campaign");

const router = express.Router();

// GET /responses?userId=USER_ID -> get all responses for a specific user
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
		const responses = await Response.find({ user: userId })
			.populate("survey")
			.populate("campaign")
			.sort({ createdAt: -1 });
		res.status(200).json({ responses });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /responses/user/:userId -> get all responses for a specific user
router.get("/user/:userId", async (req, res) => {
	const { userId } = req.params;

	if (!userId) {
		return res.status(400).json({ error: "userId parameter is required" });
	}

	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const responses = await Response.find({ user: userId })
			.populate("survey")
			.populate("campaign")
			.sort({ createdAt: -1 });

		res.status(200).json({ responses });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /responses/campaign/:campaignId -> get all responses for a specific campaign
router.get("/campaign/:campaignId", async (req, res) => {
	const { campaignId } = req.params;

	if (!campaignId) {
		return res.status(400).json({ error: "campaignId parameter is required" });
	}

	try {
		const campaign = await Campaign.findById(campaignId);
		if (!campaign) {
			return res.status(404).json({ error: "Campaign not found" });
		}

		const responses = await Response.find({ campaign: campaignId })
			.populate("survey")
			.populate("campaign")
			.populate("user")
			.sort({ createdAt: -1 });

		res.status(200).json({ responses });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /responses/survey/:surveyId -> get all responses for a specific survey
router.get("/survey/:surveyId", async (req, res) => {
	const { surveyId } = req.params;

	if (!surveyId) {
		return res.status(400).json({ error: "surveyId parameter is required" });
	}

	try {
		const survey = await Survey.findById(surveyId);
		if (!survey) {
			return res.status(404).json({ error: "Survey not found" });
		}

		const responses = await Response.find({ survey: surveyId })
			.populate("survey")
			.populate("campaign")
			.populate("user")
			.sort({ createdAt: -1 });

		res.status(200).json({ responses });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /responses/:responseId -> get details of a specific response
router.get("/:responseId", async (req, res) => {
	const { responseId } = req.params;
	const { userId } = req.query;

	if (!responseId) {
		return res.status(400).json({ error: "responseId parameter is required" });
	}

	try {
		const response = await Response.findById(responseId)
			.populate("survey")
			.populate("campaign");

		if (!response) {
			return res.status(404).json({ error: "Response not found" });
		}

		if (userId && response.user.toString() !== userId) {
			return res.status(403).json({ error: "You are not authorized to view this response" });
		}

		res.status(200).json({ response });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// POST /responses
router.post("/", async (req, res) => {
	const { 
		userId, 
		surveyId, 
		campaignId, 
		payment_id, 
		responders_email, 
		responders_phone, 
		answers, 
		started_at, 
		completed_at, 
		bot_score, 
		is_suspected_bot, 
		reward_amount, 
		reward_status, 
		ip_address, 
		user_agent 
	} = req.body;

	if (!userId || !surveyId || !campaignId || !responders_email || !responders_phone || !started_at) {
		return res.status(400).json({ 
			error: "userId, surveyId, campaignId, responders_email, responders_phone, and started_at are required" 
		});
	}

	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const survey = await Survey.findById(surveyId);
		if (!survey) {
			return res.status(404).json({ error: "Survey not found" });
		}

		const campaign = await Campaign.findById(campaignId);
		if (!campaign) {
			return res.status(404).json({ error: "Campaign not found" });
		}

		// Validate reward_status if provided
		if (reward_status && !['pending', 'paid', 'declined'].includes(reward_status)) {
			return res.status(400).json({ error: "reward_status must be 'pending', 'paid', or 'declined'" });
		}

		// Validate bot_score if provided
		if (bot_score !== undefined && (bot_score < 0 || bot_score > 1)) {
			return res.status(400).json({ error: "bot_score must be between 0 and 1" });
		}

		const response = await Response.create({
			survey: surveyId,
			campaign: campaignId,
			user: userId,
			payment_id: payment_id || "",
			responders_email,
			responders_phone,
			answers: answers || [],
			started_at: new Date(started_at),
			completed_at: completed_at ? new Date(completed_at) : undefined,
			bot_score: bot_score !== undefined ? bot_score : 0,
			is_suspected_bot: is_suspected_bot || false,
			reward_amount: reward_amount || 0,
			reward_status: reward_status || 'pending',
			ip_address: ip_address || "",
			user_agent: user_agent || ""
		});

		res.status(201).json({ response });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// PATCH /responses/:responseId
router.patch("/:responseId", async (req, res) => {
	const { responseId } = req.params;
	const { userId } = req.query;
	const { 
		surveyId, 
		campaignId, 
		payment_id, 
		responders_email, 
		responders_phone, 
		answers, 
		started_at, 
		completed_at, 
		bot_score, 
		is_suspected_bot, 
		reward_amount, 
		reward_status, 
		ip_address, 
		user_agent 
	} = req.body;

	if (!responseId) {
		return res.status(400).json({ error: "responseId parameter is required" });
	}

	try {
		const response = await Response.findById(responseId);

		if (!response) {
			return res.status(404).json({ error: "Response not found" });
		}

		if (userId && response.user.toString() !== userId) {
			return res.status(403).json({ error: "You are not authorized to edit this response" });
		}

		// Validate survey if provided
		if (surveyId !== undefined) {
			const survey = await Survey.findById(surveyId);
			if (!survey) {
				return res.status(404).json({ error: "Survey not found" });
			}
		}

		// Validate campaign if provided
		if (campaignId !== undefined) {
			const campaign = await Campaign.findById(campaignId);
			if (!campaign) {
				return res.status(404).json({ error: "Campaign not found" });
			}
		}

		// Validate reward_status if provided
		if (reward_status !== undefined && !['pending', 'paid', 'declined'].includes(reward_status)) {
			return res.status(400).json({ error: "reward_status must be 'pending', 'paid', or 'declined'" });
		}

		// Validate bot_score if provided
		if (bot_score !== undefined && (bot_score < 0 || bot_score > 1)) {
			return res.status(400).json({ error: "bot_score must be between 0 and 1" });
		}

		const updates = {};
		if (surveyId !== undefined) updates.survey = surveyId;
		if (campaignId !== undefined) updates.campaign = campaignId;
		if (payment_id !== undefined) updates.payment_id = payment_id;
		if (responders_email !== undefined) updates.responders_email = responders_email;
		if (responders_phone !== undefined) updates.responders_phone = responders_phone;
		if (answers !== undefined) updates.answers = answers;
		if (started_at !== undefined) updates.started_at = new Date(started_at);
		if (completed_at !== undefined) updates.completed_at = completed_at ? new Date(completed_at) : null;
		if (bot_score !== undefined) updates.bot_score = bot_score;
		if (is_suspected_bot !== undefined) updates.is_suspected_bot = is_suspected_bot;
		if (reward_amount !== undefined) updates.reward_amount = reward_amount;
		if (reward_status !== undefined) updates.reward_status = reward_status;
		if (ip_address !== undefined) updates.ip_address = ip_address;
		if (user_agent !== undefined) updates.user_agent = user_agent;

		if (Object.keys(updates).length === 0) {
			return res.status(400).json({ error: "Provide at least one field to update" });
		}

		const updatedResponse = await Response.findByIdAndUpdate(
			responseId,
			{ $set: updates },
			{ new: true }
		).populate("survey").populate("campaign");

		res.status(200).json({ response: updatedResponse });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;

