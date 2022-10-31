const mongoose = require("mongoose");

const Order = mongoose.model(
    "Order",
    new mongoose.Schema(
        {
            user: {
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
            total_price: Number,
            status: {
                type: String,
                default: ""
            },
            paid: {type: Boolean, default: false},
            delivery_date: Date,
            // deliverer: {
            //     type: mongoose.Schema.Types.ObjectId,
            //     ref: "user"
            // },
            // razorpay_order_id: String,
        },
        { timestamps: true }
    )
);

module.exports = Order;
