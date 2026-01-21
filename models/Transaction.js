const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	type: { type: String, enum: ["credit", "debit"], required: true },
	amount: { type: Number, required: true, min: 0 },
	description: { type: String, default: "" },
	balanceAfter: { type: Number, required: true, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", TransactionSchema);
