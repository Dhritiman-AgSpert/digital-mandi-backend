const mongoose = require("mongoose");

const Mandi = mongoose.model(
    "mandi",
    new mongoose.Schema({
        name: {type: String, unique: true},
        status: Boolean,
    })
);

module.exports = Mandi;
