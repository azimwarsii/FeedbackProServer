const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	email: { type: String, required: true, unique: true, immutable: true  },
	name: { type: String, immutable: true  },
	companyName: { type: String },
	bio: { type: String },
	walletBalance: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);


