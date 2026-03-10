const express = require("express");
const Campaign = require("../models/Campaign");
const User = require("../models/User");
const Survey = require("../models/Survey");
const telnyx = require("telnyx")(process.env.TELNYX_API_KEY);

const router = express.Router();

// GET /campaigns?userId=USER_ID -> get all campaigns for a specific user
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
		const campaigns = await Campaign.find({ user: userId }).sort({ createdAt: -1 });
		res.status(200).json({ campaigns });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /campaigns/:campaignId -> get details of a specific campaign
router.get("/:campaignId", async (req, res) => {
	const { campaignId } = req.params;
	const { userId } = req.query;

	if (!campaignId) {
		return res.status(400).json({ error: "campaignId parameter is required" });
	}

	try {
		const campaign = await Campaign.findById(campaignId).populate("survey");

		if (!campaign) {
			return res.status(404).json({ error: "Campaign not found" });
		}

		if (userId && campaign.user.toString() !== userId) {
			return res.status(403).json({ error: "You are not authorized to view this campaign" });
		}

		res.status(200).json({ campaign });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// POST /campaigns
router.post("/", async (req, res) => {
	const { userId, name, description, message_template, contacts, reward, surveyId, externalSurveyLink, code, image } = req.body;
	if (!userId || !name) {
		return res.status(400).json({ error: "userId and name are required" });
	}
	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Validate survey if provided
		if (surveyId) {
			const survey = await Survey.findById(surveyId);
			if (!survey) {
				return res.status(404).json({ error: "Survey not found" });
			}
		}

		// Validate external survey link and code
		if (externalSurveyLink) {
			// Validate URL format
			try {
				new URL(externalSurveyLink);
			} catch (err) {
				return res.status(400).json({ error: "externalSurveyLink must be a valid URL" });
			}

			// Validate 8-digit code
			if (!code) {
				return res.status(400).json({ error: "code is required when externalSurveyLink is provided" });
			}
			if (!/^\d{8}$/.test(code)) {
				return res.status(400).json({ error: "code must be exactly 4 digits" });
			}
		}

		// Cannot have both internal survey and external survey link
		if (surveyId && externalSurveyLink) {
			return res.status(400).json({ error: "Cannot specify both surveyId and externalSurveyLink. Choose one." });
		}

		// Validate reward if provided
		if (reward) {
			if (!reward.type || !['cash reward', 'promo code'].includes(reward.type)) {
				return res.status(400).json({ error: "reward.type must be either 'cash reward' or 'promo code'" });
			}
			if (reward.type === 'cash reward' && reward.amount === undefined) {
				return res.status(400).json({ error: "amount is required for cash reward" });
			}
			if (reward.type === 'promo code' && (!reward.code || !reward.description)) {
				return res.status(400).json({ error: "code and description are required for promo code" });
			}
		}

		const campaign = await Campaign.create({
			name,
			description: description || "",
			message_template: message_template || "",
			contacts: contacts || [],
			reward: reward || undefined,
			survey: surveyId || undefined,
			externalSurveyLink: externalSurveyLink || undefined,
			code: code || undefined,
			image: image || undefined,
			user: user._id
		});

		// Send messages to all contacts via Telnyx
		if (campaign.contacts && campaign.contacts.length > 0) {
			for (const contact of campaign.contacts) {
				if (contact.phone) {
					try {
						await telnyx.messages.send({
							from: process.env.TELNYX_PHONE_NUMBER,
							to: contact.phone,
							text: campaign.message_template || `You have been added to a new campaign: ${campaign.name}`
						});
						console.log(`Telnyx message sent to ${contact.phone}`);
					} catch (telnyxErr) {
						console.error(`Failed to send Telnyx message to ${contact.phone}:`, telnyxErr);
					}
				}
			}
		}

		res.status(201).json({ campaign });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// PATCH /campaigns/:campaignId
router.patch("/:campaignId", async (req, res) => {
	const { campaignId } = req.params;
	const { userId } = req.query;
	const { name, description, message_template, contacts, reward, surveyId, externalSurveyLink, code, status, responses, amount_utilized, codes_utilized, image } = req.body;

	if (!campaignId) {
		return res.status(400).json({ error: "campaignId parameter is required" });
	}

	try {
		const campaign = await Campaign.findById(campaignId);

		if (!campaign) {
			return res.status(404).json({ error: "Campaign not found" });
		}

		if (userId && campaign.user.toString() !== userId) {
			return res.status(403).json({ error: "You are not authorized to edit this campaign" });
		}

		// Validate survey if provided
		if (surveyId !== undefined) {
			if (surveyId === null || surveyId === "") {
				// Allow clearing the survey reference
			} else {
				const survey = await Survey.findById(surveyId);
				if (!survey) {
					return res.status(404).json({ error: "Survey not found" });
				}
			}
		}

		// Validate external survey link and code
		if (externalSurveyLink !== undefined) {
			if (externalSurveyLink === null || externalSurveyLink === "") {
				// Allow clearing the external survey link
			} else {
				// Validate URL format
				try {
					new URL(externalSurveyLink);
				} catch (err) {
					return res.status(400).json({ error: "externalSurveyLink must be a valid URL" });
				}

				// Validate 4-digit code if externalSurveyLink is being set
				if (code !== undefined && !/^\d{4}$/.test(code)) {
					return res.status(400).json({ error: "code must be exactly 4 digits" });
				}
			}
		}

		// Validate code if provided independently
		if (code !== undefined && code !== null && code !== "") {
			if (!/^\d{4}$/.test(code)) {
				return res.status(400).json({ error: "code must be exactly 4 digits" });
			}
		}

		// Check if both surveyId and externalSurveyLink would be set after update
		const finalSurveyId = surveyId !== undefined ? (surveyId || null) : campaign.survey;
		const finalExternalLink = externalSurveyLink !== undefined ? (externalSurveyLink || null) : campaign.externalSurveyLink;

		if (finalSurveyId && finalExternalLink) {
			return res.status(400).json({ error: "Cannot specify both surveyId and externalSurveyLink. Choose one." });
		}

		// Validate reward if provided
		if (reward) {
			if (!reward.type || !['cash reward', 'promo code'].includes(reward.type)) {
				return res.status(400).json({ error: "reward.type must be either 'cash reward' or 'promo code'" });
			}
			if (reward.type === 'cash reward' && reward.amount === undefined) {
				return res.status(400).json({ error: "amount is required for cash reward" });
			}
			if (reward.type === 'promo code' && (!reward.code || !reward.description)) {
				return res.status(400).json({ error: "code and description are required for promo code" });
			}
		}

		const updates = {};
		if (name !== undefined) updates.name = name;
		if (description !== undefined) updates.description = description;
		if (message_template !== undefined) updates.message_template = message_template;
		if (contacts !== undefined) updates.contacts = contacts;
		if (reward !== undefined) updates.reward = reward;
		if (status !== undefined) updates.status = status;
		if (surveyId !== undefined) {
			updates.survey = surveyId || null;
		}
		if (externalSurveyLink !== undefined) {
			updates.externalSurveyLink = externalSurveyLink || null;
		}
		if (code !== undefined) {
			updates.code = code || null;
		}
		if (responses !== undefined) updates.responses = responses;
		if (amount_utilized !== undefined) updates.amount_utilized = amount_utilized;
		if (codes_utilized !== undefined) updates.codes_utilized = codes_utilized;
		if (image !== undefined) updates.image = image;
		if (Object.keys(updates).length === 0) {
			return res.status(400).json({ error: "Provide at least one field to update" });
		}

		const updatedCampaign = await Campaign.findByIdAndUpdate(
			campaignId,
			{ $set: updates },
			{ new: true }
		);

		res.status(200).json({ campaign: updatedCampaign });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// DELETE /campaigns/:campaignId
router.delete("/:campaignId", async (req, res) => {
	const { campaignId } = req.params;
	const { userId } = req.query;

	if (!campaignId) {
		return res.status(400).json({ error: "campaignId parameter is required" });
	}

	try {
		const campaign = await Campaign.findById(campaignId);

		if (!campaign) {
			return res.status(404).json({ error: "Campaign not found" });
		}

		if (userId && campaign.user.toString() !== userId) {
			return res.status(403).json({ error: "You are not authorized to delete this campaign" });
		}

		await Campaign.findByIdAndDelete(campaignId);

		res.status(200).json({ message: "Campaign deleted successfully" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;


