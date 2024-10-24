import mongoose from "mongoose";
const { Schema } = mongoose;

const centerSchema = new Schema({
	centerName: {
		type: String,
		required: true
	},
	address: {
		type: String,
		required: true
	},
	availableSports: [
		{
			type: Schema.Types.ObjectId,
			ref: "Sport"
		}
	]
}, 
{ timestamps: true });

export default mongoose.model("Center", centerSchema);
