import mongoose from 'mongoose';

const { Schema } = mongoose;

const sportSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  centers: [{
    type: Schema.Types.ObjectId,
    ref: 'Center'
  }],
  resourceKind: {
    type: String,
    required: true
  },
  resources: [{
    type: Schema.Types.ObjectId,
    ref: 'Resource'
  }]
}, { timestamps: true });

export default mongoose.model("Sport", sportSchema);
