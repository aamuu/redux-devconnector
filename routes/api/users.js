const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const config = require("config");

const User = require("../../models/User");

// @route   GET api/users
// @desc    Register User
// @access  public
router.post("/", [
  check("name", "Name is required")
    .not()
    .isEmpty(),
  check("email", "Please include a valid email")
    .isEmail(),
  check("password", "Please enter a password with 6 or more characters")
    .isLength({ min: 6 })
], async (request, response) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return response.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = request.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return response
        .status(400)
        .json({ errors: [{ msg: "User already exists" }] });
    }

    const avatar = gravatar.url(email, {
      s: "200",
      r: "pg",
      d: "mm"
    });

    user = new User({
      name,
      email,
      avatar,
      password
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
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