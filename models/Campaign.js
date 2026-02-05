const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
	name: { type: String, required: true },
	phone: { type: String, required: true },
	email: { type: String, required: true },
	filled: { type: Boolean, default: false },
}, { _id: false });

const RewardSchema = new mongoose.Schema({
	type: { 
		type: String, 
		required: true, 
		enum: ['cash reward', 'promo code'] 
	},
	amount: { type: Number }, // For cash reward
	amount_utilized: { type: Number, default: 0 }, // For cash reward
	code: { type: String }, // For promo code
	description: { type: String }, // For promo code
	codes_utilized: { type: Number, default: 0 }, // For promo code
}, { _id: false });

const CampaignSchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: { type: String, default: "" },
	message_template: { type: String, default: "" },
	contacts: { type: [ContactSchema], default: [] },
	reward: { type: RewardSchema },
	survey: { type: mongoose.Schema.Types.ObjectId, ref: "Survey" },
	externalSurveyLink: { type: String },
	image: { type: String },
	code: { type: String }, // 8-digit code for external survey
	status: { type: String, default: "active" },
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	responses: {type: Number, default: 0},
}, { timestamps: true });

module.exports = mongoose.model("Campaign", CampaignSchema);


