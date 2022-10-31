const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Cart = db.cart;
const Otp = db.otp;
const Zone = db.zone;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var request = require("request");

function makepassword(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function random4DigitNumberNotStartingWithZero(){
    // I did not include the zero, for the first digit
    var digits = "123456789".split(''),
        first = shuffle(digits).pop();
    // Add "0" to the array
    digits.push('0');
    return parseInt( first + shuffle(digits).join('').substring(0,3), 10);
}

function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function send_otp(phone, otp, callback) {
    var options = {
        method: 'GET',
        url: 'http://2factor.in/API/V1/6bb9bcda-d909-11ec-9c12-0200cd936042/SMS/'+ phone + '/' + otp + '/OTPtmplt2',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        form: {}
    };
    request(options, function (error, response, body) {
        if (error) {
            callback(false);
        }
        if (JSON.parse(body).Status==="Success") {
            callback(true);
        } else {
            callback(false);
        }
    });
}


exports.signup = (req, res) => {
    const user = new User({
        username: req.body.username,
        email: req.body.email,
        location: req.body.location,
        address: {
            address1: req.body.address1,
            address2: req.body.address2,
            address3: req.body.address3,
            pincode: req.body.pincode,
        },
        phone: req.body.phone,
        vehicle_no: req.body.vehicle_no,
        password: bcrypt.hashSync(req.body.password, 8)
    });
    user.save((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (req.body.roles) {
            Role.find(
                {
                    name: { $in: req.body.roles }
                },
                (err, roles) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }

                    user.roles = roles.map(role => role._id);
                    user.save(err => {
                        if (err) {
                            res.status(500).send({ message: err });
                            return;
                        }

                        res.send({ message: "User was registered successfully!" });
                    });
                }
            );
        } else {
            Role.findOne({ name: "user" }, (err, role) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }

                user.roles = [role._id];
                user.save(err => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }
                });
                // create cart
                const cart = new Cart({
                    userId: user._id,
                    products: [],
                    active: false,
                });
                cart.save((err, cart) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }
                    // res.json(cart)
                    res.send({ message: "User was registered successfully!" });
                });
            });
        }
    });
};

exports.signin = (req, res) => {
    User.findOne({
        email: req.body.email
    })
    .populate("roles", "-__v")
    .exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (!user) {
            return res.status(404).send({ message: "User Not found." });
        }

        /* var passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        ); */

        var passwordIsValid = bcrypt.compare(req.body.password, user.password);

        if (!passwordIsValid) {
            return res.status(401).send({
                accessToken: null,
                message: "Invalid Password!"
            });
        }

        var token = jwt.sign({ id: user.id }, config.secret, {
            expiresIn: 86400*90 // 24*90 hours
        });

        var authorities = [];

        for (let i = 0; i < user.roles.length; i++) {
            authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
        }

        if (authorities.includes('ROLE_CLIENT')) {
            res.status(200).send({
                id: user._id,
                username: user.username,
                email: user.email,
                roles: authorities,
                accessToken: token
            });
        } else {
            res.status(404).send({ message: "Not Client." });
        }
    });
};


exports.admin_signup = (req, res) => {
    const businessname = req.body.businessname
    const ownername = req.body.ownername
    const phone = req.body.phone
    const email = req.body.email
    const zone_id = req.body.zone_id
    const address = req.body.address
    const pincode = req.body.pincode
    const password = req.body.password
    
    Zone.findById(zone_id, function(err,zone) {
        if (err) { res.status(500).send({ message: err }); return; }
        if (zone) {
            var user = new User({
                businessname: businessname,
                ownername: ownername,
                phone: phone,
                email: email,
                password: password,
                zone: zone,
                address: address,
                pincode: pincode,
            });
            Role.findOne({ name: "admin" }, (err, role) => {
                if (err) {
                    res.status(500).send({ code: "3", message: err });
                    return;
                }
                user.roles = [role._id];
                user.save((err, user) => {
                    if (err) {
                        res.status(500).send({ code: "4", message: err });
                        return;
                    } else {
                        res.status(200).send({
                            message: "Admin was registered successfully.",
                            userId: user._id,
                        });
                    }
                });
            });
        }
        else {
            res.status(200).send({message: "invalid zone_id"});
        }        
    });
}

