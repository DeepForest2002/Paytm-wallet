const express = require("express");
const { authMiddleware } = require("../middleware");
const accountRouter = express.Router();
const { AccountTable } = require("../database");
const mongoose = require("mongoose");
accountRouter.get("/", (req, res) => {
  res.json({
    msg: "Account Router is fine",
  });
});

//add an router to get the balances of an user it is a get req
accountRouter.get("/balance", authMiddleware, async (req, res) => {
  const account = await AccountTable.findOne({
    userId: req.userId,
  });
  if (!account) {
    return res.status(401).json({
      msg: "Account not found",
    });
  }
  res.status(200).json({
    balance: account.balance,
  });
});

//Now the route should be of post req for txn
accountRouter.post("/transaction", authMiddleware, async (req, res) => {
  //creating a session
  const session = await mongoose.startSession();
  session.startTransaction();
  const { to, amount } = req.body;
  const account = AccountTable.findOne({
    userId: req.userId,
  }).session(session);

  if (!account || account.balance < amount) {
    await session.abortTransaction();
    return res.status(400).json({
      msg: "Insufficient Balance",
    });
  }

  //find the reciver side person
  const toAccount = await AccountTable.findOne({
    userId: to,
  }).session(session);

  //if the reciver side is not found
  if (!toAccount) {
    await session.abortTransaction();
    return res.json({
      msg: "Invalid Account",
    });
  }

  //After that update the balance in both table
  await AccountTable.updateOne(
    { userId: req.userId },
    { $inc: { balance: -amount } }
  );
  await AccountTable.updateOne({ userId: to }, { $inc: { balance: amount } });
  await session.commitTransaction();
  res.json({
    msg: "Transfer Sucessfull",
  });
});

module.exports = accountRouter;
