const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.user;
const Cart = db.cart;
const config = require("../config/auth.config.js");

exports.allAccess = (req, res) => {
    var date = new Date();
    res.status(200).send({message: "Public Content.", date: parseInt(""+date.getHours()+date.getMinutes())});
};

exports.userBoard = (req, res) => {
    res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
    res.status(200).send("Admin Content.");
};

exports.info = (req, res) => {
    if (req.headers) {
        let token = req.headers["x-access-token"];
        if (!token) {
            res.status(403).send({ message: "No token provided!" });
        }
        else {
            jwt.verify(token, config.secret, (err, decoded) => {
                if (err) {
                    res.status(401).send({ message: "Unauthorized!" });
                } 
                else {
                    userId = decoded.id;
                    User.findOne({ _id: userId }, function (err, user) {
                        if (err) { res.status(500).send({ message: err }); }
                        else {
                            Cart.findOne({userId: userId}, function (err, cart) {
                                if (err) { res.status(500).send({ message: err }); }
                                else {
                                    const response = {user_details: user, cart_details: cart};
                                    // console.log(response);
                                    res.status(200).send(response);
                                    return;
                                }
                            })
                        }
                    });
                }
            });
        }
    }
    else { status(401).send({ message: "No Token!" }); }
};

exports.edit_profile = (req, res) => {
    User
    .findById(req.userId)
    .populate("roles", "-__v")
    .exec((err, user) => {
        if (err) { res.status(500).send({ message: err }); return; }
        console.log(user)
        if (
            !(req.body.email) && 
            !(req.body.username) && 
            !(req.body.address1 || req.body.address2 || req.body.address3) && 
            !(req.body.pincode) && 
            !(req.body.location)
        ) {
            res.status(403).send({ message: "Profile not edited." });
            return
        }
        else {
            if (req.body.username) {user.username = req.body.username;}
            if (req.body.email) {user.email = req.body.email;}
            if (req.body.address1) {user.address.address1 = req.body.address1;}
            if (req.body.address2) {user.address.address2 = req.body.address2;}
            if (req.body.address3) {user.address.address3 = req.body.address3;}
            if (req.body.pincode) {user.address.pincode = req.body.pincode;}
            if (req.body.location) {user.location = req.body.location;}
            user.save((err, usr) => {
                if (err) {
                    res.status(500).send({ message: "1" });
                    return;
                }
                var token = jwt.sign({ id: req.userId }, config.secret, {
                    expiresIn: 86400 * 90 // 24*90 hours
                });
                var authorities = [];
                for (let i = 0; i < usr.roles.length; i++) {
                    console.log(i);
                    console.log(usr.roles[i].name);
                    console.log(usr.username);
                    authorities.push("ROLE_" + usr.roles[i].name.toUpperCase());
                }
                // console.log(authorities);
                if (!usr.username || !usr.email || !(usr.address.address1 && usr.address.address2 && usr.address.address3) || !usr.address.pincode || !usr.location) {
                    var profile_created = false;
                    var info = "new_user";
                } else {
                    var profile_created = true;
                    var info = "old_user";
                }
                res.status(200).send({ 
                    message: "Profile edited.",
                    id: usr._id,
                    roles: authorities,
                    accessToken: token,
                    info: info,
                    profile_created: profile_created,
                });
            });
        }
    });
};

exports.del_all = (req, res) => {
    User.find({}, function (err, users) {
        if (err) { res.status(500).send({ message: err }); }
        for (var user in users) {
            users[user].delete();
        }
        res.status(200).send({ message: "deleted all users." });
    });
};

exports.locations = (req, res) => {
    const ids = [
        "Route-1",
        "Route-2",
        "Route-3",
        "Route-4",
        "Route-5",
    ];
    const values = [
        "Khanapara to Ganeshguri via GS Road",
        "Basistha to Ganeshguri via Lastgate",
        "Games Vill to Ganesh Mandir via Hatigaon",
        "Lokhra to Lalganesh via Sawkuchi",
        "Lalganesh to Ganesh Mandir via Kahilipara"
    ];
    var locations = [];
    if (ids.length===values.length) {
        for (let i=0; i<ids.length; i++) {
            locations.push({
                "id": ids[i],
                "value": values[i]
            });
        }
        res.status(200).send(locations);
    } else {
        res.status(402).send({message: "We ran into a problem.. Please try again later."});
    }
};