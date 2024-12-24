var express = require("express");
var router = express.Router();
var adminHelpers = require("../helpers/admin-helpers"); // Accessing the product-helpers file
var path = require("path"); //it is used to get the correct path
var fs = require("fs"); //The fs module (File System) is used to interact with the file system, allowing you to read, write, and manipulate files and directories.
const { log } = require("console");

// Updated / GET route for fetching all products
router.get("/", async function (req, res, next) {
  try {
    const products = await adminHelpers.getAllProducts(); // Fetching all products using async/await
    res.render("admin/view-products", {
      products,
      admin: true,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Failed to retrieve products.");
  }
});

/**adding the new product  (After clicking ADD PRODUCTS control will come to here)*/
router.get("/add-product", function (req, res) {
  res.render("admin/add-product", { admin: true });
});

/**after submitting the form the control will come to here */
// Updated /add-product POST route
router.post("/add-product", function (req, res) {
  // checking if the image is uploaded
  if (!req.files || !req.files.image) {
    return res.status(400).send("No file uploaded.");
  }

  const { name, category, Price } = req.body; // extracting name and category
  const imageFile = req.files.image; // extracting image

  // Generate a unique file name and save the image to the public/product-images directory
  const imagePath = path.join(
    __dirname,
    "../public/product-images",
    imageFile.name
  );

  // Move image file into the imagepath(public/product-images) folder
  imageFile.mv(imagePath, (err) => {
    if (err) {
      console.error("Error saving file:", err);
      return res.status(500).send("Error uploading file.");
    }

    // Construct product data by using the previous data
    const productData = {
      name,
      category,
      Price,
      image: `/product-images/${imageFile.name}`, // Relative path for the image
    };
    // Passing the data to the addProduct function (in the product-helpers file)
    adminHelpers
      .addProduct(productData)
      .then(() => {
        res.redirect("/admin"); // Redirect to the products page after successful upload
      })
      .catch((err) => {
        console.error("Error adding product:", err);
        res.status(500).send("Error adding product to database.");
      });
  });
});

//This is used to delete the products by admin
router.get("/delete-product/:id", (req, res) => {
  const productId = req.params.id; // assessing the user clicked product id
  // sending the product id to the deleteProduct function in admin-helpers file
  adminHelpers.deleteProduct(productId).then((response) => {
    res.redirect("/admin");
  });
});

//This is used to when the admin click the edit button then the details of that product where collecting from here
// /:id" is used to get the product id
router.get("/edit-product/:id", async (req, res) => {
  const editProductId = await adminHelpers.getProductDetails(req.params.id); // passing the product id to the getProductDetails function to get the details of the single product
  // calling thr edit-product.hbs by passing the editProductId
  res.render("admin/edit-product", { editProductId, admin: true });
});

// This is used to when the admin click the edited form (edit-product.hbs)then control will come to here
router.post("/edit-product", async (req, res) => {
  // Extract product details from the request body and store them in to a variable
  const productDetails = {
    id: req.body.id,
    name: req.body.name,
    category: req.body.category,
    Price: req.body.Price,
  };
  await adminHelpers.updateProduct(productDetails); // passing the product details to the updateProduct function in the admin-helpers file
  //  from here onward the image uploading operation is starting
  if (req.files && req.files.image) {
    let imageFile = req.files.image;

    // collecting the path of the image
    const imagePath = path.join(
      __dirname,
      "../public/product-images",
      `${req.body.id}.jpg`
    );
    // Wait for the file to be moved to the desired location
    await imageFile.mv(imagePath);

    // Update the image path in the database, control move to the updateProductImage function in the admin-helpers file
    const updatedImagePath = `/product-images/${req.body.id}.jpg`;
    await adminHelpers.updateProductImage(req.body.id, updatedImagePath);
  }
  // Redirect back to the admin product listing page
  res.redirect("/admin");
});
// used for view all users who created the account
router.get("/viewAllUsers", async (req, res) => {
  try {
    const allUsers = await adminHelpers.getAllUsers();
    // console.log(allUsers);
    res.render("admin/viewAllUsers", { admin: true, allUsers });
  } catch (err) {
    console.error("Error fetching all users:", err.message);
    res.status(500).send("Internal Server Error");
  }
});
//admin deleting a user
router.get("/delete-user/:id", async (req, res) => {
  const userID = req.params.id;
  adminHelpers.deleteUser(userID).then((response) => {
    res.redirect("/admin/viewAllUsers");
  });
});

// displaying all order page
router.get("/admin-orders", async (req, res) => {
  const allOrders = await adminHelpers.getAllOrders();
  //console.log(allOrders);
  // passing the allOrders data to the adminViewOrders.hbs file
  res.render("admin/adminViewOrders", { admin: true, allOrders });
});

// when the user click the Deliver button in the adminViewOrders.hbs then the control will come to here.
// this is used to change the status of the delivery. if the user click the deliver button (user page  ,order.hbs page ,status will changed) then the status will change shipped
router.post("/deliverStatus/:id", async (req, res) => {
  const orderId = req.params.id;
  await adminHelpers.updateStatus(orderId);
  res.redirect("/admin/admin-orders");
});

module.exports = router;
