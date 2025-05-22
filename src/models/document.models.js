import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

// Optionally, add a text index if you plan to search within document text.
// DocumentSchema.index({ text: "text" });

export default mongoose.models.Document || mongoose.model("Document", DocumentSchema);
