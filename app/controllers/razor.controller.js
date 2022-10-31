const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const db = require("../models");
const Cart = db.cart;
const Wallet = db.wallet;
const User = db.user;
const Role = db.role;
const KYC = db.kyc;
const Order = db.order;

var instance = new Razorpay({
    key_id: 'rzp_test_oueFHfF6UaeejS',
    key_secret: 'sC18KQCjCU3qtWuEId9bgOQ3',
});


// admin
exports.all = (req, res) => {
    instance.payments.all({}).then((response) => {
        // handle success
        res.status(200).json(response)
    }).catch((error) => {
        // handle error
        res.status(500).send(error)
    })
};

//user
exports.pay = (req, res) => {
    var options = {  
        amount: req.body.amount,  // amount in the smallest currency unit  
        currency: "INR",  
    };
    instance.orders.create(options, function(err, order) {
        // console.log(order);
        res.status(200).send(order);
    });
};