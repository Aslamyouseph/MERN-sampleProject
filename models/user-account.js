const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // This library is used to hash the password before saving it to the database

// Defining the user schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true }, // User's full name (required)
  email: { type: String, required: true, unique: true }, // Email (required and unique)
  password: { type: String, required: true }, // Hashed password (required)
});

// Pre-save middleware to hash the password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip if password is not modified
  try {
    this.password = await bcrypt.hash(this.password, 10); // Hash the password
    next();
  } catch (error) {
    next(error);
  }
});

// Creating the model
const UserModel = mongoose.model("User", userSchema); // Refers to the 'users' collection in MongoDB

// Exporting the model
module.exports = UserModel;
