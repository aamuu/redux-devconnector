const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const config = require("config");
const { check, validationResult } = require("express-validator/check");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// @route   GET api/auth
// @desc    Test route
// @access  public
router.get("/", auth, async (request, response) => {
  try {
    const user = await User.findById(request.user.id).select("-password");
    response.json(user);
  } catch (error) {
    console.error(error.message);
    response.status(500).send("Server Error");
  }
});

// @route   GET api/auth
// @desc    authenticate User
// @access  public
router.post("/", [
  check("email", "Please include a valid email")
    .isEmail(),
  check("password", "Password is required")
    .exists()
], async (request, response) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return response.status(400).json({ errors: errors.array() });
  }

  const { email, password } = request.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return response
        .status(400)
        .json({ errors: [{ message: "Invalid credentials" }] });
    }

    const isMatched = await bcrypt.compare(password, user.password);

    if (!isMatched) {
      return response
        .status(400)
        .json({ errors: [{ message: "Invalid credentials" }] });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(payload, config.get("jwtSecret"), { expiresIn: 360000 },
      (error, token) => {
        if (error) {
          throw error;
        } else {
          response.json({ token });
        }
      });
  } catch (error) {
    console.error(error.message());
    response.status(500).send("server Error");
  }

});

module.exports = router;