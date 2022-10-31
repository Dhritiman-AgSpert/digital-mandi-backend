const mongoose = require("mongoose");
const db = require("../models");
const Cart = db.cart;
const Wallet = db.wallet;
const User = db.user;
const Role = db.role;
const KYC = db.kyc;
const Order = db.order;
const Razorpay = require("razorpay");
const Product = require("../models/product.model");
const Mandi = db.mandi;
var async = require("async");



var instance = new Razorpay({
    key_id: 'rzp_test_oueFHfF6UaeejS',
    key_secret: 'sC18KQCjCU3qtWuEId9bgOQ3',
});

// admin
exports.all_pending = (req, res) => {
    var date = new Date();
    // date.setHours(20,0,0,0);
    Order.find({
        // updatedAt: { $gte: date },  
        status: { $in: ["Placed"] },
    })
        .populate('user')
        .exec((err, orders) => {
            if (err) { res.status(500).send({ message: err }); console.log(err); }
            res.status(200).json(orders);
        });
};

// admin
exports.per_client_pending = (req, res) => {
    // var date = new Date();
    // date.setHours(20,0,0,0);
    if (req.body.userId) {
        Order.find({
            // updatedAt: { $gte: date },  
            status: { $in: ["Placed"] },
            user: req.body.userId
        })
        .populate('user')
        .exec((err, orders) => {
            if (err) { res.status(500).send({ message: err }); console.log(err); }
            res.status(200).json(orders);
        });
    } else {
        res.status(402).send({ message: "Please enter userId" });
    }
};

// admin
exports.all_complete = (req, res) => {
    Order.find({
        status: "Complete",
    })
        .populate('user')
        .exec((err, orders) => {
            if (err) { res.status(500).send({ message: err }); console.log(err); }
            res.status(200).json(orders);
        });
};

exports.per_client_complete = (req, res) => {
    if (req.body.userId) {
        Order.find({
            user: req.body.userId,
            status: "Complete",
        })
        .populate('user')
        .exec((err, orders) => {
            if (err) { res.status(500).send({ message: err }); console.log(err); }
            res.status(200).json(orders);
        });
    } else {
        res.status(402).send({ message: "Please enter userId" });
    }
};

// admin (mark as complete)
exports.toggle_complete_placed = (req, res) => {
    const orderId = req.body.orderId
    if (orderId) {
        Order.findById(orderId, function (err, order) {
            if (err) { res.status(500).send({ message: err }); return; }
            else {
                if (order.status === "Placed") {
                    order.status = "Complete"
                    order.save((err) => {
                        if (err) { res.status(500).send({ message: err }); return; }
                        else { res.status(200).json({ message: "Status set as 'Complete'." }) }
                    });
                } else {
                    order.status = "Placed"
                    order.save((err) => {
                        if (err) { res.status(500).send({ message: err }); return; }
                        else { res.status(200).json({ message: "Status set as 'Placed'." }) }
                    });
                }
            }
        });
    } else {
        res.status(200).json({ message: "please enter orderId" })
    }
};

// admin (mark as paid)
exports.toggle_paid = (req, res) => {
    const orderId = req.body.orderId
    if (orderId) {
        Order.findById(orderId, function (err, order) {
            if (err) { res.status(500).send({ message: err }); return; }
            else {
                if (order.paid === false) {
                    order.paid = true
                    order.save((err) => {
                        if (err) { res.status(500).send({ message: err }); return; }
                        else { res.status(200).json({ message: "Order marked as paid." }) }
                    });                    
                } else {
                    order.paid = false
                    order.save((err) => {
                        if (err) { res.status(500).send({ message: err }); return; }
                        else { res.status(200).json({ message: "Order marked as unpaid." }) }
                    });
                }
            }
        });
    } else {
        res.status(200).json({ message: "please enter orderId" })
    }
};

// admin
exports.remove_item = (req, res) => {
    const orderId = req.body.orderId
    const productId = req.body.productId
    if (orderId && productId) {
        Order.findById(orderId, function (err, order) {
            if (err) { res.status(500).send({ message: err }); return; }
            const oldProductList = order.products;
            var newProductList = [];
            for (const product of oldProductList) {
                if (product.productId !== productId) { newProductList.push(product); }
            }
            var total_price = 0;
            for (const item of newProductList) {
                total_price = total_price + item.price * item.quantity;
            }
            order.total_price = total_price;
            order.products = newProductList;
            order.save((err) => {
                if (err) { res.status(500).send({ message: err }); }
                res.status(200).json({ message: "Item removed, Order updated." });
            });
        });
    } else {
        res.status(200).json({ message: "please enter orderId and productId" });
    }
};

