const db = require("../models");
const ROLES = db.ROLES;
const User = db.user;

checkDuplicateUsernameOrEmail = (req, res, next) => {
    // Username
    if (req.body.username && req.body.email) {
        User.findOne({
            username: req.body.username
        }).exec((err, user) => {
            if (err) {
                res.status(400).send({ message: err });
                return;
            } else if (user) {
                if (user.id===req.userId) { next(); } else {
                    res.status(400).send({ message: "Failed! Username is already in use!" });
                    return;
                }
            } else {
                User.findOne({
                    email: req.body.email
                }).exec((err, user) => {
                    if (err) {
                        res.status(400).send({ message: err });
                        return;
                    } else if (user) {
                        if (user.id===req.userId) { next(); } else {
                            res.status(400).send({ message: "Failed! Email is already in use!" });
                            return;
                        }
                    } else { next(); }
                });
            }
        });
    } else {
        res.status(400).send({ message: "empty email and username" });
        return;
    }
};

checkDuplicateEmail = (req, res, next) => {
    if (req.body.email) {
        User.findOne({
            email: req.body.email
        }).exec((err, user) => {
            if (err) {
                res.status(400).send({ message: err });
                return;
            } else if (user) {
                res.status(400).send({ message: "Failed! Email is already in use!" });
                return;
            } else { next(); }
        });
    } else {
        res.status(400).send({ message: "empty email" });
        return;
    }
};

checkDuplicatePhone = (req, res, next) => {
    // Phone
    if (req.body.phone) {
        User.findOne({
            phone: req.body.phone
        }).exec((err, user) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }

            if (user) {
                res.status(400).send({ message: "Failed! Phone number is already in use!" });
                return;
            }
            next();
        });
    } else { next(); }
};

checkRolesExisted = (req, res, next) => {
    if (req.body.roles) {
        for (let i = 0; i < req.body.roles.length; i++) {
            if (!ROLES.includes(req.body.roles[i])) {
                res.status(400).send({
                    message: `Failed! Role ${req.body.roles[i]} does not exist!`
                });
                return;
            }
        }
    }

    next();
};

const verifySignUp = {
    checkDuplicateUsernameOrEmail,
    checkDuplicateEmail,
    checkRolesExisted,
    checkDuplicatePhone,
};

module.exports = verifySignUp;
