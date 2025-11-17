const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({
	question_title: { type: String, required: true },
	question_description: { type: String, default: "" },
	answer: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be string, number, or object
}, { _id: false });

const ResponseSchema = new mongoose.Schema({
	survey: { type: mongoose.Schema.Types.ObjectId, ref: "Survey", required: true },
	campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	payment_id: { type: String, default: "" },
	responders_email: { type: String, required: true },
	responders_phone: { type: String, required: true },
	answers: { type: [AnswerSchema], default: [] },
	started_at: { type: Date, required: true },
	completed_at: { type: Date },
	bot_score: { type: Number, default: 0, min: 0, max: 1 },
	is_suspected_bot: { type: Boolean, default: false },
	reward_amount: { type: Number, default: 0 },
	reward_status: { 
		type: String, 
		enum: ['pending', 'paid', 'declined'], 
		default: 'pending' 
	},
	ip_address: { type: String, default: "" },
	user_agent: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Response", ResponseSchema);

