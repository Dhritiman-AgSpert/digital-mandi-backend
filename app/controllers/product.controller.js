const db = require("../models");
const Product = db.product;
const Cart = db.cart;
var async = require("async");
const fs = require('fs');
const AWS = require('aws-sdk');

// s3
const ID = 'AKIAZUEXU2VTDO2GBSQN';
const SECRET = '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';
const BUCKET_NAME = 'zomandi-backend-storage';
const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});

exports.create = (req, res) => {
    const name = req.body.name;
    const pic_filename = req.body.pic_filename;
    const min_qty = req.body.min_qty;
    const unit = req.body.unit;
    const price = req.body.price;
    const type = req.body.type;;
    const in_stock = req.body.in_stock;
    if (name && pic_filename && min_qty && unit && price && type && in_stock) {
        const destFileName = name + "." + pic_filename.split('.').pop();
        // const fileContent = fs.readFileSync(pic_filename);
        // const params = {
        //     Bucket: BUCKET_NAME,
        //     Key: destFileName, // File name you want to save as in S3
        //     Body: fileContent
        // };
        // // Uploading files to the bucket
        // s3.upload(params, function(err, data) {
        //     if (err) {res.status(500).send({ message: err });}
        //     // creating the product
            const product = new Product({
                name: name,
                pic_url: "", // data.Location,
                min_qty: min_qty,
                unit: unit,
                price: price,
                type: type,
                in_stock: in_stock,
            });
            product.save((err, product) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
                res.send({ message: "Product added." });
            });  
        // });  
    } else {
        res.send({ message: "Enter all fields." });
    }
};

exports.all = (req, res) => {
    Product.find({}, function(err, products) {
        if (err) { res.status(500).send({ message: err }); }
        res.json(products);
    })
};

exports.categories = (req, res) => {
    Product.find({}, function(err, products) {
        if (err) { res.status(500).send({ message: err }); }
        var types = [];
        products.forEach((product) => {
            if (types.includes(product.type)) {}
            else { types.push(product.type); }
        });
        res.status(200).send({categories: types});
    })
};

exports.categorised = (req, res) => {
    if (req.body.category.length===0) {
        Product.find({}, function(err, products) {
            if (err) { res.status(500).send({ message: err }); }
            res.status(200).json(products);
        });
    } else {
        Product.find({type: req.body.category}, function(err, products) {
            if (err) { res.status(500).send({ message: err }); }
            res.status(200).json(products);
        });
    }
};

exports.units = (req, res) => {
    res.status(200).json({units: ["Kg(s)", "Bunch(s)", "Bag(s)"]});
};

exports.one = (req, res) => {
    Product.find({name: req.body.name}, function(err, product) {
        if (err) { res.status(500).send({ message: err }); }
        res.json(product);
    })
};

exports.edit = (req, res) => {
    if (req.body.id) {
        const product_id = req.body.id
        Product.findById(product_id, function (err, product) {
            if (err) { res.status(500).send({ message: err }); }
            else {
                if (req.body.min_qty)  {product.min_qty  = req.body.min_qty;}
                if (req.body.price)    {product.price    = req.body.price;}
                if (req.body.unit)     {product.unit     = req.body.unit;}
                product.save((err) => {
                    if (err) { res.status(500).send({ message: err }); }
                    Cart.find({}, function (err, carts) {
                        if (err) { res.status(500).send({ message: err }); }
                        else {
                            carts.forEach(cart => {
                                async.eachSeries(cart.products, function (item, asyncdone) {
                                    let itemIndex = cart.products.findIndex(p => p.productId == product_id);
                                    if (itemIndex > -1) {
                                        cart.products[itemIndex].price = product.price;
                                        cart.save(asyncdone);
                                    }
                                });
                            });
                        }
                    });
                    res.json(product);
                });
                // update carts
            }
        }
    )} else {
        res.status(500).send({ message: "enter id" });
    }
    // Product.find({name: req.body.name}, function(err, product) {
    //     if (err) { res.status(500).send({ message: err }); }
    //     res.json(product);
    // })
};

exports.toggle_in_stock = (req, res) => {
    if (req.body.product_id) {
        const product_id = req.body.product_id
        Product.findById(product_id, function (err, product) {
            if (err) { res.status(500).send({ message: err }); }
            else {
                if (product.in_stock==="true") {
                    product.in_stock = "false";
                    product.save();
                    res.json({message: "toggled"});
                } else {
                    product.in_stock = "true";
                    product.save();
                    res.json({message: "toggled"});
                }
            }
        });
    } else {
        res.status(500).send({ message: "enter id" });
    }
};

exports.create_from_json = (req, res) => {
    const filename = req.body.filename;
    var products = [];
    fs.readFile(filename, async function(err,data) {
        const product_dict = JSON.parse(data);
        for (let dir of product_dict.children) {
            if (dir.type==='folder') {
                for (let file of dir.children) {
                    if (file.type==='file') {
                        var name = file.name.split('.').slice(0, -1).join('.').charAt(0).toUpperCase() + file.name.split('.').slice(0, -1).join('.').slice(1);
                        // var name = file.name.split('.').slice(0, -1).join('.');
                        var prods = await Product.find({name: name})
                        if (prods.length>0) {console.log(prods);}
                        else {
                            var pic_url = "https://zomandi-backend-storage.s3.ap-south-1.amazonaws.com/products/" + file.name;
                            var type = dir.name.charAt(0).toUpperCase() + dir.name.slice(1);
                            products.push({
                                insertOne: {
                                    "document": {
                                        name: name,
                                        pic_url: pic_url,
                                        min_qty: 1,
                                        unit: "Kg(s)",
                                        price: 60,
                                        type: type,
                                        in_stock: false,
                                    }
                                }
                            });
                        }
                    }
                }
            }
        }
        Product.bulkWrite(products);
        res.status(200).send({message: "Products updated."});
        // res.status(200).json(products);
    });
};

exports.del_one = (req, res) => {
    if (req.body.name){
        Product.findOne({name: req.body.name}, function(err, product) {
            if (err) { res.status(500).send({ message: err }); }
            try {
                product.delete();
                res.status(200).send({message: "Deleted one product."});
            } catch {
                res.status(403).send({message: "Couldn't delete."});
            }
        })
    } else {
        res.status(403).send({message: "Please enter name."});
    }
};

exports.del_all = (req, res) => {
    Product.deleteMany({}, function(err) {
        if (err) { res.status(500).send({ message: err }); }
        res.status(200).send({message: "Deleted all products."});
    })
};

