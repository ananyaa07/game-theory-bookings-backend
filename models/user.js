import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Schema } = mongoose;

const userSchema = new Schema({
  fullName: {
    type: String,
    required: true
  },
  emailAddress: {
    type: String,
    required: true,
    unique: true
  },
  userHandle: {
    type: String,
    required: true,
    unique: true
  },
  userPassword: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['customer', 'operations', 'admin'],
    default: 'customer'
  }
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('userPassword')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.userPassword = await bcrypt.hash(this.userPassword, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.validatePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.userPassword);
};

// Method to generate JWT
userSchema.methods.createToken = function() {
  return jwt.sign({ id: this._id, role: this.userRole }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

export default mongoose.model('User', userSchema);