// admin
exports.add_item = (req, res) => {
    const orderId = req.body.orderId;
    const productId = req.body.productId;
    const qty = req.body.quantity;
    if (orderId && productId && qty) {
        Order.findById(orderId, function (err, order) {
            if (err) { res.status(500).send({ message: err }); return; }
            Product.findById(productId, function (err, product) {
                if (err) { res.status(500).send({ message: err }); return; }
                const oldProductList = order.products;
                const found = oldProductList.some(el => el.productId === productId);
                if (!found) {
                    var newProductList = oldProductList;
                    newProductList.push({
                        productId: productId,
                        quantity: qty,
                        unit: product.unit,
                        name: product.name,
                        price: product.price,
                    });
                } else {
                    const index = oldProductList.findIndex(p => p.productId == productId);
                    const new_qty = oldProductList[index].quantity + Number(qty);
                    var newProductList = oldProductList;
                    newProductList[index] = {
                        productId: productId,
                        quantity: new_qty,
                        unit: product.unit,
                        name: product.name,
                        price: product.price,
                    }
                }
                var total_price = 0;
                for (const item of newProductList) {
                    total_price = total_price + item.price * item.quantity;
                }
                order.total_price = total_price;
                order.products = newProductList;
                order.save((err, order) => {
                    if (err) { res.status(500).send({ message: err }); }
                    res.status(200).json({ updated_order: order });
                });
            });
        });
    } else {
        res.status(200).json({ message: "please enter orderId, productId and qty" });
    }
};

// admin
exports.del_all = (req, res) => {
    Order.deleteMany({}, function (err) {
        if (err) { res.status(500).send({ message: err }); }
        res.status(200).send({ message: "Deleted all orders." });
    })
};

// admin
exports.del_one = (req, res) => {
    const orderId = req.body.orderId;
    if (orderId) {
        Order.deleteOne({ _id: orderId }, function (err) {
            if (err) { res.status(500).send({ message: err }); }
            res.status(200).send({ message: "Order deleted." });
        })
    } else { res.status(500).send({ message: "Enter user_id" }); }
};

/// admin
exports.admin_create = (req, res) => {
    const userId = req.body.userId
    const items = req.body.items
    const delivery_date = req.body.delivery_date
    if (userId && items && delivery_date) {
        var date = new Date();
        Mandi.findOne({ name: "Zo" }, async function (err, mandi) {
            if (err) { res.status(500).send({ message: err }); }
            // if (
            //     (mandi.status === true)
            //     // && (parseInt(""+date.getHours()+date.getMinutes())>=2000 || parseInt(""+date.getHours()+date.getMinutes())<=800)
            // ) {
            //     Order.find({ user: userId, paid: false },  function (err, _orders) {
            //         if (err) { res.status(500).send({ message: err }); }
            //         if (_orders.length === 0) {
                        const order = new Order({
                            user: userId,
                            products: [],
                            total_price: 0,
                            status: "Placed",
                            delivery_date: delivery_date,
                        });
                        if (order.delivery_date instanceof Date) {
                            await async.eachSeries(items, function (item, asyncdone) {
                                const productId = item.productId;
                                const qty = Number(item.quantity);
                                if (order.products.length === 0) {
                                    Product.findById(productId, function (err, product) {
                                        if (err) { res.status(500).send({ message: err }); }
                                        else {
                                            order.products = [{
                                                productId: productId,
                                                quantity: qty,
                                                unit: product.unit,
                                                name: product.name,
                                                price: product.price,
                                            }];
                                            order.total_price = qty * product.price;
                                            order.save(asyncdone);
                                        }
                                    });
                                } else {
                                    let itemIndex = order.products.findIndex(p => p.productId == productId);
                                    if (itemIndex === -1) {
                                        // new item
                                        Product.findById(productId, function (err, product) {
                                            if (err) { res.status(500).send({ message: err }); }
                                            order.products.push({
                                                productId: productId,
                                                quantity: qty,
                                                unit: product.unit,
                                                name: product.name,
                                                price: product.price,
                                            });
                                            order.total_price = order.total_price + (qty * product.price);
                                            order.save(asyncdone);
                                        });
                                    }
                                    else {
                                        // already existing item
                                        order.products[itemIndex].quantity = order.products[itemIndex].quantity + qty;
                                        order.total_price = order.total_price + (qty* order.products[itemIndex].price);
                                        order.save(asyncdone);
                                    }
                                }
                            });
                            res.status(200).send({ message: "order created", order: order });
                        } else {
                            res.status(402).send({ message: "Incorrect delivery_date format. Required: (YYYY-MM-DD)." }); return;
                        }
                    // } else {
                    //     res.status(402).send({ message: "Please clear previous dues to place order." }); return;
                    // }
                // });
            // }
            // else { res.status(402).send({ message: "Mandi closed." }); }
        });
    } else { res.status(402).send({ message: "Please enter userId, items and delivery_date(YYYY-MM-DD)." }); }
};



