import mongoose from 'mongoose';

const { Schema } = mongoose;

const sportSchema = new Schema({
  sportName: {
    type: String,
    required: true
  },
  relatedCentres: [{
    type: Schema.Types.ObjectId,
    ref: 'Centre'
  }],
  primaryResource: {
    type: String,
    required: true
  },
  availableResources: [{
    type: Schema.Types.ObjectId,
    ref: 'Resource'
  }]
}, { timestamps: true });

export default mongoose.model("Sport", sportSchema);
