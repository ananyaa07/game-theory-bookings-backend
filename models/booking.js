import mongoose from "mongoose";

const { Schema } = mongoose;

const bookingSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
	resource: {
		type: Schema.Types.ObjectId,
		ref: "Resource",
		required: true
	},
	endTime: {
		type: Number,
		required: true,
		min: 4,
		max: 24,
		validate: {
			validator(value) {
				return value > this.startTime;
			},
			message: "End hour must be greater than start hour."
		}
	},
	date: {
		type: Date,
		required: true
	},
	startTime: {
		type: Number,
		required: true,
		min: 4,
		max: 24
	},
	type: {
		type: String,
		enum: [
			"Booking",
			"Checked",
			"Payment Pending",
			"Coaching",
			"Blocked",
			"Completed"
		],
		default: "Booking",
		required: true
	},
	note: {
		type: String,
		default: ""
	},
	center: {
		type: Schema.Types.ObjectId,
		ref: "Center",
		required: true
	},
	sport: {
		type: Schema.Types.ObjectId,
		ref: "Sport",
		required: true
	}
}, 
{ timestamps: true });

export default mongoose.model("Booking", bookingSchema);
