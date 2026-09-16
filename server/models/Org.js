const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrgSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Org', OrgSchema);
