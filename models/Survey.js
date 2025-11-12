const mongoose = require("mongoose");

const LogicSchema = new mongoose.Schema({
	id: { type: String, required: true },
	condition: { type: String, required: true },
	value: { type: String, default: "" },
	action: { type: String, required: true },
	targetQuestion: { type: String, required: true },
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
	id: { type: String, required: true },
	type: { type: String, required: true },
	title: { type: String, required: true },
	description: { type: String, default: "" },
	required: { type: Boolean, default: false },
	order: { type: Number, required: true },
	options: { type: [String], default: [] },
	logic: { type: [LogicSchema], default: [] },
}, { _id: false });

const SurveySchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String, default: "" },
	questions: { type: [QuestionSchema], default: [] },
	thankYouMessage: { type: String, default: "" },
	goal: { type: String, default: "" },
	status: { type: String, default: "draft" },
	responses: {type: Number, default: 0},
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

module.exports = mongoose.model("Survey", SurveySchema);


