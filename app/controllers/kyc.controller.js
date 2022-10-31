const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.user;
const KYC = db.kyc;
const Wallet = db.wallet;
const config = require("../config/s3.config.js");
const fs = require('fs');
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY
});
var async = require("async");

function rndstr(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
};

// user
exports.view = (req, res) => {
    User.findById(req.userId, function (err, user) {
        if (err) { res.status(500).send({ message: err }); return; }
        KYC.findById(user.kyc, function (err, kyc) {
            if (err) { res.status(500).send({ message: err }); return; }
            res.status(200).json(kyc)
        });
    });
};

// user
exports.create = (req, res) => {
    const pp_filepath = req.body.pp_filepath;
    const pan_filepath = req.body.pan_filepath;
    const adhr_filepath = req.body.adhr_filepath;
    const adhr_number = req.body.adhr_number;
    const pan_number = req.body.pan_number;
    if (pp_filepath && pan_filepath && pan_number && adhr_filepath && adhr_number) {
        const pp_fileContent = fs.readFileSync(pp_filepath);
        const pan_fileContent = fs.readFileSync(pan_filepath);
        const adhr_fileContent = fs.readFileSync(adhr_filepath);

        var pp_filename = "PP_".concat(rndstr(8));
        var pan_filename = "PAN_".concat(rndstr(8));
        var adhr_filename = "Adhr_".concat(rndstr(8));

        const pp_params = {
            Bucket: config.AWS_BUCKET_NAME,
            Key: `${pp_filename.concat(".", pp_filepath.split('.').pop())}`,
            Body: pp_fileContent,
            ACL: 'public-read'
        };

        const pan_params = {
            Bucket: config.AWS_BUCKET_NAME,
            Key: `${pan_filename.concat(".", pan_filepath.split('.').pop())}`,
            Body: pan_fileContent,
            ACL: 'public-read'
        };

        const adhr_params = {
            Bucket: config.AWS_BUCKET_NAME,
            Key: `${adhr_filename.concat(".", adhr_filepath.split('.').pop())}`,
            Body: adhr_fileContent,
            ACL: 'public-read'
        };

        s3.upload(pp_params, (err, pp_data) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }
            s3.upload(pan_params, (err, pan_data) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
                s3.upload(adhr_params, (err, adhr_data) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }
                    User.findById(req.userId, function (err, user) {
                        const kyc = new KYC({
                            name: user.username,
                            pic_url: pp_data.Location,
                            pan_number: pan_number,
                            pan_pic_url: pan_data.Location,
                            adhr_number: adhr_number,
                            adhr_pic_url: adhr_data.Location,
                            verified: false,
                        });

                        kyc.save((err, kyc) => {
                            if (err) {
                                res.status(500).send({ message: err });
                                return;
                            }
                            user.kyc = kyc
                            user.save((err, user) => {
                                if (err) {
                                    res.status(500).send({ message: err });
                                    return;
                                }
                                res.send({ message: "KYC added. Yet to be verified." });
                            })
                        });
                    });
                });
            });
        });
    } else {
        res.send({ message: "Please enter all reqd fields." });
    }
};

// admin
exports.all = (req, res) => {
    User.find({}).populate("roles", "-__v").then(async function(err, users) {
        if (err) { res.status(500).send({ message: err }); return; }
        try {
            var kycs = [];
            for (var user in users) {
                if (users[user].kyc) {
                    await KYC.findById(users[user].kyc, function (err, kyc) {
                        if (err) { res.status(500).send({ message: err }); return; }
                        else { kycs.push({ kyc: kyc, user: users[user] }); }
                        // else { kycs.push({ kyc: kyc, name: users[user].username, phone: users[user].phone }); }
                    }).clone();
                } else {
                    if (users[user].phone) {
                        await kycs.push({ kyc: "not available", user: users[user] });
                        // await kycs.push({ kyc: "not available", name: users[user].username, phone: users[user].phone });
                    }
                    else {
                        await kycs.push({ kyc: "not available", user: users[user] });
                        // await kycs.push({ kyc: "not available", name: users[user].username, phone: "0000000000" });
                    }
                }
            };
            res.status(200).send(kycs);
        } catch {
            res.status(200).send("sorry.. please try again..");
        }
    }).catch((err) => { res.status(500).send({ message: err }); return; });
};

