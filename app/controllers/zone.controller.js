const config = require("../config/auth.config");
const db = require("../models");
const Zone = db.zone;
const fs = require('fs');

exports.create_from_json = (req, res) => {
    const filename = req.body.filename;
    var zones = [];
    fs.readFile(filename, async function(err,data) {
        const zone_dict = JSON.parse(data);
        for (let dir of zone_dict) {
            // console.log(dir);
            var locs = await Zone.find({zone: dir.zone, from: dir.from, to: dir.to, via: dir.via, city: dir.city})
            if (locs.length>0) {console.log(locs);}
            else {
                zones.push({
                    insertOne: {
                        "document": {
                            name: dir.name,
                            from: dir.from,
                            to: dir.to,
                            via: dir.via,
                            city: dir.city,
                        }
                    }
                });
            }
        }
        Zone.bulkWrite(zones);
        res.status(200).send({message: "zones updated."});
        // res.status(200).json(products);
    });
};

exports.cities = (req, res) => {
    Zone.find({})
    .exec((err, zones) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        const cities = [...new Set(zones.map( item => {return item.city} ))]
        res.status(200).send({
            cities: cities
        });
    })
}

exports.by_city = (req, res) => {
    Zone.find({ city: req.body.city })
    .exec((err, zones) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        res.status(200).send({
            locs: zones
        });
    })
}

exports.del_all = (req, res) => {
    Zone.find({}, function (err, zones) {
        if (err) { res.status(500).send({ message: err }); }
        for (var zone in zones) {
            zones[zone].delete();
        }
        res.status(200).send({ message: "deleted all zones." });
    });
};