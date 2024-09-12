const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

// Define a Mongoose model for your user collection
const User = mongoose.model("User", {
  email: String,
  password: String,
  userType: String,
});

mongoose.connect(
  "mongodb+srv://jumaalfonse:OaaIgHwM4kf14kKP@cluster0.eikr1.mongodb.net/sawacom",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login", req.body);

  try {
    // Search for the user in the database
    const user = await User.findOne({
      email: { $regex: new RegExp(email, "i") },
    });
    console.log("User Data:", user);

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Check if the provided password matches the stored hashed password
    const passwordMatch = await bcryptjs.compare(password, user.password);
    console.log("Password Match:", passwordMatch);

    if (passwordMatch) {
      // Generate a JWT token
      const token = jwt.sign(
        { email: user.email, userType: user.userType },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1h",
        }
      );

      // Determine the redirect URL based on user type
      let redirectUrl = "/";
      switch (user.userType.toLowerCase()) {
        case "user":
          redirectUrl = "/booking";
          break;
        case "admin":
          redirectUrl = "/master";
          break;
        case "technician":
          redirectUrl = "/repaircenter";
          break;
        default:
          redirectUrl = "/"; // Default route if userType is not recognized
          break;
      }

      // Send the response with the token and redirect URL
      res.json({ token, email: user.email, userId: user._id, redirectUrl });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

module.exports = router;