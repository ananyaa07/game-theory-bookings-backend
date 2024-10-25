import mongoose from 'mongoose';

const { Schema } = mongoose;

const resourceSchema = new Schema({
  name: {
    type: String
  },
  sport: {
    type: Schema.Types.ObjectId,
    ref: 'Sport',
    required: true
  },
  center: {
    type: Schema.Types.ObjectId,
    ref: 'Centre',
    required: true
  }
}, { timestamps: true });

export default mongoose.model("Resource", resourceSchema);
