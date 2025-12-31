const express = require("express");
const { createJournal, getMyJournals, getJournalById, updateJournal, deleteJournal, analyzeJournal, getWeeklyInsights } = require("../controllers/journalController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/", auth, createJournal);
router.get("/", auth, getMyJournals);
router.post("/insights", auth, getWeeklyInsights);
router.get("/:id", auth, getJournalById);
router.put("/:id", auth, updateJournal);
router.delete("/:id", auth, deleteJournal);
router.post("/:id/analyze", auth, analyzeJournal);

module.exports = router;