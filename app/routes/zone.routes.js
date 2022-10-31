const { authJwt } = require("../middlewares");
const controller = require("../controllers/zone.controller");
const { verifySignUp } = require("../middlewares");

module.exports = function(app) {
    app.use(function(req, res, next) {
      res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
      );
      next();
    });
  
    app.get("/zone/cities", [authJwt.verifyToken, authJwt.isAdmin], controller.cities);

    app.post("/zone/by_city", [authJwt.verifyToken, authJwt.isAdmin], controller.by_city);

    app.get("/zone/create_from_json", [authJwt.verifyToken, authJwt.isAdmin], controller.create_from_json);

    app.get("/zone/del_all", [authJwt.verifyToken, authJwt.isAdmin], controller.del_all);

}