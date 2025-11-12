const express = require("express");
const User = require("../models/User");

const router = express.Router();
const companyName = "-";
const bio = "-";
// POST /auth/google
router.post("/google", async (req, res) => {
	const { email, name} = req.body;
	try {
		let user = await User.findOne({ email });
		if (!user) {
			user = await User.create({ email, name, companyName, bio });
		}
		res.status(200).json({ user });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;


