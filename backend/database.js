const mongoose = require("mongoose");
const { number } = require("zod");
const { required } = require("zod/mini");

// ✅ Always handle async connection properly
mongoose
  .connect("mongodb+srv://Sayan:2002@cluster0.u8bet2x.mongodb.net/paytm-app")
  .then(() => console.log("✅ MongoDB Connection Established"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

// ✅ Define user schema (field names should be consistent)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  password: { type: String, required: true },
});

const AccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance: {
    type: Number,
    require: true,
  },
});

// ✅ Create a model
const UserTable = mongoose.model("UserTable", UserSchema);
const AccountTable = mongoose.model("AccountTable", AccountSchema);

// ✅ Export model
module.exports = { UserTable, AccountTable };
