const express = require("express");
const userRouter = express.Router();
const { SECRET_KEY } = require("../config");
const jwt = require("jsonwebtoken");
const zod = require("zod");
const { UserTable, AccountTable } = require("../database");
const { authMiddleware } = require("../middleware");

userRouter.get("/", (req, res) => {
  res.json({
    msg: "User Router Working fine",
  });
});

//Signup Schema
const SignupSchema = zod.object({
  username: zod.string().email(),
  firstname: zod.string(),
  lastname: zod.string(),
  password: zod.string().min(8),
});

userRouter.post("/signup", async (req, res) => {
  const body = req.body;
  const { success } = SignupSchema.safeParse(body);
  if (!success) {
    return res.status(401).json({
      msg: "Incorrect Inputs",
    });
  }
  const existing_user = await UserTable.findOne({ username: body.username });
  if (existing_user) {
    return res.status(401).json({
      msg: "User already exists",
    });
  }

  const dbUser = await UserTable.create({
    username: body.username,
    firstname: body.firstname,
    lastname: body.lastname,
    password: body.password,
  });
  const userId = dbUser._id;

  //whenever an user signs up give them a random balance
  await AccountTable.create({
    userId: userId,
    balance: 1 + Math.random() * 10000,
  });

  const token = jwt.sign({ userId }, SECRET_KEY);
  res.json({
    msg: "User Created",
    token: token,
  });
});

//SignIn Schema
const SigninSchema = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

userRouter.post("/signin", async (req, res) => {
  const body = req.body;
  const Sucess = SigninSchema.safeParse(body);
  if (!Sucess) {
    return res.status(401).json({
      msg: "Incorrect Input",
    });
  }

  const user = await UserTable.findOne({
    username: body.username,
    password: body.password,
  });

  if (user) {
    const token = jwt.sign({ userId: user._id }, SECRET_KEY);
    return res.json({
      token: token,
    });
  }
  res.status(401).json({
    msg: "Some error Occured",
  });
});

//Update Table

const UpdateSchema = zod.object({
  firstname: zod.string().optional(),
  lastname: zod.string().optional(),
  password: zod.string().min(8).optional(),
});

userRouter.put("/", authMiddleware, async (req, res) => {
  const body = req.body;

  const { success } = UpdateSchema.safeParse(body);
  if (!success) {
    return res.status(411).json({
      message: "Error while updating information",
    });
  }

  try {
    await UserTable.updateOne({ _id: req.userId }, { $set: body });
    res.json({
      message: "Updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database update failed" });
  }
});

//write a path to find users that are connected to current users
userRouter.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";
  const users = await UserTable.find({
    $or: [
      {
        firstname: {
          $regex: filter,
        },
      },
      {
        lastname: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstname,
      lastName: user.lastname,
      _id: user._id,
    })),
  });
});

module.exports = userRouter;
