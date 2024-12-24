const mongoose = require("mongoose");
// Defining the product scheema
const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  Price: Number,
  image: String,
});

// creating a model
const ProductModel = mongoose.model("Product", productSchema); // product is reffered to the collection name  , in this line refferd that creating a collection by using the new collection name and schema

// exporting this model . and it is accessing in the product-helpers file
module.exports = ProductModel;