// admin
exports.verify = (req, res) => {
    if (req.body.kyc_id) {
        KYC.findById(req.body.kyc_id, function (err, kyc) {
            if (err) { res.status(500).send({ message: err }); return; }
            kyc.verified = true;
            kyc.save((err) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
                User.findOne({ kyc: kyc }, function (err, user) {
                    if (err) { res.status(500).send({ message: err }); return; }
                    Wallet.findOne({ user: user }, function (err, wallet) {
                        if (err) { res.status(500).send({ message: err }); return; }
                        if (wallet) {
                            wallet.active = true;
                            // wallet.amount = 2000;
                            wallet.save((err) => { 
                                if (err) { res.status(500).send({ message: err }); return; }
                                res.send({ 
                                    message: "kyc verified.. wallet activated..", 
                                    wallet: wallet,
                                    kyc: kyc,
                                });
                            });
                        }
                        else {
                            const wallet = new Wallet({
                                amount: 2000,
                                user: user,
                                active: true,
                            });
                            wallet.save((err, wallet) => {
                                if (err) {
                                    res.status(500).send({ message: err });
                                    return;
                                }
                                res.send({ message: "kyc verified.. wallet created.. credit assigned..", wallet: wallet, kyc: kyc });
                            });
                        }
                    });
                });            
            });
        });
    } else {res.send({ message: "please provide kyc id" });}
};

// admin
exports.unverify = (req, res) => {
    if (req.body.kyc_id) {
        KYC.findById(req.body.kyc_id, function (err, kyc) {
            if (err) { res.status(500).send({ message: err }); return; }
            kyc.verified = false;
            kyc.save((err) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
                User.findOne({ kyc: kyc }, function (err, user) {
                    if (err) { res.status(500).send({ message: err }); return; }
                    Wallet.findOne({ user: user }, function (err, wallet) {
                        if (err) { res.status(500).send({ message: err }); return; }
                        if (wallet) {
                            wallet.active = false;
                            wallet.save((err) => { 
                                if (err) { res.status(500).send({ message: err }); return; }
                                res.send({ 
                                    message: "kyc unverified.. wallet deactivated..", 
                                    wallet: wallet,
                                    kyc: kyc,
                                });
                            });
                        }
                    });
                });            
            });
        });
    } else {res.send({ message: "please provide kyc id" });}
};

// admin
// req.body.status will be set to Verified or "custom reject message" by admin
exports.set_pp_status = (req, res) => {
    if (req.body.kyc_id && req.body.status) {
        KYC.findById(req.body.kyc_id, function (err, kyc) {
            if (err) { res.status(500).send({ message: err }); return; }
            kyc.pic_status = req.body.status;
            kyc.save((err) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
            });
            res.send({ message: "Status set" })
        });
    } else {res.send({ message: "please provide kyc_id and status" });}
};

// admin
exports.set_pan_status = (req, res) => {
    if (req.body.kyc_id && req.body.status) {
        KYC.findById(req.body.kyc_id, function (err, kyc) {
            if (err) { res.status(500).send({ message: err }); return; }
            kyc.pan_status = req.body.status;
            kyc.save((err) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
            });
            res.send({ message: "Status set" })
        });
    } else {res.send({ message: "please provide kyc_id and status" });}
};

// admin
exports.set_adhr_status = (req, res) => {
    if (req.body.kyc_id && req.body.status) {
        KYC.findById(req.body.kyc_id, function (err, kyc) {
            if (err) { res.status(500).send({ message: err }); return; }
            kyc.adhr_status = req.body.status;
            kyc.save((err) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
            });
            res.send({ message: "Status set" })
        });
    } else {res.send({ message: "please provide kyc_id and status" });}
};

