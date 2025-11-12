const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: { type: String },
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

module.exports = mongoose.model("Campaign", CampaignSchema);


