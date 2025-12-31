const Journal = require("../models/Journal");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const createJournal = async (req, res) => {
  try {
    const { title, content, mood, isPrivate } = req.body;

    const journal = await Journal.create({
      userId: req.user.id,
      title,
      content,
      mood,
      isPrivate
    });

    res.status(201).json(journal);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMyJournals = async (req, res) => {
  try {
    const journals = await Journal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(journals);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getJournalById = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({ message: "Journal not found" });
    }

    if (journal.userId.toString() !== req.user.id && journal.isPrivate) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(journal);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateJournal = async (req, res) => {
  try {
    const { title, content, mood, isPrivate } = req.body;

    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({ message: "Journal not found" });
    }

    if (journal.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    journal.title = title || journal.title;
    journal.content = content || journal.content;
    journal.mood = mood || journal.mood;
    journal.isPrivate = isPrivate !== undefined ? isPrivate : journal.isPrivate;

    await journal.save();
    res.json(journal);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({ message: "Journal not found" });
    }

    if (journal.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await journal.deleteOne();
    res.json({ message: "Journal deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const analyzeJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({ message: "Journal not found" });
    }

    if (journal.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a supportive mental health companion. Analyze this journal entry and provide:
                    1. A brief reflection on the emotions expressed
                    2. One or two gentle suggestions for self-care or coping strategies
                    3. An encouraging message

                    Keep your response warm, supportive, and under 200 words.

                    Journal entry:
                    Title: ${journal.title}
                    Mood: ${journal.mood}
                    Content: ${journal.content}`;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    journal.analysis = analysis;
    await journal.save();

    res.json(journal);
  } catch (error) {
    res.status(500).json({ message: "Analysis failed", error: error.message });
  }
};

const getWeeklyInsights = async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const journals = await Journal.find({
      userId: req.user.id,
      createdAt: { $gte: oneWeekAgo }
    }).sort({ createdAt: -1 });

    if (journals.length < 2) {
      return res.status(400).json({ 
        message: "You need at least 2 journal entries from the past week to get insights." 
      });
    }

    const journalSummaries = journals.map(j => 
      `Date: ${j.createdAt.toDateString()}\nMood: ${j.mood}\nTitle: ${j.title}\nContent: ${j.content}`
    ).join("\n\n---\n\n");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a supportive mental health companion. Analyze these journal entries from the past week and provide:

                      1. **Mood Patterns**: How has the person's mood changed throughout the week?
                      2. **Recurring Themes**: What topics or concerns keep coming up?
                      3. **Positive Observations**: What strengths or healthy behaviors do you notice?
                      4. **Gentle Suggestions**: 2-3 supportive suggestions for the coming week.
                      5. **Encouragement**: End with an encouraging message.

                        Keep your response warm, supportive, and under 300 words.

                        Journal entries from the past week:

${journalSummaries}`;

    const result = await model.generateContent(prompt);
    const insights = result.response.text();

    res.json({ 
      insights,
      journalCount: journals.length,
      periodStart: oneWeekAgo,
      periodEnd: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate insights", error: error.message });
  }
};


module.exports = { createJournal, getMyJournals, getJournalById, updateJournal, deleteJournal, analyzeJournal, getWeeklyInsights };