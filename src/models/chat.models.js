import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "ai"], required: true },
  type: { type: String, enum: ["text", "document"], default: "text" },
  text: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed }, // for storing extra info (like filePath, embedding, etc.)
  timestamp: { type: Date, default: Date.now },
});

const ChatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  chatId: { type: String, required: true },
  messages: [MessageSchema],
});

// Create a composite unique index on userId and chatId
ChatSchema.index({ userId: 1, chatId: 1 }, { unique: true });

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
