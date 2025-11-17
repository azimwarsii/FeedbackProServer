const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
	name: { type: String, required: true },
	phone: { type: String, required: true },
	email: { type: String, required: true },
	responses: { type: Number, default: 0 },
	invitations: { type: [mongoose.Schema.Types.ObjectId], default: [] },
	reward_pending: { type: Number, default: 0 },
	reward_received: { type: Number, default: 0 },
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

module.exports = mongoose.model("Customer", CustomerSchema);

