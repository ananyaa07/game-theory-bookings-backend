import mongoose from "mongoose";
const { Schema } = mongoose;

const centreSchema = new Schema({
	centreName: {
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

export default mongoose.model("Centre", centreSchema);
