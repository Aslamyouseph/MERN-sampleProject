const ProductModel = require("../models/product"); // Import the Mongoose model from the product.js file
const UserModel = require("../models/user-account");
const OrderModel = require("../models/order");
module.exports = {
  // This function is used to add a new product
  // The parameter product comes from the admin.js file req.body
  addProduct: async (product) => {
    try {
      // Create a new product document
      const newProduct = new ProductModel(product);

      // Save the new record to the database using async/await
      await newProduct.save();
      return true; // Success
    } catch (err) {
      console.error("Error adding product:", err);
      throw new Error("Error adding product to the database."); // Rejected promise with error message
    }
  },

  // Used to get all the products from the database
  getAllProducts: async () => {
    try {
      const products = await ProductModel.find().lean();
      // console.log("Fetched products:", products); // Check if products are being fetched properly
      return products;
    } catch (err) {
      throw new Error("Error fetching products:", err);
    }
  },
  // used to delete the product form the database
  deleteProduct: async (productId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const deleteProduct = await ProductModel.findByIdAndDelete(productId); // used to delete the product by using the product id
        resolve(deleteProduct); // returning the result in to the admin.js delete section
      } catch (error) {
        reject(error);
      }
    });
  },
  //used to get the details of a particular product in the database
  getProductDetails: (productId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch the product details from the database by using the product id
        const product = await ProductModel.findById(productId).lean();
        resolve(product); // returning the result in to the admin.js edit or update section
      } catch (error) {
        reject(error);
      }
    });
  }, // This is used to update the old data into the new data (Or remove the old data from the database and store the new data into the database)
  updateProduct: (productDetails) => {
    return new Promise(async (resolve, reject) => {
      const { id, name, category, Price } = productDetails; // storing the product details to each variable
      // Save the updated product details to the database
      await ProductModel.findByIdAndUpdate(id, {
        name,
        category,
        Price,
      });
      resolve(); // Resolve the promise once the update is successful, or control will sent to the admin.js file (function call area)
    });
  },
  // This is used to update the image path
  updateProductImage: async (productId, imagePath) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Update the image path in the database
        await ProductModel.findByIdAndUpdate(productId, { image: imagePath });
        resolve(); // Resolve the promise once the image path update is successful
      } catch (error) {
        reject(error);
      }
    });
  },
  // used for getting the information of all the users
  getAllUsers: async () => {
    try {
      const allUsers = await UserModel.find().lean();
      return allUsers;
    } catch (err) {
      console.error("Error fetching User details:", err);
      throw new Error("Error fetching User details");
    }
  },
  // admin deleting the user
  deleteUser: async (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const deleteUser = await UserModel.findByIdAndDelete(userId);
        resolve(deleteUser);
      } catch (error) {
        reject(error);
      }
    });
  }, // used for getting all the details of the orders
  getAllOrders: async () => {
    return new Promise(async (resolve, reject) => {
      try {
        //To retrieve the user details from the userId stored in the allOrders data, we can use MongoDB's populate feature
        // if the userId is referenced from another collection
        const allOrders = await OrderModel.find()
          .lean()
          .populate("userId", "name email"); // Populate user details (add desired fields)
        // console.log(allOrders);
        resolve(allOrders);
      } catch (error) {
        reject(error);
      }
    });
  },
  // when the user click the Deliver button in the adminViewOrders.hbs then the control will come to admin.js file.
  // this is used to change the status of the delivery. if the user click the deliver button (user page  ,order.hbs page ,status will changed) then the status will change shipped
  updateStatus: async (orderID) => {
    return new Promise(async (resolve, reject) => {
      try {
        const status = "shipped"; // Correctly set the status
        const result = await OrderModel.findByIdAndUpdate(orderID, { status });
        // console.log(result);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
};
