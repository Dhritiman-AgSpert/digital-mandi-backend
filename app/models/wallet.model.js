const mongoose = require("mongoose");

const wallet = mongoose.model(
    "wallet",
    new mongoose.Schema({
        amount: Number,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        },
        active: {
            type: Boolean,
            default: false,
        },
    })
);

module.exports = wallet;
