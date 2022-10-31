const mongoose = require("mongoose");

const Cart = mongoose.model(
    "Cart",
    new mongoose.Schema(
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user"
            },
            products: [
                {
                    productId: String,
                    quantity: Number,
                    unit: String,
                    name: String,
                    price: Number
                }
            ],
            active: {
                type: Boolean,
                default: true
            },
            modifiedOn: {
                type: Date,
                default: Date.now
            }
        },
        { timestamps: true }
    )
);

module.exports = Cart;
