const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const extRequest = require("request");
const config = require("config");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator/check");

// @route   GET api/profile/me
// @desc    Get current user profile
// @access  private
router.get("/me", auth, async (request, response) => {
  try {
    const profile = await Profile.findOne({ user: request.user.id }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return response.status(400).json({ "message": "There is no profile for this user" });
    }

  } catch (error) {
    console.error(error.message);
    response.status(500).send("Server Error");
  }
});

// @route   GET api/profile/me
// @desc    Get current user profile
// @access  private
router.post("/", [auth, [
  check("status", "status is required")
    .not()
    .isEmpty(),
  check("skills", "skills is required")
    .not()
    .isEmpty()
]], async (request, response) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return response.status(400).json({ errors: errors.array() });
  }

  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin
  } = request.body;

  // Build profile object
  const profileFields = {};
  profileFields.user = request.user.id;
  if (company) profileFields.company = company;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (githubusername) profileFields.githubusername = githubusername;
  if (skills) {
    profileFields.skills = skills.split(",").map(skill => skill.trim());
  }

  // Build social object
  profileFields.social = {};
  if (youtube) profileFields.social.youtube = youtube;
  if (twitter) profileFields.social.twitter = twitter;
  if (facebook) profileFields.social.facebook = facebook;
  if (linkedin) profileFields.social.linkedin = linkedin;
  if (instagram) profileFields.social.instagram = instagram;

  try {
    let profile = await Profile.findOne({ user: request.user.id });
    if (profile) {
      //update
      profile = await Profile.findOneAndUpdate({ user: request.user.id }, { $set: profileFields }, { new: true });

      return response.json(profile);
    }

    profile = new Profile(profileFields);
    await profile.save();
    response.json(profile);

  } catch (error) {
    console.error(error.message);
    response.status(500).send("Server Error");
  }

  response.send("Hello");

});

// @route   GET api/profile
// @desc    Get all profiles
// @access  public

router.get("/", async (request, response) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    response.json(profiles);
  } catch (error) {
    console.error(error.message);
    response.status(500).send("Server Error");
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Get  profile for user ID
// @access  public
router.get("/user/:user_id", async (request, response) => {
  try {
    const profile = await Profile.findOne({ user: request.params.user_id }).populate("user", ["name", "avatar"]);
    if (!profile) {
      response.status(400).json({ message: "Profile not found" });
    }
    response.json(profile);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      response.status(400).json({ message: "Profile not found" });
    }
    response.status(500).send("Server Error");
  }
});

// @route   DELETE api/profile
// @desc    Delete User, Profile and Posts
// @access  private
router.delete("/", auth, async (request, response) => {
  try {
    await Profile.findOneAndRemove({ user: request.user.id });
    await User.findOneAndRemove({ _id: request.user.id });
    response.json({ message: "User removed" });
  } catch (error) {
    console.error(error.message);

    response.status(500).send("Server Error");
  }
});

// @route   PATCH api/profile/education
// @desc    Add profile education
// @access  private
router.patch("/education", [auth, [
  check("school", "School is required")
    .not()
    .isEmpty(),
  check("degree", "Degree is required")
    .not()
    .isEmpty(),
  check("fieldofstudy", "Study field is required")
    .not()
    .isEmpty(),
  check("from", "From date is required")
    .not()
    .isEmpty()
]], async (request, response) => {

  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return response.status(400).json({ errors: errors.array() });
  }

  const { school, degree, fieldofstudy, from, to, current, description } = request.body;

  const newEdu = {
    school, degree, fieldofstudy, from, to, current, description
  };

  try {
    const profile = await Profile.findOne({ user: request.user.id });
    profile.education.unshift(newEdu);
    await profile.save();
    response.json(profile);
  } catch (error) {
    console.error(error.message);
    response.status(500).send("Server Error");
  }
});


// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  private
router.patch("/education/:edu_id", auth, async (request, response) => {
  try {
    const profile = await Profile.findOne({ user: request.user.id });
    const removeIndex = profile.education.map(edu => edu.id).indexOf(request.params.edu_id);
    profile.education.splice(removeIndex, 1);
    await profile.save();

    response.json(profile);
  } catch (error) {
    console.error(error.message);
    response.status(500).send("Server Error");
  }
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
        }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "GET",
      headers: { "user-agent": "node.js" }
    };

    extRequest(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: "No Github profile found" });
      }

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;