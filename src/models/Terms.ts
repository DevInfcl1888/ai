import mongoose,{Document, Schema} from 'mongoose';

export interface ITermCondition extends Document {
    title : string;
}

const TermCondition: Schema<ITermCondition> = new Schema<ITermCondition>({
    title: { type: String, required: true }
});

const TermCon = mongoose.model<ITermCondition>("TermCondition",TermCondition);
export default TermCon;