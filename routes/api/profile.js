const express = require("express");
const router = express.Router();

// @route   GET api/profile
// @desc    Test route
// @access  public
router.get("/", (request, response) => response.send("Profile Route"));

module.exports = router;