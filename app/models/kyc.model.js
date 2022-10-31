const mongoose = require("mongoose");

const kyc = mongoose.model(
    "kyc",
    new mongoose.Schema({
        name: String,
        pic_url: String,
        pic_status: {type: String, default:"Yet to be verified."},
        pan_number: String,
        pan_pic_url: String,
        pan_status: {type: String, default:"Yet to be verified."},
        adhr_number: String,
        adhr_pic_url: String,
        adhr_status: {type: String, default:"Yet to be verified."},
        verified: Boolean,
    })
);

module.exports = kyc;
