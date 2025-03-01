const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema (
{
    name : {
        type : String,
        required: true
    },
    username: {
        type: String,
        required: true,

    },
    password: {
        type: String, 
        required: true
    },

    role: {
        type: String,
        required: true
    },
    organization:{
        type: Schema.Types.ObjectId, ref: "Org",
        required: true
    }

},
{
    timestamps: true // Add this line to enable timestamps
}
);

module.exports = mongoose.model("User", UserSchema);