var express = require('express');
var router = express.Router();
const mongoose = require("mongoose");
const User = require('../models/User');
const Transaction = require("../models/Transaction");

async function createWalletTransaction({ userId, type, amount, description }) {
  const normalizedAmount = Number(amount);
  if (!['credit', 'debit'].includes(type)) {
    const err = new Error("type must be 'credit' or 'debit'");
    err.statusCode = 400;
    throw err;
  }
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    const err = new Error('amount must be a positive number');
    err.statusCode = 400;
    throw err;
  }

  const session = await mongoose.startSession();
  try {
    let newTransaction;
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        throw err;
      }

      const currentBalance = user.walletBalance || 0;
      if (type === 'debit' && currentBalance < normalizedAmount) {
        const err = new Error('Insufficient wallet balance');
        err.statusCode = 400;
        throw err;
      }

      const newBalance =
        type === 'credit'
          ? currentBalance + normalizedAmount
          : currentBalance - normalizedAmount;

      user.walletBalance = newBalance;
      await user.save({ session });

      const [created] = await Transaction.create([{
        user: user._id,
        type,
        amount: normalizedAmount,
        description: description || '',
        balanceAfter: newBalance
      }], { session });
      newTransaction = created;
    });
    return newTransaction;
  } finally {
    await session.endSession();
  }
}

// GET /users/:id/wallet -> return wallet balance and recent transactions
router.get('/:id/wallet', async function(req, res) {
  const { id } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const transactions = await Transaction.find({ user: id })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.status(200).json({
      balance: user.walletBalance || 0,
      transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/:id/transactions -> full transaction history (paginated)
router.get('/:id/transactions', async function(req, res) {
  const { id } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const skip = (page - 1) * limit;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [transactions, total] = await Promise.all([
      Transaction.find({ user: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ user: id }),
    ]);

    res.status(200).json({
      balance: user.walletBalance || 0,
      transactions,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/:id/wallet/transactions -> create a credit/debit transaction
router.post('/:id/wallet/transactions', async function(req, res) {
  const { id } = req.params;
  const { type, amount, description } = req.body || {};
  try {
    const newTransaction = await createWalletTransaction({
      userId: id,
      type,
      amount,
      description
    });
    res.status(201).json({
      balance: newTransaction.balanceAfter,
      transaction: newTransaction
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/:id/wallet/add -> convenience route to credit wallet
router.post('/:id/wallet/add', async function(req, res) {
  const { id } = req.params;
  const { amount, description } = req.body || {};

  try {
    const newTransaction = await createWalletTransaction({
      userId: id,
      type: "credit",
      amount,
      description
    });
    res.status(201).json({
      balance: newTransaction.balanceAfter,
      transaction: newTransaction
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/:id/wallet/deduct -> convenience route to debit wallet
router.post('/:id/wallet/deduct', async function(req, res) {
  const { id } = req.params;
  const { amount, description } = req.body || {};

  try {
    const newTransaction = await createWalletTransaction({
      userId: id,
      type: "debit",
      amount,
      description
    });
    res.status(201).json({
      balance: newTransaction.balanceAfter,
      transaction: newTransaction
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/:id -> return full user document
router.get('/:id', async function(req, res) {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
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
