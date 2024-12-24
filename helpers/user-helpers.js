const mongoose = require("mongoose");
const UserModel = require("../models/user-account");
const CartModel = require("../models/add-to-cart");
const OrderModel = require("../models/order");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb"); // used to convert the string to ObjectId
const { reject } = require("promise");
const Order = require("../models/order");

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Create a new user using the Mongoose model
        const newUser = new UserModel(userData); // Pass userData directly
        const result = await newUser.save(); // Save the user to database (password will be hashed automatically)
        resolve(result); // returning the result and it is accessing in the user.js file
      } catch (error) {
        reject(error);
      }
    });
  },
  dologin: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        // checking that the user enter email which is correct to the email available in the database
        // email: => this indicate the email which is available in the database
        // userData.email => this indicate the email which is entered by the user
        let user = await UserModel.findOne({ email: userData.email });
        //if it is correct then the balanced operation is performed
        if (user) {
          // Comparing the user entered password with the stored password in database (hashed password)
          // userData.password => this indicate the password which is entered by the user
          // user.password => this indicate the password which is available in the database
          const isPasswordCorrect = await bcrypt.compare(
            userData.password,
            user.password
          );
          // if password is correct return true , and also return the user details . This user details store to then((response)=>{}) in the user.js file
          if (isPasswordCorrect) {
            resolve({ status: true, user: user });
          } else {
            resolve({ status: false });
          }
        } else {
          resolve({ status: false });
        }
      } catch (error) {
        // Handle any errors during the process
        console.error("Error during login:", error);
        reject("An error occurred during login");
      }
    });
  }, //FROM HERE ONWARDS THE ADD TO CART FUNCTION IS STARTED
  // In here new cart or collection is creating in the database
  addToCart: async (productID, userID) => {
    return new Promise(async (resolve, reject) => {
      // Convert userID to ObjectId if needed
      const userObjectId = new ObjectId(userID);
      //finding that the user have a cart by using the userID
      const userCart = await CartModel.findOne({ userId: userObjectId });
      // if the user have a cart then only need to push the items into the cart
      if (userCart) {
        // updating the collection by adding the new cart items
        await CartModel.updateOne(
          { userId: userObjectId },
          { $push: { products: { productId: productID } } }
        );
        resolve();
      }
      // if the user don't have a cart then it will create a new cart and push the items into the cart
      else {
        // storing the producct ID and the user ID into a varible called cartObj
        const cartObj = {
          userId: userObjectId,
          products: [{ productId: productID }],
        };
        //creating a new cart collection in the database
        const newCart = new CartModel(cartObj);
        await newCart.save(); // Save the information into the database collection
        resolve();
      }
    });
  }, // retrieving the cart items from the database and passing to the user.js file for displaying into the cart page
  getCartItems: async (userID) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userObjectId = new ObjectId(userID);
        //The populate() method collects information from another collection based on a reference, like an ID, and fills in the actual data for you.
        const cartItems = await CartModel.findOne({ userId: userObjectId })
          .populate("products.productId")
          .exec();
        // Check if the cart exists and then extract the product details
        if (cartItems) {
          // Map the product details from the populated `productId`
          const productDetails = cartItems.products.map((item) => {
            return {
              _id: item.productId._id,
              name: item.productId.name,
              Price: item.productId.Price,
              image: item.productId.image || "default.jpg",
              quantity: item.quantity || 1, // Default quantity if not set
            };
          });
          resolve(productDetails); // Return only the product details
        } else {
          resolve([]);
        }
      } catch (error) {
        reject(error);
      }
    });
  }, // in here we founding the total number of item in the cart to display in the cart navigation bar
  getCartCount: (userID) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      try {
        // Convert userID to ObjectId
        const userObjectId = new ObjectId(userID);
        // finding the cart of a user by using the ID
        //The populate() method collects information from another collection based on a reference, like an ID, and fills in the actual data for you.
        const cartItems = await CartModel.findOne({ userId: userObjectId })
          .populate("products.productId")
          .exec();
        // if there is a cart which is available then for a particular user then that cart count will sent to the user.js file
        if (cartItems) {
          count = cartItems.products.length;
        }
        resolve(count);
      } catch (error) {
        reject(error);
      }
    });
  },
  // updating the quantity of the product in the cart(increment or decrement)
  updateProductQuantity: async (
    userID, // The ID of the user whose cart is being updated
    productID, // The ID of the product whose quantity is being changed
    change, // The amount to change the quantity by (+1 for increment, -1 for decrement)
    confirmDeletion = false // Flag indicating if the user has confirmed deletion when the quantity is less than 1
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Convert userID and productID to ObjectId instances for MongoDB operations
        const userObjectId = new ObjectId(userID);
        const productObjectId = new ObjectId(productID);

        // Find the user's cart in the database
        const cart = await CartModel.findOne({ userId: userObjectId });

        if (cart) {
          // Find the product in the user's cart
          const product = cart.products.find((item) =>
            item.productId.equals(productObjectId)
          );

          if (product) {
            // Calculate the new quantity for the product
            const newQuantity = (product.quantity || 1) + change;

            // If the new quantity is less than 1 and deletion is not confirmed, reject with an error
            if (newQuantity < 1 && !confirmDeletion) {
              return reject(
                "Minimum quantity reached. Confirm deletion to proceed."
              );
            }

            if (newQuantity <= 0) {
              // If the new quantity is 0 or less, remove the product from the cart
              cart.products = cart.products.filter(
                (item) => !item.productId.equals(productObjectId)
              );
            } else {
              // Otherwise, update the product's quantity in the cart
              product.quantity = newQuantity;
            }

            // Save the updated cart back to the database
            await cart.save();
            resolve(); // Resolve the promise indicating the operation was successful
          } else {
            // Reject if the product is not found in the cart
            reject("Product not found in cart");
          }
        } else {
          // Reject if the cart is not found for the user
          reject("Cart not found");
        }
      } catch (error) {
        // Log any errors encountered and reject with the error
        console.error("Error in helper function:", error);
        reject(error);
      }
    });
  },

  //deleting the products from the cart
  deleteFromCart: async (productID, userID) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Convert userID to ObjectId
        const userObjectId = new ObjectId(userID);
        // finding the cart of a user by using the ID
        const cart = await CartModel.findOne({ userId: userObjectId });
        if (cart) {
          const productIndex = cart.products.findIndex(
            (item) => item.productId.toString() === productID
          );
          if (productIndex !== -1) {
            cart.products.splice(productIndex, 1);
            await cart.save();
            resolve();
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }, // getting the total amount which the user wants to pay
  getTotalAmount: async (userID) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userObjectId = new ObjectId(userID);
        //The populate() method collects information from another collection based on a reference, like an ID, and fills in the actual data for you.
        const cart = await CartModel.findOne({ userId: userObjectId })
          .populate("products.productId")
          .exec();

        if (cart) {
          const totalAmount = cart.products.reduce((total, item) => {
            const product = item.productId;

            const price = product.Price || 0; // Change 'price' to 'Price'
            const quantity = item.quantity || 1;

            return total + price * quantity;
          }, 0);

          resolve(totalAmount);
        } else {
          resolve(0);
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  //placeOrder operations is done in here
  //getting the products details from the cart
  getCartProductsList: (userID) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Find the user's cart and populate the product details
        //The populate() method collects information from another collection based on a reference, like an ID, and fills in the actual data for you.
        let cart = await CartModel.findOne({ userId: new ObjectId(userID) })
          .populate("products.productId") // Populate product details from Product model
          .exec();

        if (cart) {
          // Map the cart products to include product name and price
          let products = cart.products.map((product) => {
            return {
              productId: product.productId._id, // Store the product ID
              name: product.productId.name, // Access the product's name
              quantity: product.quantity, // Access the quantity in the cart
              price: product.productId.Price, // Access the product's price
            };
          });

          resolve(products);
        } else {
          reject("No cart found for the user.");
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  // acepting the order details, products details, and the total amount ,(total amount which is already we calculated in the getTotalAmount function)
  placeOrder: async (order, products, totalAmount) => {
    return new Promise(async (resolve, reject) => {
      let status;
      if (order.paymentMethod === "cod") {
        status = "placed";
      } else {
        status = "pending";
      }

      let orderObj = {
        deliveryDetails: {
          mobile: order.mobile,
          address: order.address,
          pincode: order.pincode,
          place: order.place,
        },
        userId: new ObjectId(order.userId),
        paymentMethod: order.paymentMethod,
        products: products,
        totalAmount: totalAmount,
        status: status,
        date: new Date(), // used for the current date displaying
      };

      // Create a new order instance using the orderObj (data)
      let newOrder = new OrderModel(orderObj);
      // Save the new order to the MongoDB database
      await newOrder.save();
      //if the user is place his order then the user cart will remove (after the order the user didnot have the cart. items from the cart will be removed)
      await CartModel.deleteOne({ userId: new ObjectId(order.userId) });
      resolve();
    });
  },

  //getting the all orders of the particular user from the database
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await OrderModel.find({ userId: new ObjectId(userId) })
        .sort({ date: -1 })
        .lean();
      // console.log(orders);
      resolve(orders);
    });
  },
  // This is used to see the full details of order products details
  getOrderProducts: (OrderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Find a specific order by its unique ID (OrderId)
        let orderItems = await OrderModel.findOne({
          _id: new ObjectId(OrderId),
        })
          // Populate the 'productId' in the 'products' array with actual product details
          //The populate() method collects information from another collection based on a reference, like an ID, and fills in the actual data for you.
          .populate("products.productId")
          // Use lean() to return a plain JavaScript object for better performance
          .lean();
        resolve(orderItems);
        // console.log(orderItems);
      } catch (error) {
        reject(error);
      }
    });
  }, // taking the details of the user to display in the profile page
  getProfileDetails: (userID) => {
    return new Promise(async (resolve, reject) => {
      try {
        //finding the user by using the userID
        let userDetails = await UserModel.findById(userID).lean();
        resolve(userDetails);
        // console.log(userDetails);
      } catch (error) {
        reject(error);
      }
    });
  },
  //updating or editing the user profile details
  editUserDetails: (userDetails) => {
    return new Promise(async (resolve, reject) => {
      try {
        // console.log("in user helpers", userDetails);
        const { id, name, email } = userDetails;
        await UserModel.findByIdAndUpdate(id, {
          name,
          email,
        });
        // Fetch the updated user details. for saving to the session
        const updatedUser = await UserModel.findById(id);
        resolve(updatedUser);
      } catch (error) {
        reject(error);
      }
    });
  },
};
