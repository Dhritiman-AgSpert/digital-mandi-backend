const mongoose = require("mongoose");
const db = require("../models");
const Wallet = db.wallet;
const User = db.user;
const KYC = db.kyc;

// var async = require("async");

exports.view = (req, res) => {
    User.findById(req.userId, function (err, user) {
        if (err) { res.status(500).send({ message: err }); return; }
        console.log(user._id)
        Wallet.findOne({ user: user }, function (err, wallet) {
            if (err) { res.status(500).send({ message: err }); return; }
            console.log(wallet)
            res.status(200).json(wallet)
        });
    });
};

// exports.all = (req, res) => {
// };

// exports.verify = (req, res) => {
// };

