import mongoose from 'mongoose';

const { Schema } = mongoose;

const resourceSchema = new Schema({
  resourceName: {
    type: String
  },
  associatedSport: {
    type: Schema.Types.ObjectId,
    ref: 'Sport',
    required: true
  },
  linkedCentre: {
    type: Schema.Types.ObjectId,
    ref: 'Centre',
    required: true
  }
}, { timestamps: true });

export default mongoose.model("Resource", resourceSchema);