exports.admin_signin = (req, res) => {
    User.findOne({
        email: req.body.email
    })
    .populate("roles", "-__v")
    .exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (!user) {
            return res.status(404).send({ message: "User Not found." });
        }

        /* var passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        ); */

        var passwordIsValid = bcrypt.compare(req.body.password, user.password);

        if (!passwordIsValid) {
            return res.status(401).send({
                accessToken: null,
                message: "Invalid Password!"
            });
        }

        var token = jwt.sign({ id: user.id }, config.secret, {
            expiresIn: 86400*90 // 24*90 hours
        });

        var authorities = [];

        for (let i = 0; i < user.roles.length; i++) {
            authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
        }

        if (authorities.includes('ROLE_ADMIN')) {
            res.status(200).send({
                id: user._id,
                username: user.username,
                email: user.email,
                roles: authorities,
                accessToken: token
            });
        } else {
            res.status(404).send({ message: "Not Admin." });
        }
    });
};

exports.phone = (req, res) => {
    const phone = req.body.phone;
    if (phone) {
        const new_otp = random4DigitNumberNotStartingWithZero();
        console.log(new_otp);
        Otp.findOne({phone: phone}, (err, otp) => {
            if (err) {res.status(500).send({ message: err }); return;}
            if (otp) {
                if (otp.count>=20) {
                    res.status(403).send({ message: "OTP sending limit crossed!! Please contact customer support." }); 
                    return;
                } else {
                    otp.count = otp.count + 1;
                    otp.otp = new_otp;
                    otp.save((err, otp) => {
                        if (err) {res.status(500).send({ message: err }); return;}
                        send_otp(phone, new_otp, (otp_status) => {
                            if (otp_status===true) {
                                res.status(200).send({ message: "OTP sent, count increased." });
                            } else {
                                res.status(403).send({ message: "OTP couldn't be sent. Please contact customer support." });
                            }
                        });
                    });
                }
            } else {
                const otp = new Otp({
                    phone: phone,
                    otp: new_otp,
                    count: 1,
                });
                otp.save((err, otp) => {
                    if (err) {res.status(500).send({ message: err }); return;}
                    send_otp(phone, new_otp, (otp_status) => {
                        if (otp_status===true) {
                            res.status(200).send({ message: "OTP sent, count increased." });
                        } else {
                            res.status(403).send({ message: "OTP couldn't be sent. Please contact customer support." });
                        }
                    });
                });
            }
        });
    } else {
        return res.status(403).send({ message: "Please enter phone number." });
    }
};

exports.otp = (req, res) => {
    Otp.findOne({
        phone: req.body.phone,
        otp: req.body.otp,
    }).exec((err, otp) => {
        if (err) { res.status(500).send({ code: "1", message: err }); return; }
        if (!otp) {
            return res.status(403).send({ message: "Please proceed after sending phone number." });
        }
        User.findOne({
            phone: req.body.phone,
        })
        .populate("roles", "-__v")
        .exec((err, user) => {
            if (err) { res.status(500).send({ code: "2", message: err }); return; }
            if (!user) {
                var user = new User({
                    phone: req.body.phone,
                });
                Role.findOne({ name: "user" }, (err, role) => {
                    if (err) {
                        res.status(500).send({ code: "3", message: err });
                        return;
                    }
                    user.roles = [role._id];
                    user.save((err, user) => {
                        if (err) {
                            res.status(500).send({ code: "4", message: err });
                            return;
                        } else {
                            // create cart
                            const cart = new Cart({
                                userId: user._id,
                                products: [],
                                active: false,
                            });
                            cart.save((err, cart) => {
                                if (err) {
                                    res.status(500).send({ code: "5", message: err });
                                    return;
                                } else {
                                    otp.delete();
                                    var token = jwt.sign({ id: user.id }, config.secret, {
                                        expiresIn: 86400 * 90 // 24*90 hours
                                    });
                                    var authorities = ["ROLE_USER"];
                                    res.status(200).send({
                                        message: "User was registered successfully. Please go to the edit_profie page.",
                                        id: user._id,
                                        roles: authorities,
                                        accessToken: token,
                                        info: "new_user",
                                        profile_created: false,
                                    });
                                }
                            });
                        }
                    });
                });
            } else {
                otp.delete();
                var token = jwt.sign({ id: user.id }, config.secret, {
                    expiresIn: 86400 * 90 // 24*90 hours
                });
                var authorities = [];
                for (let i = 0; i < user.roles.length; i++) {
                    authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
                }
                if (!user.username || !user.email || !(user.address.address1 && user.address.address2 && user.address.address3) || !user.address.pincode || !user.location) {
                    var profile_created = false;
                    var info = "new_user";
                    var message = "Login successful. New user. Please go to the edit_profie page."
                } else {
                    var profile_created = true;
                    var info = "old_user";
                    var message = "Login successful."
                }
                res.status(200).send({
                    message: message,
                    id: user._id,
                    roles: authorities,
                    accessToken: token,
                    info: info,
                    profile_created: profile_created,
                });
            }
        });
    });
};

