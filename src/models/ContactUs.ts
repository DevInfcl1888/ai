import mongoose,{Document, Schema} from 'mongoose';

export interface IContactUs extends Document {
    title : string;
}

const ContactUsSchema: Schema<IContactUs> = new Schema<IContactUs>({
    title: { type: String, required: true }
});

const ContactUs = mongoose.model<IContactUs>("Contactus",ContactUsSchema);
export default ContactUs;