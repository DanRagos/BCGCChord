const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['musician', 'worshipLead', 'admin'], default: 'musician' },
    organization: { type: Schema.Types.ObjectId, ref: 'Org' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
