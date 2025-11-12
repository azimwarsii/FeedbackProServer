const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	email: { type: String, required: true, unique: true, immutable: true  },
	name: { type: String, immutable: true  },
	companyName: { type: String },
	bio: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);


