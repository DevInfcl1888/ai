import mongoose, { Document, Schema } from 'mongoose';

export interface IPrivacy extends Document {
  heading?: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PrivacySchema: Schema<IPrivacy> = new Schema<IPrivacy>(
  {
    heading: { type: String },
    title: { type: String, required: true },
  },
  { timestamps: true }
);

const Privacy = mongoose.model<IPrivacy>('Privacy', PrivacySchema);
export default Privacy;
