const mongoose = require("mongoose");

const User = mongoose.model(
    "user",
    new mongoose.Schema(
        {
            businessname: String,
            ownername: String,
            phone: String,
            email: { type: String, unique: true },
            password: String,
            zone: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "zone"
            },
            address: String,
            pincode: String,
            roles: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Role"
                }
            ],
            kyc_Completed: Boolean,
            kyc: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "kyc"
            }
        },
        { timestamps: true }
    )
);

module.exports = User;
