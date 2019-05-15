const express = require("express");
const router = express.Router();

// @route   GET api/posts
// @desc    Test route
// @access  public
router.get("/", (request, response) => response.send("Posts Route"));

module.exports = router;