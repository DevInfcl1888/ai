import mongoose,{Document, Schema} from 'mongoose';

export interface IPrivacy extends Document {
    title : string;
}

const Privacs: Schema<IPrivacy> = new Schema<IPrivacy>({
    title: { type: String, required: true }
});

const Privacy = mongoose.model<IPrivacy>("Privacy",Privacs);
export default Privacy;