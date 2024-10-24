import mongoose from "mongoose";

const { Schema } = mongoose;

const bookingSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
	resourceId: {
		type: Schema.Types.ObjectId,
		ref: "Resource",
		required: true
	},
	endHour: {
		type: Number,
		required: true,
		min: 4,
		max: 24,
		validate: {
			validator(value) {
				return value > this.startHour;
			},
			message: "End hour must be greater than start hour."
		}
	},
	bookingDate: {
		type: Date,
		required: true
	},
	startHour: {
		type: Number,
		required: true,
		min: 4,
		max: 24
	},
	status: {
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
	remarks: {
		type: String,
		default: ""
	},
	centreId: {
		type: Schema.Types.ObjectId,
		ref: "Centre",
		required: true
	},
	sportId: {
		type: Schema.Types.ObjectId,
		ref: "Sport",
		required: true
	}
}, 
{ timestamps: true });

export default mongoose.model("Booking", bookingSchema);
