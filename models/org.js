const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrgSchema =  new Schema ({
    name : {
        type: String,
        required : true
    },
    location :{
        type: String,
        required : true
    }
},
{
    timestamps: true // Add this line to enable timestamps
});

module.exports = mongoose.model("Org", OrgSchema);