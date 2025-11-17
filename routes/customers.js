const express = require("express");
const Customer = require("../models/Customer");
const User = require("../models/User");

const router = express.Router();

// GET /customers?userId=USER_ID -> get all customers for a specific user
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
		const customers = await Customer.find({ user: userId }).sort({ createdAt: -1 });
		res.status(200).json({ customers });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// POST /customers
router.post("/", async (req, res) => {
	const { userId, customers: customersArray } = req.body;
	
	if (!userId) {
		return res.status(400).json({ error: "userId is required" });
	}

	if (!Array.isArray(customersArray) || customersArray.length === 0) {
		return res.status(400).json({ error: "customers must be a non-empty array" });
	}

	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Validate all customers before creating
		for (const customer of customersArray) {
			if (!customer.name || !customer.phone || !customer.email) {
				return res.status(400).json({ 
					error: "Each customer must have name, phone, and email fields" 
				});
			}
		}

		// Create all customers
		const customersToCreate = customersArray.map(customer => ({
			name: customer.name,
			phone: customer.phone,
			email: customer.email,
			responses: customer.responses || [],
			invitations: customer.invitations || [],
			reward_pending: customer.reward_pending || 0,
			reward_received: customer.reward_received || 0,
			user: user._id
		}));

		const createdCustomers = await Customer.insertMany(customersToCreate);
		res.status(201).json({ customers: createdCustomers, count: createdCustomers.length });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /customers/email/:email?userId=USER_ID -> get a specific customer by email
router.get("/email/:email", async (req, res) => {
	const { email } = req.params;
	const { userId } = req.query;

	if (!email) {
		return res.status(400).json({ error: "email parameter is required" });
	}

	try {
		let customer;
		if (userId) {
			const user = await User.findById(userId);
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}
			customer = await Customer.findOne({ email, user: userId });
		} else {
			customer = await Customer.findOne({ email });
		}

		if (!customer) {
			return res.status(404).json({ error: "Customer not found" });
		}

		res.status(200).json({ customer });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// PATCH /customers/email/:email?userId=USER_ID -> edit a customer by email
router.patch("/email/:email", async (req, res) => {
	const { email } = req.params;
	const { userId } = req.query;
	const { name, phone, newEmail, responses, invitations, reward_pending, reward_received } = req.body;

	if (!email) {
		return res.status(400).json({ error: "email parameter is required" });
	}

	try {
		let customer;
		if (userId) {
			const user = await User.findById(userId);
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}
			customer = await Customer.findOne({ email, user: userId });
		} else {
			customer = await Customer.findOne({ email });
		}

		if (!customer) {
			return res.status(404).json({ error: "Customer not found" });
		}

		const updates = {};
		if (name !== undefined) updates.name = name;
		if (phone !== undefined) updates.phone = phone;
		if (newEmail !== undefined) updates.email = newEmail; // Use newEmail to avoid conflict with route param
		if (responses !== undefined) updates.responses = responses;
		if (invitations !== undefined) updates.invitations = invitations;
		if (reward_pending !== undefined) updates.reward_pending = reward_pending;
		if (reward_received !== undefined) updates.reward_received = reward_received;

		if (Object.keys(updates).length === 0) {
			return res.status(400).json({ error: "Provide at least one field to update" });
		}

		const updatedCustomer = await Customer.findByIdAndUpdate(
			customer._id,
			{ $set: updates },
			{ new: true }
		);

		res.status(200).json({ customer: updatedCustomer });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// PATCH /customers/:customerId
router.patch("/:customerId", async (req, res) => {
	const { customerId } = req.params;
	const { userId } = req.query;
	const { name, phone, email, responses, invitations, reward_pending, reward_received } = req.body;

	if (!customerId) {
		return res.status(400).json({ error: "customerId parameter is required" });
	}

	try {
		const customer = await Customer.findById(customerId);

		if (!customer) {
			return res.status(404).json({ error: "Customer not found" });
		}

		if (userId && customer.user.toString() !== userId) {
			return res.status(403).json({ error: "You are not authorized to edit this customer" });
		}

		const updates = {};
		if (name !== undefined) updates.name = name;
		if (phone !== undefined) updates.phone = phone;
		if (email !== undefined) updates.email = email;
		if (responses !== undefined) updates.responses = responses;
		if (invitations !== undefined) updates.invitations = invitations;
		if (reward_pending !== undefined) updates.reward_pending = reward_pending;
		if (reward_received !== undefined) updates.reward_received = reward_received;

		if (Object.keys(updates).length === 0) {
			return res.status(400).json({ error: "Provide at least one field to update" });
		}

		const updatedCustomer = await Customer.findByIdAndUpdate(
			customerId,
			{ $set: updates },
			{ new: true }
		);

		res.status(200).json({ customer: updatedCustomer });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// DELETE /customers/:customerId
router.delete("/:customerId", async (req, res) => {
	const { customerId } = req.params;
	const { userId } = req.query;

	if (!customerId) {
		return res.status(400).json({ error: "customerId parameter is required" });
	}

	try {
		const customer = await Customer.findById(customerId);

		if (!customer) {
			return res.status(404).json({ error: "Customer not found" });
		}

		if (userId && customer.user.toString() !== userId) {
			return res.status(403).json({ error: "You are not authorized to delete this customer" });
		}

		await Customer.findByIdAndDelete(customerId);

		res.status(200).json({ message: "Customer deleted successfully" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;