exports.all_otp = (req, res) => {
    Otp.find({}).exec((err, otp) => {
        if (err) { res.status(500).send({ message: err }); return; }
        res.status(200).json(otp);
    });
};

exports.reset_otp = (req, res) => {
    Otp.findOne({
        phone: req.body.phone,
    }).exec((err, otp) => {
        if (err) { res.status(500).send({ message: err }); return; }
        if (otp) {
            otp.count = 0;
            otp.save((err, otp) => {
                if (err) { res.status(500).send({ message: err }); return; }
                res.status(200).send({ message: "Reset successful." });
            });
        }
    });
};


exports.create_client = (req, res) => {
    const businessname = req.body.businessname
    const ownername = req.body.ownername
    const phone = req.body.phone
    const email = req.body.email
    const zone_id = req.body.zone_id
    const address = req.body.address
    const pincode = req.body.pincode
    
    Zone.findById(zone_id, function(err,zone) {
        if (err) { res.status(500).send({ message: err }); return; }
        if (zone) {
            const password = makepassword(8);
            console.log(password);
            var user = new User({
                businessname: businessname,
                ownername: ownername,
                phone: phone,
                email: email,
                password: password,
                zone: zone,
                address: address,
                pincode: pincode,
            });
            Role.findOne({ name: "client" }, (err, role) => {
                if (err) {
                    res.status(500).send({ code: "3", message: err });
                    return;
                }
                user.roles = [role._id];
                user.save((err, user) => {
                    if (err) {
                        res.status(500).send({ code: "4", message: err });
                        return;
                    } else {
                        // create cart
                        const cart = new Cart({
                            userId: user._id,
                            products: [],
                            active: false,
                        });
                        cart.save((err, cart) => {
                            if (err) {
                                res.status(500).send({ code: "5", message: err });
                                return;
                            } else {
                                res.status(200).send({
                                    message: "Client was registered successfully.",
                                    userId: user._id,
                                });
                            }
                        });
                    }
                });
            });
        }
        else {
            res.status(200).send({message: "invalid zone_id"});
        }        
    });

    // var user = new User({
    //     businessname: businessname,
    //     ownername: ownername,
    //     phone: phone,
    //     email: email,
    // });

}

exports.clients = (req, res) => {
    const zone_id = req.body.zone_id
    Role.findOne({ name: "client" }, (err, role) => {
        if (zone_id.length===0) {
            User.find({ roles: [role] })
            .populate("zone", "-__v")
            .populate("roles", "-__v")
            .exec((err, user) => {
                if (err) { res.status(500).send({ message: err }); }
                res.status(200).json(user);
            });
        } else {
            Zone.findById(zone_id, function (err, zone) {
                if (err) { res.status(500).send({ message: err }); return; }
                if (zone) {
                    User.find({ roles: [role], zone: zone })
                    .populate("zone", "-__v")
                    .populate("roles", "-__v")
                    .exec((err, user) => {
                        if (err) { res.status(500).send({ message: err }); }
                        res.status(200).json(user);
                    });
                }
            });
        }
    });
};

exports.edit_client = (req, res) => {
    const user_id = req.body.user_id;
    const businessname = req.body.businessname;
    const ownername = req.body.ownername;
    const phone = req.body.phone;
    const zone_id = req.body.zone_id;
    const address = req.body.address;
    const pincode = req.body.pincode;
    
    if (user_id) {
        Zone.findById(zone_id, function(err,zone) {
            if (err) { res.status(500).send({ message: err }); return; }
            if (zone) {
                User.findById({_id: user_id}, function(err, user) {
                    user.businessname = businessname,
                    user.ownername = ownername,
                    user.phone = phone,
                    user.zone = zone,
                    user.address = address,
                    user.pincode = pincode,
                    user.save((err, user) => {
                        if (err) {
                            res.status(500).send({ code: "4", message: err });
                        }
                        res.status(200).send({
                            message: "Client data updated successfully.",
                        });
                    });
                });
            }
            else {
                res.status(200).send({message: "invalid zone_id"});
            }        
        });
    }
    else {res.status(500).send({ message: "Enter user_id" });}
}

exports.delete_client = (req, res) => {
    const user_id = req.body.user_id;
    
    if (user_id) {
        User.deleteOne({_id: user_id}, function(err) {
            if (err) {
                res.status(500).send({message: err });
            }
            res.status(200).send({
                message: "Client successfully deleted.",
            });
        });
    } else {res.status(500).send({ message: "Enter user_id" });}
}

exports.delete_all_clients = (req, res) => {
    User.deleteMany({}, function(err) {
        if (err) {
            res.status(500).send({message: err });
        }
        res.status(200).send({
            message: "Clients successfully deleted.",
        });
    });
}

