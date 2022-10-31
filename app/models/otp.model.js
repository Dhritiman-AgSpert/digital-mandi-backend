const mongoose = require("mongoose");

const Otp = mongoose.model(
  "Otp",
  new mongoose.Schema({
    phone: {type: String, unique: true},
    otp: String,
    count: {type: Number, default: 0},
  })
);

module.exports = Otp;
