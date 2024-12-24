// Select all quantity buttons (increment and decrement) in the cart
document.querySelectorAll(".cart-item-count").forEach((button) => {
  // Add a click event listener for each button
  button.addEventListener("click", async (e) => {
    // Retrieve the product ID and action (increment or decrement) from the button's data attributes
    const productId = e.target.getAttribute("data-product-id");
    const action = e.target.getAttribute("data-action");

    // Ensure that a valid product ID is provided
    if (!productId) {
      alert("Invalid product ID"); // Alert the user if the product ID is missing or invalid
      return; // Exit the function early
    }

    try {
      // Send a POST request to the server with the product ID and action
      const response = await fetch(`/cart/update-quantity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Inform the server that the request body is in JSON format
        },
        body: JSON.stringify({ productId, action }), // Include the product ID and action in the request body
      });

      // Parse the server's JSON response
      const data = await response.json();

      if (data.success) {
        // Reload the page to reflect the updated quantity in the cart
        window.location.reload();
      } else if (
        // Check if the server responded with a "Minimum quantity reached" error
        data.error === "Minimum quantity reached. Confirm deletion to proceed."
      ) {
        // Display a confirmation dialog asking the user if they want to remove the product
        const confirmDelete = confirm(
          "Minimum quantity reached. Do you want to remove this product from your cart?"
        );

        if (confirmDelete) {
          // Send another POST request to confirm the deletion of the product
          const confirmResponse = await fetch(`/cart/update-quantity`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json", // Inform the server about the JSON format
            },
            body: JSON.stringify({ productId, action, confirmDeletion: true }), // Include the confirmDeletion flag
          });

          // Parse the server's response for the deletion request
          const confirmData = await confirmResponse.json();

          if (confirmData.success) {
            // Reload the page to reflect the removal of the product
            window.location.reload();
          } else {
            // Alert the user if the deletion fails
            alert(confirmData.error || "Failed to update quantity");
          }
        }
      } else {
        // Alert the user for any other errors from the server
        alert(data.error || "Failed to update quantity");
      }
    } catch (error) {
      // Handle any unexpected errors or issues with the fetch request
      console.error("Error updating quantity:", error); // Log the error for debugging
      alert("An error occurred. Please try again."); // Notify the user of the error
    }
  });
});
