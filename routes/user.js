var express = require("express");
var router = express.Router();
var adminHelpers = require("../helpers/admin-helpers"); // Accessing the admin-helpers file
var userHelpers = require("../helpers/user-helpers"); // Accessing the user-helpers file
const session = require("express-session");

// This is a function which is used to check that the user is login or not. we will calling this function in all needed place
const verifylogin = (req, res, next) => {
  // it check the user is login or not
  if (req.session.userLoggedIn == true) {
    // if login then it call the next line of the main block
    next();
  } else {
    // if user is not login then it redirect to the login page
    res.redirect("/login");
  }
};

/* GET the home page. */
router.get("/", async function (req, res, next) {
  try {
    let user = req.session.user; // this indicate that if the user where already login then it will store the user data into the user variable . This session is created in the login operation block,
    const products = await adminHelpers.getAllProducts(); // Fetching all products using async/await

    //in here we check that how much item is available in the cart. and the total number of item is displaying in the cart navigation bar (cart badge).
    let cartCount = null;
    // if the user is login then it will display the cart count
    if (req.session.user) {
      // calling a function to get the cart count
      cartCount = await userHelpers.getCartCount(req.session.user._id);
    }
    res.render("user/user-view-products", {
      products, // products data sending to the view-products page
      admin: false, //admin: false , it show that a user is logged in if admin: true it will show that admin is logged in .This data is sent to the user-view-products page
      user, // user data sending to the view-products page.This data is sent to the user-view-products page
      cartCount, // passing the cart count to the user-view-products  page
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Failed to retrieve products.");
  }
});

// used for display the login page
router.get("/login", (req, res) => {
  // if the user is already login then it will redirect to the home page , it is came form "post/login" route
  if (req.session.user == true) {
    res.redirect("/");
    // if the user is not login then it will display the login page
    // and also we where the sent the error message to the user-login page. error where came from "post/login" else block
  } else {
    res.render("user/user-login", {
      loginErr: req.session.userLoginErr,
    });
    // once the error is sent , it will clear the error
    req.session.userLoginErr = false;
  }
});

// used for display the signup page
router.get("/signup", (req, res) => {
  res.render("user/user-signup");
});

// used for storing data into the database . from account creation page
router.post("/signup", (req, res) => {
  //in here we sending the data to the user-helpers -doSignup function
  userHelpers.doSignup(req.body).then((response) => {
    req.session.user = response; // used to store the user data into the session
    req.session.userLoggedIn = true; // This is used to create a session after the user created a account
    res.redirect("/");
  });
});

// login operation is here (checking that user is a previous user or not)
router.post("/login", (req, res) => {
  //in here we sending the data to the user-helpers -dologin function.after the operation the the result is available in the response variable
  userHelpers.dologin(req.body).then((response) => {
    if (response.status == true) {
      req.session.user = response.user; // storing the user data into the session
      req.session.userLoggedIn = true;
      // if the login is successfully completed so wants to redirect to the home page (/ is indicating as the home page)
      res.redirect("/");
    } else {
      // if login is failed then it will store error is true . and pass into the "get/login" route
      req.session.userLoginErr = true;
      // if login is failed then redirect to the login page itself
      res.redirect("/login");
    }
  });
});

// This section is used to logout the user
router.get("/logout", (req, res) => {
  req.session.user = null; // It is used to destroy the session and logout the user (It means clearing all the user data from the session). The session contain null user
  req.session.userLoggedIn = false; // if the user is log out then it make false
  res.redirect("/"); // moving to the home page
});
// CART SECTION IS START FROM HERE ONWARDS
// This is the section for the cart page
// In here we calling the verifylogin function (Top of this file)to check that the user is login or not.if the user is login then only the cart page will display
router.get("/cart", verifylogin, async (req, res) => {
  // if the user is login then it will display the cart page. so we need to collect the items from the database and wants to display into the database
  const products = await userHelpers.getCartItems(req.session.user._id);
  // finding the total amount which the user wants to pay. calling the getTotalAmount function for accessing the total amount which the user wants to pay
  let totalAmount = await userHelpers.getTotalAmount(req.session.user._id);
  // passing the products details , the user details , admin is false into the cart page
  res.render("user/cart", {
    products,
    admin: false,
    user: req.session.user,
    totalAmount, // passing the total amount which the user wants to pay
  });
});

// Accessing the ID of the product which user is added to the cart
// verifylogin :- check that user is login or not because then only the user id can able to collect and pass to the next operation
router.get("/add-to-cart/:id", verifylogin, (req, res) => {
  const productID = req.params.id;
  const userID = req.session.user._id;
  // passing the product ID and User ID to the addToCart
  userHelpers.addToCart(productID, userID).then(() => {
    // if the product is added to the cart then it will redirect to the cart page itself
    res.redirect("/");
  });
});

// This section is used to update the quantity of the product in the cart(increment or decrement)
// control which is came from the script.js file.
router.post("/cart/update-quantity", verifylogin, async (req, res) => {
  const { productId, action, confirmDeletion } = req.body;
  const userID = req.session.user._id;
  // if the action is increment then the if block will call otherwise the else block will call
  try {
    if (action === "increment") {
      await userHelpers.updateProductQuantity(userID, productId, 1);
    } else if (action === "decrement") {
      await userHelpers.updateProductQuantity(
        userID,
        productId,
        -1,
        confirmDeletion
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error in router:", error);
    res.json({ success: false, error });
  }
});

//deleting the products from the cart . when the user click the delete button of the cart then control will came to here.
router.get("/delete-from-cart/:id", verifylogin, async (req, res) => {
  const productID = req.params.id;
  const userID = req.session.user._id;
  userHelpers.deleteFromCart(productID, userID).then((response) => {
    res.redirect("/cart");
  });
});

// place-order page is rendering here . also getting the total amount which the user wants to pay
router.get("/place-order", verifylogin, async (req, res) => {
  let user = req.session.user;
  let totalAmount = await userHelpers.getTotalAmount(req.session.user._id);
  res.render("user/place-order", { admin: false, user, totalAmount });
});

// accessing the place-order page data after the AJAX submission (Ajax submission is done from the place-order file last section).
router.post("/place-order", async (req, res) => {
  // console.log(req.body);
  //accessing the products details
  let products = await userHelpers.getCartProductsList(req.body.userId);
  //accessing the total amount user wants to pay. we already created the function for accessing the total amount
  let totalAmount = await userHelpers.getTotalAmount(req.body.userId);
  // in here passing the entire data like user details(from the place-order page) , products details , total amount which the user wants to pay
  userHelpers.placeOrder(req.body, products, totalAmount).then((response) => {
    res.json({ status: true }); // this data is sent back to the  place-order page AJAX section
  });
});
// used for displaying the order successfull page of COD
router.get("/COD-order-success", (req, res) => {
  let user = req.session.user;
  res.render("user/COD-order-success", {
    admin: false,
    user,
  });
});
// used for displaying all the orders of the user
router.get("/orders", verifylogin, async (req, res) => {
  let user = req.session.user;
  let orders = await userHelpers.getUserOrders(req.session.user._id);
  res.render("user/orders-page", {
    admin: false,
    user,
    orders, // sending the all orders of the particular user to the orders page
  });
});
// This is used to see the full details of order products details
router.get("/view-ordered-products/:id", verifylogin, async (req, res) => {
  let user = req.session.user;
  // passing the order id to the function
  let product = await userHelpers.getOrderProducts(req.params.id);
  res.render("user/view-ordered-products", {
    admin: false,
    user,
    product,
  });
});
// used for displaying the user profile
router.get("/profile", verifylogin, async (req, res) => {
  let user = req.session.user;
  let profileDetails = await userHelpers.getProfileDetails(
    req.session.user._id
  );
  // console.log(profileDetails);
  res.render("user/user-profile", { admin: false, user, profileDetails });
});

//if the user is click the edit button then the control will come to here. and access the data from the database and sent this data to the edit-profile page
router.get("/edit-profile/:id", async (req, res) => {
  let user = req.session.user; //accessing the user id into a variable
  // console.log(req.params.id);
  //calling the previous function again
  let userDetails = await userHelpers.getProfileDetails(req.params.id);
  // console.log(userDetails);
  res.render("user/edit-profile", {
    admin: false,
    user,
    userDetails,
  });
});

// if the user is submitted the editted form then the control will come to here
router.post("/edit-profile", async (req, res) => {
  let userDetails = {
    id: req.body.id,
    name: req.body.name,
    email: req.body.email,
  };
  // console.log("in user.js", userDetails);
  const updatedUser = await userHelpers.editUserDetails(userDetails);
  req.session.user = updatedUser; // saving the updated data into the session
  res.redirect("/profile");
});
module.exports = router;
