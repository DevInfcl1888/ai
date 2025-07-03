import mongoose,{Document, Schema} from 'mongoose';

export interface ITermCondition extends Document {
    heading?: string;
    title : string;
}

const TermCondition: Schema<ITermCondition> = new Schema<ITermCondition>({
    heading: { type: String },
    title: { type: String, required: true }
});

const TermCon = mongoose.model<ITermCondition>("TermCondition",TermCondition);
export default TermCon;