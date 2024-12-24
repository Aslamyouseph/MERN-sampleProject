const mongoose = require("mongoose");

// Defining the Cart schema
const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the user
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      }, // Reference to the product
      quantity: { type: Number, default: 1 }, // Quantity of the product
    },
  ],
});

// Creating a model
const CartModel = mongoose.model("Cart", cartSchema); // 'Cart' is referred to as the collection name in MongoDB

// Exporting this model for use in other files
module.exports = CartModel;