// user
exports.edit_pp = (req, res) => {
    const pp_filepath = req.body.pp_filepath;
    if (pp_filepath && req.body.kyc_id) {
        KYC.findById(req.body.kyc_id, function (err, kyc) {
            if (err) { res.status(500).send({ message: err }); return; }
            const pp_fileContent = fs.readFileSync(pp_filepath);
            var pp_filename = "PP_".concat(rndstr(8));
            const pp_params = {
                Bucket: config.AWS_BUCKET_NAME,
                Key: `${pp_filename.concat(".", pp_filepath.split('.').pop())}`,
                Body: pp_fileContent,
                ACL: 'public-read'
            };
            s3.upload(pp_params, (err, pp_data) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
                kyc.pic_url = pp_data.Location
                kyc.pic_status = "Yet to be verified."
                kyc.save((err, kyc) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }
                    res.send({ message: "KYC updated. Yet to be verified." });
                });
            });
        });
    } else {
        res.send({ message: "Please enter all reqd fields." });
    }
};

// user
exports.edit_pan_pic = (req, res) => {
    const pan_filepath = req.body.pan_filepath;
    if (pan_filepath && req.body.kyc_id) {
        KYC.findById(req.body.kyc_id, function (err, kyc) {
            if (err) { res.status(500).send({ message: err }); return; }
            const pan_fileContent = fs.readFileSync(pan_filepath);
            var pan_filename = "PAN_".concat(rndstr(8));
            const pan_params = {
                Bucket: config.AWS_BUCKET_NAME,
                Key: `${pan_filename.concat(".", pan_filepath.split('.').pop())}`,
                Body: pan_fileContent,
                ACL: 'public-read'
            };
            s3.upload(pan_params, (err, pan_data) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
                kyc.pan_pic_url = pan_data.Location
                kyc.pan_status = "Yet to be verified."
                kyc.save((err, kyc) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }
                    res.send({ message: "KYC updated. Yet to be verified." });
                });
            });
        })
    } else {
        res.send({ message: "Please enter all reqd fields." });
    }
};

// user
exports.edit_pan_number = (req, res) => {
    const pan_number = req.body.pan_number;
    if (pan_number && req.body.kyc_id) {
        KYC.findById(req.body.kyc_id, function (err, kyc) {
            if (err) { res.status(500).send({ message: err }); return; }
            kyc.pan_number = pan_number
            kyc.pan_status = "Yet to be verified."
            kyc.save((err, kyc) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
                res.send({ message: "KYC updated. Yet to be verified." });
            });
        });
    } else {
        res.send({ message: "Please enter all reqd fields." });
    }
};

// user
exports.edit_adhr = (req, res) => {
    const adhr_filepath = req.body.adhr_filepath;
    if (adhr_filepath && req.body.kyc_id) {
        KYC.findById(req.body.kyc_id, function (err, kyc) {
            if (err) { res.status(500).send({ message: err }); return; }
            const adhr_fileContent = fs.readFileSync(adhr_filepath);
            var adhr_filename = "Adhr_".concat(rndstr(8));
            const adhr_params = {
                Bucket: config.AWS_BUCKET_NAME,
                Key: `${adhr_filename.concat(".", adhr_filepath.split('.').pop())}`,
                Body: adhr_fileContent,
                ACL: 'public-read'
            };
            s3.upload(adhr_params, (err, adhr_data) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
                kyc.adhr_pic_url = adhr_data.Location
                kyc.adhr_status = "Yet to be verified."
                kyc.save((err, kyc) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }
                    res.send({ message: "KYC updated. Yet to be verified." });
                });
            });
        });
    } else {
        res.send({ message: "Please enter all reqd fields." });
    }
};

// user
exports.edit_adhr_number = (req, res) => {
    const adhr_number = req.body.adhr_number
    if (adhr_number && req.body.kyc_id) {
        KYC.findById(req.body.kyc_id, function (err, kyc) {
            if (err) { res.status(500).send({ message: err }); return; }
            kyc.adhr_number = adhr_number
            kyc.adhr_status = "Yet to be verified."
            kyc.save((err, kyc) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
                res.send({ message: "KYC updated. Yet to be verified." });
            });
        });
    } else {
        res.send({ message: "Please enter all reqd fields." });
    }
};

