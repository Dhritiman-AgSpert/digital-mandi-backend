const { authJwt } = require("../middlewares");
const controller = require("../controllers/razor.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/payment/all", [authJwt.verifyToken, authJwt.isAdmin], controller.all);

//   app.get("/api/payment/all", [authJwt.verifyToken], controller.all);

//   app.get("/api/payment/one", [authJwt.verifyToken, authJwt.isAdmin], controller.one);

//   app.put("/api/payment/edit", [authJwt.verifyToken, authJwt.isAdmin], controller.edit);

//   app.post("/api/payment/create_from_json", [authJwt.verifyToken, authJwt.isAdmin], controller.create_from_json);

};
