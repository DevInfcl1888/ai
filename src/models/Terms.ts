import mongoose,{Document, Schema} from 'mongoose';

export interface ITerms extends Document {
    title : string;
}

const Terms: Schema<ITerms> = new Schema<ITerms>({
    title: { type: String, required: true }
});

const Term = mongoose.model<ITerms>("TermCondition",Terms);
export default Term;