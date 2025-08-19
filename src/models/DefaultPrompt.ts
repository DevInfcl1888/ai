import mongoose, { Schema, Document } from "mongoose";

export interface IDefaultPrompt extends Document {
  title: string;
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
}

const DefaultPromptSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    prompt: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDefaultPrompt>("DefaultPrompt", DefaultPromptSchema);
