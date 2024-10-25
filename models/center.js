import mongoose from "mongoose";
const { Schema } = mongoose;

const centerSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	address: {
		type: String,
		required: true
	},
	sports: [
		{
			type: Schema.Types.ObjectId,
			ref: "Sport"
		}
	]
}, 
{ timestamps: true });

export default mongoose.model("Center", centerSchema);