/// user
exports.create = (req, res) => {
    Mandi.findOne({ name: 'Zo' }, function (err, mandi) {
        if (err) { res.status(500).send({ message: err }); }
        if (
            (mandi.status === true)
            // && (parseInt(""+date.getHours()+date.getMinutes())>=2000 || parseInt(""+date.getHours()+date.getMinutes())<=800)
        ) {
            Cart.findOne({ userId: req.userId }, function (err, cart) {
                if (err) { res.status(500).send({ message: err }); }
                if (cart.products.length !== 0) {
                    Order.find({ user: req.userId, paid: false }, function (err, _orders) {
                        if (err) { res.status(500).send({ message: err }); }
                        if (_orders.length === 0) {
                            var total_price = 0;
                            for (const item of cart.products) {
                                total_price = total_price + item.price * item.quantity;
                            }
                            const order = new Order({
                                user: req.userId,
                                products: cart.products,
                                total_price: total_price,
                                status: "Placed",
                            });
                            cart.products = [];
                            cart.save((err, _cart) => {
                                if (err) {
                                    res.status(500).send({ message: "1" });
                                    return;
                                }
                                if (_cart.products.length === 0) {
                                    order.save((err, order) => {
                                        if (err) {
                                            res.status(500).send({ message: "2" });
                                            return;
                                        }
                                        res.status(200).send({ message: "order placed.", order: order });
                                    });
                                }
                            });
                        } else {
                            res.status(402).send({ message: "Please clear previous dues to place order." });
                        }
                    });
                } else { res.status(200).json({ message: "empty cart" }) }
            });
        } else { res.status(500).send({ message: "Mandi closed." }); }
    });
};

// user
exports.my = (req, res) => {
    var date = new Date();
    date.setHours(20, 0, 0, 0);
    Order.find({
        user: req.userId,
        updatedAt: { $gte: date },
    })
        .populate('user')
        .exec((err, order) => {
            if (err) { res.status(500).send({ message: err }); console.log(err); }
            res.status(200).json(order);
        });
};

// user
exports.my_pending = (req, res) => {
    const userId = req.userId;
    var date = new Date();
    date.setHours(20, 0, 0, 0);
    Order.find({
        user: userId,
        status: { $in: ["In Process", "Delivery person assigned.", "On the way"] },
        updatedAt: { $gte: date },
    })
        .populate('user')
        .populate('deliverer')
        .then((orders) => {
            res.status(200).json(orders);
        })
        .catch((err) => {
            res.status(500).send({ message: err });
        });
};




exports.deliverers = (req, res) => {
    Role.findOne({ name: "delivery" }, function (err, role) {
        if (err) { res.status(500).send({ message: err }); return; }
        User.find({ roles: [role._id] }, function (err, users) {
            if (err) { res.status(500).send({ message: err }); return; }
            res.status(200).json(users)
        });
    });
};

// fulfil
exports.assign = (req, res) => {
    const orderId = req.body.orderId
    const delivererId = req.body.delivererId
    if (orderId && delivererId) {
        Order.findById(orderId, function (err, order) {
            if (err) { res.status(500).send({ message: err }); return; }
            else if (order) {
                order.deliverer = delivererId;
                order.status = "Delivery person assigned.";
                order.save(err => {
                    if (err) { res.status(500).send({ message: err }); }
                    else { res.status(200).send({ message: "Assigned." }) }
                });
            } else {
                res.status(500).send({ message: "Something is wrong." });
            }
        });
    } else {
        res.status(500).send({ message: "Please enter reqd. fields" });
    }
};

// deliv
exports.deliveries = (req, res) => {
    var date = new Date();
    date.setHours(0, 0, 0, 0);
    Order.find({
        deliverer: req.userId,
        updatedAt: { $gte: date },
    })
        .populate('user')
        .then((order) => {
            res.status(200).json(order);
        })
        .catch((err) => {
            res.status(500).send({ message: err });
        });
};

// deliv
exports.complete_deliveries = (req, res) => {
    Order.find({
        deliverer: req.userId,
    })
        .populate('user')
        .then((order) => {
            res.status(200).json(order);
        })
        .catch((err) => {
            res.status(500).send({ message: err });
        });
};

// admin
exports.all_hstrcl = (req, res) => {
    Order.find({})
        .populate('user')
        .populate('deliverer')
        .then((order) => {
            res.status(200).json(order);
        })
        .catch((err) => {
            res.status(500).send({ message: err });
        });
};

// user // not used now
exports.create_rzp = (req, res) => {
    Cart.findOne({ userId: req.userId })
        .then((cart) => {
            if (cart.products.length != 0) {
                var total_price = 0;
                for (const item of cart.products) {
                    total_price = total_price + item.price * item.quantity;
                }
                var rzorderDetails = {
                    amount: total_price * 100,  // amount in the smallest currency unit  
                    currency: "INR",
                };
                instance.orders.create(rzorderDetails, function (err, rzorder) {
                    if (err) { res.status(500).send({ message: err }); return; }
                    console.log(rzorder)
                    const order = new Order({
                        user: req.userId,
                        products: cart.products,
                        totals: { price: total_price, weight: total_weight },
                        status: "In Process",
                        razorpay_order_id: rzorder.id,
                    });
                    cart.products = [];
                    cart.save((err, _cart) => {
                        if (err) {
                            res.status(500).send({ message: err });
                            return;
                        }
                        if (_cart.products.length === 0) {
                            order.save((err, order) => {
                                if (err) {
                                    res.status(500).send({ message: err });
                                    return;
                                }
                                res.status(200).send(order);
                            });
                        }
                    });
                });
            } else { res.status(200).json({ message: "empty cart" }) }
        }).catch((err) => {
            res.status(500).send({ message: err });
            return;
        });
};

