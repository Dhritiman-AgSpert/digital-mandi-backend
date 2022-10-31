const express = require("express");
const cors = require("cors");
const dbConfig = require("./app/config/db.config");

const app = express();

var corsOptions = {
    origin: '*'
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
const Role = db.role;
const User = db.user;
const Mandi = db.mandi;


const username = "alok-zomandi";
const password = "UXUdufo57chBmh8m";
const cluster = "cluster0.arqnl";
const dbname = "zomandi";


// `mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`
db.mongoose
    .connect(`mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Successfully connected to MongoDB.");
        initial();
    })
    .catch(err => {
        console.error("Connection error", err);
        process.exit();
    });

// simple route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to Zomandi Backend." });
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/product.routes")(app);
require("./app/routes/cart.routes")(app);
require("./app/routes/kyc.routes")(app);
require("./app/routes/wallet.routes")(app);
require("./app/routes/checkout.routes")(app);
require("./app/routes/payment.routes")(app);
require("./app/routes/zone.routes")(app);
require("./app/routes/mandi.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

function initial() {
    Role.count({ name: "client" }, (err, count) => {
        if (!err && (count===0)) {
            new Role({
                name: "client"
            }).save(err => {
                if (err) {
                    console.log("error", err);
                }

                console.log("added 'client' to roles collection");
            });
        }
    });

    Role.count({ name: "admin" }, (err, count) => {
        if (!err && (count===0)) {
            new Role({
                name: "admin"
            }).save(err => {
                if (err) {
                    console.log("error", err);
                }

                console.log("added 'admin' to roles collection");
            });
        } 
    }); 

    Mandi.count({ name: "Zo" }, (err, count) => {
        if (!err && (count===0)) {
            new Mandi({
                name: "Zo",
                status: false,
            }).save(err => {
                if (err) {
                    console.log("error", err);
                }

                console.log("added 'Zo' to Mandis");
            });
        } 
    }); 

    // Role.count({ name: "delivery" }, (err, count) => {
    //     if (!err && (count===0)) {
    //         new Role({
    //             name: "delivery"
    //         }).save(err => {
    //             if (err) {
    //                 console.log("error", err);
    //             }

    //             console.log("added 'delivery' to roles collection");
    //         });
    //     } 
    // });           

    // Role.count({ name: "fulfillment" }, (err, count) => {
    //     if (!err && (count===0)) {
    //         new Role({
    //             name: "fulfillment"
    //         }).save(err => {
    //             if (err) {
    //                 console.log("error", err);
    //             }

    //             console.log("added 'fulfillment' to roles collection");
    //         });
    //     } 
    // });           
    
    // User.collection.dropIndexes(function (err, results) {
    //     if (err) { console.log(err); }
    //     else {console.log("indices dropped")}
    // });
}