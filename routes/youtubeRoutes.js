const express = require("express");
const { searchVideos } = require("../controllers/youtubeController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/search", auth, searchVideos);

module.exports = router;