const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.user;
const Cart = db.cart;
const Product = db.product;
const config = require("../config/auth.config.js");
var async = require("async");
const Mandi = db.mandi;

exports.view = (req, res) => {
    Cart.findOne({ userId: req.userId }, function (err, cart) {
        if (err) { res.status(500).send({ message: err }); }
        else {
            if (cart.products.length === 0) {const total_price = 0;}
            else {
                var total_price = 0;
                for (const item of cart.products) {
                    total_price = total_price + item.price*item.quantity;
                }
            }
            res.status(200).json({cart: cart, total_price: total_price});
            return;
        }
    })
};

exports.add_item = (req, res) => {
    Cart.findOne({ userId: req.userId }, function (err, cart) {
        if (err) { res.status(500).send({ message: err }); }
        else {
            var date = new Date();
            Mandi.findOne({name: "Zo"}, function(err, mandi) {
                if (err) { res.status(500).send({ message: err }); }
                if (
                    (mandi.status===true)
                    // && (parseInt(""+date.getHours()+date.getMinutes())>=2000 || parseInt(""+date.getHours()+date.getMinutes())<=800)
                ) {
                    if (req.body.items) {
                        async.eachSeries(req.body.items, function (item, asyncdone) {
                            const productId = item.productId;
                            const qty = item.qty;
                            if (cart.products.length === 0) {
                                Product.findById(productId, function (err, product) {
                                    if (err) { res.status(500).send({ message: err }); }
                                    else {
                                        cart.products = [{
                                            productId: productId,
                                            quantity: qty,
                                            unit: product.unit,
                                            name: product.name,
                                            price: product.price,
                                        }];
                                        cart.save(asyncdone);
                                    }
                                });
                            } else {
                                let itemIndex = cart.products.findIndex(p => p.productId == productId);
                                if (itemIndex === -1) {
                                    // new item
                                    Product.findById(productId, function (err, product) {
                                        if (err) { res.status(500).send({ message: err }); }
                                        cart.products.push({
                                            productId: productId,
                                            quantity: qty,
                                            unit: product.unit,
                                            name: product.name,
                                            price: product.price,
                                        });
                                        cart.save(asyncdone);
                                    });
                                }
                                else {
                                    // already existing item
                                    cart.products[itemIndex].quantity = cart.products[itemIndex].quantity + qty;
                                    cart.save(asyncdone);
                                }
                            }
                        });
                        res.status(200).send({ message: "updated cart"});
                    }
                    else {
                        res.status(402).send({ message: "please provide reqd fields" });
                    }
                }
                else {res.status(402).send({ message: "Mandi closed." });} 
            });
        }
    })
};

exports.remove_item = (req, res) => {
    Cart.findOne({ userId: req.userId }, function (err, cart) {
        if (err) { res.status(500).send({ message: err }); }
        else {
            if (req.body.productId && req.body.quantity) {
                const productId = req.body.productId;
                const qty = req.body.quantity;
                if (cart.products.length === 0) {
                    res.status(200).send({ message: "Cart empty!" });
                } else {
                    let itemIndex = cart.products.findIndex(p => p.productId == productId);
                    if (itemIndex === -1) {
                        res.status(200).send({ message: "No such product in cart." });
                    }
                    else {
                        // already existing item
                        if (cart.products[itemIndex].quantity === qty) {
                            cart.products.splice(itemIndex, 1); 
                        }
                        else if (cart.products[itemIndex].quantity > qty) {
                            cart.products[itemIndex].quantity = cart.products[itemIndex].quantity - qty;
                        }
                        else {
                            res.send({ message: "enter a lower qty!" });
                        }
                        cart.save((err, cart) => {
                            if (err) {
                                res.status(500).send({ message: err });
                                return;
                            }
                            res.send({ message: "cart updated!" });
                        });
                    }
                }
            }
            else {
                res.status(200).send({ message: "please provide reqd fields" });
            }
        }
    })
};

exports.update_prices = (req, res) => {
    Cart.find({}, function (err, carts) {
        if (err) { res.status(500).send({ message: err }); }
        else {
            carts.forEach(cart => {
                async.eachSeries(cart.products, function (item, asyncdone) {
                    const productId = item.productId;
                    Product.findById(productId, function (err, product) {
                        if (err) { res.status(500).send({ message: err }); }
                        else {
                            let itemIndex = cart.products.findIndex(p => p.productId == productId);
                            cart.products[itemIndex].price = product.price;
                            cart.save(asyncdone);
                        }
                    });
                });
            });
            res.status(200).send({ message: "carts updated." });
        }
    })
};
