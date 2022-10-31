const config = require("../config/auth.config");
const db = require("../models");
const Mandi = db.mandi;

exports.status = (req, res) => {
    Mandi.findOne({name: 'Zo'}, function(err, mandi) {
        if (err) { res.status(500).send({ message: err }); }
        res.status(200).send({ mandi_status: mandi.status });
    });
};

exports.toggle = (req, res) => {
    Mandi.findOne({name: 'Zo'}, function(err, mandi) {
        if (err) { res.status(500).send({ message: err }); }
        if (mandi.status===true) {
            mandi.status = false
        } else {
            mandi.status = true
        }
        mandi.save((err) => {
            if (err) { res.status(500).send({ message: err }); }
            res.status(200).send({ message: "Mandi status toggled." });
        });
    });
};
