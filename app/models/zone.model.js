const mongoose = require("mongoose");

const Zone = mongoose.model(
  "zone",
  new mongoose.Schema({
    name: String,
    from: String,
    to: String,
    via: String,
    city: String,
  })
)

module.exports = Zone;
