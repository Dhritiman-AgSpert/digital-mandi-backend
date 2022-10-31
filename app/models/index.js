const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.role = require("./role.model");
db.product = require("./product.model");
db.cart = require("./cart.model");
db.kyc = require("./kyc.model");
db.wallet = require("./wallet.model");
db.order = require("./order.model");
db.otp = require("./otp.model");
db.zone = require("./zone.model");
db.mandi = require("./mandi.model");

db.ROLES = ["client", "admin"];

module.exports = db;