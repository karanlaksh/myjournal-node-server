const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  mood: {
    type: String,
    enum: ["great", "good", "okay", "bad", "terrible"],
    default: "okay"
  },
  analysis: {
    type: String,
    default: null
  },
  isPrivate: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Journal", journalSchema);