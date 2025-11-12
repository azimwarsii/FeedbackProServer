const express = require('express');
const User = require('../models/User');

const router = express.Router();

// PATCH /edit/:id -> update bio and/or companyName
router.patch('/:id', async function(req, res) {
  const { id } = req.params;
  const { companyName, bio } = req.body || {};

  if (companyName === undefined && bio === undefined) {
    return res.status(400).json({ error: 'Provide companyName and/or bio to update' });
  }

  try {
    const updates = {};
    if (companyName !== undefined) updates.companyName = companyName;
    if (bio !== undefined) updates.bio = bio;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


