const mongoose = require("mongoose");

const Product = mongoose.model(
    "Product",
    new mongoose.Schema(
        {
            name: {
                type: String,
                required: true,
                unique: true,
            },
            pic_url: String,
            min_qty: Number,
            unit: { type: String, enum: ['Kg(s)', 'Bunch(s)', 'Bag(s)'] },
            price: Number,
            type: String, // Choice Regular, English, Exotic, Local,
            in_stock: {
                type: String,
                required: true,
                default: "false"
            },
        },
        { timestamps: true }
    )
);

module.exports = Product;
