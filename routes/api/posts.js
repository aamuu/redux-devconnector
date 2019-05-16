const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator/check");
const Post = require("../../models/Posts");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route   POST api/posts
// @desc    Create a post
// @access  private
router.post("/", [auth, [
  check("text", "Text field is required")
    .not()
    .isEmpty()
]], async (request, response) => {

  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return response.status(400).json({ errors: errors.array() });
  }

  try {

    const user = await User.findById(request.user.id).select("-password");
    const newPost = new Post({ text: request.body.text, name: user.name, avatar: user.avatar, user: request.user.id });

    const post = await newPost.save();
    response.json(post);
  } catch (error) {
    console.error(error.message);
    response.status(500).send("Server Error");
  }
});

// @route   GET api/posts
// @desc    Get all post
// @access  private
router.get("/", auth, async (request, response) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    response.json(posts);
  } catch (error) {
    console.error(error.message);
    response.status(500).send("Server Error");
  }
});

// @route   GET api/posts/:id
// @desc    Get post by id
// @access  private
router.get("/:id", auth, async (request, response) => {
  try {
    const post = await Post.findById(request.params.id);
    if (!post) {
      return response.status(404).json({ message: "Post not found" });
    }
    response.json(post);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return response.status(404).json({ message: "Post not found" });
    }
    response.status(500).send("Server Error");
  }
});

// @route   GET api/posts/:id
// @desc    delete post by id
// @access  Private
router.delete("/:id", auth, async (request, response) => {
  try {

    const post = await Post.findById(request.params.id);

    if (!post) {
      return response.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== request.user.id) {
      return response.status(40).json({ message: "User not authorized" });
    } else {
      await post.remove();
    }
    response.json({ message: "Post removed" });

  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return response.status(404).json({ message: "Post not found" });
    }
    response.status(500).send("Server Error");
  }
});

// @route   PATCH api/posts/like/:id
// @desc    like a post
// @access  private
router.patch("/like/:id", auth, async (request, response) => {
  try {
    const post = await Post.findById(request.params.id);
    if (post.likes.filter(like => like.user.toString() === request.user.id).length > 0) {
      return response.status(400).json({ message: "Post already liked" });
    }
    post.likes.unshift({ user: request.user.id });
    await post.save();
    response.json(post.likes);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return response.status(404).json({ message: "Post not found" });
    }
    response.status(500).send("Server Error");
  }
});

// @route   PATCH api/posts/like/:id
// @desc    unlike a post
// @access  private
router.patch("/unlike/:id", auth, async (request, response) => {
  try {
    const post = await Post.findById(request.params.id);
    if (post.likes.filter(like => like.user.toString() === request.user.id).length === 0) {
      return response.status(400).json({ message: "Post has not yet been liked" });
    }

    const removeIndex = post.likes.map(like => like.user.toString()).indexOf(request.user.id);
    post.likes.splice(removeIndex, 1);

    await post.save();
    response.json(post.likes);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return response.status(404).json({ message: "Post not found" });
    }
    response.status(500).send("Server Error");
  }
});

// @route   POST api/posts/comment/:id
// @desc    Create a post comment
// @access  private
router.post("/comment/:id", [auth, [
  check("text", "Text field is required")
    .not()
    .isEmpty()
]], async (request, response) => {

  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return response.status(400).json({ errors: errors.array() });
  }

  try {

    const user = await User.findById(request.user.id).select("-password");
    const post = await Post.findById(request.params.id);
    const newComment = { text: request.body.text, name: user.name, avatar: user.avatar, user: request.user.id };

    post.comments.unshift(newComment);
    await post.save();

    response.json(post.comments);
  } catch (error) {
    console.error(error.message);
    response.status(500).send("Server Error");
  }
});

// @route   POST api/posts/comment/:id/:comment_id
// @desc    delete a post comment
// @access  private
router.delete("/comment/:id/:comment_id", auth, async (request, response) => {
  try {
    const post = await Post.findById(request.params.id);
    const comment = post.comments.find(comment => comment.id === request.params.comment_id);

    if (!comment) {
      return response.status(404).json({ message: "No comment found" });
    }

    if (comment.user.toString() !== request.user.id) {
      return response.status(401).json({ message: "User is not authorized" });
    }

    const removeIndex = post.comments.map(like => like.user.toString()).indexOf(request.user.id);
    post.comments.splice(removeIndex, 1);

    await post.save();
    return response.json(post.comments);
  } catch (error) {
    console.error(error.message);
    response.status(500).send("Server Error");
  }
});

module.exports = router;