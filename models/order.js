const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Order Schema
const orderSchema = new Schema({
  deliveryDetails: {
    mobile: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    place: {
      type: String,
      required: true,
    },
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User", // Assuming there is a "User" model
  },
  paymentMethod: {
    type: String,
    enum: ["cod", "online"], // Validating the paymentMethod field
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Product", // Assuming there is a "Product" model
      },
      name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true, // Price is required for each product
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["placed", "pending", "shipped", "delivered"], // Add other status options as needed
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the Order model from the schema
const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
